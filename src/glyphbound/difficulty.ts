import type { Difficulty } from "./types";

export const DIFFICULTIES: Difficulty[] = ["easy", "hard", "extreme"];

export function parseDifficulty(raw: unknown, hard?: boolean): Difficulty {
  if (raw === "easy" || raw === "hard" || raw === "extreme") return raw;
  if (hard === true) return "hard";
  return "easy";
}

export function cycleDifficulty(cur: Difficulty): Difficulty {
  const i = DIFFICULTIES.indexOf(cur);
  return DIFFICULTIES[(i + 1) % DIFFICULTIES.length] ?? "easy";
}

export function gradeLabel(d: Difficulty) {
  if (d === "hard") return "Hard";
  if (d === "extreme") return "Extreme";
  return "Easy";
}

export function hpMul(d: Difficulty) {
  if (d === "hard") return 1.6;
  if (d === "extreme") return 2.25;
  return 1;
}

export function enemyMul(d: Difficulty) {
  if (d === "hard") return 1.5;
  if (d === "extreme") return 2;
  return 1;
}

/** −1 = unlimited (Easy). */
export function livesFor(d: Difficulty) {
  if (d === "hard") return 3;
  if (d === "extreme") return 1;
  return -1;
}

export function scaledHp(base: number, d: Difficulty, kind?: string) {
  if (kind === "dummy") return base;
  return Math.ceil(base * hpMul(d));
}
