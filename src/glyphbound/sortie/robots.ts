/** Giant robot defs and meshes. Type-metal walkers. Never Nintendo names. */

import * as THREE from "three";
import { bootRobot, type BrainCtx, type RobotDef, type RobotId, type RobotLive } from "./brain";
import { bootGalley, GALLEY, makeGalley, poseGalley } from "./robots-galley";
import { fk, type JointDef, type PartDef } from "./rig";
import { brassTex, INK, n64Mat, rustTex } from "./n64";

function add(
  parent: THREE.Object3D,
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  extra?: { rx?: number; ry?: number; rz?: number; sx?: number; sy?: number; sz?: number; name?: string },
) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  if (extra?.rx) m.rotation.x = extra.rx;
  if (extra?.ry) m.rotation.y = extra.ry;
  if (extra?.rz) m.rotation.z = extra.rz;
  if (extra?.sx || extra?.sy || extra?.sz) m.scale.set(extra.sx ?? 1, extra.sy ?? 1, extra.sz ?? 1);
  if (extra?.name) m.name = extra.name;
  m.castShadow = true;
  parent.add(m);
  return m;
}

function mats() {
  return {
    brass: n64Mat(0xffe08a, { map: brassTex() }),
    rust: n64Mat(0xff8060, { map: rustTex() }),
    ink: n64Mat(INK, { emissive: INK, glow: 0.9 }),
    dark: n64Mat(0x4a4038),
    paper: n64Mat(0xf0e4c4),
    lead: n64Mat(0xb8c8d4),
    gold: n64Mat(0xffe08a, { emissive: 0xc8a040, glow: 0.45 }),
    ice: n64Mat(0xc8e8f8, { emissive: 0x5ee0c0, glow: 0.35 }),
  };
}

function limb(name: string) {
  const g = new THREE.Group();
  g.name = name;
  return g;
}

const SCALE_JOINTS: JointDef[] = [
  { id: "pelvis", parent: null, bind: { x: 0, y: 28, z: 0 } },
  { id: "spine", parent: "pelvis", bind: { x: 0, y: 12, z: 0 } },
  { id: "head", parent: "spine", bind: { x: 0, y: 10, z: 4 } },
  { id: "pack", parent: "spine", bind: { x: 0, y: 2, z: -6 } },
  { id: "hipL", parent: "pelvis", bind: { x: -6, y: -2, z: 0 } },
  { id: "kneeL", parent: "hipL", bind: { x: 0, y: -12, z: 0 } },
  { id: "footL", parent: "kneeL", bind: { x: 0, y: -12, z: 2 } },
  { id: "hipR", parent: "pelvis", bind: { x: 6, y: -2, z: 0 } },
  { id: "kneeR", parent: "hipR", bind: { x: 0, y: -12, z: 0 } },
  { id: "footR", parent: "kneeR", bind: { x: 0, y: -12, z: 2 } },
  { id: "shL", parent: "spine", bind: { x: -10, y: 6, z: 0 } },
  { id: "elL", parent: "shL", bind: { x: -8, y: -4, z: 0 } },
  { id: "handL", parent: "elL", bind: { x: -8, y: 0, z: 4 } },
  { id: "shR", parent: "spine", bind: { x: 10, y: 6, z: 0 } },
  { id: "elR", parent: "shR", bind: { x: 8, y: -4, z: 0 } },
  { id: "handR", parent: "elR", bind: { x: 8, y: 0, z: 4 } },
];

const SCALE_PARTS: PartDef[] = [
  { id: "legL", joint: "footL", hp: 8, mark: true, destroyable: true, radius: 8, support: true, breakRadio: { who: "s", text: "A stem went. The pack is the stamp." } },
  { id: "legR", joint: "footR", hp: 8, mark: true, destroyable: true, radius: 8, support: true, breakRadio: { who: "s", text: "A stem went. The pack is the stamp." } },
  { id: "armL", joint: "handL", hp: 6, mark: true, destroyable: true, radius: 7, breakRadio: { who: "b", text: "One em-quad gone." } },
  { id: "armR", joint: "handR", hp: 6, mark: true, destroyable: true, radius: 7, breakRadio: { who: "b", text: "One em-quad gone." } },
  { id: "pack", joint: "pack", hp: 14, mark: true, destroyable: true, radius: 9, kill: true },
  { id: "head", joint: "head", hp: 10, mark: true, destroyable: false, radius: 7 },
];

function scaleStanding(ctx: BrainCtx) {
  if ((ctx.parts.legL ?? 1) <= 0 || (ctx.parts.legR ?? 1) <= 0) return "topple";
  if (ctx.dist < 38 && (ctx.parts.armL ?? 1) > 0 && (ctx.parts.armR ?? 1) > 0) return "clap";
  if (ctx.dist < 70) return "stomp";
  if (ctx.dist < 96 && ((ctx.parts.armL ?? 1) > 0 || (ctx.parts.armR ?? 1) > 0)) return "swipe";
  return "missile";
}

export const SCALE: RobotDef = {
  id: "scale",
  name: "Scale",
  joints: SCALE_JOINTS,
  parts: SCALE_PARTS,
  start: "hunt",
  walkSpeed: 18,
  height: 52,
  states: {
    hunt: {
      id: "hunt",
      telegraph: 0,
      hold: 2.6,
      vulnerable: ["legL", "legR", "armL", "armR", "pack"],
      move: "walk",
      next: scaleStanding,
    },
    missile: {
      id: "missile",
      telegraph: 0.5,
      hold: 0.7,
      vulnerable: ["legL", "legR", "armL", "armR", "pack"],
      move: "stand",
      attack: { kind: "volley", from: "handL", n: 3, spread: 0.18 },
      radio: { who: "b", text: "Arms. The em-quads fire." },
      next: (ctx) => ((ctx.parts.legL ?? 1) <= 0 || (ctx.parts.legR ?? 1) <= 0 ? "topple" : "hunt"),
    },
    swipe: {
      id: "swipe",
      telegraph: 0.45,
      hold: 0.55,
      vulnerable: ["armL", "armR", "pack"],
      move: "stand",
      attack: { kind: "swipe", arm: "both", arc: 1.4 },
      radio: { who: "s", text: "It writes a slash. Stay off the arc." },
      next: (ctx) => ((ctx.parts.legL ?? 1) <= 0 || (ctx.parts.legR ?? 1) <= 0 ? "topple" : "hunt"),
    },
    clap: {
      id: "clap",
      telegraph: 0.7,
      hold: 0.4,
      vulnerable: ["pack", "head"],
      move: "stand",
      attack: { kind: "clap" },
      radio: { who: "s", text: "The stamps will meet. Don’t sit between." },
      next: (ctx) => ((ctx.parts.legL ?? 1) <= 0 || (ctx.parts.legR ?? 1) <= 0 ? "topple" : "hunt"),
    },
    stomp: {
      id: "stomp",
      telegraph: 0.6,
      hold: 0.45,
      vulnerable: ["legL", "legR", "pack"],
      move: "stand",
      attack: { kind: "stomp", radius: 28 },
      radio: { who: "b", text: "Stems. It will stamp." },
      next: (ctx) => ((ctx.parts.legL ?? 1) <= 0 || (ctx.parts.legR ?? 1) <= 0 ? "topple" : "hunt"),
    },
    topple: {
      id: "topple",
      telegraph: 0,
      hold: 1.15,
      vulnerable: ["pack"],
      move: "topple",
      radio: { who: "s", text: "A stem went. The pack is the stamp." },
      next: () => "fallen",
    },
    fallen: {
      id: "fallen",
      telegraph: 0,
      hold: 99,
      vulnerable: ["pack"],
      move: "fallen",
      next: () => "fallen",
    },
  },
};

const UNBOUND_JOINTS: JointDef[] = [
  { id: "pelvis", parent: null, bind: { x: 0, y: 22, z: 0 } },
  { id: "spine", parent: "pelvis", bind: { x: 0, y: 16, z: 0 } },
  { id: "head", parent: "spine", bind: { x: 0, y: 8, z: 5 } },
  { id: "case", parent: "spine", bind: { x: 0, y: 0, z: -7 } },
  { id: "wedge", parent: "spine", bind: { x: 8, y: -2, z: -2 } },
  { id: "shL", parent: "spine", bind: { x: -16, y: 4, z: 0 } },
  { id: "elL", parent: "shL", bind: { x: -10, y: -2, z: 2 } },
  { id: "handL", parent: "elL", bind: { x: -10, y: 0, z: 6 } },
  { id: "shR", parent: "spine", bind: { x: 16, y: 4, z: 0 } },
  { id: "elR", parent: "shR", bind: { x: 10, y: -2, z: 2 } },
  { id: "handR", parent: "elR", bind: { x: 10, y: 0, z: 6 } },
];

const UNBOUND_PARTS: PartDef[] = [
  { id: "armL", joint: "handL", hp: 8, mark: true, destroyable: true, radius: 9, breakRadio: { who: "b", text: "A stick left the chase for good." } },
  { id: "armR", joint: "handR", hp: 8, mark: true, destroyable: true, radius: 9, breakRadio: { who: "b", text: "A stick left the chase for good." } },
  { id: "case", joint: "case", hp: 10, mark: true, destroyable: true, radius: 8, breakRadio: { who: "e", text: "The drawer is empty. Wedge next." } },
  { id: "wedge", joint: "wedge", hp: 16, mark: true, destroyable: true, radius: 8, kill: true },
  { id: "head", joint: "head", hp: 8, mark: true, destroyable: false, radius: 7 },
];

function unboundNext(ctx: BrainCtx) {
  const L = (ctx.parts.armL ?? 1) > 0;
  const R = (ctx.parts.armR ?? 1) > 0;
  if (!L && !R) return "unbound";
  if (ctx.dist < 36 && L && R) return "clap";
  if (ctx.dist < 48 && (L || R)) return "grab";
  if (ctx.dist > 70 && (ctx.parts.case ?? 1) > 0) return Math.random() < 0.45 ? "dump" : "launch";
  return L || R ? "launch" : "unbound";
}

export const UNBOUND: RobotDef = {
  id: "unbound",
  name: "Unbound",
  joints: UNBOUND_JOINTS,
  parts: UNBOUND_PARTS,
  start: "hunt",
  walkSpeed: 22,
  height: 48,
  states: {
    hunt: {
      id: "hunt",
      telegraph: 0,
      hold: 1.8,
      vulnerable: ["armL", "armR", "case", "wedge"],
      move: "strafe",
      next: unboundNext,
    },
    launch: {
      id: "launch",
      telegraph: 0.55,
      hold: 0.9,
      vulnerable: ["armL", "armR", "wedge"],
      move: "stand",
      attack: { kind: "launchArm", arm: "L" },
      radio: { who: "b", text: "A stick left the chase. It still writes." },
      next: unboundNext,
    },
    grab: {
      id: "grab",
      telegraph: 0.5,
      hold: 0.55,
      vulnerable: ["armL", "armR", "wedge"],
      move: "lunge",
      attack: { kind: "grab", arm: "R" },
      radio: { who: "s", text: "It wants the C-wing in the frame." },
      next: unboundNext,
    },
    clap: {
      id: "clap",
      telegraph: 0.75,
      hold: 0.45,
      vulnerable: ["wedge", "case"],
      move: "stand",
      attack: { kind: "clap" },
      radio: { who: "s", text: "It will shut. Don’t kiss the hole." },
      next: unboundNext,
    },
    dump: {
      id: "dump",
      telegraph: 0.4,
      hold: 0.8,
      vulnerable: ["case", "wedge"],
      move: "stand",
      attack: { kind: "dump", n: 5 },
      radio: { who: "e", text: "He’s spending the drawer." },
      next: unboundNext,
    },
    unbound: {
      id: "unbound",
      telegraph: 0.35,
      hold: 1.1,
      vulnerable: ["wedge"],
      move: "strafe",
      attack: { kind: "beam", from: "wedge", duration: 0.9 },
      radio: { who: "s", text: "The wedge is the lock. The frame is remainder." },
      next: (ctx) => ((ctx.parts.wedge ?? 1) <= 0 ? "fallen" : "unbound"),
    },
    fallen: {
      id: "fallen",
      telegraph: 0,
      hold: 99,
      vulnerable: ["wedge"],
      move: "fallen",
      next: () => "fallen",
    },
  },
};

const KITE_JOINTS: JointDef[] = [
  { id: "keel", parent: null, bind: { x: 0, y: 26, z: 0 } },
  { id: "spine", parent: "keel", bind: { x: 0, y: 8, z: 0 } },
  { id: "head", parent: "spine", bind: { x: 0, y: 4, z: 8 } },
  { id: "rule", parent: "spine", bind: { x: 0, y: 2, z: 12 } },
  { id: "wingL", parent: "spine", bind: { x: -18, y: 2, z: -2 } },
  { id: "wingR", parent: "spine", bind: { x: 18, y: 2, z: -2 } },
  { id: "bayL", parent: "keel", bind: { x: -8, y: -6, z: 0 } },
  { id: "bayR", parent: "keel", bind: { x: 8, y: -6, z: 0 } },
];

const KITE_PARTS: PartDef[] = [
  { id: "wingL", joint: "wingL", hp: 10, mark: true, destroyable: true, radius: 12, support: true, breakRadio: { who: "s", text: "A wing went. It lists. Keel is the letter." } },
  { id: "wingR", joint: "wingR", hp: 10, mark: true, destroyable: true, radius: 12, support: true, breakRadio: { who: "s", text: "A wing went. It lists. Keel is the letter." } },
  { id: "bayL", joint: "bayL", hp: 6, mark: true, destroyable: true, radius: 7, breakRadio: { who: "b", text: "Bay sealed." } },
  { id: "bayR", joint: "bayR", hp: 6, mark: true, destroyable: true, radius: 7, breakRadio: { who: "b", text: "Bay sealed." } },
  { id: "rule", joint: "rule", hp: 8, mark: true, destroyable: true, radius: 7, breakRadio: { who: "s", text: "The rule snapped. No more line." } },
  { id: "keel", joint: "keel", hp: 16, mark: true, destroyable: true, radius: 9, kill: true },
  { id: "head", joint: "head", hp: 8, mark: true, destroyable: false, radius: 6 },
];

function kiteNext(ctx: BrainCtx) {
  const L = (ctx.parts.wingL ?? 1) > 0;
  const R = (ctx.parts.wingR ?? 1) > 0;
  if (!L || !R) return "list";
  if (ctx.dist < 55) return "dive";
  if ((ctx.parts.bayL ?? 1) > 0 || (ctx.parts.bayR ?? 1) > 0) {
    if (ctx.t % 11 < 2.2) return "bay";
  }
  if ((ctx.parts.rule ?? 1) > 0) return "beam";
  return "orbit";
}

export const KITE: RobotDef = {
  id: "kite",
  name: "Kite",
  joints: KITE_JOINTS,
  parts: KITE_PARTS,
  start: "orbit",
  walkSpeed: 28,
  height: 36,
  hoverY: 48,
  states: {
    orbit: {
      id: "orbit",
      telegraph: 0,
      hold: 2.2,
      vulnerable: ["wingL", "wingR", "bayL", "bayR", "rule", "keel"],
      move: "orbit",
      next: kiteNext,
    },
    beam: {
      id: "beam",
      telegraph: 0.6,
      hold: 1.15,
      vulnerable: ["rule", "keel", "wingL", "wingR"],
      move: "hover",
      attack: { kind: "beam", from: "rule", duration: 1.1 },
      radio: { who: "s", text: "The rule. A line of ink. Don’t sit in it." },
      next: kiteNext,
    },
    bay: {
      id: "bay",
      telegraph: 0.5,
      hold: 0.8,
      vulnerable: ["bayL", "bayR", "keel"],
      move: "hover",
      attack: { kind: "bay", side: "L" },
      radio: { who: "b", text: "Bays. Serifs dropping." },
      next: kiteNext,
    },
    dive: {
      id: "dive",
      telegraph: 0.4,
      hold: 0.7,
      vulnerable: ["keel", "head"],
      move: "lunge",
      attack: { kind: "stomp", radius: 26 },
      radio: { who: "e", text: "It’s coming down the pad." },
      next: kiteNext,
    },
    list: {
      id: "list",
      telegraph: 0.2,
      hold: 1.4,
      vulnerable: ["keel"],
      move: "hover",
      attack: { kind: "volley", from: "head", n: 4, spread: 0.28 },
      radio: { who: "s", text: "It lists. Keel is the letter." },
      next: (ctx) => ((ctx.parts.keel ?? 1) <= 0 ? "fallen" : "list"),
    },
    fallen: {
      id: "fallen",
      telegraph: 0,
      hold: 99,
      vulnerable: ["keel"],
      move: "fallen",
      next: () => "fallen",
    },
  },
};

const DUALIS_JOINTS: JointDef[] = [
  { id: "platen", parent: null, bind: { x: 0, y: 24, z: 0 } },
  { id: "stemL", parent: "platen", bind: { x: -12, y: 14, z: 0 } },
  { id: "stemR", parent: "platen", bind: { x: 12, y: 14, z: 0 } },
  { id: "bar", parent: "platen", bind: { x: 0, y: 28, z: 2 } },
  { id: "core", parent: "platen", bind: { x: 0, y: 10, z: -4 } },
  { id: "head", parent: "bar", bind: { x: 0, y: 6, z: 6 } },
  { id: "gunL", parent: "stemL", bind: { x: 0, y: 8, z: 6 } },
  { id: "gunR", parent: "stemR", bind: { x: 0, y: 8, z: 6 } },
];

const DUALIS_PARTS: PartDef[] = [
  { id: "stemL", joint: "stemL", hp: 10, mark: true, destroyable: true, radius: 9, breakRadio: { who: "s", text: "One stem filed." } },
  { id: "stemR", joint: "stemR", hp: 10, mark: true, destroyable: true, radius: 9, breakRadio: { who: "s", text: "One stem filed." } },
  { id: "bar", joint: "bar", hp: 12, mark: true, destroyable: true, radius: 10, breakRadio: { who: "s", text: "The bar broke. Two ones." } },
  { id: "core", joint: "core", hp: 18, mark: true, destroyable: true, radius: 9, kill: true },
  { id: "head", joint: "head", hp: 8, mark: true, destroyable: false, radius: 7 },
];

function dualisNext(ctx: BrainCtx) {
  const bar = (ctx.parts.bar ?? 1) > 0;
  const L = (ctx.parts.stemL ?? 1) > 0;
  const R = (ctx.parts.stemR ?? 1) > 0;
  if (!L && !R) return "core";
  if (!bar) return "split";
  if (ctx.dist < 50) return "stomp";
  return ctx.facing > 0.35 ? "beam" : "volley";
}

export const DUALIS: RobotDef = {
  id: "dualis",
  name: "Dualis",
  joints: DUALIS_JOINTS,
  parts: DUALIS_PARTS,
  start: "hunt",
  walkSpeed: 16,
  height: 68,
  states: {
    hunt: {
      id: "hunt",
      telegraph: 0,
      hold: 2.0,
      vulnerable: ["stemL", "stemR", "bar"],
      move: "walk",
      next: dualisNext,
    },
    volley: {
      id: "volley",
      telegraph: 0.4,
      hold: 0.85,
      vulnerable: ["stemL", "stemR", "bar"],
      move: "stand",
      attack: { kind: "volley", from: "gunL", n: 4, spread: 0.22 },
      radio: { who: "!", text: "Submit the remainder." },
      next: dualisNext,
    },
    beam: {
      id: "beam",
      telegraph: 0.7,
      hold: 1.2,
      vulnerable: ["bar", "head"],
      move: "stand",
      attack: { kind: "beam", from: "bar", duration: 1.15 },
      radio: { who: "s", text: "The bar. That’s the period. Don’t sit in it." },
      next: dualisNext,
    },
    stomp: {
      id: "stomp",
      telegraph: 0.55,
      hold: 0.5,
      vulnerable: ["stemL", "stemR", "core"],
      move: "stand",
      attack: { kind: "stomp", radius: 32 },
      radio: { who: "b", text: "The platen. It will close the page." },
      next: dualisNext,
    },
    split: {
      id: "split",
      telegraph: 0.3,
      hold: 1.3,
      vulnerable: ["stemL", "stemR", "core"],
      move: "strafe",
      attack: { kind: "volley", from: "gunL", n: 5, spread: 0.4 },
      radio: { who: "s", text: "It splits. Two ones. Core still in the platen." },
      next: (ctx) => ((ctx.parts.stemL ?? 1) <= 0 && (ctx.parts.stemR ?? 1) <= 0 ? "core" : "split"),
    },
    core: {
      id: "core",
      telegraph: 0.25,
      hold: 1.0,
      vulnerable: ["core"],
      move: "hover",
      attack: { kind: "dump", n: 6 },
      radio: { who: "c", text: "The Fool. Hit the blank." },
      next: (ctx) => ((ctx.parts.core ?? 1) <= 0 ? "fallen" : "core"),
    },
    fallen: {
      id: "fallen",
      telegraph: 0,
      hold: 99,
      vulnerable: ["core"],
      move: "fallen",
      next: () => "fallen",
    },
  },
};

export const ROBOTS: Record<RobotId, RobotDef> = {
  scale: SCALE,
  unbound: UNBOUND,
  kite: KITE,
  dualis: DUALIS,
  galley: GALLEY,
};

export function robotOf(id: string): RobotDef | null {
  if (id === "scale") return SCALE;
  if (id === "unbound") return UNBOUND;
  if (id === "kite") return KITE;
  if (id === "dualis") return DUALIS;
  if (id === "galley") return GALLEY;
  return null;
}

export function bootScale(): RobotLive {
  return bootRobot(SCALE);
}

export function bootUnbound(): RobotLive {
  return bootRobot(UNBOUND);
}

export function bootKite(): RobotLive {
  return bootRobot(KITE);
}

export function bootDualis(): RobotLive {
  return bootRobot(DUALIS);
}

export { bootGalley, GALLEY, makeGalley, poseGalley };

export function robotCtx(e: { x: number; z: number; t: number; robot?: RobotLive }, px: number, pz: number): BrainCtx {
  const live = e.robot;
  const dx = px - e.x;
  const dz = pz - e.z;
  const dist = Math.hypot(dx, dz);
  const yaw = live?.yaw ?? 0;
  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);
  const facing = dist < 1 ? 1 : (dx * fx + dz * fz) / dist;
  return {
    t: e.t,
    dist,
    facing,
    parts: live?.parts ?? {},
    phase: live?.phase ?? 0,
  };
}

export const scaleCtx = robotCtx;

export function robotWorld(e: { x: number; y?: number; z: number; robot?: RobotLive }) {
  if (!e.robot) return {};
  const def = robotOf(e.robot.id);
  if (!def) return {};
  const y = e.y ?? 0;
  const lift =
    e.robot.id === "kite"
      ? y - 26
      : e.robot.id === "dualis" && e.robot.state === "core"
        ? y - 24
        : e.robot.id === "galley" && e.robot.state === "core"
          ? y - 32
          : 0;
  return fk(def.joints, e.robot.pose, { x: e.x, y: lift, z: e.z, yaw: e.robot.yaw });
}

export const scaleWorld = robotWorld;

export function poseScaleWalk(live: RobotLive, t: number) {
  const fallen = live.state === "fallen" || live.state === "topple";
  const walk = live.state === "hunt";
  const step = walk ? Math.sin(t * 2.4) : 0;
  const limpL = (live.parts.legL ?? 1) <= 0;
  const limpR = (live.parts.legR ?? 1) <= 0;
  const hip = fallen ? 1.1 : step * 0.55;
  const pose = live.pose;
  pose.hipL.rx = limpL ? 0.9 : hip;
  pose.hipR.rx = limpR ? 0.9 : -hip;
  pose.kneeL.rx = limpL || fallen ? 1.2 : Math.max(0, -step) * 0.9;
  pose.kneeR.rx = limpR || fallen ? 1.2 : Math.max(0, step) * 0.9;
  pose.spine.rx = fallen ? 0.85 : live.state === "clap" ? -0.25 : 0;
  pose.pack.rx = fallen ? 0.4 : live.state === "stomp" ? 0.35 : 0;
  pose.shL.rx = live.state === "missile" ? -0.55 : live.state === "swipe" ? -0.9 : live.state === "clap" ? -0.2 : 0.15;
  pose.shR.rx = live.state === "missile" ? -0.55 : live.state === "swipe" ? 0.9 : live.state === "clap" ? -0.2 : 0.15;
  pose.shL.ry = live.state === "clap" && live.strike ? 0.7 : 0;
  pose.shR.ry = live.state === "clap" && live.strike ? -0.7 : 0;
  if ((live.parts.armL ?? 1) <= 0) pose.shL.rx = 1.2;
  if ((live.parts.armR ?? 1) <= 0) pose.shR.rx = 1.2;
}

function poseUnbound(live: RobotLive, t: number) {
  const pose = live.pose;
  const fallen = live.state === "fallen";
  const clap = live.state === "clap" && live.strike;
  const grab = live.state === "grab";
  const launch = live.state === "launch";
  pose.spine.rx = fallen ? 0.9 : clap ? 0.2 : Math.sin(t * 1.6) * 0.06;
  pose.pelvis.ry = fallen ? 0 : Math.sin(t * 1.1) * 0.12;
  pose.shL.rx = launch ? -0.85 : grab ? -0.4 : clap ? 0.15 : Math.sin(t * 2) * 0.2;
  pose.shR.rx = grab ? -1.1 : clap ? 0.15 : Math.sin(t * 2 + 1) * 0.2;
  pose.shL.ry = clap ? 0.95 : 0;
  pose.shR.ry = clap ? -0.95 : 0;
  pose.elL.rx = launch ? 0.4 : 0.15;
  pose.handL.rx = launch && live.strike ? -0.6 : 0;
  pose.wedge.rz = live.state === "unbound" ? Math.sin(t * 8) * 0.25 : 0.2;
  pose.case.rx = live.state === "dump" ? -0.55 : 0;
  if ((live.parts.armL ?? 1) <= 0) pose.shL.rx = 1.4;
  if ((live.parts.armR ?? 1) <= 0) pose.shR.rx = 1.4;
}

function poseKite(live: RobotLive, t: number) {
  const pose = live.pose;
  const fallen = live.state === "fallen";
  const listL = (live.parts.wingL ?? 1) <= 0;
  const listR = (live.parts.wingR ?? 1) <= 0;
  const bank = live.state === "orbit" ? Math.sin(t * 0.9) * 0.28 : 0;
  pose.keel.rz = fallen ? 1.1 : listL ? 0.55 : listR ? -0.55 : bank;
  pose.keel.rx = live.state === "dive" ? 0.55 : fallen ? 0.8 : Math.sin(t * 1.4) * 0.08;
  pose.wingL.rz = listL ? 0.9 : 0.18 + Math.sin(t * 3.2) * 0.12;
  pose.wingR.rz = listR ? -0.9 : -0.18 - Math.sin(t * 3.2) * 0.12;
  pose.rule.rx = live.state === "beam" ? -0.35 : 0.15;
  pose.bayL.rx = live.state === "bay" ? 0.8 : 0;
  pose.bayR.rx = live.state === "bay" ? 0.8 : 0;
  pose.head.rx = live.state === "beam" ? -0.2 : 0;
}

function poseDualis(live: RobotLive, t: number) {
  const pose = live.pose;
  const fallen = live.state === "fallen";
  const walk = live.state === "hunt" || live.state === "split";
  const step = walk ? Math.sin(t * 1.8) : 0;
  pose.stemL.rx = (live.parts.stemL ?? 1) <= 0 ? 0.9 : fallen ? 0.7 : step * 0.25;
  pose.stemR.rx = (live.parts.stemR ?? 1) <= 0 ? 0.9 : fallen ? 0.7 : -step * 0.25;
  pose.platen.rx = fallen ? 0.85 : live.state === "stomp" ? 0.22 : 0;
  pose.bar.rx = live.state === "beam" ? -0.15 : 0;
  pose.core.ry = t * (live.state === "core" ? 4.5 : 1.2);
  pose.head.rx = live.state === "beam" ? -0.25 : 0;
  if ((live.parts.bar ?? 1) <= 0) pose.bar.rx = 1.2;
}

export function poseLive(live: RobotLive, t: number) {
  if (live.id === "unbound") poseUnbound(live, t);
  else if (live.id === "kite") poseKite(live, t);
  else if (live.id === "dualis") poseDualis(live, t);
  else if (live.id === "galley") poseGalley(live, t);
  else poseScaleWalk(live, t);
}

/** Giant stamp-walker. ~52 units to the head. */
export function makeScale() {
  const m = mats();
  const root = new THREE.Group();
  root.name = "scale";

  const pelvis = limb("pelvis");
  add(pelvis, new THREE.BoxGeometry(16, 8, 10), m.paper, 0, 0, 0);
  add(pelvis, new THREE.BoxGeometry(18, 2, 12), m.brass, 0, 5, 0);
  add(pelvis, new THREE.BoxGeometry(6, 3, 8), m.rust, 0, -3, 2);
  add(pelvis, new THREE.CylinderGeometry(1.1, 1.1, 8, 6), m.dark, -5, 0, 5, { rx: Math.PI / 2 });
  add(pelvis, new THREE.CylinderGeometry(1.1, 1.1, 8, 6), m.dark, 5, 0, 5, { rx: Math.PI / 2 });
  root.add(pelvis);

  const spine = limb("spine");
  add(spine, new THREE.BoxGeometry(14, 14, 9), m.paper, 0, 0, 0);
  add(spine, new THREE.BoxGeometry(16, 3, 11), m.rust, 0, 6, 0);
  add(spine, new THREE.BoxGeometry(4, 10, 3), m.brass, -6, 0, 5);
  add(spine, new THREE.BoxGeometry(4, 10, 3), m.brass, 6, 0, 5);
  add(spine, new THREE.BoxGeometry(10, 2, 2), m.ink, 0, 2, 5.2);
  pelvis.add(spine);
  spine.position.set(0, 12, 0);

  const head = limb("head");
  add(head, new THREE.BoxGeometry(10, 8, 8), m.paper, 0, 0, 0, { name: "head" });
  add(head, new THREE.SphereGeometry(1.1, 6, 5), m.ink, -2.2, 1.4, 4);
  add(head, new THREE.SphereGeometry(1.1, 6, 5), m.ink, 2.2, 1.4, 4);
  add(head, new THREE.BoxGeometry(8, 1.4, 2), m.brass, 0, -2, 4);
  add(head, new THREE.BoxGeometry(1.2, 6, 1.2), m.rust, 0, 6, -1);
  add(head, new THREE.BoxGeometry(4, 1, 4), m.gold, 0, 8.4, -1);
  spine.add(head);
  head.position.set(0, 10, 4);

  const pack = limb("pack");
  add(pack, new THREE.BoxGeometry(10, 12, 5), m.brass, 0, 0, 0, { name: "pack" });
  add(pack, new THREE.BoxGeometry(8, 8, 2), m.ink, 0, 0, -2.6);
  add(pack, new THREE.CylinderGeometry(2.2, 2.8, 6, 6), m.rust, 0, 8, 0);
  add(pack, new THREE.BoxGeometry(14, 2, 8), m.dark, 0, -7, 1);
  spine.add(pack);
  pack.position.set(0, 2, -6);

  const makeLeg = (id: "L" | "R", x: number) => {
    const hip = limb(`hip${id}`);
    add(hip, new THREE.BoxGeometry(5, 6, 6), m.dark, 0, 0, 0);
    const knee = limb(`knee${id}`);
    add(knee, new THREE.BoxGeometry(4.2, 14, 4.2), m.brass, 0, -6, 0, { name: `leg${id}` });
    add(knee, new THREE.BoxGeometry(5.5, 2, 5.5), m.rust, 0, -1, 0);
    const foot = limb(`foot${id}`);
    add(foot, new THREE.BoxGeometry(8, 3, 12), m.rust, 0, 0, 2);
    add(foot, new THREE.BoxGeometry(9, 1.2, 13), m.brass, 0, -1.6, 2);
    add(foot, new THREE.BoxGeometry(2, 2, 4), m.ink, 0, 1.2, 6);
    hip.add(knee);
    knee.position.set(0, -2, 0);
    knee.add(foot);
    foot.position.set(0, -12, 0);
    pelvis.add(hip);
    hip.position.set(x, -2, 0);
  };
  makeLeg("L", -6);
  makeLeg("R", 6);

  const makeArm = (id: "L" | "R", x: number) => {
    const sh = limb(`sh${id}`);
    add(sh, new THREE.BoxGeometry(6, 6, 6), m.dark, 0, 0, 0);
    add(sh, new THREE.BoxGeometry(7, 2, 7), m.brass, 0, 3, 0);
    const el = limb(`el${id}`);
    add(el, new THREE.BoxGeometry(5, 4, 12), m.rust, 0, 0, 4, { name: `arm${id}` });
    const hand = limb(`hand${id}`);
    add(hand, new THREE.BoxGeometry(5, 5, 7), m.brass, 0, 0, 3);
    add(hand, new THREE.BoxGeometry(2.4, 2.4, 10), m.ink, 0, 0, 8, { name: `gun${id}` });
    add(hand, new THREE.BoxGeometry(6, 1, 6), m.paper, 0, -2.6, 3);
    sh.add(el);
    el.position.set(0, -4, 0);
    el.add(hand);
    hand.position.set(0, 0, 8);
    spine.add(sh);
    sh.position.set(x, 6, 0);
  };
  makeArm("L", -10);
  makeArm("R", 10);

  root.rotation.y = Math.PI;
  return root;
}

/** Compositor's chase that walked off the stone. Fly the hole. */
export function makeUnbound() {
  const m = mats();
  const root = new THREE.Group();
  root.name = "unbound";

  const pelvis = limb("pelvis");
  add(pelvis, new THREE.BoxGeometry(28, 4, 10), m.lead, 0, 0, 0);
  add(pelvis, new THREE.BoxGeometry(4, 18, 8), m.brass, -14, 8, 0);
  add(pelvis, new THREE.BoxGeometry(4, 18, 8), m.brass, 14, 8, 0);
  add(pelvis, new THREE.CylinderGeometry(2, 2.4, 6, 6), m.rust, -10, -4, 0, { rx: Math.PI / 2 });
  add(pelvis, new THREE.CylinderGeometry(2, 2.4, 6, 6), m.rust, 10, -4, 0, { rx: Math.PI / 2 });
  add(pelvis, new THREE.BoxGeometry(8, 3, 8), m.dark, 0, -3, 0);
  root.add(pelvis);

  const spine = limb("spine");
  add(spine, new THREE.BoxGeometry(30, 4, 10), m.lead, 0, 6, 0);
  add(spine, new THREE.BoxGeometry(4, 16, 8), m.paper, -14, -2, 0);
  add(spine, new THREE.BoxGeometry(4, 16, 8), m.paper, 14, -2, 0);
  add(spine, new THREE.BoxGeometry(22, 1.4, 1.4), m.ink, 0, 2, 5);
  add(spine, new THREE.BoxGeometry(1.4, 14, 1.4), m.ink, -10, -2, 5);
  add(spine, new THREE.BoxGeometry(1.4, 14, 1.4), m.ink, 10, -2, 5);
  pelvis.add(spine);
  spine.position.set(0, 16, 0);

  const head = limb("head");
  add(head, new THREE.BoxGeometry(10, 7, 8), m.paper, 0, 0, 0, { name: "head" });
  add(head, new THREE.SphereGeometry(1.2, 6, 5), m.ink, -2.4, 1.2, 4.2);
  add(head, new THREE.SphereGeometry(1.2, 6, 5), m.ink, 2.4, 1.2, 4.2);
  add(head, new THREE.BoxGeometry(8, 1.2, 2), m.rust, 0, -2.2, 4);
  add(head, new THREE.BoxGeometry(12, 2, 2), m.brass, 0, 4.4, 0);
  spine.add(head);
  head.position.set(0, 8, 5);

  const kase = limb("case");
  add(kase, new THREE.BoxGeometry(14, 12, 6), m.dark, 0, 0, 0, { name: "case" });
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 4; j++) {
      add(kase, new THREE.BoxGeometry(2.2, 2.2, 1.2), m.lead, -4.5 + j * 3, -3 + i * 3.2, -3.2);
    }
  }
  spine.add(kase);
  kase.position.set(0, 0, -7);

  const wedge = limb("wedge");
  add(wedge, new THREE.BoxGeometry(6, 14, 5), m.gold, 0, 0, 0, { name: "wedge" });
  add(wedge, new THREE.BoxGeometry(8, 3, 7), m.rust, 0, 6, 0);
  add(wedge, new THREE.ConeGeometry(3.2, 8, 6), m.brass, 0, -8, 0);
  add(wedge, new THREE.BoxGeometry(2, 2, 8), m.ink, 0, 2, 4);
  spine.add(wedge);
  wedge.position.set(8, -2, -2);

  const makeArm = (id: "L" | "R", x: number) => {
    const sh = limb(`sh${id}`);
    add(sh, new THREE.BoxGeometry(7, 7, 7), m.dark, 0, 0, 0);
    add(sh, new THREE.BoxGeometry(8, 2, 8), m.brass, 0, 3.6, 0);
    const el = limb(`el${id}`);
    add(el, new THREE.BoxGeometry(4, 4, 16), m.lead, 0, 0, 6, { name: `arm${id}` });
    add(el, new THREE.BoxGeometry(5, 1.2, 14), m.ink, 0, 2.2, 6);
    const hand = limb(`hand${id}`);
    add(hand, new THREE.BoxGeometry(5, 5, 8), m.rust, 0, 0, 4);
    add(hand, new THREE.BoxGeometry(2, 2, 12), m.ink, 0, 0, 10);
    add(hand, new THREE.BoxGeometry(7, 1.4, 4), m.brass, 0, -2.6, 4);
    add(hand, new THREE.BoxGeometry(1.4, 5, 1.4), m.paper, -2.4, -4, 5);
    add(hand, new THREE.BoxGeometry(1.4, 5, 1.4), m.paper, 0, -4, 5);
    add(hand, new THREE.BoxGeometry(1.4, 5, 1.4), m.paper, 2.4, -4, 5);
    sh.add(el);
    el.position.set(id === "L" ? -10 : 10, -2, 2);
    el.add(hand);
    hand.position.set(id === "L" ? -10 : 10, 0, 6);
    spine.add(sh);
    sh.position.set(x, 4, 0);
  };
  makeArm("L", -16);
  makeArm("R", 16);

  root.rotation.y = Math.PI;
  return root;
}

/** Frozen sail. Brass membranes, hanging keel, Serif bays. */
export function makeKite() {
  const m = mats();
  const root = new THREE.Group();
  root.name = "kite";

  const keel = limb("keel");
  add(keel, new THREE.BoxGeometry(8, 16, 6), m.ice, 0, 0, 0, { name: "keel" });
  add(keel, new THREE.BoxGeometry(6, 10, 4), m.lead, 0, -4, 0);
  add(keel, new THREE.ConeGeometry(3, 10, 6), m.brass, 0, -14, 0);
  add(keel, new THREE.BoxGeometry(10, 2, 8), m.gold, 0, 7, 0);
  add(keel, new THREE.CylinderGeometry(1.4, 2, 6, 6), m.ink, 0, -2, -4, { rx: Math.PI / 2, name: "engine" });
  root.add(keel);

  const spine = limb("spine");
  add(spine, new THREE.BoxGeometry(10, 6, 10), m.paper, 0, 0, 0);
  add(spine, new THREE.BoxGeometry(8, 2, 12), m.brass, 0, 3, 2);
  keel.add(spine);
  spine.position.set(0, 8, 0);

  const head = limb("head");
  add(head, new THREE.BoxGeometry(8, 6, 8), m.paper, 0, 0, 0, { name: "head" });
  add(head, new THREE.SphereGeometry(1.1, 6, 5), m.ink, -2, 1.2, 4.2);
  add(head, new THREE.SphereGeometry(1.1, 6, 5), m.ink, 2, 1.2, 4.2);
  add(head, new THREE.BoxGeometry(7, 1, 2), m.gold, 0, -2, 4);
  add(head, new THREE.ConeGeometry(1.6, 5, 5), m.ice, 0, 4.5, 0);
  spine.add(head);
  head.position.set(0, 4, 8);

  const rule = limb("rule");
  add(rule, new THREE.BoxGeometry(2, 2, 22), m.gold, 0, 0, 8, { name: "rule" });
  add(rule, new THREE.BoxGeometry(3, 3, 4), m.ink, 0, 0, 18);
  add(rule, new THREE.BoxGeometry(5, 1, 5), m.brass, 0, 0, 0);
  spine.add(rule);
  rule.position.set(0, 2, 12);

  const makeWing = (id: "L" | "R", x: number) => {
    const w = limb(`wing${id}`);
    add(w, new THREE.BoxGeometry(28, 1.2, 16), m.ice, id === "L" ? -8 : 8, 0, 0, { name: `wing${id}` });
    add(w, new THREE.BoxGeometry(22, 0.6, 10), m.brass, id === "L" ? -10 : 10, 0.6, -2);
    add(w, new THREE.BoxGeometry(18, 0.5, 6), m.gold, id === "L" ? -12 : 12, -0.5, 3);
    add(w, new THREE.BoxGeometry(2, 4, 12), m.lead, id === "L" ? 4 : -4, 0, 0);
    add(w, new THREE.BoxGeometry(8, 0.8, 2), m.ink, id === "L" ? -18 : 18, 0.4, 6);
    spine.add(w);
    w.position.set(x, 2, -2);
  };
  makeWing("L", -18);
  makeWing("R", 18);

  const makeBay = (id: "L" | "R", x: number) => {
    const b = limb(`bay${id}`);
    add(b, new THREE.BoxGeometry(8, 5, 8), m.dark, 0, 0, 0, { name: `bay${id}` });
    add(b, new THREE.BoxGeometry(7, 1.2, 7), m.rust, 0, -2.6, 0);
    add(b, new THREE.BoxGeometry(3, 3, 3), m.ink, 0, -1, 3);
    keel.add(b);
    b.position.set(x, -6, 0);
  };
  makeBay("L", -8);
  makeBay("R", 8);

  root.rotation.y = Math.PI;
  return root;
}

/** The Press stood up. Two ones, a bar, the Fool in the platen. */
export function makeDualis() {
  const m = mats();
  const root = new THREE.Group();
  root.name = "dualis";

  const platen = limb("platen");
  add(platen, new THREE.BoxGeometry(32, 6, 16), m.dark, 0, 0, 0);
  add(platen, new THREE.BoxGeometry(34, 2, 18), m.brass, 0, 3.5, 0);
  add(platen, new THREE.BoxGeometry(28, 2, 14), m.rust, 0, -3.2, 0);
  add(platen, new THREE.BoxGeometry(8, 8, 8), m.lead, 0, 0, -6);
  add(platen, new THREE.CylinderGeometry(2.2, 2.8, 8, 6), m.ink, -10, -6, 4, { rx: Math.PI / 2 });
  add(platen, new THREE.CylinderGeometry(2.2, 2.8, 8, 6), m.ink, 10, -6, 4, { rx: Math.PI / 2 });
  root.add(platen);

  const makeStem = (id: "L" | "R", x: number) => {
    const st = limb(`stem${id}`);
    add(st, new THREE.BoxGeometry(6, 28, 6), m.rust, 0, 0, 0, { name: `stem${id}` });
    add(st, new THREE.BoxGeometry(8, 4, 8), m.brass, 0, 12, 0);
    add(st, new THREE.BoxGeometry(10, 3, 5), m.paper, 0, 15, 2);
    add(st, new THREE.BoxGeometry(3, 6, 3), m.lead, id === "L" ? -4 : 4, 8, 0);
    const gun = limb(`gun${id}`);
    add(gun, new THREE.BoxGeometry(3, 3, 12), m.ink, 0, 0, 6);
    add(gun, new THREE.BoxGeometry(5, 5, 4), m.dark, 0, 0, 0);
    st.add(gun);
    gun.position.set(0, 8, 6);
    platen.add(st);
    st.position.set(x, 14, 0);
  };
  makeStem("L", -12);
  makeStem("R", 12);

  const bar = limb("bar");
  add(bar, new THREE.BoxGeometry(30, 5, 8), m.rust, 0, 0, 0, { name: "bar" });
  add(bar, new THREE.BoxGeometry(32, 2, 10), m.gold, 0, 2.4, 0);
  add(bar, new THREE.BoxGeometry(4, 4, 14), m.ink, 0, 0, 6);
  add(bar, new THREE.BoxGeometry(26, 1.2, 2), m.paper, 0, -2.4, 4);
  platen.add(bar);
  bar.position.set(0, 28, 2);

  const head = limb("head");
  add(head, new THREE.BoxGeometry(12, 8, 8), m.paper, 0, 0, 0, { name: "head" });
  add(head, new THREE.SphereGeometry(1.4, 6, 5), m.ink, -2.6, 1.4, 4.4);
  add(head, new THREE.SphereGeometry(1.4, 6, 5), m.ink, 2.6, 1.4, 4.4);
  add(head, new THREE.BoxGeometry(10, 1.6, 2), m.gold, 0, -2.4, 4);
  add(head, new THREE.ConeGeometry(2.2, 6, 6), m.rust, 0, 6, 0);
  bar.add(head);
  head.position.set(0, 6, 6);

  const core = limb("core");
  add(core, new THREE.TorusGeometry(5.5, 2.2, 6, 12), m.paper, 0, 0, 0, { name: "core" });
  add(core, new THREE.SphereGeometry(3.2, 8, 6), m.ink, 0, 0, 0);
  add(core, new THREE.BoxGeometry(2, 10, 2), m.gold, 0, 0, 0);
  add(core, new THREE.BoxGeometry(10, 2, 2), m.gold, 0, 0, 0);
  platen.add(core);
  core.position.set(0, 10, -4);

  root.rotation.y = Math.PI;
  return root;
}

export function poseRobot(node: THREE.Object3D, live: RobotLive) {
  for (const [id, p] of Object.entries(live.pose)) {
    const j = node.getObjectByName(id);
    if (!j) continue;
    j.rotation.x = p.rx;
    j.rotation.y = p.ry;
    j.rotation.z = p.rz;
  }
  const hidden = new Set(live.hide);
  const glowing = new Set(live.glow);
  const pulse = 1 + Math.sin((live.phase + 1) * 8 + live.hold * 9) * 0.05;
  for (const [id, hp] of Object.entries(live.parts)) {
    const mesh = node.getObjectByName(id);
    if (!mesh) continue;
    mesh.visible = hp > 0 && !hidden.has(id);
    mesh.scale.setScalar(glowing.has(id) && mesh.visible ? pulse : 1);
  }
}

export function makeRobotMesh(id: string) {
  if (id === "unbound") return makeUnbound();
  if (id === "kite") return makeKite();
  if (id === "dualis") return makeDualis();
  if (id === "galley") return makeGalley();
  return makeScale();
}
