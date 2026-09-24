import assert from "node:assert/strict";
import test from "node:test";
import { MESA } from "./terrain";
import { hillshade, markerAngle, sheetProject } from "./sheet";

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

test("the mesa's western slope takes the north-west light", () => {
  const west = hillshade(MESA.x - 22, MESA.z);
  const east = hillshade(MESA.x + 22, MESA.z);
  assert.ok(west > east, `west ${west} should be lit more than east ${east}`);
});
