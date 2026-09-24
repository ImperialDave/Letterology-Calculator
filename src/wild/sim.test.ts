import assert from "node:assert/strict";
import test from "node:test";
import { assemblyProblems, fitScale, HOUSE_FIT, overlaps, PLAYER_R, REACH, slideMove, SOLID_R } from "./bodies";
import { scaleProblems, PLAYER_M } from "./scale";
import { HERDER, HOUSES, SCRIPT, SERIF, SPIRE, forwardFromYaw, freshWild, rightFromForward, stepWild, type WildInput } from "./sim";
import { FORD, onFord, riverCenter, sheetVisible, terrainHeight } from "./terrain";

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

test("heights stay in proportion to Sable", () => {
  assert.deepEqual(scaleProblems(), []);
  assert.deepEqual(assemblyProblems(), []);
});

test("a tiny measured building grows to cottage size, and a flat one stops at the height cap", () => {
  const grown = fitScale({ y: 0.4, xz: 0.5 }, HOUSE_FIT);
  const height = 0.4 * grown;
  const footprint = 0.5 * grown;
  assert.ok(height <= HOUSE_FIT.maxHeight + 1e-9);
  assert.ok(footprint >= HOUSE_FIT.minFootprint - 1e-6 || height >= HOUSE_FIT.maxHeight - 1e-6);
  assert.ok(height > PLAYER_M * 2);
  const capped = fitScale({ y: 2, xz: 0.3 }, HOUSE_FIT);
  assert.ok(Math.abs(2 * capped - HOUSE_FIT.maxHeight) < 1e-9);
});

test("slideMove keeps the free axis and refuses the blocked one", () => {
  const wall = [{ x: 0, z: 0, r: 2 }];
  const blocked = slideMove(3, 0, 0, 0, wall);
  assert.equal(blocked.x, 3);
  assert.equal(blocked.z, 0);
  const along = slideMove(3, 0, 0, 2, wall);
  assert.equal(along.x, 3);
  assert.equal(along.z, 2);
});

test("Sable cannot walk into a house, the scriptorium, the spire, the stag, or the serif", () => {
  const stops = [
    { x: HOUSES[0].x, z: HOUSES[0].z, r: SOLID_R.house, yaw: -Math.PI / 2 },
    { x: SCRIPT.x, z: SCRIPT.z, r: SOLID_R.shrine, yaw: -Math.PI / 2 },
    { x: SPIRE.x, z: SPIRE.z, r: SOLID_R.spire, yaw: -Math.PI / 2 },
    { x: SERIF.x, z: SERIF.z, r: SOLID_R.serif, yaw: Math.PI },
  ];
  for (const stop of stops) {
    const s = freshWild();
    const gap = stop.r + PLAYER_R + 0.05;
    const face = forwardFromYaw(stop.yaw);
    s.x = stop.x - face.x * gap;
    s.z = stop.z - face.z * gap;
    s.y = terrainHeight(s.x, s.z);
    s.camYaw = stop.yaw;
    s.grounded = true;
    for (let i = 0; i < 40; i++) stepWild(s, { ...still, forward: 1 }, 1 / 60);
    const d = Math.hypot(s.x - stop.x, s.z - stop.z);
    const past = (s.x - stop.x) * face.x + (s.z - stop.z) * face.z;
    assert.ok(d >= stop.r + PLAYER_R - 0.08, `entered ${stop.x},${stop.z} at ${d}`);
    assert.ok(past < 0.05, `passed through ${stop.x},${stop.z}`);
    assert.equal(overlaps(s.x, s.z, stop), false);
  }
  const stag = freshWild();
  stag.stagFreed = true;
  stag.stagFlee = 0;
  stag.stagX = 2.4;
  stag.stagZ = 6;
  stag.x = 0;
  stag.z = 6;
  stag.y = terrainHeight(0, 6);
  stag.camYaw = -Math.PI / 2;
  for (let i = 0; i < 50; i++) stepWild(stag, { ...still, forward: 1 }, 1 / 60);
  const stagD = Math.hypot(stag.x - stag.stagX, stag.z - stag.stagZ);
  assert.ok(stagD >= SOLID_R.stag + PLAYER_R - 0.08);
  assert.ok(stag.x < stag.stagX);
});

test("the scriptorium and the herder can still be spoken to from outside their walls", () => {
  const shrine = freshWild();
  const shrineGap = SOLID_R.shrine + PLAYER_R + 0.35;
  shrine.x = SCRIPT.x - shrineGap;
  shrine.z = SCRIPT.z;
  shrine.y = terrainHeight(shrine.x, shrine.z);
  stepWild(shrine, { ...still, talk: true }, 1 / 60);
  assert.equal(shrine.scriptorium, true);

  const camp = freshWild();
  camp.x = HERDER.x;
  camp.z = HERDER.z;
  camp.y = terrainHeight(camp.x, camp.z);
  assert.equal(overlaps(camp.x, camp.z, { x: HOUSES[0].x, z: HOUSES[0].z, r: SOLID_R.house }), false);
  stepWild(camp, { ...still, talk: true }, 1 / 60);
  assert.equal(camp.campTalked, true);
  assert.ok(Math.hypot(camp.x - HERDER.x, camp.z - HERDER.z) < REACH.herder);
});

test("the mesa rises above the camp, and the sheet hides the far wild", () => {
  const camp = terrainHeight(0, 6);
  const mesa = terrainHeight(52, -36);
  assert.ok(mesa > camp + 4);
  assert.equal(sheetVisible(0, 6, 0, 6, false), true);
  assert.equal(sheetVisible(112, 0, 0, 6, false), false);
  assert.equal(sheetVisible(112, 0, 0, 6, true), true);
});

test("a sign can be read, and the river ford stays level", () => {
  const s = freshWild();
  s.x = 9.6;
  s.z = 8.8;
  stepWild(s, { ...still, talk: true }, 1 / 60);
  assert.match(s.toast, /spire/i);
  const door = freshWild();
  door.x = -5.4;
  door.z = 11.7;
  stepWild(door, { ...still, talk: true }, 1 / 60);
  assert.match(door.toast, /shutter/i);
  const deck = terrainHeight(FORD.x, riverCenter(FORD.x));
  const groove = terrainHeight(FORD.x + 6, riverCenter(FORD.x + 6));
  assert.equal(onFord(FORD.x, riverCenter(FORD.x)), true);
  assert.ok(deck > groove + 0.2);
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
