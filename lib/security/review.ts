import type { AgentFinding, SentraDecision } from "./types";

export interface ChallengerResult {
  challenged: boolean;
  counterEvidence: string[];
  adjustedDecision: SentraDecision;
}

export interface JuryResult {
  votes: Record<SentraDecision, number>;
  decision: SentraDecision;
  confidence: number;
}

const order: SentraDecision[] = ["SAFE", "ESCALATE", "VERIFY", "HOLD", "BLOCK"];

export function runChallenger(findings: AgentFinding[], decision: SentraDecision): ChallengerResult {
  const counterEvidence: string[] = [];

  if (findings.every((f) => f.evidence.length === 0)) {
    counterEvidence.push("No strong deterministic evidence was found.");
  }

  const conflicting = new Set(findings.map((f) => f.recommendation));
  if (conflicting.size > 1) {
    counterEvidence.push("Specialist recommendations disagree.");
  }

  // Missing evidence from another specialist cannot downgrade an observed threat.
  const adjustedDecision = decision;

  return {
    challenged: counterEvidence.length > 0,
    counterEvidence,
    adjustedDecision,
  };
}

export function runCyberJury(findings: AgentFinding[], fallback: SentraDecision): JuryResult {
  const votes: Record<SentraDecision, number> = {
    SAFE: 0,
    ESCALATE: 0,
    VERIFY: 0,
    HOLD: 0,
    BLOCK: 0,
  };

  for (const finding of findings) {
    votes[finding.recommendation] += 1;
  }

  let decision = fallback;
  let maxVotes = -1;

  for (const candidate of order) {
    if (votes[candidate] > maxVotes) {
      maxVotes = votes[candidate];
      decision = candidate;
    } else if (votes[candidate] === maxVotes && order.indexOf(candidate) > order.indexOf(decision)) {
      decision = candidate;
    }
  }

  const total = findings.length || 1;
  return {
    votes,
    decision: order.indexOf(decision) < order.indexOf(fallback) ? fallback : decision,
    confidence: Math.max(0.5, maxVotes / total),
  };
}
