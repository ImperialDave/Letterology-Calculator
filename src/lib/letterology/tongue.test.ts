import assert from "node:assert/strict";
import test from "node:test";
import { lettersPath, parseTongue, readPath, twoPath } from "./tongue";

test("tongue parse only treats el as Greek", () => {
  assert.equal(parseTongue("el"), "el");
  assert.equal(parseTongue("la"), "la");
  assert.equal(parseTongue(undefined), "la");
});

test("read and two paths carry the handle and the tongue", () => {
  assert.equal(readPath("Apollo"), "/?n=Apollo");
  assert.equal(readPath("Apollo", "el"), "/?n=Apollo&tongue=el");
  assert.match(twoPath("Ada", "Octavia", "el"), /tongue=el/);
  assert.equal(lettersPath("th", "el"), "/letters/th?tongue=el");
});
