import assert from "node:assert/strict";
import test from "node:test";
import { unlockedIds } from "./missions";
import { BARREL_T, CHARGE_LOCK, createSortie, emptyInput, stepSortie } from "./sim";

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

test("soft lock pulls lasers toward a target off the nose", () => {
  const s = createSortie();
  s.enemies.push({
    id: 50,
    kind: "fighter",
    x: 40,
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
  assert.ok(shot!.vx > 8, `aim-assist vx ${shot!.vx}`);
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
