import { evaluate, isLength, maxGuesses, type Mark } from "./engine";

export const SEAT_MIN = 2;
export const SEAT_MAX = 20;
export const ROUND_MIN = 1;
export const ROUND_MAX = 6;

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type TableStatus = "lobby" | "live" | "done";
export type PlayStatus = "playing" | "won" | "lost";

export type BoardGuess = {
  word: string;
  marks: Mark[];
};

export type RoundCell = {
  status: PlayStatus;
  guesses: number;
  elapsedMs: number;
};

export type StandingRow = {
  userId: string;
  name: string;
  you: boolean;
  host: boolean;
  rank: number | null;
  finished: boolean;
  score: number | null;
  solved: number;
  missed: number;
  elapsedMs: number;
  roundsDone: number;
  rounds: RoundCell[];
};

export type FinishedRound = {
  roundIndex: number;
  answer: string;
  status: "won" | "lost";
  guesses: BoardGuess[];
};

export type TableView = {
  code: string;
  title: string;
  seats: number;
  rounds: number;
  length: number;
  status: TableStatus;
  youAreHost: boolean;
  players: { userId: string; name: string; you: boolean; host: boolean }[];
  board: {
    roundIndex: number;
    guesses: BoardGuess[];
    status: PlayStatus;
    answer: string | null;
    elapsedMs: number;
  } | null;
  words: (string | null)[];
  standings: StandingRow[];
  justFinished: FinishedRound | null;
};

export type TableSummary = {
  code: string;
  title: string;
  status: "lobby" | "live";
  seats: number;
  filled: number;
  rounds: number;
  length: number;
};

export function cleanLabel(raw: unknown, fallback: string, max: number): string {
  const text = typeof raw === "string" ? raw : "";
  const cleaned = text
    .replace(/[\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
  return cleaned || fallback;
}

export function normalizeCode(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
}

export function makeCode(randomIndex: (span: number) => number, size = 5): string {
  let code = "";
  for (let i = 0; i < size; i += 1) code += ALPHABET[randomIndex(ALPHABET.length)] ?? "A";
  return code;
}

export function pickDistinct(
  answers: readonly string[],
  count: number,
  randomIndex: (span: number) => number,
): string[] {
  const pool = answers.slice();
  const n = Math.min(count, pool.length);
  const out: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const j = i + randomIndex(pool.length - i);
    const chosen = pool[j] ?? pool[i] ?? "";
    pool[j] = pool[i] ?? "";
    pool[i] = chosen;
    if (chosen) out.push(chosen);
  }
  return out;
}

export function missCost(length: number): number {
  return maxGuesses(length) + 1;
}

export function roundCost(cell: RoundCell, length: number): number | null {
  if (cell.status === "playing") return null;
  if (cell.status === "won") return cell.guesses;
  return missCost(length);
}

type RankSeed = {
  userId: string;
  name: string;
  you: boolean;
  host: boolean;
  rounds: RoundCell[];
};

export function rankTable(players: readonly RankSeed[], length: number): StandingRow[] {
  const scored = players.map((player) => {
    const costs = player.rounds.map((cell) => roundCost(cell, length));
    const doneCosts = costs.filter((cost): cost is number => cost != null);
    const finished = player.rounds.length > 0 && costs.every((cost) => cost != null);
    const solved = player.rounds.filter((cell) => cell.status === "won").length;
    const missed = player.rounds.filter((cell) => cell.status === "lost").length;
    const elapsedMs = player.rounds.reduce((sum, cell) => sum + (cell.status === "playing" ? 0 : cell.elapsedMs), 0);
    return {
      userId: player.userId,
      name: player.name,
      you: player.you,
      host: player.host,
      rank: null as number | null,
      finished,
      score: finished ? doneCosts.reduce((sum, cost) => sum + cost, 0) : null,
      solved,
      missed,
      elapsedMs,
      roundsDone: doneCosts.length,
      rounds: player.rounds,
      partial: doneCosts.reduce((sum, cost) => sum + cost, 0),
    };
  });

  const finishers = scored
    .filter((row) => row.finished)
    .sort((a, b) => {
      if ((a.score ?? 0) !== (b.score ?? 0)) return (a.score ?? 0) - (b.score ?? 0);
      if (a.elapsedMs !== b.elapsedMs) return a.elapsedMs - b.elapsedMs;
      return a.name.localeCompare(b.name);
    });

  let rank = 0;
  let lastKey = "";
  finishers.forEach((row, index) => {
    const key = `${row.score}:${row.elapsedMs}`;
    if (key !== lastKey) {
      rank = index + 1;
      lastKey = key;
    }
    row.rank = rank;
  });

  const pending = scored
    .filter((row) => !row.finished)
    .sort((a, b) => {
      if (a.roundsDone !== b.roundsDone) return b.roundsDone - a.roundsDone;
      if (a.partial !== b.partial) return a.partial - b.partial;
      return a.name.localeCompare(b.name);
    });

  return [...finishers, ...pending].map((row) => ({
    userId: row.userId,
    name: row.name,
    you: row.you,
    host: row.host,
    rank: row.rank,
    finished: row.finished,
    score: row.score,
    solved: row.solved,
    missed: row.missed,
    elapsedMs: row.elapsedMs,
    roundsDone: row.roundsDone,
    rounds: row.rounds,
  }));
}

export function tableShare(view: Pick<TableView, "code" | "title" | "players">, row: StandingRow): string {
  const place = row.rank == null ? "Still playing" : placeLabel(row.rank, view.players.length);
  const score = row.score == null ? "" : `\n${row.score} ${row.score === 1 ? "guess" : "guesses"}`;
  return `Logostax table · ${view.code}\n${view.title}\n${place}${score}`;
}

function placeLabel(rank: number, size: number): string {
  const mod = rank % 100;
  const suffix = mod >= 11 && mod <= 13 ? "th" : rank % 10 === 1 ? "st" : rank % 10 === 2 ? "nd" : rank % 10 === 3 ? "rd" : "th";
  return `${rank}${suffix} of ${size}`;
}

export function leaderLine(view: Pick<TableView, "status" | "standings">): string | null {
  const leader = view.standings.find((row) => row.rank === 1);
  if (!leader) return view.status === "live" ? "No one has finished the words yet." : null;
  const tied = view.standings.filter((row) => row.rank === 1);
  const names = tied.map((row) => (row.you ? "You" : row.name));
  if (view.status !== "done") return "Places lock in when everyone has finished.";
  if (names.length === 1) return `${names[0]} ${names[0] === "You" ? "take" : "takes"} the table.`;
  return `${names.join(" and ")} tie for the table.`;
}

export function parseCreate(input: unknown): {
  title: string;
  seats: number;
  rounds: number;
  length: number;
  player: string;
} {
  if (!input || typeof input !== "object") throw new Error("Bad table");
  const raw = input as { title?: unknown; seats?: unknown; rounds?: unknown; length?: unknown; player?: unknown };
  const seats = raw.seats;
  const rounds = raw.rounds;
  const length = raw.length;
  if (typeof seats !== "number" || !Number.isInteger(seats) || seats < SEAT_MIN || seats > SEAT_MAX) {
    throw new Error("Pick how many seats");
  }
  if (typeof rounds !== "number" || !Number.isInteger(rounds) || rounds < ROUND_MIN || rounds > ROUND_MAX) {
    throw new Error("Pick how many words");
  }
  if (typeof length !== "number" || !isLength(length)) throw new Error("Bad length");
  return {
    title: cleanLabel(raw.title, "Open table", 32),
    seats,
    rounds,
    length,
    player: cleanLabel(raw.player, "Player", 24),
  };
}

export function parseJoin(input: unknown): { code: string; player: string } {
  const code = parseCode(input);
  const player = cleanLabel(
    input && typeof input === "object" ? (input as { player?: unknown }).player : undefined,
    "Player",
    24,
  );
  return { code, player };
}

export function parseCode(input: unknown): string {
  const code = normalizeCode(input && typeof input === "object" ? (input as { code?: unknown }).code : input);
  if (code.length !== 5) throw new Error("Enter the five-character code");
  return code;
}

export function parseGuess(input: unknown): { code: string; round: number; guess: string } {
  if (!input || typeof input !== "object") throw new Error("Bad guess");
  const raw = input as { code?: unknown; round?: unknown; guess?: unknown };
  const code = parseCode({ code: raw.code });
  const round = raw.round;
  if (typeof round !== "number" || !Number.isInteger(round) || round < 0 || round > 12) throw new Error("Bad word");
  const guess = typeof raw.guess === "string" ? raw.guess.toLowerCase().replace(/[^a-z]/g, "") : "";
  if (!guess) throw new Error("Type a word");
  return { code, round, guess };
}

export function marksFor(guesses: readonly string[], answer: string): BoardGuess[] {
  return guesses.map((word) => ({ word, marks: evaluate(word, answer) }));
}
