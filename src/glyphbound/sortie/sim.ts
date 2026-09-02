/** Drop Cap Sortie — arcade flight. No three.js. */

import { scriptMissionWaves } from "./missions";
import { ENVELOPE_X, ENVELOPE_Y, SHIFT_T, SKY_CORRIDOR, UTURN_T, pathLength, pathFrame, samplePath, type PathPoint } from "./path";
import type { BiomeId } from "./terrain";

export const ARENA_R = 420;
export const WATER_Y = 0;
export const HULL_MAX = 6;
export const CHARGE_LOCK = 0.6;
export const BARREL_T = 0.42;

export type EnemyKind = "fighter" | "cork" | "bomber" | "turret" | "ace" | "mech" | "mothership" | "dualis";
export type ShotKind = "laser" | "orb" | "charge";
export type SortieMode = "play" | "win" | "dead" | "pause";
export type FlightMode = "corridor" | "allrange";

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Island {
  id: string;
  x: number;
  z: number;
  r: number;
  h: number;
  arch?: boolean;
}

export interface Enemy {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  hp: number;
  t: number;
  alive: boolean;
}

export interface Shot {
  id: number;
  kind: ShotKind;
  friendly: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  lockId: number;
}

export interface Ring {
  id: number;
  x: number;
  y: number;
  z: number;
  taken: boolean;
}

export interface RadioLine {
  who: string;
  text: string;
  until: number;
}

export interface SortieInput {
  roll: number;
  pitch: number;
  rudder: number;
  fire: boolean;
  fireHeld: boolean;
  boost: boolean;
  brake: boolean;
  barrel: number;
}

export interface SortieState {
  t: number;
  mode: SortieMode;
  flight: FlightMode;
  missionId: string;
  missionName: string;
  biome: BiomeId;
  path: PathPoint[];
  pathT: number;
  offsetX: number;
  offsetY: number;
  shift: number;
  uturn: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  roll: number;
  speed: number;
  hull: number;
  invuln: number;
  barrel: number;
  charge: number;
  lockId: number;
  score: number;
  archBonus: boolean;
  cooldown: number;
  shotId: number;
  enemyId: number;
  shots: Shot[];
  enemies: Enemy[];
  rings: Ring[];
  islands: Island[];
  radio: RadioLine | null;
  hitStop: number;
  splash: number;
  warned: number;
  wave: number;
  hits: number;
  winKind: EnemyKind | "aces";
  flash: number;
  lockDist: number;
  lockSx: number;
  lockSy: number;
  lockOn: boolean;
}

const CRUISE = 48;
const BOOST = 82;
const BRAKE = 22;
const TURN = 1.85;
const PITCH_R = 1.05;
const BANK = 0.68;

export const ISLANDS: Island[] = [
  { id: "press", x: 0, z: -180, r: 78, h: 38 },
  { id: "serif-e", x: 160, z: 40, r: 46, h: 28 },
  { id: "serif-w", x: -170, z: 70, r: 42, h: 24 },
  { id: "slugs", x: 40, z: 210, r: 55, h: 16 },
  { id: "arch", x: -40, z: -40, r: 36, h: 44, arch: true },
];

function fwd(s: SortieState): Vec3 {
  const cp = Math.cos(s.pitch);
  return {
    x: -Math.sin(s.yaw) * cp,
    y: Math.sin(s.pitch),
    z: -Math.cos(s.yaw) * cp,
  };
}

function right(s: SortieState): Vec3 {
  return { x: Math.cos(s.yaw), y: 0, z: -Math.sin(s.yaw) };
}

function inwardYaw(x: number, z: number) {
  return Math.atan2(x, z);
}

function flyCraft(s: SortieState, input: SortieInput, dt: number) {
  if (s.flight === "corridor" && s.shift <= 0 && s.path.length >= 2) {
    const len = pathLength(s.path) || 1;
    s.pathT = Math.min(1, s.pathT + (s.speed * dt) / len);
    s.offsetX = Math.max(-ENVELOPE_X, Math.min(ENVELOPE_X, s.offsetX + input.roll * 48 * dt + input.rudder * 18 * dt));
    s.offsetY = Math.max(-ENVELOPE_Y, Math.min(ENVELOPE_Y, s.offsetY + input.pitch * 38 * dt));
    if (Math.abs(input.roll) < 0.15) s.offsetX *= Math.exp(-1.4 * dt);
    if (Math.abs(input.pitch) < 0.15) s.offsetY *= Math.exp(-1.4 * dt);
    const sample = samplePath(s.path, s.pathT);
    const posed = pathFrame(sample, s.offsetX, s.offsetY);
    s.x = posed.x;
    s.y = posed.y;
    s.z = posed.z;
    s.yaw = posed.yaw;
    s.pitch = Math.max(-0.35, Math.min(0.35, s.offsetY * 0.012));
    const wantBank = input.roll * BANK;
    s.roll += (wantBank - s.roll) * Math.min(1, dt * 8);
    if (s.barrel > 0) s.roll += input.barrel >= 0 ? dt * 16 : dt * -16;
    if (s.pathT >= 1) {
      s.shift = SHIFT_T;
      s.radio = { who: "s", text: "All-range. Break.", until: s.t + 2.4 };
    }
    return;
  }

  if (s.shift > 0) {
    s.shift = Math.max(0, s.shift - dt);
    if (s.shift <= 0) s.flight = "allrange";
  }

  if (s.uturn > 0) {
    const span = UTURN_T;
    const t = 1 - s.uturn / span;
    s.uturn = Math.max(0, s.uturn - dt);
    const target = inwardYaw(s.x, s.z);
    let dYaw = target - s.yaw;
    while (dYaw > Math.PI) dYaw -= Math.PI * 2;
    while (dYaw < -Math.PI) dYaw += Math.PI * 2;
    s.yaw += dYaw * Math.min(1, dt * 4.2);
    s.pitch = Math.sin(t * Math.PI) * 0.5;
    s.roll += (0 - s.roll) * Math.min(1, dt * 6);
    const fU = fwd(s);
    s.x += fU.x * s.speed * dt;
    s.y += fU.y * s.speed * dt;
    s.z += fU.z * s.speed * dt;
    if (s.barrel > 0) s.roll += input.barrel >= 0 ? dt * 16 : dt * -16;
    return;
  }

  const turnMul = s.speed > CRUISE ? 0.78 : s.speed < CRUISE ? 1.38 : 1;
  s.yaw += input.roll * TURN * turnMul * dt;
  s.yaw += input.rudder * 0.7 * dt;
  if (Math.abs(input.pitch) < 0.12) s.pitch *= Math.exp(-1.6 * dt);
  else s.pitch += input.pitch * PITCH_R * dt;
  s.pitch = Math.max(-0.68, Math.min(0.68, s.pitch));
  const wantBank = input.roll * BANK;
  s.roll += (wantBank - s.roll) * Math.min(1, dt * 8);
  if (Math.abs(input.roll) < 0.12 && s.barrel <= 0) s.roll *= Math.exp(-2.4 * dt);
  if (s.barrel > 0) s.roll += input.barrel >= 0 ? dt * 16 : dt * -16;

  const f = fwd(s);
  s.x += f.x * s.speed * dt;
  s.y += f.y * s.speed * dt;
  s.z += f.z * s.speed * dt;
}

export function dist2(a: Vec3, b: Vec3) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
}

export function emptyInput(): SortieInput {
  return { roll: 0, pitch: 0, rudder: 0, fire: false, fireHeld: false, boost: false, brake: false, barrel: 0 };
}

export function createSortie(opts?: {
  corridor?: boolean;
  path?: PathPoint[];
  name?: string;
  missionId?: string;
  biome?: BiomeId;
}): SortieState {
  const corridor = opts?.corridor === true;
  const path = opts?.path ?? (corridor ? SKY_CORRIDOR : []);
  const start = corridor && path.length ? samplePath(path, 0) : null;
  const framed = start ? pathFrame(start, 0, 0) : null;
  return {
    t: 0,
    mode: "play",
    flight: corridor ? "corridor" : "allrange",
    missionId: opts?.missionId ?? "sky",
    missionName: opts?.name ?? "Lower Case Sky",
    biome: opts?.biome ?? "sky",
    path,
    pathT: 0,
    offsetX: 0,
    offsetY: 0,
    shift: 0,
    uturn: 0,
    x: framed?.x ?? 0,
    y: framed?.y ?? 48,
    z: framed?.z ?? 120,
    yaw: framed?.yaw ?? 0,
    pitch: corridor ? 0 : 0.04,
    roll: 0,
    speed: CRUISE,
    hull: HULL_MAX,
    invuln: 1.2,
    barrel: 0,
    charge: 0,
    lockId: -1,
    score: 0,
    archBonus: false,
    cooldown: 0,
    shotId: 1,
    enemyId: 1,
    shots: [],
    enemies: [],
    rings: [
      { id: 1, x: 30, y: 42, z: 20, taken: false },
      { id: 2, x: -80, y: 50, z: -60, taken: false },
      { id: 3, x: 90, y: 46, z: -120, taken: false },
    ],
    islands: ISLANDS.map((i) => ({ ...i })),
    radio: {
      who: "s",
      text: corridor ? "Stay in the canyon. Arches ahead." : "All-range. Dualis is over the Press. Barrel-roll if they lock.",
      until: 4.2,
    },
    hitStop: 0,
    splash: 0,
    warned: 0,
    wave: 0,
    hits: 0,
    winKind: "dualis",
    flash: 0,
    lockDist: 0,
    lockSx: 0,
    lockSy: 0,
    lockOn: false,
  };
}

function spawnEnemy(s: SortieState, kind: EnemyKind, x: number, y: number, z: number) {
  const hp =
    kind === "dualis" ? 18 : kind === "mothership" ? 22 : kind === "mech" ? 16 : kind === "ace" ? 6 : kind === "bomber" ? 4 : kind === "cork" ? 3 : kind === "turret" ? 3 : 2;
  s.enemies.push({
    id: s.enemyId++,
    kind,
    x,
    y,
    z,
    vx: 0,
    vy: 0,
    vz: 0,
    hp,
    t: 0,
    alive: true,
  });
}

function fireShot(
  s: SortieState,
  kind: ShotKind,
  friendly: boolean,
  x: number,
  y: number,
  z: number,
  dir: Vec3,
  speed: number,
  lockId = -1,
) {
  const n = Math.hypot(dir.x, dir.y, dir.z) || 1;
  s.shots.push({
    id: s.shotId++,
    kind,
    friendly,
    x,
    y,
    z,
    vx: (dir.x / n) * speed,
    vy: (dir.y / n) * speed,
    vz: (dir.z / n) * speed,
    life: kind === "charge" ? 2.4 : 1.35,
    lockId,
  });
}

function hurt(s: SortieState, n: number) {
  if (s.invuln > 0 || s.barrel > 0 || s.mode !== "play") return;
  s.hull -= n;
  s.invuln = 0.85;
  s.hitStop = 0.05;
  if (s.hull <= 0) {
    s.hull = 0;
    s.mode = "dead";
    s.radio = { who: "b", text: "Hull gone. Wake the press.", until: s.t + 4 };
  }
}

function islandHeight(s: SortieState, x: number, z: number) {
  let h = WATER_Y;
  for (const i of s.islands) {
    const d = Math.hypot(x - i.x, z - i.z);
    if (d < i.r) {
      const top = i.h * (1 - (d / i.r) * (d / i.r));
      if (top > h) h = top;
    }
  }
  return h;
}

function inArch(s: SortieState) {
  const a = s.islands.find((i) => i.arch);
  if (!a) return false;
  const dx = s.x - a.x;
  const dz = s.z - a.z;
  return Math.abs(dx) < 14 && Math.abs(dz) < 8 && s.y > a.h * 0.25 && s.y < a.h + 10;
}

function nearestEnemy(s: SortieState) {
  const f = fwd(s);
  let best = -1;
  let bestDot = 0.5;
  for (const e of s.enemies) {
    if (!e.alive) continue;
    const dx = e.x - s.x;
    const dy = e.y - s.y;
    const dz = e.z - s.z;
    const n = Math.hypot(dx, dy, dz) || 1;
    const dot = (dx * f.x + dy * f.y + dz * f.z) / n;
    if (dot > bestDot && n < 280) {
      bestDot = dot;
      best = e.id;
    }
  }
  return best;
}

/** Nose-camera projection for the HUD reticle. sx/sy are ~-1..1. */
export function aimScreen(s: SortieState, tx: number, ty: number, tz: number) {
  const f = fwd(s);
  const worldUp = { x: 0, y: 1, z: 0 };
  let rx = f.y * worldUp.z - f.z * worldUp.y;
  let ry = f.z * worldUp.x - f.x * worldUp.z;
  let rz = f.x * worldUp.y - f.y * worldUp.x;
  const rn = Math.hypot(rx, ry, rz) || 1;
  rx /= rn;
  ry /= rn;
  rz /= rn;
  const ux = ry * f.z - rz * f.y;
  const uy = rz * f.x - rx * f.z;
  const uz = rx * f.y - ry * f.x;
  const dx = tx - s.x;
  const dy = ty - s.y;
  const dz = tz - s.z;
  const z = dx * f.x + dy * f.y + dz * f.z;
  const x = dx * rx + dy * ry + dz * rz;
  const y = dx * ux + dy * uy + dz * uz;
  if (z < 6) return { sx: 0, sy: 0, z, on: false };
  const sx = (x / z) * 1.2;
  const sy = (y / z) * 1.2;
  return { sx, sy, z, on: Math.abs(sx) < 1.05 && Math.abs(sy) < 0.9 };
}

function aimDir(s: SortieState, f: Vec3): Vec3 {
  if (s.lockId < 0) return f;
  const e = s.enemies.find((n) => n.id === s.lockId && n.alive);
  if (!e) return f;
  const dx = e.x - s.x;
  const dy = e.y - s.y;
  const dz = e.z - s.z;
  const n = Math.hypot(dx, dy, dz) || 1;
  const blend = s.charge >= CHARGE_LOCK ? 0.85 : 0.45;
  const x = f.x + (dx / n) * blend;
  const y = f.y + (dy / n) * blend;
  const z = f.z + (dz / n) * blend;
  const m = Math.hypot(x, y, z) || 1;
  return { x: x / m, y: y / m, z: z / m };
}

function scriptWaves(s: SortieState) {
  if (s.missionId !== "sky" && scriptMissionWaves(s)) return;
  if (s.wave < 1 && s.t > 2.2) {
    spawnEnemy(s, "fighter", -40, 50, -40);
    spawnEnemy(s, "fighter", 0, 54, -70);
    spawnEnemy(s, "fighter", 40, 50, -40);
    s.wave = 1;
    s.radio = { who: "s", text: "Lizards in a V. Cut the lead.", until: s.t + 3 };
  }
  if (s.wave < 2 && s.t > 18) {
    spawnEnemy(s, "cork", 120, 60, -20);
    spawnEnemy(s, "cork", 140, 70, 10);
    spawnEnemy(s, "bomber", -130, 90, -80);
    spawnEnemy(s, "bomber", -100, 95, -50);
    s.wave = 2;
    s.radio = { who: "c", text: "Hold J to lock. Corkscrews inbound.", until: s.t + 3 };
  }
  if (s.wave < 3 && s.t > 38 && s.mode === "play") {
    const live = s.enemies.filter((e) => e.alive && e.kind !== "dualis").length;
    if (live <= 1) {
      spawnEnemy(s, "dualis", 0, 70, -180);
      s.wave = 3;
      s.radio = { who: "s", text: "Dualis over the Press. Hit the bar.", until: s.t + 4 };
    }
  }
}

function steerEnemy(s: SortieState, e: Enemy, dt: number) {
  e.t += dt;
  const toP = { x: s.x - e.x, y: s.y - e.y, z: s.z - e.z };
  const n = Math.hypot(toP.x, toP.y, toP.z) || 1;
  if (e.kind === "fighter" || e.kind === "ace") {
    const spd = e.kind === "ace" ? 38 : 28;
    e.vx = (toP.x / n) * spd;
    e.vy = (toP.y / n) * 12;
    e.vz = (toP.z / n) * spd;
    if (e.t % 1.6 < dt + 0.02) {
      fireShot(s, "orb", false, e.x, e.y, e.z, toP, 46);
    }
  } else if (e.kind === "cork") {
    const ang = e.t * 1.4;
    e.vx = Math.cos(ang) * 36 + toP.x * 0.04;
    e.vy = Math.sin(ang * 0.8) * 10;
    e.vz = Math.sin(ang) * 36 + toP.z * 0.04;
    if (e.t % 1.1 < dt + 0.02) fireShot(s, "orb", false, e.x, e.y, e.z, toP, 40);
  } else if (e.kind === "bomber") {
    if (e.t % 3 < 1.1) {
      e.vx = (toP.x / n) * 55;
      e.vy = (toP.y / n) * 40 - 8;
      e.vz = (toP.z / n) * 55;
    } else {
      e.vx *= 0.9;
      e.vy += 8 * dt;
      e.vz *= 0.9;
    }
    if (e.t % 2.2 < dt + 0.02) fireShot(s, "orb", false, e.x, e.y, e.z, toP, 50);
  } else if (e.kind === "turret" || e.kind === "mech" || e.kind === "mothership") {
    if (e.t % (e.kind === "mothership" ? 0.7 : 1.4) < dt + 0.02) fireShot(s, "orb", false, e.x, e.y, e.z, toP, 44);
  } else {
    const ang = e.t * 0.55;
    e.x = Math.cos(ang) * 90;
    e.z = -180 + Math.sin(ang) * 70;
    e.y = 62 + Math.sin(ang * 2) * 8;
    e.vx = 0;
    e.vz = 0;
    if (e.t % 0.85 < dt + 0.02) fireShot(s, "orb", false, e.x, e.y, e.z, toP, 42);
  }
}

export function stepSortie(s: SortieState, input: SortieInput, dtRaw: number) {
  if (s.mode === "pause") return s;
  const dt = Math.min(0.05, Math.max(0, dtRaw));
  if (s.mode === "win" || s.mode === "dead") {
    s.t += dt;
    return s;
  }
  if (s.hitStop > 0) {
    s.hitStop -= dt;
    return s;
  }

  s.t += dt;
  s.invuln = Math.max(0, s.invuln - dt);
  s.cooldown = Math.max(0, s.cooldown - dt);
  s.splash = Math.max(0, s.splash - dt);
  s.warned = Math.max(0, s.warned - dt);
  s.flash = Math.max(0, s.flash - dt * 4);
  if (s.radio && s.t > s.radio.until) s.radio = null;

  if (input.barrel !== 0 && s.barrel <= 0) s.barrel = BARREL_T;
  if (s.barrel > 0) s.barrel = Math.max(0, s.barrel - dt);

  const want = input.boost ? BOOST : input.brake ? BRAKE : CRUISE;
  s.speed += (want - s.speed) * Math.min(1, dt * 2.4);

  flyCraft(s, input, dt);
  const f = fwd(s);

  const ground = islandHeight(s, s.x, s.z);
  if (s.y < ground + 6) {
    s.y = ground + 6;
    s.pitch = Math.max(s.pitch, 0.18);
    hurt(s, ground > 2 ? 1 : 1);
    s.splash = 0.35;
  }
  if (s.y < WATER_Y + 5) {
    s.y = WATER_Y + 8;
    s.pitch = Math.abs(s.pitch) + 0.2;
    hurt(s, 1);
    s.splash = 0.5;
  }
  if (s.y > 160) {
    s.y = 160;
    s.pitch = Math.min(s.pitch, 0);
  }

  const radial = Math.hypot(s.x, s.z);
  if (s.flight === "allrange" && s.uturn <= 0 && radial > ARENA_R) {
    s.uturn = UTURN_T;
    if (s.warned <= 0) {
      s.radio = { who: "b", text: "Rim of the page. Come about.", until: s.t + 2.4 };
      s.warned = 4;
    }
  }

  if (inArch(s) && !s.archBonus) {
    s.archBonus = true;
    s.score += 400;
    s.radio = { who: "c", text: "Through the n. That’s press-work.", until: s.t + 2.5 };
  }

  for (const r of s.rings) {
    if (r.taken) continue;
    if (dist2(s, r) < 13 * 13) {
      r.taken = true;
      s.score += 150;
      s.hull = Math.min(HULL_MAX, s.hull + 1);
    }
  }

  s.lockId = nearestEnemy(s);
  const locked = s.enemies.find((e) => e.id === s.lockId && e.alive);
  if (locked) {
    const pip = aimScreen(s, locked.x, locked.y, locked.z);
    s.lockSx = pip.sx;
    s.lockSy = pip.sy;
    s.lockOn = pip.on;
    s.lockDist = pip.z;
  } else {
    s.lockOn = false;
    s.lockDist = 0;
  }
  if (input.fireHeld) s.charge = Math.min(1.2, s.charge + dt);
  else {
    if (s.charge >= CHARGE_LOCK) fireShot(s, "charge", true, s.x, s.y, s.z, aimDir(s, f), 170, s.lockId);
    s.charge = 0;
  }

  if (input.fire && s.cooldown <= 0) {
    const r = right(s);
    const dir = aimDir(s, f);
    fireShot(s, "laser", true, s.x + r.x * 2.2, s.y, s.z + r.z * 2.2, dir, 220);
    fireShot(s, "laser", true, s.x - r.x * 2.2, s.y, s.z - r.z * 2.2, dir, 220);
    s.cooldown = 0.1;
    s.flash = 1;
  }

  scriptWaves(s);

  for (const e of s.enemies) {
    if (!e.alive) continue;
    steerEnemy(s, e, dt);
    if (e.kind !== "dualis" && e.kind !== "turret" && e.kind !== "mech" && e.kind !== "mothership") {
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.z += e.vz * dt;
    }
    const floor = islandHeight(s, e.x, e.z) + 8;
    if (e.y < floor) e.y = floor;
    if (dist2(s, e) < 10 * 10) hurt(s, 1);
  }

  for (const sh of s.shots) {
    if (sh.life <= 0) continue;
    if (sh.kind === "charge" && sh.lockId >= 0) {
      const e = s.enemies.find((n) => n.id === sh.lockId && n.alive);
      if (e) {
        const dx = e.x - sh.x;
        const dy = e.y - sh.y;
        const dz = e.z - sh.z;
        const n = Math.hypot(dx, dy, dz) || 1;
        sh.vx += (dx / n) * 280 * dt;
        sh.vy += (dy / n) * 280 * dt;
        sh.vz += (dz / n) * 280 * dt;
      }
    }
    sh.x += sh.vx * dt;
    sh.y += sh.vy * dt;
    sh.z += sh.vz * dt;
    sh.life -= dt;

    if (sh.friendly) {
      for (const e of s.enemies) {
        if (!e.alive) continue;
        const rad = e.kind === "dualis" || e.kind === "mothership" || e.kind === "mech" ? 16 : 7;
        if (dist2(sh, e) < rad * rad) {
          e.hp -= sh.kind === "charge" ? 6 : 1;
          sh.life = 0;
          s.score += sh.kind === "charge" ? 80 : 20;
          if (e.hp <= 0) {
            e.alive = false;
            s.hits += 1;
            s.score += e.kind === "dualis" || e.kind === "mech" || e.kind === "mothership" ? 1000 : 120;
            const acesGone = s.winKind === "aces" && s.wave >= 2 && !s.enemies.some((n) => n.alive && n.kind === "ace");
            if ((s.winKind !== "aces" && e.kind === s.winKind) || acesGone) {
              s.mode = "win";
              s.radio = { who: "s", text: "Press clear. C, that was a sentence.", until: s.t + 5 };
            }
          }
        }
      }
    } else if (dist2(sh, s) < 7 * 7) {
      if (s.barrel > 0) {
        sh.friendly = true;
        sh.vx *= -1.1;
        sh.vy *= -1.1;
        sh.vz *= -1.1;
        sh.life = 0.8;
        s.score += 40;
      } else {
        sh.life = 0;
        hurt(s, 1);
      }
    }
  }

  s.shots = s.shots.filter((sh) => sh.life > 0);
  return s;
}

export function snapshotSortie(s: SortieState) {
  return {
    t: s.t,
    mode: s.mode,
    flight: s.flight,
    pathT: s.pathT,
    x: s.x,
    y: s.y,
    z: s.z,
    yaw: s.yaw,
    pitch: s.pitch,
    roll: s.roll,
    speed: s.speed,
    hull: s.hull,
    charge: s.charge,
    barrel: s.barrel,
    score: s.score,
    lockId: s.lockId,
    radio: s.radio,
    splash: s.splash,
  };
}
