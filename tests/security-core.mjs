import assert from "node:assert/strict";

const severityMultiplier = {
  info: 0,
  low: 0.35,
  medium: 0.65,
  high: 0.9,
  critical: 1,
};

function calculateRiskScore(evidence) {
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

function decisionFromScore(score) {
  if (score >= 85) return "BLOCK";
  if (score >= 70) return "HOLD";
  if (score >= 45) return "VERIFY";
  if (score >= 25) return "ESCALATE";
  return "SAFE";
}

assert.equal(calculateRiskScore([]), 0);
assert.equal(decisionFromScore(0), "SAFE");
assert.equal(decisionFromScore(25), "ESCALATE");
assert.equal(decisionFromScore(45), "VERIFY");
assert.equal(decisionFromScore(70), "HOLD");
assert.equal(decisionFromScore(85), "BLOCK");

const phishing = calculateRiskScore([
  { severity: "medium", confidence: 0.82, weight: 0.8 },
  { severity: "high", confidence: 0.88, weight: 1 },
  { severity: "high", confidence: 0.86, weight: 1 },
]);

assert.ok(phishing >= 70, `expected urgent credential/payment phishing to score high, got ${phishing}`);

const low = calculateRiskScore([
  { severity: "low", confidence: 0.4, weight: 0.3 },
]);

assert.ok(low < 25, `expected weak low-confidence signal to remain low risk, got ${low}`);

console.log("security-core tests passed", { phishing, low });
