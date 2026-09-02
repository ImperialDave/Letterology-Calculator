/** Shuffle, endurance, Second Century decades, and death drops. Pure logic. */
import { CENTURY } from "./century-catalog";
import type { EnemyKind } from "./types";
import { STAGE_COUNT } from "./types";

export const ARCADE_WAKES = 3;
export const ARCADE_WAKES_MAX = 5;
export const ARCADE_FIRST = 16;
export const CENTURY_START = 61;
export const SHUFFLE_NEED = 15;
export const ENDURANCE_NEED = 30;

export type RunMode = "campaign" | "shuffle" | "arcade";
export type BuffId = "quoin" | "ligature" | "caret" | "tilde";
export type DropKind =
  | "ink"
  | "heart"
  | "fang"
  | "scale"
  | "quoin"
  | "ligature"
  | "caret"
  | "emdash"
  | "tilde"
  | "wake";

export interface Decade {
  lo: number;
  hi: number;
  id: string;
}

export interface DropRoll {
  kind: DropKind;
  ink?: number;
}

export const BUFF_TIME: Record<BuffId, number> = {
  quoin: 4,
  ligature: 6,
  caret: 8,
  tilde: 8,
};

export const DECADES: Decade[] = Array.from({ length: 10 }, (_, i) => {
  const lo = CENTURY_START + i * 10;
  const hi = Math.min(STAGE_COUNT, lo + 9);
  return { lo, hi, id: `decade-${lo}` };
});

export function decadeId(lo: number) {
  return `decade-${lo}`;
}

export function parseDecadeId(id: string): number | null {
  const m = /^decade-(\d+)$/.exec(id);
  if (!m) return null;
  const lo = Number(m[1]);
  return DECADES.some((d) => d.lo === lo) ? lo : null;
}

export function decadeUnlockAt(lo: number) {
  return lo - 1;
}

export function decadeLocked(progress: number, lo: number) {
  return progress < decadeUnlockAt(lo);
}

export function decadeTarget(progress: number, lo: number, hi: number) {
  const next = Math.min(STAGE_COUNT, Math.max(1, progress + 1));
  if (next >= lo && next <= hi) return next;
  return lo;
}

export function decadePlaque(lo: number) {
  const spec = CENTURY.find((s) => s.n === lo);
  const hi = Math.min(STAGE_COUNT, lo + 9);
  const name = spec?.name ?? `${lo}`;
  return `${lo}–${hi} · ${name}`;
}

export function rangeInclusive(lo: number, hi: number) {
  const out: number[] = [];
  for (let n = lo; n <= hi; n++) out.push(n);
  return out;
}

/** Unlocked pages plus the next unread. Never below 6. */
export function shufflePool(progress: number, centuryOnly = false) {
  if (centuryOnly) {
    if (progress < CENTURY_START - 1) return [];
    const hi = Math.min(STAGE_COUNT, Math.max(CENTURY_START, progress + 1));
    return rangeInclusive(CENTURY_START, hi);
  }
  const hi = Math.min(STAGE_COUNT, Math.max(6, progress + 1));
  return rangeInclusive(6, hi);
}

export function pickFromPool(pool: number[], avoid = 0, rand: () => number = Math.random) {
  const opts = pool.filter((n) => n !== avoid);
  const src = opts.length ? opts : pool;
  if (!src.length) return 6;
  return src[Math.floor(rand() * src.length)] ?? src[0]!;
}

export function enduranceBand(clears: number): [number, number] {
  if (clears < 5) return [ARCADE_FIRST, 40];
  if (clears < 10) return [41, 80];
  return [81, STAGE_COUNT];
}

export function isWardenIndex(n: number) {
  return n % 5 === 0 || n === STAGE_COUNT;
}

export function pickEnduranceStage(clears: number, last = 0, rand: () => number = Math.random) {
  const [lo, hi] = enduranceBand(clears);
  const wantBoss = (clears + 1) % 5 === 0;
  const pool = rangeInclusive(lo, hi).filter((n) => (wantBoss ? isWardenIndex(n) : true));
  const fallback = rangeInclusive(ARCADE_FIRST, STAGE_COUNT);
  return pickFromPool(pool.length ? pool : fallback, last, rand);
}

const ELITE: ReadonlySet<EnemyKind> = new Set([
  "seven",
  "eight",
  "nine",
  "triad",
  "nullring",
  "mobius",
  "summoner",
  "gradient",
  "archivist",
  "crossseal",
  "plus",
  "minus",
  "times",
  "divide",
  "pi",
  "radix",
]);

export function isEliteKind(kind: EnemyKind) {
  return ELITE.has(kind);
}

const ARCADE_TABLE: { kind: DropKind; normal: number; elite: number; boss: number }[] = [
  { kind: "wake", normal: 0, elite: 0.02, boss: 0.08 },
  { kind: "tilde", normal: 0.02, elite: 0.05, boss: 0.08 },
  { kind: "emdash", normal: 0.02, elite: 0.05, boss: 0.12 },
  { kind: "caret", normal: 0.02, elite: 0.06, boss: 0.1 },
  { kind: "ligature", normal: 0.03, elite: 0.08, boss: 0.12 },
  { kind: "quoin", normal: 0.03, elite: 0.08, boss: 0.15 },
  { kind: "fang", normal: 0.04, elite: 0.1, boss: 0.18 },
  { kind: "scale", normal: 0.06, elite: 0.12, boss: 0.25 },
  { kind: "heart", normal: 0.12, elite: 0.22, boss: 0.4 },
  { kind: "ink", normal: 0.4, elite: 0.55, boss: 0.8 },
];

export function rollDrop(opts: {
  kind: EnemyKind;
  boss: boolean;
  arcade: boolean;
  rand?: () => number;
}): DropRoll | null {
  if (opts.kind === "dummy") return null;
  const rand = opts.rand ?? Math.random;
  const elite = isEliteKind(opts.kind);
  const col = opts.boss ? "boss" : elite ? "elite" : "normal";
  const table = opts.arcade
    ? ARCADE_TABLE
    : ARCADE_TABLE.filter((row) => row.kind === "ink" || row.kind === "heart").map((row) => ({
        ...row,
        normal: row.normal * 0.5,
        elite: row.elite * 0.5,
        boss: row.boss * 0.5,
      }));
  for (const row of table) {
    if (row.kind === "wake" && !opts.arcade) continue;
    if (rand() < row[col]) {
      if (row.kind === "ink") {
        return { kind: "ink", ink: opts.boss ? 20 : elite ? 14 : 8 };
      }
      return { kind: row.kind };
    }
  }
  return null;
}
