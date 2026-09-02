/** Virtual stick → sim roll/pitch. Screen: +x right, +y down. Sim: +roll left, +pitch pull-up. */

export function analogFromDelta(dx: number, dy: number, radius: number) {
  const nx = dx / Math.max(24, radius);
  const ny = dy / Math.max(24, radius);
  const m = Math.hypot(nx, ny);
  if (m < 0.14) return { roll: 0, pitch: 0, kx: 0, ky: 0 };
  const s = Math.min(1, (m - 0.14) / 0.86) / m;
  const x = nx * s;
  const y = ny * s;
  return { roll: -x, pitch: -y, kx: x, ky: y };
}
