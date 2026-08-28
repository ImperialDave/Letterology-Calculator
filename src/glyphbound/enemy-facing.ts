/** Chase facing with a deadzone + turn lock so numbers do not vibrate. */

export const FACE_DEADZONE = 36;
export const TURN_LOCK = 0.32;

export type FacingBody = { x: number; y: number; w: number; h: number };

export type FacingActor = FacingBody & {
  facing: 1 | -1;
  turnLock: number;
  vx?: number;
};

export function tickTurnLock(e: { turnLock: number }, dt: number) {
  e.turnLock = Math.max(0, e.turnLock - dt);
}

/** 0 = overlapping / inside the deadzone — keep current facing. */
export function desiredFacing(e: FacingBody, p: FacingBody): 1 | -1 | 0 {
  const dx = p.x + p.w / 2 - (e.x + e.w / 2);
  if (Math.abs(dx) < FACE_DEADZONE) return 0;
  return dx > 0 ? 1 : -1;
}

export function commitFacing(e: FacingActor, dir: 1 | -1, lock = TURN_LOCK) {
  const next = dir < 0 ? -1 : 1;
  if (e.facing !== next) e.facing = next;
  e.turnLock = Math.max(e.turnLock, lock);
}

export function faceToward(e: FacingActor, p: FacingBody) {
  if (e.turnLock > 0) return e.facing;
  const want = desiredFacing(e, p);
  if (want && want !== e.facing) commitFacing(e, want);
  return e.facing;
}

/** At a ledge: keep facing if the player is ahead (caller may leap), else reverse and lock. */
export function reverseAtLedge(e: FacingActor, p: FacingBody): boolean {
  if (desiredFacing(e, p) === e.facing) return true;
  commitFacing(e, e.facing < 0 ? 1 : -1);
  if (e.vx != null) e.vx = 0;
  return false;
}
