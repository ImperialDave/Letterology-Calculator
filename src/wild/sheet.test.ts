import assert from "node:assert/strict";
import test from "node:test";
import { MESA, sheetVisible } from "./terrain";
import { hillshade, markerAngle, sheetFrame, sheetProject } from "./sheet";

test("the sheet puts north up and east to the right", () => {
  const camp = sheetProject(0, 6, 200, 100);
  const north = sheetProject(0, 40, 200, 100);
  const east = sheetProject(80, 6, 200, 100);
  assert.ok(north.py < camp.py);
  assert.ok(east.px > camp.px);
});

test("yaw 0 points south on the sheet, and facing east points right", () => {
  assert.ok(Math.abs(Math.abs(markerAngle(0)) - Math.PI) < 0.01);
  assert.ok(Math.abs(markerAngle(-Math.PI / 2) - Math.PI / 2) < 0.01);
});

test("at the fountain, the sheet frames camp so the basin is a separate mark", () => {
  const frame = sheetFrame({ x: 6.5, z: 14, spireReached: false }, 360 / 520);
  const camp = sheetProject(0, 6, 360, 520, frame);
  const fountain = sheetProject(6.5, 14, 360, 520, frame);
  assert.ok(fountain.py < camp.py, "fountain sits north of camp");
  assert.ok(fountain.px > camp.px, "fountain sits east of camp");
  const gap = Math.hypot(fountain.px - camp.px, fountain.py - camp.py);
  assert.ok(gap > 36, `fountain should be pointable, gap ${gap.toFixed(1)} px`);
  assert.equal(sheetVisible(6.5, 14, 6.5, 14, false), true);
  assert.equal(sheetVisible(MESA.x, MESA.z, 6.5, 14, false), false);
});

test("the mesa's western slope takes the north-west light", () => {
  const west = hillshade(MESA.x - 22, MESA.z);
  const east = hillshade(MESA.x + 22, MESA.z);
  assert.ok(west > east, `west ${west} should be lit more than east ${east}`);
});
