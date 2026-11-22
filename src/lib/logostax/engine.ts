import { formatClock } from "./clock";

export const LENGTHS = [3, 4, 5, 6, 7, 8] as const;
export type Length = (typeof LENGTHS)[number];
export type Mode = "today" | "open";
export type Kind = "table" | "deal";
export type Status = "playing" | "won" | "lost";
export type Mark = "correct" | "present" | "absent";

export const WORD_OF_THE_DAY_LENGTH = 5;

export type Session = {
  length: number;
  kind: Kind;
  answer: string;
  date: string;
  guesses: string[];
  draft: string;
  status: Status;
  recorded: boolean;
  elapsedMs: number;
  runningSince: number | null;
  puzzleId: string;
};

export type Settings = {
  version: 1;
  length: number;
  mode: Mode;
  hard: boolean;
};

const ORDINALS = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth"];

const CARDINALS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight"];

export function isLength(n: number): n is Length {
  return LENGTHS.includes(n as Length);
}

export function maxGuesses(length: number): number {
  if (length >= 8) return 8;
  if (length === 7) return 7;
  return 6;
}

export function utcDate(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function shiftDate(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function dailyAnswer(answers: readonly string[], date: string, length: number): string {
  const index = hashString(`${date}:${length}:fivefold`) % answers.length;
  return answers[index] ?? answers[0] ?? "";
}

export function pickPractice(
  answers: readonly string[],
  date: string,
  length: number,
  avoid: string[] = [],
): string {
  const daily = dailyAnswer(answers, date, length);
  const banned = new Set([daily, ...avoid]);
  const pool = answers.filter((w) => !banned.has(w) && w.length === length);
  const source = pool.length > 0 ? pool : answers.filter((w) => w.length === length);
  const usable = source.length > 0 ? source : answers;
  const index = Math.floor(Math.random() * usable.length);
  return usable[index] ?? daily;
}

export function evaluate(guess: string, answer: string): Mark[] {
  const n = guess.length;
  const marks: Mark[] = Array.from({ length: n }, () => "absent");
  const pool = answer.split("");
  for (let i = 0; i < n; i++) {
    if (guess[i] === answer[i]) {
      marks[i] = "correct";
      pool[i] = "";
    }
  }
  for (let i = 0; i < n; i++) {
    if (marks[i] === "correct") continue;
    const j = pool.indexOf(guess[i] ?? "");
    if (j !== -1) {
      marks[i] = "present";
      pool[j] = "";
    }
  }
  return marks;
}

export function rank(mark: Mark): number {
  if (mark === "correct") return 3;
  if (mark === "present") return 2;
  return 1;
}

export function hardViolation(guess: string, previous: readonly string[], answer: string): string | null {
  for (const prev of previous) {
    const marks = evaluate(prev, answer);
    for (let i = 0; i < marks.length; i++) {
      if (marks[i] === "correct" && guess[i] !== prev[i]) {
        const place = ORDINALS[i] ?? `letter ${i + 1}`;
        return `The ${place} letter must be ${(prev[i] ?? "").toUpperCase()}`;
      }
    }
    const need: Record<string, number> = {};
    for (let i = 0; i < marks.length; i++) {
      if (marks[i] === "absent") continue;
      const ch = prev[i] ?? "";
      need[ch] = (need[ch] ?? 0) + 1;
    }
    const have: Record<string, number> = {};
    for (const ch of guess) have[ch] = (have[ch] ?? 0) + 1;
    for (const ch of Object.keys(need)) {
      if ((have[ch] ?? 0) < (need[ch] ?? 0)) {
        return `Guess must use ${ch.toUpperCase()}`;
      }
    }
  }
  return null;
}

export function collectKeyMarks(guesses: readonly string[], answer: string): Record<string, Mark> {
  const keys: Record<string, Mark> = {};
  for (const guess of guesses) {
    const marks = evaluate(guess, answer);
    for (let i = 0; i < guess.length; i++) {
      const ch = guess[i] ?? "";
      const mark = marks[i];
      if (!mark) continue;
      const prev = keys[ch];
      if (!prev || rank(mark) > rank(prev)) keys[ch] = mark;
    }
  }
  return keys;
}

export function solvedLine(n: number): string {
  const word = CARDINALS[n] ?? String(n);
  return n === 1 ? "Solved in one guess." : `Solved in ${word}.`;
}

export function needLetters(n: number): string {
  return `Need ${n} ${n === 1 ? "letter" : "letters"}`;
}

export function shareMarks(session: Session): string {
  return session.guesses
    .map((guess) =>
      evaluate(guess, session.answer)
        .map((mark) => (mark === "correct" ? "●" : mark === "present" ? "◌" : "·"))
        .join(""),
    )
    .join("\n");
}

export function shareText(session: Session, hard: boolean): string {
  const max = maxGuesses(session.length);
  const score = session.status === "won" ? String(session.guesses.length) : "–";
  const label = session.kind === "table" && session.length === WORD_OF_THE_DAY_LENGTH ? "Word of the day" : `${session.length} letters`;
  const hardBit = hard ? " · hard" : "";
  return `Logostax · ${label}\n${formatClock(session.elapsedMs)} · ${score}/${max}${hardBit}\n${shareMarks(session)}`;
}

export function prettyDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function puzzleIdFor(kind: Kind, length: number, date: string): string {
  if (kind === "deal") return `deal:${length}:${date}:${Math.random().toString(36).slice(2, 10)}`;
  return `daily:${length}:${date}`;
}

export function freshSession(partial: {
  length: number;
  kind: Kind;
  answer: string;
  date: string;
  puzzleId?: string;
}): Session {
  const length = partial.length;
  const kind = partial.kind;
  return {
    length,
    kind,
    answer: partial.answer,
    date: partial.date,
    guesses: [],
    draft: "",
    status: "playing",
    recorded: false,
    elapsedMs: 0,
    runningSince: null,
    puzzleId: partial.puzzleId ?? puzzleIdFor(kind, length, partial.date),
  };
}

/** True when the length control would not change the live puzzle. */
export function lengthAlreadyShowing(current: Session | null, requested: number, mode: Mode): boolean {
  if (!isLength(requested) || !current) return false;
  if (mode !== "open") return false;
  return current.length === requested && current.answer.length === requested;
}

/**
 * What a length-button click should do.
 * Returns null when the board is already that puzzle.
 * 5 is a real length. Only the Today control opens the word of the day.
 */
export function nextLengthSettings(current: Session | null, settings: Settings, requested: number): Settings | null {
  if (!isLength(requested)) return null;
  if (
    requested === WORD_OF_THE_DAY_LENGTH &&
    settings.mode === "today" &&
    current?.kind === "table" &&
    current.length === WORD_OF_THE_DAY_LENGTH &&
    current.answer.length === WORD_OF_THE_DAY_LENGTH
  ) {
    return null;
  }
  if (settings.mode === "open" && settings.length === requested && lengthAlreadyShowing(current, requested, "open")) {
    return null;
  }
  return { ...settings, mode: "open", length: requested };
}
