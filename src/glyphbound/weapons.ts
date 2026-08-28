import type { LetterId } from "./types";
import { KITS } from "./roster";

export type MeleeFamily = "arc" | "smash" | "thrust" | "ember";

export interface WeaponPose {
  /** Grip in sprite space, 0–1. Rotation pivots here. */
  gripX: number;
  gripY: number;
  /** Mirror so the head sits forward (+X). */
  flipX: boolean;
  /** Extra rest rotation (radians). */
  rest: number;
  drawW: number;
  drawH: number;
}

export interface FlourishDef {
  name: string;
  time: number;
  cd: number;
  hitAt: number[];
  reach: number;
  height: number;
  dmg: number;
  bothSides?: boolean;
  ticks?: number;
  fx: string;
}

export interface WeaponDef {
  name: string;
  family: MeleeFamily;
  time: number;
  hitAt: number;
  reach: number;
  height: number;
  dmg: number;
  shotCost: number;
  pose: WeaponPose;
  flourish: FlourishDef;
}

const grip = (gripX: number, gripY: number, rest: number, drawW: number, drawH: number, flipX = false): WeaponPose => ({
  gripX,
  gripY,
  flipX,
  rest,
  drawW,
  drawH,
});

export const WEAPONS: Record<LetterId, WeaponDef> = {
  c: {
    name: "Crescent",
    family: "arc",
    time: 0.28,
    hitAt: 0.42,
    reach: 46,
    height: 34,
    dmg: 2,
    shotCost: 14,
    pose: grip(0.36, 0.52, -0.7, 44, 44),
    flourish: { name: "Orrery", time: 0.55, cd: 1.6, hitAt: [0.35, 0.62], reach: 52, height: 48, dmg: 2, bothSides: true, fx: "flourish-ring" },
  },
  s: {
    name: "Scythe",
    family: "arc",
    time: 0.22,
    hitAt: 0.38,
    reach: 54,
    height: 32,
    dmg: 2,
    shotCost: 12,
    pose: grip(0.18, 0.7, -0.2, 64, 56),
    flourish: { name: "Reap", time: 0.48, cd: 1.5, hitAt: [0.32, 0.58], reach: 72, height: 40, dmg: 2, fx: "flourish-reaper" },
  },
  b: {
    name: "Maul",
    family: "smash",
    time: 0.4,
    hitAt: 0.52,
    reach: 38,
    height: 40,
    dmg: 3,
    shotCost: 16,
    pose: grip(0.14, 0.52, -0.95, 58, 48),
    flourish: { name: "Quake", time: 0.62, cd: 2.1, hitAt: [0.52], reach: 56, height: 44, dmg: 4, fx: "flourish-slam" },
  },
  e: {
    name: "Trident",
    family: "thrust",
    time: 0.3,
    hitAt: 0.4,
    reach: 50,
    height: 28,
    dmg: 2,
    shotCost: 13,
    pose: grip(0.12, 0.5, -0.2, 64, 36),
    flourish: { name: "Tidefork", time: 0.5, cd: 1.7, hitAt: [0.28, 0.42, 0.56], reach: 64, height: 30, dmg: 2, ticks: 3, fx: "flourish-thrust" },
  },
  r: {
    name: "Brand",
    family: "ember",
    time: 0.2,
    hitAt: 0.36,
    reach: 44,
    height: 26,
    dmg: 2,
    shotCost: 15,
    pose: grip(0.18, 0.5, -0.35, 58, 28),
    flourish: { name: "Lunge", time: 0.42, cd: 1.55, hitAt: [0.34], reach: 70, height: 28, dmg: 3, fx: "flourish-ember" },
  },
  k: {
    name: "Mallet",
    family: "smash",
    time: 0.36,
    hitAt: 0.5,
    reach: 40,
    height: 38,
    dmg: 3,
    shotCost: 16,
    pose: grip(0.14, 0.52, -0.95, 56, 48),
    flourish: { name: "Crack", time: 0.58, cd: 2, hitAt: [0.5], reach: 52, height: 42, dmg: 4, fx: "flourish-slam" },
  },
  n: {
    name: "Pin",
    family: "thrust",
    time: 0.26,
    hitAt: 0.4,
    reach: 48,
    height: 22,
    dmg: 2,
    shotCost: 14,
    pose: grip(0.12, 0.5, -0.18, 64, 28),
    flourish: { name: "Bind", time: 0.46, cd: 1.8, hitAt: [0.4], reach: 78, height: 22, dmg: 2, fx: "flourish-thrust" },
  },
  t: {
    name: "Lance",
    family: "thrust",
    time: 0.32,
    hitAt: 0.44,
    reach: 52,
    height: 24,
    dmg: 2,
    shotCost: 11,
    pose: grip(0.1, 0.5, -0.15, 68, 28),
    flourish: { name: "Rule", time: 0.5, cd: 1.7, hitAt: [0.38], reach: 84, height: 24, dmg: 3, fx: "flourish-thrust" },
  },
};

export function weaponFor(letter: LetterId): WeaponDef {
  return WEAPONS[letter] ?? WEAPONS.c;
}

export function shotCostFor(letter: LetterId): number {
  return weaponFor(letter).shotCost;
}

export function meleePhase(attack: number, letter: LetterId): number {
  const t = weaponFor(letter).time;
  if (t <= 0 || attack <= 0) return 0;
  return Math.max(0, Math.min(1, 1 - attack / t));
}

export function flourishPhase(left: number, max: number): number {
  if (max <= 0 || left <= 0) return 0;
  return Math.max(0, Math.min(1, 1 - left / max));
}

export function meleeAngle(phase: number, family: MeleeFamily, idle: boolean, flourish = false): number {
  if (idle || phase <= 0) {
    if (family === "thrust") return -0.28;
    if (family === "smash") return -1.05;
    if (family === "ember") return -0.4;
    return -0.75;
  }
  if (flourish) {
    if (family === "arc") return -1.2 + phase * 6.4;
    if (family === "smash") return -1.7 + (phase < 0.5 ? 0 : (phase - 0.5) * 3.6);
    if (family === "ember") return -0.5 + phase * 0.9;
    return -0.25 + (phase < 0.45 ? -0.2 : 0.55);
  }
  if (family === "thrust") {
    if (phase < 0.35) return -0.45 - phase * 0.35;
    if (phase < 0.55) return -0.57 + ((phase - 0.35) / 0.2) * 0.9;
    return 0.33 - (phase - 0.55) * 0.4;
  }
  if (family === "smash") {
    if (phase < 0.45) return -1.2 - phase * 0.7;
    if (phase < 0.62) return -1.51 + ((phase - 0.45) / 0.17) * 2.4;
    return 0.89 - (phase - 0.62) * 0.5;
  }
  if (phase < 0.32) return -1.05 - phase * 0.5;
  if (phase < 0.5) return -1.21 + ((phase - 0.32) / 0.18) * 2.15;
  return 0.94 - (phase - 0.5) * 0.55;
}

export function meleeGlow(letter: LetterId): string {
  return (KITS[letter] ?? KITS.c).glow;
}
