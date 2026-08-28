import assert from "node:assert/strict";
import test from "node:test";
import {
  MOVES,
  classifyMelee,
  comboDecay,
  dashMove,
  enemyWeight,
  intentToMove,
  isAerial,
  launchHit,
  meleeIasaReady,
  nairAutocancel,
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

test("percent grows knockback the way Smash does", () => {
  const low = launchHit({ moveId: "utilt", percent: 0, weight: 1, dir: 1, comboHits: 1 });
  const high = launchHit({ moveId: "utilt", percent: 80, weight: 1, dir: 1, comboHits: 1 });
  assert.ok(high.speed > low.speed * 1.4);
  assert.ok(high.stun > low.stun);
  assert.ok(low.vy < -200, "up-tilt launches");
});

test("jabs stay close so they link", () => {
  const jab = launchHit({ moveId: "jab1", percent: 0, weight: 1, dir: 1, comboHits: 1 });
  const utilt = launchHit({ moveId: "utilt", percent: 20, weight: 1, dir: 1, comboHits: 2 });
  assert.ok(Math.abs(jab.vx) < 120);
  assert.ok(utilt.stun > jab.stun);
  assert.ok(utilt.vy < jab.vy);
});

test("dair spikes and light enemies fly farther", () => {
  const dair = launchHit({ moveId: "dair", percent: 30, weight: 1, dir: 1, comboHits: 1 });
  assert.ok(dair.vy > 200, "spike is downward");
  const light = launchHit({ moveId: "fair", percent: 40, weight: enemyWeight("one", false), dir: 1, comboHits: 1 });
  const heavy = launchHit({ moveId: "fair", percent: 40, weight: enemyWeight("eight", false), dir: 1, comboHits: 1 });
  assert.ok(light.speed > heavy.speed);
});

test("combo decay pops them out after a string", () => {
  assert.ok(comboDecay(6) > comboDecay(2));
  const early = launchHit({ moveId: "nair", percent: 20, weight: 1, dir: 1, comboHits: 2 });
  const late = launchHit({ moveId: "nair", percent: 20, weight: 1, dir: 1, comboHits: 7 });
  assert.ok(late.speed > early.speed);
});

test("s t r c have sideways weapon dashes", () => {
  const names = new Set<string>();
  for (const id of ["s", "t", "r", "c"] as LetterId[]) {
    const d = dashMove(id);
    assert.ok(d.selfVx && d.selfVx >= 240, id);
    assert.equal(d.fx, "slash-dash");
    assert.equal(names.has(d.name), false, d.name);
    names.add(d.name);
    assert.ok(resolveMove(id, "dash", 0).selfVx! >= 240, id);
  }
  assert.ok((dashMove("b").selfVx ?? 0) < 240);
});

test("IASA and nair autocancel windows exist", () => {
  assert.equal(meleeIasaReady(0.14, 0.3, "utilt"), true);
  assert.equal(meleeIasaReady(0.28, 0.3, "utilt"), false);
  assert.equal(nairAutocancel(0.1), true);
  assert.equal(nairAutocancel(0.5), false);
  assert.equal(nairAutocancel(0.9), true);
});
