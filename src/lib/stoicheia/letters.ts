export type Stoich = string;

export const STOICHEIA = [
  "Α",
  "Β",
  "Γ",
  "Δ",
  "Ε",
  "Ζ",
  "Η",
  "Θ",
  "Ι",
  "Κ",
  "Λ",
  "Μ",
  "Ν",
  "Ξ",
  "Ο",
  "Π",
  "Ρ",
  "Σ",
  "Τ",
  "Υ",
  "Φ",
  "Χ",
  "Ψ",
  "Ω",
] as const;

export const VOWELS = new Set<Stoich>(["Α", "Ε", "Η", "Ι", "Ο", "Υ", "Ω"]);

export const DOUBLES = new Set<Stoich>(["Ξ", "Ψ"]);

const FOLD: Record<string, string> = {
  Α: "Α",
  Β: "Β",
  Γ: "Γ",
  Δ: "Δ",
  Ε: "Ε",
  Ζ: "Ζ",
  Η: "Η",
  Θ: "Θ",
  Ι: "Ι",
  Κ: "Κ",
  Λ: "Λ",
  Μ: "Μ",
  Ν: "Ν",
  Ξ: "Ξ",
  Ο: "Ο",
  Π: "Π",
  Ρ: "Ρ",
  Σ: "Σ",
  Ϲ: "Σ",
  ς: "Σ",
  Τ: "Τ",
  Υ: "Υ",
  Φ: "Φ",
  Χ: "Χ",
  Ψ: "Ψ",
  Ω: "Ω",
  A: "Α",
  B: "Β",
  C: "Κ",
  D: "Δ",
  E: "Ε",
  F: "Φ",
  G: "Γ",
  I: "Ι",
  J: "Ι",
  K: "Κ",
  L: "Λ",
  M: "Μ",
  N: "Ν",
  O: "Ο",
  P: "Π",
  Q: "Κ",
  R: "Ρ",
  S: "Σ",
  T: "Τ",
  U: "Υ",
  V: "Β",
  W: "Υ",
  X: "Ξ",
  Y: "Ι",
  Z: "Ζ",
};

export function stoichAt(index: number): Stoich {
  const n = ((index % 24) + 24) % 24;
  return STOICHEIA[n] ?? "Α";
}

export function stoichIndex(letter: Stoich): number {
  return STOICHEIA.indexOf(letter as (typeof STOICHEIA)[number]);
}

export function isVowel(letter: Stoich): boolean {
  return VOWELS.has(letter);
}

/** Strip polytonic marks, fold Latin, keep only the twenty-four. */
export function foldToStoicheia(raw: string): Stoich[] {
  const folded = raw
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ς/g, "Σ")
    .toUpperCase();
  const out: Stoich[] = [];
  for (let i = 0; i < folded.length; i += 1) {
    const pair = folded.slice(i, i + 2);
    if (pair === "TH") {
      out.push("Θ");
      i += 1;
      continue;
    }
    if (pair === "PH") {
      out.push("Φ");
      i += 1;
      continue;
    }
    if (pair === "PS") {
      out.push("Ψ");
      i += 1;
      continue;
    }
    if (pair === "CH") {
      out.push("Χ");
      i += 1;
      continue;
    }
    const mapped = FOLD[folded[i] ?? ""];
    if (mapped) out.push(mapped);
  }
  return out;
}

export function displayStoicheia(letters: Stoich[]): string {
  return letters.join("");
}
