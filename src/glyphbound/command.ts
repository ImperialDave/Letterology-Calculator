/** Tekken-style relative direction buffer. Forward is the letter's facing. */

export type RelDir = "n" | "f" | "b" | "u" | "d" | "df" | "db" | "uf" | "ub";

export interface DirSample {
  t: number;
  d: RelDir;
}

export const CMD_WINDOW_DESKTOP = 0.14;
export const CMD_WINDOW_MOBILE = 0.2;
export const STRING_WINDOW_DESKTOP = 0.22;
export const STRING_WINDOW_MOBILE = 0.28;
export const ART_HOLD = 0.35;
export const SKILL_TAP = 0.28;

export function relDir(aimX: number, aimY: number, facing: 1 | -1): RelDir {
  const x = aimX * facing;
  const ax = Math.abs(x);
  const ay = Math.abs(aimY);
  if (ax < 0.32 && ay < 0.32) return "n";
  if (ay >= 0.4 && ax >= 0.32) {
    if (aimY > 0) return x > 0 ? "df" : "db";
    return x > 0 ? "uf" : "ub";
  }
  if (ay >= 0.4) return aimY > 0 ? "d" : "u";
  return x > 0 ? "f" : "b";
}

export function pushDir(buf: DirSample[], t: number, d: RelDir, max = 12): DirSample[] {
  const last = buf[buf.length - 1];
  if (last && last.d === d) {
    last.t = t;
    return buf;
  }
  buf.push({ t, d });
  while (buf.length > max) buf.shift();
  return buf;
}

export function matchFf(buf: DirSample[], now: number, window: number): boolean {
  const recent = buf.filter((s) => now - s.t <= window * 2.6);
  const fs = recent.filter((s) => s.d === "f");
  if (fs.length < 2) return false;
  const a = fs[fs.length - 2];
  const b = fs[fs.length - 1];
  if (!a || !b) return false;
  const gap = b.t - a.t;
  return gap >= 0.04 && gap <= window * 1.8;
}

export function matchBf(buf: DirSample[], now: number, window: number): boolean {
  const recent = buf.filter((s) => now - s.t <= window * 2.6);
  let sawB = false;
  let bT = 0;
  for (const s of recent) {
    if (s.d === "b") {
      sawB = true;
      bT = s.t;
    } else if (sawB && s.d === "f" && s.t - bT >= 0.04 && s.t - bT <= window * 1.8) {
      return true;
    }
  }
  return false;
}

export function canHeatSmash(ff: boolean, doubleTap: boolean) {
  return ff || doubleTap;
}

export function matchDf(buf: DirSample[], now: number, window: number): boolean {
  const recent = buf.filter((s) => now - s.t <= window * 2.2);
  const last = recent[recent.length - 1];
  if (!last) return false;
  if (last.d === "df") return true;
  let sawD = false;
  let dT = 0;
  for (const s of recent) {
    if (s.d === "d" || s.d === "df") {
      sawD = true;
      dT = s.t;
    } else if (sawD && s.d === "f" && s.t - dT >= 0.03 && s.t - dT <= window * 1.6) {
      return true;
    }
  }
  return false;
}

export function matchUf(buf: DirSample[], now: number, window: number): boolean {
  const recent = buf.filter((s) => now - s.t <= window * 2.2);
  const last = recent[recent.length - 1];
  if (!last) return false;
  if (last.d === "uf") return true;
  let sawU = false;
  let uT = 0;
  for (const s of recent) {
    if (s.d === "u" || s.d === "uf") {
      sawU = true;
      uT = s.t;
    } else if (sawU && s.d === "f" && s.t - uT >= 0.03 && s.t - uT <= window * 1.6) {
      return true;
    }
  }
  return false;
}

export function matchQcf(buf: DirSample[], now: number, window: number): boolean {
  const seq = buf.filter((s) => now - s.t <= window * 3.2).map((s) => s.d);
  for (let i = 0; i < seq.length; i++) {
    if (seq[i] !== "d") continue;
    const rest = seq.slice(i + 1);
    const mid = rest.findIndex((d) => d === "df" || d === "f");
    if (mid < 0) continue;
    if (rest.slice(mid).includes("f")) return true;
  }
  return false;
}

/** A 0.1s Skill press must never count as a Case Art. */
export function skillHoldIsArt(held: number, heat: number) {
  return heat >= 100 && held >= ART_HOLD;
}

export function skillHoldIsTap(held: number) {
  return held > 0 && held < ART_HOLD;
}
