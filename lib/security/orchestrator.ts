import { defaultCyberAgents } from "./agents";
import { mapEvidenceToAttack } from "./attack";
import { buildCaseGraph } from "./graph";
import { runChallenger, runCyberJury } from "./review";
import { buildScamDNA } from "./scam-dna";
import { calculateRiskScore, decisionFromScore } from "./scoring";
import type { InvestigationCase } from "./types";

export async function investigateText(input: string) {
  const findings = await Promise.all(defaultCyberAgents.map((agent) => agent.evaluate(input)));
  const evidence = findings.flatMap((finding) => finding.evidence);
  const score = calculateRiskScore(evidence);
  const baseDecision = decisionFromScore(score);
  const challenger = runChallenger(findings, baseDecision);
  const jury = runCyberJury(findings, challenger.adjustedDecision);
  const decision = jury.decision;

  const investigation: InvestigationCase = {
    id: `S-${Date.now().toString(36).toUpperCase()}`,
    kind: /https?:\/\//i.test(input) ? "url" : "message",
    inputPreview: input.slice(0, 180),
    createdAt: new Date().toISOString(),
    findings,
    evidence,
    score,
    decision,
    explanation: evidence.length
      ? `${evidence.length} evidence signal(s) contributed to this result. Sentra combined specialist findings, challenged the first conclusion, then used a jury-style review.`
      : "No strong deterministic indicators were found. This does not prove the content is safe; external threat intelligence may still change the result."
  };

  return {
    investigation,
    attackTechniques: mapEvidenceToAttack(evidence),
    graph: buildCaseGraph(investigation),
    challenger,
    jury,
    scamDNA: buildScamDNA(input, evidence)
  };
}
