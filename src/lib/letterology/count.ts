import { houseOf } from "./archetypes";
import { letterAt } from "./calendar";
import { relationTo } from "./circle";
import { buildHoroscope } from "./engine";
import { hopDistance, hopPhrase } from "./geometry";
import type { Horoscope, Letter } from "./types";

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
    return { remainder: "F", circles: [], chain: ["F"] };
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
    horoscope,
    placeHoroscope,
    seatHoroscope,
  };
}

export function countMeeting(seat: Letter, signature: Letter): string {
  if (seat === signature) {
    return `This count sits your own house — ${houseOf(seat).house}.`;
  }
  const kind = relationTo(signature, seat);
  const hops = hopDistance(signature, seat);
  if (kind === "ally") {
    return `This count sits ${houseOf(seat).noun}, an ally of your ${houseOf(signature).noun}.`;
  }
  if (kind === "enemy") {
    return `This count sits ${houseOf(seat).noun}, a counterweight to your ${houseOf(signature).noun}.`;
  }
  return `This count sits ${houseOf(seat).noun}. From your ${houseOf(signature).noun} that is ${hopPhrase(hops)}.`;
}

export function countFile(digits: string): string {
  const safe = digits.replace(/[^\dd]/gi, "") || "0";
  return `count-${safe}.jpg`;
}

export function countFileOf(reading: CountReading): string {
  if (reading.fractionDigits) return `count-${reading.integerDigits}d${reading.fractionDigits}.jpg`;
  return `count-${reading.integerDigits}.jpg`;
}

export function speakChain(chain: Letter[]): string {
  if (chain.length === 0) return houseOf("F").house;
  if (chain.length === 1) return houseOf(chain[0] ?? "F").house;
  const last = chain[chain.length - 1] ?? "F";
  const rest = chain.slice(0, -1).map((letter) => houseOf(letter).noun);
  return `${rest.join(" of ")} of walks, then ${houseOf(last).house}`;
}
