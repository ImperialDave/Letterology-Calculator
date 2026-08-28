import assert from "node:assert/strict";
import test from "node:test";
import {
  FACE_DEADZONE,
  TURN_LOCK,
  commitFacing,
  desiredFacing,
  faceToward,
  reverseAtLedge,
  tickTurnLock,
  type FacingActor,
} from "./enemy-facing";

function actor(over: Partial<FacingActor> = {}): FacingActor {
  return { x: 100, y: 0, w: 26, h: 44, facing: -1, turnLock: 0, vx: 55, ...over };
}

function player(x: number, w = 28): { x: number; y: number; w: number; h: number } {
  return { x, y: 0, w, h: 40 };
}

test("desired facing uses centers and a deadzone", () => {
  const e = actor();
  assert.equal(desiredFacing(e, player(100)), 0);
  assert.equal(desiredFacing(e, player(e.x + FACE_DEADZONE + 8)), 1);
  assert.equal(desiredFacing(e, player(e.x - FACE_DEADZONE - 40)), -1);
});

test("overlapping the player does not flip facing", () => {
  const e = actor({ facing: 1, vx: 55 });
  assert.equal(faceToward(e, player(102)), 1);
  assert.equal(e.facing, 1);
});

test("turn lock blocks an immediate reverse", () => {
  const e = actor({ facing: -1 });
  faceToward(e, player(200));
  assert.equal(e.facing, 1);
  assert.ok(e.turnLock >= TURN_LOCK - 0.001);
  faceToward(e, player(0));
  assert.equal(e.facing, 1);
  tickTurnLock(e, TURN_LOCK + 0.01);
  faceToward(e, player(0));
  assert.equal(e.facing, -1);
});

test("ledge reverse commits a lock so chase cannot undo it next frame", () => {
  const e = actor({ facing: 1, vx: 55 });
  const kept = reverseAtLedge(e, player(0));
  assert.equal(kept, false);
  assert.equal(e.facing, -1);
  assert.equal(e.vx, 0);
  assert.ok(e.turnLock > 0);
  faceToward(e, player(200));
  assert.equal(e.facing, -1);
});

test("ledge keeps facing when the player is ahead so a leap can fire", () => {
  const e = actor({ facing: 1 });
  assert.equal(reverseAtLedge(e, player(200)), true);
  assert.equal(e.facing, 1);
});

test("commitFacing refreshes the lock even if already facing that way", () => {
  const e = actor({ facing: -1, turnLock: 0 });
  commitFacing(e, -1);
  assert.equal(e.facing, -1);
  assert.ok(e.turnLock >= TURN_LOCK - 0.001);
});
