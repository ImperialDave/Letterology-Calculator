import assert from "node:assert/strict";
import test from "node:test";
import { animWave } from "./draw";

test("animWave is independent of camera screen x", () => {
  const t = 3.25;
  const worldX = 480;
  const a = animWave(t, worldX, 6);
  const b = animWave(t, worldX, 6);
  assert.equal(a, b);
  const camShift = worldX - 200;
  assert.notEqual(animWave(t, camShift, 6), a);
  assert.equal(animWave(t, 100, 4, 0.02), animWave(t, 100, 4, 0.02));
  assert.notEqual(animWave(t, 100, 4, 0.02), animWave(t, 300, 4, 0.02));
});
