import type { InvestigationCase, ThreatGraphEdge, ThreatGraphNode } from "./types";

export interface ThreatGraph {
  nodes: ThreatGraphNode[];
  edges: ThreatGraphEdge[];
}

export function buildCaseGraph(investigation: InvestigationCase): ThreatGraph {
  const nodes: ThreatGraphNode[] = [{
    id: investigation.id,
    type: "case",
    label: investigation.id,
    confidence: Math.min(1, investigation.score / 100),
    firstSeen: investigation.createdAt,
    lastSeen: investigation.createdAt,
    metadata: { decision: investigation.decision, score: investigation.score, kind: investigation.kind }
  }];
  const edges: ThreatGraphEdge[] = [];

  for (const signal of investigation.evidence) {
    const nodeId = `evidence:${signal.id}`;
    nodes.push({
      id: nodeId,
      type: signal.attackTechniqueIds?.length ? "attack-technique" : "campaign",
      label: signal.title,
      confidence: signal.confidence,
      firstSeen: signal.observedAt ?? investigation.createdAt,
      lastSeen: signal.observedAt ?? investigation.createdAt,
      metadata: { source: signal.source, severity: signal.severity }
    });
    edges.push({
      id: `${investigation.id}->${nodeId}`,
      from: investigation.id,
      to: nodeId,
      relationship: "supported-by",
      confidence: signal.confidence,
      firstSeen: investigation.createdAt,
      lastSeen: investigation.createdAt,
      sources: [signal.source]
    });
  }

  return { nodes, edges };
}
