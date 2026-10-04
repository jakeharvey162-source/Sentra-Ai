import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assertSameOrigin, readBoundedJson, RequestError } from "@/lib/security/request";
import { configured, listAccounts } from "@/lib/connectors/composio";
import { providers } from "@/lib/connectors/providers";
import { connectionAction } from "@/lib/connectors/service";
export const runtime = "nodejs";
export const maxDuration = 60;
const headers = { "Cache-Control": "no-store" };
async function userId() {
  try {
    const { data, error } = await (await createClient()).auth.getUser();
    if (!error && data.user && !data.user.is_anonymous) return data.user.id;
  } catch {}
  throw new RequestError("Sign in to manage connections.", 401);
}
function failure(error: unknown) {
  const status = error instanceof RequestError ? error.status : 502;
  return NextResponse.json({ error: error instanceof RequestError ? error.message : "Connection service unavailable. Try again." },
    { status, headers: { ...headers, ...(status === 429 ? { "Retry-After": "60" } : {}) } });
}
export async function GET() {
  try {
    const id = await userId();
    return NextResponse.json({ platforms: providers.map(p => ({ id: p.id, name: p.name, ready: configured(p.id) })),
      accounts: configured() ? await listAccounts(id) : [] }, { headers });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    assertSameOrigin(request, true);
    const body = await readBoundedJson(request, 4096);
    const result = await connectionAction(body, await userId());
    if ("pending" in result) {
      const response = NextResponse.json({ redirectUrl: result.redirectUrl }, { headers });
      response.cookies.set("__Host-sentra-connect", result.pending, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 600 });
      return response;
    }
    return NextResponse.json(result, { headers });
  } catch (error) { return failure(error); }
}
