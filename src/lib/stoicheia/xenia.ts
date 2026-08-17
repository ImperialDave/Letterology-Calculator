import { readStoicheion, type Stoicheion } from "./engine";
import { sameFamily } from "./family";
import { erisOf, horaOf, kinOf } from "./horae";
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
  sharedOffice: boolean;
  nightMeetsDay: boolean;
  shared: Stoich[];
  onlyGuest: Stoich[];
  onlyHost: Stoich[];
  arrival: string;
  table: string;
  leave: string;
  weather: XeniaWeather;
  title: string;
  copy: string;
  owe: string;
  hard: string;
};

const WEATHER_COPY: Record<XeniaWeather, string> = {
  hearth:
    "One’s first letter is the other’s last. Set a table. Guest-friendship is already the rule: the guest is fed first, and the host keeps the door honest.",
  road:
    "They meet on the road. Guest-friendship is a duty here, not a mood. Offer water, a true name, and a way onward. Do not demand a house they did not ask for.",
  contest:
    "A strife-pair is in the letters. Keep the argument useful. The good strife makes both of you sharper; the bad strife only wants a fall.",
  mystery:
    "The vowels share a planet and the roads cross. A rite, not a coincidence. Go slowly. Do not spend a mystery as entertainment.",
  exile:
    "No shared choir, no kin, no official strife. They will have to invent the custom. That is harder, and more honest, than pretending an old law covers you.",
  symposium:
    "Shared breath and kinship. Pour for the guest first. Leave one cup unclaimed so the conversation has a place to rest.",
  omen:
    "The same total. The ancients treated that as a sign, not a marriage. Notice it. Do not build a life on it.",
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

function familyKin(a: Stoicheion, b: Stoicheion): boolean {
  return a.letters.some((left) => b.letters.some((right) => left !== right && sameFamily(left, right)));
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
  const cultKin =
    a.letters.some((letter) => kinOf(letter).some((k) => setB.has(k))) ||
    b.letters.some((letter) => kinOf(letter).some((k) => setA.has(k)));
  const kinHit = cultKin || familyKin(a, b);
  const erisHit = a.letters.some((letter) => erisOf(letter).some((k) => setB.has(k)));
  const sharedOffice = Boolean(
    (a.office && (a.office === b.office || a.office === b.place)) ||
      (a.place && (a.place === b.office || a.place === b.place)),
  );
  const nightMeetsDay = a.road.first.watch !== b.road.first.watch;

  let weather: XeniaWeather = "road";
  if (isopsephic) weather = "omen";
  else if (crossedAxis && sharedPlanet) weather = "mystery";
  else if (crossedAxis) weather = "hearth";
  else if (sharedPlanet && kinHit) weather = "symposium";
  else if (erisHit && !kinHit) weather = "contest";
  else if (!sharedPlanet && !kinHit && !erisHit) weather = "exile";
  else weather = "road";

  const guest = a.road.first.noun;
  const host = b.road.last.noun;
  const title = `${guest}’s guest at ${host}’s ${b.road.last.realm}`;

  const owe = crossedAxis
    ? `${a.raw} enters where ${b.raw} finishes. The guest is fed first.`
    : `The host keeps a place. The guest tells the true name they arrived under.`;

  const hard = erisHit
    ? `${horaOf(a.axis.proodos).noun} and the strife-pair in ${b.raw} will argue. That is the work, not a failure.`
    : nightMeetsDay
      ? "One road starts in the night watch, the other in the day. Agree which clock you are using."
      : "The hard part is ordinary: showing up as a guest, not as a verdict.";

  const shared = a.letters.filter((letter, index) => setB.has(letter) && a.letters.indexOf(letter) === index);
  const onlyGuest = a.letters.filter((letter, index) => !setB.has(letter) && a.letters.indexOf(letter) === index);
  const onlyHost = b.letters.filter((letter, index) => !setA.has(letter) && b.letters.indexOf(letter) === index);

  const arrival = `${a.raw} arrives as ${a.road.first.noun}. ${b.raw} keeps the door as ${b.road.first.noun}.`;
  const table = isopsephic
    ? "They weigh the same. Pour for the guest first, then admit the omen."
    : sharedPlanet
      ? "They share a planet in the vowels. The table can hold a long conversation."
      : "The table is still required. Guest-friendship does not wait for a shared hymn.";
  const leave = crossedAxis
    ? `${a.raw} leaves through the hour ${b.raw} entered. Close the door as carefully as you opened it.`
    : `Each returns along their own road: ${a.road.title}; ${b.road.title}.`;

  return {
    a,
    b,
    sharedPlanet,
    isopsephic,
    crossedAxis,
    kinHit,
    erisHit,
    sharedOffice,
    nightMeetsDay,
    shared,
    onlyGuest,
    onlyHost,
    arrival,
    table,
    leave,
    weather,
    title,
    copy: WEATHER_COPY[weather],
    owe,
    hard,
  };
}
