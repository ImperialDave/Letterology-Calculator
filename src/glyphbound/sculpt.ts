/** Path spines and landforms. Collision stays ASCII. */
import { grid, localFloorY, sealBasement, type Grid } from "./levels-story";
import { validateLevel } from "./validate-level";
import { houseAfter, plantAt } from "./site";

export type LandOp = {
  t: "hill" | "valley" | "ridge" | "pass" | "corridor" | "switchback" | "bridge" | "grate" | "sink";
  at: number;
  w?: number;
  h?: number;
  d?: number;
  gap?: number;
  ride?: string;
  n?: number;
};

export function flatSpine(W: number, fy: number): number[] {
  return Array.from({ length: W }, () => fy);
}

export function clampSpine(spine: number[], fy: number, H: number) {
  const lo = 4;
  const hi = Math.min(H - 3, fy + 3);
  for (let x = 0; x < spine.length; x++) {
    if (spine[x] < lo) spine[x] = lo;
    if (spine[x] > hi) spine[x] = hi;
  }
  for (let x = 1; x < spine.length; x++) {
    const d = spine[x] - spine[x - 1];
    if (d < -1) spine[x] = spine[x - 1] - 1;
    if (d > 2) spine[x] = spine[x - 1] + 2;
  }
}

/** Raise floor (smaller y) to a crest, then down. height 1–2. */
export function hill(spine: number[], x0: number, width: number, height: number, fy: number) {
  const h = Math.max(1, Math.min(2, height));
  const w = Math.max(6, width);
  const rise = Math.max(2, Math.floor(w / 3));
  for (let i = 0; i < w && x0 + i < spine.length; i++) {
    let dy = 0;
    if (i < rise) dy = Math.round((i / rise) * h);
    else if (i > w - rise) dy = Math.round(((w - 1 - i) / rise) * h);
    else dy = h;
    spine[x0 + i] = fy - dy;
  }
}

/** Lower floor (larger y) into the slab. depth 2–3. */
export function valley(spine: number[], x0: number, width: number, depth: number, fy: number) {
  const d = Math.max(2, Math.min(3, depth));
  const w = Math.max(6, width);
  const lip = 2;
  for (let i = 0; i < w && x0 + i < spine.length; i++) {
    let dy = d;
    if (i < lip) dy = Math.round(((i + 1) / lip) * d);
    if (i >= w - lip) dy = Math.round(((w - i) / lip) * d);
    spine[x0 + i] = fy + dy;
  }
}

export function padEnds(spine: number[], fy: number, pad = 8) {
  const W = spine.length;
  for (let x = 0; x < pad && x < W; x++) spine[x] = fy;
  for (let x = Math.max(0, W - pad); x < W; x++) spine[x] = fy;
}

export function setCell(g: Grid, x: number, y: number, ch: string) {
  g.put(x, y, ch);
}

/** Rebuild floor/slab/air from spine. Does not plant actors. */
export function carveSpine(g: Grid, spine: number[]) {
  const W = g.W;
  const H = g.H;
  const fy = g.floorY;
  clampSpine(spine, fy, H);
  for (let x = 1; x < W - 1; x++) {
    const yf = spine[x] ?? fy;
    for (let y = 1; y < H - 1; y++) {
      if (y < yf) {
        const ch = g[y][x];
        if (ch === "#" && y !== 0) g.put(x, y, ".");
      } else {
        g.put(x, y, "#");
      }
    }
  }
}

export function composeSpine(W: number, fy: number, H: number, ops: LandOp[]): number[] {
  const spine = flatSpine(W, fy);
  for (const op of ops) {
    if (op.t === "hill") hill(spine, op.at, op.w ?? 12, op.h ?? 2, fy);
    else if (op.t === "valley") valley(spine, op.at, op.w ?? 10, op.d ?? 2, fy);
    else if (op.t === "ridge") {
      const w = op.w ?? 16;
      hill(spine, op.at, Math.max(6, Math.floor(w / 2)), 2, fy);
      hill(spine, op.at + Math.max(4, Math.floor(w / 2) - 1), Math.max(6, Math.floor(w / 2)), 1, fy);
    } else if (op.t === "pass") {
      const w = Math.max(16, op.w ?? 18);
      hill(spine, op.at, 6, 2, fy);
      valley(spine, op.at + 6, Math.max(6, w - 12), 2, fy);
      hill(spine, op.at + w - 6, 6, 1, fy);
    }
  }
  const pad = Math.min(8, Math.max(4, Math.floor(W / 12)));
  padEnds(spine, fy, pad);
  clampSpine(spine, fy, H);
  return spine;
}

/** Remap fy-relative puts onto the local floor so existing painters ride the landform. */
export function bindSpine(g: Grid, spine: number[]) {
  const fy = g.floorY;
  const H = g.H;
  const rawPut = g.put;
  const along = (x: number, y: number) => {
    const yf = spine[x] ?? fy;
    let ny = y + (yf - fy);
    if (ny < 1) ny = 1;
    if (ny > H - 2) ny = H - 2;
    return ny;
  };
  g.put = (x, y, s) => {
    if (!s) return;
    if (s.length === 1) {
      rawPut(x, along(x, y), s);
      return;
    }
    for (let i = 0; i < s.length; i++) rawPut(x + i, along(x + i, y), s[i] ?? "");
  };
  g.fill = (x, y, n, ch) => {
    for (let i = 0; i < n; i++) rawPut(x + i, along(x + i, y), ch);
  };
  g.spine = spine;
  g.along = along;
}

export function realizeLandform(g: Grid, ops: LandOp[]): number[] {
  const spine = composeSpine(g.W, g.floorY, g.H, ops);
  carveSpine(g, spine);
  for (const op of ops) {
    if (op.t === "corridor") corridor(g, spine, op.at, op.w ?? 12, op.gap ?? 3);
    else if (op.t === "switchback") switchback(g, spine, op.at);
    else if (op.t === "bridge") bridge(g, spine, op.at, op.w ?? 6, op.ride ?? "{");
    else if (op.t === "grate") grateStreet(g, spine, op.at, op.n ?? op.w ?? 3);
    else if (op.t === "sink") sinkValleyFloor(g, spine, op.at, op.n ?? op.w ?? 3);
  }
  bindSpine(g, spine);
  return spine;
}

export function sculptLevel(
  W: number,
  H: number,
  fy: number,
  ops: LandOp[],
  fn: (g: Grid, fy: number, spine: number[]) => void,
): string[] {
  const g = grid(W, H, fy) as Grid;
  const spine = realizeLandform(g, ops);
  fn(g, fy, spine);
  armTeethAlongPath(g, spine);
  houseAfter(g);
  sealBasement(g, fy);
  repairPath(g);
  return [...g];
}

const KEEP_REPAIR = "@%P";

/** Cut long walls to 2-tile hops and assist wide pits. No per-loop BFS. */
export function repairPath<T extends string[]>(rows: T): T {
  const H = rows.length;
  const W = rows[0]?.length ?? 0;
  const set = (x: number, y: number, ch: string) => {
    if (y < 1 || y >= H - 1 || x < 1 || x >= W - 1) return;
    const r = rows[y];
    if (KEEP_REPAIR.includes(r[x] ?? "")) return;
    rows[y] = r.slice(0, x) + ch + r.slice(x + 1);
  };
  let spawnY = 0;
  for (let y = 0; y < H; y++) {
    if (rows[y].includes("@")) {
      spawnY = y;
      break;
    }
  }
  if (!spawnY) spawnY = Math.max(1, H - 4);
  const walk = spawnY;
  let x = 2;
  while (x < W - 2) {
    const ch = rows[walk]?.[x] ?? ".";
    if (ch !== "#" && ch !== "*" && ch !== "&") {
      x += 1;
      continue;
    }
    const x0 = x;
    while (x < W - 2 && "#*&".includes(rows[walk]?.[x] ?? ".")) x += 1;
    if (x - x0 > 2) {
      for (let i = x0 + 2; i < x; i++) set(i, walk, ".");
    }
  }
  for (const ch of ["@", "%", "P"] as const) {
    for (let y = 0; y < H; y++) {
      const mx = rows[y].indexOf(ch);
      if (mx < 0) continue;
      const yf = Math.min(H - 2, y + 1);
      if (rows[yf][mx] === "." || rows[yf][mx] === "^") set(mx, yf, "#");
    }
  }
  x = 2;
  while (x < W - 2) {
    const yf = localFloorY(rows, x);
    const ground = rows[yf]?.[x] ?? "#";
    const carved = yf > walk + 2 && "#*=_T/\\&-`)gjw[{".includes(ground);
    if (carved || (ground !== "." && ground !== "^")) {
      x += 1;
      continue;
    }
    const x0 = x;
    while (x < W - 2) {
      const y2 = localFloorY(rows, x);
      const gch = rows[y2]?.[x] ?? "#";
      const valley = y2 > walk + 2 && "#*=_T/\\&-`)gjw[{".includes(gch);
      if (valley || (gch !== "." && gch !== "^")) break;
      x += 1;
    }
    if (x - x0 > 4) {
      const mid = x0 + Math.floor((x - x0) / 2);
      set(mid, walk, "T");
      set(mid, walk + 1, "#");
    }
  }
  x = 2;
  while (x < W - 2) {
    const gch = rows[walk + 1]?.[x] ?? "#";
    if (gch !== "." && gch !== "^") {
      x += 1;
      continue;
    }
    const x0 = x;
    while (x < W - 2) {
      const c = rows[walk + 1]?.[x] ?? "#";
      if (c !== "." && c !== "^") break;
      x += 1;
    }
    if (x - x0 > 4) {
      const mid = x0 + Math.floor((x - x0) / 2);
      set(mid, walk, "T");
      set(mid, walk + 1, "#");
      set(mid - 1, walk + 1, "#");
      set(mid + 1, walk + 1, "#");
    }
  }
  for (let x = 1; x < W - 1; x++) {
    for (const y of [walk, walk - 1, walk + 1]) {
      if (rows[y]?.[x] !== "|") continue;
      set(x, y, ".");
      set(x, Math.max(1, walk - 3), "|");
    }
  }
  if (validateLevel(rows).some((i) => i.code === "path")) {
    for (let i = 2; i < W - 2; i++) {
      const ch = rows[walk]?.[i] ?? ".";
      if (ch === "#" || ch === "*" || ch === "&") set(i, walk, ".");
      const below = rows[walk + 1]?.[i] ?? "#";
      if (below === "^" || below === ".") {
        set(i, walk, "T");
        set(i, walk + 1, "#");
      }
    }
  }
  return rows;
}

export function landformFromSeed(W: number, seed: number): LandOp[] {
  const ops: LandOp[] = [];
  const kinds: LandOp["t"][] = ["hill", "valley", "ridge", "pass"];
  let x = 10;
  let i = 0;
  let s = seed | 0;
  const next = () => {
    s = (Math.imul(s, 1664525) + 1013904223) | 0;
    return (s >>> 0) / 4294967296;
  };
  while (x < W - 16) {
    const t = kinds[(seed + i * 5) % kinds.length] ?? "hill";
    const w = 8 + Math.floor(next() * 10);
    const op: LandOp = { t, at: x, w };
    if (t === "hill") op.h = 1 + Math.floor(next() * 2);
    if (t === "valley") op.d = 2;
    if (t === "bridge" || t === "grate" || t === "sink") op.n = 3;
    ops.push(op);
    x += w + 4 + Math.floor(next() * 6);
    i += 1;
    if (i > 12) break;
  }
  return ops;
}

export function chunkLand(W: number, id: string): LandOp[] {
  if (W < 16) return [];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (Math.imul(h, 33) + id.charCodeAt(i)) | 0;
  const span = Math.max(1, W - 16);
  const at = Math.max(5, Math.min(W - 12, 5 + ((h >>> 0) % span)));
  const kinds: LandOp["t"][] = ["hill", "valley", "ridge"];
  const t = kinds[(h >>> 0) % kinds.length] ?? "hill";
  return [{ t, at, w: Math.min(10, Math.max(6, W - 12)), h: 1, d: 2 }];
}

export function walkY(spine: number[], x: number) {
  return (spine[x] ?? spine[0] ?? 11) - 1;
}

export function putWalk(g: Grid, spine: number[], x: number, ch: string) {
  if (g.along) g.put(x, g.floorY - 1, ch);
  else g.put(x, walkY(spine, x), ch);
}

export function hangAt(g: Grid, spine: number[], x: number, ch: string, up = 1) {
  if (g.along) g.put(x, g.floorY - 1 - up, ch);
  else g.put(x, (spine[x] ?? g.floorY) - 1 - up, ch);
}

/** Ceiling walls for a corridor; gaps stay air. */
export function corridor(g: Grid, spine: number[], x0: number, width: number, gapEvery = 3) {
  for (let i = 0; i < width && x0 + i < g.W - 1; i++) {
    const y = (spine[x0 + i] ?? g.floorY) - 2;
    if (y <= 1) continue;
    if (i % gapEvery === 2) continue;
    g.put(x0 + i, y, "#");
  }
}

export function switchback(g: Grid, spine: number[], x0: number, deco = "") {
  const y = spine[x0] ?? g.floorY;
  g.fill(x0, y - 2, 4, "=");
  g.fill(x0 + 4, y - 4, 5, "=");
  g.fill(x0 + 9, y - 2, 4, "=");
  if (deco) g.put(x0 + 6, y - 5, deco);
}

export function bridge(g: Grid, spine: number[], x0: number, width: number, ride = "{") {
  const yf = spine[x0] ?? g.floorY;
  for (let i = 0; i < width && x0 + i < g.W - 1; i++) {
    g.put(x0 + i, yf, ".");
    if (yf + 1 < g.H - 1) g.put(x0 + i, yf + 1, "^");
  }
  g.put(x0 + 1, yf - 1, ride);
  g.fill(x0, yf - 3, width, "=");
}

export function grateStreet(g: Grid, spine: number[], x0: number, n: number) {
  for (let i = 0; i < n && x0 + i < g.W - 1; i++) {
    if (g.along) g.put(x0 + i, g.floorY, "j");
    else g.put(x0 + i, spine[x0 + i] ?? g.floorY, "j");
  }
}

export function sinkValleyFloor(g: Grid, spine: number[], x0: number, n: number) {
  for (let i = 0; i < n && x0 + i < g.W - 1; i++) {
    if (g.along) g.put(x0 + i, g.floorY, "w");
    else g.put(x0 + i, spine[x0 + i] ?? g.floorY, "w");
  }
}

export function stampKit(g: Grid, _spine: number[], x0: number, x1: number, hang: string, step = 6) {
  let i = 0;
  for (let x = x0; x < x1 && x < g.W - 2; x += step) {
    const ch = hang[i % hang.length] ?? hang[0];
    if (!ch) continue;
    plantAt(g, x, ch);
    i += 1;
  }
}

/** Teeth only under missing local floor (bridge gaps), never a basement hallway. */
export function armTeethAlongPath<T extends string[]>(rows: T, spine: number[]): T {
  const H = rows.length;
  const W = rows[0]?.length ?? 0;
  const set = (x: number, y: number, ch: string) => {
    if (y < 0 || y >= H || x < 0 || x >= W) return;
    const r = rows[y];
    rows[y] = r.slice(0, x) + ch + r.slice(x + 1);
  };
  for (let x = 1; x < W - 1; x++) {
    const yf = spine[x] ?? spine[0] ?? H - 3;
    const floor = rows[yf]?.[x] ?? "#";
    if (floor === "#" || floor === "j" || floor === "w" || floor === "-" || floor === "/" || floor === "\\") {
      if (yf + 1 < H - 1 && rows[yf + 1][x] === ".") set(x, yf + 1, "#");
      continue;
    }
    if (floor === "." && yf + 1 < H - 1) {
      set(x, yf + 1, "^");
      if (yf + 2 < H - 1 && (rows[yf + 2][x] === "." || rows[yf + 2][x] === "#")) set(x, yf + 2, "#");
    }
  }
  return rows;
}

export { localFloorY } from "./levels-story";

const KEEP_PATH = "@%PihkntOIF!1023456789ABCEYGHKQUNJLM";

/** Plant the stage's damage kit on the carved path — crests hang, valleys become floors. */
export function dressPath(g: Grid, kit: string) {
  const spine = g.spine;
  if (!spine || !kit) return;
  const fy = g.floorY;
  const W = g.W;
  let i = 0;
  for (let x = 10; x < W - 10; x += 14) {
    const ch = kit[i % kit.length] ?? kit[0];
    i += 1;
    if (!ch) continue;
    let blocked = false;
    for (let d = -5; d <= 5; d++) {
      const wy = (spine[x + d] ?? fy) - 1;
      const here = g[wy]?.[x + d] ?? "#";
      if (KEEP_PATH.includes(here)) blocked = true;
    }
    const wy = (spine[x] ?? fy) - 1;
    const here = g[wy]?.[x] ?? "#";
    if (blocked || here !== ".") continue;
    plantAt(g, x, ch);
  }
  houseAfter(g);
}
