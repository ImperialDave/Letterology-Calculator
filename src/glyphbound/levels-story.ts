import type { LevelId, TaskDef, ThemeId } from "./types";

export interface LevelMeta {
  id: LevelId;
  name: string;
  theme: ThemeId;
  objective: string;
  tasks: TaskDef[];
  rows: string[];
  exit?: "hub" | "win";
  index: number;
}

export function slice(raw: string): string[] {
  const lines = raw
    .replace(/^\n/, "")
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .filter((l) => l.length > 0);
  const w = Math.max(...lines.map((l) => l.length));
  return lines.map((l) => l.padEnd(w, "#"));
}

export function grid(W: number, H: number, floorY: number): string[] {
  const rows = Array.from({ length: H }, (_, y) => {
    if (y === 0 || y === H - 1) return "#".repeat(W);
    return "#" + ".".repeat(W - 2) + "#";
  });
  const put = (x: number, y: number, s: string) => {
    if (y < 0 || y >= H) return;
    const r = rows[y];
    if (x < 0 || x >= r.length) return;
    rows[y] = r.slice(0, x) + s + r.slice(x + s.length);
  };
  const fill = (x: number, y: number, n: number, ch: string) => put(x, y, ch.repeat(n));
  fill(0, floorY, W, "#");
  for (let y = floorY + 1; y < H - 1; y++) fill(0, y, W, "#");
  return Object.assign(rows, { put, fill, W, H, floorY });
}

export type Grid = string[] & {
  put: (x: number, y: number, s: string) => void;
  fill: (x: number, y: number, n: number, ch: string) => void;
  W: number;
  H: number;
  floorY: number;
  spine?: number[];
  along?: (x: number, y: number) => number;
};

const GROUND = "#*=_T/\\&-`)gjw[{";

function isWalkAir(ch: string) {
  if (!ch) return false;
  if (ch === "^" || ch === "S" || ch === "~") return false;
  if (GROUND.includes(ch)) return false;
  return true;
}

/** Ground row under the walkway air at column x. Valleys and hills have their own floor. */
export function localFloorY(rows: string[], x: number) {
  const H = rows.length;
  for (let y = H - 2; y >= 1; y--) {
    if (isWalkAir(rows[y]?.[x] ?? "#")) return Math.min(H - 2, y + 1);
  }
  return Math.max(1, H - 3);
}

export function armTeeth<T extends string[]>(rows: T, floorY?: number): T {
  const H = rows.length;
  const W = rows[0]?.length ?? 0;
  if (H < 3 || W < 3) return rows;
  let fy = floorY;
  if (fy == null || fy < 1 || fy >= H - 1) {
    let best = 0;
    fy = Math.max(1, H - 3);
    for (let y = 1; y < H - 1; y++) {
      let n = 0;
      for (let x = 0; x < W; x++) if (rows[y][x] === "#") n++;
      if (n > best) {
        best = n;
        fy = y;
      }
    }
  }
  const set = (x: number, y: number, ch: string) => {
    if (y < 0 || y >= H || x < 0 || x >= W) return;
    const r = rows[y];
    rows[y] = r.slice(0, x) + ch + r.slice(x + 1);
  };
  const busy = (x: number, y: number) => {
    const c = rows[y]?.[x];
    return !c || c !== ".";
  };
  const hash = (x: number, s: number) => {
    const n = Math.imul(x + 11, 374761) ^ Math.imul(fy + 3, 668265) ^ Math.imul(s, 1274126177);
    return ((n >>> 0) % 1000) / 1000;
  };
  if (fy + 1 < H - 1) {
    for (let x = 1; x < W - 1; x++) {
      const floor = rows[fy][x];
      if ((floor === "#" || floor === "~") && rows[fy + 1][x] === ".") set(x, fy + 1, "#");
    }
  }
  let x = 1;
  while (x < W - 1) {
    if (rows[fy][x] !== ".") {
      x++;
      continue;
    }
    let x2 = x;
    while (x2 < W - 1 && rows[fy][x2] === ".") x2++;
    const w = x2 - x;
    const mid = x + Math.floor(w / 2);
    const style = Math.floor(hash(x, 7) * 5);
    const pitY = fy + 1 < H - 1 ? fy + 1 : fy;
    const canBottom = pitY < H - 1;
    if (w <= 2) {
      if (canBottom) {
        if (!busy(x, pitY)) set(x, pitY, "^");
        if (w === 2 && !busy(x + 1, pitY) && hash(x, 3) < 0.55) set(x + 1, pitY, "^");
      }
    } else if (w <= 4) {
      if (canBottom) {
        if (!busy(x, pitY)) set(x, pitY, "^");
        if (!busy(x2 - 1, pitY)) set(x2 - 1, pitY, "^");
        if (!busy(mid, pitY)) {
          if (style <= 1) set(mid, pitY, "T");
          else if (style === 2) set(mid, pitY, "~");
          else if (style === 3) set(mid, pitY, "^");
        }
      }
    } else if (w <= 7) {
      if (canBottom) {
        if (!busy(x, pitY)) set(x, pitY, "^");
        if (!busy(x2 - 1, pitY)) set(x2 - 1, pitY, "^");
        if (style === 0 || style === 1) {
          for (let i = x + 1; i < x2 - 1; i++) if (!busy(i, pitY)) set(i, pitY, "~");
          if (!busy(mid, pitY)) set(mid, pitY, "T");
        } else if (style === 2) {
          for (let i = x + 1; i < x2 - 1; i++) {
            if (!busy(i, pitY)) set(i, pitY, i % 2 === 0 ? "^" : ".");
          }
          if (!busy(mid, pitY)) set(mid, pitY, "T");
        } else if (!busy(mid, pitY)) set(mid, pitY, "T");
      }
      if (w >= 6 && fy - 1 > 0) {
        if (!busy(x + 1, fy - 1) && hash(x, 11) < 0.45) set(x + 1, fy - 1, "_");
        if (!busy(x2 - 2, fy - 1) && hash(x, 13) < 0.45) set(x2 - 2, fy - 1, "_");
      }
    } else {
      if (canBottom) {
        if (!busy(x, pitY)) set(x, pitY, "^");
        if (!busy(x + 1, pitY) && hash(x, 17) < 0.7) set(x + 1, pitY, "^");
        if (!busy(x2 - 1, pitY)) set(x2 - 1, pitY, "^");
        if (!busy(x2 - 2, pitY) && hash(x, 19) < 0.7) set(x2 - 2, pitY, "^");
        if (style <= 2) {
          for (let i = x + 2; i < x2 - 2; i++) if (!busy(i, pitY)) set(i, pitY, "~");
          if (!busy(mid, pitY)) set(mid, pitY, "T");
          if (w >= 10 && !busy(mid - 2, pitY)) set(mid - 2, pitY, "T");
        } else if (style === 3) {
          for (let i = x + 2; i < mid - 1; i++) if (!busy(i, pitY)) set(i, pitY, i % 2 ? "^" : ".");
          for (let i = mid + 2; i < x2 - 2; i++) if (!busy(i, pitY)) set(i, pitY, i % 2 ? "^" : ".");
          if (!busy(mid, pitY)) set(mid, pitY, "T");
        } else {
          if (!busy(mid, pitY)) set(mid, pitY, "T");
          if (!busy(x + 2, pitY)) set(x + 2, pitY, "^");
          if (!busy(x2 - 3, pitY)) set(x2 - 3, pitY, "^");
        }
      }
      if (fy - 1 > 0) {
        const rw = Math.min(4, w - 5);
        for (let i = 0; i < rw; i++) {
          if (!busy(x + 2 + i, fy - 1) && hash(x + i, 23) < 0.65) set(x + 2 + i, fy - 1, "_");
        }
      }
    }
    x = x2;
  }
  sealBasement(rows, fy);
  dressDecor(rows, fy);
  ensurePortalAccess(rows);
  return rows;
}

const WALK_MARKS = "@%P!";
const SLAB = "#";

function findMarks(rows: string[], ch: string) {
  const hits: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < (rows[y]?.length ?? 0); x++) {
      if (rows[y][x] === ch) hits.push({ x, y });
    }
  }
  return hits;
}

/** Lift spawn, gate, check, and warden out of the packed basement onto the walkway. */
export function hoistFromBasement<T extends string[]>(rows: T, fy: number): T {
  const H = rows.length;
  const W = rows[0]?.length ?? 0;
  const set = (x: number, y: number, ch: string) => {
    if (y < 0 || y >= H || x < 0 || x >= W) return;
    const r = rows[y];
    rows[y] = r.slice(0, x) + ch + r.slice(x + 1);
  };
  const spawn = findMarks(rows, "@")[0];
  const walk = spawn?.y ?? Math.max(1, fy - 1);
  const FLOOR = "#*=_T/\\&-`)gjw";
  const takeCol = (preferRight: boolean, yf: number) => {
    const xs: number[] = [];
    const wy = Math.max(1, yf - 1);
    if (preferRight) {
      for (let x = W - 5; x >= 8; x--) xs.push(x);
    } else {
      for (let x = 8; x <= W - 5; x++) xs.push(x);
    }
    for (const x of xs) {
      if (WALK_MARKS.includes(rows[wy]?.[x] ?? SLAB)) continue;
      const below = rows[yf]?.[x] ?? SLAB;
      if ((rows[wy]?.[x] === "." || rows[wy]?.[x] === ",") && FLOOR.includes(below) && below !== ".") {
        return x;
      }
    }
    for (const x of xs) {
      if (WALK_MARKS.includes(rows[wy]?.[x] ?? SLAB)) continue;
      if (rows[wy]?.[x] === ".") {
        set(x, yf, "#");
        return x;
      }
    }
    return Math.max(2, W - 4);
  };
  for (const ch of ["P", "!", "%"] as const) {
    for (const hit of findMarks(rows, ch)) {
      const yf = localFloorY(rows, hit.x);
      if (hit.y <= yf) continue;
      set(hit.x, hit.y, SLAB);
      const x = ch === "P" || ch === "!" ? takeCol(true, yf) : takeCol(false, yf);
      const wy = Math.max(1, localFloorY(rows, x) - 1);
      set(x, wy, ch);
      const gf = localFloorY(rows, x);
      if (!FLOOR.includes(rows[gf]?.[x] ?? "")) set(x, gf, "#");
    }
  }
  void walk;
  return rows;
}

/** Pack rows below the walkway so they cannot be used as a skip hallway. */
export function sealBasement<T extends string[]>(rows: T, fy: number): T {
  const H = rows.length;
  const W = rows[0]?.length ?? 0;
  const set = (x: number, y: number, ch: string) => {
    if (y < 0 || y >= H || x < 0 || x >= W) return;
    const r = rows[y];
    rows[y] = r.slice(0, x) + ch + r.slice(x + 1);
  };
  for (let x = 1; x < W - 1; x++) {
    const yf = localFloorY(rows, x) || fy;
    const floor = rows[yf]?.[x] ?? "#";
    const pit = floor === "." || floor === "^";
    for (let y = yf + (pit ? 0 : 1); y < H - 1; y++) {
      const here = rows[y]?.[x] ?? "#";
      if (here !== "." && here !== "#") continue;
      if (!pit) {
        if (here === ".") set(x, y, "#");
        continue;
      }
      if (y === yf && (here === "." || here === "#")) set(x, y, "^");
      else if (here === ".") set(x, y, "#");
    }
  }
  hoistFromBasement(rows, fy);
  ensurePortalAccess(rows);
  return rows;
}

const KEEP_PAD = "@%P!ih$+";
const FLOOR_CH = "#*=_T/\\&-`)g";

function atCell(rows: string[], x: number, y: number) {
  if (y < 0 || y >= rows.length || x < 0 || x >= (rows[y]?.length ?? 0)) return "#";
  return rows[y][x];
}

function standable(rows: string[], x: number, y: number) {
  let here = atCell(rows, x, y);
  let below = atCell(rows, x, y + 1);
  if (here === "v" || here === "|") here = ".";
  if (below === "v" || below === "|") below = atCell(rows, x, y + 2);
  if (here === "#" || here === "*" || here === "&") return false;
  if (here === "^" || here === "S") return false;
  if (FLOOR_CH.includes(here) && here !== "#" && here !== "*" && here !== "&") return true;
  if (below === "^" || below === "S") return false;
  return FLOOR_CH.includes(below) || below === "~";
}

/** Keep a walkable street to the gate and a clear pad around P. */
export function ensurePortalAccess<T extends string[]>(rows: T): T {
  const H = rows.length;
  const W = rows[0]?.length ?? 0;
  const set = (x: number, y: number, ch: string) => {
    if (y < 0 || y >= H || x < 0 || x >= W) return;
    const r = rows[y];
    rows[y] = r.slice(0, x) + ch + r.slice(x + 1);
  };
  const spawn = findMarks(rows, "@")[0];
  let gate = findMarks(rows, "P")[0];
  if (!spawn || !gate) return rows;
  let stand = spawn.y;
  for (let y = spawn.y; y < H - 1; y++) {
    if (standable(rows, spawn.x, y)) {
      stand = y;
      break;
    }
  }
  if (!standable(rows, spawn.x, spawn.y)) {
    const fy = Math.min(H - 2, spawn.y + 1);
    if (!KEEP_PAD.includes(atCell(rows, spawn.x, fy))) set(spawn.x, fy, "#");
    stand = spawn.y;
  }
  if (gate.y !== stand) {
    set(gate.x, gate.y, "#");
    let gx = gate.x;
    if (atCell(rows, gx, stand) === "#" || KEEP_PAD.includes(atCell(rows, gx, stand))) {
      for (let x = W - 5; x >= 8; x--) {
        if (!KEEP_PAD.includes(atCell(rows, x, stand)) && atCell(rows, x, stand) !== "#") {
          gx = x;
          break;
        }
      }
    }
    set(gx, stand, "P");
    gate = { x: gx, y: stand };
  }
  const lo = Math.max(1, Math.min(spawn.x, gate.x));
  const hi = Math.min(W - 2, Math.max(spawn.x, gate.x));
  for (let x = lo + 1; x < hi; x++) {
    const yf = localFloorY(rows, x);
    if (yf !== stand + 1) continue;
    const ch = atCell(rows, x, stand);
    if (ch === "&" || ch === "*" || ch === "^" || ch === "S") set(x, stand, ".");
    if (ch === "#" && x > 2 && x < W - 3) {
      set(x, stand, ".");
      if (stand + 1 < H - 1 && !KEEP_PAD.includes(atCell(rows, x, stand + 1))) set(x, stand + 1, "#");
    }
  }
  let x = lo;
  while (x <= hi) {
    const yf = localFloorY(rows, x);
    if (yf !== stand + 1) {
      x += 1;
      continue;
    }
    const ground = atCell(rows, x, stand + 1);
    if (FLOOR_CH.includes(ground) && ground !== ".") {
      x += 1;
      continue;
    }
    let x2 = x;
    while (x2 <= hi) {
      const y2 = localFloorY(rows, x2);
      if (y2 !== stand + 1) break;
      if (FLOOR_CH.includes(atCell(rows, x2, stand + 1)) && atCell(rows, x2, stand + 1) !== ".") break;
      x2 += 1;
    }
    if (x2 - x > 3) {
      for (let i = x; i < x2; i++) {
        if (!KEEP_PAD.includes(atCell(rows, i, stand + 1))) set(i, stand + 1, "#");
        if (atCell(rows, i, stand) === "^") set(i, stand, ".");
      }
    }
    x = Math.max(x2, x + 1);
  }
  const pad0 = Math.max(1, gate.x - 6);
  const pad1 = Math.min(W - 2, gate.x + 1);
  for (let px = pad0; px <= pad1; px++) {
    const ch = atCell(rows, px, stand);
    if (!KEEP_PAD.includes(ch) && ch !== ".") set(px, stand, ".");
    if (stand + 1 < H - 1 && !KEEP_PAD.includes(atCell(rows, px, stand + 1))) set(px, stand + 1, "#");
  }
  if (atCell(rows, gate.x, stand) !== "P") set(gate.x, stand, "P");
  for (const hit of findMarks(rows, "!")) {
    if (hit.y === stand) continue;
    const yf = localFloorY(rows, hit.x);
    if (hit.y === yf - 1 || hit.y === yf) continue;
    if (hit.y > stand + 1 || hit.y < stand - 1) {
      set(hit.x, hit.y, ".");
      const bx = Math.max(pad0, gate.x - 4);
      if (atCell(rows, bx, stand) === ".") set(bx, stand, "!");
      else set(hit.x, Math.max(1, yf - 1), "!");
    }
  }
  return rows;
}

export function dressDecor(rows: string[], fy: number) {
  const H = rows.length;
  const W = rows[0]?.length ?? 0;
  const hash = (x: number, y: number, s: number) => {
    const n = Math.imul(x + 3, 374761) ^ Math.imul(y + 7, 668265) ^ Math.imul(s + fy, 127);
    return ((n >>> 0) % 1000) / 1000;
  };
  const skip = new Set<number>();
  for (const ch of "@%P!") {
    for (const hit of findMarks(rows, ch)) {
      for (let d = -6; d <= 6; d++) skip.add(hit.x + d);
    }
  }
  const set = (x: number, y: number, ch: string) => {
    if (y < 1 || y >= H - 1 || x < 1 || x >= W - 1) return;
    if (skip.has(x)) return;
    if (rows[y][x] !== ".") return;
    rows[y] = rows[y].slice(0, x) + ch + rows[y].slice(x + 1);
  };
  for (let x = 2; x < W - 2; x++) {
    if (skip.has(x)) continue;
    const aboveFloor = fy - 1;
    if (aboveFloor > 1 && rows[fy][x] === "#" && rows[aboveFloor][x] === ".") {
      if (hash(x, aboveFloor, 1) < 0.12 && fy - 2 > 1 && rows[fy - 2][x] === ".") set(x, fy - 2, "'");
      else if (hash(x, aboveFloor, 2) < 0.06 && fy - 2 > 1 && rows[fy - 2][x] === ".") set(x, fy - 2, "&");
    }
    if (fy - 2 > 1 && rows[fy][x] === "#" && rows[fy - 2][x] === "." && hash(x, fy - 2, 3) < 0.05) {
      set(x, fy - 2, "?");
    }
    if (rows[0][x] === "#" && rows[1][x] === ".") {
      if (hash(x, 1, 4) < 0.14) set(x, 1, ";");
      else if (hash(x, 1, 5) < 0.12) set(x, 1, '\"');
    }
    if (rows[fy][x] === "." && rows[0][x] === "#" && rows[1][x] === "." && hash(x, 1, 6) < 0.2) {
      set(x, 1, ",");
    }
  }
}
