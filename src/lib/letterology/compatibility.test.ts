import assert from "node:assert/strict";
import test from "node:test";
import { bondAsText, compareNames, gradeLabel } from "./compatibility";

test("ally houses with gifts grade high (A or B)", () => {
  const bond = compareNames("@lovelace", "@octavia");
  assert.ok(bond);
  assert.equal(bond.seats[0].kind, "ally");
  assert.ok(["A", "B"].includes(bond.grade), `grade ${bond.grade}`);
  assert.ok(["bound", "crossing", "orbit"].includes(bond.circuit), bond.circuit);
  assert.equal(bond.gradeLabel, gradeLabel(bond.grade));
});

test("enemy houses sit a hard grade (B, D, or F)", () => {
  const bond = compareNames("@ada", "@bella");
  assert.ok(bond);
  assert.equal(bond.seats[0].kind, "enemy");
  assert.ok(["B", "D", "F"].includes(bond.grade), `grade ${bond.grade}`);
});

test("the same handle meets itself as homecoming with grade A", () => {
  const bond = compareNames("Ada Lovelace", "Ada Lovelace");
  assert.ok(bond);
  assert.equal(bond.weather, "homecoming");
  assert.equal(bond.seats[0].kind, "same");
  assert.equal(bond.grade, "A");
  assert.equal(bond.circuit, "bound");
});

test("grade is the same whichever name is typed first", () => {
  const ab = compareNames("@lovelace", "@octavia");
  const ba = compareNames("@octavia", "@lovelace");
  assert.ok(ab && ba);
  assert.equal(ab.grade, ba.grade);
  assert.equal(ab.circuit, ba.circuit);
  assert.equal(ab.affinity, ba.affinity);
});

test("empty or symbol-only names cannot be read", () => {
  assert.equal(compareNames("@@@", "ada"), null);
  assert.equal(compareNames("ada", "   "), null);
});

test("the certificate text names the letter grade", () => {
  const bond = compareNames("@lovelace", "@octavia");
  assert.ok(bond);
  const text = bondAsText(bond);
  assert.match(text, /Certificate of Bond/);
  assert.match(text, /Grade [ABCDF]/);
});

test("gates are exposed on the reading", () => {
  const bond = compareNames("@lovelace", "@octavia");
  assert.ok(bond);
  assert.ok(["same", "ally", "enemy", "none"].includes(bond.gates.role));
  assert.ok(["both", "one", "bare"].includes(bond.gates.gift));
  assert.ok(bond.gradeCounsel.length > 20);
});
