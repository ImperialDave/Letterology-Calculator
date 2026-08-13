import type { Archetype, Letter, LetterInventory, Triad } from "./types";
import { ALPHABET } from "./types";
import { themeOf } from "./lexicon";

interface LetterRole {
  letter: Letter;
  house: string;
  noun: string;
  adj: string;
  realm: string;
  calling: string;
  method: string;
  field: string;
  doubled: string;
  invitation: string;
}

const ROLES: Record<Letter, LetterRole> = {
  A: {
    letter: "A",
    house: "House of the Seeker",
    noun: "Seeker",
    adj: "Rising",
    realm: "Threshold",
    calling: "You stand as the Seeker: a life that treats wanting as a form of honesty.",
    method: "The work proceeds by beginning — the upright step into what is not yet named.",
    field: "The path is the Threshold: doors that have not agreed to exist.",
    doubled: "When the Seeker returns, appetite doubles. Let one beginning finish.",
    invitation: "Choose one threshold and cross it as if the name were already true.",
  },
  B: {
    letter: "B",
    house: "House of the Guardian",
    noun: "Guardian",
    adj: "Loyal",
    realm: "Hearth",
    calling: "You stand as the Guardian: the one who makes a home of two things that chose each other.",
    method: "The work proceeds by keeping — holding what would scatter without closing the door.",
    field: "The path is the Hearth: the circle in which people can stay.",
    doubled: "When the Guardian returns, belonging thickens. Hold without gripping.",
    invitation: "Keep what is living. Release what has become a lid.",
  },
  C: {
    letter: "C",
    house: "House of the Rebel",
    noun: "Rebel",
    adj: "Wild",
    realm: "Spark",
    calling: "You stand as the Rebel: the reason a still room does not stay still.",
    method: "The work proceeds by ignition — curiosity with a match in its hand.",
    field: "The path is the Spark: the first honest reaction that changes the air.",
    doubled: "When the Rebel returns, ignition stacks. Stay long enough to see the flame take.",
    invitation: "Start one reaction worth keeping, then give it a vessel.",
  },
  D: {
    letter: "D",
    house: "House of the Hermit",
    noun: "Hermit",
    adj: "Hidden",
    realm: "Well",
    calling: "You stand as the Hermit: the one who prefers the root to the announcement.",
    method: "The work proceeds by descent — long attention given to what is not yet clear.",
    field: "The path is the Well: the place that changes whoever stays.",
    doubled: "When the Hermit returns, the shaft goes deeper. Bring something back.",
    invitation: "Let one devotion become visible. Depth still wants a witness.",
  },
  E: {
    letter: "E",
    house: "House of the Explorer",
    noun: "Explorer",
    adj: "Open",
    realm: "Sky",
    calling: "You stand as the Explorer: a life that makes more room than the situation asked for.",
    method: "The work proceeds by widening — feeling used as a climate others can enter.",
    field: "The path is the Sky: the larger air in which a self can emerge.",
    doubled: "When the Explorer returns, space multiplies. Grow in one direction.",
    invitation: "Expand toward a shoreline, not toward every horizon at once.",
  },
  F: {
    letter: "F",
    house: "House of the Wanderer",
    noun: "Wanderer",
    adj: "Free",
    realm: "Gate",
    calling: "You stand as the Wanderer: sovereignty worn as clean attention, not as escape.",
    method: "The work proceeds unbound — a corridor of air kept around the day.",
    field: "The path is the Gate: an opening that remains chosen, not forced.",
    doubled: "When the Wanderer returns, the gate swings wider. Stay freely.",
    invitation: "Keep the corridor of air, and give it a fidelity that is still yours.",
  },
  G: {
    letter: "G",
    house: "House of the Steward",
    noun: "Steward",
    adj: "Patient",
    realm: "Grove",
    calling: "You stand as the Steward: increase with roots, not merely accumulation.",
    method: "The work proceeds by tending — gratitude used as soil.",
    field: "The path is the Grove: lives and crafts that grow because someone stayed.",
    doubled: "When the Steward returns, the green thickens. Allow a winter.",
    invitation: "Tend one living thing as if increase were already promised.",
  },
  H: {
    letter: "H",
    house: "House of the Herald",
    noun: "Herald",
    adj: "Far",
    realm: "Horizon",
    calling: "You stand as the Herald: hope with a backbone, and a door left honest.",
    method: "The work proceeds by far-looking — a longer view offered without force.",
    field: "The path is the Horizon: the far line that organizes the walk.",
    doubled: "When the Herald returns, the line recedes. Set the nearest table.",
    invitation: "Keep the far line, and be hospitable to the person already in the room.",
  },
  I: {
    letter: "I",
    house: "House of the Sage",
    noun: "Sage",
    adj: "Lucid",
    realm: "Lamp",
    calling: "You stand as the Sage: insight before applause, a room lit from inside.",
    method: "The work proceeds inward — imagination kept faithful before it is shown.",
    field: "The path is the Lamp: inner light meant, eventually, for a shared table.",
    doubled: "When the Sage returns, the study locks. Speak one private seeing.",
    invitation: "Bring one unused light into speech.",
  },
  J: {
    letter: "J",
    house: "House of the Pilgrim",
    noun: "Pilgrim",
    adj: "Restless",
    realm: "Road",
    calling: "You stand as the Pilgrim: motion with a conscience, joy that does not look away.",
    method: "The work proceeds by travel — placing unlikely things beside each other until they speak.",
    field: "The path is the Road: the honest miles between a here and a more just there.",
    doubled: "When the Pilgrim returns, the pack never drops. Arrive somewhere.",
    invitation: "Take the next honest mile, and let joy be part of the equipment.",
  },
  K: {
    letter: "K",
    house: "House of the Companion",
    noun: "Companion",
    adj: "Kind",
    realm: "Table",
    calling: "You stand as the Companion: knowledge that wants to be useful to someone named.",
    method: "The work proceeds beside others — understanding by standing with.",
    field: "The path is the Table: the small republic of those who know a real name.",
    doubled: "When the Companion returns, the room can close. Leave a place for the stranger.",
    invitation: "Offer one precise kindness to kin, then one to someone who is not.",
  },
  L: {
    letter: "L",
    house: "House of the Lover",
    noun: "Lover",
    adj: "Radiant",
    realm: "Flame",
    calling: "You stand as the Lover: light that has chosen a person, and will stay after the first shine.",
    method: "The work proceeds by warmth — care used as a form of leadership.",
    field: "The path is the Flame: a room that becomes visible because you did not hoard the lamp.",
    doubled: "When the Lover returns, brightness performs. Rest the lamp.",
    invitation: "Shine on one true thing. Do not spend the whole light on the hallway.",
  },
  M: {
    letter: "M",
    house: "House of the Maker",
    noun: "Maker",
    adj: "Swift",
    realm: "Wheel",
    calling: "You stand as the Maker: mass in motion, a practice that has begun to carry itself.",
    method: "The work proceeds by pulse — movement toward mastery, not merely activity.",
    field: "The path is the Wheel: work with a rhythm that can outlive a mood.",
    doubled: "When the Maker returns, speed outruns meaning. Pause without losing the stream.",
    invitation: "Give the true motion the dignity of a daily return.",
  },
  N: {
    letter: "N",
    house: "House of the Healer",
    noun: "Healer",
    adj: "Gentle",
    realm: "Garden",
    calling: "You stand as the Healer: care without condescension, noticing before fixing.",
    method: "The work proceeds by feeding — tending what is young, tender, or not yet named.",
    field: "The path is the Garden: the unglamorous work of keeping life edible.",
    doubled: "When the Healer returns, the feeder can starve. Include yourself in the noticing.",
    invitation: "Feed what is already alive in you. Maintenance is not vanity.",
  },
  O: {
    letter: "O",
    house: "House of the Host",
    noun: "Host",
    adj: "Welcoming",
    realm: "Circle",
    calling: "You stand as the Host: origin and opportunity in the same breath.",
    method: "The work proceeds by opening — order that can still admit a guest.",
    field: "The path is the Circle: a frame that holds a chance without locking it.",
    doubled: "When the Gatekeeper returns, the draft gets cold. Give the open door a simple order.",
    invitation: "Unlatch one true door, and keep the room behind it.",
  },
  P: {
    letter: "P",
    house: "House of the Sovereign",
    noun: "Sovereign",
    adj: "Devoted",
    realm: "Crown",
    calling: "You stand as the Sovereign: presence with a direction, passion that has agreed to wait.",
    method: "The work proceeds by aim — turning potential into a sequence of kept days.",
    field: "The path is the Crown: the spine that gives scattered energy a name.",
    doubled: "When the Sovereign returns, the script hardens. Let purpose stay larger than one aim.",
    invitation: "Name the work that would still matter if it were slower.",
  },
  Q: {
    letter: "Q",
    house: "House of the Monk",
    noun: "Monk",
    adj: "Quiet",
    realm: "Cloister",
    calling: "You stand as the Monk: a life that prefers the real question to the crowded answer.",
    method: "The work proceeds by question — quiet quality over a cheap version.",
    field: "The path is the Cloister: the rare question that would change a week.",
    doubled: "When the Monk returns, the ordinary day is despised. Live near the question without leaving the living.",
    invitation: "Ask the one question that would alter the week, and stay beside it.",
  },
  R: {
    letter: "R",
    house: "House of the Bard",
    noun: "Bard",
    adj: "Steady",
    realm: "Song",
    calling: "You stand as the Bard: the sounding board that answers vibration with a truer tone.",
    method: "The work proceeds by attunement — returning until the signal is clean.",
    field: "The path is the Song: a rhythm a life can be danced in, not only endured.",
    doubled: "When the Bard returns, echo can replace voice. Change key when the old one is spent.",
    invitation: "Listen for the note that is yours, and return to it once before night.",
  },
  S: {
    letter: "S",
    house: "House of the Ally",
    noun: "Ally",
    adj: "Shared",
    realm: "Weave",
    calling: "You stand as the Ally: strength that comes from things agreeing to be more together.",
    method: "The work proceeds by joining — sincere combinations no single part could invent.",
    field: "The path is the Weave: the quiet architecture of we.",
    doubled: "When the Ally returns, the self can dissolve. Keep one unsurrendered thread.",
    invitation: "Join what wants joining, and keep a name that is still yours.",
  },
  T: {
    letter: "T",
    house: "House of the Alchemist",
    noun: "Alchemist",
    adj: "Fierce",
    realm: "Crossroads",
    calling: "You stand as the Alchemist: truth that costs something, and the tension that makes a new shape.",
    method: "The work proceeds by crossing — refusing the comfortable lie without making a habit of fire.",
    field: "The path is the Crossroads: where an old skin is honestly shed.",
    doubled: "When the Alchemist returns, crisis can become a style. Tend what the last fire revealed.",
    invitation: "Name the one thing that is already over, and cross with tenderness.",
  },
  U: {
    letter: "U",
    house: "House of the Peacemaker",
    noun: "Peacemaker",
    adj: "Whole",
    realm: "Vessel",
    calling: "You stand as the Peacemaker: a we that does not require anyone to become a smaller I.",
    method: "The work proceeds by holding — understanding that lets two true things stand together.",
    field: "The path is the Vessel: a whole that includes the unique instead of sanding it off.",
    doubled: "When the Peacemaker returns, conflict can be papered. Let one necessary edge remain.",
    invitation: "Hold the whole, and keep one unblended contour of yourself.",
  },
  V: {
    letter: "V",
    house: "House of the Oracle",
    noun: "Oracle",
    adj: "Vivid",
    realm: "Vista",
    calling: "You stand as the Oracle: vocation with blood in it, a picture worth the risk of being seen.",
    method: "The work proceeds by seeing — naming a direction while it is still only weather.",
    field: "The path is the Vista: a future that has a face, and therefore a pulse.",
    doubled: "When the Oracle returns, the near is refused. Take one unglamorous step that belongs to the picture.",
    invitation: "Tell the true picture, then take the humble inch that proves it.",
  },
  W: {
    letter: "W",
    house: "House of the Innocent",
    noun: "Innocent",
    adj: "Awake",
    realm: "Story",
    calling: "You stand as the Innocent: an open eye that has not agreed to be bored.",
    method: "The work proceeds by wonder — remaining available to being changed by what is seen.",
    field: "The path is the Story: connections that restore astonishment as a practical mercy.",
    doubled: "When the Innocent returns, looking can replace doing. Put a hand to the weave.",
    invitation: "Look again at what you think you already understand, then join two strands.",
  },
  X: {
    letter: "X",
    house: "House of the Outsider",
    noun: "Outsider",
    adj: "Rare",
    realm: "Edge",
    calling: "You stand as the Outsider: the missing mark, the life that will not stay inside the lines.",
    method: "The work proceeds from the margin — bringing the unknown term into a finished room.",
    field: "The path is the Edge: crossings, extremes, and the honesty of the unmapped.",
    doubled: "When the Outsider returns, exile can become a habit. Let the rare thing serve more than itself.",
    invitation: "Honor what does not resemble the pattern, and bring it back across the line.",
  },
  Y: {
    letter: "Y",
    house: "House of the Shapeshifter",
    noun: "Shapeshifter",
    adj: "Soft",
    realm: "Fork",
    calling: "You stand as the Shapeshifter: yearning that has learned yes — and not-yet.",
    method: "The work proceeds by turning — a self that can bend without breaking.",
    field: "The path is the Fork: the flexible axis on which a life can still choose.",
    doubled: "When the Shapeshifter returns, the stand is postponed. Let one yes become a spine.",
    invitation: "Bend where bending is wisdom. Then keep one unbent vow.",
  },
  Z: {
    letter: "Z",
    house: "House of the Champion",
    noun: "Champion",
    adj: "Final",
    realm: "Peak",
    calling: "You stand as the Champion: zeal distilled, intensity without waste.",
    method: "The work proceeds by concentration — a season spent on a single altitude.",
    field: "The path is the Peak: the high point, visited rather than inhabited.",
    doubled: "When the Champion returns, the climb starves the descent. Come down with grace.",
    invitation: "Give zeal one worthy height, and practice the walk back down.",
  },
};

function roleOf(letter: Letter): LetterRole {
  return ROLES[letter] ?? ROLES.X;
}

function triadHash(triad: Triad): number {
  let h = 2166136261;
  for (const letter of triad.join("")) {
    h ^= letter.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function buildTitle(a: LetterRole, b: LetterRole, c: LetterRole, triad: Triad): string {
  const [x, y, z] = triad;
  if (x === y && y === z) return `The Pure ${a.noun}`;
  if (x === y && y !== z) return `The Double ${a.noun} of the ${c.realm}`;

  const pattern = triadHash(triad) % 2;
  if (pattern === 1) return `The ${a.noun} of the ${b.adj} ${c.realm}`;
  return `The ${b.adj} ${a.noun} of the ${c.realm}`;
}

function buildPortrait(a: LetterRole, b: LetterRole, c: LetterRole, triad: Triad, title: string): string {
  const [x, y, z] = triad;
  const repeats: string[] = [];
  if (x === y || x === z) repeats.push(a.doubled);
  if (y === z && y !== x) repeats.push(b.doubled);

  return [
    a.calling,
    b.method,
    c.field,
    ...repeats,
    `${title}: a climate of ${themeOf(x).name.toLowerCase()}, ${themeOf(y).name.toLowerCase()}, and ${themeOf(z).name.toLowerCase()}.`,
  ].join(" ");
}

function buildSummary(a: LetterRole, b: LetterRole, c: LetterRole): string {
  return `${a.house} · ${b.adj} aspect · path of the ${c.realm}`;
}

export function archetypeOf(triad: Triad): Archetype {
  const [x, y, z] = triad;
  const a = roleOf(x);
  const b = roleOf(y);
  const c = roleOf(z);
  const title = buildTitle(a, b, c, triad);
  return {
    triad,
    code: `${x}${y}${z}`,
    title,
    house: a.house,
    houseLetter: x,
    summary: buildSummary(a, b, c),
    portrait: buildPortrait(a, b, c, triad, title),
    invitation: `${a.invitation} ${c.invitation}`,
  };
}

export function frequencyRank(inventory: LetterInventory[]): LetterInventory[] {
  return [...inventory].sort((left, right) => {
    if (right.count !== left.count) return right.count - left.count;
    return left.firstIndex - right.firstIndex;
  });
}

export function pickTriad(inventory: LetterInventory[], signature: Letter): Triad {
  const freq = frequencyRank(inventory);
  const others = freq.filter((item) => item.letter !== signature);
  const second = others[0]?.letter ?? freq[0]?.letter ?? signature;
  const third =
    others[1]?.letter ??
    freq.find((item) => item.letter !== second)?.letter ??
    second;
  return [signature, second, third];
}

export function kindredArchetypes(triad: Triad, limit = 8): Archetype[] {
  const [primary, second, third] = triad;
  const complements = themeOf(primary).complements;
  const seen = new Set<string>([`${primary}${second}${third}`]);
  const out: Archetype[] = [];

  const candidates: Triad[] = [];
  for (const letter of complements) {
    if (letter !== second) candidates.push([primary, letter, third]);
    if (letter !== third) candidates.push([primary, second, letter]);
  }
  for (const letter of ALPHABET) {
    if (letter === primary || letter === second || letter === third) continue;
    candidates.push([primary, second, letter]);
    candidates.push([primary, letter, third]);
  }

  for (const next of candidates) {
    const code = next.join("");
    if (seen.has(code)) continue;
    seen.add(code);
    out.push(archetypeOf(next));
    if (out.length >= limit) break;
  }
  return out;
}

export function houseArchetypes(primary: Letter): { manner: Letter; items: Archetype[] }[] {
  return ALPHABET.map((second) => ({
    manner: second,
    items: ALPHABET.map((third) => archetypeOf([primary, second, third])),
  }));
}

export function allHouseNames(): { letter: Letter; house: string; noun: string }[] {
  return ALPHABET.map((letter) => {
    const role = roleOf(letter);
    return { letter, house: role.house, noun: role.noun };
  });
}

export const ARCHETYPE_COUNT = 26 * 26 * 26;

export function parseTriadCode(raw: string | undefined): Triad | null {
  if (!raw) return null;
  const code = raw.toUpperCase().replace(/[^A-Z]/g, "");
  if (code.length < 3) return null;
  const a = code[0];
  const b = code[1];
  const c = code[2];
  if (!ALPHABET.includes(a) || !ALPHABET.includes(b) || !ALPHABET.includes(c)) return null;
  return [a, b, c];
}
