import assert from "node:assert/strict";
import test from "node:test";
import { groundHeight } from "./height";
import { unlockedIds } from "./missions";
import { analogFromDelta } from "./stick";
import { SortieKeys } from "./input";
import { BARREL_T, CHARGE_LOCK, MAGNET, SOMERSAULT_T, createSortie, emptyInput, stepSortie } from "./sim";
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

test("soft lock pulls lasers toward a target in the inner square", () => {
  const s = createSortie();
  s.enemies.push({
    id: 50,
    kind: "fighter",
    x: 16,
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
  stepSortie(s, emptyInput(), 1 / 60);
  assert.equal(s.lockId, 50);
  const inp = emptyInput();
  inp.fire = true;
  stepSortie(s, inp, 1 / 60);
  const shot = s.shots.find((q) => q.kind === "laser");
  assert.ok(shot);
  assert.ok(shot!.vx > 4, `magnetism vx ${shot!.vx}`);
  assert.ok(shot!.vx < 240 * MAGNET + 40, `not full home ${shot!.vx}`);
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
  stepSortie(s, emptyInput(), 1 / 60);
  assert.notEqual(s.lockId, 51);
  const inp = emptyInput();
  inp.fire = true;
  stepSortie(s, inp, 1 / 60);
  const shot = s.shots.find((q) => q.kind === "laser");
  assert.ok(shot);
  assert.ok(Math.abs(shot!.vx) < 8, `no magnet vx ${shot!.vx}`);
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
  for (let i = 0; i < 40; i++) stepSortie(s, held, 1 / 60);
  assert.notEqual(s.lockId, 9);
  assert.equal(s.lockHard, false);
});

test("pitch auto-levels when stick is released", () => {
  const s = createSortie();
  s.pitch = 0.5;
  for (let i = 0; i < 40; i++) stepSortie(s, emptyInput(), 1 / 60);
  assert.ok(Math.abs(s.pitch) < 0.25, `pitch ${s.pitch}`);
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

test("Register unlocks ice when Coast is a Proof, else slug", () => {
  assert.ok(unlockedIds([], []).has("coast"));
  assert.equal(unlockedIds(["coast"], []).has("slug"), true);
  assert.equal(unlockedIds(["coast"], []).has("ice"), false);
  assert.equal(unlockedIds(["coast"], ["coast"]).has("ice"), true);
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

test("hold pull-up keeps pitching through a loop", () => {
  const s = createSortie();
  s.y = 80;
  s.pitch = 0;
  const inp = emptyInput();
  inp.pitch = 1;
  let maxY = s.y;
  let maxAbsPitch = 0;
  for (let i = 0; i < 100; i++) {
    stepSortie(s, inp, 1 / 60);
    maxY = Math.max(maxY, s.y);
    maxAbsPitch = Math.max(maxAbsPitch, Math.abs(s.pitch));
  }
  assert.ok(maxAbsPitch > 1.5, `pitch should pass vertical, got ${maxAbsPitch}`);
  assert.ok(maxY > 95, `loop should climb, maxY ${maxY}`);
});

test("short hold sprays and does not dump a charge bolt", () => {
  const s = createSortie();
  const inp = emptyInput();
  inp.fireHeld = true;
  for (let i = 0; i < 20; i++) stepSortie(s, inp, 1 / 60);
  assert.ok(s.shots.some((q) => q.kind === "laser"));
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

test("hold fire sprays lasers with a short cooldown", () => {
  const s = createSortie();
  const inp = emptyInput();
  inp.fireHeld = true;
  let volleys = 0;
  for (let i = 0; i < 45; i++) {
    const id = s.shotId;
    stepSortie(s, inp, 1 / 60);
    if (s.shotId > id) volleys += 1;
  }
  assert.ok(volleys >= 5, `rapid volleys ${volleys}`);
  assert.ok(volleys <= 14, `cooldown should space shots, got ${volleys}`);
  assert.ok(s.gunHeat > 0.1, `heat ${s.gunHeat}`);
});

test("rapid-fire heat hitch is brief, then guns recover", () => {
  const s = createSortie();
  const inp = emptyInput();
  inp.fireHeld = true;
  for (let i = 0; i < 240; i++) stepSortie(s, inp, 1 / 60);
  assert.ok(s.gunHeat < 1, `heat should not stick at max ${s.gunHeat}`);
  const cooling = emptyInput();
  for (let i = 0; i < 90; i++) stepSortie(s, cooling, 1 / 60);
  assert.ok(s.gunHeat < 0.2, `forgiving recovery ${s.gunHeat}`);
});

test("player can reverse heading in about a second", () => {
  const s = createSortie();
  const yaw0 = s.yaw;
  const inp = emptyInput();
  inp.roll = 1;
  for (let i = 0; i < 60; i++) stepSortie(s, inp, 1 / 60);
  const d = s.yaw - yaw0;
  assert.ok(d > 2.6, `turn ${d}`);
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

test("double-tap A within a wide window barrels", () => {
  const k = new SortieKeys();
  k.setKeys(["KeyA"]);
  const first = k.poll(0.016);
  assert.equal(first.barrel, 0);
  k.setKeys([]);
  k.poll(0.016);
  for (let i = 0; i < 20; i++) k.poll(0.016);
  k.setKeys(["KeyA"]);
  const second = k.poll(0.016);
  assert.equal(second.barrel, 1);
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
