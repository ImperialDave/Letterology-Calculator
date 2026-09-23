import assert from "node:assert/strict";
import test from "node:test";
import { forwardFromYaw, freshWild, rightFromForward, stepWild, type WildInput } from "./sim";

const still: WildInput = { forward: 0, strafe: 0, look: 0, jumpHeld: false, hop: false, cut: false, talk: false };

test("yaw 0 faces -Z and D strafes to screen right", () => {
  const forward = forwardFromYaw(0);
  assert.ok(forward.z < -0.9 && Math.abs(forward.x) < 1e-6);
  const right = rightFromForward(forward);
  assert.ok(right.x > 0.9 && Math.abs(right.z) < 1e-6);
  const s = freshWild();
  s.camYaw = 0;
  s.yaw = 0;
  const x0 = s.x;
  for (let i = 0; i < 40; i++) stepWild(s, { ...still, strafe: 1 }, 1 / 60);
  assert.ok(s.x > x0 + 1, "D moves +X, which is right when the camera looks down -Z");
});

test("A strafes left of the camera", () => {
  const s = freshWild();
  s.camYaw = 0;
  const x0 = s.x;
  for (let i = 0; i < 40; i++) stepWild(s, { ...still, strafe: -1 }, 1 / 60);
  assert.ok(s.x < x0 - 1);
});

test("W moves along the camera, and the body faces that way", () => {
  const s = freshWild();
  s.camYaw = -Math.PI / 2;
  const x0 = s.x;
  for (let i = 0; i < 40; i++) stepWild(s, { ...still, forward: 1 }, 1 / 60);
  assert.ok(s.x > x0 + 1);
  const face = forwardFromYaw(s.yaw);
  assert.ok(face.x > 0.9);
});

test("three cuts free the stag and it flees", () => {
  const s = freshWild();
  s.x = 10;
  s.z = 3.2;
  s.yaw = 0;
  s.stagX = 10;
  s.stagZ = 0;
  s.stamina = 100;
  stepWild(s, { ...still, cut: true }, 0.016);
  s.slashCd = 0;
  stepWild(s, { ...still, cut: true }, 0.016);
  s.slashCd = 0;
  stepWild(s, { ...still, cut: true }, 0.016);
  assert.equal(s.stagFreed, true);
  assert.equal(s.stagHits, 3);
  const z0 = s.stagZ;
  stepWild(s, still, 0.05);
  stepWild(s, still, 0.05);
  stepWild(s, still, 0.05);
  assert.ok(s.stagZ < z0);
});
