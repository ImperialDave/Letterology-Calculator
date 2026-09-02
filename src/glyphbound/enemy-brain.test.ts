import assert from "node:assert/strict";
import test from "node:test";
import { roleOf, tickBrain, usesBrain } from "./enemy-brain";
import type { Enemy, Player } from "./types";

function enemy(kind: Enemy["kind"], x: number, extras: Partial<Enemy> = {}): Enemy {
  return {
    kind,
    x,
    y: 100,
    vx: 0,
    vy: 0,
    w: 28,
    h: 36,
    hp: 3,
    maxHp: 3,
    facing: 1,
    turnLock: 0,
    t: 0,
    hurt: 0,
    flash: 0,
    stun: 0,
    percent: 0,
    alive: true,
    grounded: true,
    phase: 0,
    aux: 0,
    aux2: 0,
    armor: 0,
    name: kind,
    dying: 0,
    ...extras,
  };
}

function player(x: number): Player {
  return {
    x,
    y: 100,
    vx: 0,
    vy: 0,
    w: 28,
    h: 36,
  } as Player;
}

const world = {
  atLedge: () => false,
  inSight: () => true,
};

test("roles match the porch grammar", () => {
  assert.equal(roleOf("one"), "rush");
  assert.equal(roleOf("four"), "hold");
  assert.equal(roleOf("two"), "kite");
  assert.equal(roleOf("three"), "flank");
  assert.equal(roleOf("zero"), "hover");
  assert.equal(usesBrain("one"), true);
  assert.equal(usesBrain("dualis"), false);
});

test("hold stays on the porch instead of chasing", () => {
  const e = enemy("four", 200);
  const p = player(800);
  const a = tickBrain(e, p, [e], 0.016, world);
  assert.ok(Math.abs(a.vx) <= 30, `hold spd ${a.vx}`);
  assert.ok(e.x + a.vx * 0.5 < 400, "does not sprint across the room");
});

test("kite backs off when overlapping", () => {
  const e = enemy("two", 200);
  const p = player(210);
  const a = tickBrain(e, p, [e], 0.016, world);
  assert.ok(a.vx * (p.x - e.x) <= 0, `kite vx ${a.vx} dx ${p.x - e.x}`);
});

test("pack only one rusher commits", () => {
  const a = enemy("one", 100, { aux: 1.1, phase: 1 });
  const b = enemy("one", 140, { aux: 1.1 });
  const p = player(160);
  tickBrain(a, p, [a, b], 0.016, world);
  const intent = tickBrain(b, p, [a, b], 0.016, world);
  assert.equal(intent.commit, false);
  assert.equal(intent.vx, 0);
});
