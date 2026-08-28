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
};

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
    const floor = rows[fy]?.[x] ?? "#";
    const pit = floor === "." || floor === "^";
    for (let y = fy + 1; y < H - 1; y++) {
      const here = rows[y]?.[x] ?? "#";
      if (here !== "." && here !== "#") continue;
      if (!pit) {
        if (here === ".") set(x, y, "#");
        continue;
      }
      if (y === fy + 1 && (here === "." || here === "#")) set(x, y, "^");
      else if (here === ".") set(x, y, "#");
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
  const set = (x: number, y: number, ch: string) => {
    if (y < 1 || y >= H - 1 || x < 1 || x >= W - 1) return;
    if (rows[y][x] !== ".") return;
    rows[y] = rows[y].slice(0, x) + ch + rows[y].slice(x + 1);
  };
  for (let x = 2; x < W - 2; x++) {
    const aboveFloor = fy - 1;
    if (aboveFloor > 1 && rows[fy][x] === "#" && rows[aboveFloor][x] === ".") {
      const wall = rows[aboveFloor][x - 1] === "#" || rows[aboveFloor][x + 1] === "#";
      if (wall && hash(x, aboveFloor, 1) < 0.16) set(x, aboveFloor, "'");
      else if (hash(x, aboveFloor, 2) < 0.07) set(x, aboveFloor, "&");
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
