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
    fx: "slash-side",
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
    fx: "slash-side",
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
    fx: "slash-side",
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
    fx: "slash-side",
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
    fx: "slash-up",
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
    fx: "slash-down",
  },
  dash: {
    id: "dash",
    name: "Dash attack",
    time: 0.36,
    hitAt: [0.28, 0.52],
    reach: 54,
    height: 26,
    ox: 6,
    oy: 14,
    dmg: 2,
    dmgMul: 0.75,
    kbX: 170,
    kbY: -36,
    stun: 0.5,
    selfVx: 180,
    fx: "slash-dash",
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
    fx: "smash-burst",
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
    fx: "slash-up",
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
    fx: "slash-down",
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
    fx: "slash-side",
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
    fx: "slash-side",
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
    fx: "slash-back",
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
    fx: "slash-up",
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
    fx: "slash-down",
  },
};

const DASHES: Partial<Record<LetterId, MeleeMove>> = {
  c: {
    ...MOVES.dash,
    name: "Disk",
    time: 0.34,
    hitAt: [0.26, 0.5],
    reach: 46,
    height: 30,
    oy: 14,
    dmgMul: 0.7,
    selfVx: 250,
    bothSides: true,
    fx: "slash-dash",
  },
  s: {
    ...MOVES.dash,
    name: "Reaper rush",
    time: 0.4,
    hitAt: [0.22, 0.46],
    reach: 72,
    height: 34,
    oy: 12,
    dmgMul: 0.8,
    selfVx: 280,
    fx: "slash-dash",
  },
  r: {
    ...MOVES.dash,
    name: "Brand skate",
    time: 0.36,
    hitAt: [0.3],
    reach: 60,
    height: 24,
    oy: 16,
    dmgMul: 0.85,
    selfVx: 310,
    fx: "slash-dash",
  },
  t: {
    ...MOVES.dash,
    name: "Lance charge",
    time: 0.42,
    hitAt: [0.32, 0.55],
    reach: 86,
    height: 22,
    oy: 16,
    dmgMul: 0.9,
    selfVx: 330,
    fx: "slash-dash",
  },
};

export function dashMove(letter: LetterId): MeleeMove {
  return DASHES[letter] ?? MOVES.dash;
}

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
  const move = id === "dash" ? dashMove(letter) : MOVES[id];
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

export interface SwingProfile {
  start: number;
  strike: number;
  recover: number;
  smear: number;
  handX: number;
  handY: number;
}

const SWING: Record<MeleeMoveId, SwingProfile> = {
  jab1: { start: -0.35, strike: 0.15, recover: -0.1, smear: 1, handX: 0.2, handY: 0.04 },
  jab2: { start: -0.55, strike: 0.35, recover: -0.05, smear: 2, handX: 0.22, handY: 0.02 },
  jab3: { start: -1.05, strike: 0.7, recover: 0.2, smear: 3, handX: 0.24, handY: 0 },
  ftilt: { start: -0.9, strike: 0.55, recover: 0.1, smear: 2, handX: 0.22, handY: 0.02 },
  utilt: { start: 0.45, strike: -1.35, recover: -0.4, smear: 2, handX: 0.08, handY: -0.18 },
  dtilt: { start: 0.35, strike: 1.05, recover: 0.5, smear: 2, handX: 0.2, handY: 0.16 },
  dash: { start: -0.04, strike: 0.06, recover: 0.02, smear: 3, handX: 0.38, handY: 0.14 },
  fsmash: { start: -1.45, strike: 0.95, recover: 0.25, smear: 3, handX: 0.26, handY: 0 },
  usmash: { start: 0.7, strike: -1.7, recover: -0.5, smear: 3, handX: 0.04, handY: -0.22 },
  dsmash: { start: 0.2, strike: 1.25, recover: 0.55, smear: 3, handX: 0.16, handY: 0.18 },
  nair: { start: -0.5, strike: 0.9, recover: 0.2, smear: 2, handX: 0.1, handY: 0.02 },
  fair: { start: -0.7, strike: 0.45, recover: 0.05, smear: 2, handX: 0.24, handY: 0.02 },
  bair: { start: 0.35, strike: 1.55, recover: 0.7, smear: 2, handX: 0.2, handY: 0.02 },
  uair: { start: 0.3, strike: -1.25, recover: -0.35, smear: 2, handX: 0.06, handY: -0.2 },
  dair: { start: 0.5, strike: 1.35, recover: 0.7, smear: 2, handX: 0.08, handY: 0.2 },
};

export function swingProfile(id: MeleeMoveId | ""): SwingProfile | null {
  if (!id) return null;
  return SWING[id] ?? null;
}

export function fxFrame(phase: number, hitAt: number[]): number {
  const hit = hitAt[0] ?? 0.4;
  if (phase < hit * 0.65) return 0;
  if (phase < hit + 0.1) return 1;
  if (phase < 0.82) return 2;
  return 3;
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
  const profile = SWING[id];
  if (profile) {
    if (p < 0.42) return profile.start + (profile.strike - profile.start) * (p / 0.42);
    if (p < 0.62) return profile.strike;
    return profile.strike + (profile.recover - profile.strike) * ((p - 0.62) / 0.38);
  }
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

/** Smash-style launch: angle 0 = forward, 90 = up, 270 = spike. */
export const KNOCKBACK: Record<
  MeleeMoveId,
  { angle: number; bkb: number; kbg: number; setKb?: number; sakurai?: boolean; iasa: number }
> = {
  jab1: { angle: 12, bkb: 50, kbg: 0, setKb: 52, sakurai: true, iasa: 0.48 },
  jab2: { angle: 18, bkb: 64, kbg: 0, setKb: 68, sakurai: true, iasa: 0.48 },
  jab3: { angle: 48, bkb: 240, kbg: 2.4, iasa: 0.7 },
  ftilt: { angle: 40, bkb: 200, kbg: 2.5, iasa: 0.6 },
  utilt: { angle: 88, bkb: 430, kbg: 3.3, iasa: 0.5 },
  dtilt: { angle: 26, bkb: 150, kbg: 1.7, iasa: 0.52 },
  dash: { angle: 36, bkb: 210, kbg: 2.1, iasa: 0.72 },
  fsmash: { angle: 42, bkb: 360, kbg: 4.3, iasa: 0.82 },
  usmash: { angle: 90, bkb: 500, kbg: 4.1, iasa: 0.8 },
  dsmash: { angle: 32, bkb: 280, kbg: 3.1, iasa: 0.8 },
  nair: { angle: 52, bkb: 150, kbg: 1.9, iasa: 0.46 },
  fair: { angle: 45, bkb: 250, kbg: 2.9, iasa: 0.6 },
  bair: { angle: 38, bkb: 290, kbg: 3.1, iasa: 0.58 },
  uair: { angle: 82, bkb: 410, kbg: 3.5, iasa: 0.52 },
  dair: { angle: 270, bkb: 390, kbg: 2.3, iasa: 0.68 },
};

export function enemyWeight(kind: string, boss: boolean): number {
  if (boss) return 1.9;
  if (kind === "one" || kind === "zero" || kind === "radix" || kind === "dummy") return 0.8;
  if (kind === "eight" || kind === "nine" || kind === "times") return 1.22;
  return 1;
}

export function comboDecay(hits: number): number {
  return 1 + Math.max(0, hits - 3) * 0.15;
}

export function launchHit(opts: {
  moveId?: MeleeMoveId | "";
  percent: number;
  weight: number;
  dir: number;
  comboHits: number;
  smashPower?: number;
  flourish?: boolean;
}): { vx: number; vy: number; stun: number; hitlag: number; speed: number } {
  let angle = 42;
  let bkb = 170;
  let kbg = 2;
  let setKb: number | undefined;
  let sakurai = false;
  if (opts.flourish) {
    angle = 52;
    bkb = 270;
    kbg = 2.7;
  } else if (opts.moveId && KNOCKBACK[opts.moveId]) {
    const k = KNOCKBACK[opts.moveId];
    angle = k.angle;
    bkb = k.bkb;
    kbg = k.kbg;
    setKb = k.setKb;
    sakurai = !!k.sakurai;
  }
  const charge = 1 + Math.max(0, opts.smashPower ?? 0) * 0.85;
  let speed = setKb != null ? setKb * charge : (bkb + Math.max(0, opts.percent) * kbg) * charge;
  speed = (speed / Math.max(0.55, opts.weight)) * comboDecay(opts.comboHits);
  let rad = (angle * Math.PI) / 180;
  if (sakurai && speed < 150) rad = (10 * Math.PI) / 180;
  const vx = opts.dir * speed * Math.cos(rad);
  const vy = -speed * Math.sin(rad);
  const stun = Math.min(1.7, 0.11 + speed * 0.00105);
  const hitlag = Math.min(0.1, 0.028 + speed * 0.00007);
  return { vx, vy, stun, hitlag, speed };
}

export function meleeIasaReady(melee: number, meleeMax: number, moveId: string): boolean {
  if (melee <= 0 || meleeMax <= 0) return false;
  const spec = KNOCKBACK[moveId as MeleeMoveId];
  const phase = 1 - melee / meleeMax;
  return phase >= (spec?.iasa ?? 0.7);
}

export function nairAutocancel(phase: number): boolean {
  return phase < 0.16 || phase > 0.84;
}
