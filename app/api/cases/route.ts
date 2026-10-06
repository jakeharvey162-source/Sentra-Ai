import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { caseRequest } from "@/lib/cases/service";
import { RequestError } from "@/lib/security/request";

const headers = { "Cache-Control": "no-store, private", "Vary": "Cookie" };
async function handle(request: Request) {
  try { return NextResponse.json(await caseRequest(request, await createClient()), { headers }); }
  catch (error) { return NextResponse.json({ error: error instanceof RequestError ? error.message : "Account service unavailable. Please try again." },
    { status: error instanceof RequestError ? error.status : 503, headers }); }
}
export const GET = handle;
export const POST = handle;
