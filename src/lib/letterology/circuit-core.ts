import { houseOf } from "./archetypes";
import { bondCopy, relationTo } from "./circle";
import {
  betweennessOf,
  closenessOf,
  hopDistance,
  hopPhrase,
  resonanceOf,
} from "./geometry";
import { themeOf } from "./lexicon";
import type { Horoscope, Letter, MeetKind } from "./types";

export type BondWeather =
  | "kinship"
  | "homecoming"
  | "crossing"
  | "friction"
  | "exile"
  | "ordinary"
  | "pact"
  | "forge"
  | "orbit"
  | "echo"
  | "harvest"
  | "veil"
  | "carnival";

/** Letter grade of the circuit — the headline verdict. No plus/minus. */
export type BondGrade = "A" | "B" | "C" | "D" | "F";

/** Composition class under the grade. */
export type CircuitClass =
  | "bound"
  | "crossing"
  | "orbit"
  | "friction"
  | "exile"
  | "foreign";

export type GiftGate = "both" | "one" | "bare";

export type BondLean = "complement" | "both-in" | "both-out";

export interface SeatMeet {
  seat: "house" | "manner" | "field";
  label: string;
  a: Letter;
  b: Letter;
  aNoun: string;
  bNoun: string;
  kind: MeetKind;
  copy: string;
}

export interface BondAxes {
  role: number;
  method: number;
  place: number;
  overlap: number;
  exchange: number;
  temper: number;
  court: number;
  spark: number;
}

export interface BondRooms {
  morning: string;
  work: string;
  fight: string;
  repair: string;
}

/** The three decisive gates of the Bond-as-Circuit doctrine. */
export interface BondGates {
  role: MeetKind;
  gift: GiftGate;
  method: MeetKind;
  field: MeetKind;
}

export const GRADE_LABEL: Record<BondGrade, string> = {
  A: "Pact",
  B: "Crossing",
  C: "Orbit",
  D: "Friction",
  F: "Exile",
};

export const GRADE_COUNSEL: Record<BondGrade, string> = {
  A: "The materials already know the work. Protect the hours. Name the gift. Do not improve what is already a machine.",
  B: "Structural argument with exchange — the good strife. Stay if the work is worth the heat. Keep the fight about the job.",
  C: "Roles help or a gift appears, but the custom is unfinished. Workable if both invent what the letters left open.",
  D: "Teaching weather. Useful only if nobody pretends it is easy. Stay for the lesson or name the distance.",
  F: "The letters refuse a soft story. Invent everything or walk past. Do not convert each other.",
};

/** Weight band inside each grade — never used as the headline. */
export const GRADE_WEIGHT: Record<BondGrade, [number, number]> = {
  A: [78, 96],
  B: [58, 74],
  C: [46, 54],
  D: [26, 42],
  F: [8, 22],
};

export function gradeLabel(grade: BondGrade): string {
  return GRADE_LABEL[grade];
}

export function gradeCounsel(grade: BondGrade): string {
  return GRADE_COUNSEL[grade];
}

export function spoken(h: Horoscope): string {
  return h.displayName.replace(/^@+/, "").trim() || h.displayName;
}

export function meet(a: Letter, b: Letter): MeetKind {
  if (a === b) return "same";
  return relationTo(a, b) ?? "none";
}

export function leanOf(h: Horoscope): "in" | "out" {
  const inner = h.vowels.reduce((sum, item) => sum + item.weight, 0);
  const outer = h.consonants.reduce((sum, item) => sum + item.weight, 0);
  return inner >= outer ? "in" : "out";
}

export function weightMap(h: Horoscope): Map<Letter, number> {
  const map = new Map<Letter, number>();
  for (const item of h.inventory) map.set(item.letter, item.weight);
  return map;
}

export function lettersOf(h: Horoscope): Letter[] {
  return h.inventory.map((item) => item.letter);
}

export function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

export function vowelRatio(h: Horoscope): number {
  const inner = h.vowels.reduce((sum, item) => sum + item.weight, 0);
  const total = h.inventory.reduce((sum, item) => sum + item.weight, 0) || 1;
  return inner / total;
}

export function weightedOverlap(a: Horoscope, b: Horoscope): number {
  const mapA = weightMap(a);
  const mapB = weightMap(b);
  const keys = new Set([...mapA.keys(), ...mapB.keys()]);
  let inter = 0;
  let union = 0;
  for (const letter of keys) {
    const wa = mapA.get(letter) ?? 0;
    const wb = mapB.get(letter) ?? 0;
    inter += Math.min(wa, wb);
    union += Math.max(wa, wb);
  }
  return union === 0 ? 0 : inter / union;
}

export function courtToward(self: Horoscope, otherLetters: Set<Letter>): number {
  const allyHits = self.allies.filter((letter) => otherLetters.has(letter));
  const enemyHits = self.enemies.filter((letter) => otherLetters.has(letter));
  const allyWeight = allyHits.reduce((sum, letter) => sum + 18 + closenessOf(letter) * 80, 0);
  const enemyWeight = enemyHits.reduce((sum, letter) => sum + 10 + betweennessOf(letter) * 40, 0);
  return 20 + allyWeight - enemyWeight;
}

export function themeToward(self: Horoscope, other: Horoscope, otherLetters: Set<Letter>): number {
  const complements = themeOf(self.primary.letter).complements.filter((letter) =>
    otherLetters.has(letter),
  ).length;
  return resonanceOf(self.primary.letter, other.primary.letter) * 0.62 + Math.min(3, complements) * 12;
}

export function pairSeed(a: Horoscope, b: Horoscope, shared: Letter[]): number {
  const left = a.normalized <= b.normalized ? a : b;
  const right = a.normalized <= b.normalized ? b : a;
  const key = `${left.normalized}\0${right.normalized}\0${left.archetype.code}\0${right.archetype.code}\0${shared.join("")}`;
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seatCopy(
  seat: SeatMeet["seat"],
  kind: MeetKind,
  a: Letter,
  b: Letter,
  nameA: string,
  nameB: string,
): string {
  const aHouse = houseOf(a);
  const bHouse = houseOf(b);
  const aTheme = themeOf(a);
  const bTheme = themeOf(b);
  if (seat === "house") {
    if (kind === "same") {
      return `${nameA} and ${nameB} both sit the ${aHouse.house}. Same role — ${aHouse.myth} Two lives inside it, not one person twice.`;
    }
    if (kind === "ally") return `${nameA} as ${aHouse.noun}, ${nameB} as ${bHouse.noun}. ${bondCopy(a, b, "ally")}`;
    if (kind === "enemy") return `${nameA} as ${aHouse.noun}, ${nameB} as ${bHouse.noun}. ${bondCopy(a, b, "enemy")}`;
    return `${nameA} sits ${aHouse.noun} (${aTheme.name.toLowerCase()}); ${nameB} sits ${bHouse.noun} (${bTheme.name.toLowerCase()}). No official bond — ${hopPhrase(hopDistance(a, b))} between them. The work still happens.`;
  }
  if (seat === "manner") {
    if (kind === "same") {
      return `They work the same way — ${aTheme.name.toLowerCase()}, the ${aHouse.adj.toLowerCase()} manner. Echo, not a spare method. ${aHouse.method}`;
    }
    if (kind === "ally") {
      return `How they work completes each other: ${nameA}'s ${aHouse.adj.toLowerCase()} manner beside ${nameB}'s ${bHouse.adj.toLowerCase()} one. ${aHouse.method} ${bHouse.method}`;
    }
    if (kind === "enemy") {
      return `How they work pushes back: ${aHouse.adj.toLowerCase()} against ${bHouse.adj.toLowerCase()}. Useful if nobody pretends it is easy. ${aHouse.method} ${bHouse.method}`;
    }
    return `${nameA} works by ${aTheme.name.toLowerCase()}; ${nameB} by ${bTheme.name.toLowerCase()}. Different manners, no official argument. They invent the method together.`;
  }
  if (kind === "same") {
    return `They work in the same kind of place — the ${aHouse.realm}. ${aHouse.field}`;
  }
  if (kind === "ally") {
    return `Their fields help each other: ${nameA} in the ${aHouse.realm}, ${nameB} in the ${bHouse.realm}. ${aHouse.field} ${bHouse.field}`;
  }
  if (kind === "enemy") {
    return `Their fields rub: the ${aHouse.realm} against the ${bHouse.realm}. ${aHouse.field} ${bHouse.field}`;
  }
  return `${nameA}'s work lives in the ${aHouse.realm}; ${nameB}'s in the ${bHouse.realm}. They do not share a field. The rooms will have to be built.`;
}

/**
 * Bond-as-Circuit composition.
 * Decisive gates first. Grade is the composition, not a blend.
 * C is rare by design — only when the gates truly leave a workable opening.
 */
export function composeCircuit(input: {
  role: MeetKind;
  gift: GiftGate;
  method: MeetKind;
  field: MeetKind;
  spark: number;
  sharedCount: number;
  overlapRatio: number;
}): { circuit: CircuitClass; grade: BondGrade } {
  const { role, gift, method, field, spark, sharedCount, overlapRatio } = input;
  const giftOpen = gift !== "bare";
  const roleOpen = role === "same" || role === "ally";
  const roleHard = role === "enemy";
  const roleForeign = role === "none";
  const methodHelps = method === "ally" || method === "same";
  const methodGrinds = method === "enemy";
  const fieldHelps = field === "ally" || field === "same";
  const materialBridge = sharedCount >= 2 || overlapRatio >= 0.28;
  const highSpark = spark >= 62;
  const lowSpark = spark <= 28;

  let circuit: CircuitClass;

  if (role === "same") {
    circuit = "bound";
  } else if (roleOpen && giftOpen) {
    circuit = "bound";
  } else if (roleHard && giftOpen) {
    circuit = "crossing";
  } else if (roleForeign && gift === "both") {
    circuit = "bound";
  } else if (roleForeign && gift === "one") {
    circuit = "orbit";
  } else if (roleOpen && !giftOpen) {
    if (methodHelps || fieldHelps || materialBridge) circuit = "orbit";
    else if (methodGrinds && highSpark) circuit = "friction";
    else circuit = "orbit";
  } else if (roleHard && !giftOpen) {
    if (methodGrinds || (!methodHelps && !materialBridge)) {
      circuit = lowSpark && !materialBridge ? "exile" : "friction";
    } else {
      circuit = "friction";
    }
  } else {
    if (materialBridge && (methodHelps || fieldHelps)) circuit = "orbit";
    else if (materialBridge && highSpark) circuit = "friction";
    else circuit = "foreign";
  }

  if (circuit === "bound" && roleHard) {
    circuit = "crossing";
  }
  if (circuit === "orbit" && !giftOpen && methodGrinds && highSpark && !materialBridge) {
    circuit = "friction";
  }
  if (circuit === "friction" && giftOpen) {
    circuit = "crossing";
  }
  if (circuit === "foreign" && giftOpen) {
    circuit = gift === "both" ? "bound" : "orbit";
  }
  if (circuit === "exile" && (giftOpen || materialBridge)) {
    circuit = "friction";
  }

  const grade: BondGrade =
    circuit === "bound"
      ? "A"
      : circuit === "crossing"
        ? "B"
        : circuit === "orbit"
          ? "C"
          : circuit === "friction"
            ? "D"
            : "F";

  return { circuit, grade };
}

export function weightInsideGrade(grade: BondGrade, axes: BondAxes, giftCount: number, seed: number): number {
  const [lo, hi] = GRADE_WEIGHT[grade];
  const span = hi - lo;
  const quality =
    axes.role * 0.28 +
    axes.exchange * 0.22 +
    axes.method * 0.16 +
    axes.overlap * 0.14 +
    axes.court * 0.1 +
    (100 - axes.spark) * 0.05 +
    Math.min(3, giftCount) * 4;
  const normalized = clamp(quality, 0, 100) / 100;
  const jitter = ((seed % 7) - 3) * 0.4;
  return clamp(lo + normalized * span + jitter, lo, hi);
}

export function weatherOf(input: {
  role: MeetKind;
  manner: MeetKind;
  circuit: CircuitClass;
  grade: BondGrade;
  gifts: number;
  axes: BondAxes;
  lean: BondLean;
}): BondWeather {
  const { role, manner, circuit, grade, gifts, axes, lean } = input;

  if (circuit === "bound") {
    if (role === "same") return "homecoming";
    if (axes.spark >= 64 && axes.overlap >= 40) return "forge";
    if (gifts >= 2 || axes.exchange >= 70) return "pact";
    if (role === "ally") return "kinship";
    return "pact";
  }
  if (circuit === "crossing") {
    if (axes.spark >= 70) return "forge";
    return "crossing";
  }
  if (circuit === "orbit") {
    if (manner === "same") return "echo";
    if (lean === "complement" && axes.overlap < 32) return "orbit";
    if (axes.place >= 70 && axes.exchange >= 48) return "harvest";
    if (lean === "both-in" && axes.role < 55) return "veil";
    if (lean === "both-out" && axes.method < 48) return "carnival";
    return "orbit";
  }
  if (circuit === "friction") {
    if (role === "enemy" && gifts === 0 && axes.spark < 40) return "exile";
    return "friction";
  }
  if (circuit === "exile" || circuit === "foreign") {
    return grade === "F" && axes.overlap < 20 ? "exile" : "ordinary";
  }
  return "ordinary";
}
