import type { LetterId } from "./types";
import { KITS } from "./roster";

export type MeleeFamily = "arc" | "smash" | "thrust" | "ember";

export interface WeaponDef {
  name: string;
  family: MeleeFamily;
  /** Seconds for a full swing. */
  time: number;
  /** Fraction of the swing when the hit connects. */
  hitAt: number;
  reach: number;
  height: number;
  dmg: number;
  /** Ink spent per fang shot. */
  shotCost: number;
}

export const WEAPONS: Record<LetterId, WeaponDef> = {
  c: { name: "Crescent", family: "arc", time: 0.28, hitAt: 0.42, reach: 46, height: 34, dmg: 2, shotCost: 14 },
  s: { name: "Scythe", family: "arc", time: 0.22, hitAt: 0.38, reach: 54, height: 32, dmg: 2, shotCost: 12 },
  b: { name: "Maul", family: "smash", time: 0.4, hitAt: 0.52, reach: 38, height: 40, dmg: 3, shotCost: 16 },
  e: { name: "Trident", family: "thrust", time: 0.3, hitAt: 0.4, reach: 50, height: 28, dmg: 2, shotCost: 13 },
  r: { name: "Brand", family: "ember", time: 0.2, hitAt: 0.36, reach: 44, height: 26, dmg: 2, shotCost: 15 },
  k: { name: "Mallet", family: "smash", time: 0.36, hitAt: 0.5, reach: 40, height: 38, dmg: 3, shotCost: 16 },
  n: { name: "Pin", family: "thrust", time: 0.26, hitAt: 0.4, reach: 48, height: 22, dmg: 2, shotCost: 14 },
  t: { name: "Lance", family: "thrust", time: 0.32, hitAt: 0.44, reach: 52, height: 24, dmg: 2, shotCost: 11 },
};

export function weaponFor(letter: LetterId): WeaponDef {
  return WEAPONS[letter] ?? WEAPONS.c;
}

export function shotCostFor(letter: LetterId): number {
  return weaponFor(letter).shotCost;
}

/** 0 windup → 1 follow-through. */
export function meleePhase(attack: number, letter: LetterId): number {
  const t = weaponFor(letter).time;
  if (t <= 0 || attack <= 0) return 0;
  return Math.max(0, Math.min(1, 1 - attack / t));
}

/** Resting hang vs swing angle in radians (facing-right space). */
export function meleeAngle(phase: number, family: MeleeFamily, idle: boolean): number {
  if (idle || phase <= 0) {
    if (family === "thrust") return -0.35;
    if (family === "smash") return -1.05;
    if (family === "ember") return -0.55;
    return -0.85;
  }
  if (family === "thrust") {
    if (phase < 0.35) return -0.5 - phase * 0.4;
    if (phase < 0.55) return -0.64 + ((phase - 0.35) / 0.2) * 0.95;
    return 0.31 - (phase - 0.55) * 0.45;
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
