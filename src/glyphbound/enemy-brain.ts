/** Digit roles: porch hold, kite, flank, rush commit. Locomote stays in enemy-move. */
import { FACE_DEADZONE, commitFacing } from "./enemy-facing";
import { setMoveGoal } from "./enemy-move";
import { TILE, type Enemy, type EnemyKind, type Player } from "./types";

export type BrainRole = "rush" | "hold" | "kite" | "flank" | "hover" | "blink" | "orbit" | "turret" | "boss";

export interface BrainWorld {
  atLedge: (e: Enemy) => boolean;
  inSight: (e: Enemy) => boolean;
}

export interface BrainIntent {
  vx: number;
  face: 1 | -1 | 0;
  commit: boolean;
  wind: number;
  role: BrainRole;
}

const ROLES: Record<EnemyKind, BrainRole> = {
  one: "rush",
  dummy: "rush",
  two: "kite",
  three: "flank",
  four: "hold",
  five: "kite",
  six: "hover",
  seven: "flank",
  eight: "orbit",
  nine: "blink",
  zero: "hover",
  dualis: "boss",
  tetrarch: "boss",
  importer: "boss",
  nullis: "boss",
  triad: "flank",
  nullring: "hover",
  mobius: "hover",
  summoner: "turret",
  gradient: "kite",
  crossseal: "hold",
  archivist: "turret",
  iris: "boss",
  archivant: "boss",
  endmark: "boss",
  plus: "hold",
  minus: "rush",
  times: "turret",
  divide: "turret",
  pi: "hover",
  radix: "turret",
  summand: "hold",
  difference: "rush",
  product: "turret",
  quotient: "turret",
  infinitum: "boss",
  remainder: "boss",
};

const SPEED: Partial<Record<BrainRole, number>> = {
  rush: 55,
  hold: 28,
  kite: 62,
  flank: 58,
  turret: 22,
};

type Mem = { home: number; dir: 1 | -1; commit: boolean };

const mem = new WeakMap<Enemy, Mem>();

function state(e: Enemy): Mem {
  let s = mem.get(e);
  if (!s) {
    s = { home: e.x, dir: e.facing, commit: false };
    mem.set(e, s);
  }
  return s;
}

export function roleOf(kind: EnemyKind): BrainRole {
  return ROLES[kind] ?? "rush";
}

export function usesBrain(kind: EnemyKind): boolean {
  const r = roleOf(kind);
  return r === "rush" || r === "hold" || r === "kite" || r === "flank" || r === "turret";
}

function dx(e: Enemy, p: Player) {
  return p.x + p.w / 2 - (e.x + e.w / 2);
}

function packHasCommit(pack: Enemy[], self: Enemy) {
  for (const o of pack) {
    if (o === self || !o.alive) continue;
    if (roleOf(o.kind) !== "rush") continue;
    if (mem.get(o)?.commit) return true;
    if (o.phase === 1 && (o.kind === "one" || o.kind === "dummy" || o.kind === "minus")) return true;
  }
  return false;
}

export function tickBrain(e: Enemy, p: Player, pack: Enemy[], dt: number, world: BrainWorld): BrainIntent {
  const role = roleOf(e.kind);
  const s = state(e);
  const dist = dx(e, p);
  const adx = Math.abs(dist);
  const ady = Math.abs(p.y - e.y);
  const sight = world.inSight(e);
  const spd = SPEED[role] ?? 50;
  const intent: BrainIntent = { vx: 0, face: 0, commit: false, wind: 0, role };

  if (role === "hover" || role === "blink" || role === "orbit" || role === "boss") {
    setMoveGoal(e, null);
    return intent;
  }

  if (!sight) {
    s.commit = false;
    if (world.atLedge(e)) s.dir = (s.dir < 0 ? 1 : -1) as 1 | -1;
    intent.face = s.dir;
    intent.vx = s.dir * (spd * 0.55);
    setMoveGoal(e, s.home + s.dir * TILE * 3);
    return intent;
  }

  if (role === "hold" || role === "turret") {
    const reach = role === "turret" ? TILE * 1.2 : TILE * 3.2;
    const left = s.home - reach;
    const right = s.home + reach;
    if (e.x < left) s.dir = 1;
    if (e.x > right) s.dir = -1;
    if (world.atLedge(e)) s.dir = (e.facing < 0 ? 1 : -1) as 1 | -1;
    const playerOnPorch = adx < reach + TILE && ady < 80;
    intent.face = playerOnPorch ? (dist > FACE_DEADZONE ? 1 : dist < -FACE_DEADZONE ? -1 : 0) : s.dir;
    intent.vx = role === "turret" ? s.dir * 12 : s.dir * spd;
    if (playerOnPorch && role === "hold") intent.vx *= 0.35;
    intent.wind = playerOnPorch && adx < TILE * 2 ? 0.45 : 0;
    setMoveGoal(e, s.dir > 0 ? right : left);
    return intent;
  }

  if (role === "kite") {
    const near = 78;
    const far = 150;
    let face: 1 | -1 = dist >= 0 ? 1 : -1;
    let vx = 0;
    if (adx < near && ady < 90) {
      face = (dist >= 0 ? -1 : 1) as 1 | -1;
      vx = face * (spd + 10);
    } else if (adx > far) {
      vx = face * spd;
    } else {
      vx = face * spd * 0.25;
      intent.wind = 0.35;
    }
    if (world.atLedge(e) && Math.sign(vx) === e.facing) vx = 0;
    intent.face = face;
    intent.vx = vx;
    setMoveGoal(e, p.x + (dist >= 0 ? -120 : 120));
    return intent;
  }

  if (role === "flank") {
    let rusherAhead = false;
    for (const o of pack) {
      if (o === e || !o.alive) continue;
      if (roleOf(o.kind) !== "rush" && roleOf(o.kind) !== "flank") continue;
      const sameSide = Math.sign(o.x - p.x) === Math.sign(e.x - p.x);
      if (sameSide && Math.abs(o.x - p.x) < Math.abs(e.x - p.x) - 20) rusherAhead = true;
    }
    const face: 1 | -1 = rusherAhead ? ((dist >= 0 ? -1 : 1) as 1 | -1) : dist >= 0 ? 1 : -1;
    let vx = face * (e.kind === "seven" ? 48 : spd);
    if (!rusherAhead && adx < 90) vx *= 0.4;
    if (world.atLedge(e) && Math.sign(vx) === e.facing) vx = 0;
    intent.face = face;
    intent.vx = vx;
    intent.wind = adx < 220 ? 0.25 : 0;
    setMoveGoal(e, rusherAhead ? e.x + face * TILE * 4 : p.x);
    return intent;
  }

  // rush
  const blocked = packHasCommit(pack, e);
  const close = adx < 120 && ady < 70;
  if (blocked && !s.commit) {
    intent.face = dist > FACE_DEADZONE ? 1 : dist < -FACE_DEADZONE ? -1 : 0;
    intent.vx = 0;
    intent.wind = close ? 0.4 : 0;
    setMoveGoal(e, e.x);
    return intent;
  }
  if (close && e.aux > 0.85) {
    s.commit = true;
    intent.commit = true;
    intent.wind = Math.min(1, (e.aux - 0.85) / 0.2);
  }
  if (s.commit && e.phase === 1) {
    intent.commit = true;
    intent.vx = e.facing * 250;
    intent.face = 0;
    setMoveGoal(e, p.x);
    return intent;
  }
  if (s.commit && e.phase !== 1 && e.aux < 0.2) s.commit = false;
  const face: 1 | -1 = dist >= 0 ? 1 : -1;
  let vx = face * spd;
  if (close && e.aux > 0.75) vx *= 0.2;
  if (world.atLedge(e) && face === e.facing) vx = 0;
  intent.face = face;
  intent.vx = vx;
  intent.commit = s.commit;
  setMoveGoal(e, p.x);
  void dt;
  return intent;
}

export function applyIntent(e: Enemy, intent: BrainIntent) {
  if (intent.face && intent.face !== e.facing && e.turnLock <= 0) commitFacing(e, intent.face);
  e.vx = intent.vx;
}
