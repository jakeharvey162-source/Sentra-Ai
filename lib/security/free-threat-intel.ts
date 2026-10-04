import type { EvidenceSignal } from "./types";

const ACTIVE_DOMAINS_URL =
  "https://raw.githubusercontent.com/Phishing-Database/Phishing.Database/master/phishing-domains-ACTIVE.txt";

let cache: { fetchedAt: number; domains: Set<string> } | null = null;
const CACHE_MS = 30 * 60 * 1000;

function normalizeHost(host: string) {
  return host.trim().toLowerCase().replace(/^www\./, "");
}

async function loadActivePhishingDomains(): Promise<Set<string> | null> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_MS) return cache.domains;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1800);

    const response = await fetch(ACTIVE_DOMAINS_URL, {
      signal: controller.signal,
      headers: { "User-Agent": "Sentra-AI/ForgeHacks-2026" },
      cache: "no-store",
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const text = await response.text();
    const domains = new Set(
      text
        .split(/\r?\n/)
        .map(normalizeHost)
        .filter((line) => line && !line.startsWith("#"))
    );

    cache = { fetchedAt: Date.now(), domains };
    return domains;
  } catch {
    return null;
  }
}

export async function checkFreePhishingFeed(
  input: string
): Promise<EvidenceSignal[]> {
  const match = input.match(/https?:\/\/[^\s]+/i);
  if (!match) return [];

  let host = "";
  try {
    host = normalizeHost(new URL(match[0]).hostname);
  } catch {
    return [];
  }

  const domains = await loadActivePhishingDomains();
  if (!domains) return [];

  const matched =
    domains.has(host) ||
    [...domains].some((bad) => bad && host.endsWith(`.\${bad}`));

  if (!matched) return [];

  return [
    {
      id: "phishing-db-active-domain",
      source: "Phishing.Database",
      title: "Known active phishing domain",
      detail:
        "The submitted hostname appears in the active Phishing.Database community threat feed.",
      severity: "critical",
      confidence: 0.96,
      weight: 1,
      tags: ["phishing", "community-threat-intel", "known-malicious"],
      attackTechniqueIds: ["T1566", "T1583"],
      observedAt: new Date().toISOString(),
    },
  ];
}
