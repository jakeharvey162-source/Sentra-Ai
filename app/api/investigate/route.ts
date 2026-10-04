import { NextResponse } from "next/server";
import { investigateText } from "@/lib/security/orchestrator";
import { readInvestigationInput, RequestError } from "@/lib/security/request";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let input: string;
  let saveCase = false;
  try { ({ input, saveCase } = await readInvestigationInput(request)); }
  catch (error) {
    return NextResponse.json({ error: error instanceof RequestError ? error.message : "Invalid request." },
      { status: error instanceof RequestError ? error.status : 400, headers: { "Cache-Control": "no-store" } });
  }
  const key = process.env.VERCEL ? request.headers.get("x-vercel-forwarded-for") ?? "unknown" : "local";
  try { await enforceRateLimit("investigate", key); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Protection service unavailable." },
    { status: error instanceof RequestError ? error.status : 503, headers: { "Retry-After": "60", "Cache-Control": "no-store" } }); }

  const result = await investigateText(input);

  if (!saveCase) return NextResponse.json({ ...result, persisted: false }, { headers: { "Cache-Control": "no-store" } });

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (user && !user.is_anonymous && process.env.SENTRA_SERVER_SECRET) {
      const { error } = await supabase.rpc("sentra_save_case", {
        p_secret: process.env.SENTRA_SERVER_SECRET,
        p_case: { case_ref: result.investigation.id, kind: result.investigation.kind,
          input_preview: result.investigation.inputPreview, risk_score: result.investigation.score,
          decision: result.investigation.decision, explanation: result.investigation.explanation,
          scam_fingerprint: result.scamDNA.fingerprint },
        p_evidence: result.investigation.evidence.map(item => ({ source: item.source,
          title: item.title, detail: item.detail, severity: item.severity, confidence: item.confidence,
          tags: item.tags, attack_technique_ids: item.attackTechniqueIds ?? [] }))
      });
      return NextResponse.json({ ...result, persisted: !error, ...(error ? { persistenceError: "Case was not saved. Storage may be unavailable or your daily limit reached." } : {}) }, { headers: { "Cache-Control": "no-store" } });
    }
  } catch {
    // Public investigations remain usable when persistence is unavailable.
  }

  return NextResponse.json({ ...result, persisted: false }, { headers: { "Cache-Control": "no-store" } });
}
