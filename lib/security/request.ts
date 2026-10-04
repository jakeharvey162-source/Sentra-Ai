import { extractUrls, MAX_URLS } from "./urls";
export class RequestError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export async function readInvestigationInput(request: Request): Promise<{ input: string; saveCase: boolean }> {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) throw new RequestError("Cross-origin requests are not allowed.", 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new RequestError("Use application/json.", 415);
  if (!request.body) throw new RequestError("Input is required.", 400);
  const reader = request.body.getReader();
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 100000) throw new RequestError("Request body is too large.", 413);
      chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => undefined); }
  let body;
  try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new RequestError("Invalid JSON.", 400); }
  const input = typeof body?.input === "string" ? body.input.trim() : "";
  if (!input) throw new RequestError("Input is required.", 400);
  if (input.length > 20000) throw new RequestError("Input is too large.", 413);
  if (extractUrls(input).length > MAX_URLS) throw new RequestError(`Use at most ${MAX_URLS} distinct URLs.`, 413);
  return { input, saveCase: body.saveCase === true };
}
// Per-instance backstop; distributed deployment also requires platform rate limits.
const buckets = new Map<string, { count: number; reset: number }>();
export function allowInvestigation(key: string, now = Date.now()): boolean {
  for (const [id, bucket] of buckets) if (bucket.reset <= now) buckets.delete(id);
  const bucket = buckets.get(key);
  if (bucket) return ++bucket.count <= 30;
  if (buckets.size >= 10000) return false;
  buckets.set(key, { count: 1, reset: now + 60000 });
  return true;
}
