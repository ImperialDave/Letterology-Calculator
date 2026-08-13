import { houseOf } from "./archetypes";
import type {
  BondAxes,
  BondLean,
  BondRooms,
  BondWeather,
  SeatMeet,
} from "./compatibility";
import { themeOf } from "./lexicon";
import type { Horoscope, Letter } from "./types";

export interface BondStoryInput {
  a: Horoscope;
  b: Horoscope;
  weather: BondWeather;
  affinity: number;
  axes: BondAxes;
  seats: SeatMeet[];
  shared: Letter[];
  onlyA: Letter[];
  onlyB: Letter[];
  giftsAtoB: Letter[];
  giftsBtoA: Letter[];
  coversA: Letter[];
  coversB: Letter[];
  innerOuter: BondLean;
  seed: number;
}

export interface BondStory {
  title: string;
  headline: string;
  epithet: string;
  verdict: string;
  plainly: string;
  invitation: string;
  made: string;
  owed: string;
  argument: string;
  rooms: BondRooms;
  axisHints: Record<keyof BondAxes, string>;
}

function spoken(h: Horoscope): string {
  return h.displayName.replace(/^@+/, "").trim() || h.displayName;
}

function pick<T>(seed: number, lane: number, items: readonly T[]): T {
  if (items.length === 0) throw new Error("pick: empty");
  const mixed = Math.imul(seed ^ Math.imul(lane, 0x9e3779b9), 0x85ebca6b) >>> 0;
  return items[mixed % items.length] as T;
}

function listHouses(letters: Letter[]): string {
  if (letters.length === 0) return "none";
  return letters.map((letter) => `${houseOf(letter).noun} (${letter})`).join(", ");
}

function listThemes(letters: Letter[]): string {
  if (letters.length === 0) return "nothing shared";
  return letters.map((letter) => `${themeOf(letter).name.toLowerCase()} (${letter})`).join(", ");
}

function leadTheme(letters: Letter[], fallback: Letter): ReturnType<typeof themeOf> {
  return themeOf(letters[0] ?? fallback);
}

const WEATHER_LABEL: Record<BondWeather, string> = {
  kinship: "Kinship",
  homecoming: "Homecoming",
  crossing: "Crossing",
  friction: "Friction",
  exile: "Exile",
  ordinary: "Unmarked",
  pact: "Pact",
  forge: "Forge",
  orbit: "Orbit",
  echo: "Echo",
  harvest: "Harvest",
  veil: "Veil",
  carnival: "Carnival",
};

const SHAPE_LABEL: Record<keyof BondAxes, string> = {
  role: "role-led",
  method: "method-led",
  place: "place-led",
  overlap: "letter-led",
  exchange: "gift-led",
  temper: "temper-led",
  court: "court-led",
  spark: "spark-led",
};

function leadingAxis(axes: BondAxes): keyof BondAxes {
  return (Object.keys(axes) as (keyof BondAxes)[]).reduce((best, key) =>
    axes[key] > axes[best] ? key : best,
  );
}

function titles(input: BondStoryInput): string[] {
  const { a, b, weather, shared, seats } = input;
  const aH = houseOf(a.signature);
  const bH = houseOf(b.signature);
  const aT = themeOf(a.primary.letter);
  const bT = themeOf(b.primary.letter);
  const sharedT = leadTheme(shared, a.primary.letter);
  const form = WEATHER_LABEL[weather];
  return [
    `${a.archetype.title} & ${b.archetype.title}`,
    `The ${aH.realm}–${bH.realm} ${form}`,
    `${aT.name} meets ${bT.name}`,
    `${form} of ${aT.keywords[0]} and ${bT.keywords[0]}`,
    `${aH.noun}'s ${bH.adj} ${sharedT.name}`,
    `${spoken(a)} × ${spoken(b)} — ${form} in the ${seats[2].aNoun === seats[2].bNoun ? aH.realm : `${aH.realm}/${bH.realm}`}`,
  ];
}

function epithets(input: BondStoryInput): string[] {
  const { a, b, weather, shared } = input;
  const aH = houseOf(a.signature);
  const bH = houseOf(b.signature);
  const sharedT = leadTheme(shared, a.signature);
  const word = shared.length ? sharedT.name : themeOf(a.primary.letter).keywords[1];
  return [
    `The ${word} ${WEATHER_LABEL[weather]}`,
    `${aH.realm} & ${bH.realm}`,
    `${aH.adj} ${bH.noun}`,
    `A ${aH.adj.toLowerCase()} ${word.toLowerCase()}`,
    `${WEATHER_LABEL[weather]} at the ${bH.realm}`,
  ];
}

function invitations(input: BondStoryInput): string[] {
  const { a, b, weather } = input;
  const aH = houseOf(a.signature);
  const bH = houseOf(b.signature);
  const common = [
    `${aH.invitation} ${bH.invitation}`,
    `Name the difference between ${spoken(a)} and ${spoken(b)}. Then use it once this week.`,
  ];
  switch (weather) {
    case "kinship":
      return [
        `Keep the table ${spoken(a)} and ${spoken(b)} already know how to set.`,
        `Do not improve this bond. Protect the hours it already works.`,
        ...common,
      ];
    case "homecoming":
      return [
        `Do not become one person. Two of the ${aH.noun} still need two lives.`,
        `Share the role. Split the days. ${aH.gold}`,
        ...common,
      ];
    case "crossing":
      return [
        `Let ${spoken(a)} keep ${aH.noun}. Let ${spoken(b)} keep ${bH.noun}. Cross on purpose.`,
        `Trade one skill this month. Not a personality.`,
        ...common,
      ];
    case "friction":
      return [
        `The argument is the work. Stay in the room long enough to hear the second sentence.`,
        `Pick the fight that is about the work, not the person.`,
        ...common,
      ];
    case "exile":
      return [
        `Do not make the distance your identity. Do one shared practical thing.`,
        `Stand in the same room without converting each other.`,
        ...common,
      ];
    case "pact":
      return [
        `Write down what each already carries for the other. That is the pact.`,
        `Ask for the gift by name. Do not make them guess.`,
        ...common,
      ];
    case "forge":
      return [
        `Heat is not a defect. Put it on a job that can take it.`,
        `Argue about the work. Then make something that survives the argument.`,
        ...common,
      ];
    case "orbit":
      return [
        `Do not close the gap. Visit. Return. That is the shape.`,
        `Keep separate rooms. Share a threshold.`,
        ...common,
      ];
    case "echo":
      return [
        `You work the same way. Do not do the same job.`,
        `One method, two fields. Split the map.`,
        ...common,
      ];
    case "harvest":
      return [
        `The place is already right. Bring the work you have been postponing.`,
        `Gather what grew. Name who tended which part.`,
        ...common,
      ];
    case "veil":
      return [
        `The private life is loud. Give the room one honest face.`,
        `Come out for an hour. Then go back in together.`,
        ...common,
      ];
    case "carnival":
      return [
        `Plenty of room. Keep one inner hour on purpose.`,
        `The party is not the bond. The walk home is.`,
        ...common,
      ];
    default:
      return [
        `No official bond. That means ${spoken(a)} and ${spoken(b)} get to write one.`,
        `Start with one ordinary hour. See what the letters do.`,
        ...common,
      ];
  }
}

function leanLine(input: BondStoryInput): string {
  const { a, b, innerOuter } = input;
  if (innerOuter === "complement") {
    return `${spoken(a)} and ${spoken(b)} lean opposite ways — one toward the private life, one toward the room. They cover each other's missing face.`;
  }
  if (innerOuter === "both-in") {
    return `Both names lean inward. The private life is loud; the room still needs a face.`;
  }
  return `Both names lean outward. Plenty of room; the inner life will have to be kept on purpose.`;
}

function shareLine(input: BondStoryInput): string {
  const { shared, a } = input;
  if (shared.length === 0) return "They share no letters — no automatic common ground in the spelling.";
  const lead = leadTheme(shared, a.signature);
  return `They share ${listThemes(shared)}. The loudest shared letter is ${lead.letter} — ${lead.name.toLowerCase()}: ${lead.essence}`;
}

function giftLine(input: BondStoryInput): string {
  const { a, b, giftsAtoB, giftsBtoA } = input;
  if (giftsAtoB.length === 0 && giftsBtoA.length === 0) {
    return "Neither name carries an ally the other is missing. What they give each other will have to be chosen, not spelled.";
  }
  return [
    giftsAtoB.length
      ? `${spoken(b)} already holds ${listHouses(giftsAtoB)} — an ally ${spoken(a)} does not write.`
      : "",
    giftsBtoA.length
      ? `${spoken(a)} already holds ${listHouses(giftsBtoA)} — an ally ${spoken(b)} does not write.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function coverLine(input: BondStoryInput): string {
  const { a, b, coversA, coversB } = input;
  if (coversA.length === 0 && coversB.length === 0) return "";
  return [
    coversA.length
      ? `${spoken(b)} writes letters ${spoken(a)} almost never uses (${coversA.join(", ")}). That is cover, not correction.`
      : "",
    coversB.length
      ? `${spoken(a)} writes what ${spoken(b)} leaves quiet (${coversB.join(", ")}).`
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function composeBondStory(input: BondStoryInput): BondStory {
  const { a, b, weather, affinity, axes, seats, shared, onlyA, onlyB, seed } = input;
  const aH = houseOf(a.signature);
  const bH = houseOf(b.signature);
  const aT = themeOf(a.primary.letter);
  const bT = themeOf(b.primary.letter);
  const shape = leadingAxis(axes);
  const title = pick(seed, 1, titles(input));
  const epithet = pick(seed, 2, epithets(input));
  const invitation = pick(seed, 3, invitations(input));
  const headline = `${WEATHER_LABEL[weather]} · ${SHAPE_LABEL[shape]}`;

  const verdict = [
    `${spoken(a)} stands as ${a.archetype.title} — ${aH.myth}`,
    `${spoken(b)} stands as ${b.archetype.title} — ${bH.myth}`,
    seats[0].copy,
    shareLine(input),
    giftLine(input),
    coverLine(input),
    leanLine(input),
  ]
    .filter(Boolean)
    .join(" ");

  const plainly = `We compared eight measures, not one vibe: the role each first letter names, how each name tends to work, where the work happens, how much the spellings overlap (by weight, not just presence), the allies one already carries for the other, whether they lean inward or outward, how often each name sits in the other's court, and how much honest argument lives here. ${aH.noun} and ${bH.noun} meet as ${seats[0].kind === "none" ? "unrelated houses" : seats[0].kind === "same" ? "the same house" : seats[0].kind}. Affinity ${affinity} is a fit of those measures. Nothing here predicts a future.`;

  const madeShared = shared.length
    ? `The third thing they make is spelled in the letters they share — ${listThemes(shared)}.`
    : `They share no letters, so the third thing has to be built from scratch: a place that is neither only the ${aH.realm} nor only the ${bH.realm}.`;
  const made = `${spoken(a)} brings ${aT.gift} ${spoken(b)} brings ${bT.gift} Together they tend a ${aH.realm.toLowerCase()} beside a ${bH.realm.toLowerCase()}. ${madeShared}`;

  const owed = [
    giftLine(input),
    coverLine(input) || `${spoken(a)} owes ${spoken(b)} a clear ask. ${spoken(b)} owes ${spoken(a)} a clear no.`,
    `${aH.gold} ${bH.gold}`,
  ]
    .filter(Boolean)
    .join(" ");

  const aTension = a.tension
    ? `${spoken(a)}'s live tension is ${a.tension.title.toLowerCase()}. ${a.tension.copy}`
    : `${spoken(a)} has no named tension in the letters. The work is ${aT.challenge}`;
  const bTension = b.tension
    ? `${spoken(b)}'s live tension is ${b.tension.title.toLowerCase()}. ${b.tension.copy}`
    : `${spoken(b)} has no named tension in the letters. The work is ${bT.challenge}`;
  const enemySeat =
    seats.find((seat) => seat.kind === "enemy") ??
    (seats[0].kind === "none" ? seats[0] : null);
  const argument = [
    aTension,
    bTension,
    enemySeat
      ? `The fault line sits at ${enemySeat.label.toLowerCase()}: ${enemySeat.aNoun} against ${enemySeat.bNoun}.`
      : `No official enemy between the seats. The argument, if it comes, will be invented.`,
    onlyA.length
      ? `${spoken(a)} alone carries ${listHouses(onlyA.slice(0, 4))}.`
      : "",
    onlyB.length
      ? `${spoken(b)} alone carries ${listHouses(onlyB.slice(0, 4))}.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  const aManner = themeOf(a.triad[1]);
  const bManner = themeOf(b.triad[1]);
  const aField = houseOf(a.triad[2]);
  const bField = houseOf(b.triad[2]);
  const nameA = spoken(a);
  const nameB = spoken(b);

  const rooms: BondRooms = {
    morning: pick(seed, 11, [
      `${nameA} wakes as ${aH.noun}: ${aH.myth} ${nameB} is already in the ${bH.realm}. The first hour is ${aT.keywords[0]} meeting ${bT.keywords[0]}.`,
      `Morning belongs to ${aT.name.toLowerCase()} in ${nameA}, and to ${bT.name.toLowerCase()} in ${nameB}. Do not merge the rituals. Share the kettle.`,
      `The ${aH.realm} at dawn, the ${bH.realm} by the second cup. ${nameA} starts; ${nameB} decides whether the start is real.`,
    ]),
    work: pick(seed, 12, [
      `The work happens where ${nameA}'s ${aField.realm.toLowerCase()} meets ${nameB}'s ${bField.realm.toLowerCase()}. ${nameA} works by ${aManner.name.toLowerCase()}; ${nameB} by ${bManner.name.toLowerCase()}.`,
      `${nameA} (${a.archetype.title}) keeps the ${aH.adj.toLowerCase()} job. ${nameB} (${b.archetype.title}) keeps the ${bH.adj.toLowerCase()} one. If they swap, the day stalls.`,
      `Put ${nameA} and ${nameB} on one table with two tools. ${nameA} keeps ${aT.keywords[2]}; ${nameB} keeps ${bT.keywords[2]}.`,
    ]),
    fight: pick(seed, 13, [
      `When ${nameA} slips, ${aH.shadow} When ${nameB} slips, ${bH.shadow} That is the pair's weather, not a verdict on either person.`,
      `${nameA} will defend ${aT.keywords[1]}; ${nameB} will defend ${bT.keywords[1]}. Name those two words before anyone leaves the room.`,
      a.tension
        ? `When it goes badly, ${nameA} falls into ${a.tension.title.toLowerCase()}. ${nameB}'s job is not to fix it — only to stay.`
        : `When it goes badly, ${nameA} forgets ${aH.gold} ${nameB} forgets ${bH.gold}`,
    ]),
    repair: pick(seed, 14, [
      `Repair is one act from ${nameA}: ${aH.invitation} Then one from ${nameB}: ${bH.invitation} Not a speech.`,
      `${nameA} and ${nameB} come back through the shared letters${shared.length ? ` — ${shared.join(", ")}` : ""}. A small ordinary thing both names already know how to do.`,
      `${pick(seed, 15, [nameA, nameB])} goes first. The other names what was true. Then they eat.`,
    ]),
  };

  const axisHints: Record<keyof BondAxes, string> = {
    role: `${aH.noun} and ${bH.noun} are ${seats[0].kind === "none" ? "unrelated houses" : seats[0].kind === "same" ? "the same house" : seats[0].kind} — the roles the first letters name.`,
    method: `How they work: ${themeOf(a.triad[1]).name.toLowerCase()} (${a.triad[1]}) with ${themeOf(b.triad[1]).name.toLowerCase()} (${b.triad[1]}).`,
    place: `Where the work happens: the ${houseOf(a.triad[2]).realm} beside the ${houseOf(b.triad[2]).realm}.`,
    overlap: shared.length
      ? `Shared letters, counted by weight: ${shared.join(", ")}.`
      : "No shared letters. Overlap is near the floor.",
    exchange: giftLine(input),
    temper: leanLine(input),
    court: `How often each name already sits in the other's allies and enemies.`,
    spark: `How much honest argument lives here — enemy seats and opposing manners, not drama for its own sake.`,
  };

  return {
    title,
    headline,
    epithet,
    verdict,
    plainly,
    invitation,
    made,
    owed,
    argument,
    rooms,
    axisHints,
  };
}

export function weatherLabel(weather: BondWeather): string {
  return WEATHER_LABEL[weather];
}
