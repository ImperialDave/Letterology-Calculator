import assert from "node:assert/strict";
import test from "node:test";
import { Input, applyGamepad } from "./input";

function press(codes: string[]) {
  const i = new Input();
  for (const c of codes) {
    i.keys.add(c);
    i.latched.add(c);
  }
  return i.poll();
}

test("J is strike, not fang", () => {
  const a = press(["KeyJ"]);
  assert.equal(a.attack, true);
  assert.equal(a.attackHeld, true);
  assert.equal(a.fang, false);
  assert.equal(a.fangHeld, false);
  assert.equal(a.cycle, 0);
});

test("F is fang and does not cycle the cell", () => {
  const a = press(["KeyF"]);
  assert.equal(a.fang, true);
  assert.equal(a.fangHeld, true);
  assert.equal(a.attack, false);
  assert.equal(a.cycle, 0);
});

test("H is the fang alternate and Tab still cycles", () => {
  const fang = press(["KeyH"]);
  assert.equal(fang.fang, true);
  assert.equal(fang.cycle, 0);
  const cycle = press(["Tab"]);
  assert.equal(cycle.cycle, 1);
  assert.equal(cycle.fang, false);
});

test("arrows and WASD aim the melee kit", () => {
  const right = press(["ArrowRight"]);
  assert.equal(right.aimX, 1);
  assert.equal(right.aimY, 0);
  const left = press(["KeyA"]);
  assert.equal(left.aimX, -1);
  const up = press(["ArrowUp"]);
  assert.equal(up.aimY, -1);
  const down = press(["KeyS"]);
  assert.equal(down.aimY, 1);
  assert.equal(down.down, true);
});

test("Strike plus up aims an up-tilt and does not jump", () => {
  const a = press(["KeyW", "KeyJ"]);
  assert.equal(a.aimY, -1);
  assert.equal(a.attack, true);
  assert.equal(a.jump, false);
  assert.equal(a.jumpHeld, false);
});

test("Space still jumps while aiming a strike", () => {
  const a = press(["Space", "KeyJ"]);
  assert.equal(a.jump, true);
  assert.equal(a.attack, true);
});

test("standard pad maps A jump, X strike, Y fang, Start pause", () => {
  const a = press([]);
  a.jump = false;
  a.attack = false;
  const buttons = Array.from({ length: 16 }, () => ({ pressed: false }));
  buttons[0] = { pressed: true };
  buttons[2] = { pressed: true };
  buttons[3] = { pressed: true };
  buttons[9] = { pressed: true };
  const next = new Set<number>();
  applyGamepad(a, { axes: [0.6, 0], buttons }, new Set(), next);
  assert.equal(a.jump, true);
  assert.equal(a.attack, true);
  assert.equal(a.fang, true);
  assert.equal(a.pause, true);
  assert.ok(a.moveX > 0);
});
