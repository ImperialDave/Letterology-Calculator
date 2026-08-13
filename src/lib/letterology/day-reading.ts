import { houseOf } from "./archetypes";
import {
  almanacOf,
  monthName,
  type CivilDate,
} from "./calendar";
import { bondCopy, relationTo } from "./circle";
import { buildHoroscope } from "./engine";
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
    return flavor ? "Hinge day — the Fool holds the leftover hours" : "The Fool's hinge";
  }
  if (weather === "homecoming") {
    return flavor
      ? `Homecoming in the ${today.house}`
      : `The day sits in your house — ${today.noun}`;
  }
  if (weather === "kinship") {
    return flavor
      ? `Kinship: ${self.noun} with ${today.noun}`
      : `${self.noun} meets an ally — ${today.house}`;
  }
  if (weather === "friction") {
    if (toDate === "none") {
      return flavor ? `A hard day in the ${today.house}` : `The ${today.noun}'s grain is not yours`;
    }
    return flavor
      ? `Friction: ${self.noun} meets ${today.noun}`
      : `${today.noun} works against ${self.noun}`;
  }
  if (weather === "exile") {
    return flavor
      ? `Exile weather — ${today.house}`
      : `A hard grain: ${self.noun} in the ${today.house}`;
  }
  if (weather === "crossing") {
    return flavor
      ? `A crossing in the ${today.house}`
      : `${self.noun} walks into ${today.noun}`;
  }
  return flavor
    ? `An ordinary day in the ${today.house}`
    : `Today sits ${today.noun} — no special bond`;
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
    return "Today is a leftover day between one year-walk and the next. The Fool holds the gate. There is no numbered house to sit. Travel light.";
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
  return `Today sits the ${d.house} — the role the date names. ${d.myth} ${ageLine} For these fourteen days the sun works as ${f.adj} (the current two-week seat). The weekday field is ${w.noun} (${weekdayRole}) — what today's work is about.`;
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
    return `The day is in your own house, the ${today.house}, and ${where}. As a ${self.noun}, you are on home ground.`;
  }
  if (toDate === "ally") {
    return `The day brings an ally: ${today.noun}. ${where}. ${bondCopy(signature, date, "ally")}`;
  }
  if (toDate === "enemy") {
    return `The day opposes your grain: ${today.noun}. ${where}. ${bondCopy(signature, date, "enemy")}`;
  }
  return `The ${today.house} has no standing bond with your ${self.noun}. ${where}. Meet it as a guest, not a verdict.`;
}

function mannerOf(manner: Letter, fortnight: Letter, hinge: boolean, toFortnight: MeetKind): string {
  const m = houseOf(manner);
  if (hinge) {
    return `Your usual manner is ${m.adj}. On a hinge day, hold it loosely.`;
  }
  const f = houseOf(fortnight);
  if (toFortnight === "same") {
    return `Your manner is already ${m.adj} — the same work the sun is doing this fortnight.`;
  }
  if (toFortnight === "ally") {
    return `Your ${m.adj} manner helps the fortnight's ${f.adj} work. ${bondCopy(manner, fortnight, "ally")}`;
  }
  if (toFortnight === "enemy") {
    return `Your ${m.adj} manner rubs the fortnight's ${f.adj} grain. ${bondCopy(manner, fortnight, "enemy")}`;
  }
  return `Your manner is ${m.adj}. The fortnight works as ${f.adj}. They do not argue. They also do not complete each other.`;
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
    ? ` ${echoes.join("; ")}. That does not sit today's house.`
    : "";
  return `Climate only — ${y.house} colors ${year} the civil year; ${mo.house} colors ${monthName(monthIndex)}.${echo}`;
}

function invitationOf(weather: DayWeather, signature: Letter, date: Letter): string {
  const self = houseOf(signature);
  const today = houseOf(date);
  if (weather === "hinge") {
    return "Carry one small thing across the gate. Leave the rest.";
  }
  if (weather === "homecoming" || weather === "kinship") {
    return `As a ${self.noun}, ${self.invitation} Today favors that.`;
  }
  if (weather === "friction" || weather === "exile") {
    return `${today.invitation} Do not pretend the grain is yours.`;
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
