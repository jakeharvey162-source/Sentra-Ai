export const MAX_URLS = 20;
export function extractUrls(input: string): string[] {
  return [...new Set((input.match(/https?:\/\/[^\s<>"']+/gi) ?? [])
    .map(value => value.replace(/[),.!?;]+$/, "")))];
}
export function normalizeHost(host: string) {
  return host.trim().toLowerCase().replace(/\.$/, "").replace(/^www\./, "");
}
export function matchesThreatDomain(host: string, domains: Set<string>) {
  const parts = normalizeHost(host).split(".");
  // Suffix lookup scales with hostname depth, not the feed size.
  for (let i = 0; i < parts.length - 1; i++) {
    if (domains.has(parts.slice(i).join("."))) return true;
  }
  return false;
}
