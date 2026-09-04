/** Giant robot defs and meshes. Type-metal walkers. Never Nintendo names. */

import * as THREE from "three";
import { bootRobot, type BrainCtx, type RobotDef, type RobotLive } from "./brain";
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
  { id: "legL", joint: "footL", hp: 8, mark: true, destroyable: true, radius: 8 },
  { id: "legR", joint: "footR", hp: 8, mark: true, destroyable: true, radius: 8 },
  { id: "armL", joint: "handL", hp: 6, mark: true, destroyable: true, radius: 7 },
  { id: "armR", joint: "handR", hp: 6, mark: true, destroyable: true, radius: 7 },
  { id: "pack", joint: "pack", hp: 14, mark: true, destroyable: true, radius: 9, kill: true },
  { id: "head", joint: "head", hp: 10, mark: true, destroyable: false, radius: 7 },
];

function scaleStanding(ctx: BrainCtx) {
  if ((ctx.parts.legL ?? 1) <= 0 || (ctx.parts.legR ?? 1) <= 0) return "topple";
  if (ctx.dist < 70) return "stomp";
  return "missile";
}

export const SCALE: RobotDef = {
  id: "scale",
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

export function robotOf(id: string): RobotDef | null {
  if (id === "scale") return SCALE;
  return null;
}

export function bootScale(): RobotLive {
  return bootRobot(SCALE);
}

export function scaleCtx(
  e: { x: number; z: number; t: number; robot?: RobotLive },
  px: number,
  pz: number,
): BrainCtx {
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
  pose.spine.rx = fallen ? 0.85 : 0;
  pose.pack.rx = fallen ? 0.4 : 0;
  pose.shL.rx = live.state === "missile" ? -0.55 : 0.15;
  pose.shR.rx = live.state === "missile" ? -0.55 : 0.15;
  if ((live.parts.armL ?? 1) <= 0) pose.shL.rx = 1.2;
  if ((live.parts.armR ?? 1) <= 0) pose.shR.rx = 1.2;
}

export function scaleWorld(e: { x: number; z: number; robot?: RobotLive }) {
  if (!e.robot) return {};
  return fk(SCALE.joints, e.robot.pose, { x: e.x, y: 0, z: e.z, yaw: e.robot.yaw });
}

function mats() {
  return {
    brass: n64Mat(0xffe08a, { map: brassTex() }),
    rust: n64Mat(0xff8060, { map: rustTex() }),
    ink: n64Mat(INK, { emissive: INK, glow: 0.9 }),
    dark: n64Mat(0x4a4038),
    paper: n64Mat(0xf0e4c4),
  };
}

function limb(name: string) {
  const g = new THREE.Group();
  g.name = name;
  return g;
}

/** Giant stamp-walker. ~52 units to the head. */
export function makeScale() {
  const m = mats();
  const root = new THREE.Group();
  root.name = "scale";

  const pelvis = limb("pelvis");
  add(pelvis, new THREE.BoxGeometry(16, 8, 10), m.paper, 0, 0, 0);
  add(pelvis, new THREE.BoxGeometry(18, 2, 12), m.brass, 0, 5, 0);
  root.add(pelvis);

  const spine = limb("spine");
  add(spine, new THREE.BoxGeometry(14, 14, 9), m.paper, 0, 0, 0);
  add(spine, new THREE.BoxGeometry(16, 3, 11), m.rust, 0, 6, 0);
  pelvis.add(spine);
  spine.position.set(0, 12, 0);

  const head = limb("head");
  add(head, new THREE.BoxGeometry(10, 8, 8), m.paper, 0, 0, 0, { name: "head" });
  add(head, new THREE.SphereGeometry(1.1, 6, 5), m.ink, -2.2, 1.4, 4);
  add(head, new THREE.SphereGeometry(1.1, 6, 5), m.ink, 2.2, 1.4, 4);
  add(head, new THREE.BoxGeometry(8, 1.4, 2), m.brass, 0, -2, 4);
  spine.add(head);
  head.position.set(0, 10, 4);

  const pack = limb("pack");
  add(pack, new THREE.BoxGeometry(10, 12, 5), m.brass, 0, 0, 0, { name: "pack" });
  add(pack, new THREE.BoxGeometry(8, 8, 2), m.ink, 0, 0, -2.6);
  spine.add(pack);
  pack.position.set(0, 2, -6);

  const makeLeg = (id: "L" | "R", x: number) => {
    const hip = limb(`hip${id}`);
    add(hip, new THREE.BoxGeometry(5, 6, 6), m.dark, 0, 0, 0);
    const knee = limb(`knee${id}`);
    add(knee, new THREE.BoxGeometry(4.2, 14, 4.2), m.brass, 0, -6, 0, { name: `leg${id}` });
    const foot = limb(`foot${id}`);
    add(foot, new THREE.BoxGeometry(6, 3, 10), m.rust, 0, 0, 2);
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
    const el = limb(`el${id}`);
    add(el, new THREE.BoxGeometry(5, 4, 12), m.rust, 0, 0, 4, { name: `arm${id}` });
    const hand = limb(`hand${id}`);
    add(hand, new THREE.BoxGeometry(4, 4, 6), m.brass, 0, 0, 3);
    add(hand, new THREE.BoxGeometry(2, 2, 8), m.ink, 0, 0, 7, { name: `gun${id}` });
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

export function poseRobot(node: THREE.Object3D, live: RobotLive) {
  for (const [id, p] of Object.entries(live.pose)) {
    const j = node.getObjectByName(id);
    if (!j) continue;
    j.rotation.x = p.rx;
    j.rotation.y = p.ry;
    j.rotation.z = p.rz;
  }
  for (const part of ["legL", "legR", "armL", "armR", "pack"] as const) {
    const mesh = node.getObjectByName(part);
    if (mesh) mesh.visible = (live.parts[part] ?? 1) > 0;
  }
}

export function makeRobotMesh(id: string) {
  if (id === "scale") return makeScale();
  return makeScale();
}
