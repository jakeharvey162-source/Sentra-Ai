import { createHmac } from "node:crypto";
import { allowInvestigation, RequestError } from "../security/request";
export async function enforceRateLimit(scope: "investigate" | "connect", identity: string) {
  const secret = process.env.SENTRA_SERVER_SECRET;
  if (!secret) {
    if (process.env.VERCEL) throw new RequestError("Protection service is not configured. Please try again later.", 503);
    if (!allowInvestigation(`${scope}:${identity}`)) throw new RequestError("Too many requests. Retry in one minute.", 429);
    return;
  }
  try {
    if (!/^[a-f0-9]{64}$/.test(secret)) throw new Error("Invalid configuration");
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "");
    if (url.protocol !== "https:" || !/^[a-z0-9]+\.supabase\.co$/.test(url.hostname) || url.port || url.username || url.password || url.pathname !== "/") throw new Error("Invalid configuration");
    const key = createHmac("sha256", secret).update(`${scope}:${identity}`).digest("hex");
    const response = await fetch(`${url.origin}/rest/v1/rpc/sentra_rate_limit`, { method: "POST", cache: "no-store", redirect: "error",
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "", "Content-Type": "application/json" },
      body: JSON.stringify({ p_key: key, p_scope: scope, p_secret: secret }), signal: AbortSignal.timeout(3000) });
    if (!response.ok) { await response.body?.cancel(); throw new Error("Unavailable"); }
    const result = await response.json();
    if (typeof result?.allowed !== "boolean" || !Number.isInteger(result.retryAfter) || result.retryAfter < 1 || result.retryAfter > 86400) throw new Error("Invalid response");
    if (!result.allowed) throw new RequestError("Too many requests. Retry in one minute.", 429);
  } catch (error) {
    if (error instanceof RequestError) throw error;
    throw new RequestError("Protection service unavailable. Please try again later.", 503);
  }
}
