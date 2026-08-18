import { atticOf, type AtticDay } from "./calendar";
import { festivalOf } from "./festival";
import type { Stoicheion } from "./engine";
import { familyOf } from "./family";
import { erisOf, horaOf, kinOf } from "./horae";
import { CHOIR } from "./hymn";
import { isVowel, type Stoich } from "./letters";

export type DayWeather = "hearth" | "road" | "contest" | "mystery" | "exile" | "symposium" | "omen";

export type StoicheiaDay = {
  attic: AtticDay;
  weather: DayWeather;
  headline: string;
  meeting: string;
  leftover: string | null;
  festivalLine: string;
  invitation: string;
};

const WEATHER_LINE: Record<DayWeather, string> = {
  hearth: "Today’s hour is already on this name’s road. Feed one piece of work you already know. Do not open a new project before that plate is clean.",
  road: "Today meets the name on the road. Speak one true sentence to someone on the way, then name one practical next step for them — or for yourself.",
  contest: "Today pushes back. Keep the strife useful: name the real opponent, fight only that, and put the rest down. Do not turn a hard hour into a new identity.",
  mystery: "The hour’s planet is already in the vowels. Do one slow act. Make no announcement. Offer no second interpretation today.",
  exile: "Today’s hour is not kin to this name. Do the hour’s work anyway. You do not have to become it.",
  symposium: "Shared breath and kinship. Pour for the guest first — one real offer of help. Leave one claim of your own unsaid.",
  omen: "The day’s total sits a letter this name already carries. Treat it as a sign: take one small step that letter already names. It is not a verdict.",
};

function leftoverLine(attic: AtticDay): string | null {
  if (attic.noumenia) return "New-moon day. Hekate keeps the leftovers. Travel light.";
  if (attic.heneKaiNea) return "Last day of the month — the old and the new. Hekate again.";
  return null;
}

function composeDayInvitation(input: {
  weather: DayWeather;
  hourNoun: string;
  firstNoun: string;
  officeNoun: string | null;
  hourInvitation: string;
}): string {
  const office = input.officeNoun
    ? `If you work publicly today, stay in the office of ${input.officeNoun}.`
    : "";
  const byWeather: Record<DayWeather, string> = {
    hearth: `Keep ${input.firstNoun} and ${input.hourNoun} on the same plate.`,
    road: `Walk as guest under ${input.hourNoun}; do not force a homecoming.`,
    contest: `Let ${input.hourNoun} sharpen one edge only.`,
    mystery: `Let ${input.hourNoun} stay quiet in the vowels.`,
    exile: `Serve ${input.hourNoun} without renaming yourself.`,
    symposium: `Share the table of ${input.hourNoun} without spending the whole name.`,
    omen: `Let the omen under ${input.hourNoun} choose one small step.`,
  };
  return [input.hourInvitation, byWeather[input.weather], office].filter(Boolean).join(" ");
}

export function dayOfStoicheion(reading: Stoicheion, when: Date = new Date()): StoicheiaDay {
  const attic = atticOf(when);
  const first = reading.axis.proodos;
  const last = reading.axis.epistrophe;
  const hour = attic.hora.letter;
  const month = attic.monthLetter;
  const hourKin = kinOf(first).includes(hour) || first === hour;
  const hourEris = erisOf(first).includes(hour);
  const monthKin = kinOf(last).includes(month) || last === month;
  const hourPlanet = isVowel(hour) ? CHOIR[hour]?.planet : null;
  const hymnHasHourPlanet = hourPlanet
    ? reading.hymn.some((item) => item.planet === hourPlanet)
    : false;
  const nameCarriesDate = reading.letters.includes(attic.dateSeat);

  let weather: DayWeather = "road";
  if (attic.hekateSeat && (first === "Α" || hour === "Α")) weather = "hearth";
  else if (nameCarriesDate && hymnHasHourPlanet) weather = "omen";
  else if (hourKin && hymnHasHourPlanet) weather = "mystery";
  else if (hourKin && monthKin) weather = "hearth";
  else if (hymnHasHourPlanet && (hourKin || monthKin)) weather = "symposium";
  else if (hourEris && !hourKin) weather = "contest";
  else if (!hourKin && !monthKin && !hymnHasHourPlanet) weather = "exile";
  else weather = "road";

  const leftover = leftoverLine(attic);
  const fest = festivalOf(attic.monthName);
  const festivalLine = `This month is ${attic.monthName}. ${fest.name} — ${fest.line}.`;
  const headline = leftover
    ? leftover
    : `${attic.hora.noun} is this hour — ${attic.hora.watch === "night" ? "night" : "day"} watch`;

  const meeting = [
    hourKin
      ? `This hour (${attic.hora.noun}) is kin to the first letter, ${horaOf(first).noun}.`
      : hourEris
        ? `This hour (${attic.hora.noun}) is a strife-pair for the first letter, ${horaOf(first).noun}.`
        : `This hour is ${attic.hora.noun}. The first letter is ${horaOf(first).noun}.`,
    monthKin
      ? `The month letter meets the last letter, ${horaOf(last).noun}.`
      : `The month is ${attic.monthName}.`,
    hymnHasHourPlanet ? "The hour’s planet is already in the vowels." : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    attic,
    weather,
    headline,
    meeting,
    leftover,
    festivalLine,
    invitation: leftover
      ? "Do one small thing. Leave the rest for the next month."
      : composeDayInvitation({
          weather,
          hourNoun: attic.hora.noun,
          firstNoun: horaOf(first).noun,
          officeNoun: reading.officeHora?.noun ?? null,
          hourInvitation: horaOf(hour).invitation,
        }),
  };
}

export function weatherLine(weather: DayWeather): string {
  return WEATHER_LINE[weather];
}

export function familyNote(letter: Stoich): string {
  return familyOf(letter);
}
