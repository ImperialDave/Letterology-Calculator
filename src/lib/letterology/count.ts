import { houseOf } from "./archetypes";
import { letterAt } from "./calendar";
import { relationTo } from "./circle";
import { buildHoroscope } from "./engine";
import { hopDistance, hopPhrase } from "./geometry";
import { ALPHABET, type Horoscope, type Letter } from "./types";

/** The ten glyphs. 0 is the Fool as absence. 6 is the Fool as the sixth house. */
export const DIGIT_LETTER: Record<string, Letter> = {
  "0": "F",
  "1": "A",
  "2": "B",
  "3": "C",
  "4": "D",
  "5": "E",
  "6": "F",
  "7": "G",
  "8": "H",
  "9": "I",
};

export const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

export type CountColumn = {
  digit: string;
  occupant: Letter;
  power: number;
  place: Letter;
  empty: boolean;
};

export type CountWalk = {
  /** Seat of the whole quantity. */
  remainder: Letter;
  /** Each full circle of twenty-six, letterated until nothing remains. */
  circles: Letter[];
  /** remainder, then the circle-count unfolded. Spoken last-to-first as nested walks. */
  chain: Letter[];
};

export type CountReading = {
  raw: string;
  digits: string;
  integerDigits: string;
  fractionDigits: string;
  inverted: boolean;
  quantity: bigint;
  seat: Letter;
  spelling: Letter[];
  display: string;
  columns: CountColumn[];
  fractionColumns: CountColumn[];
  placePath: Letter[];
  walk: CountWalk;
  slug: string;
  horoscope: Horoscope;
  placeHoroscope: Horoscope | null;
  seatHoroscope: Horoscope | null;
};

export function spellDigit(digit: string): Letter {
  return DIGIT_LETTER[digit] ?? "F";
}

export function spellDigits(raw: string): Letter[] {
  const out: Letter[] = [];
  for (const ch of raw) {
    if (ch in DIGIT_LETTER) out.push(DIGIT_LETTER[ch] as Letter);
  }
  return out;
}

export function seatOf(n: number | bigint): Letter {
  const value = typeof n === "bigint" ? n : BigInt(Math.trunc(n));
  if (value === 0n) return "F";
  const abs = value < 0n ? -value : value;
  return letterAt(Number((abs - 1n) % 26n));
}

/** The house of a decimal place. 10^0 is A. 10^1 is B. Below the unit walks backward from Z. */
export function placeLetter(power: number): Letter {
  return letterAt(power);
}

export function columnsOf(digits: string, fromPower: number): CountColumn[] {
  const cols: CountColumn[] = [];
  for (let i = 0; i < digits.length; i += 1) {
    const digit = digits[i] ?? "0";
    const power = fromPower + (digits.length - 1 - i);
    cols.push({
      digit,
      occupant: spellDigit(digit),
      power,
      place: placeLetter(power),
      empty: digit === "0",
    });
  }
  return cols;
}

/**
 * Unfold how many times the quantity walked the twenty-six houses.
 * 2026 = 77 circles + remainder X. 77 = 2 circles + Y. 2 sits B.
 * Chain spoken as B, Y, X — nested walks, never a folded digit.
 */
export function walkOf(quantity: bigint): CountWalk {
  if (quantity === 0n) {
    return emptyWalk();
  }
  const abs = quantity < 0n ? -quantity : quantity;
  const remainder = seatOf(abs);
  const circles: Letter[] = [];
  let circlesLeft = (abs - 1n) / 26n;
  while (circlesLeft > 0n) {
    circles.push(seatOf(circlesLeft));
    if (circlesLeft < 26n) break;
    circlesLeft = (circlesLeft - 1n) / 26n;
  }
  return { remainder, circles, chain: [...circles].reverse().concat(remainder) };
}

function letterValue(letter: Letter): bigint {
  const index = ALPHABET.indexOf(letter.toUpperCase());
  return index < 0 ? 0n : BigInt(index + 1);
}

function emptyWalk(): CountWalk {
  return { remainder: "F", circles: [], chain: [] };
}

/** Inverse of walkOf. Empty chain is nothing — the Fool, not the letter F. */
export function quantityOf(walk: CountWalk | Letter[]): bigint {
  const chain = Array.isArray(walk) ? walk : walk.chain;
  let value = 0n;
  for (const letter of chain) {
    value = value * 26n + letterValue(letter);
  }
  return value;
}

export function formatWalk(walk: CountWalk | Letter[]): string {
  const chain = Array.isArray(walk) ? walk : walk.chain;
  if (chain.length === 0) return "";
  return chain.join("·");
}

export function walkSlug(walk: CountWalk | Letter[], inverted = false): string {
  const chain = Array.isArray(walk) ? walk : walk.chain;
  const body = chain.length === 0 ? "fool" : chain.join("").toLowerCase();
  return inverted ? `w-${body}` : body;
}

export function parseWalk(raw: string): CountWalk | null {
  const compact = raw.trim().replace(/[·.\s\-_]/g, "").toUpperCase();
  if (!compact || compact === "FOOL") return emptyWalk();
  if (!/^[A-Z]+$/.test(compact)) return null;
  return walkOf(quantityOf([...compact]));
}

export function parseWalkSlug(raw: string): { walk: CountWalk; inverted: boolean } | null {
  const trimmed = raw.trim().toLowerCase();
  const inverted = /^w-/.test(trimmed);
  const body = inverted ? trimmed.slice(2) : trimmed;
  if (!body) return null;
  if (body === "fool") return { walk: emptyWalk(), inverted };
  if (!/^[a-z]+$/.test(body)) return null;
  const walk = parseWalk(body);
  if (!walk) return null;
  return { walk, inverted };
}

export function nextWalk(walk: CountWalk): CountWalk {
  return walkOf(quantityOf(walk) + 1n);
}

export function prevWalk(walk: CountWalk): CountWalk {
  const quantity = quantityOf(walk);
  if (quantity <= 0n) return emptyWalk();
  return walkOf(quantity - 1n);
}

export function joinWalks(a: CountWalk, b: CountWalk): CountWalk {
  return walkOf(quantityOf(a) + quantityOf(b));
}

export function partWalks(a: CountWalk, b: CountWalk): { walk: CountWalk; inverted: boolean } {
  const left = quantityOf(a);
  const right = quantityOf(b);
  if (left >= right) return { walk: walkOf(left - right), inverted: false };
  return { walk: walkOf(right - left), inverted: true };
}

export function compareWalks(a: CountWalk, b: CountWalk): number {
  const left = quantityOf(a);
  const right = quantityOf(b);
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

export function addLetter(walk: CountWalk, letter: Letter): CountWalk {
  return walkOf(quantityOf(walk) + letterValue(letter));
}

export function addPlace(walk: CountWalk, power: number): CountWalk {
  let place = 1n;
  for (let i = 0; i < power; i += 1) place *= 26n;
  return walkOf(quantityOf(walk) + place);
}

function splitNumber(raw: string): {
  inverted: boolean;
  integerDigits: string;
  fractionDigits: string;
  digits: string;
} {
  const trimmed = raw.trim();
  const compact = trimmed.replace(/[\s,_]/g, "");
  const inverted = /^-/.test(compact);
  const unsigned = compact.replace(/^[+-]/, "");
  const [whole = "", frac = ""] = unsigned.split(".");
  const integerDigits = whole.replace(/\D/g, "");
  const fractionDigits = frac.replace(/\D/g, "");
  return {
    inverted,
    integerDigits,
    fractionDigits,
    digits: `${integerDigits}${fractionDigits ? `x${fractionDigits}` : ""}`.replace(/^x/, "0x"),
  };
}

export function countReadingOf(raw: string): CountReading | null {
  const trimmed = raw.trim();
  const parts = splitNumber(trimmed);
  const integerDigits = parts.integerDigits || (parts.fractionDigits ? "0" : "");
  if (!integerDigits && !parts.fractionDigits) return null;

  const spelling = spellDigits(`${parts.integerDigits}${parts.fractionDigits}`);
  if (spelling.length === 0) return null;

  const quantity = parts.integerDigits ? BigInt(parts.integerDigits) : 0n;
  const display = spelling.join("");
  const horoscope = buildHoroscope(display);
  if (!horoscope) return null;

  const intSource = parts.integerDigits || "0";
  const columns = columnsOf(intSource, 0);
  const fractionColumns = parts.fractionDigits ? columnsOf(parts.fractionDigits, -parts.fractionDigits.length) : [];
  const placePath = [...columns, ...fractionColumns].map((col) => col.place);
  const placeHoroscope = placePath.length ? buildHoroscope(placePath.join("")) : null;
  const seat = seatOf(quantity);
  const seatHoroscope = buildHoroscope(seat);

  return {
    raw: trimmed,
    digits: parts.integerDigits || "0",
    integerDigits: intSource,
    fractionDigits: parts.fractionDigits,
    inverted: parts.inverted,
    quantity,
    seat,
    spelling,
    display,
    columns,
    fractionColumns,
    placePath,
    walk: walkOf(quantity),
    slug: walkSlug(walkOf(quantity), parts.inverted),
    horoscope,
    placeHoroscope,
    seatHoroscope,
  };
}

export function countMeeting(seat: Letter, signature: Letter): string {
  if (seat === signature) {
    return `This amount’s role is your own — ${houseOf(seat).house}. The number and the username meet on home ground. Use that; do not hide in it.`;
  }
  const kind = relationTo(signature, seat);
  const hops = hopDistance(signature, seat);
  if (kind === "ally") {
    return `This amount’s role is ${houseOf(seat).noun}, an ally of your ${houseOf(signature).noun}.`;
  }
  if (kind === "enemy") {
    return `This amount’s role is ${houseOf(seat).noun}, a counterweight to your ${houseOf(signature).noun}.`;
  }
  return `This amount’s role is ${houseOf(seat).noun}. From your ${houseOf(signature).noun} that is ${hopPhrase(hops)}.`;
}

export function readingFromSlug(slug: string): CountReading | null {
  const parsed = parseWalkSlug(slug);
  if (!parsed) return null;
  const { walk, inverted } = parsed;
  const seat = walk.remainder;
  const letters = walk.chain.join("") || "F";
  const horoscope = buildHoroscope(letters);
  if (!horoscope) return null;
  return {
    raw: "",
    digits: "",
    integerDigits: "",
    fractionDigits: "",
    inverted,
    quantity: 0n,
    seat,
    spelling: walk.chain.length ? [...walk.chain] : ["F"],
    display: formatWalk(walk),
    columns: [],
    fractionColumns: [],
    placePath: [],
    walk,
    slug: walkSlug(walk, inverted),
    horoscope,
    placeHoroscope: null,
    seatHoroscope: buildHoroscope(seat),
  };
}

export function countFile(digits: string): string {
  const safe = digits.replace(/[^\dd]/gi, "") || "0";
  return `count-${safe}.jpg`;
}

export function countFileOf(reading: CountReading): string {
  return `count-${reading.slug}.jpg`;
}

export function speakChain(chain: Letter[]): string {
  if (chain.length === 0) return houseOf("F").house;
  if (chain.length === 1) return houseOf(chain[0] ?? "F").house;
  const last = chain[chain.length - 1] ?? "F";
  const rest = chain.slice(0, -1).map((letter) => houseOf(letter).noun);
  return `${rest.join(" of ")} of walks, then ${houseOf(last).house}`;
}
