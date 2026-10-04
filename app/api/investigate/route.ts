import { NextResponse } from "next/server";
import { investigateText } from "@/lib/security/orchestrator";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const input = typeof body?.input === "string" ? body.input.trim() : "";

  if (!input) {
    return NextResponse.json({ error: "Input is required." }, { status: 400 });
  }

  if (input.length > 20000) {
    return NextResponse.json({ error: "Input is too large." }, { status: 413 });
  }

  return NextResponse.json(await investigateText(input));
}
