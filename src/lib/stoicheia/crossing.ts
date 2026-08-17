import { foldToStoicheia } from "./letters";

export type Crossing = {
  alreadyGreek: boolean;
  steps: string[];
  line: string;
};

const CHANGE: Record<string, string> = {
  C: "Κ",
  F: "Φ",
  J: "Ι",
  Q: "Κ",
  U: "Υ",
  V: "Β",
  W: "Υ",
  Y: "Ι",
};

export function crossingOf(raw: string): Crossing {
  const folded = foldToStoicheia(raw);
  const stripped = raw
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^A-Za-zΑ-Ωα-ω]/g, "")
    .toUpperCase();
  const greekOnly = [...stripped].every((ch) => /[Α-Ω]/.test(ch));
  if (greekOnly || folded.length === 0) {
    return {
      alreadyGreek: true,
      steps: [],
      line: "No crossing. The name was already in the twenty-four.",
    };
  }
  const steps: string[] = [];
  const seen = new Set<string>();
  const upper = stripped.replace(/TH/g, "Θ").replace(/PH/g, "Φ").replace(/PS/g, "Ψ").replace(/CH/g, "Χ");
  for (const ch of upper) {
    if (CHANGE[ch] && !seen.has(ch)) {
      seen.add(ch);
      steps.push(`${ch} became ${CHANGE[ch]}`);
    }
  }
  if (/TH/i.test(stripped) && !seen.has("TH")) steps.unshift("TH became Θ");
  if (/PH/i.test(stripped)) steps.push("PH became Φ");
  if (/CH/i.test(stripped)) steps.push("CH became Χ");
  if (/PS/i.test(stripped)) steps.push("PS became Ψ");
  const unique = [...new Set(steps)];
  return {
    alreadyGreek: false,
    steps: unique,
    line:
      unique.length === 0
        ? "The Latin letters were already the Greek ones, mark for mark."
        : `The name entered by changing its mouth. ${unique.join(". ")}.`,
  };
}
