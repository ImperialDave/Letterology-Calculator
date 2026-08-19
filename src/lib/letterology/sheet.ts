import { houseOf } from "./archetypes";
import { alliesOf, enemiesOf } from "./circle";
import type { Horoscope } from "./types";
import { ALPHABET } from "./types";
import { HORAE } from "../stoicheia/horae";
import type { Stoicheion } from "../stoicheia/engine";

export const FIELD_VOICE = [
  { title: "Material", line: "Usernames. Not birthdays. Not legal names." },
  { title: "Charge", line: "One thing they can do before sunset." },
  { title: "Ethic", line: "Willingness, not fate. Give the card. Stop." },
] as const;

export const LATIN_STEPS = [
  { n: "1", title: "Fold", line: "Strip @. A–Z only. 0=F, 1=A … 9=I." },
  { n: "2", title: "Role", line: "First letter of the first token is the house." },
  { n: "3", title: "Weight", line: "Repeats count more. Next two heaviest: how, then where." },
  { n: "4", title: "Path", line: "Say the three nouns. One invitation from the first house." },
  { n: "5", title: "Day", line: "Date-letter + allies = warm. Enemies = wait. Then do / wait / ask." },
] as const;

export const GREEK_STEPS = [
  { n: "1", title: "Fold", line: "C→Κ, TH→Θ, PH→Φ, J→Ι. Drop the rest." },
  { n: "2", title: "Road", line: "First = enter. Last = leave. Same letter = finish it." },
  { n: "3", title: "Hymn", line: "Vowels in order. Do not weigh. Climb, fall, loop, one note, or silent." },
  { n: "4", title: "Body", line: "Heaviest consonant = office. Next = place. Do not swap." },
  { n: "5", title: "Total", line: "Add Milesian values. Sum is one of 24 hours — not a lucky digit." },
] as const;

export const LUCK_BANDS = [
  { min: 80, band: "open", verdict: "Doors ajar", charge: "Move." },
  { min: 65, band: "warm", verdict: "Warm", charge: "Do the house’s work." },
  { min: 50, band: "workable", verdict: "Workable", charge: "One aim." },
  { min: 36, band: "mixed", verdict: "Mixed", charge: "No crown, no excuse." },
  { min: 20, band: "contrary", verdict: "Gentle", charge: "Small necessary thing." },
  { min: 0, band: "withdraw", verdict: "Wait", charge: "Hold. No launch." },
] as const;

export const DECISION_FITS = [
  { fit: "home", line: "Same first letter. Their job if the day is willing." },
  { fit: "ally", line: "Friend of the role. Help, not a new self." },
  { fit: "friction", line: "Known opponent. Name the cost." },
  { fit: "foreign", line: "Guest work. Do it without becoming it." },
] as const;

export const DECISION_TIMING = [
  { timing: "now", line: "Act and day agree. Before noon." },
  { timing: "today-ok", line: "The day will carry it." },
  { timing: "wait", line: "Day withdraws. Keep it written." },
  { timing: "reframe", line: "Rename the act. Read again." },
] as const;

export const TWO_LATIN = [
  { title: "Role", line: "First letters: same / ally / enemy / foreign." },
  { title: "How", line: "Second letters: one workshop or two crafts." },
  { title: "Where", line: "Third letters: one field or two rooms." },
  { title: "Gift", line: "Ally one lacks that the other carries." },
  { title: "Fit", line: "A number of materials. Not a soulmate." },
] as const;

export const TWO_GREEK = [
  { title: "Arrival", line: "One first meets the other’s last." },
  { title: "Table", line: "Shared planet or shared total. Guest first." },
  { title: "Leave", line: "How each road finishes." },
  { title: "Xenia", line: "Duty: arrive, eat, leave. No score." },
  { title: "Agon", line: "Contest. Prizes, not a table." },
] as const;

export const MOTION_RULES = [
  { motion: "silent", rule: "No vowels. One public act." },
  { motion: "unison", rule: "Hold one note. No second mood." },
  { motion: "ascent", rule: "Harder step first. No soft errand." },
  { motion: "descent", rule: "One private judgment. Not public." },
  { motion: "periodos", rule: "Name the return date." },
] as const;

export const TIGHTNESS_RULES = [
  { state: "bound", rule: "No second front." },
  { state: "loosed", rule: "Pick one binding today." },
  { state: "held", rule: "One public act, one private." },
] as const;

export const LIKENESS_RULES = [
  { state: "like", rule: "Same job all week." },
  { state: "unlike", rule: "Consonant AM. Last hour at the exit." },
] as const;

export const DAY_WEATHER = [
  { weather: "hearth", rule: "Feed known work." },
  { weather: "road", rule: "One true sentence + one next step." },
  { weather: "contest", rule: "One opponent only." },
  { weather: "mystery", rule: "One slow act. No announcement." },
  { weather: "exile", rule: "Do the hour. Do not become it." },
  { weather: "symposium", rule: "Offer help. Leave one claim unsaid." },
  { weather: "omen", rule: "One small step that letter already names." },
] as const;

export const COUNT_MARKS = [
  { mark: "A–I", line: "1–9" },
  { mark: "J–R", line: "10–18" },
  { mark: "S–Z", line: "19–26" },
  { mark: "AA", line: "27" },
  { mark: "0", line: "visits as F" },
] as const;

export const NEVER_SAY = [
  "This is your destiny.",
  "The legal name is the real one.",
  "High fit means stay.",
  "A low day means you are unlucky.",
  "The total is a lucky number.",
  "Greek is Latin in other clothes.",
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
  return `${h.displayName}: ${role}${manner}${field}. ${a.noun} working as ${b.noun} in the ${c.realm}. ${a.invitation}`;
}

export function speakGreek(s: Stoicheion): string {
  const first = s.road.first;
  const last = s.road.last;
  const road = s.road.closed
    ? `Closed ${first.noun} — finish it.`
    : `${first.noun} → ${last.noun}.`;
  const work = s.officeHora
    ? s.placeHora
      ? `Office ${s.officeHora.noun} in ${s.placeHora.noun}.`
      : `Office ${s.officeHora.noun}.`
    : "Thin public work.";
  return `${s.raw} ${s.spelled}. ${s.axis.proodos} / ${s.axis.epistrophe}. ${road} ${work} ${s.invitation}`;
}

export function sheetPlainText(tongue: "la" | "el"): string {
  const houses = latinHouses()
    .map((row) => `${row.letter} ${row.noun} ${row.realm} — ${row.invitation}`)
    .join("\n");
  const hours = greekHours()
    .map((row) => `${row.letter} ${row.noun} — ${row.invitation}`)
    .join("\n");
  if (tongue === "el") {
    return [
      "CC33 Field Sheet · Greek",
      GREEK_STEPS.map((step) => `${step.n} ${step.title}: ${step.line}`).join("\n"),
      hours,
      MOTION_RULES.map((row) => `${row.motion}: ${row.rule}`).join("\n"),
    ].join("\n");
  }
  return [
    "CC33 Field Sheet · Latin",
    LATIN_STEPS.map((step) => `${step.n} ${step.title}: ${step.line}`).join("\n"),
    houses,
    LUCK_BANDS.map((row) => `${row.verdict}: ${row.charge}`).join("\n"),
  ].join("\n");
}
