export type FieldRow = {
  bestMs: number | null;
  bestGuesses: number | null;
};

export type FieldYou = {
  elapsedMs: number;
  guesses: number;
  won: boolean;
};

export type FieldReport = {
  players: number;
  solved: number;
  medianMs: number | null;
  fastestMs: number | null;
  medianGuesses: number | null;
  yourRank: number | null;
  fasterThanPct: number | null;
  fewerGuessesThanPct: number | null;
};

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const mid = Math.floor(values.length / 2);
  if (values.length % 2 === 1) return values[mid] ?? null;
  const left = values[mid - 1] ?? 0;
  const right = values[mid] ?? 0;
  return Math.round((left + right) / 2);
}

export function summarizeField(rows: readonly FieldRow[], you: FieldYou | null): FieldReport {
  const wins = rows
    .map((row) => ({
      ms: row.bestMs == null ? null : Number(row.bestMs),
      guesses: row.bestGuesses == null ? null : Number(row.bestGuesses),
    }))
    .filter((row): row is { ms: number; guesses: number } => row.ms != null && row.guesses != null && Number.isFinite(row.ms) && Number.isFinite(row.guesses));

  const times = wins.map((win) => win.ms).sort((a, b) => a - b);
  const guesses = wins.map((win) => win.guesses).sort((a, b) => a - b);
  const solved = wins.length;

  let yourRank: number | null = null;
  let fasterThanPct: number | null = null;
  let fewerGuessesThanPct: number | null = null;

  if (you?.won && solved > 0) {
    yourRank = times.filter((time) => time < you.elapsedMs).length + 1;
    const others = Math.max(0, solved - 1);
    if (others > 0) {
      fasterThanPct = Math.round((100 * times.filter((time) => time > you.elapsedMs).length) / others);
      fewerGuessesThanPct = Math.round((100 * guesses.filter((n) => n > you.guesses).length) / others);
    }
  }

  return {
    players: rows.length,
    solved,
    medianMs: median(times),
    fastestMs: times[0] ?? null,
    medianGuesses: median(guesses),
    yourRank,
    fasterThanPct,
    fewerGuessesThanPct,
  };
}

export type PuzzleSlice = {
  players: number;
  solved: number;
  rank: number | null;
  medianMs: number | null;
  fastestMs: number | null;
};

export function puzzleSlice(report: FieldReport): PuzzleSlice {
  return {
    players: report.players,
    solved: report.solved,
    rank: report.yourRank,
    medianMs: report.medianMs,
    fastestMs: report.fastestMs,
  };
}
