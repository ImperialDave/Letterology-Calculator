import { alliesOf, enemiesOf } from "./circle";
import { houseOf } from "./archetypes";
import { archetypeOf } from "./archetypes";
import type { Archetype, Letter, Triad } from "./types";
import { ALPHABET } from "./types";

/** March 21 — the Station of the Seeker, where the year-walk begins. */
export const WALK_MONTH = 2;
export const WALK_DAY = 21;
export const FORTNIGHT_LENGTH = 14;
export const FORTNIGHTS_IN_WALK = 26;
export const WALK_DAYS = FORTNIGHT_LENGTH * FORTNIGHTS_IN_WALK;
export const HINGE_LETTER: Letter = "F";

const WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export type WeekdayRole = "house" | "ally" | "enemy";

export interface CivilDate {
  year: number;
  month: number;
  day: number;
}

export interface FortnightSeat {
  letter: Letter;
  index: number;
  walkYear: number;
  dayInSeat: number;
  hinge: boolean;
  start: CivilDate;
  end: CivilDate;
}

export interface AlmanacDay {
  civil: CivilDate;
  iso: string;
  weekday: number;
  weekdayName: string;
  yearLetter: Letter;
  fortnight: FortnightSeat;
  monthLetter: Letter;
  monthLetters: Letter[];
  dateLetter: Letter;
  weekdayLetter: Letter;
  weekdayRole: WeekdayRole;
  triad: Triad;
  archetype: Archetype;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function toCivil(date: Date): CivilDate {
  return { year: date.getFullYear(), month: date.getMonth(), day: date.getDate() };
}

export function fromCivil(civil: CivilDate): Date {
  return new Date(civil.year, civil.month, civil.day, 12, 0, 0, 0);
}

export function isoOf(civil: CivilDate): string {
  return `${civil.year}-${pad(civil.month + 1)}-${pad(civil.day)}`;
}

export function parseIso(raw: string | undefined): CivilDate | null {
  if (!raw) return null;
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = fromCivil({ year, month, day });
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null;
  return { year, month, day };
}

export function addDays(civil: CivilDate, days: number): CivilDate {
  const date = fromCivil(civil);
  date.setDate(date.getDate() + days);
  return toCivil(date);
}

export function daysBetween(a: CivilDate, b: CivilDate): number {
  const start = Date.UTC(a.year, a.month, a.day);
  const end = Date.UTC(b.year, b.month, b.day);
  return Math.round((end - start) / 86_400_000);
}

export function monthName(month: number): string {
  return MONTH_NAMES[month] ?? MONTH_NAMES[0];
}

export function letterAt(index: number): Letter {
  const normalized = ((index % 26) + 26) % 26;
  return ALPHABET[normalized] ?? "A";
}

/** Civil year 1 is A, year 26 is Z, year 27 is A. 2026 is X, the Trickster. */
export function yearLetter(year: number): Letter {
  return letterAt(year - 1);
}

export function dateLetter(dayOfMonth: number): Letter {
  return letterAt(dayOfMonth - 1);
}

export function weekdayIndex(civil: CivilDate): number {
  return (fromCivil(civil).getDay() + 6) % 7;
}

export function weekSeats(house: Letter): Letter[] {
  return [house, ...alliesOf(house), ...enemiesOf(house)];
}

export function weekdayAspect(civil: CivilDate, house: Letter): { letter: Letter; role: WeekdayRole } {
  const seats = weekSeats(house);
  const index = weekdayIndex(civil);
  const letter = seats[index] ?? house;
  const role: WeekdayRole = index === 0 ? "house" : index < 4 ? "ally" : "enemy";
  return { letter, role };
}

function walkStartOnOrBefore(civil: CivilDate): CivilDate {
  const candidate = { year: civil.year, month: WALK_MONTH, day: WALK_DAY };
  if (daysBetween(candidate, civil) >= 0) return candidate;
  return { year: civil.year - 1, month: WALK_MONTH, day: WALK_DAY };
}

export function fortnightOf(civil: CivilDate): FortnightSeat {
  const walkStart = walkStartOnOrBefore(civil);
  const elapsed = daysBetween(walkStart, civil);

  if (elapsed >= WALK_DAYS) {
    const nextWalk = { year: walkStart.year + 1, month: WALK_MONTH, day: WALK_DAY };
    return {
      letter: HINGE_LETTER,
      index: 26,
      walkYear: walkStart.year,
      dayInSeat: elapsed - WALK_DAYS + 1,
      hinge: true,
      start: addDays(walkStart, WALK_DAYS),
      end: addDays(nextWalk, -1),
    };
  }

  const index = Math.floor(elapsed / FORTNIGHT_LENGTH);
  const startOffset = index * FORTNIGHT_LENGTH;
  return {
    letter: letterAt(index),
    index,
    walkYear: walkStart.year,
    dayInSeat: (elapsed % FORTNIGHT_LENGTH) + 1,
    hinge: false,
    start: addDays(walkStart, startOffset),
    end: addDays(walkStart, startOffset + FORTNIGHT_LENGTH - 1),
  };
}

export function monthLetters(year: number, month: number): Letter[] {
  const first = { year, month, day: 1 };
  const last = addDays({ year, month: month + 1, day: 1 }, -1);
  const seen: Letter[] = [];
  const span = daysBetween(first, last);
  for (let offset = 0; offset <= span; offset += 1) {
    const seat = fortnightOf(addDays(first, offset));
    const letter = seat.hinge ? HINGE_LETTER : seat.letter;
    if (!seen.includes(letter)) seen.push(letter);
  }
  return seen;
}

export function monthLetter(year: number, month: number): Letter {
  return fortnightOf({ year, month, day: 15 }).letter;
}

export function almanacOf(date: Date | CivilDate = new Date()): AlmanacDay {
  const civil = date instanceof Date ? toCivil(date) : date;
  const year = yearLetter(civil.year);
  const fortnight = fortnightOf(civil);
  const seatLetter = fortnight.hinge ? HINGE_LETTER : fortnight.letter;
  const month = monthLetter(civil.year, civil.month);
  const dateSeat = dateLetter(civil.day);
  const weekday = weekdayIndex(civil);
  const aspect = weekdayAspect(civil, seatLetter);
  const triad: Triad = [year, seatLetter, dateSeat];
  return {
    civil,
    iso: isoOf(civil),
    weekday,
    weekdayName: WEEKDAY_NAMES[weekday] ?? WEEKDAY_NAMES[0],
    yearLetter: year,
    fortnight,
    monthLetter: month,
    monthLetters: monthLetters(civil.year, civil.month),
    dateLetter: dateSeat,
    weekdayLetter: aspect.letter,
    weekdayRole: aspect.role,
    triad,
    archetype: archetypeOf(triad),
  };
}

export function daysInMonth(year: number, month: number): AlmanacDay[] {
  const first = { year, month, day: 1 };
  const count = addDays({ year, month: month + 1, day: 1 }, -1).day;
  return Array.from({ length: count }, (_, index) => almanacOf(addDays(first, index)));
}

export function walkFortnights(walkYear: number): FortnightSeat[] {
  const start = { year: walkYear, month: WALK_MONTH, day: WALK_DAY };
  return ALPHABET.map((_, index) => fortnightOf(addDays(start, index * FORTNIGHT_LENGTH)));
}

export function yearDoctrine(letter: Letter): string {
  const house = houseOf(letter);
  return `The civil year sits in the ${house.house}. ${house.myth}`;
}

export function fortnightDoctrine(seat: FortnightSeat): string {
  if (seat.hinge) {
    return "These are the unnumbered days between one walk and the next — the Fool's gate, when the year has finished the circle and has not yet begun again.";
  }
  const house = houseOf(seat.letter);
  return `For fourteen days the sun sits in the ${house.house}. ${house.myth}`;
}

export function calendarMethod(): string {
  return "The year is a walk around the Circle of Houses. Twenty-six fortnights, beginning at the Station of the Seeker on 21 March, return the sun to A a year later. The leftover day or two before the next threshold are the Fool's hinge. The civil year has its own house on a twenty-six-year cycle — year 1 is A — and each date wears the letter of its number. A day's triad is year, fortnight, and date: the same grammar as a name.";
}
