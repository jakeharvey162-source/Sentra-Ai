import type { EvidenceSignal } from "./types";
import { extractUrls, matchesThreatDomain, normalizeHost } from "./urls";
const FEED_URL = "https://raw.githubusercontent.com/Phishing-Database/Phishing.Database/master/phishing-domains-ACTIVE.txt";
let cache: { fetchedAt: number; domains: Set<string> } | null = null;
let pending: Promise<Set<string> | null> | null = null;
let retryAfter = 0;
const CACHE_MS = 30 * 60 * 1000;
export async function loadActivePhishingDomains(): Promise<Set<string> | null> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_MS) return cache.domains;
  if (Date.now() < retryAfter) return null;
  if (pending) return pending;
  pending = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    try {
      const response = await fetch(FEED_URL, { signal: controller.signal, cache: "no-store", redirect: "error" });
      if (!response.ok || !response.body) throw new Error("Feed unavailable");
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > 8 * 1024 * 1024) throw new Error("Feed exceeds limit");
          chunks.push(value);
        }
      } finally { await reader.cancel().catch(() => undefined); }
      const text = Buffer.concat(chunks).toString("utf8");
      const domains = new Set(text.split(/\r?\n/).map(normalizeHost)
        .filter(line => /^(?:[a-z0-9-]+\.)+[a-z0-9-]+$/.test(line)));
      if (!domains.size) throw new Error("Empty feed");
      cache = { fetchedAt: Date.now(), domains };
      return domains;
    } catch { retryAfter = Date.now() + 60000; return null; }
    finally { clearTimeout(timeout); }
  })();
  try { return await pending; } finally { pending = null; }
}
export async function checkFreePhishingFeed(input: string): Promise<EvidenceSignal[]> {
  const hosts = extractUrls(input).flatMap(value => {
    try { return [normalizeHost(new URL(value).hostname)]; } catch { return []; }
  });
  if (!hosts.length) return [];
  const domains = await loadActivePhishingDomains();
  if (!domains) return [{
    id: "phishing-db-unavailable", source: "Phishing.Database", title: "Threat intelligence unavailable",
    detail: "The community feed could not be checked. Local checks still ran; this is not a clean reputation result.",
    severity: "info", confidence: 0, weight: 0, tags: ["coverage-gap"], observedAt: new Date().toISOString()
  }];
  return [...new Set(hosts)].filter(host => matchesThreatDomain(host, domains)).map((host, index) => ({
    id: `phishing-db-active-domain-${index}`, source: "Phishing.Database", title: "Known active phishing domain",
    detail: `Hostname ${host} matches the active community feed, including listed-domain subdomains.`,
    severity: "critical", confidence: 0.96, weight: 1, tags: ["phishing", "community-threat-intel", "known-malicious"],
    attackTechniqueIds: ["T1566", "T1583"], observedAt: new Date().toISOString()
  }));
}
