import assert from "node:assert/strict";
import test from "node:test";
import { houseOf } from "./archetypes";
import { NEVER_SAY } from "./brief";
import { buildHoroscope } from "./engine";
import { pairEntries } from "./pairs";
import { readingOf } from "./reading";
import { FORBIDDEN_UI } from "./voice";
import type { Letter, Triad } from "./types";
import { ALPHABET } from "./types";

const BANNED = [
  ...FORBIDDEN_UI,
  /\bdestiny\b/i,
  /soulmate/i,
  /legal name/i,
  /birth chart/i,
  /\bmeets\b/i,
  /these houses are foreign/i,
];

function words(text: string): number {
  return text.trim().split(/\s+/).length;
}

test("every ordered pair of houses has one sentence", () => {
  const entries = pairEntries();
  assert.equal(entries.length, 26 * 25);
  const seen = new Set<string>();
  for (const { from, to, line } of entries) {
    assert.notEqual(from, to);
    assert.ok(line.endsWith("."), `${from}${to} does not end with a period`);
    assert.ok(line.length >= 60 && line.length <= 320, `${from}${to} length ${line.length}`);
    const count = words(line);
    assert.ok(count >= 12 && count <= 40, `${from}${to} has ${count} words`);
    assert.ok(!seen.has(line), `duplicate sentence on ${from}${to}`);
    seen.add(line);
    for (const banned of BANNED) {
      assert.doesNotMatch(line, banned, `${from}${to} matches ${banned}`);
    }
    for (const phrase of NEVER_SAY) {
      assert.ok(!line.includes(phrase), `${from}${to} says a banned line`);
    }
  }
});

test("every letter path is a distinct reading", () => {
  const texts = new Set<string>();
  const shadows = new Map<string, string>();
  for (const a of ALPHABET) {
    for (const b of ALPHABET) {
      for (const c of ALPHABET) {
        const triad: Triad = [a, b, c];
        const reading = readingOf(triad);
        const role = houseOf(a);
        const manner = houseOf(b);
        const field = houseOf(c);
        assert.match(reading.full, new RegExp(role.noun));
        assert.match(reading.full, new RegExp(manner.noun));
        assert.match(reading.full, new RegExp(field.realm));
        assert.ok(!texts.has(reading.full), triad.join(""));
        texts.add(reading.full);
        assert.notEqual(reading.shadow, reading.gold);
        assert.ok(words(reading.portrait) >= 35, `${triad.join("")} portrait is thin`);
        assert.ok(words(reading.portrait) <= 210, `${triad.join("")} portrait is ${words(reading.portrait)} words`);
        for (const banned of BANNED) {
          assert.doesNotMatch(reading.full, banned, `${triad.join("")} matches ${banned}`);
        }
        if (a === "A") shadows.set(`${b}${c}`, reading.shadow);
      }
    }
  }
  assert.equal(texts.size, 26 * 26 * 26);
  assert.notEqual(shadows.get("BD"), shadows.get("CD"));
  assert.notEqual(shadows.get("BD"), shadows.get("BE"));
});

test("the Seeker, devoted, at the Well names the three seats", () => {
  const reading = readingOf(["A", "B", "D"]);
  assert.match(reading.portrait, /Seeker/);
  assert.match(reading.portrait, /devoted/);
  assert.match(reading.portrait, /Well/);
  assert.match(reading.role, /You stand as the Seeker/);
  assert.match(reading.manner, /Devotion is the method/);
  assert.doesNotMatch(reading.manner, /You stand as/);
  assert.match(reading.field, /Well/);
  assert.match(reading.invitation, /Well/);
});

test("a pure path does not repeat the doubled warning three times", () => {
  const reading = readingOf(["A", "A", "A"]);
  const doubled = houseOf("A").doubled;
  assert.equal(reading.together.split(doubled).length - 1, 1);
  assert.match(reading.together, /All three seats are the Seeker/);
});

test("a known username gets a path that names its three houses", () => {
  const horoscope = buildHoroscope("lovelace");
  assert.ok(horoscope);
  const reading = readingOf(horoscope.triad);
  const [role, manner, field] = horoscope.triad;
  assert.match(reading.full, new RegExp(houseOf(role).noun));
  assert.match(reading.full, new RegExp(houseOf(manner).noun));
  assert.match(reading.full, new RegExp(houseOf(field).realm));
  assert.equal(reading.code, horoscope.triad.join(""));
});
