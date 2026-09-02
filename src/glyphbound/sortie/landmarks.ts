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

export const COAST_PATH = stripPath(4000, 100, 22, (u) => {
  if (u < 0.12) return { x: 0, y: 42 };
  if (u < 0.28) return { x: Math.sin(u * 28) * 10, y: 34 };
  if (u < 0.5) return { x: 6, y: 50 };
  if (u < 0.78) return { x: 0, y: 40 };
  return { x: 0, y: 52 };
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
  return Array.from({ length: n }, (_, i) => ({
    id: `arch-${i}`,
    kind: "arch" as const,
    x: 0,
    z: z0 - i * gap,
    h: 28,
    r: 16,
    pay: "arch" as const,
  }));
}

export const LANDMARKS: Record<string, Landmark[]> = {
  coast: [
    { id: "bank-l", kind: "bank", x: -70, z: 3300, h: 42, r: 90 },
    { id: "bank-r", kind: "bank", x: 72, z: 3180, h: 40, r: 86 },
    ...Array.from({ length: 24 }, (_, i) => ({
      id: `t${i}`,
      kind: "tower" as const,
      x: ((i % 2) * 2 - 1) * (48 + (i % 3) * 10),
      z: 2600 - Math.floor(i / 2) * 36,
      h: 22 + (i % 5) * 10,
      r: 12,
    })),
    { id: "hwy-a", kind: "highway", x: 0, z: 2280, h: 18, r: 70 },
    { id: "hwy-b", kind: "highway", x: 0, z: 2040, h: 18, r: 70 },
    ...arches(1680, 7, 110),
    { id: "fall", kind: "gate", x: 0, z: 720, h: 36, r: 18, pay: "gate" },
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

/** Extra height from landmarks so the strip has canyon walls and plazas. */
export function landmarkHeight(missionId: string, x: number, z: number) {
  let h = 0;
  for (const L of landmarksFor(missionId)) {
    if (L.kind === "bank" || L.kind === "pad" || L.kind === "slug" || L.kind === "rock") {
      h = Math.max(h, mound(x, z, L.x, L.z, L.r * 1.4, L.h));
    }
    if (L.kind === "arch" || L.kind === "gate") {
      const along = Math.abs(z - L.z) < 10 && Math.abs(x) > 12 && Math.abs(x) < 28;
      if (along) h = Math.max(h, L.h * 0.85);
    }
    if (missionId === "coast" && z > 2800 && z < 3600 && Math.abs(x) > 42) {
      h = Math.max(h, 38);
    }
    if (missionId === "coast" && z > 1900 && z < 2700 && Math.abs(x) > 70) {
      h = Math.max(h, 16);
    }
  }
  return h;
}
