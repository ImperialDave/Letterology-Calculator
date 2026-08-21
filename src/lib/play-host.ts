/** Hosts where this build is the playable X/Grok game, not the club instrument. */

export const X_FRAME_ANCESTORS =
  "'self' https://x.com https://*.x.com https://twitter.com https://*.twitter.com https://grok.com https://*.grok.com https://*.grok.me https://*.grok-sandbox.com";

export function normalizeHost(host: string): string {
  return host.split(",")[0].trim().split(":")[0].toLowerCase();
}

export function isGameFirstHost(host: string): boolean {
  const h = normalizeHost(host);
  if (!h) return false;
  return h === "grok.me" || h.endsWith(".grok.me");
}

export type GameFirstSearch = { n?: string; club?: boolean; play?: boolean };

export function isGameFirstLocation(host: string, search: GameFirstSearch = {}): boolean {
  if (search.club || (search.n && search.n.length > 0)) return false;
  if (search.play) return true;
  return isGameFirstHost(host);
}

export function hostFromHref(href: string): string {
  try {
    const u = new URL(href);
    return u.host;
  } catch {
    return "";
  }
}

export function resolvePlayHost(locationHref: string, fallback = ""): string {
  if (typeof window !== "undefined" && window.location?.host) return window.location.host;
  return hostFromHref(locationHref) || fallback;
}
