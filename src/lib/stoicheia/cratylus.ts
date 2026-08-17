import { familyOf } from "./family";
import type { Hora } from "./horae";
import type { Stoich } from "./letters";
import type { SomaWeight } from "./soma";

/** What the mouth does. From the Cratylus and the grammatical tradition. */
export type Charge = "run" | "stay" | "cut" | "hold" | "open" | "close";

export const CHARGES: Record<
  string,
  { charge: Charge; does: string }
> = {
  Α: { charge: "open", does: "it opens" },
  Β: { charge: "hold", does: "it stops on the lip" },
  Γ: { charge: "hold", does: "it cups" },
  Δ: { charge: "stay", does: "it binds" },
  Ε: { charge: "open", does: "it follows" },
  Ζ: { charge: "cut", does: "it seethes" },
  Η: { charge: "open", does: "it stretches" },
  Θ: { charge: "cut", does: "it breathes a stop" },
  Ι: { charge: "cut", does: "it pierces" },
  Κ: { charge: "hold", does: "it catches in the throat" },
  Λ: { charge: "stay", does: "it yields" },
  Μ: { charge: "stay", does: "it gathers" },
  Ν: { charge: "stay", does: "it stays in" },
  Ξ: { charge: "cut", does: "it doubles the blow" },
  Ο: { charge: "close", does: "it rounds" },
  Π: { charge: "hold", does: "it shuts the lip" },
  Ρ: { charge: "run", does: "it runs" },
  Σ: { charge: "cut", does: "it cuts air" },
  Τ: { charge: "stay", does: "it halts" },
  Υ: { charge: "open", does: "it mixes" },
  Φ: { charge: "cut", does: "it flares" },
  Χ: { charge: "cut", does: "it scrapes" },
  Ψ: { charge: "cut", does: "it doubles the blow" },
  Ω: { charge: "close", does: "it closes" },
};

const REALM_CHARGE: Record<string, Charge> = {
  "the three-way threshold": "open",
  "the descent": "stay",
  "the unargued rest": "stay",
  "the first dark": "open",
  "the psychopomp road": "run",
  "the unpaid blood": "cut",
  "the incubation": "stay",
  "the night festival": "open",
  "the assembled right": "hold",
  "the measured return": "close",
  "the city’s luck": "run",
  "the last door": "close",
  "the hearth": "stay",
  "the road and the market": "run",
  "the foam and the binding": "hold",
  "the measured light": "cut",
  "the wild margin": "run",
  "the clever city": "hold",
  "the open strife": "cut",
  "the high weather": "open",
  "the vowed bond": "hold",
  "the shaken floor": "run",
  "the grain and the grief": "stay",
  "the forge": "hold",
};

export function chargeOf(letter: Stoich): Charge {
  return CHARGES[letter]?.charge ?? "hold";
}

export function preferredCharge(hora: Hora): Charge {
  return REALM_CHARGE[hora.realm] ?? "hold";
}

export type Likeness = {
  score: number;
  like: boolean;
  line: string;
};

/** Whether the heaviest consonants agree with the hour the road finishes in. */
export function likenessOf(weights: SomaWeight[], last: Hora): Likeness {
  const want = preferredCharge(last);
  if (weights.length === 0) {
    return {
      score: 0.5,
      like: true,
      line: `The name has almost no consonants. The finish is ${last.noun}. The mouth does not argue.`,
    };
  }
  const total = weights.reduce((sum, row) => sum + row.weight, 0);
  const agreed = weights
    .filter((row) => chargeOf(row.letter) === want)
    .reduce((sum, row) => sum + row.weight, 0);
  const score = total === 0 ? 0.5 : agreed / total;
  const like = score >= 0.45;
  const lead = weights[0];
  const does = lead ? CHARGES[lead.letter]?.does ?? "it works" : "it works";
  return {
    score,
    like,
    line: like
      ? `This name is like itself. The heaviest sound ${does}, and ${last.noun} can use that. The mouth and the hour agree — a rare honesty. Keep it.`
      : `This name works against its own sounds. The heaviest sound ${does}, but the road finishes at ${last.noun}. That is not a defect. It is the argument the name is already having. Listen to it; do not pick a winner on day one.`,
  };
}

export function liquidWeight(weights: SomaWeight[]): number {
  return weights
    .filter((row) => familyOf(row.letter) === "liquid")
    .reduce((sum, row) => sum + row.weight, 0);
}
