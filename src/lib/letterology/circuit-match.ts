import { houseOf } from "./archetypes";
import { composeBondStory } from "./bond-narrative";
import { buildHoroscope } from "./engine";
import { betweennessOf, pairGeometry } from "./geometry";
import type { Horoscope, Letter, MeetKind } from "./types";
import {
  type BondAxes,
  type BondGates,
  type BondGrade,
  type BondLean,
  type BondRooms,
  type BondWeather,
  type CircuitClass,
  type GiftGate,
  type SeatMeet,
  GRADE_COUNSEL,
  GRADE_LABEL,
  clamp,
  composeCircuit,
  courtToward,
  gradeCounsel,
  gradeLabel,
  lettersOf,
  leanOf,
  meet,
  pairSeed,
  seatCopy,
  spoken,
  weatherOf,
  weightInsideGrade,
  weightedOverlap,
} from "./circuit-core";

export type {
  BondAxes,
  BondGates,
  BondGrade,
  BondLean,
  BondRooms,
  BondWeather,
  CircuitClass,
  GiftGate,
  SeatMeet,
};

export { gradeCounsel, gradeLabel };

export interface BondReading {
  a: Horoscope;
  b: Horoscope;
  /** @deprecated Prefer `grade`. Kept as a weight inside the letter class for axes and legacy surfaces. */
  affinity: number;
  grade: BondGrade;
  circuit: CircuitClass;
  gates: BondGates;
  gradeLabel: string;
  gradeCounsel: string;
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
  geometry: ReturnType<typeof pairGeometry>;
  seed: number;
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
  const temper = innerOuter === "complement" ? 84 : innerOuter === "both-in" ? 49 : 54;
  const court = clamp((courtToward(a, setB) + courtToward(b, setA)) / 2);
  const spark = clamp(
    (100 - geo.resonance.house) * 0.5 +
      (100 - geo.resonance.manner) * 0.3 +
      (100 - geo.resonance.field) * 0.2,
  );

  const axes: BondAxes = { role, method, place, overlap, exchange, temper, court, spark };

  const giftGate: GiftGate =
    giftsAtoB.length > 0 && giftsBtoA.length > 0 ? "both" : giftCount > 0 ? "one" : "bare";

  const gates: BondGates = {
    role: houseKind,
    gift: giftGate,
    method: mannerKind,
    field: fieldKind,
  };

  const { circuit, grade } = composeCircuit({
    role: houseKind,
    gift: giftGate,
    method: mannerKind,
    field: fieldKind,
    spark,
    sharedCount: shared.length,
    overlapRatio,
  });

  const seed = pairSeed(a, b, shared);
  const affinity = weightInsideGrade(grade, axes, giftCount, seed);

  const weather = weatherOf({
    role: houseKind,
    manner: mannerKind,
    circuit,
    grade,
    gifts: giftCount,
    axes,
    lean: innerOuter,
  });

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

  const gradeHeadline = `Grade ${grade} · ${GRADE_LABEL[grade]} · ${story.headline}`;

  return {
    a,
    b,
    affinity,
    grade,
    circuit,
    gates,
    gradeLabel: GRADE_LABEL[grade],
    gradeCounsel: GRADE_COUNSEL[grade],
    weather,
    title: story.title,
    headline: gradeHeadline,
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
    `Grade ${bond.grade} · ${bond.gradeLabel} · ${bond.headline} · ${bond.sigil}`,
    "",
    bond.gradeCounsel,
    "",
    bond.invitation,
    "",
    "This is a portrait of two names, not a prediction.",
  ].join("\n");
}
