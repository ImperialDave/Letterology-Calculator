import assert from "node:assert/strict";
import test from "node:test";
import { dateLetter, yearLetter } from "./calendar";
import {
  compareWalks,
  countReadingOf,
  joinWalks,
  nextWalk,
  parseWalk,
  parseWalkSlug,
  partWalks,
  placeLetter,
  prevWalk,
  quantityOf,
  seatOf,
  spellDigits,
  walkOf,
  walkSlug,
} from "./count";

test("the seat agrees with the almanac", () => {
  assert.equal(seatOf(13), dateLetter(13));
  assert.equal(seatOf(13), "M");
  assert.equal(seatOf(2026), yearLetter(2026));
  assert.equal(seatOf(2026), "X");
  assert.equal(seatOf(1), "A");
  assert.equal(seatOf(26), "Z");
  assert.equal(seatOf(27), "A");
});

test("zero sits the Fool", () => {
  assert.equal(seatOf(0), "F");
  assert.deepEqual(spellDigits("0"), ["F"]);
});

test("six also sits the Fool, as the sixth house", () => {
  assert.equal(seatOf(6), "F");
  assert.deepEqual(spellDigits("6"), ["F"]);
});

test("spelling maps digits without Pythagorean wrap", () => {
  assert.equal(spellDigits("2026").join(""), "BFBF");
  assert.equal(spellDigits("13").join(""), "AC");
  assert.equal(spellDigits("007").join(""), "FFG");
  assert.equal(spellDigits("42").join(""), "DB");
});

test("places walk the wheel: ones are A, tens B, tenths Z", () => {
  assert.equal(placeLetter(0), "A");
  assert.equal(placeLetter(1), "B");
  assert.equal(placeLetter(3), "D");
  assert.equal(placeLetter(-1), "Z");
  assert.equal(placeLetter(-2), "Y");
});

test("2026 unfolds as B of Y walks, then X", () => {
  const walk = walkOf(2026n);
  assert.equal(walk.remainder, "X");
  assert.deepEqual(walk.chain, ["B", "Y", "X"]);
});

test("a count reading is bit-identical", () => {
  const a = countReadingOf("2,026");
  const b = countReadingOf("2026");
  assert.ok(a && b);
  assert.equal(a.seat, b.seat);
  assert.equal(a.display, b.display);
  assert.equal(a.horoscope.archetype.code, b.horoscope.archetype.code);
  assert.deepEqual(a.placePath, b.placePath);
});

test("empty or punctuation-only input cannot be read", () => {
  assert.equal(countReadingOf(""), null);
  assert.equal(countReadingOf("---"), null);
  assert.equal(countReadingOf("  "), null);
});

test("leading zeros stay in the spelling and drop from the seat", () => {
  const reading = countReadingOf("007");
  assert.ok(reading);
  assert.equal(reading.display, "FFG");
  assert.equal(reading.seat, "G");
  assert.equal(reading.quantity, 7n);
  assert.equal(reading.columns.length, 3);
});

test("a minus sign is inverted, not a new house", () => {
  const reading = countReadingOf("-13");
  assert.ok(reading);
  assert.equal(reading.inverted, true);
  assert.equal(reading.seat, "M");
  assert.equal(reading.display, "AC");
});

test("decimals sit a fraction court on the far side of the wheel", () => {
  const reading = countReadingOf("3.14");
  assert.ok(reading);
  assert.equal(reading.seat, "C");
  assert.equal(reading.display, "CAD");
  assert.equal(reading.fractionColumns.length, 2);
  assert.equal(reading.fractionColumns[0]?.place, "Z");
  assert.equal(reading.fractionColumns[1]?.place, "Y");
  assert.ok(reading.placeHoroscope);
  assert.ok(reading.seatHoroscope);
});

test("the walk inverts and has no letter for nothing", () => {
  assert.deepEqual(walkOf(0n).chain, []);
  assert.equal(quantityOf(walkOf(0n)), 0n);
  assert.equal(quantityOf(walkOf(1n)), 1n);
  assert.equal(quantityOf(walkOf(26n)), 26n);
  assert.equal(quantityOf(walkOf(27n)), 27n);
  assert.equal(quantityOf(walkOf(2026n)), 2026n);
  assert.deepEqual(walkOf(6n).chain, ["F"]);
  assert.notEqual(quantityOf(walkOf(6n)), 0n);
});

test("next and join stay in letters", () => {
  assert.deepEqual(nextWalk(walkOf(26n)).chain, ["A", "A"]);
  assert.deepEqual(prevWalk(walkOf(1n)).chain, []);
  assert.deepEqual(joinWalks(walkOf(26n), walkOf(1n)).chain, ["A", "A"]);
  assert.equal(partWalks(walkOf(27n), walkOf(1n)).walk.chain.join(""), "Z");
  assert.equal(compareWalks(walkOf(26n), walkOf(27n)), -1);
  assert.equal(walkSlug(walkOf(2026n)), "byx");
  assert.ok(parseWalk("B·Y·X"));
  assert.deepEqual(parseWalk("byx")?.chain, ["B", "Y", "X"]);
  assert.deepEqual(parseWalkSlug("fool")?.walk.chain, []);
  assert.equal(parseWalkSlug("w-byx")?.inverted, true);
});

test("every column has an occupant letter and a place letter", () => {
  const reading = countReadingOf("2026");
  assert.ok(reading);
  assert.equal(reading.columns.map((col) => col.occupant).join(""), "BFBF");
  assert.equal(reading.columns.map((col) => col.place).join(""), "DCBA");
});
