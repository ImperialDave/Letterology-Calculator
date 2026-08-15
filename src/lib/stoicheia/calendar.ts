import { horaOf, type Hora } from "./horae";
import { stoichAt, type Stoich } from "./letters";
import { sitSum, spellQuantity } from "./milesian";

export const ATTIC_MONTHS = [
  "Hekatombaion",
  "Metageitnion",
  "Boedromion",
  "Pyanepsion",
  "Maimakterion",
  "Poseideon",
  "Gamelion",
  "Anthesterion",
  "Elaphebolion",
  "Mounichion",
  "Thargelion",
  "Skirophorion",
] as const;

export type AtticDay = {
  civil: Date;
  hour: number;
  hora: Hora;
  monthIndex: number;
  monthName: string;
  monthLetter: Stoich;
  dayInMonth: number;
  noumenia: boolean;
  heneKaiNea: boolean;
  hekateSeat: boolean;
  yearMark: Stoich;
  dateSpell: string;
  dateSeat: Stoich;
};

/** Mean new moon near J2000; good enough to sit a month, not to launch a ship. */
const SYNODIC = 29.530588853;
const NEW_MOON_J2000 = 2451550.1;

function julianDay(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

function newMoonsSince(jd: number): number {
  return Math.floor((jd - NEW_MOON_J2000) / SYNODIC);
}

function newMoonJd(index: number): number {
  return NEW_MOON_J2000 + index * SYNODIC;
}

function solstice(year: number): Date {
  return new Date(year, 5, 21, 12, 0, 0);
}

function hekatombaionStart(year: number): Date {
  const sol = solstice(year);
  const jd = julianDay(sol);
  let index = newMoonsSince(jd);
  let start = newMoonJd(index);
  if (start < jd) start = newMoonJd(index + 1);
  return new Date((start - 2440587.5) * 86400000);
}

export function atticHour(date: Date): number {
  const hours = date.getHours() + date.getMinutes() / 60;
  return Math.floor((hours - 18 + 24) % 24);
}

export function atticOf(date: Date = new Date()): AtticDay {
  const year = date.getFullYear();
  let start = hekatombaionStart(year);
  let markYear = year;
  if (date < start) {
    start = hekatombaionStart(year - 1);
    markYear = year - 1;
  }
  const dayMs = 86400000;
  const elapsed = Math.floor((date.getTime() - start.getTime()) / dayMs);
  const monthIndex = Math.min(11, Math.max(0, Math.floor(elapsed / 30)));
  const dayInMonth = Math.min(30, Math.max(1, (elapsed % 30) + 1));
  const hour = atticHour(date);
  const hora = horaOf(stoichAt(hour));
  const noumenia = dayInMonth === 1;
  const heneKaiNea = dayInMonth >= 29;
  return {
    civil: date,
    hour,
    hora,
    monthIndex,
    monthName: ATTIC_MONTHS[monthIndex] ?? ATTIC_MONTHS[0],
    monthLetter: stoichAt(monthIndex),
    dayInMonth,
    noumenia,
    heneKaiNea,
    hekateSeat: noumenia || heneKaiNea,
    yearMark: stoichAt(markYear),
    dateSpell: spellQuantity(dayInMonth),
    dateSeat: sitSum(dayInMonth),
  };
}
