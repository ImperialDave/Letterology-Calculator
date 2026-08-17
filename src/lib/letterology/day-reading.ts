import { houseOf } from "./archetypes";
import {
  almanacOf,
  monthName,
  type CivilDate,
} from "./calendar";
import { bondCopy, relationTo } from "./circle";
import { buildHoroscope } from "./engine";
import { hopDistance, hopPhrase, resonanceOf } from "./geometry";
import type { DayReading, DayWeather, Horoscope, Letter, MeetKind } from "./types";

function meet(a: Letter, b: Letter): MeetKind {
  if (a === b) return "same";
  return relationTo(a, b) ?? "none";
}

function lettersInName(person: Horoscope): Set<Letter> {
  return new Set(person.inventory.map((item) => item.letter));
}

function fortnightAge(dayInSeat: number): "early" | "mid" | "late" {
  if (dayInSeat <= 5) return "early";
  if (dayInSeat <= 10) return "mid";
  return "late";
}

export function scoreWeather(input: {
  hinge: boolean;
  signature: Letter;
  date: Letter;
  weekday: Letter;
  weekdayRole: "house" | "ally" | "enemy";
  dateCarried: boolean;
}): { weather: DayWeather; score: number } {
  if (input.hinge) return { weather: "hinge", score: 0 };

  let score = 0;
  const toDate = meet(input.signature, input.date);
  if (toDate === "same") score += 3;
  else if (toDate === "ally") score += 1;
  else if (toDate === "enemy") score -= 2;
  if (input.dateCarried) score += 1;
  if (input.weekdayRole === "house") score += 1;
  if (input.weekdayRole === "enemy") score -= 1;
  const toWeek = meet(input.signature, input.weekday);
  if (toWeek === "enemy") score -= 1;
  if (toWeek === "ally") score += 1;

  let weather: DayWeather;
  if (score >= 4) weather = "homecoming";
  else if (score >= 2) weather = "kinship";
  else if (score <= -3) weather = "exile";
  else if (score <= -1) weather = "friction";
  else if (toDate === "none") weather = "ordinary";
  else weather = "crossing";

  return { weather, score };
}

function headlineOf(
  weather: DayWeather,
  signature: Letter,
  date: Letter,
  toDate: MeetKind,
  flavor: 0 | 1,
): string {
  const self = houseOf(signature);
  const today = houseOf(date);
  if (weather === "hinge") {
    return flavor
      ? "Leftover day — the year has finished and not begun again"
      : "A leftover day before the year starts over";
  }
  if (weather === "homecoming") {
    return flavor
      ? `Homecoming in the ${today.house}`
      : `Today is the same role as your username — ${today.noun}`;
  }
  if (weather === "kinship") {
    return flavor
      ? `Kinship: ${self.noun} with ${today.noun}`
      : `${self.noun} meets an ally — ${today.house}`;
  }
  if (weather === "friction") {
    if (toDate === "none") {
      return flavor ? `A hard day in the ${today.house}` : `Today’s texture is not yours — ${today.noun}`;
    }
    return flavor
      ? `Friction: ${self.noun} meets ${today.noun}`
      : `${today.noun} works against ${self.noun}`;
  }
  if (weather === "exile") {
    return flavor
      ? `Exile — ${today.house}`
      : `A hard day: ${self.noun} in the ${today.house}`;
  }
  if (weather === "crossing") {
    return flavor
      ? `A crossing in the ${today.house}`
      : `${self.noun} meets ${today.noun} today`;
  }
  return flavor
    ? `An ordinary day in the ${today.house}`
    : `Today is ${today.noun} — no special match`;
}

function dayJobOf(
  hinge: boolean,
  date: Letter,
  fortnight: Letter,
  weekday: Letter,
  weekdayRole: "house" | "ally" | "enemy",
  age: "early" | "mid" | "late",
): string {
  if (hinge) {
    return "Today is a leftover day between one year and the next. There is no numbered role to hide in. Travel light: finish one small thing, and do not start a new identity.";
  }
  const d = houseOf(date);
  const f = houseOf(fortnight);
  const w = houseOf(weekday);
  const ageLine =
    age === "early"
      ? "The fortnight has just opened."
      : age === "late"
        ? "The fortnight is nearly spent."
        : "The fortnight is in its middle work.";
  return `Today’s date names the ${d.house}. ${d.myth} ${ageLine} For these fourteen days the two-week stretch works as ${f.adj} — how the season is moving, not who you are. The weekday is ${w.noun} (${weekdayRole === "house" ? "the same role" : weekdayRole === "ally" ? "an ally of the season" : "a counterweight to the season"}) — what today's work is about. Do the day's job. Do not make it your whole name.`;
}

function meetingOf(
  signature: Letter,
  date: Letter,
  toDate: MeetKind,
  carried: boolean,
): string {
  const self = houseOf(signature);
  const today = houseOf(date);
  const where = carried
    ? `${date} already lives in the name`
    : `${date} is visiting — it is not in the name`;

  if (toDate === "same") {
    return `Today is your own role, the ${today.house}, and ${where}. As a ${self.noun}, you are on home ground — which can be a gift or a trap. Use the familiar work. Do not hide in it.`;
  }
  if (toDate === "ally") {
    return `The day brings an ally: ${today.noun}. ${where}. ${bondCopy(signature, date, "ally")} Let that house finish something you usually leave half-done.`;
  }
  if (toDate === "enemy") {
    return `Today pushes back: ${today.noun}. ${where}. ${bondCopy(signature, date, "enemy")} The friction is information. Do not pretend it is a verdict on the whole life.`;
  }
  return `The ${today.house} has no official bond with your ${self.noun} — ${hopPhrase(hopDistance(signature, date))}, resonance ${resonanceOf(signature, date)}. ${where}. Meet it as a guest, not a verdict. An unmarked day is still a real day; you get to write what the official table left blank.`;
}

function mannerOf(manner: Letter, fortnight: Letter, hinge: boolean, toFortnight: MeetKind): string {
  const m = houseOf(manner);
  if (hinge) {
    return `How you usually work is ${m.adj}. On a leftover day, hold it loosely.`;
  }
  const f = houseOf(fortnight);
  if (toFortnight === "same") {
    return `How you usually work is already ${m.adj} — the same work this two-week stretch is doing.`;
  }
  if (toFortnight === "ally") {
    return `How you usually work (${m.adj}) helps this two-week stretch (${f.adj}). ${bondCopy(manner, fortnight, "ally")}`;
  }
  if (toFortnight === "enemy") {
    return `How you usually work (${m.adj}) pushes against this two-week stretch (${f.adj}). ${bondCopy(manner, fortnight, "enemy")}`;
  }
  return `How you usually work is ${m.adj}. This two-week stretch works as ${f.adj}. They do not argue. They also do not complete each other.`;
}

function climateOf(year: Letter, month: Letter, date: Letter, signature: Letter, monthIndex: number): string {
  const y = houseOf(year);
  const mo = houseOf(month);
  const echoes: string[] = [];
  if (year === date || year === signature) {
    echoes.push(`the year is also ${year}`);
  }
  if (month === date || month === signature) {
    echoes.push(`the month is also ${month}`);
  }
  const echo = echoes.length
    ? ` ${echoes.join("; ")}. That does not rename today.`
    : "";
  return `Background only — ${y.house} colors the year ${year}; ${mo.house} colors ${monthName(monthIndex)}. Year and month are weather around the day. They do not get to rename the job.${echo}`;
}

function invitationOf(weather: DayWeather, signature: Letter, date: Letter): string {
  const self = houseOf(signature);
  const today = houseOf(date);
  if (weather === "hinge") {
    return "Carry one small thing across the gate. Leave the rest. A leftover day is for travel, not for founding a new life.";
  }
  if (weather === "homecoming" || weather === "kinship") {
    return `As a ${self.noun}, ${self.invitation} Today favors that work. Do it once, all the way through.`;
  }
  if (weather === "friction" || weather === "exile") {
    return `${today.invitation} Do not pretend today’s texture is yours.`;
  }
  return today.invitation;
}

function flavorBit(name: string, iso: string): 0 | 1 {
  let hash = 0;
  const key = `${name}|${iso}`;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 33 + key.charCodeAt(i)) >>> 0;
  }
  return (hash % 2) as 0 | 1;
}

export function dayReadingOf(
  person: Horoscope | string,
  date: Date | CivilDate = new Date(),
): DayReading | null {
  const horoscope = typeof person === "string" ? buildHoroscope(person) : person;
  if (!horoscope) return null;

  const almanac = almanacOf(date);
  const [signature, manner, field] = horoscope.triad;
  const inventory = lettersInName(horoscope);
  const dateLetter = almanac.dateLetter;
  const fortnightLetter = almanac.fortnight.hinge ? "F" : almanac.fortnight.letter;
  const weekdayLetter = almanac.weekdayLetter;
  const hinge = almanac.fortnight.hinge;
  const age = fortnightAge(almanac.fortnight.dayInSeat);
  const toDate = meet(signature, dateLetter);
  const toWeekday = meet(signature, weekdayLetter);
  const mannerToFortnight = meet(manner, fortnightLetter);
  const carried = {
    date: inventory.has(dateLetter),
    fortnight: inventory.has(fortnightLetter),
    weekday: inventory.has(weekdayLetter),
  };
  const { weather } = scoreWeather({
    hinge,
    signature,
    date: dateLetter,
    weekday: weekdayLetter,
    weekdayRole: almanac.weekdayRole,
    dateCarried: carried.date,
  });
  const flavor = flavorBit(horoscope.normalized, almanac.iso);
  const headline = headlineOf(weather, signature, dateLetter, toDate, flavor);
  const dayJob = dayJobOf(
    hinge,
    dateLetter,
    fortnightLetter,
    weekdayLetter,
    almanac.weekdayRole,
    age,
  );
  const meeting = meetingOf(signature, dateLetter, toDate, carried.date);
  const mannerLine = mannerOf(manner, fortnightLetter, hinge, mannerToFortnight);
  const climateNote = climateOf(
    almanac.yearLetter,
    almanac.monthLetter,
    dateLetter,
    signature,
    almanac.civil.month,
  );
  const invitation = invitationOf(weather, signature, dateLetter);
  const fullText = [dayJob, meeting, mannerLine, climateNote, invitation].join("\n\n");

  return {
    iso: almanac.iso,
    weather,
    person: {
      signature,
      manner,
      field,
      title: horoscope.archetype.title,
      house: horoscope.archetype.house,
      displayName: horoscope.displayName,
    },
    day: {
      date: dateLetter,
      fortnight: fortnightLetter,
      weekday: weekdayLetter,
      weekdayRole: almanac.weekdayRole,
      hinge,
      fortnightAge: age,
    },
    climate: { year: almanac.yearLetter, month: almanac.monthLetter },
    relations: { toDate, toWeekday, mannerToFortnight },
    carried,
    headline,
    dayJob,
    meeting,
    manner: mannerLine,
    climateNote,
    invitation,
    fullText,
  };
}
