/** StarWords — arcade flight. No three.js. */

import { aimOff, aimScreen, CONVERGE_DIST, inBox, unproject } from "./cam";
import { collectRank, kitMods, kitOf, romanRank, type KitId, type KitMods, type KitRanks } from "./kits";
import { scriptMissionWaves } from "./missions";
import { ENVELOPE_X, ENVELOPE_Y, SHIFT_T, SKY_CORRIDOR, UTURN_T, pathLength, pathFrame, samplePath, type PathPoint } from "./path";
import { groundHeight } from "./height";
import { inHole, inLandmarkSolid, landmarksFor, RING_COLLECT } from "./landmarks";
import type { BiomeId } from "./terrain";
export { aimOff, aimScreen, CONVERGE_DIST, gunPip, inBox, unproject } from "./cam";
export type { KitId, KitMods, KitRanks } from "./kits";

export const ARENA_R = 420;
export const WATER_Y = 0;
export const HULL_MAX = 6;
export const CHARGE_LOCK = 0.7;
export const BARREL_T = 0.42;
export const SOMERSAULT_T = 0.55;
/** NDC half-extent around the director. HUD draws these as r*100vh. */
export const INNER_R = 0.08;
export const OUTER_R = 0.13;
export const KEEP_R = 0.17;
export const MAGNET = 0;
export const CHARGE_SEEK = 0.15;
export const TGT_NEAR = 18;
export const TGT_FAR = 120;
export const WARN_FAR = 240;
export const LASER_LIFE = 0.28;
/** Staged rail lizards sit here once they have closed from the amber watch. */
export const GALLERY_LEAD = 88;
const GALLERY_CLOSE = 58;

export type EnemyKind = "fighter" | "cork" | "bomber" | "turret" | "ace" | "mech" | "mothership" | "dualis" | "aster";
export type FormName = "v" | "line" | "cross" | "guide" | "hold";
export type ShotKind = "laser" | "orb" | "charge" | "bomb";
export type PickupKind = "silver" | "gold" | "stem" | "bomb" | "repair" | "kit";
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
  staged?: boolean;
  armed?: boolean;
  form?: FormName;
  formId?: number;
  slot?: number;
  lead?: number;
  life?: number;
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

export interface Pickup {
  id: number;
  kind: PickupKind;
  kit?: KitId;
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
  bomb: boolean;
  lockBreak: boolean;
  cockpit: boolean;
  somersault: boolean;
  sightX: number;
  sightY: number;
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
  hullMax: number;
  invuln: number;
  barrel: number;
  barrelDir: number;
  cmdRoll: number;
  cmdPitch: number;
  pitchQuiet: number;
  pitchPull: number;
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
  skim: boolean;
  warned: number;
  wave: number;
  hits: number;
  winKind: EnemyKind | "aces";
  flash: number;
  gunHeat: number;
  lockDist: number;
  lockSx: number;
  lockSy: number;
  sightX: number;
  sightY: number;
  sightSx: number;
  sightSy: number;
  innerSx: number;
  innerSy: number;
  lockOn: boolean;
  lockHard: boolean;
  leadSx: number;
  leadSy: number;
  aspect: number;
  boostMeter: number;
  somersault: number;
  incoming: number;
  cockpit: boolean;
  aboutFace: boolean;
  medal: number;
  bombs: number;
  stem: 0 | 1 | 2;
  wings: 0 | 1 | 2;
  golds: number;
  pickups: Pickup[];
  proofLive: boolean;
  fork: boolean;
  archHits: number;
  arenaT: number;
  bossPhase: number;
  bossAt: number;
  split: boolean;
  takenLandmarks: string[];
  warpT: number;
  mods: KitMods;
  kitRanks: KitRanks;
  kitDirty: boolean;
  kitGained: KitId[];
  doneBeats: number[];
  trauma: number;
  shake: boolean;
  fxq: { x: number; y: number; z: number; kill: boolean }[];
  popN: number;
  popT: number;
}

const CRUISE = 52;
const BOOST = 110;
const BRAKE = 12;
const PITCH_MAX = 1.15;
const PITCH_NOSE_K = 10;
const PITCH_TRIM_K = 0.7;
const PITCH_TRIM_WAIT = 1.8;
const LOOP_PITCH = 0.95;
const LOOP_HOLD = 0.2;
const BANK = 0.92;
const YAW_FROM_BANK = 2.2;
const CEIL_Y = 260;
const CMD_K = 8;
const CMD_K_RANGE = 8;
const BANK_K = 9;
const STICK_POS_K = 8;
const STICK_HOME_K = 1.5;
const HEAT_PER_SHOT = 0.012;
const RAPID_CD = 0.08;
const HEAT_CD = 0.02;
const OVERHEAT_CD = 0.28;
const ENEMY_TURN = 3.2;
const BOOST_DRAIN = 0.4;
const BRAKE_DRAIN = 0.36;
const METER_REGEN = 0.58;
const LASER_SPD = 400;
const CHARGE_SPD = 200;

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

function follow(cur: number, want: number, k: number, dt: number) {
  return cur + (want - cur) * (1 - Math.exp(-k * dt));
}

function flyCraft(s: SortieState, input: SortieInput, dt: number) {
  const onRail = s.flight === "corridor" && s.shift <= 0 && s.path.length >= 2;
  const cmdK = onRail ? CMD_K : CMD_K_RANGE;
  s.cmdRoll = follow(s.cmdRoll, input.roll, cmdK, dt);
  s.cmdPitch = follow(s.cmdPitch, input.pitch, cmdK, dt);

  if (onRail) {
    const len = pathLength(s.path) || 1;
    s.pathT = Math.min(1, s.pathT + (s.speed * dt) / len);
    const stickX = Math.max(-1, Math.min(1, input.roll + input.rudder * 0.25));
    const stickY = Math.max(-1, Math.min(1, input.pitch));
    const wantX = Math.max(-ENVELOPE_X, Math.min(ENVELOPE_X, stickX * ENVELOPE_X));
    const wantY = Math.max(-ENVELOPE_Y, Math.min(ENVELOPE_Y, stickY * ENVELOPE_Y));
    const sitK = (want: number, cur: number) => (Math.abs(want) > Math.abs(cur) + 1 ? STICK_POS_K : STICK_HOME_K);
    s.offsetX = follow(s.offsetX, wantX, sitK(wantX, s.offsetX), dt);
    s.offsetY = follow(s.offsetY, wantY, sitK(wantY, s.offsetY), dt);
    const sample = samplePath(s.path, s.pathT);
    const posed = pathFrame(sample, s.offsetX, s.offsetY);
    s.x = posed.x;
    s.y = posed.y;
    s.z = posed.z;
    s.yaw = posed.yaw;
    s.pitch = Math.max(-0.55, Math.min(0.55, s.offsetY * 0.02));
    s.roll = follow(s.roll, s.cmdRoll * BANK, BANK_K, dt);
    if (s.pathT >= 1) {
      s.shift = SHIFT_T;
      s.radio = { who: "s", text: "All-range. Break.", until: s.t + 2.4 };
    }
    return;
  }

  if (s.shift > 0) {
    s.shift = Math.max(0, s.shift - dt);
    s.cmdRoll = follow(s.cmdRoll, 0, 10, dt);
    s.cmdPitch = follow(s.cmdPitch, 0, 10, dt);
    s.roll = follow(s.roll, 0, 8, dt);
    const fBreak = fwd(s);
    s.x += fBreak.x * s.speed * dt;
    s.y += fBreak.y * s.speed * dt;
    s.z += fBreak.z * s.speed * dt;
    if (s.shift <= 0) {
      s.flight = "allrange";
      s.cmdRoll = 0;
      s.cmdPitch = 0;
      s.pitch = Math.max(-PITCH_MAX, Math.min(PITCH_MAX, s.pitch));
      if (!s.arenaT) s.arenaT = s.t;
      for (const e of s.enemies) {
        if (flyerKind(e.kind)) e.staged = false;
      }
    }
    return;
  }

  if (s.uturn > 0) {
    const span = UTURN_T;
    const t = 1 - s.uturn / span;
    s.uturn = Math.max(0, s.uturn - dt);
    if (s.aboutFace) {
      s.yaw += Math.PI * (dt / span);
      s.pitch = follow(s.pitch, 0.15, 4, dt);
    } else {
      const target = inwardYaw(s.x, s.z);
      let dYaw = target - s.yaw;
      while (dYaw > Math.PI) dYaw -= Math.PI * 2;
      while (dYaw < -Math.PI) dYaw += Math.PI * 2;
      s.yaw += dYaw * Math.min(1, dt * 4.2);
      s.pitch = Math.sin(t * Math.PI) * 0.5;
    }
    s.roll = follow(s.roll, 0, 6, dt);
    const fU = fwd(s);
    s.x += fU.x * s.speed * dt;
    s.y += fU.y * s.speed * dt;
    s.z += fU.z * s.speed * dt;
    if (s.uturn <= 0) s.aboutFace = false;
    return;
  }

  if (s.somersault > 0) {
    s.somersault = Math.max(0, s.somersault - dt);
    s.pitch += (Math.PI * 2 * dt) / Math.max(0.2, s.mods.somersaultT);
    s.roll = follow(s.roll, 0, 5, dt);
    const fS = fwd(s);
    s.x += fS.x * s.speed * dt;
    s.y += fS.y * s.speed * dt;
    s.z += fS.z * s.speed * dt;
    return;
  }

  const turnMul = s.speed > CRUISE ? 0.85 : s.speed < CRUISE ? 1.25 : 1;
  s.roll = follow(s.roll, s.cmdRoll * BANK, BANK_K, dt);
  s.yaw += s.roll * YAW_FROM_BANK * turnMul * dt;
  s.yaw += input.rudder * 1.35 * dt;
  if (Math.abs(input.pitch) >= 0.08) {
    s.pitchQuiet = 0;
    const wantPitch = Math.max(-PITCH_MAX, Math.min(PITCH_MAX, input.pitch * PITCH_MAX));
    s.pitch = follow(s.pitch, wantPitch, PITCH_NOSE_K, dt);
  } else {
    s.pitchQuiet += dt;
    if (s.pitchQuiet > PITCH_TRIM_WAIT) s.pitch = follow(s.pitch, 0, PITCH_TRIM_K, dt);
  }
  s.pitch = Math.max(-PITCH_MAX, Math.min(PITCH_MAX, s.pitch));

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
  return {
    roll: 0,
    pitch: 0,
    rudder: 0,
    fire: false,
    fireHeld: false,
    boost: false,
    brake: false,
    barrel: 0,
    bomb: false,
    lockBreak: false,
    cockpit: false,
    somersault: false,
    sightX: 0,
    sightY: 0,
  };
}

export function createSortie(opts?: {
  corridor?: boolean;
  path?: PathPoint[];
  name?: string;
  missionId?: string;
  biome?: BiomeId;
  kits?: KitRanks;
  shake?: boolean;
}): SortieState {
  const corridor = opts?.corridor === true;
  const path = opts?.path ?? (corridor ? SKY_CORRIDOR : []);
  const start = corridor && path.length ? samplePath(path, 0) : null;
  const framed = start ? pathFrame(start, 0, 0) : null;
  const kitRanks = opts?.kits ?? {};
  const mods = kitMods(kitRanks);
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
    hull: HULL_MAX + mods.hullAdd,
    hullMax: HULL_MAX + mods.hullAdd,
    invuln: 1.2,
    barrel: 0,
    barrelDir: 1,
    cmdRoll: 0,
    cmdPitch: 0,
    pitchQuiet: 0,
    pitchPull: 0,
    charge: 0,
    lockId: -1,
    score: 0,
    archBonus: false,
    cooldown: 0,
    shotId: 1,
    enemyId: 1,
    shots: [],
    enemies: [],
    rings:
      opts?.missionId && opts.missionId !== "sky"
        ? []
        : [
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
    skim: false,
    warned: 0,
    wave: 0,
    hits: 0,
    winKind: "dualis",
    flash: 0,
    gunHeat: 0,
    lockDist: 0,
    lockSx: 0,
    lockSy: 0,
    sightX: 0,
    sightY: 0,
    sightSx: 0,
    sightSy: 0,
    innerSx: 0,
    innerSy: 0,
    lockOn: false,
    lockHard: false,
    leadSx: 0,
    leadSy: 0,
    aspect: 16 / 9,
    boostMeter: 1,
    somersault: 0,
    incoming: 0,
    cockpit: false,
    aboutFace: false,
    medal: 80,
    bombs: 1 + mods.bombsAdd,
    stem: mods.startStem,
    wings: 2,
    golds: 0,
    pickups: [
      { id: 1, kind: "stem", x: -30, y: 44, z: 40, taken: false },
      { id: 2, kind: "bomb", x: 50, y: 46, z: -30, taken: false },
    ],
    proofLive: false,
    fork: false,
    archHits: 0,
    arenaT: 0,
    bossPhase: 0,
    bossAt: 0,
    split: false,
    takenLandmarks: [],
    warpT: 0,
    mods,
    kitRanks: { ...kitRanks },
    kitDirty: false,
    kitGained: [],
    doneBeats: [],
    trauma: 0,
    shake: opts?.shake !== false,
    fxq: [],
    popN: 0,
    popT: 0,
  };
}

function defaultArmed(kind: EnemyKind) {
  return kind !== "fighter" && kind !== "cork" && kind !== "aster";
}

function flyerKind(kind: EnemyKind) {
  return kind === "fighter" || kind === "cork" || kind === "bomber" || kind === "ace";
}

function laneOf(i: number) {
  const col = (i % 5) - 2;
  return col === 0 ? (i % 2 === 0 ? -1 : 1) : col;
}

function seedWarpField(s: SortieState) {
  const d = railDir(s);
  const side = sideOf(d);
  for (let i = 0; i < 22; i++) {
    const ahead = 36 + i * 16;
    spawnEnemy(
      s,
      "aster",
      s.x + d.x * ahead + side.x * laneOf(i) * 28,
      s.y + ((i % 4) - 1.5) * 11,
      s.z + d.z * ahead + side.z * laneOf(i) * 28,
      { hp: i % 5 === 0 ? 12 : 1, staged: false, armed: false },
    );
  }
}

export function spawnEnemy(
  s: SortieState,
  kind: EnemyKind,
  x: number,
  y: number,
  z: number,
  extra?: { hp?: number; staged?: boolean; armed?: boolean; form?: FormName; formId?: number; slot?: number; lead?: number; life?: number },
) {
  const hp =
    extra?.hp ??
    (kind === "dualis"
      ? 18
      : kind === "mothership"
        ? 24
        : kind === "mech"
          ? 24
          : kind === "ace"
            ? 6
            : kind === "bomber"
              ? 4
              : kind === "cork"
                ? 3
                : kind === "turret"
                  ? 3
                  : kind === "aster"
                    ? 1
                    : 2);
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
    staged: extra?.staged ?? false,
    armed: extra?.armed ?? defaultArmed(kind),
    form: extra?.form,
    formId: extra?.formId,
    slot: extra?.slot ?? 0,
    lead: extra?.lead,
    life: extra?.life,
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
    life: kind === "bomb" ? 2.8 : kind === "charge" ? (lockId >= 0 ? 2.4 : LASER_LIFE) : LASER_LIFE,
    lockId,
  });
}

function seatKit(s: SortieState, id: KitId) {
  const before = kitMods(s.kitRanks);
  const took = collectRank(s.kitRanks, id);
  s.kitRanks = took.ranks;
  const after = kitMods(s.kitRanks);
  const def = kitOf(id);
  const name = def?.name ?? id;
  s.hullMax += after.hullAdd - before.hullAdd;
  s.hull += after.hullAdd - before.hullAdd;
  s.bombs += after.bombsAdd - before.bombsAdd;
  if (after.startStem > s.stem) s.stem = after.startStem;
  s.mods = after;
  if (!took.maxed) {
    s.kitDirty = true;
    if (!s.kitGained.includes(id)) s.kitGained.push(id);
    s.radio = {
      who: def?.who ?? "e",
      text: `${name}. Rank ${romanRank(took.next)}. The C-wing keeps it.`,
      until: s.t + 3.2,
    };
  } else {
    s.radio = { who: def?.who ?? "e", text: `${name} is already seated.`, until: s.t + 2.2 };
    s.hull = Math.min(s.hullMax + s.golds, s.hull + 1);
  }
}

function bumpFx(s: SortieState, x: number, y: number, z: number, kill: boolean, pts: number) {
  s.fxq.push({ x, y, z, kill });
  s.trauma = Math.min(1, s.trauma + (kill ? 0.28 : 0.12));
  s.popN = pts;
  s.popT = 0.45;
  if (kill) s.hitStop = Math.max(s.hitStop, 0.045);
}

function hurt(s: SortieState, n: number, snap = false) {
  if (s.invuln > 0 || s.barrel > 0 || s.somersault > 0 || s.mode !== "play") return;
  s.hull -= n;
  s.invuln = s.mods.invuln;
  s.hitStop = 0.05;
  s.trauma = Math.min(1, s.trauma + 0.4);
  if (snap && s.wings > 0) {
    s.wings = (s.wings - 1) as 0 | 1 | 2;
    if (s.stem > 0) s.stem = (s.stem - 1) as 0 | 1 | 2;
    s.radio = { who: "e", text: s.wings ? "Wing gone. Stem drops." : "Both wings. We’re sinking.", until: s.t + 2.8 };
  }
  if (s.hull <= 0) {
    s.hull = 0;
    s.mode = "dead";
    s.radio = { who: "b", text: "Hull gone. Wake the press.", until: s.t + 4 };
  }
}

function killEnemy(s: SortieState, e: Enemy, splash = false) {
  if (!e.alive) return;
  e.alive = false;
  s.hits += 1;
  const pts = e.kind === "dualis" || e.kind === "mech" || e.kind === "mothership" ? 1000 : splash ? 80 : 120;
  s.score += pts;
  bumpFx(s, e.x, e.y, e.z, true, pts);
  if (e.kind === "mech" && s.bossAt && s.t - s.bossAt < 25) {
    s.hits += 10;
    s.score += 400;
  }
  const acesGone = s.winKind === "aces" && !s.enemies.some((n) => n.alive && n.kind === "ace") && s.enemies.some((n) => n.kind === "ace");
  const dualisGone = s.winKind === "dualis" && !s.enemies.some((n) => n.alive && n.kind === "dualis");
  const otherWin = s.winKind !== "aces" && s.winKind !== "dualis" && e.kind === s.winKind;
  if (otherWin || acesGone || dualisGone) {
    s.mode = "win";
    s.radio = { who: "s", text: "Press clear. C, that was a sentence.", until: s.t + 5 };
  }
}

function bodyR(e: Enemy) {
  if (e.kind === "aster") return e.hp >= 8 ? 22 : 10;
  if (e.kind === "dualis" || e.kind === "mothership" || e.kind === "mech") return 20;
  if (e.kind === "bomber") return 15;
  if (e.kind === "ace") return 13;
  return 12;
}

function distSeg(px: number, py: number, pz: number, ax: number, ay: number, az: number, bx: number, by: number, bz: number) {
  const abx = bx - ax;
  const aby = by - ay;
  const abz = bz - az;
  const apx = px - ax;
  const apy = py - ay;
  const apz = pz - az;
  const ab2 = abx * abx + aby * aby + abz * abz || 1;
  let t = (apx * abx + apy * aby + apz * abz) / ab2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + abx * t), py - (ay + aby * t), pz - (az + abz * t));
}

function chargeSplash(s: SortieState, x: number, y: number, z: number, skipId: number) {
  const R = 32;
  for (const e of s.enemies) {
    if (!e.alive || e.id === skipId) continue;
    const d = Math.hypot(e.x - x, e.y - y, e.z - z);
    if (d > R) continue;
    e.hp -= 4;
    s.hits += 1;
    s.score += 40;
    if (e.hp <= 0) killEnemy(s, e, true);
  }
}

function detonate(s: SortieState, x: number, y: number, z: number) {
  const R = s.mods.bombR;
  for (const e of s.enemies) {
    if (!e.alive) continue;
    const d = Math.hypot(e.x - x, e.y - y, e.z - z);
    if (d > R) continue;
    e.hp -= 8;
    s.hits += 1;
    s.score += 40;
    if (e.hp <= 0) killEnemy(s, e, true);
  }
}

function islandHeight(s: SortieState, x: number, z: number) {
  return Math.max(WATER_Y, groundHeight(s.biome, x, z, s.missionId));
}

function payLandmarks(s: SortieState) {
  for (const L of landmarksFor(s.missionId)) {
    if (!L.pay || s.takenLandmarks.includes(L.id)) continue;
    const y0 = islandHeight(s, L.x, L.z);
    if (!inHole(s.x, s.y, s.z, L, y0)) continue;
    s.takenLandmarks.push(L.id);
    s.hits += 1;
    s.score += L.pay === "arch" ? 80 : 120;
    if (L.pay === "arch") {
      s.archHits += 1;
      if (s.archHits >= 7) {
        s.fork = true;
        s.radio = { who: "s", text: "Seven n. That’s a sentence. Ice is open.", until: s.t + 3 };
      }
    }
    if (L.pay === "ring") s.golds = Math.min(3, s.golds + 1);
    if (L.pay === "tanker") {
      s.bombs = Math.min(9, s.bombs + 1);
      s.radio = { who: "e", text: "Through the hold. Em-dash aboard.", until: s.t + 2.2 };
    }
    if (L.pay === "gate") s.hull = Math.min(HULL_MAX + s.golds, s.hull + 1);
  }
}

function bumpHoleSolids(s: SortieState) {
  for (const L of landmarksFor(s.missionId)) {
    if (L.kind !== "arch" && L.kind !== "gate" && L.kind !== "tanker" && L.kind !== "highway") continue;
    const y0 = islandHeight(s, L.x, L.z);
    if (inHole(s.x, s.y, s.z, L, y0)) continue;
    if (!inLandmarkSolid(s.x, s.y, s.z, L, y0)) continue;
    hurt(s, 1);
    if (L.kind === "tanker") {
      const dx = s.x - L.x;
      const dy = s.y - L.h;
      const rad = Math.hypot(dx, dy) || 1;
      const inner = L.r * 0.8;
      s.x = L.x + (dx / rad) * inner;
      s.y = L.h + (dy / rad) * inner;
    } else if (L.kind === "highway") {
      s.y = Math.min(s.y, y0 + L.h - 4);
    } else {
      const side = s.x >= L.x ? 1 : -1;
      if (Math.abs(s.x - L.x) >= L.r) s.x = L.x + side * (L.r + 8);
      if (s.y > y0 + L.h - 2) s.y = y0 + L.h - 4;
    }
  }
}

function listable(kind: EnemyKind) {
  return kind !== "dualis";
}

function kindRank(kind: EnemyKind) {
  if (kind === "mech" || kind === "mothership") return 5;
  if (kind === "ace") return 4;
  if (kind === "bomber") return 3;
  if (kind === "cork") return 2;
  if (kind === "fighter") return 2;
  if (kind === "turret" || kind === "aster") return 1;
  return 0;
}

function pickTarget(s: SortieState) {
  if (s.charge < s.mods.chargeSeek) return -1;
  const aspect = s.aspect || 16 / 9;
  const kept = s.enemies.find((e) => e.id === s.lockId && e.alive && listable(e.kind));
  if (kept) {
    const off = aimOff(s, kept.x, kept.y, kept.z);
    if (off.z <= TGT_FAR && off.z >= TGT_NEAR && inBox(off.sx, off.sy, KEEP_R, aspect)) return kept.id;
  }
  let best = -1;
  let bestScore = -1;
  for (const e of s.enemies) {
    if (!e.alive || !listable(e.kind)) continue;
    const off = aimOff(s, e.x, e.y, e.z);
    if (off.z > TGT_FAR || off.z < TGT_NEAR || !inBox(off.sx, off.sy, OUTER_R, aspect)) continue;
    const center = 1 - Math.min(1, Math.hypot(off.sx * aspect, off.sy));
    const score = kindRank(e.kind) * 10 + center;
    if (score > bestScore) {
      bestScore = score;
      best = e.id;
    }
  }
  return best;
}

function leadPoint(s: SortieState, e: Enemy, shotSpeed: number) {
  const d = Math.hypot(e.x - s.x, e.y - s.y, e.z - s.z);
  const t = d / Math.max(40, shotSpeed);
  return { x: e.x + e.vx * t, y: e.y + e.vy * t, z: e.z + e.vz * t };
}

function worldAim(s: SortieState, depth = CONVERGE_DIST) {
  return unproject(s, s.sightX, s.sightY, depth);
}

function dirTo(from: Vec3, to: Vec3): Vec3 {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dz = to.z - from.z;
  const n = Math.hypot(dx, dy, dz) || 1;
  return { x: dx / n, y: dy / n, z: dz / n };
}

function aimDir(s: SortieState, origin: Vec3, shotSpeed = LASER_SPD, home = false): Vec3 {
  const depth = s.lockHard && s.lockDist > 12 ? s.lockDist : CONVERGE_DIST;
  const aim = worldAim(s, depth);
  const through = dirTo(origin, aim);
  if (!home || !s.lockHard || s.lockId < 0) return through;
  const e = s.enemies.find((n) => n.id === s.lockId && n.alive);
  if (!e) return through;
  const lead = leadPoint(s, e, shotSpeed);
  const toLead = dirTo(origin, lead);
  const x = through.x + toLead.x * 0.85;
  const y = through.y + toLead.y * 0.85;
  const z = through.z + toLead.z * 0.85;
  const m = Math.hypot(x, y, z) || 1;
  return { x: x / m, y: y / m, z: z / m };
}

function scriptWaves(s: SortieState) {
  if (s.missionId !== "sky" && scriptMissionWaves(s)) return;
  if (s.wave < 1 && s.t > 2.2) {
    spawnEnemy(s, "fighter", -12, 50, -40, { form: "v", formId: 1, slot: 1, staged: false });
    spawnEnemy(s, "fighter", 0, 54, -70, { form: "v", formId: 1, slot: 0, staged: false });
    spawnEnemy(s, "fighter", 12, 50, -40, { form: "v", formId: 1, slot: 2, staged: false });
    s.wave = 1;
    s.radio = { who: "s", text: "Lizards in a V. Cut the lead.", until: s.t + 3 };
  }
  if (s.wave < 2 && s.t > 18) {
    spawnEnemy(s, "cork", 120, 60, -20);
    spawnEnemy(s, "cork", 140, 70, 10);
    spawnEnemy(s, "bomber", -130, 90, -80);
    spawnEnemy(s, "bomber", -100, 95, -50);
    s.wave = 2;
    s.radio = { who: "c", text: "Tap Space. Hold to charge. Corkscrews inbound.", until: s.t + 3 };
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

function railDir(s: SortieState): Vec3 {
  if (s.path.length > 1) {
    const sample = samplePath(s.path, Math.min(0.999, s.pathT));
    const n = Math.hypot(sample.dx, sample.dy, sample.dz) || 1;
    return { x: sample.dx / n, y: sample.dy / n, z: sample.dz / n };
  }
  return { x: 0, y: 0, z: -1 };
}

function sideOf(d: Vec3): Vec3 {
  const x = d.z;
  const z = -d.x;
  const n = Math.hypot(x, z) || 1;
  return { x: x / n, y: 0, z: z / n };
}

export function sightParallax(s: SortieState) {
  const onRail = s.flight === "corridor" && s.shift <= 0;
  const ox = onRail ? s.offsetX / ENVELOPE_X : 0;
  const oy = onRail ? s.offsetY / ENVELOPE_Y : 0;
  let px = -(s.roll * 0.018) - ox * 0.012;
  let py = s.pitch * 0.012 + oy * 0.008;
  const m = Math.hypot(px, py);
  if (m > 0.02) {
    px = (px / m) * 0.02;
    py = (py / m) * 0.02;
  }
  return { x: px, y: py };
}

function formOffset(form: FormName | undefined, slot: number, t: number): { x: number; y: number } {
  if (form === "line") return { x: (slot - 1) * 10, y: 2 };
  if (form === "cross") {
    const meet = (Math.sin(t * 1.15) + 1) * 0.5;
    const side = slot % 2 === 0 ? -1 : 1;
    return { x: side * (6 + 14 * (1 - meet)), y: (slot % 2) * 6 };
  }
  if (form === "guide") return { x: Math.sin(t * 0.85) * 8, y: 3 };
  if (form === "hold") return { x: 0, y: 2 };
  if (slot === 0) return { x: 0, y: 4 };
  if (slot === 1) return { x: -11, y: 2 };
  return { x: 11, y: 2 };
}

/** Rotate current velocity toward a unit want, capped at `turn` rad/s. */
function turnTo(e: Enemy, wx: number, wy: number, wz: number, spd: number, turn: number, dt: number) {
  const wn = Math.hypot(wx, wy, wz) || 1;
  wx /= wn;
  wy /= wn;
  wz /= wn;
  let cx = e.vx;
  let cy = e.vy;
  let cz = e.vz;
  const cn = Math.hypot(cx, cy, cz);
  if (cn < 1) {
    e.vx = wx * spd;
    e.vy = wy * spd;
    e.vz = wz * spd;
    return;
  }
  cx /= cn;
  cy /= cn;
  cz /= cn;
  const dot = Math.max(-1, Math.min(1, cx * wx + cy * wy + cz * wz));
  const ang = Math.acos(dot);
  const max = turn * dt;
  if (ang <= max) {
    e.vx = wx * spd;
    e.vy = wy * spd;
    e.vz = wz * spd;
    return;
  }
  let sx = wx - cx * dot;
  let sy = wy - cy * dot;
  let sz = wz - cz * dot;
  let sn = Math.hypot(sx, sy, sz);
  if (sn < 1e-4) {
    sx = -cz;
    sy = 0;
    sz = cx;
    sn = Math.hypot(sx, sz) || 1;
  }
  sx /= sn;
  sy /= sn;
  sz /= sn;
  const c = Math.cos(max);
  const si = Math.sin(max);
  e.vx = (cx * c + sx * si) * spd;
  e.vy = (cy * c + sy * si) * spd;
  e.vz = (cz * c + sz * si) * spd;
}

function springTo(e: Enemy, tx: number, ty: number, tz: number, dt: number) {
  const k = 1 - Math.exp(-7 * dt);
  e.x += (tx - e.x) * k;
  e.y += (ty - e.y) * k;
  e.z += (tz - e.z) * k;
}

function fireIfArmed(s: SortieState, e: Enemy, toP: Vec3, dt: number) {
  const armed = e.armed ?? defaultArmed(e.kind);
  if (!armed) return;
  if (e.kind === "fighter" || e.kind === "ace") {
    if (e.t % 1.6 < dt + 0.02) fireShot(s, "orb", false, e.x, e.y, e.z, toP, 46);
  } else if (e.kind === "cork") {
    if (e.t % 1.1 < dt + 0.02) fireShot(s, "orb", false, e.x, e.y, e.z, toP, 40);
  } else if (e.kind === "bomber") {
    if (e.t % 2.2 < dt + 0.02) fireShot(s, "orb", false, e.x, e.y, e.z, toP, 50);
  }
}

function steerEnemy(s: SortieState, e: Enemy, dt: number) {
  e.t += dt;
  const toP = { x: s.x - e.x, y: s.y - e.y, z: s.z - e.z };
  const n = Math.hypot(toP.x, toP.y, toP.z) || 1;
  const rail = s.flight === "corridor";
  const d = railDir(s);
  const side = sideOf(d);
  const armed = e.armed ?? defaultArmed(e.kind);

  if (e.kind === "aster") {
    e.vx = 0;
    e.vy = 0;
    e.vz = 0;
    return;
  }

  if (e.kind === "mothership") {
    if (!armed) return;
    const phase = e.hp > 16 ? 0 : e.hp > 8 ? 1 : 2;
    if (phase < 2 && e.t % (phase === 0 ? 1.35 : 0.85) < dt + 0.02) {
      fireShot(s, "orb", false, e.x, e.y, e.z, toP, 48);
    }
    if (phase === 2 && e.t % 1.05 < dt + 0.02) {
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + e.t;
        fireShot(s, "orb", false, e.x + Math.cos(a) * 14, e.y + Math.sin(a) * 8, e.z, toP, 42);
      }
    }
    return;
  }

  if (e.kind === "turret" || e.kind === "mech") {
    if (armed && e.t % 1.4 < dt + 0.02) fireShot(s, "orb", false, e.x, e.y, e.z, toP, 44);
    return;
  }

  if (e.kind === "dualis") {
    if (rail) {
      e.x += d.x * 20 * dt;
      e.z += d.z * 20 * dt;
    } else {
      const ang = e.t * 0.55;
      e.x = Math.cos(ang) * 90;
      e.z = -180 + Math.sin(ang) * 70;
      e.y = 62 + Math.sin(ang * 2) * 8;
    }
    e.vx = 0;
    e.vz = 0;
    if (armed && e.t % 0.85 < dt + 0.02) fireShot(s, "orb", false, e.x, e.y, e.z, toP, 42);
    return;
  }

  if (rail && e.staged && flyerKind(e.kind)) {
    e.lead = e.lead ?? GALLERY_LEAD;
    if (e.lead > GALLERY_LEAD) e.lead = Math.max(GALLERY_LEAD, e.lead - GALLERY_CLOSE * dt);
    e.life = e.life ?? 12;
    e.life -= dt;
    const off = formOffset(e.form, e.slot ?? 0, e.t);
    if (e.life > 0.85) {
      const tx = s.x + d.x * e.lead + side.x * off.x;
      const ty = s.y + off.y;
      const tz = s.z + d.z * e.lead + side.z * off.x;
      springTo(e, tx, ty, tz, dt);
      e.vx = d.x * s.speed;
      e.vy = 0;
      e.vz = d.z * s.speed;
    } else {
      const dir = (e.slot ?? 0) % 2 === 0 ? 1 : -1;
      e.vx = d.x * s.speed * 0.35 + side.x * dir * 90;
      e.vy = 16;
      e.vz = d.z * s.speed * 0.35 + side.z * dir * 90;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.z += e.vz * dt;
      if (Math.hypot(e.x - s.x, e.z - s.z) > 240) e.alive = false;
    }
    fireIfArmed(s, e, toP, dt);
    return;
  }

  if (!rail && e.staged && flyerKind(e.kind)) e.staged = false;

  if (rail) {
    const weave = Math.sin(e.t * 2.1 + e.id) * (e.kind === "cork" ? 22 : 8);
    const bob = Math.sin(e.t * 1.7 + e.id * 0.4) * (e.kind === "cork" ? 12 : 5);
    const spd = e.kind === "ace" ? 50 : e.kind === "bomber" ? 36 : e.kind === "cork" ? 44 : 46;
    e.vx = d.x * spd + side.x * weave;
    e.vy = d.y * spd + bob + (e.kind === "bomber" && e.t % 3 < 1.1 ? -16 : 0);
    e.vz = d.z * spd + side.z * weave;
  } else {
    const wantx = toP.x / n;
    const wanty = toP.y / n;
    const wantz = toP.z / n;
    if (e.kind === "cork") {
      turnTo(e, wantx, wanty, wantz, 28, ENEMY_TURN, dt);
      const ang = e.t * 1.4;
      e.vx += Math.cos(ang) * 16;
      e.vy += Math.sin(ang * 0.8) * 8;
      e.vz += Math.sin(ang) * 16;
    } else if (e.kind === "bomber") {
      if (e.t % 3 < 1.1) turnTo(e, wantx, wanty * 0.7 - 0.2, wantz, 40, ENEMY_TURN, dt);
      else {
        e.vx *= 0.9;
        e.vy += 8 * dt;
        e.vz *= 0.9;
      }
    } else {
      const spd = e.kind === "ace" ? 30 : 22;
      turnTo(e, wantx, wanty, wantz, spd, ENEMY_TURN, dt);
    }
  }
  fireIfArmed(s, e, toP, dt);
}

export function stepSortie(s: SortieState, input: SortieInput, dtRaw: number) {
  if (s.mode === "pause") return s;
  const dt = Math.min(0.05, Math.max(0, dtRaw));
  if (s.mode === "win" || s.mode === "dead") {
    s.t += dt;
    return s;
  }
  if (s.hitStop > 0) {
    s.hitStop = Math.max(0, s.hitStop - dt);
    s.flash = Math.max(0, s.flash - dt * 4);
    s.trauma = Math.max(0, s.trauma - dt * 1.8);
    s.popT = Math.max(0, s.popT - dt);
    return s;
  }

  s.t += dt;
  s.invuln = Math.max(0, s.invuln - dt);
  s.cooldown = Math.max(0, s.cooldown - dt);
  s.splash = Math.max(0, s.splash - dt);
  s.warned = Math.max(0, s.warned - dt);
  s.flash = Math.max(0, s.flash - dt * 4);
  s.trauma = Math.max(0, s.trauma - dt * 1.6);
  s.popT = Math.max(0, s.popT - dt);
  if (s.radio && s.t > s.radio.until) s.radio = null;

  if (input.barrel !== 0 && s.barrel <= 0) {
    s.barrel = s.mods.barrelT;
    s.barrelDir = input.barrel >= 0 ? 1 : -1;
  }
  if (s.barrel > 0) s.barrel = Math.max(0, s.barrel - dt);

  const canBoost = s.boostMeter > 0.12;
  const want = input.boost && canBoost ? BOOST : input.brake && canBoost ? BRAKE : CRUISE;
  if (input.boost && canBoost) s.boostMeter = Math.max(0, s.boostMeter - BOOST_DRAIN * s.mods.boostDrainMul * dt);
  else if (input.brake && canBoost) s.boostMeter = Math.max(0, s.boostMeter - BRAKE_DRAIN * s.mods.boostDrainMul * dt);
  else s.boostMeter = Math.min(1, s.boostMeter + s.mods.boostRegen * dt);
  const speedK = (input.boost || input.brake) && canBoost ? 5.6 : 3.8;
  s.speed += (want - s.speed) * Math.min(1, dt * speedK);

  if (input.boost && canBoost && input.pitch > LOOP_PITCH) s.pitchPull += dt;
  else s.pitchPull = 0;
  if (
    (input.somersault || (input.boost && canBoost && s.pitchPull >= LOOP_HOLD)) &&
    s.somersault <= 0 &&
    s.barrel <= 0 &&
    s.uturn <= 0
  ) {
    s.somersault = s.mods.somersaultT;
    s.boostMeter = Math.max(0, s.boostMeter - s.mods.somersaultCost);
  }
  if (
    s.flight === "allrange" &&
    input.brake &&
    canBoost &&
    input.pitch > 0.55 &&
    s.uturn <= 0 &&
    s.somersault <= 0
  ) {
    s.uturn = UTURN_T;
    s.aboutFace = true;
    s.boostMeter = Math.max(0, s.boostMeter - 0.28);
  }

  s.sightX = input.sightX;
  s.sightY = input.sightY;
  s.sightSx = s.sightX;
  s.sightSy = s.sightY;
  flyCraft(s, input, dt);
  if (s.wings === 1) s.yaw += 0.28 * dt;
  if (s.wings === 0) s.pitch -= 0.22 * dt;

  const space = s.biome === "sorts";
  const ground = islandHeight(s, s.x, s.z);
  if (!space && s.y < ground + 6) {
    s.y = ground + 6;
    if (s.pitch < 0.22) s.pitch = follow(s.pitch, 0.22, 8, dt);
    hurt(s, 1, ground > 2);
    s.splash = 0.35;
  }
  if (!space && s.y < WATER_Y + 5) {
    s.y = WATER_Y + 8;
    if (s.pitch < 0.28) s.pitch = follow(s.pitch, 0.28, 8, dt);
    hurt(s, 1);
    s.splash = 0.5;
  }
  if (s.y > CEIL_Y) s.y = CEIL_Y;

  const radial = Math.hypot(s.x, s.z);
  if (s.flight === "allrange" && s.uturn <= 0 && radial > ARENA_R) {
    s.uturn = UTURN_T;
    s.aboutFace = false;
    if (s.warned <= 0) {
      s.radio = { who: "b", text: "Rim of the page. Come about.", until: s.t + 2.4 };
      s.warned = 4;
    }
  }

  payLandmarks(s);
  bumpHoleSolids(s);

  if (s.missionId === "sorts" && s.warpT > 0 && s.mode === "play" && s.t - s.warpT > 7) {
    s.mode = "win";
    s.radio = { who: "s", text: "Seven rings. Warp. Ice is open.", until: s.t + 4 };
  }

  for (const r of s.rings) {
    if (r.taken) continue;
    if (dist2(s, r) < RING_COLLECT * RING_COLLECT) {
      r.taken = true;
      s.score += 150;
      s.hull = Math.min(HULL_MAX + s.golds, s.hull + 1);
      if (s.missionId === "sorts") {
        s.archHits += 1;
        s.speed = Math.min(110, s.speed + 16);
        if (s.archHits >= 7 && !s.warpT) {
          s.fork = true;
          s.warpT = s.t;
          s.radio = { who: "s", text: "Warp corridor. The sorts run thick.", until: s.t + 3 };
          seedWarpField(s);
        }
      }
    }
  }
  for (const p of s.pickups) {
    if (p.taken) continue;
    if (dist2(s, p) < 14 * 14) {
      p.taken = true;
      if (p.kind === "stem") {
        s.stem = Math.min(2, s.stem + 1) as 0 | 1 | 2;
        s.radio = { who: "e", text: s.stem === 2 ? "Hyper stem. Keep the wings." : "Twin stem.", until: s.t + 2.4 };
      } else if (p.kind === "bomb") {
        s.bombs = Math.min(9, s.bombs + 1);
        s.radio = { who: "b", text: "Em-dash aboard.", until: s.t + 2 };
      } else if (p.kind === "silver") {
        s.hull = Math.min(s.hullMax + s.golds, s.hull + 2);
      } else if (p.kind === "gold") {
        s.golds = Math.min(3, s.golds + 1);
        s.hull = Math.min(s.hullMax + s.golds, s.hull + 2);
        if (s.golds === 3) s.radio = { who: "e", text: "Three golds. Extra curve.", until: s.t + 2.4 };
      } else if (p.kind === "repair") {
        s.wings = Math.min(2, s.wings + 1) as 0 | 1 | 2;
        s.radio = { who: "e", text: "Wing patched.", until: s.t + 2 };
      } else if (p.kind === "kit" && p.kit) {
        seatKit(s, p.kit);
      }
      s.score += 80;
    }
  }

  if (input.cockpit) s.cockpit = !s.cockpit;
  const liveCharge = s.shots.some((q) => q.friendly && q.kind === "charge" && q.life > 0);
  if (input.fireHeld && !liveCharge) s.charge = Math.min(s.mods.chargeLock + 0.4, s.charge + dt);

  if (input.lockBreak) s.lockId = -1;
  else s.lockId = pickTarget(s);
  const locked = s.enemies.find((e) => e.id === s.lockId && e.alive);
  if (locked) {
    const off = aimOff(s, locked.x, locked.y, locked.z);
    s.lockSx = off.pipSx;
    s.lockSy = off.pipSy;
    s.lockOn = inBox(off.sx, off.sy, OUTER_R, s.aspect);
    s.lockHard = s.charge >= s.mods.chargeLock && inBox(off.sx, off.sy, INNER_R, s.aspect);
    s.lockDist = off.z;
    const lead = leadPoint(s, locked, LASER_SPD);
    const lp = aimScreen(s, lead.x, lead.y, lead.z);
    s.leadSx = lp.sx;
    s.leadSy = lp.sy;
  } else {
    s.lockOn = false;
    s.lockHard = false;
    s.lockDist = 0;
    s.leadSx = 0;
    s.leadSy = 0;
  }
  const para = sightParallax(s);
  s.innerSx = follow(s.innerSx, s.sightX + para.x, 14, dt);
  s.innerSy = follow(s.innerSy, s.sightY + para.y, 14, dt);

  if (!input.fireHeld) {
    if (s.charge >= s.mods.chargeLock && !liveCharge) {
      const home = s.lockHard ? s.lockId : -1;
      fireShot(s, "charge", true, s.x, s.y, s.z, aimDir(s, s, CHARGE_SPD, home >= 0), CHARGE_SPD, home);
    }
    s.charge = 0;
  }

  if (input.bomb) {
    const live = s.shots.find((q) => q.kind === "bomb" && q.life > 0);
    if (live) {
      detonate(s, live.x, live.y, live.z);
      live.life = 0;
    } else if (s.bombs > 0) {
      s.bombs -= 1;
      const home = s.lockHard ? s.lockId : -1;
      const dir = aimDir(s, s, 48, home >= 0);
      fireShot(s, "bomb", true, s.x + dir.x * 14, s.y + dir.y * 14, s.z + dir.z * 14, dir, 48, home);
      s.charge = 0;
    }
  }

  if (input.fire && s.charge < 0.12 && s.cooldown <= 0) {
    const r = right(s);
    const aim = worldAim(s);
    const dmgLife = (s.stem >= 2 ? LASER_LIFE * 1.15 : LASER_LIFE) * s.mods.laserLifeMul;
    const nose = aimDir(s, s, LASER_SPD, false);
    const mx = s.x + nose.x * 4;
    const my = s.y + nose.y * 4;
    const mz = s.z + nose.z * 4;
    if (s.stem === 0) {
      fireShot(s, "laser", true, mx, my, mz, dirTo({ x: mx, y: my, z: mz }, aim), LASER_SPD);
    } else {
      const lx = mx + r.x * 2.2;
      const rx = mx - r.x * 2.2;
      const lz = mz + r.z * 2.2;
      const rz = mz - r.z * 2.2;
      fireShot(s, "laser", true, lx, my, lz, dirTo({ x: lx, y: my, z: lz }, aim), LASER_SPD);
      fireShot(s, "laser", true, rx, my, rz, dirTo({ x: rx, y: my, z: rz }, aim), LASER_SPD);
    }
    s.shots.filter((q) => q.kind === "laser" && q.life > LASER_LIFE * 0.9).forEach((q) => {
      q.life = dmgLife;
    });
    s.cooldown = s.mods.rapidCd;
    s.flash = 1;
  }
  if (!input.fireHeld) s.gunHeat = Math.max(0, s.gunHeat - dt * 0.95);

  scriptWaves(s);

  const groundNow = islandHeight(s, s.x, s.z);
  s.skim = s.y < 14 && groundNow < 5;
  if (s.skim) s.splash = Math.max(s.splash, 0.2);

  for (const e of s.enemies) {
    if (!e.alive) continue;
    steerEnemy(s, e, dt);
    const held = Boolean(e.staged && flyerKind(e.kind));
    if (e.kind !== "dualis" && e.kind !== "turret" && e.kind !== "mech" && e.kind !== "mothership" && !held) {
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.z += e.vz * dt;
    }
    if (s.biome !== "sorts") {
      const floor = islandHeight(s, e.x, e.z) + 8;
      if (e.y < floor) e.y = floor;
    }
    const cr = e.kind === "aster" ? bodyR(e) * 0.8 : 10;
    if (dist2(s, e) < cr * cr) hurt(s, 1);
  }

  for (const sh of s.shots) {
    if (sh.life <= 0) continue;
    if ((sh.kind === "charge" || sh.kind === "bomb") && sh.lockId >= 0) {
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
      if (sh.kind === "bomb") {
        if (sh.life < 2.65) {
          for (const e of s.enemies) {
            if (!e.alive) continue;
            if (dist2(sh, e) < 32 * 32) {
              detonate(s, sh.x, sh.y, sh.z);
              sh.life = 0;
              break;
            }
          }
        }
      } else {
        for (const e of s.enemies) {
          if (!e.alive) continue;
          const rad = bodyR(e) + (sh.kind === "charge" ? 8 : sh.kind === "laser" ? 8 : 3);
          const hit =
            sh.kind === "laser"
              ? distSeg(e.x, e.y, e.z, sh.x - sh.vx * dt, sh.y - sh.vy * dt, sh.z - sh.vz * dt, sh.x, sh.y, sh.z) < rad
              : dist2(sh, e) < rad * rad;
          if (hit) {
            e.hp -= sh.kind === "charge" ? 6 : s.stem >= 2 ? 2 : 1;
            sh.life = 0;
            const pts = sh.kind === "charge" ? 80 : 20;
            s.score += pts;
            if (e.hp > 0) bumpFx(s, e.x, e.y, e.z, false, pts);
            if (sh.kind === "charge") chargeSplash(s, sh.x, sh.y, sh.z, e.id);
            if (e.kind === "mech") {
              if (!s.bossAt) s.bossAt = s.t;
              if (e.hp <= 16 && s.bossPhase < 1) {
                s.bossPhase = 1;
                s.radio = { who: "s", text: "Knees gone. Frill next.", until: s.t + 2.4 };
              }
              if (e.hp <= 8 && s.bossPhase < 2) {
                s.bossPhase = 2;
                s.radio = { who: "s", text: "Frill off. Core!", until: s.t + 2.4 };
              }
            }
            if (e.kind === "mothership") {
              if (!s.bossAt) s.bossAt = s.t;
              if (e.hp <= 16 && s.bossPhase < 1) {
                s.bossPhase = 1;
                s.radio = { who: "s", text: "The bit sheared. Core in the well.", until: s.t + 2.6 };
              }
              if (e.hp <= 8 && s.bossPhase < 2) {
                s.bossPhase = 2;
                s.radio = { who: "s", text: "It lied. Ring fire — stay off the plane.", until: s.t + 2.8 };
              }
            }
            if (e.kind === "dualis" && e.hp <= 9 && e.hp > 0 && !s.split) {
              s.split = true;
              spawnEnemy(s, "dualis", e.x + 28, e.y, e.z);
              spawnEnemy(s, "dualis", e.x - 28, e.y, e.z);
              s.radio = { who: "s", text: "It splits. Two ones.", until: s.t + 2.8 };
            }
            if (e.hp <= 0) killEnemy(s, e, sh.kind === "charge");
          }
        }
      }
    } else if (dist2(sh, s) < 5.5 * 5.5) {
      if (s.barrel > 0 || s.somersault > 0) {
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
  s.incoming = Math.max(0, s.incoming - dt);
  for (const sh of s.shots) {
    if (sh.friendly || sh.life <= 0) continue;
    const dx = s.x - sh.x;
    const dy = s.y - sh.y;
    const dz = s.z - sh.z;
    const dist = Math.hypot(dx, dy, dz);
    const spd = Math.hypot(sh.vx, sh.vy, sh.vz) || 1;
    const closing = (sh.vx * dx + sh.vy * dy + sh.vz * dz) / spd;
    const eta = dist / spd;
    if (closing > 8 && eta < 1.2) {
      s.incoming = s.mods.incomingT;
      if (s.warned <= 0) {
        s.radio = { who: "b", text: "Break. Ink inbound.", until: s.t + 1.6 };
        s.warned = 2.8;
      }
      break;
    }
  }
  s.proofLive = s.hits >= s.medal;
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
