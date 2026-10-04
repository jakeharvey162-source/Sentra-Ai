import type { EvidenceSignal } from "./types";

export interface ScamDNA {
  fingerprint: string;
  traits: string[];
  confidence: number;
}

function hashString(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function buildScamDNA(input: string, evidence: EvidenceSignal[]): ScamDNA {
  const traits = new Set<string>();

  for (const signal of evidence) {
    signal.tags.forEach((tag) => traits.add(tag));
  }

  if (/https?:\/\//i.test(input)) traits.add("contains-url");
  if (/(urgent|immediately|act now|suspended|locked)/i.test(input)) traits.add("urgency");
  if (/(otp|password|pin|verification code)/i.test(input)) traits.add("credential-request");
  if (/(gift card|crypto|wallet|bank transfer)/i.test(input)) traits.add("payment-request");

  const ordered = [...traits].sort();
  const fingerprint = hashString(ordered.join("|") || "no-strong-traits");
  const confidence = Math.min(0.95, 0.35 + ordered.length * 0.1);

  return { fingerprint, traits: ordered, confidence };
}
