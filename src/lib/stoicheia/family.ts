import { VOWELS, type Stoich } from "./letters";

export type LetterFamily =
  | "vowel"
  | "unvoiced-stop"
  | "voiced-stop"
  | "aspirate"
  | "liquid"
  | "double"
  | "other";

export const FAMILIES: Record<
  LetterFamily,
  { letters: Stoich[]; english: string }
> = {
  vowel: { letters: ["Α", "Ε", "Η", "Ι", "Ο", "Υ", "Ω"], english: "a vowel — sung, not weighed" },
  "unvoiced-stop": { letters: ["Π", "Τ", "Κ"], english: "a hard, unvoiced stop" },
  "voiced-stop": { letters: ["Β", "Δ", "Γ"], english: "a hard, voiced stop" },
  aspirate: { letters: ["Φ", "Θ", "Χ"], english: "a hard, breathed stop" },
  liquid: { letters: ["Λ", "Ρ", "Μ", "Ν"], english: "a binding sound" },
  double: { letters: ["Ξ", "Ψ"], english: "two collisions in one mark" },
  other: { letters: ["Ζ"], english: "a rare edge" },
};

const STOP_SERIES: Stoich[][] = [
  ["Π", "Β", "Φ"],
  ["Τ", "Δ", "Θ"],
  ["Κ", "Γ", "Χ"],
];

export function familyOf(letter: Stoich): LetterFamily {
  if (VOWELS.has(letter)) return "vowel";
  for (const [name, pack] of Object.entries(FAMILIES)) {
    if (name === "vowel" || name === "other") continue;
    if (pack.letters.includes(letter)) return name as LetterFamily;
  }
  return "other";
}

export function familyEnglish(letter: Stoich): string {
  return FAMILIES[familyOf(letter)].english;
}

/** Letters that share a stop series (Π–Β–Φ) or the same family. */
export function seriesOf(letter: Stoich): Stoich[] {
  const row = STOP_SERIES.find((series) => series.includes(letter));
  if (row) return row.filter((item) => item !== letter);
  return FAMILIES[familyOf(letter)].letters.filter((item) => item !== letter);
}

export function sameFamily(a: Stoich, b: Stoich): boolean {
  if (a === b) return true;
  return seriesOf(a).includes(b) || familyOf(a) === familyOf(b);
}

export const FOLD_TABLE: { from: string; to: string }[] = [
  { from: "C", to: "Κ" },
  { from: "TH", to: "Θ" },
  { from: "PH", to: "Φ" },
  { from: "PS", to: "Ψ" },
  { from: "CH", to: "Χ" },
  { from: "J", to: "Ι" },
  { from: "U", to: "Υ" },
  { from: "V", to: "Β" },
  { from: "W", to: "Υ" },
  { from: "Y", to: "Ι" },
  { from: "F", to: "Φ" },
  { from: "Q", to: "Κ" },
  { from: "H", to: "(dropped, unless in TH / PH / CH)" },
];
