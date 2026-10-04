import { NextResponse } from "next/server";
import { investigateText } from "@/lib/security/orchestrator";
import { readInvestigationInput, RequestError, allowInvestigation } from "@/lib/security/request";
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
  if (!allowInvestigation(key)) return NextResponse.json({ error: "Too many investigations. Try again in one minute." },
    { status: 429, headers: { "Retry-After": "60", "Cache-Control": "no-store" } });

  const result = await investigateText(input);

  if (!saveCase) return NextResponse.json({ ...result, persisted: false }, { headers: { "Cache-Control": "no-store" } });

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (user) {
      const { data: savedCase, error: caseError } = await supabase
        .from("sentra_cases")
        .insert({
          user_id: user.id,
          case_ref: result.investigation.id,
          kind: result.investigation.kind,
          input_preview: result.investigation.inputPreview,
          risk_score: result.investigation.score,
          decision: result.investigation.decision,
          explanation: result.investigation.explanation,
          scam_fingerprint: result.scamDNA.fingerprint,
        })
        .select("id")
        .single();

      let evidenceSaved = true;
      if (!caseError && savedCase && result.investigation.evidence.length) {
        const { error: evidenceError } = await supabase.from("sentra_evidence").insert(
          result.investigation.evidence.map((item) => ({
            case_id: savedCase.id,
            user_id: user.id,
            source: item.source,
            title: item.title,
            detail: item.detail,
            severity: item.severity,
            confidence: item.confidence,
            tags: item.tags,
            attack_technique_ids: item.attackTechniqueIds ?? [],
          }))
        );
        evidenceSaved = !evidenceError;
      }

      return NextResponse.json({ ...result, persisted: !caseError && evidenceSaved }, { headers: { "Cache-Control": "no-store" } });
    }
  } catch {
    // Public investigations remain usable when persistence is unavailable.
  }

  return NextResponse.json({ ...result, persisted: false }, { headers: { "Cache-Control": "no-store" } });
}
