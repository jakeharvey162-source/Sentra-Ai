import type { EvidenceSignal, SentraDecision } from "./types";

const severityMultiplier = {
  info: 0,
  low: 0.35,
  medium: 0.65,
  high: 0.9,
  critical: 1,
} as const;

export function calculateRiskScore(evidence: EvidenceSignal[]): number {
  if (evidence.length === 0) return 0;
  const weighted = evidence.reduce((sum, signal) => {
    const severity = severityMultiplier[signal.severity];
    const confidence = Math.max(0, Math.min(1, signal.confidence));
    const weight = Math.max(0, signal.weight);
    return sum + 100 * severity * confidence * weight;
  }, 0);
  const totalWeight = evidence.reduce((sum, signal) => sum + Math.max(0, signal.weight), 0);
  return totalWeight ? Math.max(0, Math.min(100, Math.round(weighted / totalWeight))) : 0;
}

export function decisionFromScore(score: number): SentraDecision {
  if (score >= 85) return "BLOCK";
  if (score >= 70) return "HOLD";
  if (score >= 45) return "VERIFY";
  if (score >= 25) return "ESCALATE";
  return "SAFE";
}
