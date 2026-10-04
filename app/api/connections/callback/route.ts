import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { appOrigin, configured, completeConnection } from "@/lib/connectors/composio";
export const runtime = "nodejs";
export async function GET(request: Request) {
  let status = "failed";
  try {
    const { data, error } = await (await createClient()).auth.getUser();
    if (!configured() || error || !data.user || data.user.is_anonymous) throw new Error("Not authorized");
    const uri = new URL(request.url).searchParams.get("session_uri");
    await completeConnection((await cookies()).get("__Host-sentra-connect")?.value, data.user.id, uri);
    status = "connected";
  } catch { /* Never reflect tokens, callback arguments or upstream errors into the UI. */ }
  const response = NextResponse.redirect(`${appOrigin()}/connections?connection=${status}`, 303);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.cookies.set("__Host-sentra-connect", "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
