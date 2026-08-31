/** Type-foundry toys: periods, unlocks, and readable phase helpers. */
import { TILE } from "./types";

export type ToyId =
  | "censer"
  | "stamper"
  | "guillotine"
  | "dropcap"
  | "grate"
  | "rotor"
  | "sinkink"
  | "shutter"
  | "carriage"
  | "echo";

export const TOY_GLYPH: Record<string, ToyId> = {
  l: "censer",
  z: "stamper",
  x: "guillotine",
  f: "dropcap",
  j: "grate",
  d: "rotor",
  w: "sinkink",
  "}": "shutter",
  "{": "carriage",
  "[": "echo",
};

export const GLYPH_FOR_TOY: Record<ToyId, string> = {
  censer: "l",
  stamper: "z",
  guillotine: "x",
  dropcap: "f",
  grate: "j",
  rotor: "d",
  sinkink: "w",
  shutter: "}",
  carriage: "{",
  echo: "[",
};

/** Campaign stage that teaches the toy. Hub never parses these as toys. */
export const TOY_UNLOCK: Record<ToyId, number> = {
  stamper: 2,
  sinkink: 3,
  guillotine: 4,
  shutter: 5,
  censer: 6,
  dropcap: 8,
  carriage: 9,
  echo: 10,
  rotor: 11,
  grate: 12,
};

export const TOY_PERIOD = {
  censer: 2.4,
  stamper: 2.4,
  guillotine: 2.2,
  dropcap: 3.2,
  grate: 2.0,
  rotor: 1.4,
  shutter: 3.2,
  carriage: 4.0,
  sinkink: 1.2,
  echo: 1.6,
} as const;

export const SINK_TIME = 0.7;
export const ECHO_DELAY = 0.55;
export const ECHO_WARN = 0.2;
export const ECHO_LIFE = 0.28;
export const SHUTTER_OPEN = 1.0;
export const TELL = 0.35;
export const ROTOR_STEP = 0.7;
export const CARRIAGE_SPAN = 3.5;
export const CENSER_SPAN = 1.5;

export const TOY_SHEET: Record<ToyId, { kind: "hazards" | "movers"; name: string; cols: number; rows: number }> = {
  censer: { kind: "hazards", name: "censer", cols: 2, rows: 4 },
  stamper: { kind: "hazards", name: "stamper", cols: 2, rows: 3 },
  guillotine: { kind: "hazards", name: "guillotine", cols: 2, rows: 3 },
  dropcap: { kind: "movers", name: "dropcap", cols: 2, rows: 4 },
  grate: { kind: "hazards", name: "grate", cols: 2, rows: 2 },
  rotor: { kind: "hazards", name: "rotor", cols: 2, rows: 4 },
  sinkink: { kind: "hazards", name: "sinkink", cols: 2, rows: 3 },
  shutter: { kind: "hazards", name: "shutter", cols: 2, rows: 2 },
  carriage: { kind: "movers", name: "carriage", cols: 2, rows: 3 },
  echo: { kind: "hazards", name: "echo", cols: 2, rows: 2 },
};

export function isToyGlyph(ch: string) {
  return Object.prototype.hasOwnProperty.call(TOY_GLYPH, ch);
}

export function toyUnlocked(id: ToyId, stage: number) {
  return stage >= TOY_UNLOCK[id];
}

export function toysUnlocked(stage: number): ToyId[] {
  return (Object.keys(TOY_UNLOCK) as ToyId[]).filter((id) => stage >= TOY_UNLOCK[id]);
}

export function cycle(t: number, phase: number, period: number) {
  const p = period || 1;
  let c = (t + phase) % p;
  if (c < 0) c += p;
  return c;
}

export function toyFrame(t: number, phase: number, period: number, frames: number) {
  const n = Math.max(1, frames);
  return Math.min(n - 1, Math.floor((cycle(t, phase, period) / period) * n));
}

/** Sheet cell that matches the live pose, not a leftover animation loop. */
export function toyDrawFrame(id: ToyId, t: number, phase: number): number {
  const n = TOY_SHEET[id].cols * TOY_SHEET[id].rows;
  if (id === "stamper") {
    const p = stamperPose(t, phase);
    const floor = TILE * 2;
    if (p.tell) return Math.min(1, n - 1);
    if (p.hot && p.yOff < floor * 0.85) return Math.min(2, n - 1);
    if (p.hot) return Math.min(3, n - 1);
    if (p.yOff > 1) return Math.min(4, n - 1);
    return 0;
  }
  if (id === "guillotine") {
    const p = guillotinePose(t, phase);
    if (p.hot && p.w > TILE) return Math.min(2, n - 1);
    if (p.tell) return Math.min(1, n - 1);
    return 0;
  }
  if (id === "grate") {
    const p = gratePhase(t, phase);
    if (p === "warn") return Math.min(1, n - 1);
    if (p === "hot") return Math.min(2, n - 1);
    if (p === "cool") return Math.min(3, n - 1);
    return 0;
  }
  if (id === "shutter") return shutterOpen(t, phase) ? Math.min(3, n - 1) : 0;
  if (id === "dropcap") {
    const p = dropcapPose(t, phase);
    if (p.plat) return Math.min(4, n - 1);
    if (p.hot) return Math.min(3, n - 1);
    if (p.tell) return Math.min(1, n - 1);
    return 0;
  }
  if (id === "rotor") {
    const horiz = rotorHorizontal(t, phase);
    const step = cycle(t, phase, TOY_PERIOD.rotor) % ROTOR_STEP;
    if (step > ROTOR_STEP - 0.16) return horiz ? Math.min(1, n - 1) : Math.min(3, n - 1);
    return horiz ? 0 : Math.min(2, n - 1);
  }
  if (id === "censer") {
    const o = censerOffset(t, phase);
    if (o < -TILE * 0.55) return Math.min(4, n - 1);
    if (o > TILE * 0.55) return Math.min(6, n - 1);
    return 0;
  }
  if (id === "echo") return 0;
  if (id === "carriage") return toyFrame(t, phase, TOY_PERIOD.carriage, Math.min(3, n));
  return toyFrame(t, phase, TOY_PERIOD[id], n);
}

/** Censer bowl x offset in pixels. Full swing is on-screen before the lane. */
export function censerOffset(t: number, phase: number) {
  const c = cycle(t, phase, TOY_PERIOD.censer);
  return Math.sin((c / TOY_PERIOD.censer) * Math.PI * 2) * TILE * CENSER_SPAN;
}

export function stamperPose(t: number, phase: number): { yOff: number; hot: boolean; tell: boolean } {
  const c = cycle(t, phase, TOY_PERIOD.stamper);
  const floor = TILE * 2;
  if (c < 0.95) return { yOff: 0, hot: false, tell: false };
  if (c < 1.4) return { yOff: 0, hot: false, tell: true };
  if (c < 1.7) return { yOff: ((c - 1.4) / 0.3) * floor, hot: true, tell: false };
  if (c < 2.05) return { yOff: floor, hot: true, tell: false };
  return { yOff: (1 - (c - 2.05) / 0.35) * floor, hot: false, tell: false };
}

export function guillotinePose(t: number, phase: number): { w: number; hot: boolean; tell: boolean } {
  const c = cycle(t, phase, TOY_PERIOD.guillotine);
  const sheathed = 12;
  const full = TILE * 2;
  if (c < 0.5) return { w: sheathed, hot: false, tell: false };
  if (c < 0.85) return { w: 18, hot: false, tell: true };
  if (c < 1.25) return { w: sheathed + ((c - 0.85) / 0.4) * (full - sheathed), hot: true, tell: false };
  if (c < 1.6) return { w: full, hot: true, tell: false };
  if (c < 2.0) return { w: full - ((c - 1.6) / 0.4) * (full - sheathed), hot: true, tell: false };
  return { w: sheathed, hot: false, tell: false };
}

export function dropcapPose(
  t: number,
  phase: number,
): { yOff: number; plat: boolean; hot: boolean; tell: boolean } {
  const c = cycle(t, phase, TOY_PERIOD.dropcap);
  const floor = TILE * 2;
  if (c < 0.6) return { yOff: 0, plat: false, hot: false, tell: false };
  if (c < 0.95) return { yOff: 6, plat: false, hot: false, tell: true };
  if (c < 1.3) return { yOff: ((c - 0.95) / 0.35) * floor, plat: false, hot: true, tell: false };
  if (c < 1.5) return { yOff: floor, plat: false, hot: true, tell: false };
  if (c < 2.3) return { yOff: floor, plat: true, hot: false, tell: false };
  if (c < 2.9) return { yOff: (1 - (c - 2.3) / 0.6) * floor, plat: true, hot: false, tell: false };
  return { yOff: 0, plat: false, hot: false, tell: false };
}

export function gratePhase(t: number, phase: number): "cold" | "warn" | "hot" | "cool" {
  const c = cycle(t, phase, TOY_PERIOD.grate);
  if (c < 0.7) return "cold";
  if (c < 1.15) return "warn";
  if (c < 1.7) return "hot";
  return "cool";
}

export function grateHot(t: number, phase: number) {
  return gratePhase(t, phase) === "hot";
}

export function rotorHorizontal(t: number, phase: number) {
  return Math.floor(cycle(t, phase, TOY_PERIOD.rotor) / ROTOR_STEP) % 2 === 0;
}

/** Three consecutive `}` bars share a 0.5s all-open window. */
export function shutterOpen(t: number, phase: number) {
  const c = cycle(t, 0, TOY_PERIOD.shutter);
  const start = 0.4 + phase;
  return c >= start && c < start + SHUTTER_OPEN;
}

export function shutterSlam(t: number, phase: number) {
  const c = cycle(t, 0, TOY_PERIOD.shutter);
  const end = 0.4 + phase + SHUTTER_OPEN;
  return c >= end && c < end + 0.18;
}

export function carriageOffset(t: number, phase: number) {
  const c = cycle(t, phase, TOY_PERIOD.carriage);
  return Math.sin((c / TOY_PERIOD.carriage) * Math.PI * 2) * TILE * CARRIAGE_SPAN;
}
