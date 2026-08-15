import assert from "node:assert/strict";
import test from "node:test";
import { axisOf } from "./axis";
import { hymnOf } from "./hymn";
import { HORAE } from "./horae";
import { foldToStoicheia, STOICHEIA } from "./letters";
import { isopsephy, sitSum, spellQuantity } from "./milesian";
import { readStoicheion } from "./engine";
import { readXenia } from "./xenia";

test("there are twenty-four stoicheia, not twenty-six", () => {
  assert.equal(STOICHEIA.length, 24);
  assert.equal(HORAE.length, 24);
});

test("Ἰησοῦς isopsephy is 888", () => {
  const letters = foldToStoicheia("Ἰησοῦς");
  assert.deepEqual(letters, ["Ι", "Η", "Σ", "Ο", "Υ", "Σ"]);
  assert.equal(isopsephy(letters), 888);
});

test("fold of Apollo starts Α and is not a Latin triad", () => {
  const letters = foldToStoicheia("Apollo");
  assert.equal(letters[0], "Α");
  assert.ok(letters.includes("Π"));
  const reading = readStoicheion("Apollo");
  assert.ok(reading);
  assert.equal(reading.axis.proodos, "Α");
  assert.equal(hymnOf(letters).join(""), "ΑΟΟ");
});

test("the hymn is sung in order, not by weight", () => {
  assert.deepEqual(hymnOf(foldToStoicheia("Αθηνά")), ["Α", "Η", "Α"]);
});

test("a closed rite begins and ends on the same stoicheion", () => {
  const axis = axisOf(foldToStoicheia("Άννα"));
  assert.ok(axis);
  assert.equal(axis.closed, true);
});

test("Milesian spelling is not the Latin Count", () => {
  assert.notEqual(spellQuantity(2026), "BFBF");
  assert.match(spellQuantity(2026), /[Α-Ωϛϟϡʹ]/);
  assert.equal(sitSum(888), sitSum(888));
});

test("xenia can see a crossed axis", () => {
  const pair = readXenia("Apollo", "Olympia");
  assert.ok(pair);
  assert.ok(["hearth", "road", "contest", "mystery", "exile", "symposium", "omen"].includes(pair.weather));
});
