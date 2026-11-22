import { shiftDate, type Kind } from "./engine";

export type { Kind };

export type HistoryEntry = {
  puzzleId: string;
  answer: string;
  length: number;
  kind: Kind;
  date: string;
  status: "won" | "lost";
  guesses: number;
  elapsedMs: number;
  hard: boolean;
  at: number;
  synced: boolean;
};

export type LengthRecord = {
  length: number;
  played: number;
  solved: number;
  bestMs: number | null;
};

export type PersonalStats = {
  played: number;
  solved: number;
  rate: number;
  bestMs: number | null;
  averageMs: number | null;
  averageGuesses: number | null;
  streak: number;
  bestStreak: number;
  byLength: LengthRecord[];
};

const CAP = 200;

export function upsertEntry(entries: readonly HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  const next = [entry, ...entries.filter((item) => item.puzzleId !== entry.puzzleId)];
  next.sort((a, b) => b.at - a.at);
  return next.slice(0, CAP);
}

export function mergeRemote(local: readonly HistoryEntry[], remote: readonly HistoryEntry[]): HistoryEntry[] {
  const map = new Map<string, HistoryEntry>();
  for (const entry of local) map.set(entry.puzzleId, entry);
  for (const entry of remote) map.set(entry.puzzleId, { ...entry, synced: true });
  return [...map.values()].sort((a, b) => b.at - a.at).slice(0, CAP);
}

export function withSynced(entries: readonly HistoryEntry[], ids: readonly string[]): HistoryEntry[] {
  const set = new Set(ids);
  return entries.map((entry) => (set.has(entry.puzzleId) ? { ...entry, synced: true } : entry));
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, n) => sum + n, 0) / values.length);
}

function todayMap(entries: readonly HistoryEntry[]): Map<string, boolean> {
  const byDate = new Map<string, boolean>();
  for (const entry of entries) {
    if (entry.kind !== "table" || entry.length !== 5) continue;
    const won = entry.status === "won";
    const prev = byDate.get(entry.date);
    byDate.set(entry.date, prev === undefined ? won : prev && won);
  }
  return byDate;
}

export function currentStreak(entries: readonly HistoryEntry[], today: string): number {
  const byDate = todayMap(entries);
  const cursorStart = byDate.has(today) ? today : shiftDate(today, -1);
  if (byDate.get(cursorStart) !== true) return 0;
  let cursor = cursorStart;
  let streak = 0;
  while (byDate.get(cursor) === true) {
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }
  return streak;
}

export function bestStreak(entries: readonly HistoryEntry[]): number {
  const dates = [...todayMap(entries).entries()].sort((a, b) => a[0].localeCompare(b[0]));
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const [date, won] of dates) {
    const continues = won && prev != null && date === shiftDate(prev, 1) && run > 0;
    run = won ? (continues ? run + 1 : 1) : 0;
    best = Math.max(best, run);
    prev = date;
  }
  return best;
}

export function personalStats(entries: readonly HistoryEntry[], today: string): PersonalStats {
  const wins = entries.filter((entry) => entry.status === "won");
  const byLength = new Map<number, LengthRecord>();
  for (const entry of entries) {
    const row = byLength.get(entry.length) ?? { length: entry.length, played: 0, solved: 0, bestMs: null };
    row.played += 1;
    if (entry.status === "won") {
      row.solved += 1;
      row.bestMs = row.bestMs == null ? entry.elapsedMs : Math.min(row.bestMs, entry.elapsedMs);
    }
    byLength.set(entry.length, row);
  }
  return {
    played: entries.length,
    solved: wins.length,
    rate: entries.length === 0 ? 0 : Math.round((100 * wins.length) / entries.length),
    bestMs: wins.length === 0 ? null : Math.min(...wins.map((entry) => entry.elapsedMs)),
    averageMs: average(wins.map((entry) => entry.elapsedMs)),
    averageGuesses: average(wins.map((entry) => entry.guesses)),
    streak: currentStreak(entries, today),
    bestStreak: bestStreak(entries),
    byLength: [...byLength.values()].sort((a, b) => a.length - b.length),
  };
}
