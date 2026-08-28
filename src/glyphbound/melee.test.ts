import assert from "node:assert/strict";
import test from "node:test";
import {
  MOVES,
  classifyMelee,
  intentToMove,
  isAerial,
  nextJab,
  resolveMove,
  smashKindFromIntent,
  smashMove,
} from "./melee";
import type { LetterId } from "./types";

const ALL: LetterId[] = ["c", "s", "b", "e", "r", "k", "n", "t"];

function cls(over: Partial<Parameters<typeof classifyMelee>[0]> = {}) {
  return classifyMelee({
    grounded: true,
    facing: 1,
    vx: 0,
    spd: 140,
    aimX: 0,
    aimY: 0,
    ...over,
  });
}

test("neutral grounded strike is a jab", () => {
  assert.equal(cls(), "jab");
  assert.equal(intentToMove("jab", 0), "jab1");
  assert.equal(intentToMove("jab", 1), "jab2");
  assert.equal(intentToMove("jab", 2), "jab3");
  assert.equal(nextJab("jab1"), "jab2");
  assert.equal(nextJab("jab2"), "jab3");
  assert.equal(nextJab("jab3"), "");
});

test("stick and arrows pick tilts, dash, and aerials", () => {
  assert.equal(cls({ aimX: 1 }), "side");
  assert.equal(cls({ aimX: -1, facing: 1 }), "side");
  assert.equal(cls({ aimY: -1 }), "up");
  assert.equal(cls({ aimY: 1 }), "down");
  assert.equal(cls({ vx: 120, spd: 140, aimX: 1 }), "dash");
  assert.equal(cls({ grounded: false }), "nair");
  assert.equal(cls({ grounded: false, aimX: 1, facing: 1 }), "fair");
  assert.equal(cls({ grounded: false, aimX: -1, facing: 1 }), "bair");
  assert.equal(cls({ grounded: false, aimY: -1 }), "uair");
  assert.equal(cls({ grounded: false, aimY: 1 }), "dair");
});

test("up and down beat a slight side tilt", () => {
  assert.equal(cls({ aimX: 0.3, aimY: -1 }), "up");
  assert.equal(cls({ aimX: 0.3, aimY: 1 }), "down");
  assert.equal(cls({ grounded: false, aimX: 0.2, aimY: 1 }), "dair");
});

test("hold with a direction is a smash, hold neutral is not", () => {
  assert.equal(smashKindFromIntent("jab"), "");
  assert.equal(smashKindFromIntent("nair"), "");
  assert.equal(smashKindFromIntent("side"), "side");
  assert.equal(smashKindFromIntent("dash"), "side");
  assert.equal(smashKindFromIntent("up"), "up");
  assert.equal(smashKindFromIntent("down"), "down");
  assert.equal(smashMove("side"), "fsmash");
  assert.equal(smashMove("up"), "usmash");
  assert.equal(smashMove("down"), "dsmash");
});

test("dair spikes downward and aerials land-cancel", () => {
  assert.equal(MOVES.dair.spike, true);
  assert.ok(MOVES.dair.kbY > 0);
  for (const id of ["nair", "fair", "bair", "uair", "dair"] as const) {
    assert.equal(isAerial(id), true);
  }
  assert.equal(isAerial("ftilt"), false);
});

test("charged smash hits harder than a tilt", () => {
  const tilt = resolveMove("c", "ftilt", 0);
  const smash = resolveMove("c", "fsmash", 1);
  assert.ok(smash.dmg > tilt.dmg);
  assert.ok(smash.kbX > tilt.kbX);
});

test("every letter scales the same smash kit", () => {
  for (const id of ALL) {
    const jab = resolveMove(id, "jab1", 0);
    const fin = resolveMove(id, "jab3", 0);
    assert.ok(fin.dmg >= jab.dmg, id);
    assert.ok(resolveMove(id, "dair", 0).spike);
  }
});
