import assert from "node:assert/strict";
import test from "node:test";
import { PENTAD } from "./roster";
import type { LetterId } from "./types";
import { MOVES } from "./melee";
import {
  CASE_ART,
  CASE_ART_COST,
  HEAT_SMASH,
  HEAT_SMASH_COST,
  LAUNCH_STRINGS,
  LOW_STRINGS,
  SPECIALS,
  STRINGS,
  artDamage,
  branchForOpener,
  heatFromDamage,
  stringCanFire,
  stringNext,
  stringRoute,
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

test("every letter has staple, launcher, and low trees", () => {
  for (const L of LETTERS) {
    assert.ok(STRINGS[L].length >= 3, L);
    assert.ok(LAUNCH_STRINGS[L].length >= 3, L);
    assert.ok(LOW_STRINGS[L].length >= 3, L);
    assert.equal(stringRoute(L, "launch")[0], LAUNCH_STRINGS[L][0]);
    assert.equal(stringNext(L, LAUNCH_STRINGS[L].length, "launch"), "finisher");
  }
});

test("up opener picks launcher, down picks low when they share a button", () => {
  assert.equal(branchForOpener("c", "utilt", "u"), "launch");
  assert.equal(branchForOpener("c", "dtilt", "d"), "low");
  assert.equal(branchForOpener("c", "jab1", "n"), "staple");
  assert.equal(branchForOpener("b", "dtilt", "d"), "low");
  assert.equal(branchForOpener("b", "dtilt", "n"), "staple");
});

test("staple second hit is combo-true at low percent", () => {
  for (const L of LETTERS) {
    const first = MOVES[STRINGS[L][0]];
    const recover = first.time * (1 - (first.hitAt[0] ?? 0.3));
    assert.ok(first.stun + 0.04 >= recover * 0.55, `${L} ${first.id} stun ${first.stun} recover ${recover}`);
  }
});

test("letter specials are free command normals, not Case Arts", () => {
  for (const L of LETTERS) {
    assert.equal(SPECIALS[L].cost, 0, L);
    assert.equal(SPECIALS[L].letterbox, false, L);
    assert.ok(SPECIALS[L].name !== CASE_ART[L].name, L);
    assert.ok(SPECIALS[L].time < CASE_ART[L].time, L);
  }
  assert.equal(SPECIALS.c.cmd, "qcf");
  assert.equal(SPECIALS.s.cmd, "df");
  assert.equal(SPECIALS.k.cmd, "uf");
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
