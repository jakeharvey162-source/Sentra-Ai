import fs from "node:fs";
import path from "node:path";

const input = process.argv[2];
if (!input) {
  console.error("Usage: npm run shannon:import -- path/to/report.sarif");
  process.exit(2);
}

const raw = JSON.parse(fs.readFileSync(input, "utf8"));
const runs = Array.isArray(raw.runs) ? raw.runs : [];

const findings = [];

for (const run of runs) {
  const rules = new Map(
    (run.tool?.driver?.rules ?? []).map((rule) => [rule.id, rule])
  );

  for (const result of run.results ?? []) {
    const rule = rules.get(result.ruleId) ?? {};
    const level = result.level ?? "warning";
    const severity =
      level === "error" ? "high" :
      level === "warning" ? "medium" :
      "low";

    const location = result.locations?.[0]?.physicalLocation;
    const uri = location?.artifactLocation?.uri ?? null;
    const line = location?.region?.startLine ?? null;

    findings.push({
      source: "Shannon",
      ruleId: result.ruleId ?? "unknown",
      title: rule.shortDescription?.text ?? result.ruleId ?? "Security finding",
      description:
        result.message?.text ??
        rule.fullDescription?.text ??
        "No description supplied.",
      severity,
      file: uri,
      line,
      helpUri: rule.helpUri ?? null,
      fingerprint:
        result.partialFingerprints?.primaryLocationLineHash ??
        result.fingerprints?.["matchBasedId/v1"] ??
        null,
    });
  }
}

const score = { high: 3, medium: 2, low: 1 };
findings.sort((a, b) => score[b.severity] - score[a.severity]);

const normalized = {
  source: "Shannon",
  generatedAt: new Date().toISOString(),
  inputReport: path.basename(input),
  findingCount: findings.length,
  summary: {
    high: findings.filter((x) => x.severity === "high").length,
    medium: findings.filter((x) => x.severity === "medium").length,
    low: findings.filter((x) => x.severity === "low").length,
  },
  remediationPolicy: {
    high: "Block release until reviewed and fixed or explicitly accepted.",
    medium: "Fix before public release where practical.",
    low: "Track and harden without blocking the demo unless risk compounds.",
  },
  findings,
};

const outDir = path.join("test-lab", "results");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "shannon-normalized.json");
fs.writeFileSync(outPath, JSON.stringify(normalized, null, 2) + "\n");

console.log(JSON.stringify(normalized.summary));
console.log(`Normalized Shannon findings written to ${outPath}`);
