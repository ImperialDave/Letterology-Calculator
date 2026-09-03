/** Per-mission landmarks. Sim and terrain share this table. No three.js. */

export type LandmarkKind = "arch" | "ring" | "tower" | "highway" | "tanker" | "stack" | "pad" | "hangar" | "censer" | "gate" | "rock" | "slug" | "bank";

export interface Landmark {
  id: string;
  kind: LandmarkKind;
  x: number;
  z: number;
  /** Kind meaning: arch/gate/highway = height above ground. ring/censer/tanker = world Y of the hole center. */
  h: number;
  /** Kind meaning: arch/gate = inner half-width. ring/censer/tanker = inner radius. highway = deck half-span. */
  r: number;
  pay?: "arch" | "ring" | "tanker" | "gate";
}

/** Craft half-size used by hole law and landmark solids. */
export const CRAFT_R = 4;
/** Inner half-width a mandatory hole must clear (mesh, pay, and hurt). */
export const HOLE_INNER_X = 18;
export const HOLE_INNER_Y = 14;
export const HOLE_COMFORT_X = 22;
export const HOLE_COMFORT_Y = 16;
/** Gold / warp / censer torus major radius. Collect is RING_R + CRAFT_R. */
export const RING_R = 18;
export const RING_TUBE = 0.9;
export const RING_COLLECT = RING_R + CRAFT_R;
export const TANKER_LEN = 70;
export const ARCH_POST = 8;

export function stripPath(z0: number, z1: number, steps: number, sample: (u: number) => { x: number; y: number }): { x: number; y: number; z: number }[] {
  const out: { x: number; y: number; z: number }[] = [];
  for (let i = 0; i < steps; i++) {
    const u = i / (steps - 1);
    const p = sample(u);
    out.push({ x: p.x, y: p.y, z: z0 + (z1 - z0) * u });
  }
  return out;
}

/** Bright water ribbon down Coast — path and heightfield share this. */
export function riverX(z: number) {
  return Math.sin(z * 0.007) * 10;
}

export const COAST_PATH = stripPath(4000, 100, 22, (u) => {
  const z = 4000 + (100 - 4000) * u;
  const x = riverX(z);
  // Street height: above ground+6 even at full dip (path.y - 18 ≥ 8).
  if (u < 0.12) return { x, y: 28 };
  if (u < 0.28) return { x, y: 26 };
  if (u < 0.5) return { x, y: 26 };
  if (u < 0.78) return { x, y: 26 };
  return { x, y: 26 };
});

export const SLUG_PATH = stripPath(3200, 80, 16, (u) => ({
  x: Math.sin(u * 9) * 12,
  y: 36 + Math.sin(u * 14) * 6,
}));

export const GUTTER_PATH = stripPath(3000, 80, 16, (u) => ({
  x: u > 0.4 && u < 0.7 ? 0 : 8,
  y: 28 + (u > 0.5 ? 2 : 0),
}));

export const PRESS_PATH = stripPath(2800, 40, 14, (u) => ({
  x: 0,
  y: 32 + u * 8,
}));

/** Space belt: slight weave so the field isn't a tube. */
export const SORTS_PATH = stripPath(3800, 80, 20, (u) => ({
  x: Math.sin(u * 7) * 16,
  y: 48 + Math.sin(u * 11) * 10,
}));

/** Lerp the strip at a world z (paths run toward −Z). */
export function pointAtZ(pts: { x: number; y: number; z: number }[], z: number) {
  if (pts.length === 0) return { x: 0, y: 28, z };
  if (z >= pts[0].z) return { x: pts[0].x, y: pts[0].y, z };
  const last = pts[pts.length - 1];
  if (z <= last.z) return { x: last.x, y: last.y, z };
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    if ((a.z - z) * (b.z - z) > 0) continue;
    const span = b.z - a.z;
    const t = Math.abs(span) < 1e-6 ? 0 : (z - a.z) / span;
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z };
  }
  return { x: pts[0].x, y: pts[0].y, z };
}

function arches(z0: number, n: number, gap: number): Landmark[] {
  return Array.from({ length: n }, (_, i) => {
    const z = z0 - i * gap;
    return {
      id: `arch-${i}`,
      kind: "arch" as const,
      x: riverX(z),
      z,
      h: 42,
      r: HOLE_COMFORT_X,
      pay: "arch" as const,
    };
  });
}

function ringsAlong(path: { x: number; y: number; z: number }[], z0: number, n: number, gap: number, kind: "ring" | "censer"): Landmark[] {
  return Array.from({ length: n }, (_, i) => {
    const z = z0 - i * gap;
    const p = pointAtZ(path, z);
    return {
      id: `${kind}-${i}`,
      kind,
      x: kind === "censer" ? p.x + Math.sin(i * 1.7) * 8 : p.x,
      z,
      h: p.y,
      r: RING_R,
      pay: kind === "ring" ? ("ring" as const) : i % 2 === 0 ? ("gate" as const) : undefined,
    };
  });
}

export const LANDMARKS: Record<string, Landmark[]> = {
  coast: [
    { id: "bank-l", kind: "bank", x: -70, z: 3300, h: 42, r: 90 },
    { id: "bank-r", kind: "bank", x: 72, z: 3180, h: 40, r: 86 },
    ...Array.from({ length: 18 }, (_, i) => {
      const z = 2580 - i * 38;
      const side = i % 2 === 0 ? -1 : 1;
      const inset = 38 + (i % 5) * 9 + ((i * 13) % 7);
      return {
        id: `t${i}`,
        kind: "tower" as const,
        x: riverX(z) + side * inset,
        z,
        h: 18 + (i % 7) * 7 + (i === 8 ? 22 : 0),
        r: 10 + (i % 3) * 3,
      };
    }),
    { id: "hwy-a", kind: "highway", x: riverX(2280), z: 2280, h: 48, r: 70 },
    { id: "hwy-b", kind: "highway", x: riverX(2040), z: 2040, h: 48, r: 70 },
    ...arches(1680, 7, 110),
    { id: "fall", kind: "gate", x: riverX(720) - 22, z: 720, h: 36, r: HOLE_INNER_X, pay: "gate" },
    { id: "plaza", kind: "pad", x: 0, z: -160, h: 22, r: 90 },
  ],
  slug: [
    ...Array.from({ length: 18 }, (_, i) => ({
      id: `slug-${i}`,
      kind: "slug" as const,
      x: Math.cos(i * 0.7) * (70 + (i % 4) * 18),
      z: 2800 - i * 140,
      h: 14 + (i % 5) * 8,
      r: 16 + (i % 3) * 6,
    })),
    ...ringsAlong(SLUG_PATH, 1600, 7, 90, "ring"),
    { id: "bowl", kind: "pad", x: 0, z: -40, h: 8, r: 70 },
  ],
  gutter: [
    ...Array.from({ length: 8 }, (_, i) => ({
      id: `stack-${i}`,
      kind: "stack" as const,
      x: -90 + (i % 4) * 55,
      z: 2400 - Math.floor(i / 4) * 400,
      h: 70,
      r: 14,
    })),
    { id: "tanker", kind: "tanker", x: 0, z: 1400, h: 28, r: HOLE_INNER_X, pay: "tanker" },
    { id: "yard", kind: "pad", x: 0, z: -80, h: 10, r: 80 },
  ],
  ice: [
    { id: "pad", kind: "pad", x: 0, z: 0, h: 8, r: 70 },
    { id: "h1", kind: "hangar", x: -80, z: 40, h: 18, r: 28 },
    { id: "h2", kind: "hangar", x: 80, z: 40, h: 18, r: 28 },
    { id: "h3", kind: "hangar", x: 0, z: -90, h: 18, r: 28 },
  ],
  sorts: [],
  press: [
    ...ringsAlong(PRESS_PATH, 900, 5, 140, "censer"),
    { id: "crater", kind: "pad", x: 0, z: -40, h: 6, r: 110 },
  ],
  sky: [],
};

export function landmarksFor(missionId: string): Landmark[] {
  return LANDMARKS[missionId] ?? LANDMARKS.sky;
}

function mound(x: number, z: number, cx: number, cz: number, r: number, h: number) {
  const d = Math.hypot(x - cx, z - cz);
  if (d >= r) return 0;
  const t = 1 - (d / r) * (d / r);
  return h * t * t;
}

function n2(x: number, z: number) {
  return Math.sin(x * 0.041 + z * 0.029) * 4 + Math.sin(x * 0.09 - z * 0.07) * 2;
}

/** Extra height: river, beach, sloped canyon — not a box trench. */
export function landmarkHeight(missionId: string, x: number, z: number) {
  let h = 0;
  if (missionId === "coast" && z > 650 && z < 4050) {
    const rx = riverX(z);
    const d = Math.abs(x - rx);
    const n = n2(x, z);
    let land: number;
    if (d < 16) land = 0.7 + n * 0.08;
    else if (d < 34) land = 2.2 + (d - 16) * 0.55 + n * 0.15;
    else if (z > 3600) land = 2.4 + Math.max(0, d - 40) * 0.14 + n * 0.3;
    else if (z > 2780 && z < 3600) land = Math.min(48, 6 + Math.max(0, d - 20) * 1.05 + n);
    else if (z > 1880 && z < 2720) land = d > 58 ? 11 + (d - 58) * 0.38 + n * 0.4 : 6.2 + n * 0.25;
    else land = 7 + n * 0.5 + Math.max(0, d - 36) * 0.22;

    // Waterfall: bright fall on the left, a darker gorge you can dip into.
    if (z > 640 && z < 820) {
      const inLane = x < rx + 4 && x > rx - 40 && Math.abs(z - 720) < 24;
      const cliff = x < rx - 44 && Math.abs(z - 720) < 48;
      if (inLane) land = Math.min(land, 1.1);
      else if (cliff) land = Math.max(land, 32 + n * 0.35);
    }
    h = land;
  }
  if (missionId === "gutter" && z > 200 && z < 2800) {
    const n = n2(x, z);
    const shelf = Math.abs(x) < 88 ? 3.2 + n * 0.25 : 9 + Math.max(0, Math.abs(x) - 88) * 0.16 + n;
    h = Math.max(h, shelf);
  }
  if (missionId === "press" && z > 200 && z < 2400) {
    const n = n2(x, z);
    h = Math.max(h, 5 + (z / 2400) * 8 + Math.max(0, Math.abs(x) - 50) * 0.22 + n * 0.3);
  }
  for (const L of landmarksFor(missionId)) {
    if (L.kind === "bank" || L.kind === "pad" || L.kind === "slug" || L.kind === "rock") {
      if (missionId === "coast" && L.kind === "bank" && Math.abs(x - riverX(z)) < 30) continue;
      h = Math.max(h, mound(x, z, L.x, L.z, L.r * 1.4, L.h));
    }
  }
  return h;
}

function holeDepth(L: Landmark) {
  return Math.max(10, L.r * 0.45);
}

/** True when the craft is inside the authored opening. y0 is ground at the landmark. */
export function inHole(x: number, y: number, z: number, L: Landmark, y0 = 0) {
  if (!L.pay && L.kind !== "ring" && L.kind !== "censer") return false;
  if (L.pay === "tanker" || L.kind === "tanker") {
    const rad = Math.hypot(x - L.x, y - L.h);
    return rad < L.r * 0.85 && Math.abs(z - L.z) < 22;
  }
  if (L.kind === "ring" || L.kind === "censer") {
    return Math.hypot(x - L.x, y - L.h, z - L.z) < L.r + CRAFT_R;
  }
  return Math.abs(x - L.x) < L.r && Math.abs(z - L.z) < holeDepth(L) && y > y0 + 4 && y < y0 + L.h;
}

/** Solid of a pay-hole or highway deck. Caller skips this when `inHole` is true. */
export function inLandmarkSolid(x: number, y: number, z: number, L: Landmark, y0 = 0) {
  const dz = holeDepth(L);
  if (L.kind === "arch" || L.kind === "gate") {
    const post = L.r + ARCH_POST * 0.5;
    const inSpan = Math.abs(x - L.x) < post + ARCH_POST * 0.5 + CRAFT_R && Math.abs(z - L.z) < dz + 4;
    if (!inSpan) return false;
    const onPost = Math.abs(Math.abs(x - L.x) - post) < ARCH_POST * 0.5 + CRAFT_R && y < y0 + L.h + 6;
    const onCap = y > y0 + L.h - 2 && y < y0 + L.h + 10;
    return onPost || onCap;
  }
  if (L.kind === "tanker") {
    if (Math.abs(z - L.z) > TANKER_LEN * 0.5) return false;
    const rad = Math.hypot(x - L.x, y - L.h);
    return rad > L.r - 2 && rad < L.r + 4;
  }
  if (L.kind === "highway") {
    const deckY = y0 + L.h;
    return Math.abs(x - L.x) < L.r * 0.62 && Math.abs(z - L.z) < 10 && Math.abs(y - deckY) < 3 + CRAFT_R;
  }
  return false;
}
