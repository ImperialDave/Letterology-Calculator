/** Per-mission landmarks. Sim and terrain share this table. No three.js. */

export type LandmarkKind =
  | "arch"
  | "ring"
  | "tower"
  | "highway"
  | "tanker"
  | "stack"
  | "pad"
  | "hangar"
  | "censer"
  | "gate"
  | "rock"
  | "slug"
  | "bank"
  | "tunnel"
  | "drawer"
  | "crusher"
  | "colonnade"
  | "aqueduct"
  | "letter"
  | "case"
  | "quoin"
  | "drum"
  | "iceberg"
  | "wreck"
  | "statue"
  | "piston"
  | "deck"
  | "fall";

export type PayKind = "arch" | "ring" | "tanker" | "gate" | "drawer" | "tunnel";

export interface Landmark {
  id: string;
  kind: LandmarkKind;
  x: number;
  z: number;
  /** Kind meaning: arch/gate/highway = height above ground. ring/censer/tanker = world Y of the hole center. */
  h: number;
  /** Kind meaning: arch/gate = inner half-width. ring/censer/tanker = inner radius. highway = deck half-span. */
  r: number;
  pay?: PayKind;
  variant?: string;
  yaw?: number;
  socket?: { kind: "turret" | "emerge"; dy: number };
  move?: { type: "crush" | "slide" | "spin"; period: number; amp: number };
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
    { id: "mouth", kind: "bank", x: -70, z: 3300, h: 42, r: 90 },
    { id: "mouth-r", kind: "bank", x: 72, z: 3180, h: 40, r: 86 },
    { id: "first-tooth", kind: "colonnade", x: riverX(2920), z: 2920, h: 36, r: HOLE_COMFORT_X, pay: "gate" },
    { id: "canyon-teeth", kind: "colonnade", x: riverX(2720), z: 2720, h: 38, r: HOLE_COMFORT_X, pay: "gate", socket: { kind: "turret", dy: 0 } },
    { id: "ink-aqueduct", kind: "aqueduct", x: riverX(2520), z: 2520, h: 40, r: HOLE_COMFORT_X, pay: "gate" },
    { id: "ruin-bank", kind: "wreck", x: riverX(2420) - 28, z: 2420, h: 16, r: 22, variant: "barge" },
    { id: "n-street", kind: "case", x: riverX(2340), z: 2340, h: 34, r: HOLE_COMFORT_X, pay: "drawer", socket: { kind: "turret", dy: 8 } },
    { id: "type-row-l", kind: "tower", x: riverX(2300) - 42, z: 2300, h: 28, r: 12, variant: "ruin" },
    { id: "type-row-r", kind: "tower", x: riverX(2260) + 48, z: 2260, h: 32, r: 11, variant: "tall" },
    { id: "hwy-a", kind: "highway", x: riverX(2280), z: 2280, h: 48, r: 70, variant: "broken" },
    { id: "c-block", kind: "letter", x: riverX(2140), z: 2140, h: 40, r: HOLE_COMFORT_X, pay: "gate", variant: "c" },
    { id: "hwy-b", kind: "highway", x: riverX(2040), z: 2040, h: 48, r: 70 },
    { id: "e-block", kind: "letter", x: riverX(1940), z: 1940, h: 40, r: HOLE_COMFORT_X, pay: "gate", variant: "e" },
    { id: "hwy-c", kind: "highway", x: riverX(1860), z: 1860, h: 48, r: 70 },
    { id: "drawer-1", kind: "drawer", x: riverX(1760), z: 1760, h: 30, r: HOLE_COMFORT_X, pay: "drawer" },
    ...Array.from({ length: 7 }, (_, i) => {
      const z = 1680 - i * 110;
      return {
        id: `seven-n-${i}`,
        kind: "letter" as const,
        variant: "n",
        x: riverX(z),
        z,
        h: 42,
        r: HOLE_COMFORT_X,
        pay: "arch" as const,
        socket: i === 2 ? { kind: "turret" as const, dy: 0 } : undefined,
      };
    }),
    { id: "fall", kind: "gate", x: riverX(720) - 22, z: 720, h: 36, r: HOLE_INNER_X, pay: "gate" },
    { id: "lintel-fall", kind: "fall", x: riverX(720) - 8, z: 708, h: 34, r: 16 },
    { id: "statue-c", kind: "statue", x: 18, z: 40, h: 22, r: 10 },
    { id: "plaza", kind: "pad", x: 0, z: -160, h: 22, r: 90 },
  ],
  slug: [
    ...Array.from({ length: 12 }, (_, i) => ({
      id: `lead-dune-${i}`,
      kind: "slug" as const,
      variant: i % 3 === 0 ? "long" : i % 3 === 1 ? "fat" : "stacked",
      x: Math.cos(i * 0.7) * (70 + (i % 4) * 18),
      z: 2800 - i * 180,
      h: 14 + (i % 5) * 8,
      r: 16 + (i % 3) * 6,
    })),
    { id: "melt-tunnel", kind: "tunnel", x: pointAtZ(SLUG_PATH, 2200).x, z: 2200, h: pointAtZ(SLUG_PATH, 2200).y, r: HOLE_INNER_X, pay: "tunnel" },
    { id: "type-wreck", kind: "wreck", x: 40, z: 1900, h: 12, r: 18, variant: "cwing" },
    { id: "colonnade-lead", kind: "colonnade", x: pointAtZ(SLUG_PATH, 1200).x, z: 1200, h: 48, r: HOLE_COMFORT_X, pay: "gate" },
    ...ringsAlong(SLUG_PATH, 1600, 7, 90, "ring"),
    { id: "bowl-lip", kind: "pad", x: 0, z: -40, h: 8, r: 70 },
  ],
  gutter: [
    ...Array.from({ length: 8 }, (_, i) => ({
      id: `stack-${i}`,
      kind: "stack" as const,
      variant: i % 2 === 0 ? "tall" : "wide",
      x: -90 + (i % 4) * 55,
      z: 2400 - Math.floor(i / 4) * 400,
      h: 70 + (i % 3) * 8,
      r: 14,
    })),
    { id: "ink-fall", kind: "fall", x: -40, z: 2000, h: 36, r: 18 },
    { id: "pipe-colonnade", kind: "colonnade", x: 0, z: 1700, h: 34, r: HOLE_COMFORT_X, pay: "gate" },
    { id: "tanker", kind: "tanker", x: 0, z: 1400, h: 28, r: HOLE_INNER_X, pay: "tanker" },
    { id: "drawer-ink", kind: "drawer", x: 0, z: 1100, h: 28, r: HOLE_COMFORT_X, pay: "drawer" },
    { id: "tanker-b", kind: "tanker", x: 8, z: 880, h: 30, r: HOLE_INNER_X, pay: "tanker" },
    { id: "crusher-quoin", kind: "crusher", x: 0, z: 500, h: 32, r: HOLE_COMFORT_X, pay: "gate" },
    { id: "yard", kind: "pad", x: 0, z: -80, h: 10, r: 80 },
  ],
  ice: [
    { id: "hold-pad", kind: "pad", x: 0, z: 0, h: 8, r: 70 },
    { id: "hangar-n", kind: "hangar", x: -80, z: 40, h: 18, r: 28, variant: "n" },
    { id: "hangar-c", kind: "hangar", x: 80, z: 40, h: 18, r: 28, variant: "c" },
    { id: "hangar-e", kind: "hangar", x: 0, z: -90, h: 18, r: 28, variant: "e" },
    { id: "iceberg-n", kind: "iceberg", x: -140, z: 90, h: 22, r: 28 },
    { id: "iceberg-cave", kind: "iceberg", x: 130, z: -70, h: 24, r: HOLE_INNER_X, pay: "tunnel" },
    { id: "frozen-case", kind: "case", x: -40, z: 120, h: 20, r: 16, variant: "ice" },
    { id: "statue-serif", kind: "statue", x: 50, z: 110, h: 18, r: 10 },
    { id: "wreck-quad", kind: "wreck", x: 90, z: -40, h: 10, r: 14 },
    { id: "lamp-ring", kind: "censer", x: 0, z: 60, h: 22, r: RING_R },
  ],
  sorts: [
    { id: "first-hoop", kind: "rock", x: pointAtZ(SORTS_PATH, 3400).x, z: 3400, h: pointAtZ(SORTS_PATH, 3400).y, r: HOLE_INNER_X, pay: "gate" },
    { id: "sort-drawer", kind: "drawer", x: pointAtZ(SORTS_PATH, 3100).x, z: 3100, h: 64, r: HOLE_COMFORT_X, pay: "drawer" },
    { id: "crusher-a", kind: "crusher", x: pointAtZ(SORTS_PATH, 2800).x, z: 2800, h: 64, r: HOLE_COMFORT_X, pay: "gate" },
    { id: "crusher-b", kind: "crusher", x: pointAtZ(SORTS_PATH, 2500).x, z: 2500, h: 64, r: HOLE_COMFORT_X, pay: "gate" },
    { id: "drum-1", kind: "drum", x: pointAtZ(SORTS_PATH, 2300).x, z: 2300, h: pointAtZ(SORTS_PATH, 2300).y, r: RING_R },
    ...Array.from({ length: 5 }, (_, i) => {
      const z = 3020 - i * 380;
      const p = pointAtZ(SORTS_PATH, z);
      return {
        id: `hoop-${i}`,
        kind: "rock" as const,
        x: p.x,
        z,
        h: p.y,
        r: HOLE_INNER_X,
        pay: "gate" as const,
      };
    }),
    { id: "quoin-gate", kind: "quoin", x: pointAtZ(SORTS_PATH, 900).x, z: 900, h: 64, r: HOLE_COMFORT_X, pay: "gate" },
    { id: "filed-letter", kind: "wreck", x: 70, z: 600, h: 16, r: 20, variant: "eight" },
    ...Array.from({ length: 7 }, (_, i) => {
      const z = 2100 - i * 170;
      const p = pointAtZ(SORTS_PATH, z);
      return {
        id: `ring-${i}`,
        kind: "ring" as const,
        x: p.x + (i % 2 === 0 ? -22 : 22),
        z,
        h: p.y,
        r: RING_R,
        pay: "ring" as const,
      };
    }),
  ],
  press: [
    { id: "crater-mouth", kind: "wreck", x: -30, z: 2400, h: 16, r: 24, variant: "ruin" },
    { id: "colonnade-ash", kind: "colonnade", x: 0, z: 1800, h: 34, r: HOLE_COMFORT_X, pay: "gate" },
    { id: "piston-a", kind: "piston", x: -28, z: 1400, h: 36, r: 10 },
    { id: "piston-b", kind: "piston", x: 28, z: 1100, h: 40, r: 10 },
    ...ringsAlong(PRESS_PATH, 900, 5, 140, "censer"),
    { id: "press-tunnel", kind: "tunnel", x: pointAtZ(PRESS_PATH, 400).x, z: 400, h: pointAtZ(PRESS_PATH, 400).y, r: HOLE_INNER_X, pay: "tunnel" },
    { id: "bar-approach", kind: "statue", x: 16, z: 80, h: 20, r: 10 },
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
    if (
      L.kind === "bank" ||
      L.kind === "pad" ||
      L.kind === "slug" ||
      L.kind === "iceberg" ||
      L.kind === "wreck" ||
      (L.kind === "rock" && !L.pay)
    ) {
      if (missionId === "coast" && L.kind === "bank" && Math.abs(x - riverX(z)) < 30) continue;
      h = Math.max(h, mound(x, z, L.x, L.z, L.r * 1.4, L.h));
    }
  }
  return h;
}

function holeDepth(L: Landmark) {
  return Math.max(10, L.r * 0.45);
}

function tubeLen(L: Landmark) {
  return Math.max(22, L.r * 1.15);
}

function aisle(x: number, y: number, z: number, L: Landmark, y0: number, halfZ?: number) {
  const dz = halfZ ?? holeDepth(L);
  return Math.abs(x - L.x) < L.r && Math.abs(z - L.z) < dz && y > y0 + 4 && y < y0 + L.h;
}

/** True when the craft is inside the authored opening. y0 is ground at the landmark. */
export function inHole(x: number, y: number, z: number, L: Landmark, y0 = 0) {
  if (L.kind === "tunnel") {
    return Math.hypot(x - L.x, y - L.h) < L.r * 0.85 && Math.abs(z - L.z) < tubeLen(L) * 0.5;
  }
  if (L.kind === "drawer") {
    return aisle(x, y, z, L, y0, 16);
  }
  if (L.kind === "drum") {
    return Math.hypot(x - L.x, y - L.h) < L.r * 0.82 && Math.abs(z - L.z) < 12;
  }
  if (L.kind === "iceberg" && L.pay) {
    return aisle(x, y, z, L, y0, 14);
  }
  if (!L.pay && L.kind !== "ring" && L.kind !== "censer") return false;
  if (L.pay === "tanker" || L.kind === "tanker") {
    const rad = Math.hypot(x - L.x, y - L.h);
    return rad < L.r * 0.85 && Math.abs(z - L.z) < 22;
  }
  if (L.kind === "ring" || L.kind === "censer") {
    return Math.hypot(x - L.x, y - L.h, z - L.z) < L.r + CRAFT_R;
  }
  if (L.kind === "rock" && L.pay) {
    return Math.hypot(x - L.x, y - L.h) < L.r && Math.abs(z - L.z) < 12;
  }
  return aisle(x, y, z, L, y0);
}

/** Solid of a pay-hole or highway deck. Caller skips this when `inHole` is true. */
export function inLandmarkSolid(x: number, y: number, z: number, L: Landmark, y0 = 0) {
  const dz = holeDepth(L);
  if (L.kind === "arch" || L.kind === "gate" || L.kind === "letter" || L.kind === "aqueduct" || L.kind === "fall") {
    const post = L.r + ARCH_POST * 0.5;
    const inSpan = Math.abs(x - L.x) < post + ARCH_POST * 0.5 + CRAFT_R && Math.abs(z - L.z) < dz + 4;
    if (!inSpan) return false;
    const onPost = Math.abs(Math.abs(x - L.x) - post) < ARCH_POST * 0.5 + CRAFT_R && y < y0 + L.h + 6;
    const onCap = y > y0 + L.h - 2 && y < y0 + L.h + 10;
    if (L.kind === "aqueduct") {
      const onDeck = Math.abs(y - (y0 + L.h)) < 3 + CRAFT_R && Math.abs(x - L.x) < L.r + 16;
      return onPost || onCap || onDeck;
    }
    return onPost || onCap;
  }
  if (L.kind === "tanker" || L.kind === "tunnel") {
    const len = L.kind === "tunnel" ? tubeLen(L) * 0.5 : TANKER_LEN * 0.5;
    if (Math.abs(z - L.z) > len) return false;
    const rad = Math.hypot(x - L.x, y - L.h);
    return rad > L.r - 2 && rad < L.r + 4;
  }
  if (L.kind === "highway" || L.kind === "deck") {
    const deckY = y0 + L.h;
    return Math.abs(x - L.x) < L.r * 0.62 && Math.abs(z - L.z) < 10 && Math.abs(y - deckY) < 3 + CRAFT_R;
  }
  if (L.kind === "rock" && L.pay) {
    if (Math.abs(z - L.z) > 10) return false;
    const rad = Math.hypot(x - L.x, y - L.h);
    return rad > L.r - 2 && rad < L.r + 8;
  }
  if (L.kind === "drawer" || L.kind === "case") {
    if (Math.abs(z - L.z) > 18 || y < y0 + 2 || y > y0 + L.h + 8) return false;
    const wall = Math.abs(Math.abs(x - L.x) - (L.r + 6)) < 5;
    const lip = y > y0 + L.h - 2 && Math.abs(x - L.x) < L.r + 10;
    return wall || lip;
  }
  if (L.kind === "crusher" || L.kind === "colonnade" || L.kind === "quoin") {
    const post = L.r + 8;
    if (Math.abs(z - L.z) > dz + 4) return false;
    return Math.abs(Math.abs(x - L.x) - post) < 7 && y < y0 + L.h + 4;
  }
  if (L.kind === "drum") {
    if (Math.abs(z - L.z) > 10) return false;
    const rad = Math.hypot(x - L.x, y - L.h);
    return rad > L.r - 2 && rad < L.r + 7;
  }
  if (L.kind === "statue") {
    return Math.hypot(x - L.x, z - L.z) < L.r * 0.45 && y < y0 + L.h && y > y0;
  }
  if (L.kind === "piston") {
    return Math.hypot(x - L.x, z - L.z) < L.r * 0.55 && y < y0 + L.h && y > y0;
  }
  return false;
}
