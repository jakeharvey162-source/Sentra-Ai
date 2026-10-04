import { NextResponse } from "next/server";
import { investigateText } from "@/lib/security/orchestrator";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const input = typeof body?.input === "string" ? body.input.trim() : "";

  if (!input) return NextResponse.json({ error: "Input is required." }, { status: 400 });
  if (input.length > 20000) return NextResponse.json({ error: "Input is too large." }, { status: 413 });

  const result = await investigateText(input);

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

      if (!caseError && savedCase && result.investigation.evidence.length) {
        await supabase.from("sentra_evidence").insert(
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
      }

      return NextResponse.json({ ...result, persisted: !caseError });
    }
  } catch {
    // Public investigations remain usable when persistence is unavailable.
  }

  return NextResponse.json({ ...result, persisted: false });
}
