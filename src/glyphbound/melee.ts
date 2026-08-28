import type { LetterId } from "./types";
import { weaponFor, type MeleeFamily } from "./weapons";

export type MeleeMoveId =
  | "jab1"
  | "jab2"
  | "jab3"
  | "ftilt"
  | "utilt"
  | "dtilt"
  | "dash"
  | "fsmash"
  | "usmash"
  | "dsmash"
  | "nair"
  | "fair"
  | "bair"
  | "uair"
  | "dair";

export type MeleeIntent =
  | "jab"
  | "side"
  | "up"
  | "down"
  | "dash"
  | "nair"
  | "fair"
  | "bair"
  | "uair"
  | "dair";

export type SmashKind = "side" | "up" | "down";

export interface MeleeMove {
  id: MeleeMoveId;
  name: string;
  time: number;
  hitAt: number[];
  reach: number;
  height: number;
  ox: number;
  oy: number;
  dmg: number;
  dmgMul: number;
  kbX: number;
  kbY: number;
  stun: number;
  selfVx?: number;
  selfVy?: number;
  behind?: boolean;
  bothSides?: boolean;
  smash?: boolean;
  aerial?: boolean;
  spike?: boolean;
  fx: string;
}

const H_AIM = 0.34;
const V_AIM = 0.42;
const RUN_RATIO = 0.68;

export const JAB_WINDOW = 0.55;
export const TILT_HOLD = 0.18;
export const SMASH_CHARGE = 0.72;

export const MOVES: Record<MeleeMoveId, MeleeMove> = {
  jab1: {
    id: "jab1",
    name: "Jab",
    time: 0.16,
    hitAt: [0.32],
    reach: 34,
    height: 20,
    ox: 0,
    oy: 10,
    dmg: 1,
    dmgMul: 0.3,
    kbX: 24,
    kbY: -8,
    stun: 0.2,
    fx: "slash-thrust",
  },
  jab2: {
    id: "jab2",
    name: "Jab",
    time: 0.18,
    hitAt: [0.3],
    reach: 38,
    height: 22,
    ox: 2,
    oy: 8,
    dmg: 1,
    dmgMul: 0.4,
    kbX: 36,
    kbY: -12,
    stun: 0.26,
    fx: "slash-arc",
  },
  jab3: {
    id: "jab3",
    name: "Finisher",
    time: 0.34,
    hitAt: [0.42],
    reach: 48,
    height: 30,
    ox: 4,
    oy: 4,
    dmg: 2,
    dmgMul: 0.85,
    kbX: 190,
    kbY: -78,
    stun: 0.62,
    selfVx: 70,
    fx: "slash-smash",
  },
  ftilt: {
    id: "ftilt",
    name: "F-tilt",
    time: 0.28,
    hitAt: [0.4],
    reach: 52,
    height: 28,
    ox: 2,
    oy: 6,
    dmg: 2,
    dmgMul: 0.7,
    kbX: 150,
    kbY: -46,
    stun: 0.48,
    fx: "slash-arc",
  },
  utilt: {
    id: "utilt",
    name: "Up-tilt",
    time: 0.3,
    hitAt: [0.36],
    reach: 36,
    height: 48,
    ox: -4,
    oy: -18,
    dmg: 2,
    dmgMul: 0.65,
    kbX: 36,
    kbY: -210,
    stun: 0.5,
    selfVy: -40,
    fx: "slash-arc",
  },
  dtilt: {
    id: "dtilt",
    name: "Down-tilt",
    time: 0.26,
    hitAt: [0.38],
    reach: 50,
    height: 18,
    ox: 0,
    oy: 28,
    dmg: 2,
    dmgMul: 0.55,
    kbX: 110,
    kbY: -18,
    stun: 0.72,
    fx: "slash-thrust",
  },
  dash: {
    id: "dash",
    name: "Dash attack",
    time: 0.36,
    hitAt: [0.28, 0.52],
    reach: 54,
    height: 26,
    ox: 6,
    oy: 10,
    dmg: 2,
    dmgMul: 0.75,
    kbX: 170,
    kbY: -36,
    stun: 0.5,
    selfVx: 210,
    fx: "slash-ember",
  },
  fsmash: {
    id: "fsmash",
    name: "F-smash",
    time: 0.44,
    hitAt: [0.48],
    reach: 62,
    height: 34,
    ox: 6,
    oy: 2,
    dmg: 3,
    dmgMul: 1.05,
    kbX: 280,
    kbY: -90,
    stun: 0.85,
    selfVx: 90,
    smash: true,
    fx: "flourish-thrust",
  },
  usmash: {
    id: "usmash",
    name: "Up-smash",
    time: 0.48,
    hitAt: [0.46],
    reach: 40,
    height: 58,
    ox: -8,
    oy: -24,
    dmg: 3,
    dmgMul: 1,
    kbX: 40,
    kbY: -300,
    stun: 0.8,
    selfVy: -120,
    bothSides: true,
    smash: true,
    fx: "flourish-ring",
  },
  dsmash: {
    id: "dsmash",
    name: "Down-smash",
    time: 0.46,
    hitAt: [0.4, 0.62],
    reach: 48,
    height: 22,
    ox: 0,
    oy: 26,
    dmg: 3,
    dmgMul: 0.95,
    kbX: 120,
    kbY: -30,
    stun: 0.9,
    bothSides: true,
    smash: true,
    fx: "flourish-slam",
  },
  nair: {
    id: "nair",
    name: "Nair",
    time: 0.34,
    hitAt: [0.22, 0.52],
    reach: 40,
    height: 36,
    ox: -6,
    oy: 4,
    dmg: 2,
    dmgMul: 0.55,
    kbX: 70,
    kbY: -30,
    stun: 0.36,
    bothSides: true,
    aerial: true,
    fx: "slash-arc",
  },
  fair: {
    id: "fair",
    name: "Fair",
    time: 0.3,
    hitAt: [0.38],
    reach: 52,
    height: 28,
    ox: 4,
    oy: 6,
    dmg: 2,
    dmgMul: 0.8,
    kbX: 175,
    kbY: -44,
    stun: 0.46,
    selfVx: 40,
    aerial: true,
    fx: "slash-thrust",
  },
  bair: {
    id: "bair",
    name: "Bair",
    time: 0.28,
    hitAt: [0.34],
    reach: 50,
    height: 30,
    ox: 2,
    oy: 4,
    dmg: 2,
    dmgMul: 0.9,
    kbX: 210,
    kbY: -24,
    stun: 0.5,
    behind: true,
    aerial: true,
    fx: "slash-ember",
  },
  uair: {
    id: "uair",
    name: "Uair",
    time: 0.3,
    hitAt: [0.36],
    reach: 34,
    height: 46,
    ox: -4,
    oy: -20,
    dmg: 2,
    dmgMul: 0.7,
    kbX: 28,
    kbY: -230,
    stun: 0.48,
    aerial: true,
    fx: "slash-arc",
  },
  dair: {
    id: "dair",
    name: "Dair",
    time: 0.36,
    hitAt: [0.4],
    reach: 28,
    height: 44,
    ox: -2,
    oy: 18,
    dmg: 2,
    dmgMul: 0.85,
    kbX: 18,
    kbY: 240,
    stun: 0.55,
    selfVy: 110,
    aerial: true,
    spike: true,
    fx: "flourish-slam",
  },
};

export function classifyMelee(opts: {
  grounded: boolean;
  facing: 1 | -1;
  vx: number;
  spd: number;
  aimX: number;
  aimY: number;
}): MeleeIntent {
  const ax = opts.aimX;
  const ay = opts.aimY;
  const ah = Math.abs(ax);
  const av = Math.abs(ay);
  if (!opts.grounded) {
    if (av >= V_AIM && av >= ah) return ay < 0 ? "uair" : "dair";
    if (ah >= H_AIM) return Math.sign(ax) === opts.facing ? "fair" : "bair";
    return "nair";
  }
  if (av >= V_AIM && av >= ah * 0.85) return ay < 0 ? "up" : "down";
  const running = Math.abs(opts.vx) > opts.spd * RUN_RATIO && Math.sign(opts.vx) === opts.facing;
  if (ah >= H_AIM) {
    if (running && Math.sign(ax) === opts.facing) return "dash";
    return "side";
  }
  if (running) return "dash";
  return "jab";
}

export function intentToMove(intent: MeleeIntent, jabStep: number): MeleeMoveId {
  if (intent === "jab") {
    if (jabStep >= 2) return "jab3";
    if (jabStep === 1) return "jab2";
    return "jab1";
  }
  if (intent === "side") return "ftilt";
  if (intent === "up") return "utilt";
  if (intent === "down") return "dtilt";
  if (intent === "dash") return "dash";
  return intent;
}

export function smashMove(kind: SmashKind): MeleeMoveId {
  if (kind === "up") return "usmash";
  if (kind === "down") return "dsmash";
  return "fsmash";
}

export function smashKindFromIntent(intent: MeleeIntent): SmashKind | "" {
  if (intent === "side" || intent === "dash") return "side";
  if (intent === "up") return "up";
  if (intent === "down") return "down";
  return "";
}

export function isAerial(id: MeleeMoveId | ""): boolean {
  if (!id) return false;
  return MOVES[id]?.aerial === true;
}

export function isJab(id: MeleeMoveId | ""): boolean {
  return id === "jab1" || id === "jab2" || id === "jab3";
}

export function nextJab(id: MeleeMoveId | ""): MeleeMoveId | "" {
  if (id === "jab1") return "jab2";
  if (id === "jab2") return "jab3";
  return "";
}

export interface ResolvedMelee extends MeleeMove {
  family: MeleeFamily;
}

export function resolveMove(letter: LetterId, id: MeleeMoveId, smashPower = 0): ResolvedMelee {
  const move = MOVES[id];
  const wpn = weaponFor(letter);
  const charge = move.smash ? 1 + Math.max(0, Math.min(1, smashPower)) * 0.9 : 1;
  return {
    ...move,
    family: wpn.family,
    reach: Math.round(move.reach + wpn.reach * 0.18),
    height: Math.round(move.height + wpn.height * 0.08),
    dmg: Math.max(1, Math.round((move.dmg + wpn.dmg * move.dmgMul) * charge)),
    kbX: move.kbX * charge,
    kbY: move.spike ? move.kbY : move.kbY * (0.7 + 0.3 * charge),
    stun: move.stun * (move.smash ? 0.85 + 0.35 * charge : 1),
  };
}

export function moveSwingAngle(id: MeleeMoveId | "", phase: number, family: MeleeFamily, idle: boolean, flourish = false): number {
  if (flourish) {
    if (family === "arc") return -1.2 + phase * 6.4;
    if (family === "smash") return -1.7 + (phase < 0.5 ? 0 : (phase - 0.5) * 3.6);
    if (family === "ember") return -0.5 + phase * 0.9;
    return -0.25 + (phase < 0.45 ? -0.2 : 0.55);
  }
  if (idle || phase <= 0 || !id) {
    if (family === "thrust") return -0.28;
    if (family === "smash") return -1.05;
    if (family === "ember") return -0.4;
    return -0.75;
  }
  const p = Math.max(0, Math.min(1, phase));
  if (id === "utilt" || id === "usmash" || id === "uair") {
    if (p < 0.4) return 0.4 - p * 2.4;
    if (p < 0.62) return -0.56 - ((p - 0.4) / 0.22) * 1.1;
    return -1.66 + (p - 0.62) * 1.4;
  }
  if (id === "dtilt" || id === "dsmash" || id === "dair") {
    if (p < 0.4) return 0.55 + p * 0.5;
    if (p < 0.62) return 0.75 + ((p - 0.4) / 0.22) * 0.7;
    return 1.45 - (p - 0.62) * 0.6;
  }
  if (id === "bair") {
    if (p < 0.35) return 0.4 + p * 0.6;
    if (p < 0.55) return 0.61 + ((p - 0.35) / 0.2) * 1.4;
    return 2.01 - (p - 0.55) * 0.8;
  }
  if (id === "nair") return -0.6 + p * 6.2;
  if (id === "jab1") return -0.4 + (p < 0.5 ? p * 1.1 : 0.55 - (p - 0.5) * 0.4);
  if (id === "jab2") return -0.7 + (p < 0.5 ? p * 1.8 : 0.9 - (p - 0.5) * 0.5);
  if (id === "dash" || id === "fsmash" || id === "ftilt" || id === "fair" || id === "jab3") {
    if (family === "thrust") {
      if (p < 0.35) return -0.45 - p * 0.35;
      if (p < 0.55) return -0.57 + ((p - 0.35) / 0.2) * 0.95;
      return 0.38 - (p - 0.55) * 0.4;
    }
    if (family === "smash" || id === "fsmash") {
      if (p < 0.45) return -1.35 - p * 0.8;
      if (p < 0.62) return -1.71 + ((p - 0.45) / 0.17) * 2.7;
      return 0.99 - (p - 0.62) * 0.5;
    }
  }
  if (p < 0.32) return -1.05 - p * 0.5;
  if (p < 0.5) return -1.21 + ((p - 0.32) / 0.18) * 2.15;
  return 0.94 - (p - 0.5) * 0.55;
}

export function smashWindAngle(kind: SmashKind | "", family: MeleeFamily, power: number): number {
  const w = 0.35 + power * 0.7;
  if (kind === "up") return 0.55 + w * 0.4;
  if (kind === "down") return 0.2 + w * 0.35;
  if (family === "smash") return -1.7 - w * 0.35;
  return -1.15 - w * 0.4;
}
