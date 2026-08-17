import type { Stoicheion } from "./engine";
import type { XeniaReading } from "./xenia";

export const HOW_TO = [
  {
    term: "First letter / last letter",
    greek: "proodos / epistrophe",
    plain:
      "How the name starts and how it finishes. First letter toward last letter — Hekate toward Aphrodite, not a three-letter personality. A closed road starts and ends on the same hour, so finish what you start.",
  },
  {
    term: "The vowels, in order",
    greek: "the hymn",
    plain:
      "Seven vowels, seven planets, Moon to Saturn. Sung forward, in the order they appear. We do not weigh a song. Watch whether the vowels climb, fall, circuit, or stay on one note.",
  },
  {
    term: "Each letter",
    greek: "the book of the mark",
    plain:
      "A letter is a sound, an hour, and a number. First: how the mouth moves. Then: the hour it keeps. Then: the Milesian weight. Read it as first, last, middle, sung, or as public work — not as a personality type. Two vowels in a row are a sung pair. A doubled mark is one fact said again.",
  },
  {
    term: "The consonants",
    greek: "the civic body",
    plain:
      "The public work — what other people actually meet. The heaviest consonant is the office; the next is the place of work. Hard stops collide. Liquids bind. Doubles hit twice.",
  },
  {
    term: "The name’s total",
    greek: "isopsephy",
    plain:
      "Greeks already wrote numbers as letters. Add them and the sum lands on one of the twenty-four hours — the hour of the total, not a lucky digit. We do not fold 888 into 6. If an old word weighs the same, that is a sign, not a soul.",
  },
  {
    term: "Two names",
    greek: "xenia",
    plain:
      "Guest and host. We ask if the vowels share a planet, if the totals match, if one first letter is the other’s last. Guest-friendship is a duty, not a score. Contest is the other door — prizes, not a table.",
  },
  {
    term: "The day",
    greek: "Attic time",
    plain:
      "The civic day begins at sunset. Months are lunar and have festivals — the dead at the table, the city’s gift to Athena. New-moon and last-day leftovers belong with Hekate. The moon math is a mean month: good enough for a reading, not to launch a ship.",
  },
  {
    term: "Related / strife",
    greek: "kin / eris",
    plain:
      "Related letters share a sound-family (Π with Β and Φ) or a cult pair. A strife-pair is a blind spot, not a villain — the work that keeps the hour honest.",
  },
] as const;

export function tweetStoicheion(reading: Stoicheion): string {
  return `${reading.raw}\n${reading.epithet}\n${reading.motion.line}\nDaimon: ${reading.omphalosHora.noun}`;
}

export function tweetXenia(pair: XeniaReading): string {
  return `${pair.a.raw} & ${pair.b.raw}\n${pair.title}\n${pair.weather}`;
}

export function stoicheiaNamePath(name: string): string {
  return `/?n=${encodeURIComponent(name.trim())}&tongue=el`;
}

export function stoicheiaXeniaPath(a: string, b: string): string {
  return `/two?a=${encodeURIComponent(a.trim())}&b=${encodeURIComponent(b.trim())}&tongue=el`;
}

export function stoicheiaCardFile(kind: "name" | "xenia" | "total", key: string): string {
  const safe = key
    .toLowerCase()
    .replace(/[^a-z0-9α-ω]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `stoicheia-${kind}-${safe || "x"}.jpg`;
}
