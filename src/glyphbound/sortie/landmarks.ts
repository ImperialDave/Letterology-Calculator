/** Per-mission landmarks. Sim and terrain share this table. No three.js. */

export type LandmarkKind = "arch" | "ring" | "tower" | "highway" | "tanker" | "stack" | "pad" | "hangar" | "censer" | "gate" | "rock" | "slug" | "bank";

export interface Landmark {
  id: string;
  kind: LandmarkKind;
  x: number;
  z: number;
  h: number;
  r: number;
  pay?: "arch" | "ring" | "tanker" | "gate";
}

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
  if (u < 0.12) return { x, y: 42 };
  if (u < 0.28) return { x, y: 36 };
  if (u < 0.5) return { x, y: 48 };
  if (u < 0.78) return { x, y: 40 };
  return { x, y: 52 };
});

export const SLUG_PATH = stripPath(3200, 80, 16, (u) => ({
  x: Math.sin(u * 9) * 28,
  y: 48 + Math.sin(u * 14) * 16,
}));

export const GUTTER_PATH = stripPath(3000, 80, 16, (u) => ({
  x: u > 0.4 && u < 0.7 ? -12 : 8,
  y: 36 + (u > 0.5 ? 8 : 0),
}));

export const PRESS_PATH = stripPath(2800, 40, 14, (u) => ({
  x: 0,
  y: 44 + u * 22,
}));

function arches(z0: number, n: number, gap: number): Landmark[] {
  return Array.from({ length: n }, (_, i) => {
    const z = z0 - i * gap;
    return {
      id: `arch-${i}`,
      kind: "arch" as const,
      x: riverX(z),
      z,
      h: 28,
      r: 16,
      pay: "arch" as const,
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
    { id: "hwy-a", kind: "highway", x: riverX(2280), z: 2280, h: 18, r: 70 },
    { id: "hwy-b", kind: "highway", x: riverX(2040), z: 2040, h: 18, r: 70 },
    ...arches(1680, 7, 110),
    { id: "fall", kind: "gate", x: riverX(720) - 36, z: 720, h: 40, r: 18, pay: "gate" },
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
    ...Array.from({ length: 7 }, (_, i) => ({
      id: `ring-${i}`,
      kind: "ring" as const,
      x: Math.sin(i * 0.4) * 12,
      z: 1600 - i * 90,
      h: 48,
      r: 10,
      pay: "ring" as const,
    })),
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
    { id: "tanker", kind: "tanker", x: 0, z: 1400, h: 16, r: 48, pay: "tanker" },
    { id: "yard", kind: "pad", x: 0, z: -80, h: 10, r: 80 },
  ],
  ice: [
    { id: "pad", kind: "pad", x: 0, z: 0, h: 8, r: 70 },
    { id: "h1", kind: "hangar", x: -80, z: 40, h: 18, r: 28 },
    { id: "h2", kind: "hangar", x: 80, z: 40, h: 18, r: 28 },
    { id: "h3", kind: "hangar", x: 0, z: -90, h: 18, r: 28 },
  ],
  press: [
    ...Array.from({ length: 5 }, (_, i) => ({
      id: `cen-${i}`,
      kind: "censer" as const,
      x: Math.cos((i / 5) * Math.PI * 2) * 70,
      z: 900 - i * 140,
      h: 36,
      r: 12,
      pay: i % 2 === 0 ? ("gate" as const) : undefined,
    })),
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
      const inLane = x < rx - 10 && x > rx - 64 && Math.abs(z - 720) < 18;
      const cliff = x < rx - 48 && Math.abs(z - 720) < 48;
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
