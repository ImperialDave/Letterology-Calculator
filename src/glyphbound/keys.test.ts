import assert from "node:assert/strict";
import test from "node:test";
import { VIEW_H, VIEW_W } from "./types";
import { bindKey, codesFor, DEFAULT_KEYS } from "./keys";

test("playfield is 20:9 for modern phones", () => {
  assert.equal(VIEW_W, 800);
  assert.equal(VIEW_H, 360);
  assert.ok(Math.abs(VIEW_W / VIEW_H - 20 / 9) < 0.01);
});

test("binding a key swaps if another action already uses it", () => {
  const map = bindKey({}, "attack", "KeyF");
  assert.equal(map.attack, "KeyF");
  assert.equal(map.fang, DEFAULT_KEYS.attack);
  assert.ok(codesFor(map, "attack").includes("KeyF"));
  assert.ok(!codesFor(map, "fang").includes("KeyF") || codesFor(map, "fang")[0] !== "KeyF");
});
