import assert from "node:assert/strict";
import test from "node:test";
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

test("laser hits a 1", () => {
  const s = createSortie();
  for (let i = 0; i < 140; i++) stepSortie(s, emptyInput(), 1 / 60);
  const one = s.enemies.find((e) => e.kind === "1" && e.alive);
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
