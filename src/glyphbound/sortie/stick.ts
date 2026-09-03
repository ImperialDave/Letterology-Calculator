/** Virtual stick → sim roll/pitch. Screen: +x right, +y down. Sim: +roll left, +pitch pull-up. */

export const FIRE_ENTER = 0.48;
export const FIRE_LEAVE = 0.38;

/** Right-stick rim is the trigger. Inner disc aims only. */
export function fireFromStick(mag: number, wasFiring: boolean) {
  if (wasFiring) return mag >= FIRE_LEAVE;
  return mag >= FIRE_ENTER;
}

export function analogFromDelta(dx: number, dy: number, radius: number) {
  const nx = dx / Math.max(24, radius);
  const ny = dy / Math.max(24, radius);
  const m = Math.hypot(nx, ny);
  if (m < 0.14) return { roll: 0, pitch: 0, kx: 0, ky: 0, mag: 0 };
  const s = Math.min(1, (m - 0.14) / 0.86) / m;
  const x = nx * s;
  const y = ny * s;
  return { roll: -x, pitch: -y, kx: x, ky: y, mag: Math.hypot(x, y) };
}
