import type { Difficulty, GradeLetter, LedgerMark } from "./types";
import { standWalk } from "./validate-level";

export type Clearance = "full" | "high" | "mid" | "low";
export type Seat = "sentence" | "margin";

const LETTERS: GradeLetter[] = ["A+", "A", "A−", "B+", "B", "B−", "C+", "C", "C−", "D+", "D"];

const TABLE: Record<Clearance, readonly [GradeLetter, GradeLetter, GradeLetter, GradeLetter]> = {
  full: ["A+", "A", "A−", "B+"],
  high: ["A−", "B+", "B", "B−"],
  mid: ["B", "B−", "C+", "C"],
  low: ["C", "C−", "D+", "D"],
};

const RANK = new Map<GradeLetter, number>(LETTERS.map((g, i) => [g, LETTERS.length - i]));

export function isGradeLetter(v: unknown): v is GradeLetter {
  return typeof v === "string" && RANK.has(v as GradeLetter);
}

/** Empty sentence is a full clear. The letter then rests on wakes. */
export function clearanceOf(killed: number, total: number): Clearance {
  if (total <= 0 || killed >= total) return "full";
  const ratio = killed / total;
  if (ratio >= 0.85) return "high";
  if (ratio >= 0.6) return "mid";
  return "low";
}

export function letterFor(clearance: Clearance, deaths: number): GradeLetter {
  const band = deaths <= 0 ? 0 : deaths === 1 ? 1 : deaths === 2 ? 2 : 3;
  return TABLE[clearance][band];
}

export function pointsFor(input: {
  sentenceKilled: number;
  marginKilled: number;
  deaths: number;
  hits: number;
  difficulty: Difficulty;
}): number {
  const sentencePoints = Math.max(0, input.sentenceKilled) * 100;
  const marginPoints = Math.max(0, input.marginKilled) * 40;
  const deathTax = Math.max(0, input.deaths) * 75;
  const hitTax = Math.min(Math.max(0, input.hits) * 4, sentencePoints * 0.25);
  const raw = Math.max(0, sentencePoints + marginPoints - deathTax - hitTax);
  const mult = input.difficulty === "extreme" ? 2 : input.difficulty === "hard" ? 1.5 : 1;
  return Math.round(raw * mult);
}

export interface CensusTally {
  sentenceKilled: number;
  sentenceTotal: number;
  marginKilled: number;
  marginTotal: number;
}

export function tallyCensus(
  enemies: ReadonlyArray<{ census?: boolean; kind: string; seat?: Seat; alive: boolean }>,
): CensusTally {
  const tally: CensusTally = { sentenceKilled: 0, sentenceTotal: 0, marginKilled: 0, marginTotal: 0 };
  for (const e of enemies) {
    if (!e.census || e.kind === "dummy") continue;
    const margin = e.seat === "margin";
    if (margin) {
      tally.marginTotal += 1;
      if (!e.alive) tally.marginKilled += 1;
    } else {
      tally.sentenceTotal += 1;
      if (!e.alive) tally.sentenceKilled += 1;
    }
  }
  return tally;
}

export function markFor(
  tally: CensusTally,
  deaths: number,
  hits: number,
  difficulty: Difficulty,
): LedgerMark {
  return {
    grade: letterFor(clearanceOf(tally.sentenceKilled, tally.sentenceTotal), deaths),
    points: pointsFor({
      sentenceKilled: tally.sentenceKilled,
      marginKilled: tally.marginKilled,
      deaths,
      hits,
      difficulty,
    }),
    sentenceKilled: tally.sentenceKilled,
    sentenceTotal: tally.sentenceTotal,
    marginKilled: tally.marginKilled,
    marginTotal: tally.marginTotal,
    deaths,
    hits,
    difficulty,
  };
}

/** Higher points win. Equal points keep the better letter. A tie of both keeps the one already filed. */
export function betterMark(prev: LedgerMark | undefined, next: LedgerMark): LedgerMark {
  if (!prev) return next;
  if (next.points !== prev.points) return next.points > prev.points ? next : prev;
  return (RANK.get(next.grade) ?? 0) > (RANK.get(prev.grade) ?? 0) ? next : prev;
}

export function bookTotal(marks: Record<string, LedgerMark> | undefined): number {
  if (!marks) return 0;
  let sum = 0;
  for (const mark of Object.values(marks)) sum += mark.points;
  return sum;
}

export function markLine(mark: Pick<LedgerMark, "sentenceKilled" | "sentenceTotal" | "marginKilled" | "deaths">): string {
  const wake = mark.deaths === 0 ? "no wakes" : mark.deaths === 1 ? "1 wake" : `${mark.deaths} wakes`;
  return `${mark.sentenceKilled} of ${mark.sentenceTotal} on the sentence · ${mark.marginKilled} in the margin · ${wake}`;
}

/** Within one tile of the walk is the sentence. No walk means every census enemy is on the sentence. */
export function seatOf(tx: number, ty: number, walk: Set<string> | null): Seat {
  if (!walk) return "sentence";
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (walk.has(`${tx + dx},${ty + dy}`)) return "sentence";
    }
  }
  return "margin";
}

export function seatEnemies<T extends { census?: boolean; kind: string; tx?: number; ty?: number; seat?: Seat }>(
  rows: string[],
  enemies: T[],
): void {
  const walk = standWalk(rows);
  for (const e of enemies) {
    if (!e.census || e.kind === "dummy") {
      e.seat = undefined;
      continue;
    }
    e.seat = seatOf(e.tx ?? 0, e.ty ?? 0, walk);
  }
}

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.round(v)) : 0;
}

export function sanitizeMarks(raw: unknown, difficultyOf: (v: unknown) => Difficulty): Record<string, LedgerMark> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, LedgerMark> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!/^stage\d+$/.test(key) || !value || typeof value !== "object" || Array.isArray(value)) continue;
    const m = value as Partial<LedgerMark>;
    if (!isGradeLetter(m.grade) || typeof m.points !== "number" || !Number.isFinite(m.points)) continue;
    out[key] = {
      grade: m.grade,
      points: Math.max(0, Math.round(m.points)),
      sentenceKilled: num(m.sentenceKilled),
      sentenceTotal: num(m.sentenceTotal),
      marginKilled: num(m.marginKilled),
      marginTotal: num(m.marginTotal),
      deaths: num(m.deaths),
      hits: num(m.hits),
      difficulty: difficultyOf(m.difficulty),
    };
  }
  return out;
}
