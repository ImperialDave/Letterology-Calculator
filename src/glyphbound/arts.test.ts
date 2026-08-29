import assert from "node:assert/strict";
import test from "node:test";
import { PENTAD } from "./roster";
import type { LetterId } from "./types";
import {
  CASE_ART,
  CASE_ART_COST,
  HEAT_SMASH,
  HEAT_SMASH_COST,
  STRINGS,
  artDamage,
  heatFromDamage,
  stringCanFire,
  stringNext,
} from "./arts";

const LETTERS: LetterId[] = ["c", "s", "b", "e", "r", "k", "n", "t"];

test("every letter has a 3-step string plus a Case Art and Heat Smash", () => {
  for (const L of LETTERS) {
    assert.equal(STRINGS[L].length, 3, L);
    assert.ok(CASE_ART[L].name.length > 2, L);
    assert.equal(CASE_ART[L].cost, CASE_ART_COST);
    assert.equal(HEAT_SMASH[L].cost, HEAT_SMASH_COST);
    const art = artDamage(CASE_ART[L]);
    assert.ok(art >= 18 && art <= 26, `${L} art ${art}`);
    const heat = artDamage(HEAT_SMASH[L]);
    assert.ok(heat >= 8 && heat <= 11, `${L} heat ${heat}`);
  }
  assert.ok(PENTAD.includes("c"));
});

test("string next walks to the finisher then ends", () => {
  assert.equal(stringNext("c", 0), "jab1");
  assert.equal(stringNext("c", 1), "jab2");
  assert.equal(stringNext("c", 2), "ftilt");
  assert.equal(stringNext("c", 3), "finisher");
  assert.equal(stringNext("c", 4), null);
});

test("uair cannot start on the ground; ftilt cannot start in the air", () => {
  assert.equal(stringCanFire("uair", true), false);
  assert.equal(stringCanFire("uair", false), true);
  assert.equal(stringCanFire("ftilt", true), true);
  assert.equal(stringCanFire("ftilt", false), false);
  assert.equal(stringCanFire("dash", false), true);
});

test("heat from a 2-damage melee hit is 18", () => {
  assert.equal(heatFromDamage(2), 18);
});

test("Case Art startup invuln is a window, not the full cinematic", () => {
  assert.equal(CASE_ART.c.invuln, 0.22);
  assert.ok((CASE_ART.c.invuln ?? 1) < CASE_ART.c.time * 0.3);
});

test("Case Art does not one-shot Dualis (36 hp)", () => {
  for (const L of LETTERS) {
    assert.ok(artDamage(CASE_ART[L], true) < 36, L);
  }
});
