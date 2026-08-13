import { houseOf } from "./archetypes";
import { bondCopy, relationTo } from "./circle";
import { buildHoroscope } from "./engine";
import { themeOf } from "./lexicon";
import type { Horoscope, Letter, MeetKind } from "./types";

export type BondWeather = "kinship" | "homecoming" | "crossing" | "friction" | "exile" | "ordinary";

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

export interface BondReading {
  a: Horoscope;
  b: Horoscope;
  affinity: number;
  weather: BondWeather;
  title: string;
  headline: string;
  verdict: string;
  plainly: string;
  invitation: string;
  seats: SeatMeet[];
  shared: Letter[];
  onlyA: Letter[];
  onlyB: Letter[];
  giftsAtoB: Letter[];
  giftsBtoA: Letter[];
  innerOuter: "complement" | "both-in" | "both-out" | "mixed";
}

function meet(a: Letter, b: Letter): MeetKind {
  if (a === b) return "same";
  return relationTo(a, b) ?? "none";
}

function points(kind: MeetKind, max: number): number {
  switch (kind) {
    case "ally":
      return max;
    case "same":
      return Math.round(max * 0.82);
    case "none":
      return Math.round(max * 0.42);
    case "enemy":
      return Math.round(max * 0.28);
  }
}

function lean(h: Horoscope): "in" | "out" {
  const inner = h.vowels.reduce((sum, item) => sum + item.weight, 0);
  const outer = h.consonants.reduce((sum, item) => sum + item.weight, 0);
  return inner >= outer ? "in" : "out";
}

function lettersOf(h: Horoscope): Letter[] {
  return h.inventory.map((item) => item.letter);
}

function seatCopy(seat: SeatMeet["seat"], kind: MeetKind, a: Letter, b: Letter): string {
  const aHouse = houseOf(a);
  const bHouse = houseOf(b);
  if (seat === "house") {
    if (kind === "same") return `Both sit the ${aHouse.house}. Same role, two lives inside it.`;
    if (kind === "ally") return bondCopy(a, b, "ally");
    if (kind === "enemy") return bondCopy(a, b, "enemy");
    return `No formal bond between ${aHouse.noun} and ${bHouse.noun}. The work still happens.`;
  }
  if (seat === "manner") {
    if (kind === "same") {
      return `They work the same way — ${themeOf(a).name.toLowerCase()}. Echo, not a spare method.`;
    }
    if (kind === "ally") {
      return `How they work completes each other: ${aHouse.adj.toLowerCase()} with ${bHouse.adj.toLowerCase()}.`;
    }
    if (kind === "enemy") {
      return `How they work pushes back: ${aHouse.adj.toLowerCase()} against ${bHouse.adj.toLowerCase()}. Useful, if nobody pretends it is easy.`;
    }
    return "Different manners, no official argument. They will have to invent the method together.";
  }
  if (kind === "same") return `They work in the same kind of place — the ${aHouse.realm}.`;
  if (kind === "ally") return `Their fields help each other: ${aHouse.realm} beside ${bHouse.realm}.`;
  if (kind === "enemy") return `Their fields rub: ${aHouse.realm} against ${bHouse.realm}.`;
  return "They do not share a field. The rooms will have to be built.";
}

function weatherOf(house: MeetKind, affinity: number, gifts: number): BondWeather {
  if (house === "same") return "homecoming";
  if (house === "ally") return affinity >= 55 ? "kinship" : "crossing";
  if (house === "enemy") {
    if (affinity <= 36 && gifts === 0) return "exile";
    if (affinity >= 52 || gifts >= 2) return "crossing";
    return "friction";
  }
  if (affinity >= 62 || gifts >= 2) return "crossing";
  return "ordinary";
}

function titleOf(weather: BondWeather, aNoun: string, bNoun: string): string {
  switch (weather) {
    case "homecoming":
      return aNoun === bNoun ? `The Twin Seat — ${aNoun}` : "Homecoming";
    case "kinship":
      return `Kinship of ${aNoun} and ${bNoun}`;
    case "friction":
      return "The Honest Argument";
    case "exile":
      return "Opposite Grain";
    case "crossing":
      return `A Crossing — ${aNoun} and ${bNoun}`;
    case "ordinary":
      return "An Unmarked Bond";
  }
}

function invitationOf(weather: BondWeather): string {
  switch (weather) {
    case "kinship":
      return "Keep the table you already know how to set.";
    case "homecoming":
      return "Do not become one person. Two of the same house still need two lives.";
    case "crossing":
      return "Name the difference. Then use it.";
    case "friction":
      return "The argument is the work. Stay in the room.";
    case "exile":
      return "Do not make the distance your identity. Do one shared practical thing.";
    case "ordinary":
      return "No official bond. That means you get to write one.";
  }
}

function weatherHeadline(weather: BondWeather): string {
  switch (weather) {
    case "kinship":
      return "Kinship";
    case "homecoming":
      return "Homecoming";
    case "crossing":
      return "Crossing";
    case "friction":
      return "Friction";
    case "exile":
      return "Exile";
    case "ordinary":
      return "Unmarked";
  }
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
      copy: seatCopy("house", houseKind, aHouse, bHouse),
    },
    {
      seat: "manner",
      label: "Manner",
      a: aManner,
      b: bManner,
      aNoun: houseOf(aManner).noun,
      bNoun: houseOf(bManner).noun,
      kind: mannerKind,
      copy: seatCopy("manner", mannerKind, aManner, bManner),
    },
    {
      seat: "field",
      label: "Field",
      a: aField,
      b: bField,
      aNoun: houseOf(aField).noun,
      bNoun: houseOf(bField).noun,
      kind: fieldKind,
      copy: seatCopy("field", fieldKind, aField, bField),
    },
  ];

  const setA = new Set(lettersOf(a));
  const setB = new Set(lettersOf(b));
  const shared = [...setA].filter((letter) => setB.has(letter)).sort();
  const onlyA = [...setA].filter((letter) => !setB.has(letter)).sort();
  const onlyB = [...setB].filter((letter) => !setA.has(letter)).sort();
  const union = setA.size + setB.size - shared.length;
  const overlap = union === 0 ? 0 : shared.length / union;

  const giftsAtoB = a.kinAbsent.filter((letter) => setB.has(letter));
  const giftsBtoA = b.kinAbsent.filter((letter) => setA.has(letter));

  const aLean = lean(a);
  const bLean = lean(b);
  const innerOuter: BondReading["innerOuter"] =
    aLean !== bLean ? "complement" : aLean === "in" ? "both-in" : "both-out";

  const giftCount = giftsAtoB.length + giftsBtoA.length;
  const raw =
    points(houseKind, 34) +
    points(mannerKind, 20) +
    points(fieldKind, 14) +
    Math.round(overlap * 16) +
    Math.min(6, giftsAtoB.length * 3) +
    Math.min(6, giftsBtoA.length * 3) +
    (innerOuter === "complement" ? 4 : innerOuter === "both-in" || innerOuter === "both-out" ? 1 : 2);

  const affinity = Math.max(8, Math.min(99, raw));
  const weather = weatherOf(houseKind, affinity, giftCount);
  const aNoun = houseOf(aHouse).noun;
  const bNoun = houseOf(bHouse).noun;
  const title = titleOf(weather, aNoun, bNoun);

  const giftLine =
    giftCount === 0
      ? "Neither name carries an ally the other is missing."
      : [
          giftsAtoB.length
            ? `${b.displayName} already holds ${giftsAtoB.map((letter) => `${houseOf(letter).noun} (${letter})`).join(", ")} — an ally ${a.displayName} does not write.`
            : "",
          giftsBtoA.length
            ? `${a.displayName} already holds ${giftsBtoA.map((letter) => `${houseOf(letter).noun} (${letter})`).join(", ")} — an ally ${b.displayName} does not write.`
            : "",
        ]
          .filter(Boolean)
          .join(" ");

  const shareLine =
    shared.length === 0
      ? "They share no letters."
      : `They share ${shared.join(", ")}.`;

  const leanLine =
    innerOuter === "complement"
      ? "One name leans inward, the other outward — private life and public face cover each other."
      : innerOuter === "both-in"
        ? "Both names lean inward. The private life is loud; the room still needs a face."
        : "Both names lean outward. Plenty of room; the inner life will have to be kept on purpose.";

  const verdict = [seats[0].copy, shareLine, giftLine, leanLine].filter(Boolean).join(" ");

  const plainly = `We compared the first letter of each username (the role), then how each tends to work, then where. ${aNoun} and ${bNoun} are ${houseKind === "none" ? "unrelated houses" : houseKind === "same" ? "the same house" : houseKind}. Affinity ${affinity} is a 0–100 fit of those seats, shared letters, and missing allies the other already carries. Nothing here predicts a future.`;

  return {
    a,
    b,
    affinity,
    weather,
    title,
    headline: weatherHeadline(weather),
    verdict,
    plainly,
    invitation: invitationOf(weather),
    seats,
    shared,
    onlyA,
    onlyB,
    giftsAtoB,
    giftsBtoA,
    innerOuter,
  };
}

export function bondAsText(bond: BondReading): string {
  return [
    `Certificate of Bond — ${bond.a.displayName} & ${bond.b.displayName}`,
    bond.title,
    `Affinity ${bond.affinity} · ${bond.headline}`,
    "",
    bond.verdict,
    "",
    bond.invitation,
    "",
    "This is a portrait of two names, not a prediction.",
  ].join("\n");
}
