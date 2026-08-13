const RECENT_KEY = "letterology:recent";
const BOND_KEY = "letterology:recent-bonds";

export interface RecentBond {
  a: string;
  b: string;
}

function readJson(key: string): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function loadRecent(): string[] {
  const parsed = readJson(RECENT_KEY);
  return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string").slice(0, 8) : [];
}

export function saveRecent(name: string) {
  if (typeof window === "undefined") return;
  const cleaned = name.trim();
  if (!cleaned) return;
  const next = [cleaned, ...loadRecent().filter((item) => item.toLowerCase() !== cleaned.toLowerCase())].slice(
    0,
    8,
  );
  window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export function loadRecentBonds(): RecentBond[] {
  const parsed = readJson(BOND_KEY);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter(
      (item): item is RecentBond =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof (item as RecentBond).a === "string" &&
        typeof (item as RecentBond).b === "string",
    )
    .slice(0, 6);
}

export function saveRecentBond(a: string, b: string) {
  if (typeof window === "undefined") return;
  const pair = { a: a.trim(), b: b.trim() };
  if (!pair.a || !pair.b) return;
  const keyOf = (item: RecentBond) => `${item.a.toLowerCase()}::${item.b.toLowerCase()}`;
  const self = keyOf(pair);
  const flipped = `${pair.b.toLowerCase()}::${pair.a.toLowerCase()}`;
  const next = [pair, ...loadRecentBonds().filter((item) => keyOf(item) !== self && keyOf(item) !== flipped)].slice(
    0,
    6,
  );
  window.localStorage.setItem(BOND_KEY, JSON.stringify(next));
}
