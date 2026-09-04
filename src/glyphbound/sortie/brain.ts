/** Robot finite-state brains. Telegraph, then strike, then a named next. No three.js. */

import { emptyPose, type JointDef, type PartDef, type RigPose } from "./rig";

export type RobotId = "scale" | "unbound" | "kite" | "dualis";

export type MoveKind = "stand" | "walk" | "strafe" | "hover" | "orbit" | "fallen" | "lunge" | "topple";

export type AttackKind =
  | { kind: "volley"; from: string; n: number; spread: number }
  | { kind: "beam"; from: string; duration: number }
  | { kind: "swipe"; arm: "L" | "R" | "both"; arc: number }
  | { kind: "launchArm"; arm: "L" | "R" }
  | { kind: "stomp"; radius: number }
  | { kind: "grab"; arm: "L" | "R" }
  | { kind: "clap" }
  | { kind: "dump"; n: number }
  | { kind: "bay"; side: "L" | "R" };

export interface BrainCtx {
  t: number;
  dist: number;
  facing: number;
  parts: Record<string, number>;
  phase: number;
}

export interface RobotState {
  id: string;
  telegraph: number;
  hold: number;
  vulnerable: string[];
  move: MoveKind;
  attack?: AttackKind;
  radio?: { who: string; text: string };
  next: (ctx: BrainCtx) => string;
}

export interface RobotDef {
  id: RobotId;
  joints: JointDef[];
  parts: PartDef[];
  states: Record<string, RobotState>;
  start: string;
  walkSpeed: number;
  height: number;
}

export interface RobotLive {
  id: RobotId;
  state: string;
  tele: number;
  hold: number;
  parts: Record<string, number>;
  pose: RigPose;
  yaw: number;
  phase: number;
  glow: string[];
  strike: boolean;
}

export function bootRobot(def: RobotDef): RobotLive {
  const parts: Record<string, number> = {};
  for (const p of def.parts) parts[p.id] = p.hp;
  const st = def.states[def.start];
  return {
    id: def.id,
    state: def.start,
    tele: st.telegraph,
    hold: st.hold,
    parts,
    pose: emptyPose(def.joints),
    yaw: 0,
    phase: 0,
    glow: st.telegraph > 0 ? st.vulnerable.slice() : st.vulnerable.slice(),
    strike: st.telegraph <= 0,
  };
}

export function enterState(live: RobotLive, def: RobotDef, id: string) {
  const st = def.states[id] ?? def.states[def.start];
  live.state = st.id;
  live.tele = st.telegraph;
  live.hold = st.hold;
  live.glow = st.vulnerable.slice();
  live.strike = st.telegraph <= 0;
}

export function tickBrain(live: RobotLive, def: RobotDef, ctx: BrainCtx, dt: number): { radio?: { who: string; text: string }; attack?: AttackKind } {
  const st = def.states[live.state] ?? def.states[def.start];
  let radio: { who: string; text: string } | undefined;
  let attack: AttackKind | undefined;
  if (live.tele > 0) {
    if (live.tele === st.telegraph && st.radio) radio = st.radio;
    live.tele = Math.max(0, live.tele - dt);
    live.strike = false;
    if (live.tele === 0) live.strike = true;
    return { radio };
  }
  live.strike = true;
  live.hold = Math.max(0, live.hold - dt);
  if (st.attack && live.hold > 0) attack = st.attack;
  if (live.hold <= 0) {
    const nid = st.next(ctx);
    if (nid !== live.state) enterState(live, def, nid);
  }
  return { radio, attack };
}

export function killPartsHp(def: RobotDef, live: RobotLive) {
  let n = 0;
  for (const p of def.parts) {
    if (p.kill) n += Math.max(0, live.parts[p.id] ?? 0);
  }
  return n;
}

export function partAlive(live: RobotLive, id: string) {
  return (live.parts[id] ?? 0) > 0;
}
