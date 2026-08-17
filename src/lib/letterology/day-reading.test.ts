import assert from "node:assert/strict";
import test from "node:test";
import { buildHoroscope } from "./engine";
import { dayReadingOf, scoreWeather } from "./day-reading";
import { almanacOf } from "./calendar";
import { houseOf } from "./archetypes";

test("same name and date are bit-identical", () => {
  const a = dayReadingOf("Ada Lovelace", { year: 2026, month: 7, day: 13 });
  const b = dayReadingOf("Ada Lovelace", { year: 2026, month: 7, day: 13 });
  assert.ok(a && b);
  assert.equal(a.fullText, b.fullText);
  assert.equal(a.headline, b.headline);
});

test("different date letters change the day's house in the job", () => {
  const a = dayReadingOf("Ada Lovelace", { year: 2026, month: 7, day: 1 });
  const b = dayReadingOf("Ada Lovelace", { year: 2026, month: 7, day: 13 });
  assert.ok(a && b);
  assert.notEqual(a.day.date, b.day.date);
  assert.notEqual(a.dayJob, b.dayJob);
});

test("different signatures on the same date differ", () => {
  const a = dayReadingOf("Ada Lovelace", { year: 2026, month: 7, day: 13 });
  const b = dayReadingOf("Zora Neale Hurston", { year: 2026, month: 7, day: 13 });
  assert.ok(a && b);
  assert.notEqual(a.person.signature, b.person.signature);
  assert.notEqual(a.headline, b.headline);
});

test("carried vs visiting changes the meeting", () => {
  const date = { year: 2026, month: 7, day: 13 };
  const dayLetter = almanacOf(date).dateLetter;
  const withLetter = dayReadingOf(`Xxx ${dayLetter}aaa`, date);
  const without = dayReadingOf("Bbb Ccc", date);
  assert.ok(withLetter && without);
  if (withLetter.person.signature === without.person.signature) {
    assert.notEqual(withLetter.carried.date, without.carried.date);
    assert.notEqual(withLetter.meeting, without.meeting);
  } else {
    assert.ok(withLetter.meeting !== without.meeting || withLetter.headline !== without.headline);
  }
});

test("hinge days force hinge weather and skip a numbered fortnight house", () => {
  // 19 March 2026 is after the 364-day walk from 21 March 2025.
  const reading = dayReadingOf("Ada Lovelace", { year: 2026, month: 2, day: 19 });
  assert.ok(reading);
  if (reading.day.hinge) {
    assert.equal(reading.weather, "hinge");
    assert.match(reading.dayJob, /Fool|leftover|hinge/i);
    assert.doesNotMatch(reading.headline, /sits the House of the Seeker$/);
  }
});

test("headline and dayJob do not make the year-house the subject", () => {
  const reading = dayReadingOf("Ada Lovelace", { year: 2026, month: 7, day: 13 });
  assert.ok(reading);
  const yearHouse = houseOf(reading.climate.year).house;
  assert.doesNotMatch(reading.headline, new RegExp(`^${yearHouse}`));
  assert.match(reading.climateNote, /Background only/);
});

test("scoreWeather maps homecoming when the date is the signature and carried", () => {
  const { weather, score } = scoreWeather({
    hinge: false,
    signature: "A",
    date: "A",
    weekday: "A",
    weekdayRole: "house",
    dateCarried: true,
  });
  assert.ok(score >= 4);
  assert.equal(weather, "homecoming");
});

test("buildHoroscope still returns a person for the day engine", () => {
  const h = buildHoroscope("Ada Lovelace");
  assert.ok(h);
  const reading = dayReadingOf(h, { year: 2026, month: 7, day: 13 });
  assert.ok(reading);
  assert.equal(reading.person.displayName, "Ada Lovelace");
});
