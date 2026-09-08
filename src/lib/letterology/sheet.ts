import { houseOf } from "./archetypes";
import { CIRCUIT_CLOSE, NEVER_SAY, SAY_THIS } from "./brief";
import { alliesOf, enemiesOf } from "./circle";
import type { Horoscope } from "./types";
import { ALPHABET } from "./types";
import { HORAE } from "../stoicheia/horae";
import type { Stoicheion } from "../stoicheia/engine";

export { CIRCUIT_CLOSE, NEVER_SAY, SAY_THIS };

export const FIELD_VOICE = [
  { title: "Circuit", line: "See the whole name first. Count the letters. Then look back at the person they came from." },
  { title: "Material", line: "We read usernames. We do not read birthdays or legal names." },
  { title: "Charge", line: "Give them one thing they can do before sunset." },
  { title: "Ethic", line: "Luck is willingness, not fate. Hand them the card, then stop talking." },
] as const;

export const LATIN_STEPS = [
  { n: "1", title: "Clean", line: "Drop the @ sign, keep A through Z, and read digits as letters. One is A, and zero is the Fool." },
  { n: "2", title: "Role", line: "The first letter of the first word is the house, which is how you enter." },
  { n: "3", title: "Weight", line: "Letters that return count more. The next two heaviest are how you work, then where you work." },
  { n: "4", title: "Path", line: "Say the three roles out loud. Give one invitation from the first house." },
  { n: "5", title: "Day", line: "Today’s date-letter and its allies run warm. Its enemies ask you to wait. Then say what to do, what to wait on, and who to ask." },
] as const;

export const GREEK_STEPS = [
  { n: "1", title: "Clean", line: "Turn C into Κ, TH into Θ, PH into Φ, and J into Ι. Drop anything that cannot become one of the twenty-four." },
  { n: "2", title: "Road", line: "The first letter is how the name enters. The last letter is how it leaves. If they match, finish the rite." },
  { n: "3", title: "Hymn", line: "Sing the vowels in order. Do not weigh them. They may climb, fall, loop, hold one note, or stay silent." },
  { n: "4", title: "Body", line: "The heaviest consonant is the public office. The next is the place of work. Do not swap them." },
  { n: "5", title: "Total", line: "Add the Milesian values. The sum lands on one of twenty-four hours. It is not a lucky digit." },
] as const;

export const LUCK_BANDS = [
  { min: 80, band: "open", verdict: "Doors ajar", charge: "Make the move this house already names." },
  { min: 65, band: "warm", verdict: "Warm", charge: "Do the house’s work." },
  { min: 50, band: "workable", verdict: "Workable", charge: "Keep one aim and finish it." },
  { min: 36, band: "mixed", verdict: "Mixed", charge: "Do not take a crown, and do not take an excuse." },
  { min: 20, band: "contrary", verdict: "Gentle", charge: "Do the small necessary thing." },
  { min: 0, band: "withdraw", verdict: "Wait", charge: "Hold. Do not launch." },
] as const;

export const DECISION_FITS = [
  { fit: "home", line: "The act shares your first letter. It is your job if the day is willing." },
  { fit: "ally", line: "The act is a friend of the role. Help with it. Do not become it." },
  { fit: "friction", line: "The act is a known opponent. Name the cost before you move." },
  { fit: "foreign", line: "The act is guest work. Do it without making it your identity." },
] as const;

export const DECISION_TIMING = [
  { timing: "now", line: "The act and the day agree. Move before noon." },
  { timing: "today-ok", line: "The day will carry it if you keep it small." },
  { timing: "wait", line: "The day withdraws. Keep the act written." },
  { timing: "reframe", line: "Rename the act, then read it again." },
] as const;

export const TWO_LATIN = [
  { title: "Role", line: "Compare first letters: same, ally, enemy, or foreign." },
  { title: "How", line: "Compare second letters: one workshop, or two crafts." },
  { title: "Where", line: "Compare third letters: one field, or two rooms." },
  { title: "Gift", line: "Name the ally one lacks that the other already carries." },
  { title: "Fit", line: "The number is a fit of materials. It is not a soulmate." },
] as const;

export const TWO_GREEK = [
  { title: "Arrival", line: "Watch how one first letter meets the other’s last letter." },
  { title: "Table", line: "A shared planet or a shared total is the table. The guest goes first." },
  { title: "Leave", line: "Notice how each road finishes." },
  { title: "Xenia", line: "Guest-friendship is a duty: arrive, eat, leave. There is no score." },
  { title: "Agon", line: "Contest is the other door. Award prizes. Do not set a table." },
] as const;

export const MOTION_RULES = [
  { motion: "silent", rule: "There are no vowels. Make one public act." },
  { motion: "unison", rule: "Hold one note. Do not add a second mood." },
  { motion: "ascent", rule: "Take the harder step first. Skip the soft errand." },
  { motion: "descent", rule: "Make one private judgment. Do not announce it." },
  { motion: "periodos", rule: "Name the date of the return." },
] as const;

export const TIGHTNESS_RULES = [
  { state: "bound", rule: "Do not open a second front today." },
  { state: "loosed", rule: "Pick one binding and keep it." },
  { state: "held", rule: "Make one public act and one private act." },
] as const;

export const LIKENESS_RULES = [
  { state: "like", rule: "Keep the same job all week." },
  { state: "unlike", rule: "Do the consonant’s work in the morning. Leave at the last hour." },
] as const;

export const DAY_WEATHER = [
  { weather: "hearth", rule: "Feed the work you already know." },
  { weather: "road", rule: "Say one true sentence and take one next step." },
  { weather: "contest", rule: "Choose one opponent only." },
  { weather: "mystery", rule: "Do one slow act. Make no announcement." },
  { weather: "exile", rule: "Do the hour’s work. Do not become the hour." },
  { weather: "symposium", rule: "Offer help. Leave one claim unsaid." },
  { weather: "omen", rule: "Take one small step that this letter already names." },
] as const;

export const COUNT_MARKS = [
  { mark: "A–I", line: "These letters write one through nine." },
  { mark: "J–R", line: "These letters write ten through eighteen." },
  { mark: "S–Z", line: "These letters write nineteen through twenty-six." },
  { mark: "AA", line: "AA is twenty-seven." },
  { mark: "0", line: "Zero arrives as the Fool, which is a blank." },
] as const;

export const VOWEL_CHOIR = [
  { letter: "Α", face: "Selene", planet: "Moon" },
  { letter: "Ε", face: "Hermes", planet: "Mercury" },
  { letter: "Η", face: "Aphrodite", planet: "Venus" },
  { letter: "Ι", face: "Helios", planet: "Sun" },
  { letter: "Ο", face: "Ares", planet: "Mars" },
  { letter: "Υ", face: "Zeus", planet: "Jupiter" },
  { letter: "Ω", face: "Kronos", planet: "Saturn" },
] as const;

export function latinHouses() {
  return ALPHABET.map((letter) => {
    const house = houseOf(letter);
    return {
      letter,
      noun: house.noun,
      realm: house.realm,
      invitation: house.invitation,
      allies: alliesOf(letter).join(""),
      enemies: enemiesOf(letter).join(""),
    };
  });
}

export function greekHours() {
  return HORAE.map((hora) => ({
    letter: hora.letter,
    noun: hora.noun,
    watch: hora.watch,
    realm: hora.realm,
    invitation: hora.invitation,
  }));
}

export function speakLatin(h: Horoscope): string {
  const [role, manner, field] = h.triad;
  const a = houseOf(role);
  const b = houseOf(manner);
  const c = houseOf(field);
  return `${h.displayName} is ${role}${manner}${field}. That is the ${a.noun}, working as ${b.noun} in the ${c.realm}. ${a.invitation}`;
}

export function speakGreek(s: Stoicheion): string {
  const first = s.road.first;
  const last = s.road.last;
  const road = s.road.closed
    ? `The road is a closed ${first.noun}. Finish it.`
    : `The road runs from ${first.noun} toward ${last.noun}.`;
  const work = s.officeHora
    ? s.placeHora
      ? `The public office is ${s.officeHora.noun} in ${s.placeHora.noun}.`
      : `The public office is ${s.officeHora.noun}.`
    : "The public work is thin.";
  return `${s.raw} is written ${s.spelled}. First ${s.axis.proodos}, last ${s.axis.epistrophe}. ${road} ${work} ${s.invitation}`;
}

export function sheetPlainText(tongue: "la" | "el"): string {
  const houses = latinHouses()
    .map((row) => `${row.letter} ${row.noun} ${row.realm} — ${row.invitation}`)
    .join("\n");
  const hours = greekHours()
    .map((row) => `${row.letter} ${row.noun} — ${row.invitation}`)
    .join("\n");
  const speech = [
    CIRCUIT_CLOSE,
    ...NEVER_SAY.map((line) => `Never say: ${line}`),
    ...SAY_THIS.map((line) => `Say this: ${line}`),
  ].join("\n");
  if (tongue === "el") {
    return [
      "CC33 Field Sheet · Greek",
      GREEK_STEPS.map((step) => `${step.n} ${step.title}: ${step.line}`).join("\n"),
      hours,
      MOTION_RULES.map((row) => `${row.motion}: ${row.rule}`).join("\n"),
      speech,
    ].join("\n");
  }
  return [
    "CC33 Field Sheet · Latin",
    LATIN_STEPS.map((step) => `${step.n} ${step.title}: ${step.line}`).join("\n"),
    houses,
    LUCK_BANDS.map((row) => `${row.verdict}: ${row.charge}`).join("\n"),
    speech,
  ].join("\n");
}
