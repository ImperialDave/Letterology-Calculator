import assert from "node:assert/strict";
import test from "node:test";
import { bondAsText, compareNames } from "./compatibility";

test("ally houses sit kinship with a high affinity", () => {
  const bond = compareNames("@lovelace", "@octavia");
  assert.ok(bond);
  assert.equal(bond.seats[0].kind, "ally");
  assert.equal(bond.weather, "kinship");
  assert.ok(bond.affinity >= 60, `affinity ${bond.affinity}`);
  assert.match(bond.title, /Kinship/);
});

test("enemy houses sit friction or a useful crossing", () => {
  const bond = compareNames("@ada", "@bella");
  assert.ok(bond);
  assert.equal(bond.seats[0].kind, "enemy");
  assert.ok(["friction", "crossing", "exile"].includes(bond.weather), bond.weather);
  assert.ok(bond.affinity < 70, `affinity ${bond.affinity}`);
});

test("the same handle meets itself as homecoming", () => {
  const bond = compareNames("Ada Lovelace", "Ada Lovelace");
  assert.ok(bond);
  assert.equal(bond.weather, "homecoming");
  assert.equal(bond.seats[0].kind, "same");
  assert.ok(bond.affinity >= 70, `affinity ${bond.affinity}`);
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
    assert.ok(bond.a.inventory.some((item) => item.letter === letter) || bond.b.inventory.some((item) => item.letter === letter));
  }
});
