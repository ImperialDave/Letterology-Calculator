import { STOICHEIA, foldToStoicheia, stoichAt, type Stoich } from "./letters";

/** Name-letters only. ϛ ϟ ϡ are numerals, never seats of a handle. */
export const MILESIAN: Record<string, number> = {
  Α: 1,
  Β: 2,
  Γ: 3,
  Δ: 4,
  Ε: 5,
  Ζ: 7,
  Η: 8,
  Θ: 9,
  Ι: 10,
  Κ: 20,
  Λ: 30,
  Μ: 40,
  Ν: 50,
  Ξ: 60,
  Ο: 70,
  Π: 80,
  Ρ: 100,
  Σ: 200,
  Τ: 300,
  Υ: 400,
  Φ: 500,
  Χ: 600,
  Ψ: 700,
  Ω: 800,
};

const NUMERALS: { value: number; mark: string }[] = [
  { value: 900, mark: "ϡ" },
  { value: 800, mark: "Ω" },
  { value: 700, mark: "Ψ" },
  { value: 600, mark: "Χ" },
  { value: 500, mark: "Φ" },
  { value: 400, mark: "Υ" },
  { value: 300, mark: "Τ" },
  { value: 200, mark: "Σ" },
  { value: 100, mark: "Ρ" },
  { value: 90, mark: "ϟ" },
  { value: 80, mark: "Π" },
  { value: 70, mark: "Ο" },
  { value: 60, mark: "Ξ" },
  { value: 50, mark: "Ν" },
  { value: 40, mark: "Μ" },
  { value: 30, mark: "Λ" },
  { value: 20, mark: "Κ" },
  { value: 10, mark: "Ι" },
  { value: 9, mark: "Θ" },
  { value: 8, mark: "Η" },
  { value: 7, mark: "Ζ" },
  { value: 6, mark: "ϛ" },
  { value: 5, mark: "Ε" },
  { value: 4, mark: "Δ" },
  { value: 3, mark: "Γ" },
  { value: 2, mark: "Β" },
  { value: 1, mark: "Α" },
];

export function milesianValue(letter: Stoich): number {
  return MILESIAN[letter] ?? 0;
}

export function isopsephy(letters: Stoich[]): number {
  return letters.reduce((sum, letter) => sum + milesianValue(letter), 0);
}

/** Walk the 24-circle. We do not fold to a single digit. */
export function sitSum(sum: number): Stoich {
  if (sum <= 0) return "Α";
  return stoichAt((sum - 1) % 24);
}

/** How a Greek wrote a quantity. ϛ ϟ ϡ appear only here. */
export function spellQuantity(n: number | bigint): string {
  let value = typeof n === "bigint" ? Number(n) : Math.trunc(n);
  if (!Number.isFinite(value) || value <= 0) return "—";
  if (value > 999_999) value = value % 1_000_000;
  let leftover = value;
  let out = "";
  const thousands = Math.floor(leftover / 1000);
  if (thousands > 0) {
    out += `${spellQuantity(thousands)}ʹ`;
    leftover -= thousands * 1000;
  }
  for (const row of NUMERALS) {
    if (leftover >= row.value) {
      out += row.mark;
      leftover -= row.value;
    }
  }
  return out || "—";
}

export function stoicheiaOfRaw(raw: string): Stoich[] {
  return foldToStoicheia(raw);
}

export function alphabetLength(): number {
  return STOICHEIA.length;
}
