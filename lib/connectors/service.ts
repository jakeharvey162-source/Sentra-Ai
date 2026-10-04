import { allowInvestigation, RequestError } from "../security/request";
import { investigateText } from "../security/orchestrator";
import { configured, getAccount, linkAccount, readMessages, composio } from "./composio";
import { isProvider } from "./providers";
export async function connectionAction(body: unknown, userId: string) {
  if (!userId) throw new RequestError("Sign in to manage connections.", 401);
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new RequestError("Invalid connection request.", 400);
  const b = body as Record<string, unknown>;
  if (!["link", "scan", "disconnect"].includes(String(b.action))) throw new RequestError("Unknown connection action.", 400);
  if (!configured()) throw new RequestError("Connections are awaiting administrator setup.", 503);
  if (!allowInvestigation(`connections:${userId}`)) throw new RequestError("Too many connection requests. Retry in one minute.", 429);
  if (b.action === "link") {
    if (!isProvider(b.provider) || b.consent !== true) throw new RequestError("Choose a platform and accept connection consent.", 400);
    return linkAccount(userId, b.provider);
  }
  if (typeof b.accountId !== "string") throw new RequestError("Choose a connected account.", 400);
  if (b.action === "scan" && b.consent !== true) throw new RequestError("Accept message scanning consent first.", 400);
  const account = await getAccount(b.accountId, userId, b.action === "scan");
  if (b.action === "disconnect") {
    await composio(`/connected_accounts/${encodeURIComponent(account.id)}/revoke`, "POST", {});
    return { disconnected: true };
  }
  const messages = await readMessages(account, typeof b.channel === "string" ? b.channel : undefined);
  const findings = [];
  for (const message of messages) {
    const result = await investigateText(message.text);
    const incomplete = message.truncated || !message.text.trim();
    findings.push({ id: message.id, title: message.title, sender: message.sender,
      decision: incomplete && result.investigation.decision === "SAFE" ? "HOLD" : result.investigation.decision,
      score: result.investigation.score, explanation: result.investigation.explanation,
      incomplete, evidence: result.investigation.evidence.map(e => ({ title: e.title, detail: e.detail, severity: e.severity })) });
  }
  // Do not persist message contents, log them, send them to an LLM, or return full bodies.
  return { findings, checkedAt: new Date().toISOString(), scanned: messages.length,
    coverage: "Latest 10 messages only. Attachments, images and older messages are not scanned. SAFE means no signal detected in the inspected text; it is not a guarantee." };
}
