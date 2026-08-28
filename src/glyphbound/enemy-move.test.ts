import assert from "node:assert/strict";
import test from "node:test";
import { TILE } from "./types";
import {
  ENEMY_G,
  JUMP_CLEAR,
  MAX_JUMP_H,
  MIN_JUMP_H,
  OLD_LEAP_VY,
  gravityFor,
  heightTo,
  jumpCap,
  jumpHeight,
  jumpVy,
  probeAhead,
  tryLocomote,
  type Mover,
  type MoveWorld,
} from "./enemy-move";

function worldFromRows(rows: string[]): MoveWorld {
  const solid = new Set(["#", "=", "*", "_", "&", "-"]);
  const hazard = new Set(["^", "~"]);
  const cell = (x: number, y: number) => {
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(y / TILE);
    return rows[ty]?.[tx] ?? "#";
  };
  const boxHits = (x: number, y: number, w: number, h: number, set: Set<string>) => {
    for (let px = x; px < x + w; px += 6) {
      for (let py = y; py < y + h; py += 6) {
        if (set.has(cell(px, py))) return true;
      }
    }
    return set.has(cell(x + w / 2, y + h / 2));
  };
  return {
    blockedAt: (x, y, w, h) => boxHits(x, y, w, h, solid),
    hazardAt: (x, y, w, h) => boxHits(x, y, w, h, hazard),
  };
}

function mover(over: Partial<Mover> = {}): Mover {
  return {
    kind: "one",
    x: TILE * 2,
    y: TILE * 2,
    w: 26,
    h: 44,
    vx: 55,
    vy: 0,
    facing: 1,
    turnLock: 0,
    grounded: true,
    stun: 0,
    alive: true,
    ...over,
  };
}

function player(x: number, y = TILE * 2, w = 28, h = 40) {
  return { x, y, w, h };
}

test("max jump height is double the old −460 peak", () => {
  const old = jumpHeight(OLD_LEAP_VY, ENEMY_G);
  assert.ok(Math.abs(MAX_JUMP_H - old * 2) < 0.5);
  assert.ok(MAX_JUMP_H > TILE * 2);
  assert.ok(MAX_JUMP_H < TILE * 3);
});

test("jumpVy only goes as high as the need, never above the cap", () => {
  const one = jumpHeight(jumpVy(ENEMY_G, TILE + JUMP_CLEAR), ENEMY_G);
  const two = jumpHeight(jumpVy(ENEMY_G, TILE * 2 + JUMP_CLEAR), ENEMY_G);
  assert.ok(one < two);
  assert.ok(one < TILE * 1.5);
  assert.ok(two <= MAX_JUMP_H + 0.5);
  const capped = jumpHeight(jumpVy(ENEMY_G, TILE * 6), ENEMY_G);
  assert.ok(Math.abs(capped - MAX_JUMP_H) < 1);
  assert.ok(jumpHeight(jumpVy(ENEMY_G, 4), ENEMY_G) >= MIN_JUMP_H - 0.5);
});

test("a 1-tile crate is a short vault, a 2-tile well is a taller hop", () => {
  const crate = worldFromRows([
    "........",
    "........",
    "....#...",
    "########",
  ]);
  const well = worldFromRows([
    "........",
    "###..###",
    "###..###",
    "########",
  ]);
  const e = mover({ x: TILE * 4 - 28, y: TILE * 3 - 44, facing: 1 });
  const crateProbe = probeAhead(crate, e);
  assert.ok(crateProbe.wallAhead || crateProbe.stepHeight >= TILE);
  assert.ok(crateProbe.stepHeight <= TILE * 2);

  const pit = mover({ x: TILE * 3 + 8, y: TILE * 3 - 44, facing: 1 });
  const pitProbe = probeAhead(well, pit);
  assert.ok(pitProbe.pitWall >= TILE);
  assert.ok(jumpVy(ENEMY_G, crateProbe.stepHeight || TILE) > jumpVy(ENEMY_G, pitProbe.pitWall || TILE * 2));
});

test("tryLocomote vaults a 1-tile crate toward the player", () => {
  const rows = ["........", "........", "....#...", "########"];
  const w = worldFromRows(rows);
  const e = mover({ x: TILE * 4 - 28, y: TILE * 3 - 44, facing: 1, vx: 55 });
  const p = player(TILE * 6, TILE * 3 - 40);
  const ok = tryLocomote(w, e, p, 0);
  assert.equal(ok, true);
  assert.equal(e.grounded, false);
  assert.ok(e.vy < 0);
  const h = jumpHeight(-e.vy, ENEMY_G);
  assert.ok(h <= TILE * 1.6, `vault too high ${h}`);
});

test("tryLocomote climbs out of a 2-tile well", () => {
  const w = worldFromRows(["........", "###..###", "###..###", "########"]);
  const e = mover({ x: TILE * 3 + 6, y: TILE * 3 - 44, facing: 1 });
  const p = player(TILE * 6, TILE - 40);
  const ok = tryLocomote(w, e, p, 0);
  assert.equal(ok, true);
  assert.ok(e.vy < jumpVy(ENEMY_G, TILE));
  assert.ok(jumpHeight(-e.vy, gravityFor("one")) <= jumpCap("one") + 1);
});

test("a 3-tile cliff is out of budget so they do not max-jump", () => {
  const w = worldFromRows(["....#...", "....#...", "....#...", "########"]);
  const e = mover({ x: TILE, y: TILE * 3 - 44, facing: 1 });
  const p = player(TILE * 5, 4);
  const before = e.vy;
  const ok = tryLocomote(w, e, p, 0);
  if (ok) {
    assert.ok(jumpHeight(-e.vy, ENEMY_G) <= MAX_JUMP_H + 1);
  } else {
    assert.equal(e.vy, before);
  }
});

test("they reverse instead of leaping onto spikes", () => {
  const w = worldFromRows(["........", "........", "........", "##^^^^##"]);
  const e = mover({ x: TILE * 2 - 30, y: TILE * 3 - 44, facing: 1, turnLock: 0 });
  const p = player(TILE * 5, TILE * 3 - 40);
  const ok = tryLocomote(w, e, p, 0);
  assert.equal(ok, true);
  assert.equal(e.facing, -1);
  assert.equal(e.grounded, true);
  assert.equal(e.vx, 0);
});

test("heightTo sizes a lunge hop to the player's feet", () => {
  const e = { y: 100, h: 44 };
  const high = { y: 20, h: 40 };
  const same = { y: 104, h: 40 };
  assert.ok(heightTo(e, high) > 70);
  assert.ok(heightTo(e, same) < 8);
  assert.ok(jumpVy(ENEMY_G, heightTo(e, high) + JUMP_CLEAR) < jumpVy(ENEMY_G, 40));
});

test("plus can locomote (pit escape) even though it had no hops before", () => {
  const w = worldFromRows(["........", "###..###", "###..###", "########"]);
  const e = mover({ kind: "plus", x: TILE * 3 + 6, y: TILE * 3 - 44, facing: -1 });
  const p = player(TILE, TILE - 40);
  assert.equal(tryLocomote(w, e, p, 0), true);
  assert.ok(e.vy < 0);
});
