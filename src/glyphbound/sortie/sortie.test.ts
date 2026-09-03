import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { makeCWing } from "./cwing";
import { groundHeight } from "./height";
import { BEATS, rockRing, rocks, ROCK_GAP, ROCK_RING_R } from "./beats";
import {
  COAST_PATH,
  GUTTER_PATH,
  HOLE_INNER_X,
  inHole,
  landmarksFor,
  pointAtZ,
  PRESS_PATH,
  RING_COLLECT,
  RING_R,
  riverX,
  SLUG_PATH,
  SORTS_PATH,
} from "./landmarks";
import { MISSIONS, unlockedIds } from "./missions";
import { CAMPAIGN, crewOf } from "./story";
import { ENVELOPE_X, ENVELOPE_Y, pathLength } from "./path";
import { analogFromDelta, fireFromStick } from "./stick";
import { grantClear } from "./kits";
import { SortieKeys } from "./input";
import { aimOff, aimScreen, inBox, unproject } from "./cam";
import { BARREL_T, CHARGE_LOCK, CHARGE_SEEK, GALLERY_LEAD, INNER_R, KEEP_R, LASER_LIFE, OUTER_R, SOMERSAULT_T, TGT_FAR, TGT_NEAR, WARN_FAR, createSortie, emptyInput, sightParallax, stepSortie } from "./sim";
import { fillTex, paintBrass, paintGrass, paintHull, paintInkWater, paintLead, paintScale, type Plot } from "./tex-paint";

function meanLuma(paint: (plot: Plot, n: number) => void) {
  const buf = fillTex(64, paint);
  let s = 0;
  let n = 0;
  for (let i = 0; i < buf.length; i += 4) {
    if (buf[i + 3] < 16) continue;
    s += 0.2126 * buf[i] + 0.7152 * buf[i + 1] + 0.0722 * buf[i + 2];
    n += 1;
  }
  return s / n;
}

test("sortie paints are daytime-bright", () => {
  const grass = meanLuma(paintGrass);
  const hull = meanLuma(paintHull);
  const water = meanLuma(paintInkWater);
  const lead = meanLuma(paintLead);
  const scale = meanLuma(paintScale);
  const brass = meanLuma(paintBrass);
  assert.ok(grass > 110, `grass ${grass}`);
  assert.ok(hull > 140, `hull ${hull}`);
  assert.ok(water > 110, `water ${water}`);
  assert.ok(lead > 140, `lead ${lead}`);
  assert.ok(scale > 100, `scale ${scale}`);
  assert.ok(brass > 150, `brass ${brass}`);
});

test("C-wing nose is parent -Z so yaw 0 flies forward", () => {
  const g = makeCWing();
  const body = g.getObjectByName("cwing-body");
  assert.ok(body);
  body.updateWorldMatrix(true, true);
  const nose = new THREE.Vector3(2, 0, 0);
  body.localToWorld(nose);
  assert.ok(nose.z < -1, `nose z ${nose.z}`);
  assert.ok(Math.abs(nose.x) < 0.25, `nose x ${nose.x}`);
});

test("stick left is roll left (screen left), stick up is pull-up", () => {
  const left = analogFromDelta(-40, 0, 64);
  const right = analogFromDelta(40, 0, 64);
  const up = analogFromDelta(0, -40, 64);
  const down = analogFromDelta(0, 40, 64);
  assert.ok(left.roll > 0.4, `left roll ${left.roll}`);
  assert.ok(right.roll < -0.4, `right roll ${right.roll}`);
  assert.ok(up.pitch > 0.4, `up pitch ${up.pitch}`);
  assert.ok(down.pitch < -0.4, `down pitch ${down.pitch}`);
});

test("right-stick inner disc aims, outer ring fires, rim has hysteresis", () => {
  assert.equal(fireFromStick(0.2, false), false);
  assert.equal(fireFromStick(0.6, false), true);
  assert.equal(fireFromStick(0.42, true), true);
  assert.equal(fireFromStick(0.2, true), false);
  assert.equal(fireFromStick(0.42, false), false);
});

test("ground is a field, not a cylinder stamp", () => {
  const a = groundHeight("coast", 0, -160);
  const b = groundHeight("coast", 80, -160);
  const sea = groundHeight("coast", 0, 300);
  assert.ok(a > 8, `plaza ${a}`);
  assert.ok(Math.abs(a - b) > 0.5, "height varies across the plaza");
  assert.ok(sea < a, `channel ${sea} vs plaza ${a}`);
});

test("A (roll +1) yaws left while flying forward", () => {
  const s = createSortie();
  const yaw0 = s.yaw;
  const inp = emptyInput();
  inp.roll = 1;
  for (let i = 0; i < 30; i++) stepSortie(s, inp, 1 / 60);
  assert.ok(s.yaw > yaw0 + 0.05, `yaw ${s.yaw} vs ${yaw0}`);
  assert.ok(s.roll > 0.05, `bank ${s.roll}`);
});

test("D (roll -1) yaws right", () => {
  const s = createSortie();
  const inp = emptyInput();
  inp.roll = -1;
  for (let i = 0; i < 30; i++) stepSortie(s, inp, 1 / 60);
  assert.ok(s.yaw < -0.05, `yaw ${s.yaw}`);
});

test("lasers go through the director", () => {
  const s = createSortie();
  s.stem = 0;
  s.x = 0;
  s.y = 48;
  s.z = 0;
  s.yaw = 0;
  s.pitch = 0;
  const inp = emptyInput();
  inp.sightX = 0.22;
  inp.fire = true;
  stepSortie(s, inp, 1 / 60);
  const shot = s.shots.find((q) => q.kind === "laser");
  assert.ok(shot);
  assert.ok(shot!.vx > 12, `through-sight vx ${shot!.vx}`);
});

test("an enemy in the world does not magnet a center shot", () => {
  const s = createSortie();
  s.stem = 0;
  s.enemies.push({
    id: 50,
    kind: "fighter",
    x: 3,
    y: 48,
    z: -80,
    vx: 0,
    vy: 0,
    vz: 0,
    hp: 2,
    t: 0,
    alive: true,
  });
  s.x = 0;
  s.y = 48;
  s.z = 0;
  s.yaw = 0;
  s.pitch = 0;
  const inp = emptyInput();
  inp.fire = true;
  stepSortie(s, inp, 1 / 60);
  const shot = s.shots.find((q) => q.kind === "laser");
  assert.ok(shot);
  assert.ok(Math.abs(shot!.vx) < 12, `no magnet vx ${shot!.vx}`);
  assert.equal(s.lockOn, false);
});

test("charge seeker locks a fighter in the director", () => {
  const s = createSortie();
  s.x = 0;
  s.y = 48;
  s.z = 0;
  s.yaw = 0;
  s.pitch = 0;
  const e = {
    id: 70,
    kind: "fighter" as const,
    x: 0,
    y: 48,
    z: -80,
    vx: 0,
    vy: 0,
    vz: 0,
    hp: 2,
    t: 0,
    alive: true,
  };
  s.enemies.push(e);
  for (let i = 0; i < 50; i++) {
    const pip = aimScreen(s, e.x, e.y, e.z);
    const held = emptyInput();
    held.fireHeld = true;
    held.sightX = pip.sx;
    held.sightY = pip.sy;
    stepSortie(s, held, 1 / 60);
  }
  assert.ok(s.charge >= CHARGE_SEEK, `charge ${s.charge}`);
  assert.equal(s.lockId, 70);
  assert.equal(s.lockOn, true);
  const pip = aimScreen(s, e.x, e.y, e.z);
  const brk = emptyInput();
  brk.lockBreak = true;
  brk.fireHeld = true;
  brk.sightX = pip.sx;
  brk.sightY = pip.sy;
  stepSortie(s, brk, 1 / 60);
  assert.equal(s.lockId, -1);
});

test("fighter right of the nose has positive sx", () => {
  const s = createSortie();
  s.x = 0;
  s.y = 48;
  s.z = 0;
  s.yaw = 0;
  s.pitch = 0;
  s.enemies.push({
    id: 71,
    kind: "fighter",
    x: 30,
    y: 48,
    z: -80,
    vx: 0,
    vy: 0,
    vz: 0,
    hp: 2,
    t: 0,
    alive: true,
  });
  const pip = aimScreen(s, 30, 48, -80);
  assert.ok(pip.sx > 0.05, `sx ${pip.sx}`);
});

test("drawn square matches lock volume", () => {
  const a = 16 / 9;
  assert.equal(inBox(0, OUTER_R * 0.9, OUTER_R, a), true);
  assert.equal(inBox(0, OUTER_R * 1.2, OUTER_R, a), false);
  assert.equal(inBox(0, INNER_R * 0.9, INNER_R, a), true);
  assert.ok(OUTER_R <= 0.15, `outer should be a two-frame tunnel, got ${OUTER_R}`);
  assert.ok(INNER_R < OUTER_R, "inner sits inside outer");
  assert.ok(KEEP_R > OUTER_R, "keep is hysteresis, not a bigger gun");
});

test("a charged lock does not sit the rail for you", () => {
  const s = createSortie({ corridor: true });
  stepSortie(s, emptyInput(), 1 / 60);
  s.offsetX = 0;
  s.offsetY = 0;
  const e = {
    id: 72,
    kind: "fighter" as const,
    x: s.x + 6,
    y: s.y,
    z: s.z - 80,
    vx: 0,
    vy: 0,
    vz: 0,
    hp: 2,
    t: 0,
    alive: true,
    staged: true,
  };
  s.enemies.push(e);
  for (let i = 0; i < 40; i++) {
    const pip = aimScreen(s, e.x, e.y, e.z);
    const held = emptyInput();
    held.fireHeld = true;
    held.sightX = pip.sx;
    held.sightY = pip.sy;
    stepSortie(s, held, 1 / 60);
  }
  assert.ok(s.lockOn, "lock is a box, not a tow");
  assert.ok(Math.abs(s.offsetX) < 2.5, `sit-nudge still pulling ${s.offsetX}`);
});

test("a fighter a few widths off the nose is outside the gunsight", () => {
  const s = createSortie();
  s.x = 0;
  s.y = 48;
  s.z = 0;
  s.yaw = 0;
  s.pitch = 0;
  s.enemies.push({
    id: 73,
    kind: "fighter",
    x: 10,
    y: 48,
    z: -80,
    vx: 0,
    vy: 0,
    vz: 0,
    hp: 2,
    t: 0,
    alive: true,
  });
  stepSortie(s, emptyInput(), 1 / 60);
  const off = aimOff(s, 10, 48, -80);
  assert.equal(inBox(off.sx, off.sy, OUTER_R, 16 / 9), false);
  assert.notEqual(s.lockId, 73);
  assert.equal(s.lockOn, false);
});

test("lasers down the nose miss a target outside the squares", () => {
  const s = createSortie();
  s.enemies.push({
    id: 51,
    kind: "fighter",
    x: 90,
    y: 48,
    z: -80,
    vx: 0,
    vy: 0,
    vz: 0,
    hp: 2,
    t: 0,
    alive: true,
  });
  s.x = 0;
  s.y = 48;
  s.z = 0;
  s.yaw = 0;
  s.pitch = 0;
  s.stem = 0;
  stepSortie(s, emptyInput(), 1 / 60);
  assert.notEqual(s.lockId, 51);
  const inp = emptyInput();
  inp.fire = true;
  stepSortie(s, inp, 1 / 60);
  const shot = s.shots.find((q) => q.kind === "laser");
  assert.ok(shot);
  assert.ok(Math.abs(shot!.vx) < 12, `no magnet vx ${shot!.vx}`);
});

test("lock only works in combat range", () => {
  const near = createSortie();
  near.x = 0;
  near.y = 48;
  near.z = 0;
  near.yaw = 0;
  near.pitch = 0;
  const e = {
    id: 88,
    kind: "fighter" as const,
    x: 0,
    y: 48,
    z: -80,
    vx: 0,
    vy: 0,
    vz: 0,
    hp: 2,
    t: 0,
    alive: true,
  };
  near.enemies.push(e);
  for (let i = 0; i < 50; i++) {
    const pip = aimScreen(near, e.x, e.y, e.z);
    const held = emptyInput();
    held.fireHeld = true;
    held.sightX = pip.sx;
    held.sightY = pip.sy;
    stepSortie(near, held, 1 / 60);
  }
  assert.equal(near.lockOn, true);

  const far = createSortie();
  far.x = 0;
  far.y = 48;
  far.z = 0;
  far.yaw = 0;
  far.pitch = 0;
  far.enemies.push({
    id: 89,
    kind: "fighter",
    x: 0,
    y: 48,
    z: -200,
    vx: 0,
    vy: 0,
    vz: 0,
    hp: 2,
    t: 0,
    alive: true,
  });
  for (let i = 0; i < 50; i++) {
    const pip = aimScreen(far, 0, 48, -200);
    const held = emptyInput();
    held.fireHeld = true;
    held.sightX = pip.sx;
    held.sightY = pip.sy;
    stepSortie(far, held, 1 / 60);
  }
  assert.notEqual(far.lockId, 89);
  assert.equal(far.lockOn, false);
});

test("lasers die before warn range", () => {
  const s = createSortie();
  s.stem = 0;
  s.x = 0;
  s.y = 48;
  s.z = 0;
  s.yaw = 0;
  s.pitch = 0;
  const inp = emptyInput();
  inp.fire = true;
  stepSortie(s, inp, 1 / 60);
  const shot0 = s.shots.find((q) => q.kind === "laser");
  assert.ok(shot0);
  for (let i = 0; i < 36; i++) stepSortie(s, emptyInput(), 1 / 60);
  const shot = s.shots.find((q) => q.kind === "laser");
  assert.ok(!shot || shot.life <= 0, `laser still alive ${shot?.life}`);
  assert.ok(TGT_FAR < WARN_FAR);
  assert.ok(TGT_FAR * 2 < 400 * 1.35);
  assert.ok(LASER_LIFE * 400 < TGT_FAR + 20);
  assert.ok(LASER_LIFE * 400 < WARN_FAR);
  assert.ok(GALLERY_LEAD > TGT_NEAR && GALLERY_LEAD < TGT_FAR);
});

test("lasers cannot snipe the amber watch", () => {
  const s = createSortie();
  s.wave = 99;
  s.stem = 0;
  s.invuln = 99;
  s.x = 0;
  s.y = 48;
  s.z = 0;
  s.yaw = 0;
  s.pitch = 0;
  s.enemies.push({
    id: 91,
    kind: "aster",
    x: 0,
    y: 48,
    z: -200,
    vx: 0,
    vy: 0,
    vz: 0,
    hp: 12,
    t: 0,
    alive: true,
    staged: false,
    armed: false,
  });
  const inp = emptyInput();
  inp.fire = true;
  stepSortie(s, inp, 1 / 60);
  for (let i = 0; i < 40; i++) stepSortie(s, emptyInput(), 1 / 60);
  const rock = s.enemies.find((e) => e.id === 91);
  assert.ok(rock?.alive);
  assert.equal(rock?.hp, 12);
});

test("gallery lizards close from watch range into the gun", () => {
  const s = createSortie({ corridor: true, path: COAST_PATH, missionId: "coast", biome: "coast" });
  s.wave = 99;
  s.invuln = 99;
  s.enemies.push({
    id: 82,
    kind: "fighter",
    x: s.x,
    y: s.y,
    z: s.z - 200,
    vx: 0,
    vy: 0,
    vz: 0,
    hp: 2,
    t: 0,
    alive: true,
    staged: true,
    armed: false,
    form: "guide",
    lead: 200,
    life: 12,
    slot: 0,
  });
  const e = s.enemies[s.enemies.length - 1];
  const held = emptyInput();
  held.fireHeld = true;
  stepSortie(s, held, 1 / 60);
  assert.notEqual(s.lockId, 82);
  for (let i = 0; i < 150; i++) stepSortie(s, emptyInput(), 1 / 60);
  const dist = Math.hypot(e.x - s.x, e.y - s.y, e.z - s.z);
  assert.ok(e.alive);
  assert.ok(dist < TGT_FAR, `still out of the gun ${dist}`);
  assert.ok(dist > TGT_NEAR + 20, `overshot the window ${dist}`);
  assert.ok(Math.abs((e.lead ?? 0) - GALLERY_LEAD) < 1, `lead ${e.lead}`);
});

test("Dualis cannot be lock-on targeted", () => {
  const s = createSortie();
  s.enemies.push({
    id: 9,
    kind: "dualis",
    x: 0,
    y: 48,
    z: -40,
    vx: 0,
    vy: 0,
    vz: 0,
    hp: 18,
    t: 0,
    alive: true,
  });
  s.x = 0;
  s.y = 48;
  s.z = 0;
  s.yaw = 0;
  s.pitch = 0;
  const held = emptyInput();
  held.fireHeld = true;
  for (let i = 0; i < 60; i++) stepSortie(s, held, 1 / 60);
  assert.ok(s.charge >= CHARGE_LOCK);
  assert.notEqual(s.lockId, 9);
  assert.equal(s.lockHard, false);
});

test("twin lasers converge on the director", () => {
  const s = createSortie();
  s.stem = 1;
  s.x = 0;
  s.y = 48;
  s.z = 0;
  s.yaw = 0;
  s.pitch = 0;
  const inp = emptyInput();
  inp.fire = true;
  stepSortie(s, inp, 1 / 60);
  const lasers = s.shots.filter((q) => q.kind === "laser");
  assert.equal(lasers.length, 2);
  const aim = unproject(s, 0, 0);
  for (const shot of lasers) {
    const sp = Math.hypot(shot.vx, shot.vy, shot.vz) || 1;
    const px = shot.x + (shot.vx / sp) * 90;
    const pz = shot.z + (shot.vz / sp) * 90;
    assert.ok(Math.abs(px - aim.x) < 18, `converge x ${px} vs ${aim.x}`);
    assert.ok(Math.abs(pz - aim.z) < 24, `converge z ${pz} vs ${aim.z}`);
  }
  assert.ok(lasers[0]!.vx * lasers[1]!.vx < 0 || Math.abs(lasers[0]!.vx) + Math.abs(lasers[1]!.vx) > 0.5);
});

test("keyboard stick eases in instead of slamming", () => {
  const keys = new SortieKeys();
  keys.setKeys(["KeyA"]);
  const first = keys.poll(1 / 60, false);
  assert.ok(first.roll > 0.02 && first.roll < 0.22, `first frame ${first.roll}`);
  for (let i = 0; i < 20; i++) {
    keys.setKeys(["KeyA"]);
    keys.poll(1 / 60, false);
  }
  keys.setKeys(["KeyA"]);
  const held = keys.poll(1 / 60, false);
  assert.ok(held.roll > 0.85, `held ${held.roll}`);
  for (let i = 0; i < 8; i++) {
    keys.setKeys([]);
    keys.poll(1 / 60, false);
  }
  const letGo = keys.poll(1 / 60, false);
  assert.ok(letGo.roll > 0.15 && letGo.roll < held.roll, `release ${letGo.roll}`);
});

test("sight holds when the mouse is still", () => {
  const keys = new SortieKeys();
  keys.setSight(0.4, -0.2);
  for (let i = 0; i < 40; i++) keys.poll(0.05, false);
  const b = keys.poll(0.05, false);
  assert.ok(Math.abs(b.sightX - 0.4) < 0.02, `sightX ${b.sightX}`);
  assert.ok(Math.abs(b.sightY + 0.2) < 0.02, `sightY ${b.sightY}`);
});

test("two frames nest at rest", () => {
  const s = createSortie();
  s.roll = 0;
  s.pitch = 0;
  s.offsetX = 0;
  s.offsetY = 0;
  for (let i = 0; i < 20; i++) stepSortie(s, emptyInput(), 1 / 60);
  const p = sightParallax(s);
  assert.ok(Math.abs(p.x) < 0.004, `para x ${p.x}`);
  assert.ok(Math.abs(s.innerSx - s.sightX) < 0.01, `inner ${s.innerSx} sight ${s.sightX}`);
});

test("parallax splits the inner frame on bank", () => {
  const s = createSortie();
  const inp = emptyInput();
  inp.roll = 1;
  for (let i = 0; i < 24; i++) stepSortie(s, inp, 1 / 60);
  const p = sightParallax(s);
  assert.ok(p.x < -0.004 && p.x > -0.03, `para x ${p.x}`);
  assert.ok(s.innerSx < s.sightX - 0.003, `inner ${s.innerSx} vs sight ${s.sightX}`);
});

test("on-nose fighter sits in both frames", () => {
  const s = createSortie();
  s.x = 0;
  s.y = 48;
  s.z = 0;
  s.yaw = 0;
  s.pitch = 0;
  s.speed = 0;
  const pip = aimScreen(s, 0, 48, -90);
  assert.ok(Math.abs(pip.sx) < INNER_R, `sx ${pip.sx}`);
  assert.ok(Math.abs(pip.sy) < OUTER_R, `sy ${pip.sy}`);
});

test("rail envelope is a lane, not a wander", () => {
  const s = createSortie({ corridor: true });
  const inp = emptyInput();
  inp.roll = 1;
  for (let i = 0; i < 30; i++) stepSortie(s, inp, 1 / 60);
  assert.ok(s.offsetX <= ENVELOPE_X + 0.05, `cap ${s.offsetX}`);
  assert.ok(s.offsetX > 16, `lane ${s.offsetX}`);
  assert.equal(ENVELOPE_X, 24);
});

test("inner frame stays on the director even while charging", () => {
  const s = createSortie();
  s.x = 0;
  s.y = 48;
  s.z = 0;
  s.yaw = 0;
  s.pitch = 0;
  s.enemies.push({
    id: 81,
    kind: "fighter",
    x: 0,
    y: 48,
    z: -80,
    vx: 0,
    vy: 0,
    vz: 0,
    hp: 2,
    t: 0,
    alive: true,
  });
  for (let i = 0; i < 30; i++) {
    const held = emptyInput();
    held.fireHeld = true;
    held.sightX = 0.1;
    held.sightY = -0.04;
    stepSortie(s, held, 1 / 60);
  }
  assert.ok(Math.abs(s.innerSx - 0.1) < 0.04, `inner ${s.innerSx}`);
  assert.ok(Math.abs(s.innerSy + 0.04) < 0.05, `innerY ${s.innerSy}`);
});

test("sight does not bank the craft", () => {
  const s = createSortie();
  const yaw0 = s.yaw;
  const inp = emptyInput();
  inp.sightX = 0.5;
  inp.sightY = 0.3;
  for (let i = 0; i < 30; i++) stepSortie(s, inp, 1 / 60);
  assert.ok(Math.abs(s.yaw - yaw0) < 0.04, `yaw ${s.yaw}`);
  assert.ok(Math.abs(s.cmdRoll) < 0.05, `cmdRoll ${s.cmdRoll}`);
});

test("all-range nose holds when the stick is still", () => {
  const s = createSortie();
  s.flight = "allrange";
  s.pitch = 0.5;
  for (let i = 0; i < 40; i++) stepSortie(s, emptyInput(), 1 / 60);
  assert.ok(Math.abs(s.pitch - 0.5) < 0.08, `yanked ${s.pitch}`);
});

test("laser hits a fighter", () => {
  const s = createSortie();
  for (let i = 0; i < 140; i++) stepSortie(s, emptyInput(), 1 / 60);
  const one = s.enemies.find((e) => e.kind === "fighter" && e.alive);
  assert.ok(one, "wave A should spawn");
  s.x = one!.x;
  s.y = one!.y;
  s.z = one!.z + 10;
  s.yaw = 0;
  s.pitch = 0;
  const inp = emptyInput();
  inp.fire = true;
  stepSortie(s, inp, 1 / 60);
  for (let i = 0; i < 20; i++) stepSortie(s, emptyInput(), 1 / 60);
  assert.ok(one!.hp < 2 || !one!.alive);
});

test("em-dash splash kills a cluster and counts hits", () => {
  const s = createSortie();
  s.bombs = 1;
  for (const [x, z] of [
    [0, -80],
    [8, -84],
    [-8, -76],
  ] as const) {
    s.enemies.push({
      id: s.enemyId++,
      kind: "fighter",
      x,
      y: 48,
      z,
      vx: 0,
      vy: 0,
      vz: 0,
      hp: 2,
      t: 0,
      alive: true,
    });
  }
  s.x = 0;
  s.y = 48;
  s.z = 0;
  const inp = emptyInput();
  inp.bomb = true;
  stepSortie(s, inp, 1 / 60);
  const bomb = s.shots.find((q) => q.kind === "bomb");
  assert.ok(bomb);
  bomb!.x = 0;
  bomb!.y = 48;
  bomb!.z = -80;
  bomb!.life = 2;
  const boom = emptyInput();
  boom.bomb = true;
  stepSortie(s, boom, 1 / 60);
  const dead = s.enemies.filter((e) => e.id > 40 || !e.alive).length;
  assert.ok(s.hits >= 3, `hits ${s.hits} deadish ${dead}`);
});

test("hyper stem doubles laser damage", () => {
  const s = createSortie();
  s.stem = 2;
  s.enemies.push({
    id: 77,
    kind: "fighter",
    x: 0,
    y: 48,
    z: -20,
    vx: 0,
    vy: 0,
    vz: 0,
    hp: 2,
    t: 0,
    alive: true,
  });
  s.x = 0;
  s.y = 48;
  s.z = -10;
  s.yaw = 0;
  s.pitch = 0;
  const inp = emptyInput();
  inp.fire = true;
  stepSortie(s, inp, 1 / 60);
  for (let i = 0; i < 12; i++) stepSortie(s, emptyInput(), 1 / 60);
  const e = s.enemies.find((n) => n.id === 77);
  assert.ok(e && (!e.alive || e.hp <= 0), `hp ${e?.hp} alive ${e?.alive}`);
});

test("island crash snaps a wing", () => {
  const s = createSortie();
  s.invuln = 0;
  s.wings = 2;
  s.x = 0;
  s.z = -180;
  s.y = 8;
  stepSortie(s, emptyInput(), 1 / 30);
  assert.equal(s.wings, 1);
});

test("barrel roll reflects an orb", () => {
  const s = createSortie();
  s.barrel = BARREL_T;
  s.shots.push({
    id: 99,
    kind: "orb",
    friendly: false,
    x: s.x,
    y: s.y,
    z: s.z,
    vx: 10,
    vy: 0,
    vz: 10,
    life: 1,
    lockId: -1,
  });
  stepSortie(s, emptyInput(), 1 / 60);
  const sh = s.shots.find((q) => q.id === 99);
  assert.ok(sh?.friendly, "orb should flip friendly");
  assert.equal(s.hull, 6);
});

test("charge bolt fires after lock time on release", () => {
  const s = createSortie();
  s.invuln = 99;
  s.wave = 99;
  const held = emptyInput();
  held.fireHeld = true;
  for (let i = 0; i < 50; i++) stepSortie(s, held, 1 / 60);
  assert.ok(s.charge >= CHARGE_LOCK);
  stepSortie(s, emptyInput(), 1 / 60);
  assert.ok(s.shots.some((q) => q.kind === "charge"));
});

test("water bounce keeps the ship in the arena", () => {
  const s = createSortie();
  s.y = 1;
  s.pitch = -0.4;
  s.invuln = 0;
  stepSortie(s, emptyInput(), 1 / 30);
  assert.ok(s.y > 4);
  assert.ok(s.hull < 6);
  assert.ok(Math.hypot(s.x, s.z) <= 430);
});

test("corridor pathT reaches 1 and mode-shifts to all-range", () => {
  const s = createSortie({ corridor: true });
  assert.equal(s.flight, "corridor");
  const inp = emptyInput();
  inp.boost = true;
  for (let i = 0; i < 800; i++) stepSortie(s, inp, 1 / 60);
  assert.ok(s.pathT >= 1, `pathT ${s.pathT}`);
  assert.equal(s.flight, "allrange");
});

test("A still yaws left on a corridor envelope", () => {
  const s = createSortie({ corridor: true });
  const x0 = s.offsetX;
  const inp = emptyInput();
  inp.roll = 1;
  for (let i = 0; i < 20; i++) stepSortie(s, inp, 1 / 60);
  assert.ok(s.offsetX > x0 + 0.4, `offsetX ${s.offsetX}`);
  assert.ok(s.roll > 0.05, `bank ${s.roll}`);
});

test("corridor stick sits in the window then drifts home", () => {
  const s = createSortie({ corridor: true });
  const inp = emptyInput();
  inp.roll = 1;
  for (let i = 0; i < 24; i++) stepSortie(s, inp, 1 / 60);
  assert.ok(s.offsetX > ENVELOPE_X * 0.7, `sit ${s.offsetX}`);
  for (let i = 0; i < 18; i++) stepSortie(s, emptyInput(), 1 / 60);
  assert.ok(Math.abs(s.offsetX) > 8, `yanked home ${s.offsetX}`);
  for (let i = 0; i < 150; i++) stepSortie(s, emptyInput(), 1 / 60);
  assert.ok(Math.abs(s.offsetX) < 6, `trim ${s.offsetX}`);
});

test("W without boost does not somersault", () => {
  const s = createSortie();
  const inp = emptyInput();
  inp.pitch = 1;
  for (let i = 0; i < 20; i++) stepSortie(s, inp, 1 / 60);
  assert.equal(s.somersault, 0);
  assert.ok(s.pitch > 0.2, `pitch ${s.pitch}`);
});

test("boost and keyboard pull-up climbs instead of looping", () => {
  const s = createSortie();
  s.flight = "allrange";
  s.y = 48;
  const inp = emptyInput();
  inp.boost = true;
  inp.pitch = 0.62;
  for (let i = 0; i < 20; i++) stepSortie(s, inp, 1 / 60);
  assert.equal(s.somersault, 0);
  assert.ok(s.pitch > 0.4, `tip ${s.pitch}`);
  assert.ok(s.y > 52, `climb ${s.y}`);
});

test("boost and full-stick pull loops after a beat", () => {
  const s = createSortie();
  s.flight = "allrange";
  const inp = emptyInput();
  inp.boost = true;
  inp.pitch = 1;
  for (let i = 0; i < 20; i++) stepSortie(s, inp, 1 / 60);
  assert.ok(s.somersault > 0);
});

test("rim U-turn faces inward and stays near the arena", () => {
  const s = createSortie();
  s.x = 0;
  s.z = 430;
  s.y = 50;
  s.yaw = 0;
  s.flight = "allrange";
  for (let i = 0; i < 90; i++) stepSortie(s, emptyInput(), 1 / 60);
  assert.ok(Math.hypot(s.x, s.z) < 480, `radial ${Math.hypot(s.x, s.z)}`);
  const inward = Math.atan2(s.x, s.z);
  let d = s.yaw - inward;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  assert.ok(Math.abs(d) < 0.8, `yaw ${s.yaw} inward ${inward}`);
});

test("every register has a brief and a debrief", () => {
  assert.ok(CAMPAIGN.includes("Dualis"));
  assert.equal(crewOf("s").title, "Gale");
  assert.equal(crewOf("!").title, "Dualis");
  assert.ok(crewOf("b").portrait.includes("b.jpg"));
  for (const m of MISSIONS) {
    assert.ok(m.brief.length > 12, m.id);
    assert.ok(m.debrief.length > 12, m.id);
  }
});

test("Register unlocks Sorts after Coast, Ice on Proof or warp", () => {
  assert.ok(unlockedIds([], []).has("coast"));
  assert.equal(unlockedIds(["coast"], []).has("sorts"), true);
  assert.equal(unlockedIds(["coast"], []).has("slug"), false);
  assert.equal(unlockedIds(["coast"], []).has("ice"), false);
  assert.equal(unlockedIds(["coast"], ["coast"]).has("ice"), true);
  assert.equal(unlockedIds(["sorts"], []).has("slug"), true);
  assert.equal(unlockedIds(["sorts"], [], ["sorts"]).has("ice"), true);
});

test("Coast strip is a long course", () => {
  assert.ok(pathLength(COAST_PATH) > 3000, `len ${pathLength(COAST_PATH)}`);
});

test("Coast river sits lower than the bank", () => {
  const z = 1500;
  const rx = riverX(z);
  const river = groundHeight("coast", rx, z, "coast");
  const bank = groundHeight("coast", rx + 50, z, "coast");
  assert.ok(bank > river + 4, `river ${river} bank ${bank}`);
  assert.ok(river < 3, `river floor ${river}`);
});

test("Coast waterfall gorge is lower than the cliff", () => {
  const z = 720;
  const rx = riverX(z);
  const gorge = groundHeight("coast", rx - 36, z, "coast");
  const cliff = groundHeight("coast", rx - 70, z, "coast");
  assert.ok(cliff > gorge + 12, `gorge ${gorge} cliff ${cliff}`);
});

test("seven n-arches pay and set the Coast fork", () => {
  const s = createSortie({ corridor: true, path: COAST_PATH, missionId: "coast", biome: "coast" });
  s.flight = "allrange";
  s.speed = 0;
  const arches = landmarksFor("coast").filter((L) => L.pay === "arch");
  assert.equal(arches.length, 7);
  for (const L of arches) {
    s.uturn = 0;
    s.x = L.x;
    s.y = L.h * 0.5;
    s.z = L.z;
    stepSortie(s, emptyInput(), 1 / 60);
  }
  assert.equal(s.archHits, 7);
  assert.equal(s.fork, true);
});

test("Scale advances through three phases before it can die as a set piece", () => {
  const s = createSortie();
  s.winKind = "mech";
  s.enemies.push({
    id: 3,
    kind: "mech",
    x: 0,
    y: 20,
    z: -20,
    vx: 0,
    vy: 0,
    vz: 0,
    hp: 24,
    t: 0,
    alive: true,
  });
  s.x = 0;
  s.y = 20;
  s.z = -10;
  const hit = emptyInput();
  hit.fire = true;
  for (let i = 0; i < 80; i++) {
    s.cooldown = 0;
    stepSortie(s, hit, 1 / 60);
  }
  assert.ok(s.bossPhase >= 1, `phase ${s.bossPhase}`);
});

test("coast all-range spawns Scale the mech", () => {
  const s = createSortie({ corridor: true, missionId: "coast", biome: "coast", name: "Exchange Coast" });
  s.winKind = "mech";
  s.pathT = 1;
  s.shift = 0.01;
  stepSortie(s, emptyInput(), 0.05);
  assert.equal(s.flight, "allrange");
  for (let i = 0; i < 5; i++) stepSortie(s, emptyInput(), 0.2);
  assert.ok(s.enemies.some((e) => e.kind === "mech"));
});

test("hold pull-up clamps; somersault is the only loop", () => {
  const s = createSortie();
  s.y = 80;
  s.pitch = 0;
  const inp = emptyInput();
  inp.pitch = 1;
  let maxY = s.y;
  let maxAbsPitch = 0;
  for (let i = 0; i < 120; i++) {
    stepSortie(s, inp, 1 / 60);
    maxY = Math.max(maxY, s.y);
    maxAbsPitch = Math.max(maxAbsPitch, Math.abs(s.pitch));
  }
  assert.ok(maxAbsPitch > 0.7, `tip too shallow ${maxAbsPitch}`);
  assert.ok(maxAbsPitch < 1.25, `pitch clamped, got ${maxAbsPitch}`);
  assert.equal(s.somersault, 0);
  assert.ok(maxY > 85, `should climb, maxY ${maxY}`);
});

test("all-range full A is a wide left turn", () => {
  const s = createSortie();
  s.flight = "allrange";
  const yaw0 = s.yaw;
  const inp = emptyInput();
  inp.roll = 1;
  for (let i = 0; i < 60; i++) stepSortie(s, inp, 1 / 60);
  const d = s.yaw - yaw0;
  assert.ok(d > 1.1, `too slow ${d}`);
  assert.ok(d < 2.2, `blender ${d}`);
});

test("release after a bank levels the wings; the nose holds then trims", () => {
  const s = createSortie();
  s.flight = "allrange";
  const inp = emptyInput();
  inp.roll = 1;
  inp.pitch = 1;
  for (let i = 0; i < 40; i++) stepSortie(s, inp, 1 / 60);
  for (let i = 0; i < 30; i++) stepSortie(s, emptyInput(), 1 / 60);
  assert.ok(Math.abs(s.roll) < 0.08, `roll ${s.roll}`);
  assert.ok(Math.abs(s.pitch) > 0.4, `nose yanked ${s.pitch}`);
  for (let i = 0; i < 240; i++) stepSortie(s, emptyInput(), 1 / 60);
  assert.ok(Math.abs(s.pitch) < 0.2, `trim ${s.pitch}`);
});

test("lock does not steal pull-up", () => {
  const s = createSortie();
  s.flight = "allrange";
  s.x = 0;
  s.y = 48;
  s.z = 0;
  s.yaw = 0;
  s.pitch = 0;
  s.enemies.push({
    id: 80,
    kind: "fighter",
    x: 8,
    y: 48,
    z: -80,
    vx: 0,
    vy: 0,
    vz: 0,
    hp: 2,
    t: 0,
    alive: true,
  });
  stepSortie(s, emptyInput(), 1 / 60);
  const inp = emptyInput();
  inp.pitch = 1;
  for (let i = 0; i < 20; i++) stepSortie(s, inp, 1 / 60);
  assert.ok(s.pitch > 0.15, `pitch ${s.pitch}`);
});

test("a tap fires a laser and a short hold does not spray", () => {
  const tap = createSortie();
  const shot = emptyInput();
  shot.fire = true;
  stepSortie(tap, shot, 1 / 60);
  assert.ok(tap.shots.some((q) => q.kind === "laser"));
  const s = createSortie();
  const inp = emptyInput();
  inp.fireHeld = true;
  for (let i = 0; i < 20; i++) stepSortie(s, inp, 1 / 60);
  assert.equal(s.shots.filter((q) => q.kind === "laser").length, 0);
  assert.ok(!s.shots.some((q) => q.kind === "charge"));
  assert.ok(s.charge < CHARGE_LOCK);
});

test("boost drains the meter", () => {
  const s = createSortie();
  const inp = emptyInput();
  inp.boost = true;
  for (let i = 0; i < 40; i++) stepSortie(s, inp, 1 / 60);
  assert.ok(s.boostMeter < 0.85, `meter ${s.boostMeter}`);
});

test("somersault loops with i-frames", () => {
  const s = createSortie();
  s.pitch = 0;
  const inp = emptyInput();
  inp.somersault = true;
  stepSortie(s, inp, 1 / 60);
  assert.ok(s.somersault > 0);
  const p0 = s.pitch;
  for (let i = 0; i < 20; i++) stepSortie(s, emptyInput(), 1 / 60);
  assert.ok(Math.abs(s.pitch - p0) > 1.2, `pitch ${s.pitch}`);
  assert.equal(SOMERSAULT_T > 0, true);
});

test("brake and pull-up U-turns in all-range", () => {
  const s = createSortie();
  s.flight = "allrange";
  const yaw0 = s.yaw;
  const inp = emptyInput();
  inp.brake = true;
  inp.pitch = 1;
  for (let i = 0; i < 50; i++) stepSortie(s, inp, 1 / 60);
  assert.ok(Math.abs(s.yaw - yaw0) > 2.2, `yaw ${s.yaw} from ${yaw0}`);
});

test("mashing fire sprays lasers with a short cooldown", () => {
  const s = createSortie();
  s.invuln = 99;
  s.wave = 99;
  const inp = emptyInput();
  inp.fire = true;
  let volleys = 0;
  for (let i = 0; i < 45; i++) {
    const id = s.shotId;
    stepSortie(s, inp, 1 / 60);
    if (s.shotId > id) volleys += 1;
  }
  assert.ok(volleys >= 5, `rapid volleys ${volleys}`);
  assert.ok(volleys <= 14, `cooldown should space shots, got ${volleys}`);
});

test("charge splash tags a neighbor", () => {
  const s = createSortie();
  s.invuln = 99;
  s.wave = 99;
  s.enemies.push(
    { id: 61, kind: "turret", x: 0, y: 48, z: -40, vx: 0, vy: 0, vz: 0, hp: 2, t: 0, alive: true },
    { id: 62, kind: "turret", x: 12, y: 48, z: -40, vx: 0, vy: 0, vz: 0, hp: 2, t: 0, alive: true },
  );
  s.x = 0;
  s.y = 48;
  s.z = 0;
  s.yaw = 0;
  s.pitch = 0;
  s.speed = 0;
  const held = emptyInput();
  held.fireHeld = true;
  for (let i = 0; i < 50; i++) {
    s.speed = 0;
    stepSortie(s, held, 1 / 60);
  }
  stepSortie(s, emptyInput(), 1 / 60);
  for (let i = 0; i < 40; i++) {
    s.speed = 0;
    stepSortie(s, emptyInput(), 1 / 60);
  }
  const a = s.enemies.find((e) => e.id === 61);
  const b = s.enemies.find((e) => e.id === 62);
  assert.ok(!a?.alive || a.hp < 2, `primary ${a?.hp}`);
  assert.ok(!b?.alive || b.hp < 2, `splash neighbor ${b?.hp}`);
});

test("corridor lizards fly the rail and do not reverse", () => {
  const s = createSortie({ corridor: true, path: COAST_PATH, missionId: "coast", biome: "coast" });
  s.wave = 99;
  s.enemies.push({
    id: 80,
    kind: "fighter",
    x: s.x,
    y: s.y,
    z: s.z - 40,
    vx: 0,
    vy: 0,
    vz: 0,
    hp: 2,
    t: 0,
    alive: true,
    staged: true,
    armed: false,
    form: "guide",
    lead: 180,
    life: 12,
    slot: 0,
  });
  const e = s.enemies[s.enemies.length - 1];
  for (let i = 0; i < 240; i++) stepSortie(s, emptyInput(), 1 / 60);
  assert.ok(e.alive, "should still be in the window at 4s");
  assert.ok(e.z < s.z, `should stay ahead on the rail, ez ${e.z} sz ${s.z}`);
  assert.ok(e.vz <= 0, `should not reverse, vz ${e.vz}`);
});

test("a V formation keeps spacing in the gunsight", () => {
  const s = createSortie({ corridor: true, path: COAST_PATH, missionId: "coast", biome: "coast" });
  s.wave = 99;
  for (const [slot, x] of [
    [0, 0],
    [1, -18],
    [2, 18],
  ] as const) {
    s.enemies.push({
      id: 90 + slot,
      kind: "fighter",
      x: s.x + x,
      y: s.y,
      z: s.z - 60,
      vx: 0,
      vy: 0,
      vz: 0,
      hp: 2,
      t: 0,
      alive: true,
      staged: true,
      armed: false,
      form: "v",
      formId: 7,
      slot,
      lead: 64,
      life: 6.5,
    });
  }
  for (let i = 0; i < 120; i++) stepSortie(s, emptyInput(), 1 / 60);
  const live = s.enemies.filter((e) => e.formId === 7 && e.alive);
  assert.equal(live.length, 3);
  const d01 = Math.hypot(live[0].x - live[1].x, live[0].z - live[1].z);
  const d02 = Math.hypot(live[0].x - live[2].x, live[0].z - live[2].z);
  assert.ok(d01 < 40 && d02 < 40, `V spacing ${d01} ${d02}`);
});

test("unarmed fighters fire no orbs", () => {
  const s = createSortie({ corridor: true, path: COAST_PATH, missionId: "coast", biome: "coast" });
  s.wave = 99;
  s.enemies.push({
    id: 77,
    kind: "fighter",
    x: s.x,
    y: s.y,
    z: s.z - 50,
    vx: 0,
    vy: 0,
    vz: 0,
    hp: 2,
    t: 0,
    alive: true,
    staged: true,
    armed: false,
    form: "guide",
    lead: 60,
    life: 6,
    slot: 0,
  });
  for (let i = 0; i < 240; i++) stepSortie(s, emptyInput(), 1 / 60);
  assert.equal(
    s.shots.filter((q) => !q.friendly).length,
    0,
  );
});

test("small sorts die to a laser", () => {
  const s = createSortie({ corridor: true, path: SORTS_PATH, missionId: "sorts", biome: "sorts" });
  s.wave = 99;
  s.flight = "allrange";
  s.speed = 0;
  s.x = 0;
  s.y = 48;
  s.z = 0;
  s.yaw = 0;
  s.pitch = 0;
  s.enemies.push({
    id: 201,
    kind: "aster",
    x: 0,
    y: 48,
    z: -30,
    vx: 0,
    vy: 0,
    vz: 0,
    hp: 1,
    t: 0,
    alive: true,
    armed: false,
  });
  const inp = emptyInput();
  inp.fire = true;
  stepSortie(s, inp, 1 / 60);
  for (let i = 0; i < 30; i++) stepSortie(s, emptyInput(), 1 / 60);
  const rock = s.enemies.find((e) => e.id === 201);
  assert.ok(!rock?.alive || (rock.hp ?? 1) <= 0, `aster hp ${rock?.hp} alive ${rock?.alive}`);
});

test("seven Sorts rings open a warp corridor then win", () => {
  const s = createSortie({ corridor: true, path: SORTS_PATH, missionId: "sorts", biome: "sorts" });
  s.wave = 99;
  s.flight = "allrange";
  s.speed = 0;
  for (let i = 0; i < 7; i++) {
    s.rings.push({ id: 300 + i, x: 0, y: 48, z: -20 - i, taken: false });
  }
  s.x = 0;
  s.y = 48;
  s.z = -20;
  for (let i = 0; i < 7; i++) {
    s.z = -20 - i;
    stepSortie(s, emptyInput(), 1 / 60);
  }
  assert.equal(s.fork, true);
  assert.equal(s.mode, "play");
  assert.ok(s.warpT > 0, `warpT ${s.warpT}`);
  assert.ok(s.enemies.some((e) => e.kind === "aster" && e.alive), "warp field should seed sorts");
  s.t = s.warpT + 8;
  stepSortie(s, emptyInput(), 0.05);
  assert.equal(s.mode, "win");
});

test("the quoin sheds its bit then lies", () => {
  const s = createSortie({ missionId: "sorts", biome: "sorts" });
  s.wave = 99;
  s.winKind = "mothership";
  s.invuln = 99;
  s.enemies.push({
    id: 9,
    kind: "mothership",
    x: 0,
    y: 48,
    z: -40,
    vx: 0,
    vy: 0,
    vz: 0,
    hp: 24,
    t: 0,
    alive: true,
  });
  s.x = 0;
  s.y = 48;
  s.z = 0;
  s.yaw = 0;
  s.speed = 0;
  const hit = emptyInput();
  hit.fire = true;
  for (let i = 0; i < 40; i++) {
    s.cooldown = 0;
    s.speed = 0;
    stepSortie(s, hit, 1 / 60);
  }
  assert.ok(s.bossPhase >= 1, `phase ${s.bossPhase}`);
  for (let i = 0; i < 40; i++) {
    s.cooldown = 0;
    s.speed = 0;
    stepSortie(s, hit, 1 / 60);
  }
  assert.ok(s.bossPhase >= 2, `phase ${s.bossPhase}`);
});

test("low flight over water sets skim", () => {
  const s = createSortie({ missionId: "coast", biome: "coast" });
  s.x = 0;
  s.y = 6;
  s.z = 1500;
  s.pitch = 0;
  stepSortie(s, emptyInput(), 1 / 60);
  assert.equal(s.skim, true);
});

test("all-range lizards keep the sky instead of sitting on the nose", () => {
  const s = createSortie();
  s.wave = 99;
  s.invuln = 99;
  s.x = 0;
  s.y = 48;
  s.z = 0;
  s.yaw = 0;
  s.pitch = 0;
  s.enemies.push({
    id: 44,
    kind: "fighter",
    x: 0,
    y: 48,
    z: -90,
    vx: 0,
    vy: 0,
    vz: 0,
    hp: 2,
    t: 0,
    alive: true,
    staged: true,
    armed: false,
  });
  const e = s.enemies[s.enemies.length - 1];
  const yaw = emptyInput();
  yaw.roll = 1;
  for (let i = 0; i < 90; i++) stepSortie(s, yaw, 1 / 60);
  assert.ok(s.yaw > 0.35, `yaw ${s.yaw}`);
  const cp = Math.cos(s.pitch);
  const fx = -Math.sin(s.yaw) * cp;
  const fz = -Math.cos(s.yaw) * cp;
  const glueX = s.x + fx * 88;
  const glueZ = s.z + fz * 88;
  const dist = Math.hypot(e.x - glueX, e.z - glueZ);
  assert.ok(dist > 40, `still glued to the nose ${dist}`);
  assert.equal(e.staged, false);
});

test("all-range lizards need about a second to reverse, like the C-wing", () => {
  const s = createSortie();
  s.enemies.push({
    id: 81,
    kind: "fighter",
    x: 0,
    y: 48,
    z: -40,
    vx: 0,
    vy: 0,
    vz: -22,
    hp: 2,
    t: 0,
    alive: true,
  });
  s.x = 0;
  s.y = 48;
  s.z = 80;
  s.yaw = 0;
  const e = s.enemies[s.enemies.length - 1];
  for (let i = 0; i < 12; i++) stepSortie(s, emptyInput(), 1 / 60);
  assert.ok(e.vz < 0, `still outgoing at 0.2s, vz ${e.vz}`);
  for (let i = 0; i < 80; i++) stepSortie(s, emptyInput(), 1 / 60);
  assert.ok(e.vz > 4, `has come about after a second, vz ${e.vz}`);
});



test("boost and brake change speed quickly", () => {
  const s = createSortie();
  const inp = emptyInput();
  inp.boost = true;
  for (let i = 0; i < 24; i++) stepSortie(s, inp, 1 / 60);
  assert.ok(s.speed > 85, `boost ${s.speed}`);
  inp.boost = false;
  inp.brake = true;
  for (let i = 0; i < 24; i++) stepSortie(s, inp, 1 / 60);
  assert.ok(s.speed < 40, `brake ${s.speed}`);
});

test("holding A to steer does not barrel", () => {
  const k = new SortieKeys();
  for (let i = 0; i < 20; i++) {
    k.setKeys(["KeyA"]);
    k.poll(0.016);
  }
  k.setKeys([]);
  k.poll(0.016);
  k.setKeys(["KeyA"]);
  const again = k.poll(0.016);
  assert.equal(again.barrel, 0);
});

test("single-tap Q barrels", () => {
  const k = new SortieKeys();
  k.setKeys(["KeyQ"]);
  const first = k.poll(0.016);
  assert.equal(first.barrel, 1);
  k.setKeys(["KeyQ"]);
  const held = k.poll(0.016);
  assert.equal(held.barrel, 0);
  k.setKeys([]);
  k.poll(0.016);
  k.setKeys(["KeyE"]);
  const right = k.poll(0.016);
  assert.equal(right.barrel, -1);
});

test("Space edge fires, hold is charge", () => {
  const k = new SortieKeys();
  k.setKeys(["Space"]);
  const down = k.poll(0.016);
  assert.equal(down.fire, true);
  assert.equal(down.fireHeld, true);
  k.setKeys(["Space"]);
  const held = k.poll(0.016);
  assert.equal(held.fire, false);
  assert.equal(held.fireHeld, true);
});

test("Dualis death wins the sortie", () => {
  const s = createSortie();
  s.t = 40;
  stepSortie(s, emptyInput(), 0.3);
  const boss = s.enemies.find((e) => e.kind === "dualis");
  if (!boss) {
    s.enemies.forEach((e) => {
      e.alive = false;
    });
    stepSortie(s, emptyInput(), 0.3);
  }
  const d = s.enemies.find((e) => e.kind === "dualis");
  assert.ok(d);
  d!.hp = 1;
  s.shots.push({
    id: 7,
    kind: "charge",
    friendly: true,
    x: d!.x,
    y: d!.y,
    z: d!.z,
    vx: 0,
    vy: 0,
    vz: 0,
    life: 1,
    lockId: d!.id,
  });
  stepSortie(s, emptyInput(), 1 / 60);
  assert.equal(s.mode, "win");
});

test("hitStop freezes the craft for a beat", () => {
  const s = createSortie();
  s.x = 0;
  s.y = 48;
  s.z = 0;
  s.yaw = 0;
  s.pitch = 0;
  s.hitStop = 0.2;
  const yaw0 = s.yaw;
  const inp = emptyInput();
  inp.roll = 1;
  stepSortie(s, inp, 1 / 60);
  assert.ok(Math.abs(s.yaw - yaw0) < 0.002, `moved during hitStop ${s.yaw}`);
  assert.ok(s.hitStop > 0.15);
});

test("ligature I adds a hull pip", () => {
  const s = createSortie({ kits: { ligature: 1 } });
  assert.equal(s.hullMax, 7);
  assert.equal(s.hull, 7);
});

test("collecting a kit ranks it and dirties the save", () => {
  const s = createSortie();
  s.wave = 99;
  s.x = 0;
  s.y = 48;
  s.z = 0;
  s.pickups.push({
    id: 3,
    kind: "kit",
    kit: "ligature",
    x: 0,
    y: 48,
    z: 0,
    taken: false,
  });
  stepSortie(s, emptyInput(), 1 / 60);
  assert.equal(s.kitRanks.ligature, 1);
  assert.equal(s.kitDirty, true);
  assert.ok(s.kitGained.includes("ligature"));
  s.kitDirty = false;
  s.pickups.push({
    id: 4,
    kind: "kit",
    kit: "ligature",
    x: s.x,
    y: s.y,
    z: s.z,
    taken: false,
  });
  stepSortie(s, emptyInput(), 1 / 60);
  assert.equal(s.kitRanks.ligature, 2);
  s.pickups.push({
    id: 5,
    kind: "kit",
    kit: "ligature",
    x: s.x,
    y: s.y,
    z: s.z,
    taken: false,
  });
  stepSortie(s, emptyInput(), 1 / 60);
  assert.equal(s.kitRanks.ligature, 2);
});

test("first writing seats a kit even without the pickup", () => {
  const a = grantClear("coast", false, {});
  assert.equal(a.ranks.ligature, 1);
  assert.ok(a.gained.includes("ligature"));
  const b = grantClear("coast", false, { ligature: 1 });
  assert.equal(b.gained.length, 0);
  const c = grantClear("coast", true, { ligature: 1 });
  assert.equal(c.ranks.serif, 1);
});

const PAY_PATHS: Record<string, { x: number; y: number; z: number }[]> = {
  coast: COAST_PATH,
  slug: SLUG_PATH,
  gutter: GUTTER_PATH,
  press: PRESS_PATH,
};

test("pay holes are wider than the craft and sit on the rail", () => {
  for (const id of ["coast", "slug", "gutter", "press"] as const) {
    const path = PAY_PATHS[id];
    for (const L of landmarksFor(id).filter((n) => n.pay)) {
      assert.ok(L.r >= HOLE_INNER_X, `${id} ${L.id} r ${L.r}`);
      const p = pointAtZ(path, L.z);
      if (L.kind === "gate") {
        assert.ok(Math.abs(L.x - p.x) <= ENVELOPE_X, `${id} ${L.id} off rail ${L.x - p.x}`);
      } else {
        assert.ok(Math.abs(L.x - p.x) <= 12, `${id} ${L.id} dx ${L.x - p.x}`);
      }
    }
  }
});

test("the rail flies through pay holes, not over them", () => {
  for (const id of ["coast", "slug", "gutter", "press"] as const) {
    const path = PAY_PATHS[id];
    for (const L of landmarksFor(id).filter((n) => n.pay)) {
      const p = pointAtZ(path, L.z);
      const y0 = groundHeight(id === "press" ? "press" : id === "gutter" ? "gutter" : id === "slug" ? "slug" : "coast", L.x, L.z, id);
      if (L.kind === "gate") {
        const dip = { x: L.x, y: p.y, z: L.z };
        assert.ok(inHole(dip.x, dip.y, dip.z, L, y0), `${id} ${L.id} dip miss y ${p.y}`);
        assert.equal(inHole(p.x, p.y, L.z, L, y0), false, `${id} ${L.id} paid on the street`);
        continue;
      }
      assert.ok(inHole(p.x, p.y, p.z, L, y0), `${id} ${L.id} path y ${p.y} hole ${L.h} r ${L.r}`);
    }
  }
});

test("Coast street is low enough to go under the highways", () => {
  for (const L of landmarksFor("coast").filter((n) => n.kind === "highway")) {
    const p = pointAtZ(COAST_PATH, L.z);
    const y0 = groundHeight("coast", L.x, L.z, "coast");
    assert.ok(p.y < 32, `rail ${p.y} at ${L.id}`);
    assert.ok(y0 + L.h >= p.y + 16, `deck ${y0 + L.h} rail ${p.y}`);
  }
  const mid = pointAtZ(COAST_PATH, 1500);
  const floor = groundHeight("coast", mid.x, mid.z, "coast");
  assert.ok(mid.y - ENVELOPE_Y >= floor + 6 - 0.5, `full dip ${mid.y - ENVELOPE_Y} floor ${floor + 6}`);
});

test("n-arches pay on the rail and miss at full sit", () => {
  const s = createSortie({ corridor: true, path: COAST_PATH, missionId: "coast", biome: "coast" });
  s.flight = "allrange";
  s.speed = 0;
  s.invuln = 4;
  const arches = landmarksFor("coast").filter((L) => L.pay === "arch");
  assert.equal(arches.length, 7);
  for (const L of arches) {
    const p = pointAtZ(COAST_PATH, L.z);
    s.x = p.x;
    s.y = p.y;
    s.z = L.z;
    stepSortie(s, emptyInput(), 1 / 60);
  }
  assert.equal(s.archHits, 7);
  assert.equal(s.fork, true);

  const miss = createSortie({ corridor: true, path: COAST_PATH, missionId: "coast", biome: "coast" });
  miss.flight = "allrange";
  miss.speed = 0;
  miss.invuln = 4;
  const L = arches[0];
  miss.x = L.x + ENVELOPE_X;
  miss.y = pointAtZ(COAST_PATH, L.z).y;
  miss.z = L.z;
  stepSortie(miss, emptyInput(), 1 / 60);
  assert.equal(miss.archHits, 0);
});

test("gorge sit is reachable and the street does not pay it", () => {
  const L = landmarksFor("coast").find((n) => n.id === "fall");
  assert.ok(L);
  const p = pointAtZ(COAST_PATH, L.z);
  assert.ok(Math.abs(L.x - p.x) <= ENVELOPE_X);
  assert.ok(p.y - ENVELOPE_Y < L.h);
  const y0 = groundHeight("coast", L.x, L.z, "coast");
  assert.equal(inHole(p.x, p.y, L.z, L, y0), false);
  assert.ok(inHole(L.x, p.y, L.z, L, y0));
});

test("tanker hold is the rail, envelope-up is not", () => {
  const L = landmarksFor("gutter").find((n) => n.pay === "tanker");
  assert.ok(L);
  const p = pointAtZ(GUTTER_PATH, L.z);
  const y0 = groundHeight("gutter", L.x, L.z, "gutter");
  assert.ok(inHole(p.x, p.y, p.z, L, y0), `path ${p.x},${p.y}`);
  assert.equal(inHole(p.x, p.y + ENVELOPE_Y, p.z, L, y0), false);
});

test("Sorts rock doors leave a craft-sized hole", () => {
  const hurt = 8;
  for (const r of [32, 34, 30]) {
    assert.ok(r - hurt >= HOLE_INNER_X, `ring r ${r}`);
  }
  const ring = rockRing(-40, ROCK_RING_R, 8);
  assert.equal(ring?.length, 8);
  const layer = (rocks(-50, 12) ?? []).slice(0, 4);
  const xs = layer.map((sh) => sh.dx).sort((a, b) => a - b);
  let minGap = 999;
  for (let i = 1; i < xs.length; i++) minGap = Math.min(minGap, xs[i] - xs[i - 1]);
  assert.ok(minGap >= 20, `gap ${minGap}`);
  assert.equal(RING_COLLECT, RING_R + 4);
  assert.ok(RING_R >= HOLE_INNER_X);
  assert.equal(ROCK_GAP, 36);
});

test("Press censers sit on the road", () => {
  for (const L of landmarksFor("press").filter((n) => n.pay)) {
    const p = pointAtZ(PRESS_PATH, L.z);
    assert.ok(Math.abs(L.x - p.x) <= ENVELOPE_X, `${L.id} ${L.x - p.x}`);
    assert.ok(L.r >= HOLE_INNER_X);
  }
});

test("Coast's first lizard is an unarmed sit, not a lecture", () => {
  const first = BEATS.coast.find((b) => b.kind === "spawn");
  assert.ok(first?.ships?.[0]);
  assert.equal(first.ships[0].kind, "fighter");
  assert.equal(first.ships[0].armed, false);
  assert.equal(first.ships[0].form, "hold");
  const lines = BEATS.coast.filter((b) => b.kind === "radio").map((b) => b.text ?? "");
  for (const line of lines) {
    assert.ok(!/Space|Tap |Hold if/i.test(line), line);
  }
  const armedV = BEATS.coast.find((b) => b.ships?.some((sh) => sh.armed));
  const silver = BEATS.coast.find((b) => b.loot?.kind === "silver");
  assert.ok(armedV && silver && armedV.t > silver.t, "first shots after the pickup");
});

test("Coast plaza Scale is a pushover lesson", () => {
  const scale = BEATS.coast.find((b) => b.when === "arena" && b.ships?.some((sh) => sh.kind === "mech"));
  const mech = scale?.ships?.find((sh) => sh.kind === "mech");
  assert.ok(mech);
  assert.ok((mech.hp ?? 24) <= 12, `hp ${mech.hp}`);
});

test("Sorts names the hole after the first door is on the rail", () => {
  const door = BEATS.sorts.find(
    (b) => b.ships?.length === 8 && b.ships.every((sh) => sh.kind === "aster" && sh.hp === 1),
  );
  const line = BEATS.sorts.find((b) => /hole pays/i.test(b.text ?? ""));
  assert.ok(door && line);
  assert.ok(line.t > door.t, `radio ${line.t} door ${door.t}`);
});
