import assert from "node:assert/strict";
import test from "node:test";
import { bondAsText, compareNames } from "./compatibility";

test("ally houses sit kinship with a high affinity", () => {
  const bond = compareNames("@lovelace", "@octavia");
  assert.ok(bond);
  assert.equal(bond.seats[0].kind, "ally");
  assert.equal(bond.weather, "kinship");
  assert.ok(bond.affinity >= 55, `affinity ${bond.affinity}`);
});

test("enemy houses sit a hard weather", () => {
  const bond = compareNames("@ada", "@bella");
  assert.ok(bond);
  assert.equal(bond.seats[0].kind, "enemy");
  assert.ok(["friction", "crossing", "exile", "forge"].includes(bond.weather), bond.weather);
  assert.ok(bond.affinity < 80, `affinity ${bond.affinity}`);
});

test("the same handle meets itself as homecoming", () => {
  const bond = compareNames("Ada Lovelace", "Ada Lovelace");
  assert.ok(bond);
  assert.equal(bond.weather, "homecoming");
  assert.equal(bond.seats[0].kind, "same");
  assert.ok(bond.affinity >= 65, `affinity ${bond.affinity}`);
  assert.ok(bond.shared.length >= 3);
});

test("affinity is the same whichever name is typed first", () => {
  const ab = compareNames("@lovelace", "@octavia");
  const ba = compareNames("@octavia", "@lovelace");
  assert.ok(ab && ba);
  assert.equal(ab.affinity, ba.affinity);
  assert.equal(ab.weather, ba.weather);
  assert.deepEqual(ab.shared, ba.shared);
});

test("empty or symbol-only names cannot be read", () => {
  assert.equal(compareNames("@@@", "ada"), null);
  assert.equal(compareNames("ada", "   "), null);
});

test("the certificate text stays a caption, not an essay", () => {
  const bond = compareNames("@lovelace", "@octavia");
  assert.ok(bond);
  const text = bondAsText(bond);
  assert.match(text, /Certificate of Bond/);
  assert.match(text, /Affinity \d+/);
  assert.ok(text.length < 1200);
});

test("gifts name allies the other handle already carries", () => {
  const bond = compareNames("Ada", "Diana");
  assert.ok(bond);
  assert.equal(bond.seats[0].kind, "ally");
  const gifted = [...bond.giftsAtoB, ...bond.giftsBtoA];
  for (const letter of gifted) {
    assert.ok(
      bond.a.inventory.some((item) => item.letter === letter) ||
        bond.b.inventory.some((item) => item.letter === letter),
    );
  }
});

test("the reading names both people and both houses", () => {
  const bond = compareNames("@lovelace", "@octavia");
  assert.ok(bond);
  assert.match(bond.verdict, /lovelace/i);
  assert.match(bond.verdict, /octavia/i);
  assert.match(bond.verdict, /Lover|Priestess|Maker/);
  assert.ok(bond.sigil.includes("×"));
  assert.ok(bond.epithet.length > 2);
  assert.ok(bond.made.length > 40);
  assert.ok(bond.owed.length > 20);
  assert.ok(bond.argument.length > 40);
  assert.match(bond.rooms.morning, /lovelace|octavia|Lover|Priestess/i);
  assert.match(bond.rooms.work, /lovelace|octavia/i);
  assert.ok(bond.rooms.fight.length > 20);
  assert.ok(bond.rooms.repair.length > 20);
});

test("every axis is a 0–100 score", () => {
  const bond = compareNames("Zora", "Baldwin");
  assert.ok(bond);
  for (const value of Object.values(bond.axes)) {
    assert.ok(value >= 0 && value <= 100, String(value));
  }
});

test("different pairs do not collapse to the same portrait", () => {
  const pairs: [string, string][] = [
    ["@lovelace", "@octavia"],
    ["@ada", "@bella"],
    ["Zora", "Baldwin"],
    ["Ada Lovelace", "Charles Babbage"],
    ["@nero", "@orpheus"],
    ["Mina", "Jonathan"],
    ["@ripley", "@ash"],
    ["Sam", "Frodo"],
  ];
  const fingerprints = pairs.map(([a, b]) => {
    const bond = compareNames(a, b);
    assert.ok(bond, `${a} × ${b}`);
    return `${bond.title}||${bond.epithet}||${bond.verdict}||${bond.rooms.morning}`;
  });
  assert.equal(new Set(fingerprints).size, fingerprints.length);
});

test("the same pair is stable across calls", () => {
  const first = compareNames("Octavia", "Butler");
  const second = compareNames("Octavia", "Butler");
  assert.ok(first && second);
  assert.equal(first.title, second.title);
  assert.equal(first.epithet, second.epithet);
  assert.equal(first.affinity, second.affinity);
  assert.equal(first.rooms.repair, second.rooms.repair);
  assert.equal(first.seed, second.seed);
});

test("geometry rides on the reading", () => {
  const bond = compareNames("@lovelace", "@octavia");
  assert.ok(bond);
  assert.equal(bond.geometry.hops.house, 1);
  assert.ok(bond.geometry.resonance.house >= 84);
  assert.ok(bond.axes.role >= 84);
});
