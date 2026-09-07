/** The Galley — Dualis’s foundry-colossus. Type-metal. Never Nintendo names. */

import * as THREE from "three";
import { bootRobot, type BrainCtx, type RobotDef, type RobotLive } from "./brain";
import type { JointDef, PartDef } from "./rig";
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
    ink: n64Mat(INK, { emissive: INK, glow: 0.95 }),
    dark: n64Mat(0x3a342e),
    paper: n64Mat(0xf0e4c4),
    lead: n64Mat(0xb8c8d4),
    gold: n64Mat(0xffe08a, { emissive: 0xc8a040, glow: 0.5 }),
  };
}

function limb(name: string) {
  const g = new THREE.Group();
  g.name = name;
  return g;
}

const JOINTS: JointDef[] = [
  { id: "platen", parent: null, bind: { x: 0, y: 0, z: 0 } },
  { id: "spine", parent: "platen", bind: { x: 0, y: 14, z: 0 } },
  { id: "head", parent: "spine", bind: { x: 0, y: 14, z: 5 } },
  { id: "visor", parent: "head", bind: { x: 0, y: 1, z: 6 } },
  { id: "hatch", parent: "spine", bind: { x: 0, y: 0, z: 7 } },
  { id: "core", parent: "hatch", bind: { x: 0, y: 0, z: 3 } },
  { id: "hipL", parent: "platen", bind: { x: -11, y: -4, z: 0 } },
  { id: "kneeL", parent: "hipL", bind: { x: 0, y: -4, z: 0 } },
  { id: "ankleL", parent: "kneeL", bind: { x: 0, y: -14, z: 0 } },
  { id: "footL", parent: "ankleL", bind: { x: 0, y: -12, z: 0 } },
  { id: "hipR", parent: "platen", bind: { x: 11, y: -4, z: 0 } },
  { id: "kneeR", parent: "hipR", bind: { x: 0, y: -4, z: 0 } },
  { id: "ankleR", parent: "kneeR", bind: { x: 0, y: -14, z: 0 } },
  { id: "footR", parent: "ankleR", bind: { x: 0, y: -12, z: 0 } },
  { id: "shL", parent: "spine", bind: { x: -18, y: 8, z: 0 } },
  { id: "elL", parent: "shL", bind: { x: -14, y: -6, z: 2 } },
  { id: "handL", parent: "elL", bind: { x: -12, y: 0, z: 8 } },
  { id: "palmL", parent: "handL", bind: { x: 0, y: 0, z: 8 } },
  { id: "shR", parent: "spine", bind: { x: 18, y: 8, z: 0 } },
  { id: "elR", parent: "shR", bind: { x: 14, y: -6, z: 2 } },
  { id: "handR", parent: "elR", bind: { x: 12, y: 0, z: 8 } },
  { id: "palmR", parent: "handR", bind: { x: 0, y: 0, z: 8 } },
  { id: "tail0", parent: "platen", bind: { x: 0, y: 2, z: -10 } },
  { id: "tail1", parent: "tail0", bind: { x: 0, y: -3, z: -11 } },
  { id: "tail2", parent: "tail1", bind: { x: 0, y: -2, z: -11 } },
  { id: "tail3", parent: "tail2", bind: { x: 0, y: 0, z: -11 } },
  { id: "tail4", parent: "tail3", bind: { x: 0, y: 3, z: -10 } },
];

const PARTS: PartDef[] = [
  { id: "palmL", joint: "palmL", hp: 10, mark: true, destroyable: true, radius: 9, breakRadio: { who: "s", text: "A quad left the stick." } },
  { id: "palmR", joint: "palmR", hp: 10, mark: true, destroyable: true, radius: 9, breakRadio: { who: "s", text: "A quad left the stick." } },
  {
    id: "ankleL",
    joint: "ankleL",
    hp: 8,
    mark: true,
    destroyable: true,
    radius: 8,
    support: true,
    breakRadio: { who: "b", text: "A stem piston. It lists." },
  },
  {
    id: "ankleR",
    joint: "ankleR",
    hp: 8,
    mark: true,
    destroyable: true,
    radius: 8,
    support: true,
    breakRadio: { who: "b", text: "A stem piston. It lists." },
  },
  { id: "tail2", joint: "tail2", hp: 6, mark: true, destroyable: true, radius: 7, breakRadio: { who: "e", text: "A slug off the galley." } },
  { id: "tail4", joint: "tail4", hp: 6, mark: true, destroyable: true, radius: 7, breakRadio: { who: "e", text: "The rail is remainder." } },
  { id: "visor", joint: "visor", hp: 99, mark: true, destroyable: false, radius: 8 },
  { id: "hatch", joint: "hatch", hp: 14, mark: true, destroyable: true, radius: 9, breakRadio: { who: "s", text: "The hatch sheared. The Fool is in the platen." } },
  { id: "core", joint: "core", hp: 20, mark: true, destroyable: true, radius: 8, kill: true },
  { id: "head", joint: "head", hp: 8, mark: true, destroyable: false, radius: 8 },
];

const LIVE_MARKS = ["palmL", "palmR", "tail2", "tail4", "visor"];
const STOMP_MARKS = ["ankleL", "ankleR", "palmL", "palmR", "visor"];
const OPEN_MARKS = ["hatch", "visor", "head"];
const CORE_MARKS = ["core"];

function palmsUp(ctx: BrainCtx) {
  return ((ctx.parts.palmL ?? 1) > 0 ? 1 : 0) + ((ctx.parts.palmR ?? 1) > 0 ? 1 : 0);
}
function anklesUp(ctx: BrainCtx) {
  return ((ctx.parts.ankleL ?? 1) > 0 ? 1 : 0) + ((ctx.parts.ankleR ?? 1) > 0 ? 1 : 0);
}

function galleyLive(ctx: BrainCtx) {
  if ((ctx.parts.core ?? 1) <= 0) return "fallen";
  if ((ctx.parts.hatch ?? 1) <= 0) return "core";
  if (palmsUp(ctx) === 0 || anklesUp(ctx) === 0) return anklesUp(ctx) === 0 ? "topple" : "open";
  if (ctx.dist < 44) return "stomp";
  if (ctx.dist < 58 && palmsUp(ctx) === 2) return "clap";
  if (ctx.dist < 86 && palmsUp(ctx) > 0) return ctx.t % 6 < 2.4 ? "punch" : "swipe";
  if ((ctx.parts.tail2 ?? 1) > 0 && ctx.t % 8 < 2.1) return "tail";
  if (palmsUp(ctx) > 0 && ctx.t % 7 < 1.6) return "launch";
  return "volley";
}

function galleyOpen(ctx: BrainCtx) {
  if ((ctx.parts.hatch ?? 1) <= 0) return "core";
  if (ctx.dist < 50) return "vacuum";
  if (palmsUp(ctx) > 0 && ctx.t % 6 < 1.7) return "hands";
  if (ctx.dist < 70) return "shock";
  return "hatchBeam";
}

export const GALLEY: RobotDef = {
  id: "galley",
  name: "Galley",
  joints: JOINTS,
  parts: PARTS,
  start: "hunt",
  walkSpeed: 15,
  height: 80,
  hoverY: 32,
  states: {
    hunt: {
      id: "hunt",
      telegraph: 0,
      hold: 2.1,
      vulnerable: LIVE_MARKS,
      move: "walk",
      next: galleyLive,
    },
    volley: {
      id: "volley",
      telegraph: 0.45,
      hold: 0.9,
      vulnerable: [...LIVE_MARKS, "head"],
      move: "stand",
      attack: { kind: "volley", from: "visor", n: 5, spread: 0.24 },
      radio: { who: "!", text: "I will round you down." },
      next: galleyLive,
    },
    swipe: {
      id: "swipe",
      telegraph: 0.5,
      hold: 0.55,
      vulnerable: ["palmL", "palmR", "visor"],
      move: "stand",
      attack: { kind: "swipe", arm: "both", arc: 1.6 },
      radio: { who: "s", text: "A slash from the stick. Stay off the arc." },
      next: galleyLive,
    },
    punch: {
      id: "punch",
      telegraph: 0.55,
      hold: 0.5,
      vulnerable: ["palmL", "palmR", "visor"],
      move: "lunge",
      attack: { kind: "punch", arm: "R" },
      radio: { who: "b", text: "The fist. Don’t kiss the quad." },
      next: galleyLive,
    },
    clap: {
      id: "clap",
      telegraph: 0.75,
      hold: 0.42,
      vulnerable: ["hatch", "visor"],
      move: "stand",
      attack: { kind: "clap" },
      radio: { who: "s", text: "The quads will meet. Don’t sit between." },
      next: galleyLive,
    },
    stomp: {
      id: "stomp",
      telegraph: 0.7,
      hold: 0.55,
      vulnerable: STOMP_MARKS,
      move: "stand",
      attack: { kind: "stomp", radius: 34 },
      radio: { who: "b", text: "Stems. Ankles after the stamp." },
      next: galleyLive,
    },
    launch: {
      id: "launch",
      telegraph: 0.6,
      hold: 1.0,
      vulnerable: ["palmL", "palmR", "visor"],
      move: "stand",
      attack: { kind: "launchArm", arm: "L" },
      radio: { who: "s", text: "A stick left the galley. It still writes." },
      next: galleyLive,
    },
    tail: {
      id: "tail",
      telegraph: 0.65,
      hold: 1.15,
      vulnerable: ["tail2", "tail4", "visor"],
      move: "stand",
      attack: { kind: "tailBeam", from: "tail2" },
      radio: { who: "e", text: "The rail. A line of ink down the slugs." },
      next: galleyLive,
    },
    stun: {
      id: "stun",
      telegraph: 0,
      hold: 1.05,
      vulnerable: ["palmL", "palmR", "ankleL", "ankleR", "hatch"],
      move: "stand",
      radio: { who: "s", text: "The visor flinched. Write now." },
      next: galleyLive,
    },
    topple: {
      id: "topple",
      telegraph: 0,
      hold: 1.2,
      vulnerable: OPEN_MARKS,
      move: "topple",
      radio: { who: "b", text: "Both pistons. The hatch is the letter." },
      next: () => "open",
    },
    open: {
      id: "open",
      telegraph: 0,
      hold: 1.8,
      vulnerable: OPEN_MARKS,
      move: "strafe",
      next: galleyOpen,
    },
    shock: {
      id: "shock",
      telegraph: 0.6,
      hold: 0.55,
      vulnerable: OPEN_MARKS,
      move: "stand",
      attack: { kind: "shock", radius: 40 },
      radio: { who: "b", text: "Both fists. The page slams." },
      next: galleyOpen,
    },
    vacuum: {
      id: "vacuum",
      telegraph: 0.7,
      hold: 1.35,
      vulnerable: ["hatch", "core", "visor"],
      move: "stand",
      attack: { kind: "vacuum", range: 110 },
      radio: { who: "s", text: "The hatch drinks. Boost out, or feed it a dash." },
      next: galleyOpen,
    },
    hatchBeam: {
      id: "hatchBeam",
      telegraph: 0.55,
      hold: 1.1,
      vulnerable: OPEN_MARKS,
      move: "hover",
      attack: { kind: "beam", from: "hatch", duration: 1.05 },
      radio: { who: "s", text: "From the hatch. Don’t sit in it." },
      next: galleyOpen,
    },
    hands: {
      id: "hands",
      telegraph: 0.4,
      hold: 1.4,
      vulnerable: ["palmL", "palmR", "hatch"],
      move: "hover",
      attack: { kind: "handsFree" },
      radio: { who: "s", text: "The quads fly free. Cut them, then the hatch." },
      next: galleyOpen,
    },
    core: {
      id: "core",
      telegraph: 0.25,
      hold: 1.05,
      vulnerable: CORE_MARKS,
      move: "orbit",
      attack: { kind: "dump", n: 7 },
      radio: { who: "c", text: "The Fool. Hit the blank." },
      next: (ctx) => ((ctx.parts.core ?? 1) <= 0 ? "fallen" : "core"),
    },
    fallen: {
      id: "fallen",
      telegraph: 0,
      hold: 99,
      vulnerable: CORE_MARKS,
      move: "fallen",
      next: () => "fallen",
    },
  },
};

export function bootGalley(): RobotLive {
  return bootRobot(GALLEY);
}

function uStrike(live: RobotLive) {
  return live.strike ? 1 : 0.42;
}

export function poseGalley(live: RobotLive, t: number) {
  const p = live.pose;
  const fallen = live.state === "fallen" || live.state === "topple";
  const walk = live.state === "hunt";
  const step = walk ? Math.sin(t * 2.05) : 0;
  const u = uStrike(live);
  const limpL = (live.parts.ankleL ?? 1) <= 0;
  const limpR = (live.parts.ankleR ?? 1) <= 0;
  const noPalmL = (live.parts.palmL ?? 1) <= 0;
  const noPalmR = (live.parts.palmR ?? 1) <= 0;

  p.hipL.rx = limpL || fallen ? 0.95 : step * 0.55;
  p.hipR.rx = limpR || fallen ? 0.95 : -step * 0.55;
  p.kneeL.rx = limpL || fallen ? 1.15 : Math.max(0, -step) * 0.85;
  p.kneeR.rx = limpR || fallen ? 1.15 : Math.max(0, step) * 0.85;
  p.ankleL.rx = live.state === "stomp" ? -0.35 * u : limpL ? 0.4 : -step * 0.2;
  p.ankleR.rx = live.state === "stomp" ? -0.35 * u : limpR ? 0.4 : step * 0.2;
  p.platen.rx = fallen ? 0.85 : live.state === "stomp" ? 0.28 * u : live.state === "shock" ? 0.32 * u : 0;
  p.spine.rx = fallen ? 0.35 : live.state === "vacuum" ? -0.25 : Math.sin(t * 1.3) * 0.05;
  p.head.rx = live.state === "volley" || live.state === "hatchBeam" ? -0.22 * u : live.state === "stun" ? 0.35 : 0;
  p.visor.rx = live.state === "stun" ? 0.4 : live.state === "volley" ? -0.15 : 0;

  p.shL.rx = walk ? -step * 0.35 : 0.12;
  p.shR.rx = walk ? step * 0.35 : 0.12;
  p.shL.ry = 0;
  p.shR.ry = 0;
  p.elL.rx = 0.1;
  p.elR.rx = 0.1;

  if (live.state === "swipe") {
    p.shL.rx = -0.95 * u;
    p.shR.rx = 0.95 * u;
    p.shL.ry = 0.4 * u;
    p.shR.ry = -0.4 * u;
  }
  if (live.state === "punch") {
    p.shR.rx = -1.15 * u;
    p.elR.rx = 0.5 * u;
    p.handR.rx = -0.3 * u;
    p.shL.rx = 0.45;
  }
  if (live.state === "clap") {
    p.shL.ry = 0.95 * u;
    p.shR.ry = -0.95 * u;
    p.shL.rx = -0.2;
    p.shR.rx = -0.2;
  }
  if (live.state === "launch" || live.state === "hands") {
    p.shL.rx = -0.9 * u;
    p.elL.rx = 0.55;
  }
  if (live.state === "shock") {
    p.shL.rx = 0.85 * u;
    p.shR.rx = 0.85 * u;
  }
  if (live.state === "stomp") {
    p.hipL.rx = -0.15;
    p.hipR.rx = -0.15;
    p.kneeL.rx = 0.2;
    p.kneeR.rx = 0.2;
  }

  const tail = live.state === "tail" ? 0.45 * u : Math.sin(t * 1.6) * 0.18;
  p.tail0.rx = fallen ? 0.6 : tail;
  p.tail1.rx = fallen ? 0.4 : tail * 0.8 + Math.sin(t * 1.6 + 0.4) * 0.12;
  p.tail2.rx = Math.sin(t * 1.6 + 0.8) * 0.14;
  p.tail3.rx = Math.sin(t * 1.6 + 1.2) * 0.12;
  p.tail4.rx = live.state === "tail" ? -0.35 * u : Math.sin(t * 2.1) * 0.1;

  p.hatch.rx = live.state === "vacuum" || live.state === "open" || live.state === "hatchBeam" || live.state === "core" ? -0.55 : 0;
  p.core.ry = t * (live.state === "core" ? 5.2 : 1.4);

  if (noPalmL) p.shL.rx = 1.25;
  if (noPalmR) p.shR.rx = 1.25;
}

/** Foundry-colossus. ~80 units. Palms, pistons, galley-tail, Fool in the hatch. */
export function makeGalley() {
  const m = mats();
  const root = new THREE.Group();
  root.name = "galley";

  const platen = limb("platen");
  add(platen, new THREE.BoxGeometry(36, 8, 20), m.dark, 0, 0, 0);
  add(platen, new THREE.BoxGeometry(38, 2.4, 22), m.brass, 0, 4.4, 0);
  add(platen, new THREE.BoxGeometry(32, 2, 16), m.rust, 0, -4.2, 0);
  add(platen, new THREE.BoxGeometry(10, 6, 10), m.lead, 0, 0, -8);
  add(platen, new THREE.CylinderGeometry(2.4, 3, 10, 6), m.ink, -12, -6, 6, { rx: Math.PI / 2 });
  add(platen, new THREE.CylinderGeometry(2.4, 3, 10, 6), m.ink, 12, -6, 6, { rx: Math.PI / 2 });
  for (const x of [-14, -7, 0, 7, 14]) {
    add(platen, new THREE.BoxGeometry(2.2, 1.2, 8), m.gold, x, 5.2, 6);
  }
  root.add(platen);

  const spine = limb("spine");
  add(spine, new THREE.BoxGeometry(22, 18, 14), m.paper, 0, 0, 0);
  add(spine, new THREE.BoxGeometry(24, 3, 16), m.rust, 0, 8, 0);
  add(spine, new THREE.BoxGeometry(8, 14, 4), m.brass, -10, 0, 6);
  add(spine, new THREE.BoxGeometry(8, 14, 4), m.brass, 10, 0, 6);
  add(spine, new THREE.BoxGeometry(16, 2, 2), m.ink, 0, 2, 7.4);
  add(spine, new THREE.CylinderGeometry(1.4, 1.4, 12, 6), m.dark, -8, 0, -7, { rx: Math.PI / 2 });
  add(spine, new THREE.CylinderGeometry(1.4, 1.4, 12, 6), m.dark, 8, 0, -7, { rx: Math.PI / 2 });
  platen.add(spine);
  spine.position.set(0, 14, 0);

  const head = limb("head");
  add(head, new THREE.BoxGeometry(16, 12, 12), m.paper, 0, 0, 0, { name: "head" });
  add(head, new THREE.BoxGeometry(20, 3, 6), m.gold, 0, 7, 2);
  add(head, new THREE.BoxGeometry(4, 8, 4), m.rust, 0, 10, -2);
  add(head, new THREE.ConeGeometry(2.4, 7, 6), m.rust, 0, 16, -2);
  spine.add(head);
  head.position.set(0, 14, 5);

  const visor = limb("visor");
  add(visor, new THREE.BoxGeometry(14, 4, 3), m.gold, 0, 0, 0, { name: "visor" });
  add(visor, new THREE.SphereGeometry(1.5, 6, 5), m.ink, -3.2, 0.4, 2);
  add(visor, new THREE.SphereGeometry(1.5, 6, 5), m.ink, 3.2, 0.4, 2);
  add(visor, new THREE.BoxGeometry(10, 1.2, 2), m.ink, 0, -1.6, 1.6);
  head.add(visor);
  visor.position.set(0, 1, 6);

  const hatch = limb("hatch");
  add(hatch, new THREE.BoxGeometry(12, 12, 3), m.brass, 0, 0, 0, { name: "hatch" });
  add(hatch, new THREE.TorusGeometry(4.2, 1.1, 6, 10), m.gold, 0, 0, 1.4);
  add(hatch, new THREE.BoxGeometry(8, 1.4, 1.4), m.ink, 0, 0, 2);
  add(hatch, new THREE.BoxGeometry(1.4, 8, 1.4), m.ink, 0, 0, 2);
  spine.add(hatch);
  hatch.position.set(0, 0, 7);

  const core = limb("core");
  add(core, new THREE.TorusGeometry(4.6, 1.8, 6, 12), m.paper, 0, 0, 0, { name: "core" });
  add(core, new THREE.SphereGeometry(2.6, 8, 6), m.ink, 0, 0, 0);
  add(core, new THREE.BoxGeometry(1.6, 8, 1.6), m.gold, 0, 0, 0);
  add(core, new THREE.BoxGeometry(8, 1.6, 1.6), m.gold, 0, 0, 0);
  hatch.add(core);
  core.position.set(0, 0, 3);

  const makeLeg = (id: "L" | "R", x: number) => {
    const hip = limb(`hip${id}`);
    add(hip, new THREE.BoxGeometry(8, 8, 8), m.dark, 0, 0, 0);
    add(hip, new THREE.BoxGeometry(9, 2.4, 9), m.brass, 0, 4, 0);
    const knee = limb(`knee${id}`);
    add(knee, new THREE.BoxGeometry(6, 16, 6), m.lead, 0, -6, 0);
    add(knee, new THREE.BoxGeometry(7.5, 3, 7.5), m.rust, 0, 0, 0);
    const ankle = limb(`ankle${id}`);
    add(ankle, new THREE.BoxGeometry(7, 8, 7), m.brass, 0, -2, 0, { name: `ankle${id}` });
    add(ankle, new THREE.CylinderGeometry(2.2, 2.8, 8, 6), m.gold, 0, -2, 0);
    const foot = limb(`foot${id}`);
    add(foot, new THREE.BoxGeometry(10, 4, 16), m.rust, 0, 0, 3);
    add(foot, new THREE.BoxGeometry(12, 1.6, 18), m.brass, 0, -2.2, 3);
    add(foot, new THREE.BoxGeometry(4, 3, 6), m.ink, 0, 1.6, 8);
    hip.add(knee);
    knee.position.set(0, -4, 0);
    knee.add(ankle);
    ankle.position.set(0, -14, 0);
    ankle.add(foot);
    foot.position.set(0, -12, 0);
    platen.add(hip);
    hip.position.set(x, -4, 0);
  };
  makeLeg("L", -11);
  makeLeg("R", 11);

  const makeArm = (id: "L" | "R", x: number) => {
    const sh = limb(`sh${id}`);
    add(sh, new THREE.BoxGeometry(10, 10, 10), m.dark, 0, 0, 0);
    add(sh, new THREE.BoxGeometry(12, 3, 12), m.brass, 0, 5.4, 0);
    add(sh, new THREE.BoxGeometry(4, 8, 4), m.rust, id === "L" ? -6 : 6, 0, 0);
    const el = limb(`el${id}`);
    add(el, new THREE.BoxGeometry(6, 6, 18), m.lead, 0, 0, 6, { name: `arm${id}` });
    add(el, new THREE.BoxGeometry(7, 2, 16), m.ink, 0, 3.2, 6);
    const hand = limb(`hand${id}`);
    add(hand, new THREE.BoxGeometry(8, 8, 8), m.rust, 0, 0, 3);
    add(hand, new THREE.BoxGeometry(3, 3, 12), m.dark, 0, 0, 10);
    const palm = limb(`palm${id}`);
    add(palm, new THREE.BoxGeometry(10, 10, 4), m.gold, 0, 0, 0, { name: `palm${id}` });
    add(palm, new THREE.BoxGeometry(6, 6, 2), m.ink, 0, 0, 2.4);
    add(palm, new THREE.BoxGeometry(2.2, 8, 2.2), m.paper, -3.4, -6, 1);
    add(palm, new THREE.BoxGeometry(2.2, 8, 2.2), m.paper, 0, -6, 1);
    add(palm, new THREE.BoxGeometry(2.2, 8, 2.2), m.paper, 3.4, -6, 1);
    sh.add(el);
    el.position.set(id === "L" ? -14 : 14, -6, 2);
    el.add(hand);
    hand.position.set(id === "L" ? -12 : 12, 0, 8);
    hand.add(palm);
    palm.position.set(0, 0, 8);
    spine.add(sh);
    sh.position.set(x, 8, 0);
  };
  makeArm("L", -18);
  makeArm("R", 18);

  const makeTail = () => {
    const sizes = [8, 7, 6.5, 6, 5];
    const ids = ["tail0", "tail1", "tail2", "tail3", "tail4"] as const;
    const nodes: THREE.Group[] = [];
    for (let i = 0; i < 5; i++) {
      const n = limb(ids[i]);
      add(n, new THREE.BoxGeometry(sizes[i], sizes[i] * 0.7, 12), i % 2 ? m.rust : m.lead, 0, 0, -4, { name: i === 2 || i === 4 ? ids[i] : undefined });
      add(n, new THREE.BoxGeometry(sizes[i] + 1, 1.4, 2), m.gold, 0, sizes[i] * 0.28, -4);
      add(n, new THREE.SphereGeometry(1.1, 6, 5), m.ink, 0, 0, -10);
      if (i === 0) {
        platen.add(n);
        n.position.set(0, 2, -10);
      } else {
        nodes[i - 1].add(n);
        n.position.set(0, i < 3 ? -2 : 1, -11);
      }
      nodes.push(n);
    }
  };
  makeTail();

  root.rotation.y = Math.PI;
  return root;
}
