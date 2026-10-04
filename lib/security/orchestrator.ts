import { defaultCyberAgents } from "./agents";
import { mapEvidenceToAttack } from "./attack";
import { buildCaseGraph } from "./graph";
import { calculateRiskScore, decisionFromScore } from "./scoring";
import type { InvestigationCase } from "./types";

export async function investigateText(input: string) {
  const findings = await Promise.all(defaultCyberAgents.map((agent) => agent.evaluate(input)));
  const evidence = findings.flatMap((finding) => finding.evidence);
  const score = calculateRiskScore(evidence);
  const decision = decisionFromScore(score);

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
      ? `${evidence.length} evidence signal(s) contributed to this result. The decision is based on weighted evidence rather than one model response.`
      : "No strong deterministic indicators were found. This does not prove the content is safe."
  };

  return {
    investigation,
    attackTechniques: mapEvidenceToAttack(evidence),
    graph: buildCaseGraph(investigation)
  };
}
