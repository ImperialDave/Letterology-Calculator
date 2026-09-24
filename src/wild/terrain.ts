import { CALDERA, SPIRE } from "./layout";

export const MESA = { x: 52, z: -36 };
export const FEN = { x: 78, z: 62 };
export const FOREST = { x: 175, z: 8 };
export const SHEET = { x0: -40, x1: 170, z0: -60, z1: 55 };

function hash(ix: number, iz: number) {
  let n = Math.imul(ix, 374761393) + Math.imul(iz, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n >>> 0) & 65535) / 65535;
}

function noise(x: number, z: number) {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  let fx = x - x0;
  let fz = z - z0;
  fx = fx * fx * (3 - 2 * fx);
  fz = fz * fz * (3 - 2 * fz);
  const a = hash(x0, z0);
  const b = hash(x0 + 1, z0);
  const c = hash(x0, z0 + 1);
  const d = hash(x0 + 1, z0 + 1);
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
}

function fbm(x: number, z: number) {
  let a = 0;
  let amp = 0.5;
  let f = 1;
  for (let i = 0; i < 4; i++) {
    a += noise(x * f, z * f) * amp;
    f *= 2;
    amp *= 0.5;
  }
  return a;
}

function smooth(e0: number, e1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

export function trailDistance(x: number, z: number) {
  const ax = 2;
  const az = 6;
  const abx = SPIRE.x - ax;
  const abz = SPIRE.z - az;
  const denom = abx * abx + abz * abz || 1;
  const t = Math.min(1, Math.max(0, ((x - ax) * abx + (z - az) * abz) / denom));
  return Math.hypot(x - (ax + abx * t), z - (az + abz * t));
}

/** The dry river's center line. The sheet draws the same curve the ground uses. */
export function riverCenter(x: number) {
  return -22 + Math.sin(x * 0.045) * 4;
}

/** A wooden deck crosses the groove here, so the walk stays level. */
export const FORD = { x: 8, halfX: 2.4, halfZ: 7 };

export function onFord(x: number, z: number) {
  return Math.abs(x - FORD.x) < FORD.halfX && Math.abs(z - riverCenter(FORD.x)) < FORD.halfZ;
}

export function terrainHeight(x: number, z: number) {
  let h = 1.5 + (fbm(x * 0.018, z * 0.018) - 0.35) * 4.5;
  const mesa = Math.hypot(x - MESA.x, z - MESA.z);
  h += smooth(30, 16, mesa) * 12;
  const spire = Math.hypot(x - SPIRE.x, z - SPIRE.z);
  h += smooth(34, 8, spire) * 4.5;
  if (z > 40) h -= smooth(40, 68, z) * 2.4;
  if (x > 145) h += smooth(145, 185, x) * (1.5 + fbm(x * 0.03, z * 0.03) * 2.5);
  if (x > 200 && z < 5) h += smooth(200, 250, x) * 7;
  const camp = Math.hypot(x, z - 6);
  const flat = smooth(20, 7, camp);
  h = h * (1 - flat) + 2.2 * flat;
  const river = Math.abs(z - riverCenter(x));
  if (!onFord(x, z) && x > -20 && x < 100 && river < 6) h -= (1 - river / 6) * 0.7;
  return h;
}

export function terrainRgb(x: number, z: number): [number, number, number] {
  const h = terrainHeight(x, z);
  let r = 0.8;
  let g = 0.64;
  let b = 0.3;
  const mesa = Math.hypot(x - MESA.x, z - MESA.z);
  if (mesa < 18 || h > 10) {
    r = 0.9;
    g = 0.88;
    b = 0.78;
  }
  if (z > 46) {
    const k = smooth(46, 64, z);
    r = r * (1 - k) + 0.18 * k;
    g = g * (1 - k) + 0.32 * k;
    b = b * (1 - k) + 0.48 * k;
  }
  if (x > 150 && z < 40 && z > -25) {
    const k = smooth(150, 175, x);
    r = r * (1 - k) + 0.28 * k;
    g = g * (1 - k) + 0.48 * k;
    b = b * (1 - k) + 0.22 * k;
  }
  if (x > 205 && z < 8) {
    const k = smooth(205, 235, x);
    r = r * (1 - k) + 0.86 * k;
    g = g * (1 - k) + 0.84 * k;
    b = b * (1 - k) + 0.76 * k;
  }
  const caldera = Math.hypot(x - CALDERA.x, z - CALDERA.z);
  if (caldera < 28) {
    const k = 1 - caldera / 28;
    r = r * (1 - k) + 0.75 * k;
    g = g * (1 - k) + 0.42 * k;
    b = b * (1 - k) + 0.16 * k;
  }
  const trail = trailDistance(x, z);
  if (trail < 4 && z < 40 && x < 140) {
    const k = 1 - trail / 4;
    r = r * (1 - k) + 0.93 * k;
    g = g * (1 - k) + 0.84 * k;
    b = b * (1 - k) + 0.62 * k;
  }
  const river = Math.abs(z - riverCenter(x));
  if (x > -20 && x < 100 && river < 5) {
    const k = 1 - river / 5;
    r = r * (1 - k) + 0.55 * k;
    g = g * (1 - k) + 0.62 * k;
    b = b * (1 - k) + 0.42 * k;
  }
  return [r, g, b];
}

/** Blank paper until the camp is nearby, or the First Spire has been climbed. */
export function sheetVisible(x: number, z: number, playerX: number, playerZ: number, spireReached: boolean) {
  if (Math.hypot(x, z - 6) < 28) return true;
  if (Math.hypot(x - playerX, z - playerZ) < 16) return true;
  return spireReached && x > SHEET.x0 && x < SHEET.x1 && z > SHEET.z0 && z < SHEET.z1;
}
