import { TILE, type EnemyKind } from "./types";
import { FACE_DEADZONE, commitFacing, desiredFacing, type FacingActor, type FacingBody } from "./enemy-facing";

/** Walker air gravity used by one/two/three/four/five/seven. */
export const ENEMY_G = 1800;
/** Old typical leap (−460 @ 1800) peaked at ~59px. Cap is twice that height. */
export const OLD_LEAP_VY = 460;
export const MAX_JUMP_H = ((OLD_LEAP_VY * OLD_LEAP_VY) / (2 * ENEMY_G)) * 2;
export const MIN_JUMP_H = 28;
export const JUMP_CLEAR = 12;
const MOVE_CD = 0.55;
const UNSTUCK_T = 1.1;
const UNSTUCK_PX = 10;

const GOALS = new WeakMap<object, number | null>();

export function setMoveGoal(e: object, x: number | null) {
  GOALS.set(e, x);
}

export function moveGoal(e: object): number | null {
  return GOALS.has(e) ? (GOALS.get(e) ?? null) : null;
}

export interface MoveWorld {
  blockedAt: (x: number, y: number, w: number, h: number, large: boolean) => boolean;
  hazardAt?: (x: number, y: number, w: number, h: number) => boolean;
  burst?: (x: number, y: number, color: string, n: number, kind: string) => void;
}

export type Mover = FacingActor & {
  kind: string;
  vx: number;
  vy: number;
  grounded: boolean;
  stun?: number;
  alive?: boolean;
};

export interface Probe {
  floorAhead: boolean;
  wallAhead: boolean;
  stepHeight: number;
  gapWidth: number;
  pitWall: number;
  pitDir: 1 | -1 | 0;
  lethalLanding: boolean;
}

type Stance = {
  vault: boolean;
  vaultMax: number;
  pitEscape: boolean;
  gapLeap: boolean;
  gapMax: number;
  climb: boolean;
  unstuck: boolean;
  leapVx: number;
  cd: number;
};

const RUSH: Stance = {
  vault: true,
  vaultMax: TILE * 2,
  pitEscape: true,
  gapLeap: true,
  gapMax: TILE * 4,
  climb: true,
  unstuck: true,
  leapVx: 150,
  cd: 0.5,
};

const STANCES: Partial<Record<string, Stance>> = {
  one: RUSH,
  dummy: RUSH,
  two: { ...RUSH, leapVx: 130, cd: 0.7 },
  three: { ...RUSH, leapVx: 140, cd: 0.55 },
  triad: { ...RUSH, leapVx: 140, cd: 0.55 },
  four: { ...RUSH, vaultMax: TILE, gapLeap: false, leapVx: 110, cd: 0.85 },
  five: { ...RUSH, leapVx: 120, cd: 0.7 },
  seven: { ...RUSH, leapVx: 180, cd: 0.42 },
  plus: { ...RUSH, gapLeap: false, leapVx: 100, cd: 0.7 },
  minus: { ...RUSH, leapVx: 160, cd: 0.48 },
  times: { ...RUSH, gapMax: TILE * 2, leapVx: 100, cd: 0.8 },
  radix: { ...RUSH, gapLeap: false, leapVx: 90, cd: 0.7 },
  summoner: { ...RUSH, gapLeap: false, cd: 0.7 },
  archivist: { ...RUSH, gapLeap: false, cd: 0.7 },
  archivant: { ...RUSH, gapLeap: false, leapVx: 130, cd: 0.75 },
  gradient: { ...RUSH, gapLeap: false, cd: 0.65 },
  dualis: { ...RUSH, vaultMax: TILE * 2, leapVx: 140, cd: 0.8 },
  tetrarch: { ...RUSH, vaultMax: TILE * 2, leapVx: 120, cd: 0.9 },
  importer: { ...RUSH, leapVx: 140, cd: 0.8 },
  endmark: { ...RUSH, leapVx: 150, cd: 0.75 },
  summand: { ...RUSH, gapLeap: false, cd: 0.85 },
  difference: { ...RUSH, leapVx: 150, cd: 0.7 },
  product: { ...RUSH, gapLeap: false, cd: 0.85 },
  remainder: { ...RUSH, leapVx: 150, cd: 0.7 },
};

const BOSS_CAP_VY = 720;
const BOSS_G = 1600;

export function isWalker(kind: string) {
  return !!STANCES[kind];
}

export function gravityFor(kind: string): number {
  if (kind === "radix" || kind === "mobius") return 900;
  if (kind === "times" || kind === "product" || kind === "importer") return 1500;
  if (
    kind === "plus" ||
    kind === "minus" ||
    kind === "summand" ||
    kind === "difference" ||
    kind === "summoner" ||
    kind === "dualis"
  )
    return 1600;
  if (kind === "archivist" || kind === "archivant") return 1700;
  return ENEMY_G;
}

export function jumpCap(kind: string): number {
  if (
    kind === "dualis" ||
    kind === "tetrarch" ||
    kind === "importer" ||
    kind === "endmark" ||
    kind === "summand" ||
    kind === "difference" ||
    kind === "product" ||
    kind === "remainder"
  ) {
    return (BOSS_CAP_VY * BOSS_CAP_VY) / (2 * BOSS_G);
  }
  return MAX_JUMP_H;
}

export function jumpHeight(vy: number, g = ENEMY_G): number {
  return (vy * vy) / (2 * Math.max(1, g));
}

export function jumpVy(g: number, h: number, cap = MAX_JUMP_H): number {
  const hh = Math.min(cap, Math.max(MIN_JUMP_H, h));
  return -Math.sqrt(2 * Math.max(1, g) * hh);
}

export function heightTo(e: { y: number; h: number }, p: { y: number; h: number }): number {
  return Math.max(0, e.y + e.h - (p.y + p.h));
}

export function applyJump(e: { vy: number; vx: number; grounded: boolean }, vy: number, vx?: number) {
  e.vy = vy;
  if (vx != null) e.vx = vx;
  e.grounded = false;
}

function aheadX(e: { x: number; w: number }, dir: 1 | -1, extra = 2) {
  return dir > 0 ? e.x + e.w + extra : e.x - 8 - extra;
}

function blocked(world: MoveWorld, x: number, y: number) {
  return world.blockedAt(x, y, 8, 8, false);
}

function lethal(world: MoveWorld, x: number, y: number) {
  return !!world.hazardAt?.(x, y, 8, 8);
}

export function probeAhead(world: MoveWorld, e: Mover, dir: 1 | -1 = e.facing): Probe {
  const ax = aheadX(e, dir);
  const feet = e.y + e.h;
  const floorAhead = blocked(world, ax, feet + 3);
  const wallAhead = blocked(world, ax, e.y + Math.max(8, e.h * 0.38));
  let stepHeight = 0;
  for (const h of [TILE, TILE * 2]) {
    const top = feet - h;
    const face = blocked(world, ax, top + h * 0.45);
    const cap = blocked(world, ax, top + 4);
    const air = !blocked(world, ax, top - 10);
    if ((face || cap) && air) {
      stepHeight = h;
      break;
    }
  }
  let gapWidth = 0;
  if (!floorAhead) {
    gapWidth = TILE * 4 + 1;
    for (let d = TILE / 2; d <= TILE * 4; d += TILE / 2) {
      const gx = dir > 0 ? e.x + e.w + d : e.x - d;
      if (blocked(world, gx, feet + 3)) {
        gapWidth = d;
        break;
      }
    }
  }
  let pitWall = 0;
  let pitDir: 1 | -1 | 0 = 0;
  for (const side of [-1, 1] as const) {
    const sx = aheadX(e, side);
    for (const h of [TILE, TILE * 2]) {
      const top = feet - h;
      if (blocked(world, sx, top + 8) && !blocked(world, sx, top - 10)) {
        if (!pitWall || h < pitWall) {
          pitWall = h;
          pitDir = side;
        }
        break;
      }
    }
  }
  const landX = !floorAhead && gapWidth > 0 && gapWidth <= TILE * 4
    ? dir > 0
      ? e.x + e.w + gapWidth
      : e.x - gapWidth
    : ax;
  const lethalLanding = lethal(world, landX, feet + 3) || lethal(world, ax, feet + 3);
  return { floorAhead, wallAhead, stepHeight, gapWidth, pitWall, pitDir, lethalLanding };
}

type Clock = { cd: number; x: number; y: number; still: number };
const clocks = new WeakMap<object, Clock>();

function clock(e: object): Clock {
  let c = clocks.get(e);
  if (!c) {
    c = { cd: 0, x: 0, y: 0, still: 0 };
    clocks.set(e, c);
  }
  return c;
}

export function tickMoveClock(e: object, dt: number) {
  const c = clock(e);
  c.cd = Math.max(0, c.cd - dt);
}

function dust(world: MoveWorld, e: Mover) {
  world.burst?.(e.x + e.w / 2, e.y + e.h, "#d45a4a", 4, "dust");
}

function jumpOver(world: MoveWorld, e: Mover, g: number, h: number, vx: number, cap: number) {
  applyJump(e, jumpVy(g, h + JUMP_CLEAR, cap), vx);
  dust(world, e);
}

/** Shared vault / pit-escape / gap-leap / climb / unstuck. Returns true if it jumped or reversed. */
export function tryLocomote(world: MoveWorld, e: Mover, p: FacingBody, dt = 0): boolean {
  if (e.alive === false || !e.grounded || (e.stun ?? 0) > 0) return false;
  const stance = STANCES[e.kind];
  if (!stance) return false;
  const c = clock(e);
  tickMoveClock(e, dt);
  const moved = Math.abs(e.x - c.x) + Math.abs(e.y - c.y);
  if (moved < UNSTUCK_PX) c.still += dt;
  else {
    c.still = 0;
    c.x = e.x;
    c.y = e.y;
  }
  if (c.cd > 0) return false;

  const g = gravityFor(e.kind);
  const cap = jumpCap(e.kind);
  const probe = probeAhead(world, e);
  const goal = moveGoal(e);
  const want =
    goal == null
      ? desiredFacing(e, p)
      : Math.abs(goal - (e.x + e.w / 2)) < FACE_DEADZONE
        ? 0
        : goal > e.x + e.w / 2
          ? 1
          : -1;
  const toward = want === e.facing || want === 0;

  if (stance.vault && probe.wallAhead && probe.stepHeight > 0 && probe.stepHeight <= stance.vaultMax && toward) {
    if (probe.stepHeight + JUMP_CLEAR <= cap) {
      jumpOver(world, e, g, probe.stepHeight, e.facing * stance.leapVx, cap);
      c.cd = stance.cd;
      return true;
    }
  }

  const inWell = probe.pitWall > 0 && probe.pitWall + JUMP_CLEAR <= cap;
  if (stance.pitEscape && inWell && (!probe.floorAhead || probe.wallAhead || probe.pitDir !== 0)) {
    const dir = (want || probe.pitDir || e.facing) as 1 | -1;
    const side = probeAhead(world, e, dir);
    const h = side.pitWall || probe.pitWall;
    if (h > 0 && h + JUMP_CLEAR <= cap && !side.lethalLanding) {
      if (dir !== e.facing) commitFacing(e, dir);
      jumpOver(world, e, g, h, dir * stance.leapVx, cap);
      c.cd = stance.cd;
      return true;
    }
  }

  if (probe.lethalLanding) {
    if (e.turnLock <= 0) commitFacing(e, e.facing < 0 ? 1 : -1);
    e.vx = 0;
    c.cd = stance.cd;
    return true;
  }

  if (
    stance.gapLeap &&
    !probe.floorAhead &&
    toward &&
    probe.gapWidth > 0 &&
    probe.gapWidth <= stance.gapMax &&
    !probe.lethalLanding
  ) {
    const t = probe.gapWidth / Math.max(80, stance.leapVx);
    const hNeed = 0.5 * g * t * t + heightTo(e, p);
    if (hNeed <= cap) {
      jumpOver(world, e, g, hNeed, e.facing * stance.leapVx, cap);
      c.cd = stance.cd;
      return true;
    }
  }

  if (stance.climb && toward) {
    const rise = heightTo(e, p);
    const dx = Math.abs(p.x + p.w / 2 - (e.x + e.w / 2));
    const shelf = blocked(world, p.x + p.w / 2, p.y + p.h + 3) || probe.stepHeight > 0;
    if (shelf && rise >= 20 && rise + JUMP_CLEAR <= cap && dx < 180 && p.y + p.h < e.y + 8) {
      jumpOver(world, e, g, rise, (want || e.facing) * 88, cap);
      c.cd = stance.cd;
      return true;
    }
  }

  if (stance.unstuck && c.still >= UNSTUCK_T && toward) {
    const dir = (want || e.facing) as 1 | -1;
    if (dir !== e.facing) commitFacing(e, dir);
    const h = probe.stepHeight || probe.pitWall || MIN_JUMP_H + 8;
    if (h + JUMP_CLEAR <= cap) {
      jumpOver(world, e, g, h, dir * stance.leapVx, cap);
      c.cd = stance.cd;
      c.still = 0;
      return true;
    }
  }

  return false;
}

export function stanceFor(kind: EnemyKind | string): Stance | undefined {
  return STANCES[kind];
}
