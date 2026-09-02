/** Drop Cap Sortie — all-range arcade flight. No three.js. */

export const ARENA_R = 420;
export const WATER_Y = 0;
export const HULL_MAX = 6;
export const CHARGE_LOCK = 0.6;
export const BARREL_T = 0.42;

export type EnemyKind = "1" | "0" | "2" | "dualis";
export type ShotKind = "laser" | "orb" | "charge";
export type SortieMode = "play" | "win" | "dead" | "pause";

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
}

const CRUISE = 52;
const BOOST = 88;
const BRAKE = 28;
const TURN = 1.55;
const PITCH_R = 1.15;
const BANK = 0.72;

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

export function dist2(a: Vec3, b: Vec3) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
}

export function emptyInput(): SortieInput {
  return { roll: 0, pitch: 0, rudder: 0, fire: false, fireHeld: false, boost: false, brake: false, barrel: 0 };
}

export function createSortie(): SortieState {
  return {
    t: 0,
    mode: "play",
    x: 0,
    y: 48,
    z: 120,
    yaw: 0,
    pitch: 0.04,
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
    radio: { who: "s", text: "All-range. Dualis is over the Press. Barrel-roll if they lock.", until: 4.2 },
    hitStop: 0,
    splash: 0,
    warned: 0,
    wave: 0,
  };
}

function spawnEnemy(s: SortieState, kind: EnemyKind, x: number, y: number, z: number) {
  const hp = kind === "dualis" ? 18 : kind === "2" ? 4 : kind === "0" ? 3 : 2;
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
  let bestDot = 0.72;
  for (const e of s.enemies) {
    if (!e.alive) continue;
    const dx = e.x - s.x;
    const dy = e.y - s.y;
    const dz = e.z - s.z;
    const n = Math.hypot(dx, dy, dz) || 1;
    const dot = (dx * f.x + dy * f.y + dz * f.z) / n;
    if (dot > bestDot && n < 220) {
      bestDot = dot;
      best = e.id;
    }
  }
  return best;
}

function scriptWaves(s: SortieState) {
  if (s.wave < 1 && s.t > 2.2) {
    spawnEnemy(s, "1", -40, 50, -40);
    spawnEnemy(s, "1", 0, 54, -70);
    spawnEnemy(s, "1", 40, 50, -40);
    s.wave = 1;
    s.radio = { who: "s", text: "Ones in a V. Cut the lead.", until: s.t + 3 };
  }
  if (s.wave < 2 && s.t > 18) {
    spawnEnemy(s, "0", 120, 60, -20);
    spawnEnemy(s, "0", 140, 70, 10);
    spawnEnemy(s, "2", -130, 90, -80);
    spawnEnemy(s, "2", -100, 95, -50);
    s.wave = 2;
    s.radio = { who: "c", text: "Hold J to lock. Zeros corkscrew.", until: s.t + 3 };
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
  if (e.kind === "1") {
    e.vx = (toP.x / n) * 28;
    e.vy = (toP.y / n) * 12;
    e.vz = (toP.z / n) * 28;
    if (e.t % 1.6 < dt + 0.02) {
      fireShot(s, "orb", false, e.x, e.y, e.z, toP, 46);
    }
  } else if (e.kind === "0") {
    const ang = e.t * 1.4;
    e.vx = Math.cos(ang) * 36 + toP.x * 0.04;
    e.vy = Math.sin(ang * 0.8) * 10;
    e.vz = Math.sin(ang) * 36 + toP.z * 0.04;
    if (e.t % 1.1 < dt + 0.02) fireShot(s, "orb", false, e.x, e.y, e.z, toP, 40);
  } else if (e.kind === "2") {
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
  if (s.radio && s.t > s.radio.until) s.radio = null;

  if (input.barrel !== 0 && s.barrel <= 0) s.barrel = BARREL_T;
  if (s.barrel > 0) s.barrel = Math.max(0, s.barrel - dt);

  const want = input.boost ? BOOST : input.brake ? BRAKE : CRUISE;
  s.speed += (want - s.speed) * Math.min(1, dt * 2.4);

  const turnMul = s.speed > CRUISE ? 0.72 : s.speed < CRUISE ? 1.25 : 1;
  s.yaw += input.roll * TURN * turnMul * dt;
  s.yaw += input.rudder * 0.7 * dt;
  s.pitch += input.pitch * PITCH_R * dt;
  s.pitch = Math.max(-0.72, Math.min(0.72, s.pitch));
  const wantBank = input.roll * BANK;
  s.roll += (wantBank - s.roll) * Math.min(1, dt * 8);
  if (s.barrel > 0) s.roll += input.barrel >= 0 ? dt * 16 : dt * -16;

  const f = fwd(s);
  s.x += f.x * s.speed * dt;
  s.y += f.y * s.speed * dt;
  s.z += f.z * s.speed * dt;

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
  if (radial > ARENA_R) {
    const k = ARENA_R / radial;
    s.x *= k;
    s.z *= k;
    s.yaw += 0.9 * dt;
    if (s.warned <= 0) {
      s.radio = { who: "b", text: "Rim of the page. Turn back.", until: s.t + 2.4 };
      s.warned = 3;
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
  if (input.fireHeld) s.charge = Math.min(1.2, s.charge + dt);
  else {
    if (s.charge >= CHARGE_LOCK) fireShot(s, "charge", true, s.x, s.y, s.z, f, 160, s.lockId);
    s.charge = 0;
  }

  if (input.fire && s.cooldown <= 0) {
    const r = right(s);
    fireShot(s, "laser", true, s.x + r.x * 2.2, s.y, s.z + r.z * 2.2, f, 210);
    fireShot(s, "laser", true, s.x - r.x * 2.2, s.y, s.z - r.z * 2.2, f, 210);
    s.cooldown = 0.11;
  }

  scriptWaves(s);

  for (const e of s.enemies) {
    if (!e.alive) continue;
    steerEnemy(s, e, dt);
    if (e.kind !== "dualis") {
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
        const rad = e.kind === "dualis" ? 16 : 7;
        if (dist2(sh, e) < rad * rad) {
          e.hp -= sh.kind === "charge" ? 6 : 1;
          sh.life = 0;
          s.score += sh.kind === "charge" ? 80 : 20;
          if (e.hp <= 0) {
            e.alive = false;
            s.score += e.kind === "dualis" ? 1000 : 120;
            if (e.kind === "dualis") {
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
