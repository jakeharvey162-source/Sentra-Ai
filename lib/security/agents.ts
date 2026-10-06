import { normalizeSecurityText, requestsCredentials } from "./message-signals";
import type { AgentFinding, EvidenceSignal, SentraDecision } from "./types";
import { checkFreePhishingFeed } from "./free-threat-intel";
import { extractUrls } from "./urls";

export interface CyberAgent {
  id: string;
  name: string;
  role: string;
  evaluate(input: string): Promise<AgentFinding>;
}

function recommendationFromSignals(signals: EvidenceSignal[]): SentraDecision {
  if (signals.some((s) => s.severity === "critical" || s.severity === "high")) return "BLOCK";
  if (signals.some((s) => s.severity === "medium")) return "VERIFY";
  return "SAFE";
}

function signal(
  id: string,
  source: string,
  title: string,
  detail: string,
  severity: EvidenceSignal["severity"],
  confidence: number,
  weight: number,
  tags: string[],
  attackTechniqueIds?: string[]
): EvidenceSignal {
  return { id, source, title, detail, severity, confidence, weight, tags, attackTechniqueIds, observedAt: new Date().toISOString() };
}

export class PhishingInvestigator implements CyberAgent {
  id = "phishing-investigator";
  name = "Phishing Investigator";
  role = "Detects social-engineering, urgency and credential-theft patterns.";

  async evaluate(input: string): Promise<AgentFinding> {
    const evidence: EvidenceSignal[] = [];
    const normalized = normalizeSecurityText(input);
    const urgency = /\b(urgent|immediately|act now|suspended|locked)\b/i.test(normalized);
    const credentials = requestsCredentials(input);
    const payment = /\b(pay|payment|bank transfer|gift card|crypto|wallet)\b/i.test(normalized);

    if (urgency) evidence.push(signal(
      "phish-urgency",
      this.name,
      "Urgency pressure detected",
      "The content uses urgency or account-pressure language.",
      "medium",
      0.82,
      0.8,
      ["social-engineering","urgency"],
      ["T1566"]
    ));

    if (credentials) evidence.push(signal(
      "phish-credentials",
      this.name,
      "Credential request detected",
      "The content asks for authentication or verification information.",
      "high",
      0.88,
      1,
      ["credentials","phishing"],
      ["T1566","T1204"]
    ));

    if (payment && urgency) evidence.push(signal(
      "phish-payment",
      this.name,
      "Urgent payment pattern",
      "Payment language is combined with urgency.",
      "high",
      0.86,
      1,
      ["payment","social-engineering"],
      ["T1566"]
    ));

    return {
      agentId: this.id,
      agentName: this.name,
      summary: evidence.length ? `Found ${evidence.length} phishing-related signal(s).` : "No strong phishing-language indicators were found.",
      confidence: evidence.length ? 0.84 : 0.58,
      evidence,
      recommendation: recommendationFromSignals(evidence)
    };
  }
}

export class UrlInvestigator implements CyberAgent {
  id = "url-investigator";
  name = "URL Investigator";
  role = "Examines URL structure and suspicious destination patterns.";

  async evaluate(input: string): Promise<AgentFinding> {
    const evidence: EvidenceSignal[] = [];
    evidence.push(...(await checkFreePhishingFeed(input)));
    const urls = extractUrls(input);

    for (const [index, value] of urls.entries()) {
      try {
        const url = new URL(value);
        const host = url.hostname.toLowerCase();

        if (host.split(".").some(label => label.startsWith("xn--"))) evidence.push(signal(
          `url-punycode-${index}`,
          this.name,
          "Punycode domain detected",
          "Punycode can be legitimate but is also used for look-alike domains.",
          "medium",
          0.76,
          0.8,
          ["domain","homograph"],
          ["T1583","T1566"]
        ));

        if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) evidence.push(signal(
          `url-ip-host-${index}`,
          this.name,
          "Raw IP address used as host",
          "The link uses a numeric IP address instead of a domain name.",
          "medium",
          0.8,
          0.7,
          ["url","infrastructure"],
          ["T1583"]
        ));

        if (url.username || url.password) evidence.push(signal(
          `url-userinfo-${index}`,
          this.name,
          "URL user-info detected",
          "User-info in a URL can obscure the true destination.",
          "high",
          0.9,
          1,
          ["url","obfuscation"],
          ["T1566"]
        ));
      } catch {
        evidence.push(signal(
          `url-malformed-${index}`,
          this.name,
          "Malformed URL",
          "A URL-like value was present but could not be parsed safely.",
          "medium",
          0.74,
          0.7,
          ["url","malformed"]
        ));
      }
    }

    return {
      agentId: this.id,
      agentName: this.name,
      summary: evidence.length ? `Found ${evidence.length} URL-related signal(s).` : "No strong URL-structure indicators were found.",
      confidence: evidence.length ? 0.8 : 0.55,
      evidence,
      recommendation: recommendationFromSignals(evidence)
    };
  }
}

export const defaultCyberAgents: CyberAgent[] = [
  new PhishingInvestigator(),
  new UrlInvestigator()
];
