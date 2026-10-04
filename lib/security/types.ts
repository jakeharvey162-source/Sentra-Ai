export type SentraDecision = "SAFE" | "VERIFY" | "HOLD" | "BLOCK" | "ESCALATE";

export type EvidenceSeverity = "info" | "low" | "medium" | "high" | "critical";

export interface EvidenceSignal {
  id: string;
  source: string;
  title: string;
  detail: string;
  severity: EvidenceSeverity;
  confidence: number;
  weight: number;
  tags: string[];
  attackTechniqueIds?: string[];
  observedAt?: string;
}

export interface AgentFinding {
  agentId: string;
  agentName: string;
  summary: string;
  confidence: number;
  evidence: EvidenceSignal[];
  recommendation: SentraDecision;
}

export interface AttackTechnique {
  id: string;
  name: string;
  description?: string;
  url?: string;
  domains?: string[];
  tactics?: string[];
}

export interface ThreatGraphNode {
  id: string;
  type:
    | "case"
    | "domain"
    | "url"
    | "email"
    | "identity"
    | "ip"
    | "file"
    | "hash"
    | "wallet"
    | "phone"
    | "attack-technique"
    | "campaign";
  label: string;
  confidence?: number;
  firstSeen?: string;
  lastSeen?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface ThreatGraphEdge {
  id: string;
  from: string;
  to: string;
  relationship: string;
  confidence: number;
  firstSeen?: string;
  lastSeen?: string;
  sources: string[];
}

export interface InvestigationCase {
  id: string;
  kind: "url" | "message" | "file" | "image" | "qr" | "audio" | "app";
  inputPreview: string;
  createdAt: string;
  findings: AgentFinding[];
  evidence: EvidenceSignal[];
  score: number;
  decision: SentraDecision;
  explanation: string;
}
