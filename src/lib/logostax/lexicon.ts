import { dailyAnswer, pickPractice, type Length } from "./engine";

export type Lexicon = {
  length: number;
  answers: string[];
  guess: Set<string>;
};

const cache = new Map<number, Lexicon>();

export async function loadLexicon(length: number): Promise<Lexicon> {
  const hit = cache.get(length);
  if (hit) return hit;
  const res = await fetch(`/logostax/lexicon/${length}.json`);
  if (!res.ok) throw new Error("The word list didn't load.");
  const data = (await res.json()) as { answers?: unknown; guesses?: unknown };
  if (!Array.isArray(data.answers) || typeof data.guesses !== "string") {
    throw new Error("The word list was unreadable.");
  }
  const answers = data.answers.filter((w): w is string => typeof w === "string" && w.length === length);
  if (answers.length === 0) throw new Error("The word list was empty.");
  const guess = new Set<string>();
  for (const word of data.guesses.split("\n")) {
    if (word.length === length) guess.add(word);
  }
  for (const word of answers) guess.add(word);
  const lex: Lexicon = { length, answers, guess };
  cache.set(length, lex);
  return lex;
}

export function answerFor(lex: Lexicon, mode: "daily" | "practice", date: string, avoid: string[] = []): string {
  if (mode === "daily") return dailyAnswer(lex.answers, date, lex.length as Length);
  return pickPractice(lex.answers, date, lex.length, avoid);
}
