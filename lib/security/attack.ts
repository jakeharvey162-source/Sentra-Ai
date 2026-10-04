import type { AttackTechnique, EvidenceSignal } from "./types";

const TECHNIQUES: AttackTechnique[] = [
  { id:"T1566", name:"Phishing", url:"https://attack.mitre.org/techniques/T1566/", domains:["enterprise-attack"], tactics:["initial-access"] },
  { id:"T1204", name:"User Execution", url:"https://attack.mitre.org/techniques/T1204/", domains:["enterprise-attack"], tactics:["execution"] },
  { id:"T1583", name:"Acquire Infrastructure", url:"https://attack.mitre.org/techniques/T1583/", domains:["enterprise-attack"], tactics:["resource-development"] }
];

export function mapEvidenceToAttack(evidence: EvidenceSignal[]): AttackTechnique[] {
  const ids = new Set(evidence.flatMap((signal) => signal.attackTechniqueIds ?? []));
  return TECHNIQUES.filter((technique) => ids.has(technique.id));
}
