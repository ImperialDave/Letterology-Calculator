import { houseOf } from "./archetypes";
import { monthName, parseIso, type CivilDate } from "./calendar";
import { dayReadingOf } from "./day-reading";
import { buildHoroscope } from "./engine";
import { WEATHER_COPY } from "./glossary";
import { actCounselOf, luckOf } from "./luck";
import type { Horoscope, Letter } from "./types";

const CLAUSE_MAX = 34;
const HEADLINE_MAX = 90;
const HANDLE_MAX = 28;
const DANGLING = /^(you|a|an|the|or|and|not|to|of|for|have|with)$/i;

export interface DayCardModel {
  handle: string;
  roleLetter: Letter;
  roleNoun: string;
  dateLetter: Letter;
  dateNoun: string;
  weatherLabel: string;
  headline: string;
  verdict: string;
  score: number;
  dateLabel: string;
  iso: string;
  do: string;
  wait: string;
  ask: string;
}

function fit(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const words = clean.split(" ");
  const kept: string[] = [];
  for (const word of words) {
    const next = kept.length ? `${kept.join(" ")} ${word}` : word;
    if (next.length > max) break;
    kept.push(word);
  }
  return kept.join(" ") || clean.slice(0, max);
}

/**
 * A move short enough to say aloud.
 * One bare verb picks up the next comma-piece ("start, apply").
 * A line with "or" keeps the first alternative.
 * Trailing scraps ("you", "have") drop off so the line still reads.
 */
export function firstClause(value: string, max = CLAUSE_MAX): string {
  const head = (value.split(/[;.]/)[0] ?? "").trim();
  const commas = head.split(",").map((part) => part.trim()).filter(Boolean);
  let line = commas[0] ?? "";
  if (commas[1] && line.split(/\s+/).length < 3) {
    const joined = `${line}, ${commas[1]}`;
    if (joined.length <= max) line = joined;
  }
  const alternatives = line.split(/\s+or\s+/i);
  if (alternatives.length > 1 && (alternatives[0]?.split(/\s+/).length ?? 0) >= 2) {
    line = alternatives[0] ?? line;
  }
  const words = fit(line, max).split(/\s+/).filter(Boolean);
  while (words.length > 2 && DANGLING.test(words[words.length - 1] ?? "")) words.pop();
  return words.join(" ");
}

function dateLabelOf(iso: string, weekdayName: string): string {
  const civil = parseIso(iso);
  const weekday = weekdayName.slice(0, 3).toUpperCase();
  if (!civil) return weekday;
  const month = monthName(civil.month).slice(0, 3).toUpperCase();
  return `${weekday} ${civil.day} ${month}`;
}

/**
 * The poster for one person's day. Clipped before it ever reaches a picture.
 * The essay (day job, climate, full counsel) stays on the page.
 */
export function dayCardOf(
  person: Horoscope | string,
  date: Date | CivilDate = new Date(),
): DayCardModel | null {
  const horoscope = typeof person === "string" ? buildHoroscope(person) : person;
  if (!horoscope) return null;
  const day = dayReadingOf(horoscope, date);
  if (!day) return null;
  const luck = luckOf(horoscope, date);

  const manner = luck.seats.find((seat) => seat.role === "manner");
  const doLetter = manner?.current === "favorable" ? manner.letter : horoscope.triad[0];
  const waitLetter = luck.contrary[0] ?? horoscope.enemies[0] ?? "F";
  const present = new Set(horoscope.inventory.map((item) => item.letter));
  const askLetter =
    horoscope.kinAbsent[0] ?? luck.favorable.find((letter) => !present.has(letter)) ?? "D";

  return {
    handle: fit(horoscope.displayName, HANDLE_MAX),
    roleLetter: horoscope.triad[0],
    roleNoun: houseOf(horoscope.triad[0]).noun,
    dateLetter: luck.dateLetter,
    dateNoun: houseOf(luck.dateLetter).noun,
    weatherLabel: WEATHER_COPY[day.weather]?.label ?? "Unmarked",
    headline: fit(day.headline, HEADLINE_MAX),
    verdict: luck.verdict,
    score: luck.score,
    dateLabel: dateLabelOf(luck.iso, luck.weekdayName),
    iso: luck.iso,
    do: firstClause(actCounselOf(doLetter).lean),
    wait: firstClause(actCounselOf(waitLetter).wait),
    ask: fit(`a ${houseOf(askLetter).noun}`, CLAUSE_MAX),
  };
}
