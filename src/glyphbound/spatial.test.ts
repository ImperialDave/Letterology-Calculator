import assert from "node:assert/strict";
import test from "node:test";
import { SolidGrid } from "./spatial";
import type { Solid } from "./types";

function solid(x: number, y: number, w = 48, h = 48, type: Solid["type"] = "solid"): Solid {
  return { x, y, w, h, type };
}

test("query only returns nearby solids", () => {
  const g = new SolidGrid(96);
  const near = solid(0, 0);
  const far = solid(2000, 0);
  g.rebuild([near, far]);
  const hit = g.query({ x: 10, y: 10, w: 28, h: 36 }, false);
  assert.equal(hit.includes(near), true);
  assert.equal(hit.includes(far), false);
});

test("spikes and lasers are not in the walk grid", () => {
  const g = new SolidGrid(96);
  g.rebuild([solid(0, 0, 48, 48, "spike"), solid(48, 0, 12, 48, "laser"), solid(96, 0)]);
  const hit = g.query({ x: 0, y: 0, w: 40, h: 40 }, true);
  assert.equal(hit.length, 1);
  assert.equal(hit[0].type, "solid");
  const hazards = g.query({ x: 0, y: 0, w: 80, h: 40 }, true, [], "hazard");
  assert.equal(hazards.length, 2);
});

test("vents only collide when the body is large", () => {
  const g = new SolidGrid(96);
  const vent = solid(0, 0, 48, 48, "vent");
  g.rebuild([vent]);
  assert.equal(g.query({ x: 0, y: 0, w: 28, h: 36 }, false).length, 0);
  assert.equal(g.query({ x: 0, y: 0, w: 40, h: 52 }, true).includes(vent), true);
});

test("broken solids drop out without a rebuild", () => {
  const g = new SolidGrid(96);
  const s = solid(0, 0, 48, 48, "break");
  g.rebuild([s]);
  assert.equal(g.query({ x: 0, y: 0, w: 20, h: 20 }, true).length, 1);
  s.broken = true;
  assert.equal(g.query({ x: 0, y: 0, w: 20, h: 20 }, true).length, 0);
});

test("censers skip walk and count as hazards", () => {
  const g = new SolidGrid(96);
  g.rebuild([]);
  const censer = { x: 0, y: 0, w: 28, h: 28, type: "censer" as const };
  const walk = g.query({ x: 0, y: 0, w: 40, h: 40 }, true, [censer], "walk");
  assert.equal(walk.length, 0);
  const hurt = g.query({ x: 0, y: 0, w: 40, h: 40 }, true, [censer], "hazard");
  assert.equal(hurt.length, 1);
});

test("saws skip walk and count as hazards", () => {
  const g = new SolidGrid(96);
  g.rebuild([]);
  const saw = solid(0, 0, 48, 24, "saw");
  const walk = g.query({ x: 0, y: 0, w: 40, h: 40 }, true, [saw], "walk");
  assert.equal(walk.length, 0);
  const hurt = g.query({ x: 0, y: 0, w: 40, h: 40 }, true, [saw], "hazard");
  assert.equal(hurt.length, 1);
});

test("scribed walls arrive through the extra list", () => {
  const g = new SolidGrid(96);
  g.rebuild([solid(0, 0)]);
  const wall = solid(40, 0, 16, 48);
  const hit = g.query({ x: 30, y: 0, w: 28, h: 36 }, false, [wall]);
  assert.equal(hit.length, 2);
  assert.equal(hit.includes(wall), true);
});
