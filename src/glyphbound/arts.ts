import type { LetterId } from "./types";
import { isAerial, type MeleeMoveId } from "./melee";

export const HEAT_MAX = 100;
export const HEAT_SMASH_COST = 50;
export const CASE_ART_COST = 100;
export const HEAT_PER_DMG = 9;
export const HEAT_DECAY = 12;
export const HEAT_IDLE = 1.8;
export const STRING_FINISH_HEAT = 18;

export interface ArtHit {
  at: number;
  dmg: number;
  reach: number;
  height: number;
  bothSides?: boolean;
  kbX: number;
  kbY: number;
  stun: number;
  spike?: boolean;
  ox?: number;
  oy?: number;
}

export interface SuperDef {
  name: string;
  time: number;
  cost: number;
  hitAt: ArtHit[];
  selfVx?: number;
  selfVy?: number;
  fx: string;
  fxBehind?: boolean;
  camera: boolean;
  letterbox: boolean;
  pull?: number;
}

const hit = (at: number, dmg: number, extra: Partial<ArtHit> = {}): ArtHit => ({
  at,
  dmg,
  reach: extra.reach ?? 64,
  height: extra.height ?? 40,
  kbX: extra.kbX ?? 80,
  kbY: extra.kbY ?? -70,
  stun: extra.stun ?? 0.7,
  bothSides: extra.bothSides,
  spike: extra.spike,
  ox: extra.ox,
  oy: extra.oy,
});

export const STRINGS: Record<LetterId, MeleeMoveId[]> = {
  c: ["jab1", "jab2", "ftilt"],
  s: ["jab1", "dash", "fair"],
  b: ["dtilt", "utilt", "uair"],
  e: ["ftilt", "ftilt", "ftilt"],
  r: ["dash", "ftilt", "dash"],
  k: ["utilt", "uair", "dair"],
  n: ["dtilt", "ftilt", "jab3"],
  t: ["ftilt", "dash", "fair"],
};

export const FINISHERS: Record<LetterId, SuperDef> = {
  c: { name: "Orrery Break", time: 0.42, cost: 0, camera: false, letterbox: false, fx: "flourish-ring", fxBehind: true, hitAt: [hit(0.4, 5, { bothSides: true, reach: 56, height: 48, kbX: 160, kbY: -90 })] },
  s: { name: "Harvest", time: 0.44, cost: 0, camera: false, letterbox: false, fx: "flourish-reaper", pull: 90, hitAt: [hit(0.38, 6, { bothSides: true, reach: 72, height: 40, kbX: 40, kbY: -110 })] },
  b: { name: "Drop", time: 0.48, cost: 0, camera: false, letterbox: false, fx: "flourish-slam", selfVy: -40, hitAt: [hit(0.48, 6, { spike: true, reach: 52, height: 36, oy: 16, kbX: 40, kbY: 180, stun: 0.9 })] },
  e: { name: "Tide", time: 0.52, cost: 0, camera: false, letterbox: false, fx: "flourish-thrust", hitAt: [hit(0.28, 2, { reach: 64, height: 28 }), hit(0.42, 2, { reach: 64, height: 28 }), hit(0.58, 3, { reach: 70, height: 30, kbX: 150, kbY: -80 })] },
  r: { name: "Brand Through", time: 0.4, cost: 0, camera: false, letterbox: false, fx: "flourish-ember", selfVx: 380, hitAt: [hit(0.34, 5, { reach: 70, height: 28, kbX: 200, kbY: -50 })] },
  k: { name: "Keystroke", time: 0.46, cost: 0, camera: false, letterbox: false, fx: "flourish-slam", hitAt: [hit(0.46, 6, { spike: true, reach: 48, height: 52, oy: -10, kbX: 20, kbY: 160, stun: 1.1 })] },
  n: { name: "Bind", time: 0.4, cost: 0, camera: false, letterbox: false, fx: "flourish-thrust", hitAt: [hit(0.4, 4, { reach: 78, height: 22, kbX: 30, kbY: -20, stun: 1.4 })] },
  t: { name: "Full Point", time: 0.42, cost: 0, camera: false, letterbox: false, fx: "flourish-thrust", selfVx: 120, hitAt: [hit(0.4, 6, { reach: 88, height: 24, kbX: 220, kbY: -40 })] },
};

export const HEAT_SMASH: Record<LetterId, SuperDef> = {
  c: { name: "Orrery Drive", time: 0.72, cost: 50, camera: true, letterbox: false, fx: "heat-c", fxBehind: true, selfVx: 280, hitAt: [hit(0.28, 4, { reach: 52 }), hit(0.58, 5, { bothSides: true, reach: 60, height: 48, kbX: 180, kbY: -100 })] },
  s: { name: "Low Reap", time: 0.7, cost: 50, camera: true, letterbox: false, fx: "heat-s", selfVx: 160, hitAt: [hit(0.36, 10, { bothSides: true, reach: 74, height: 36, kbX: 80, kbY: -120 })] },
  b: { name: "Cap Slam", time: 0.8, cost: 50, camera: true, letterbox: false, fx: "heat-b", selfVy: -200, hitAt: [hit(0.55, 11, { spike: true, reach: 58, height: 40, oy: 12, kbX: 50, kbY: 140 })] },
  e: { name: "Trident Rush", time: 0.76, cost: 50, camera: true, letterbox: false, fx: "heat-e", hitAt: [hit(0.28, 3, { reach: 58, height: 26 }), hit(0.46, 3, { reach: 62 }), hit(0.64, 4, { reach: 68, kbX: 160, kbY: -70 })] },
  r: { name: "Ember Pass", time: 0.68, cost: 50, camera: true, letterbox: false, fx: "heat-r", selfVx: 420, hitAt: [hit(0.32, 9, { reach: 76, height: 28, kbX: 210, kbY: -40 })] },
  k: { name: "Head Stamp", time: 0.78, cost: 50, camera: true, letterbox: false, fx: "heat-k", selfVy: -180, hitAt: [hit(0.5, 10, { reach: 44, height: 56, oy: -16, kbX: 30, kbY: -200 })] },
  n: { name: "Needle", time: 0.66, cost: 50, camera: true, letterbox: false, fx: "heat-n", hitAt: [hit(0.4, 8, { reach: 86, height: 20, kbX: 140, kbY: -30, stun: 1.1 })] },
  t: { name: "Rule Charge", time: 0.74, cost: 50, camera: true, letterbox: false, fx: "heat-t", selfVx: 360, hitAt: [hit(0.42, 11, { reach: 90, height: 24, kbX: 240, kbY: -50 })] },
};

export const CASE_ART: Record<LetterId, SuperDef> = {
  c: { name: "Case of the Crescent", time: 1.5, cost: 100, camera: true, letterbox: true, fx: "art-c", fxBehind: true, hitAt: [hit(0.28, 6, { bothSides: true, reach: 70, height: 52 }), hit(0.52, 6, { bothSides: true, reach: 80, height: 56 }), hit(0.78, 8, { bothSides: true, reach: 90, height: 60, kbX: 220, kbY: -140 })] },
  s: { name: "Harvest Moon", time: 1.55, cost: 100, camera: true, letterbox: true, fx: "art-s", hitAt: [hit(0.3, 5, { bothSides: true, reach: 80, height: 44 }), hit(0.52, 7, { bothSides: true, reach: 88, height: 48 }), hit(0.78, 8, { bothSides: true, reach: 96, height: 52, kbX: 60, kbY: -220 })] },
  b: { name: "Drop Cap", time: 1.6, cost: 100, camera: true, letterbox: true, fx: "art-b", selfVy: -240, hitAt: [hit(0.42, 10, { reach: 64, height: 48 }), hit(0.78, 12, { spike: true, reach: 72, height: 44, oy: 18, kbX: 40, kbY: 200 })] },
  e: { name: "Tidefork", time: 1.58, cost: 100, camera: true, letterbox: true, fx: "art-e", fxBehind: true, hitAt: [hit(0.26, 4, { reach: 70, height: 80, oy: -20 }), hit(0.44, 4, { reach: 70, height: 80, oy: -20 }), hit(0.62, 4, { reach: 74, height: 84, oy: -22 }), hit(0.82, 8, { reach: 80, height: 88, oy: -24, kbX: 160, kbY: -160 })] },
  r: { name: "Red Letter", time: 1.45, cost: 100, camera: true, letterbox: true, fx: "art-r", selfVx: 200, hitAt: [hit(0.34, 8, { reach: 200, height: 36 }), hit(0.7, 12, { reach: 240, height: 40, kbX: 260, kbY: -80 })] },
  k: { name: "Keystroke", time: 1.62, cost: 100, camera: true, letterbox: true, fx: "art-k", hitAt: [hit(0.36, 8, { bothSides: true, reach: 50, height: 70, oy: -20, stun: 1.2 }), hit(0.78, 14, { spike: true, reach: 56, height: 80, oy: -24, kbX: 20, kbY: 180 })] },
  n: { name: "Needlepoint", time: 1.48, cost: 100, camera: true, letterbox: true, fx: "art-n", hitAt: [hit(0.32, 6, { reach: 90, height: 22, stun: 1.3 }), hit(0.76, 14, { reach: 48, height: 48, kbX: 180, kbY: -90 })] },
  t: { name: "Full Stop", time: 1.52, cost: 100, camera: true, letterbox: true, fx: "art-t", selfVx: 280, hitAt: [hit(0.3, 7, { reach: 96, height: 26 }), hit(0.72, 13, { reach: 120, height: 28, kbX: 280, kbY: -70 })] },
};

export function stringRoute(letter: LetterId): MeleeMoveId[] {
  return STRINGS[letter] ?? STRINGS.c;
}

export function stringNext(letter: LetterId, step: number): MeleeMoveId | "finisher" | null {
  const route = stringRoute(letter);
  if (step < 0) return null;
  if (step < route.length) return route[step] ?? null;
  if (step === route.length) return "finisher";
  return null;
}

export function stringCanFire(id: MeleeMoveId, grounded: boolean) {
  if (isAerial(id)) return !grounded;
  if (id === "dash") return true;
  return grounded;
}

export function artDamage(def: SuperDef, capital = false) {
  const sum = def.hitAt.reduce((n, h) => n + h.dmg, 0);
  return sum + (capital ? 2 : 0);
}

export function heatFromDamage(dmg: number) {
  return Math.max(0, Math.floor(dmg * HEAT_PER_DMG));
}
