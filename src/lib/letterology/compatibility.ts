import { houseOf } from "./archetypes";
import { composeBondStory } from "./bond-narrative";
import { bondCopy, relationTo } from "./circle";
import { buildHoroscope } from "./engine";
import {
  betweennessOf,
  closenessOf,
  hopDistance,
  hopPhrase,
  pairGeometry,
  resonanceOf,
  type PairGeometry,
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

export interface BondReading {
  a: Horoscope;
  b: Horoscope;
  affinity: number;
  weather: BondWeather;
  title: string;
  headline: string;
  epithet: string;
  sigil: string;
  verdict: string;
  plainly: string;
  invitation: string;
  made: string;
  owed: string;
  argument: string;
  rooms: BondRooms;
  axes: BondAxes;
  axisHints: Record<keyof BondAxes, string>;
  seats: SeatMeet[];
  shared: Letter[];
  onlyA: Letter[];
  onlyB: Letter[];
  giftsAtoB: Letter[];
  giftsBtoA: Letter[];
  coversA: Letter[];
  coversB: Letter[];
  innerOuter: BondLean;
  geometry: PairGeometry;
  seed: number;
}

function spoken(h: Horoscope): string {
  return h.displayName.replace(/^@+/, "").trim() || h.displayName;
}

function meet(a: Letter, b: Letter): MeetKind {
  if (a === b) return "same";
  return relationTo(a, b) ?? "none";
}

function leanOf(h: Horoscope): "in" | "out" {
  const inner = h.vowels.reduce((sum, item) => sum + item.weight, 0);
  const outer = h.consonants.reduce((sum, item) => sum + item.weight, 0);
  return inner >= outer ? "in" : "out";
}

function weightMap(h: Horoscope): Map<Letter, number> {
  const map = new Map<Letter, number>();
  for (const item of h.inventory) map.set(item.letter, item.weight);
  return map;
}

function lettersOf(h: Horoscope): Letter[] {
  return h.inventory.map((item) => item.letter);
}

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function vowelRatio(h: Horoscope): number {
  const inner = h.vowels.reduce((sum, item) => sum + item.weight, 0);
  const total = h.inventory.reduce((sum, item) => sum + item.weight, 0) || 1;
  return inner / total;
}

function weightedOverlap(a: Horoscope, b: Horoscope): number {
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

function courtToward(self: Horoscope, otherLetters: Set<Letter>): number {
  const allyHits = self.allies.filter((letter) => otherLetters.has(letter));
  const enemyHits = self.enemies.filter((letter) => otherLetters.has(letter));
  const allyWeight = allyHits.reduce((sum, letter) => sum + 18 + closenessOf(letter) * 80, 0);
  const enemyWeight = enemyHits.reduce((sum, letter) => sum + 10 + betweennessOf(letter) * 40, 0);
  return 20 + allyWeight - enemyWeight;
}

function themeToward(self: Horoscope, other: Horoscope, otherLetters: Set<Letter>): number {
  const complements = themeOf(self.primary.letter).complements.filter((letter) => otherLetters.has(letter)).length;
  return resonanceOf(self.primary.letter, other.primary.letter) * 0.62 + Math.min(3, complements) * 12;
}

function pairSeed(a: Horoscope, b: Horoscope, shared: Letter[]): number {
  const key = `${a.normalized}\0${b.normalized}\0${a.archetype.code}\0${b.archetype.code}\0${shared.join("")}`;
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seatCopy(seat: SeatMeet["seat"], kind: MeetKind, a: Letter, b: Letter, nameA: string, nameB: string): string {
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

function weatherOf(input: {
  house: MeetKind;
  manner: MeetKind;
  affinity: number;
  gifts: number;
  axes: BondAxes;
  lean: BondLean;
}): BondWeather {
  const { house, manner, affinity, gifts, axes, lean } = input;
  if (house === "same") return "homecoming";
  if (house === "ally" && affinity >= 55) return "kinship";
  if (axes.spark >= 64 && axes.overlap >= 48) return "forge";
  if (axes.exchange >= 72 && house !== "enemy") return "pact";
  if (house === "enemy") {
    if (affinity <= 36 && gifts === 0) return "exile";
    if (affinity >= 52 || gifts >= 2) return "crossing";
    return "friction";
  }
  if (manner === "same") return "echo";
  if (axes.place >= 70 && axes.exchange >= 48) return "harvest";
  if (lean === "complement" && axes.overlap < 30) return "orbit";
  if (lean === "both-in" && axes.role < 55) return "veil";
  if (lean === "both-out" && axes.method < 48) return "carnival";
  if (affinity >= 62 || gifts >= 2) return "crossing";
  return "ordinary";
}

export function compareNames(rawA: string, rawB: string): BondReading | null {
  const a = buildHoroscope(rawA);
  const b = buildHoroscope(rawB);
  if (!a || !b) return null;

  const [aHouse, aManner, aField] = a.triad;
  const [bHouse, bManner, bField] = b.triad;
  const houseKind = meet(aHouse, bHouse);
  const mannerKind = meet(aManner, bManner);
  const fieldKind = meet(aField, bField);

  const seats: SeatMeet[] = [
    {
      seat: "house",
      label: "House",
      a: aHouse,
      b: bHouse,
      aNoun: houseOf(aHouse).noun,
      bNoun: houseOf(bHouse).noun,
      kind: houseKind,
      copy: seatCopy("house", houseKind, aHouse, bHouse, spoken(a), spoken(b)),
    },
    {
      seat: "manner",
      label: "Manner",
      a: aManner,
      b: bManner,
      aNoun: houseOf(aManner).noun,
      bNoun: houseOf(bManner).noun,
      kind: mannerKind,
      copy: seatCopy("manner", mannerKind, aManner, bManner, spoken(a), spoken(b)),
    },
    {
      seat: "field",
      label: "Field",
      a: aField,
      b: bField,
      aNoun: houseOf(aField).noun,
      bNoun: houseOf(bField).noun,
      kind: fieldKind,
      copy: seatCopy("field", fieldKind, aField, bField, spoken(a), spoken(b)),
    },
  ];

  const setA = new Set(lettersOf(a));
  const setB = new Set(lettersOf(b));
  const shared = [...setA].filter((letter) => setB.has(letter)).sort();
  const onlyA = [...setA].filter((letter) => !setB.has(letter)).sort();
  const onlyB = [...setB].filter((letter) => !setA.has(letter)).sort();

  const giftsAtoB = a.kinAbsent.filter((letter) => setB.has(letter));
  const giftsBtoA = b.kinAbsent.filter((letter) => setA.has(letter));
  const coversA = a.shadows.filter((letter) => setB.has(letter));
  const coversB = b.shadows.filter((letter) => setA.has(letter));

  const aLean = leanOf(a);
  const bLean = leanOf(b);
  const innerOuter: BondLean = aLean !== bLean ? "complement" : aLean === "in" ? "both-in" : "both-out";

  const giftCount = giftsAtoB.length + giftsBtoA.length;
  const coverCount = coversA.length + coversB.length;
  const overlapRatio = weightedOverlap(a, b);
  const geo = pairGeometry(a, b);

  const role = geo.resonance.house;
  const method = geo.resonance.manner;
  const place = geo.resonance.field;
  const overlap = clamp(overlapRatio * 42 + geo.overlapJS * 0.33 + geo.transport * 0.25);
  const giftWeight =
    [...giftsAtoB, ...giftsBtoA].reduce((sum, letter) => sum + 12 + betweennessOf(letter) * 50, 0) +
    coverCount * 8;
  const exchange = clamp(16 + giftWeight + Math.min(10, shared.length) * 2);
  const temper =
    innerOuter === "complement" ? 84 : innerOuter === "both-in" ? 49 : 54;
  const court = clamp((courtToward(a, setB) + courtToward(b, setA)) / 2);
  const theme = (themeToward(a, b, setB) + themeToward(b, a, setA)) / 2;
  const spark = clamp(
    (100 - geo.resonance.house) * 0.5 +
      (100 - geo.resonance.manner) * 0.3 +
      (100 - geo.resonance.field) * 0.2,
  );
  const rhythm = clamp(
    geo.circleFit * 0.55 +
      (1 - Math.abs(vowelRatio(a) - vowelRatio(b))) * 45,
  );

  const axes: BondAxes = { role, method, place, overlap, exchange, temper, court, spark };

  const raw =
    role * 0.2 +
    method * 0.11 +
    place * 0.08 +
    overlap * 0.13 +
    exchange * 0.12 +
    temper * 0.07 +
    court * 0.1 +
    theme * 0.08 +
    rhythm * 0.06 +
    (100 - spark) * 0.05;

  const affinity = clamp(raw, 8, 99);
  const weather = weatherOf({
    house: houseKind,
    manner: mannerKind,
    affinity,
    gifts: giftCount,
    axes,
    lean: innerOuter,
  });
  const seed = pairSeed(a, b, shared);
  const story = composeBondStory({
    a,
    b,
    weather,
    affinity,
    axes,
    seats,
    shared,
    onlyA,
    onlyB,
    giftsAtoB,
    giftsBtoA,
    coversA,
    coversB,
    innerOuter,
    seed,
  });

  return {
    a,
    b,
    affinity,
    weather,
    title: story.title,
    headline: story.headline,
    epithet: story.epithet,
    sigil: `${a.archetype.code}×${b.archetype.code}`,
    verdict: story.verdict,
    plainly: story.plainly,
    invitation: story.invitation,
    made: story.made,
    owed: story.owed,
    argument: story.argument,
    rooms: story.rooms,
    axes,
    axisHints: story.axisHints,
    seats,
    shared,
    onlyA,
    onlyB,
    giftsAtoB,
    giftsBtoA,
    coversA,
    coversB,
    innerOuter,
    geometry: geo,
    seed,
  };
}

export function bondAsText(bond: BondReading): string {
  return [
    `Certificate of Bond — ${bond.a.displayName} & ${bond.b.displayName}`,
    bond.epithet,
    bond.title,
    `Affinity ${bond.affinity} · ${bond.headline} · ${bond.sigil}`,
    "",
    bond.invitation,
    "",
    "This is a portrait of two names, not a prediction.",
  ].join("\n");
}
