/** Corridor path: waypoints in world space. Sim stays free of three.js. */

export interface PathPoint {
  x: number;
  y: number;
  z: number;
}

export interface PathSample {
  x: number;
  y: number;
  z: number;
  yaw: number;
  dx: number;
  dy: number;
  dz: number;
  len: number;
}

export function pathLength(pts: PathPoint[]) {
  let n = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    n += Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
  }
  return n;
}

/** t is 0..1 along the polyline. */
export function samplePath(pts: PathPoint[], t: number): PathSample {
  if (pts.length === 0) return { x: 0, y: 40, z: 0, yaw: 0, dx: 0, dy: 0, dz: -1, len: 0 };
  if (pts.length === 1) {
    const p = pts[0];
    return { x: p.x, y: p.y, z: p.z, yaw: 0, dx: 0, dy: 0, dz: -1, len: 0 };
  }
  const total = pathLength(pts) || 1;
  let remain = Math.max(0, Math.min(1, t)) * total;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const seg = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) || 1e-6;
    if (remain <= seg || i === pts.length - 1) {
      const u = Math.max(0, Math.min(1, remain / seg));
      const dx = (b.x - a.x) / seg;
      const dy = (b.y - a.y) / seg;
      const dz = (b.z - a.z) / seg;
      return {
        x: a.x + (b.x - a.x) * u,
        y: a.y + (b.y - a.y) * u,
        z: a.z + (b.z - a.z) * u,
        yaw: Math.atan2(-dx, -dz),
        dx,
        dy,
        dz,
        len: total,
      };
    }
    remain -= seg;
  }
  const last = pts[pts.length - 1];
  return { x: last.x, y: last.y, z: last.z, yaw: 0, dx: 0, dy: 0, dz: -1, len: total };
}

/** Envelope slide: right is horizontal perpendicular to path tangent. */
export function pathFrame(sample: PathSample, offsetX: number, offsetY: number) {
  const rx = sample.dz;
  const rz = -sample.dx;
  const rn = Math.hypot(rx, rz) || 1;
  return {
    x: sample.x + (rx / rn) * offsetX,
    y: sample.y + offsetY,
    z: sample.z + (rz / rn) * offsetX,
    yaw: sample.yaw,
  };
}

/** A short teaching corridor that dumps into Lower Case Sky's arena. */
export const SKY_CORRIDOR: PathPoint[] = [
  { x: 0, y: 42, z: 380 },
  { x: 0, y: 44, z: 260 },
  { x: 20, y: 46, z: 160 },
  { x: 0, y: 48, z: 80 },
  { x: 0, y: 50, z: 20 },
];

export const SHIFT_T = 1.2;
export const UTURN_T = 0.72;
export const ENVELOPE_X = 36;
export const ENVELOPE_Y = 28;
