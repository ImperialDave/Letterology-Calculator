import assert from "node:assert/strict";
import test from "node:test";
import { aimFromDelta, snapCardinal } from "./input";

test("deadzone zeros the stick", () => {
  const a = snapCardinal(0.05, 0.05, null);
  assert.equal(a.x, 0);
  assert.equal(a.y, 0);
  assert.equal(a.lock, null);
});

test("right and left snap to full cardinals", () => {
  const r = snapCardinal(1, 0.12, null);
  assert.equal(r.x, 1);
  assert.equal(r.y, 0);
  assert.equal(r.lock, 1);
  const l = snapCardinal(-1, 0.1, null);
  assert.equal(l.x, -1);
  assert.equal(l.y, 0);
  assert.equal(l.lock, 3);
});

test("down and up snap to full cardinals", () => {
  const d = snapCardinal(0.1, 1, null);
  assert.equal(d.x, 0);
  assert.equal(d.y, 1);
  assert.equal(d.lock, 2);
  const u = snapCardinal(0.08, -1, null);
  assert.equal(u.x, 0);
  assert.equal(u.y, -1);
  assert.equal(u.lock, 0);
});

test("hysteresis keeps the locked axis through a 45 degree drift", () => {
  const down = snapCardinal(0, 1, null);
  assert.equal(down.lock, 2);
  const drift = snapCardinal(0.55, 0.7, down.lock);
  assert.equal(drift.lock, 2);
  assert.equal(drift.x, 0);
  assert.equal(drift.y, 1);
});

test("a click to the right of the rig cuts right", () => {
  const r = aimFromDelta(80, 8, null);
  assert.equal(r.x, 1);
  assert.equal(r.y, 0);
  assert.equal(r.lock, 1);
});

test("a click below the rig cuts down", () => {
  const d = aimFromDelta(6, 90, null);
  assert.equal(d.x, 0);
  assert.equal(d.y, 1);
  assert.equal(d.lock, 2);
});

test("a click on the rig itself is idle, not a twitch", () => {
  const idle = aimFromDelta(4, -3, null);
  assert.equal(idle.x, 0);
  assert.equal(idle.y, 0);
  assert.equal(idle.lock, null);
});
