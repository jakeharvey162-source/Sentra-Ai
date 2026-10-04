import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import { providers, isProvider, type Provider } from "./providers";
import { RequestError } from "../security/request";
import { extractUrls, MAX_URLS } from "../security/urls";

const API = "https://backend.composio.dev/api/v3.1";
export type Account = { id: string; provider: Provider; status: string };
export type Message = { id: string; title: string; sender: string; text: string; truncated: boolean };
type Json = Record<string, any>;
export function configured(provider?: Provider) {
  return Boolean(process.env.COMPOSIO_API_KEY && process.env.COMPOSIO_CALLBACK_VERIFICATION_ENABLED === "true" && process.env.COMPOSIO_READ_ONLY_SCOPES_VERIFIED === "true" &&
    process.env.SENTRA_APP_ORIGIN && (!provider || process.env[providers.find(p => p.id === provider)!.env]));
}
export function appOrigin() {
  const url = new URL(process.env.SENTRA_APP_ORIGIN || "https://sentra-ai-7lij.vercel.app");
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new RequestError("Invalid connector configuration.", 503);
  return url.origin;
}
export async function composio(path: string, method = "GET", body?: Json, signal?: AbortSignal): Promise<Json> {
  if (!process.env.COMPOSIO_API_KEY) throw new RequestError("Connections are awaiting administrator setup.", 503);
  const response = await fetch(API + path, { method, headers: { "x-api-key": process.env.COMPOSIO_API_KEY, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}), cache: "no-store", redirect: "error", signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(12000)]) : AbortSignal.timeout(12000) });
  if (!response.ok) { await response.body?.cancel(); throw new RequestError("Connection service unavailable. Retry or reconnect your account.", 502); }
  // Bound even chunked upstream responses, including credentials and oversized email bodies.
  const reader = response.body?.getReader();
  if (!reader) throw new RequestError("Empty connection response.", 502);
  const chunks: Uint8Array[] = []; let size = 0;
  try { for (;;) { const { done, value } = await reader.read(); if (done) break; size += value.length;
    if (size > 2_000_000) throw new RequestError("Connection response exceeds the safe size limit.", 502); chunks.push(value); }
  } finally { await reader.cancel().catch(() => undefined); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new RequestError("Invalid connection response.", 502); }
}
export function accountForUser(raw: Json, userId: string): Account {
  const provider = raw.toolkit?.slug;
  if (raw.user_id !== userId || !isProvider(provider) || raw.experimental?.account_type === "SHARED" ||
      raw.auth_config?.id !== process.env[providers.find(p => p.id === provider)!.env] || !validId(raw.id)) {
    throw new RequestError("Connection not found.", 404);
  }
  return { id: raw.id, provider, status: raw.status };
}
export function validId(id: unknown): id is string { return typeof id === "string" && /^[A-Za-z0-9_-]{1,160}$/.test(id); }
export async function getAccount(id: string, userId: string, active = true) {
  if (!validId(id)) throw new RequestError("Invalid connection.", 400);
  const raw = await composio(`/connected_accounts/${encodeURIComponent(id)}`);
  const account = accountForUser(raw, userId);
  if (active && (account.status !== "ACTIVE" || raw.is_disabled)) throw new RequestError("Reconnect this account before scanning.", 409);
  return account;
}
export async function listAccounts(userId: string) {
  const data = await composio(`/connected_accounts?user_ids=${encodeURIComponent(userId)}&limit=100`);
  return (Array.isArray(data.items) ? data.items : []).flatMap((raw: Json) => {
    try { const account = accountForUser(raw, userId); return account.status === "REVOKED" ? [] : [account]; } catch { return []; }
  });
}
export async function linkAccount(userId: string, provider: Provider) {
  if (!configured(provider)) throw new RequestError("This connection is awaiting administrator setup.", 503);
  const authConfig = process.env[providers.find(p => p.id === provider)!.env]!;
  if (!validId(authConfig)) throw new RequestError("Invalid connector configuration.", 503);
  const config = await composio(`/auth_configs/${encodeURIComponent(authConfig)}`);
  if (config.toolkit?.slug !== provider || config.status !== "ENABLED" || config.auth_scheme !== "OAUTH2") throw new RequestError("Authentication configuration does not match this platform.", 503);
  const data = await composio("/connected_accounts/link", "POST", { user_id: userId, auth_config_id: authConfig, callback_url: `${appOrigin()}/api/connections/callback` });
  let redirect: URL;
  try { redirect = new URL(data.redirect_url); } catch { throw new RequestError("Invalid authorization link.", 502); }
  if (redirect.protocol !== "https:" || redirect.hostname !== "connect.composio.dev" || redirect.port || redirect.username || redirect.password || !validId(data.connected_account_id)) throw new RequestError("Invalid authorization link.", 502);
  return { redirectUrl: redirect.href, pending: signPending({ userId, provider, accountId: data.connected_account_id, expires: Date.now() + 600000, nonce: randomUUID() }) };
}
type Pending = { userId: string; provider: Provider; accountId: string; expires: number; nonce: string };
function signature(payload: string) { return createHmac("sha256", process.env.COMPOSIO_API_KEY || "").update("sentra-oauth-v1:" + payload).digest("base64url"); }
export function signPending(data: Pending) { const payload = Buffer.from(JSON.stringify(data)).toString("base64url"); return payload + "." + signature(payload); }
export function verifyPending(cookie: string | undefined, userId: string): Pending {
  if (!process.env.COMPOSIO_API_KEY || !cookie || cookie.length > 2000) throw new RequestError("Restart the connection from Sentra.", 400);
  const [payload, sig, extra] = cookie.split("."); const expected = signature(payload);
  if (extra || !sig || sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) throw new RequestError("Invalid connection session.", 400);
  let data: Pending; try { data = JSON.parse(Buffer.from(payload, "base64url").toString()); } catch { throw new RequestError("Invalid connection session.", 400); }
  if (data.userId !== userId || !isProvider(data.provider) || !validId(data.accountId) || !Number.isFinite(data.expires) || data.expires <= Date.now() || data.expires > Date.now() + 600000) throw new RequestError("Connection session expired or belongs to another user.", 400);
  return data;
}
export async function completeConnection(cookie: string | undefined, userId: string, uri: string | null) {
  const pending = verifyPending(cookie, userId);
  if (!uri || uri.length > 2048) throw new RequestError("Missing connection verification.", 400);
  // session_uri is opaque: never follow it or treat query parameters as identity.
  const result = await composio("/connected_accounts/complete_auth", "POST", { session_uri: uri, user_id: userId });
  if (result.connected_account_id !== pending.accountId || result.toolkit_slug !== pending.provider) throw new RequestError("Connection verification failed.", 403);
  await getAccount(pending.accountId, userId);
}
async function proxy(accountId: string, endpoint: string, signal?: AbortSignal) {
  const response = await composio("/tools/execute/proxy", "POST", { connected_account_id: accountId, endpoint, method: "GET" }, signal);
  if (response.status !== 200 || !response.data || response.data.error || response.data.ok === false) throw new RequestError("Platform could not read messages. Check the granted read permissions.", 502);
  return response.data as Json;
}
function text(value: unknown, limit = 20000) { return typeof value === "string" ? value.slice(0, limit) : ""; }
export function htmlToText(value: string) {
  // Plain-text evidence only; retain destinations hidden behind HTML link labels.
  return value.replace(/<[^>]*>/g, tag => " " + Array.from(tag.matchAll(/\b(?:href|src)\s*=\s*(?:["']([^"']+)["']|([^\s>]+))/gi), m => m[1] || m[2]).join(" ") + " ")
    .replace(/&#(?:x([0-9a-f]+)|([0-9]+));/gi, (_, hex, dec) => { const n = parseInt(hex || dec, hex ? 16 : 10); return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : " "; })
    .replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&nbsp;/gi, " ");
}
export function gmailMessage(raw: Json): Message {
  const headers = Array.isArray(raw.payload?.headers) ? raw.payload.headers : [];
  const header = (name: string) => text(headers.find((h: Json) => h.name?.toLowerCase() === name)?.value, 300);
  let body = ""; let nodes = 0; let clipped = false;
  function walk(part: Json, depth = 0) {
    if (++nodes > 100 || depth > 10 || body.length >= 20000) { clipped = true; return; }
    if ((part.mimeType === "text/plain" || part.mimeType === "text/html") && typeof part.body?.data === "string" && !part.filename) {
      const encoded = part.body.data; if (encoded.length > 32000) clipped = true;
      const decoded = Buffer.from(encoded.slice(0, 32000), "base64url").toString("utf8");
      body += "\n" + (part.mimeType === "text/html" ? htmlToText(decoded) : decoded);
    }
    if (Array.isArray(part.parts)) part.parts.slice(0, 100).forEach(p => walk(p, depth + 1));
  }
  if (raw.payload) walk(raw.payload);
  return message(raw.id, header("subject") || "Untitled email", header("from"), body || text(raw.snippet), clipped || !body.trim());
}
function message(id: unknown, title: string, sender: string, body: string, clipped = false): Message {
  const combined = `${title}\n${sender}\n${body}`;
  return { id: text(id, 200), title, sender, text: combined.slice(0, 20000), truncated: clipped || combined.length > 20000 || extractUrls(combined).length > MAX_URLS };
}
export async function readMessages(account: Account, channel?: string, signal = AbortSignal.timeout(30000)): Promise<Message[]> {
  if (account.provider === "gmail") {
    const list = await proxy(account.id, "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&labelIds=INBOX", signal);
    const items = (Array.isArray(list.messages) ? list.messages : []).slice(0, 10);
    const results: Message[] = [];
    for (const item of items) {
      if (!validId(item.id)) throw new RequestError("Invalid platform message identifier.", 502);
      results.push(gmailMessage(await proxy(account.id, `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(item.id)}?format=full`, signal)));
    }
    return results;
  }
  if (account.provider === "outlook") {
    const data = await proxy(account.id, "https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=10&$orderby=receivedDateTime%20desc&$select=id,subject,from,body,bodyPreview", signal);
    return (Array.isArray(data.value) ? data.value : []).slice(0, 10).map((m: Json) => message(m.id, text(m.subject, 300), text(m.from?.emailAddress?.address, 300), m.body?.contentType?.toLowerCase() === "html" ? htmlToText(text(m.body.content, 40000)) : text(m.body?.content || m.bodyPreview, 40000), typeof m.body?.content !== "string" || m.body.content.length > 40000));
  }
  if (!channel || !/^[CGD][A-Z0-9]{8,30}$/.test(channel)) throw new RequestError("Enter a valid Slack channel ID (for example C0123456789).", 400);
  const data = await proxy(account.id, `https://slack.com/api/conversations.history?channel=${encodeURIComponent(channel)}&limit=10`, signal);
  return (Array.isArray(data.messages) ? data.messages : []).slice(0, 10).map((m: Json) => message(m.ts, "Slack message", text(m.user, 100), text(m.text, 40000), typeof m.text !== "string" || m.text.length > 40000));
}
