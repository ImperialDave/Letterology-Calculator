import { readStoicheion, type Stoicheion } from "./engine";
import { erisOf, kinOf } from "./horae";
import type { Stoich } from "./letters";

export type XeniaWeather =
  | "hearth"
  | "road"
  | "contest"
  | "mystery"
  | "exile"
  | "symposium"
  | "omen";

export type XeniaReading = {
  a: Stoicheion;
  b: Stoicheion;
  sharedPlanet: boolean;
  isopsephic: boolean;
  crossedAxis: boolean;
  kinHit: boolean;
  erisHit: boolean;
  weather: XeniaWeather;
  copy: string;
};

function sharesPlanet(a: Stoicheion, b: Stoicheion): boolean {
  const left = new Set(a.hymn.map((item) => item.planet));
  return b.hymn.some((item) => left.has(item.planet));
}

function axisCross(a: Stoicheion, b: Stoicheion): boolean {
  return a.axis.proodos === b.axis.epistrophe || a.axis.epistrophe === b.axis.proodos;
}

function letterSet(reading: Stoicheion): Set<Stoich> {
  return new Set(reading.letters);
}

export function readXenia(rawA: string, rawB: string): XeniaReading | null {
  const a = readStoicheion(rawA);
  const b = readStoicheion(rawB);
  if (!a || !b) return null;
  const sharedPlanet = sharesPlanet(a, b);
  const isopsephic = a.sum === b.sum && a.sum > 0;
  const crossedAxis = axisCross(a, b);
  const setB = letterSet(b);
  const setA = letterSet(a);
  const kinHit = a.letters.some((letter) => kinOf(letter).some((k) => setB.has(k)));
  const erisHit = a.letters.some((letter) => erisOf(letter).some((k) => setB.has(k)));
  const alsoKin = b.letters.some((letter) => kinOf(letter).some((k) => setA.has(k)));

  let weather: XeniaWeather = "road";
  if (isopsephic) weather = "omen";
  else if (crossedAxis && sharedPlanet) weather = "mystery";
  else if (crossedAxis) weather = "hearth";
  else if (sharedPlanet && (kinHit || alsoKin)) weather = "symposium";
  else if (erisHit && !kinHit) weather = "contest";
  else if (!sharedPlanet && !kinHit && !erisHit) weather = "exile";
  else weather = "road";

  const copy = {
    hearth: "One’s entrance is the other’s return. Set a table. Zeus Xenios is already in the room.",
    road: "They meet on the road. Guest-friendship is a duty here, not a mood.",
    contest: "Eris is in the letters. The good strife — if anyone keeps it good.",
    mystery: "The hymns share a planet and the axes cross. A rite, not a coincidence.",
    exile: "No shared choir, no kin, no official strife. They will have to invent the custom.",
    symposium: "Shared breath and kinship. Pour for the guest first.",
    omen: "Isopsephic — the same weight. The ancients treated that as a sign, not a marriage.",
  }[weather];

  return {
    a,
    b,
    sharedPlanet,
    isopsephic,
    crossedAxis,
    kinHit: kinHit || alsoKin,
    erisHit,
    weather,
    copy,
  };
}
