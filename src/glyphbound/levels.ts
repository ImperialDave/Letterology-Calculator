import { DISTRICTS } from "./districts";
import type { LevelId, TaskDef, ThemeId } from "./types";
import { FIRST_BOOK, STAGE_COUNT } from "./types";

export type { LevelId, ThemeId };
export { STAGE_COUNT, FIRST_BOOK };

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

function slice(raw: string): string[] {
  const lines = raw
    .replace(/^\n/, "")
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .filter((l) => l.length > 0);
  const w = Math.max(...lines.map((l) => l.length));
  return lines.map((l) => l.padEnd(w, "#"));
}

function grid(W: number, H: number, floorY: number): string[] {
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
  return Object.assign(rows, { put, fill, W, H, floorY });
}

type Grid = string[] & {
  put: (x: number, y: number, s: string) => void;
  fill: (x: number, y: number, n: number, ch: string) => void;
  W: number;
  H: number;
  floorY: number;
};

function armTeeth<T extends string[]>(rows: T, floorY?: number): T {
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
  const keepNear = (x: number, y: number) => {
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const c = rows[y + dy]?.[x + dx];
        if (c === "P" || c === "!" || c === "@") return true;
      }
    }
    return false;
  };
  for (let y = fy + 1; y < H - 1; y++) {
    const r = rows[y];
    let out = "";
    for (let x = 0; x < W; x++) {
      const ch = r[x];
      if (ch !== ".") {
        out += ch;
        continue;
      }
      const floor = rows[fy][x];
      if ((floor === "#" || floor === "~") && !keepNear(x, y)) out += "^";
      else out += ch;
    }
    rows[y] = out;
  }
  return rows;
}

function buildExchange(): string[] {
  const W = 184;
  const H = 13;
  const g = grid(W, H, 8) as Grid;
  const { put, fill } = g;
  const pit = 156;
  const pitW = 20;
  fill(pit, 8, pitW, ".");
  fill(pit, 10, pitW, ".");

  put(1, 7, "@");
  put(12, 7, "m");
  put(8, 6, "==");
  put(14, 6, "####");
  put(20, 7, "1");
  put(24, 7, "^^^");
  put(28, 5, "====");
  put(30, 4, "0");
  put(36, 7, "i");

  put(42, 7, "5");
  put(46, 6, "------");
  put(54, 7, "1");
  put(58, 6, "========");
  put(60, 5, "2");
  put(66, 6, "%");
  put(70, 6, "i");
  put(58, 3, "====");
  put(60, 2, "3");
  put(72, 2, "0");

  put(80, 7, "^^");
  put(84, 6, "####");
  put(86, 5, "s");
  put(90, 5, "q");
  put(94, 7, "3");
  put(98, 4, "====");
  put(100, 3, "*");
  put(102, 3, "*");
  put(104, 4, "a");
  put(106, 7, "7");
  put(110, 7, "^^^^");
  put(96, 2, "0");
  put(116, 2, "====");
  put(118, 1, "i");

  put(122, 6, "====");
  put(124, 5, "W");
  put(128, 7, "1");
  put(132, 7, "2");
  put(134, 6, "%");
  put(136, 7, "^^^^^");
  put(142, 7, "h");
  put(128, 4, "========");
  put(130, 3, "4");
  put(134, 3, "+");
  put(148, 5, "|");
  put(148, 6, "|");
  put(148, 7, "|");
  put(150, 6, "==");
  put(118, 2, "0");

  put(pit - 14, 7, "y");
  put(pit - 10, 6, "========");
  put(pit - 8, 5, "6");
  put(pit - 6, 5, "D");
  put(pit - 2, 6, "%");
  put(pit + 2, 7, "^^^");
  put(pit + 6, 7, "VV");
  put(pit + 10, 6, "o");
  put(pit + 6, 11, "P");
  put(pit + 12, 11, "!");

  put(4, 3, "====");
  put(5, 2, "$");
  put(pit + 16, 10, "==");
  put(pit + 16, 9, "$");
  put(88, 2, "4");
  return armTeeth(g, 8);
}

function buildGutter(): string[] {
  const W = 172;
  const H = 14;
  const g = grid(W, H, 9) as Grid;
  const { put, fill } = g;
  const gap = (x: number, n: number) => {
    fill(x, 9, n, "~");
    fill(x, 10, n, "~");
  };

  put(1, 8, "@");
  put(10, 8, "u");
  put(16, 8, "1");
  put(8, 7, "==");
  put(18, 8, "^^");
  put(20, 6, "====");
  put(22, 5, "i");
  put(26, 8, "2");

  gap(30, 11);
  put(34, 7, "%");
  put(38, 6, "====");
  put(39, 5, "e");
  put(40, 8, "3");
  put(44, 5, "----");
  put(48, 7, "====");
  put(50, 6, "0");
  put(52, 8, "1");

  gap(56, 12);
  put(58, 6, "----");
  put(64, 8, "5");
  put(68, 5, "====");
  put(70, 4, "X");
  put(72, 8, "^^^");
  put(76, 8, "g");
  put(80, 6, "====");
  put(82, 8, "%");
  put(86, 7, "i");
  put(88, 8, "7");
  put(90, 5, "====");
  put(92, 4, "2");

  gap(96, 14);
  put(98, 6, "==");
  put(102, 5, "----");
  put(108, 4, "====");
  put(110, 3, "6");
  put(114, 7, "====");
  put(116, 6, "3");
  put(118, 8, "1");
  put(122, 5, "========");
  put(124, 4, "7");
  put(126, 5, "h");
  put(130, 8, "4");
  put(134, 8, "0");

  gap(140, 14);
  put(142, 6, "====");
  put(146, 5, "----");
  put(150, 5, "====");
  put(152, 4, "5");
  put(156, 8, "P");
  put(160, 7, "+");
  put(158, 8, "^^^");

  put(40, 2, "0");
  put(100, 2, "0");
  put(24, 3, "====");
  put(25, 2, "$");
  put(164, 6, "==");
  put(164, 5, "$");
  return armTeeth(g, 9);
}

function buildCoil(): string[] {
  const W = 176;
  const H = 14;
  const g = grid(W, H, 9) as Grid;
  const { put, fill } = g;
  const laserCol = (x: number, y0: number, y1: number) => {
    for (let y = y0; y <= y1; y++) put(x, y, "|");
  };

  put(1, 8, "@");
  put(10, 8, "p");
  put(16, 8, "1");
  put(20, 8, "^^^^");
  put(26, 6, "====");
  put(28, 5, "2");
  put(32, 7, "====");
  put(34, 8, "%");
  put(36, 8, "3");

  fill(42, 5, 3, "v");
  fill(42, 6, 3, "v");
  fill(42, 7, 3, "v");
  fill(42, 8, 3, "v");
  put(48, 8, "1");
  put(50, 8, "5");
  put(52, 8, "^^^");
  put(56, 6, "====");
  put(58, 5, "Z");
  put(62, 8, "6");
  put(66, 7, "----");
  put(70, 5, "====");
  put(72, 4, "6");

  put(76, 8, "^^^^^^^^");
  put(80, 6, "====");
  put(82, 5, "r");
  put(86, 7, "----");
  put(90, 5, "====");
  put(92, 4, "3");
  laserCol(96, 5, 8);
  put(98, 8, "%");
  put(102, 5, "########");
  put(104, 4, "*");
  put(106, 4, "*");
  put(108, 4, "*");
  put(106, 3, "+");
  put(112, 8, "7");
  put(116, 8, "8");
  put(120, 6, "====");
  put(122, 5, "4");
  put(124, 8, "o");

  fill(132, 4, 2, "v");
  fill(132, 5, 2, "v");
  fill(132, 6, 2, "v");
  fill(132, 7, 2, "v");
  fill(132, 8, 2, "v");
  put(138, 7, "====");
  put(140, 6, "9");
  put(142, 8, "^^^^^");
  put(148, 8, "3");
  put(152, 5, "----");
  put(156, 6, "========");
  put(158, 5, "h");
  put(162, 8, "2");
  put(166, 8, "P");

  put(70, 2, "0");
  put(130, 2, "0");
  put(106, 2, "====");
  put(108, 2, "$");
  put(158, 4, "====");
  put(160, 3, "$");
  put(40, 8, "5");
  return armTeeth(g, 9);
}

function buildLedger(): string[] {
  const W = 224;
  const H = 16;
  const g = grid(W, H, 11) as Grid;
  const { put, fill } = g;
  const gap = (x: number, n: number) => {
    fill(x, 11, n, "~");
    fill(x, 12, n, "~");
  };
  const laserCol = (x: number, y0: number, y1: number) => {
    for (let y = y0; y <= y1; y++) put(x, y, "|");
  };

  put(4, 10, "@");
  put(8, 10, "n");
  put(14, 10, "1");
  put(16, 10, "^^^");
  put(20, 9, "====");
  put(22, 8, "2");
  put(26, 10, "0");
  put(30, 8, "========");
  put(32, 7, "5");
  put(34, 7, "i");
  put(38, 10, "3");
  put(42, 9, "%");

  gap(48, 12);
  put(50, 9, "====");
  put(54, 8, "4");
  put(58, 8, "----");
  put(62, 7, "====");
  put(64, 6, "6");
  put(68, 9, "========");
  put(70, 8, "3");
  put(74, 10, "5");
  put(76, 10, "^^");

  gap(82, 14);
  put(84, 8, "====");
  put(88, 6, "----");
  put(92, 7, "====");
  put(94, 5, "2");
  put(98, 9, "========");
  put(100, 8, "h");
  put(104, 10, "7");
  put(108, 10, "1");
  put(110, 8, "====");
  put(112, 7, "0");

  put(116, 10, "^^^^^^^^");
  put(126, 9, "====");
  put(128, 8, "8");
  fill(132, 6, 2, "v");
  fill(132, 7, 2, "v");
  fill(132, 8, 2, "v");
  fill(132, 9, 2, "v");
  fill(132, 10, 2, "v");
  put(138, 8, "====");
  put(140, 7, "9");
  put(144, 10, "^^^^^^^^");
  put(154, 9, "========");
  put(156, 8, "3");
  put(158, 8, "%");

  put(166, 6, "##########");
  put(168, 5, "*");
  put(170, 5, "*");
  put(172, 5, "*");
  put(170, 4, "+");
  put(176, 10, "8");
  put(178, 10, "4");
  put(180, 9, "====");
  put(182, 8, "7");
  put(184, 10, "2");

  laserCol(188, 7, 10);
  put(190, 9, "==");
  laserCol(192, 6, 10);
  put(194, 8, "====");
  laserCol(198, 7, 10);
  put(200, 9, "==");
  laserCol(202, 5, 10);
  put(204, 8, "====");
  laserCol(208, 7, 10);
  put(210, 10, "9");
  put(212, 10, "5");
  put(214, 9, "========");

  put(50, 4, "====");
  put(52, 3, "$");
  put(100, 3, "====");
  put(102, 2, "0");
  put(150, 4, "====");
  put(152, 3, "$");
  put(200, 4, "====");
  put(202, 3, "i");

  for (let y = 12; y <= 14; y++) fill(1, y, 216, "#");
  fill(218, 11, 6, ".");
  fill(218, 12, 6, ".");
  fill(218, 13, 6, ".");
  put(218, 13, "==");
  put(222, 12, "==");
  put(222, 14, "P");
  put(220, 10, "!");
  return armTeeth(g, 11);
}

const ROLE_TIERS: string[][] = [
  ["1", "0"],
  ["1", "0", "2", "3"],
  ["1", "0", "2", "3", "5", "4"],
  ["1", "0", "2", "3", "5", "4", "7", "6"],
  ["1", "0", "2", "3", "5", "4", "7", "6", "8", "9"],
  ["1", "0", "2", "5", "7", "8", "9", "A", "B"],
  ["1", "2", "5", "7", "8", "9", "A", "B", "C", "E"],
  ["2", "5", "7", "8", "9", "A", "B", "C", "E", "Y", "G"],
  ["5", "7", "8", "9", "A", "B", "C", "E", "Y", "G", "H", "K"],
];

function rng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 4294967296;
  };
}

const FLYERS = "0689BCLM";
const WALKERS = "123457AEUYGHKQUNJ";
const MOBS = "1023456789ABCEYGHKQUNJLM!";

function sprinkleMobs(
  g: Grid,
  n: number,
  roles: string[],
  rand: () => number,
  floorY: number,
) {
  const { put, W } = g;
  const start = 10;
  const stop = W - 14;
  const density = Math.min(0.78, 0.34 + n * 0.012);
  const flyPool = roles.filter((r) => FLYERS.includes(r));
  const walkPool = roles.filter((r) => WALKERS.includes(r));
  const fly = () => (flyPool.length ? flyPool[Math.floor(rand() * flyPool.length)] : roles[Math.floor(rand() * roles.length)]);
  const walk = () => (walkPool.length ? walkPool[Math.floor(rand() * walkPool.length)] : roles[Math.floor(rand() * roles.length)]);
  const cell = (x: number, y: number) => {
    if (y < 0 || y >= g.length || x < 0 || x >= W) return "#";
    return g[y][x];
  };
  const vacant = (x: number, y: number) => cell(x, y) === ".";
  const sameNear = (x: number, y: number, ch: string, r = 8) => {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -3; dy <= 3; dy++) {
        if (!dx && !dy) continue;
        if (cell(x + dx, y + dy) === ch) return true;
      }
    }
    return false;
  };
  const crowded = (x: number, y: number, r = 5) => {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (MOBS.includes(cell(x + dx, y + dy))) return true;
      }
    }
    return false;
  };
  const seat = (x: number, y: number, ch: string) => {
    if (!vacant(x, y) || crowded(x, y) || sameNear(x, y, ch)) return false;
    put(x, y, ch);
    return true;
  };

  const walkAway = (x: number, y: number) => {
    const pool = walkPool.length ? walkPool : roles;
    const fresh = pool.filter((r) => !sameNear(x, y, r));
    const src = fresh.length ? fresh : pool;
    return src[Math.floor(rand() * src.length)];
  };
  const flyAway = (x: number, y: number) => {
    const pool = flyPool.length ? flyPool : roles;
    const fresh = pool.filter((r) => !sameNear(x, y, r));
    const src = fresh.length ? fresh : pool;
    return src[Math.floor(rand() * src.length)];
  };

  for (let x = start; x < stop; x++) {
    if (cell(x, floorY) === "#" && vacant(x, floorY - 1) && rand() < density) {
      if (seat(x, floorY - 1, walkAway(x, floorY - 1))) x += 5;
    }
  }

  for (let y = 2; y < floorY - 1; y++) {
    for (let x = start; x < stop; x++) {
      const below = cell(x, y + 1);
      if ((below === "=" || below === "-" || below === "T" || below === "/" || below === "\\") && vacant(x, y) && rand() < density * 0.85) {
        if (seat(x, y, rand() < 0.45 ? flyAway(x, y) : walkAway(x, y))) x += 4;
      }
    }
  }

  for (let x = start + 2; x < stop; x++) {
    const pit = cell(x, floorY) === "." || cell(x, floorY) === "~" || cell(x, floorY) === "^";
    if (pit && vacant(x, floorY - 3) && rand() < density * 0.7) {
      if (seat(x, Math.max(2, floorY - 3 - Math.floor(rand() * 2)), flyAway(x, floorY - 3))) x += 6;
    }
  }

  const air = 2 + Math.floor(n / 7);
  for (let i = 0; i < air; i++) {
    const x = start + Math.floor(rand() * Math.max(1, stop - start));
    const y = 2 + Math.floor(rand() * Math.max(1, floorY - 6));
    seat(x, y, flyAway(x, y));
  }
}

function buildGenerated(n: number, rem: boolean): string[] {
  const rand = rng(n * (rem ? 7919 : 9973) + (rem ? 11 : 42));
  const roles = rem
    ? REMAINDER_ROLES[Math.min(REMAINDER_ROLES.length - 1, Math.floor((n - 31) / 8))]
    : ROLE_TIERS[Math.min(ROLE_TIERS.length - 1, Math.floor((n - 1) / 3))];
  const pick = () => roles[Math.floor(rand() * roles.length)];
  const cellAt = (x: number, y: number) => {
    if (y < 0 || y >= g.length || x < 0 || x >= W) return "#";
    return g[y][x];
  };
  const pickAt = (x: number, y: number) => {
    const used = new Set<string>();
    for (let dx = -8; dx <= 8; dx++) {
      for (let dy = -3; dy <= 3; dy++) {
        const c = cellAt(x + dx, y + dy);
        if (MOBS.includes(c)) used.add(c);
      }
    }
    const pool = roles.filter((r) => !used.has(r));
    const src = pool.length ? pool : roles;
    return src[Math.floor(rand() * src.length)];
  };
  const H = 13;
  const fy = 10;
  const rooms = 6 + (n % 4) + (n >= 45 ? 2 : n >= 25 ? 1 : 0);
  const W = 24 + rooms * (13 + (n % 5)) + 16 + (n % 3) * 8;
  const g = grid(W, H, fy) as Grid;
  const { put, fill } = g;

  const pit = (x: number, w: number, spiked = true) => {
    fill(x, fy, w, ".");
    if (spiked) fill(x, fy + 1, w, "^");
  };
  const shelf = (x: number, up: number, s: string) => put(x, fy - up, s);

  const book1 = [
    "street",
    "chasm",
    "pillars",
    "hall",
    "docks",
    "crumble",
    "roofs",
    "needles",
    "yard",
    "gate",
    "fork",
    "alcove",
    "meander",
    "gallery",
    "ruin",
    "canal",
    "bridge",
    "steps",
    "raised",
    "sparse",
  ];
  const book2 = [
    "belt",
    "springs",
    "draft",
    "foldgap",
    "minus",
    "splitbelt",
    "orbit",
    "gauntlet",
    "tideway",
    "chasm",
    "pillars",
    "fork",
    "gallery",
    "needles",
    "yard",
    "alcove",
    "street",
    "raised",
    "docks",
    "ruin",
  ];
  const catalog = rem ? book2 : book1;
  const seq: string[] = [];
  for (let i = 0; i < rooms; i++) {
    let k = catalog[(n * 11 + i * 17 + i * i * 3) % catalog.length];
    if (seq[seq.length - 1] === k) k = catalog[(i * 9 + n) % catalog.length];
    seq.push(k);
  }

  put(1, fy - 1, "@");
  put(3, fy - 1, "i");
  if (n >= 8) put(5, fy - 1, "h");
  let cx = 8;

  const land = (w = 3 + Math.floor(rand() * 3)) => {
    fill(cx, fy, w, "#");
    cx += w;
  };

  for (const kind of seq) {
    if (kind === "street") {
      const w = 12 + Math.floor(rand() * 6);
      fill(cx, fy, w, "#");
      const a = cx + 3 + Math.floor(rand() * 3);
      pit(a, 2 + Math.floor(rand() * 2), true);
      if (n >= 10) put(cx + w - 4, fy - 1, pick());
      cx += w;
    } else if (kind === "chasm") {
      land(2);
      const w = 6 + Math.min(5, Math.floor(n / 8));
      pit(cx, w, true);
      if (w >= 7) shelf(cx + Math.floor(w / 2) - 1, 2, "==");
      else if (rand() < 0.5) shelf(cx + 1, 2, "--");
      cx += w;
      land(2);
    } else if (kind === "pillars") {
      land(2);
      const count = 3 + (n >= 16 ? 1 : 0);
      for (let i = 0; i < count; i++) {
        pit(cx, 3, true);
        fill(cx + 1, fy, 1, "#");
        fill(cx + 1, fy - 1, 1, "#");
        if (rand() < 0.4) put(cx + 1, fy - 2, pick());
        cx += 3;
      }
      land(2);
    } else if (kind === "hall") {
      const w = 10 + Math.floor(rand() * 4);
      fill(cx, fy, w, "#");
      fill(cx, fy - 4, w, "#");
      put(cx + 3, fy - 1, "|");
      put(cx + 3, fy - 2, "|");
      if (n >= 14) {
        put(cx + 7, fy - 1, "|");
        put(cx + 7, fy - 2, "|");
      }
      cx += w;
    } else if (kind === "docks") {
      land(2);
      const w = 8;
      fill(cx, fy, w, "~");
      fill(cx, fy + 1, w, "~");
      put(cx, fy - 1, "=");
      put(cx + w - 1, fy - 1, "=");
      if (n >= 12) shelf(cx + 3, 2, "==");
      cx += w;
      land(2);
    } else if (kind === "crumble") {
      land(2);
      const w = 7 + Math.min(4, Math.floor(n / 9));
      pit(cx, w, true);
      put(cx, fy - 1, "-".repeat(Math.min(w, 6)));
      cx += w;
      land(2);
    } else if (kind === "roofs") {
      land(2);
      const w = 9;
      pit(cx, w, true);
      shelf(cx + 1, 2, "===");
      shelf(cx + 5, 3, "==");
      cx += w;
      land(2);
    } else if (kind === "needles") {
      const gaps = 3 + (n >= 18 ? 1 : 0);
      for (let i = 0; i < gaps; i++) {
        fill(cx, fy, 2, "#");
        cx += 2;
        pit(cx, 4 + Math.min(3, Math.floor(n / 10)), true);
        cx += 4 + Math.min(3, Math.floor(n / 10));
      }
      land(2);
    } else if (kind === "yard") {
      const w = 11;
      fill(cx, fy, w, "#");
      fill(cx + 2, fy - 1, 2, "#");
      fill(cx + 6, fy - 1, 3, "#");
      fill(cx + 6, fy - 2, 2, "#");
      if (rand() < 0.6) put(cx + 7, fy - 3, pick());
      cx += w;
    } else if (kind === "gate") {
      const w = 8;
      fill(cx, fy, w, "#");
      put(cx + 3, fy - 1, "|");
      put(cx + 3, fy - 2, "|");
      shelf(cx + 5, 3, "==");
      put(cx + 1, fy - 1, pick());
      cx += w;
    } else if (kind === "fork") {
      land(2);
      const w = 9;
      pit(cx, w, true);
      put(cx + 1, fy - 1, "----");
      shelf(cx + 4, 3, "====");
      if (rand() < 0.5) put(cx + 5, fy - 4, pick());
      cx += w;
      land(2);
    } else if (kind === "alcove") {
      const w = 10;
      fill(cx, fy, w, "#");
      for (let y = fy - 3; y <= fy; y++) {
        put(cx, y, "#");
        put(cx + w - 1, y, "#");
      }
      put(cx + w - 1, fy - 1, ".");
      if (rand() < 0.55) put(cx + 4, fy - 1, pick());
      cx += w;
    } else if (kind === "meander") {
      const w = 14;
      fill(cx, fy, w, "#");
      fill(cx + 3, fy - 1, 3, "#");
      fill(cx + 8, fy - 1, 4, "#");
      fill(cx + 8, fy - 2, 2, "#");
      cx += w;
    } else if (kind === "gallery") {
      land(2);
      const w = 12;
      pit(cx, w, true);
      shelf(cx + 1, 2, "==");
      shelf(cx + 5, 3, "==");
      shelf(cx + 9, 2, "==");
      cx += w;
      land(2);
    } else if (kind === "ruin") {
      const w = 12;
      fill(cx, fy, w, "#");
      pit(cx + 3, 3, true);
      fill(cx + 7, fy - 1, 2, "#");
      pit(cx + 9, 2, false);
      cx += w;
    } else if (kind === "canal") {
      const w = 10;
      fill(cx, fy, 3, "#");
      fill(cx + 3, fy, 5, "~");
      fill(cx + 3, fy + 1, 5, "~");
      fill(cx + 8, fy, 2, "#");
      shelf(cx + 4, 2, "==");
      cx += w;
    } else if (kind === "bridge") {
      land(2);
      const w = 11;
      pit(cx, w, true);
      put(cx, fy - 1, "=".repeat(w));
      fill(cx + 3, fy, 1, "#");
      fill(cx + 7, fy, 1, "#");
      if (n >= 16) {
        put(cx + 5, fy - 1, "--");
      }
      cx += w;
      land(2);
    } else if (kind === "steps") {
      land(2);
      const w = 8;
      pit(cx, w, true);
      shelf(cx, 2, "==");
      shelf(cx + 3, 3, "==");
      shelf(cx + 6, 2, "==");
      cx += w;
      land(2);
    } else if (kind === "raised") {
      const w = 10;
      fill(cx, fy, w, "#");
      fill(cx + 2, fy - 1, w - 4, "#");
      put(cx + w - 3, fy - 2, pick());
      cx += w;
    } else if (kind === "sparse") {
      land(3);
      pit(cx, 8 + Math.min(4, Math.floor(n / 7)), true);
      cx += 8 + Math.min(4, Math.floor(n / 7));
      land(3);
    } else if (kind === "belt") {
      land(2);
      const w = 8 + (n >= 40 ? 2 : 0);
      pit(cx, w, true);
      put(cx, fy - 1, "/".repeat(Math.min(5, w - 1)));
      if (n >= 38) shelf(cx + 3, 3, "\\\\\\");
      put(cx + w - 2, fy - 1, pick());
      cx += w;
      land(2);
    } else if (kind === "springs") {
      land(2);
      const w = 8;
      pit(cx, w, true);
      put(cx + 1, fy - 1, "T");
      shelf(cx + 4, 3, "==");
      put(cx + 6, fy - 1, "T");
      cx += w;
      land(2);
    } else if (kind === "draft") {
      land(2);
      const w = 7;
      pit(cx, w, true);
      for (let y = fy - 4; y <= fy - 1; y++) put(cx + 2, y, ":");
      shelf(cx + 4, 3, "==");
      cx += w;
      land(2);
    } else if (kind === "foldgap") {
      land(2);
      const w = 8;
      pit(cx, w, true);
      for (let y = fy - 4; y <= fy; y++) {
        put(cx, y, "#");
        put(cx + w - 1, y, "#");
      }
      shelf(cx + 1, 2, "==");
      shelf(cx + w - 3, 3, "==");
      cx += w;
      land(2);
    } else if (kind === "minus") {
      land(2);
      const w = 8;
      pit(cx, w, true);
      shelf(cx + 2, 2, "====");
      put(cx + 3, fy - 3, "U");
      cx += w;
      land(2);
    } else if (kind === "splitbelt") {
      land(2);
      const w = 10;
      pit(cx, w, true);
      put(cx, fy - 1, "////");
      shelf(cx + 5, 2, "==");
      put(cx + 7, fy - 1, "\\\\\\\\");
      cx += w;
      land(2);
    } else if (kind === "orbit") {
      land(2);
      const w = 9;
      pit(cx, w, true);
      shelf(cx + 2, 3, "====");
      put(cx + 3, fy - 4, "L");
      cx += w;
      land(2);
    } else if (kind === "gauntlet") {
      const w = 11;
      fill(cx, fy, w, "#");
      put(cx + 2, fy - 1, "|");
      put(cx + 2, fy - 2, "|");
      put(cx + 6, fy - 1, pick());
      put(cx + 8, fy - 1, "|");
      put(cx + 8, fy - 2, "|");
      cx += w;
    } else if (kind === "tideway") {
      land(2);
      const w = 10;
      pit(cx, w, true);
      put(cx, fy - 1, "\\\\\\\\");
      shelf(cx + 4, 2, "====");
      put(cx + 7, fy - 1, "////");
      cx += w;
      land(2);
    } else {
      land(3);
      pit(cx, 6, true);
      cx += 6;
      land(2);
    }
  }

  land(6);
  put(cx - 4, fy - 1, "%");
  put(cx - 2, fy - 1, "i");

  if (n === 6) put(6, fy - 2, "W");
  if (n === 8) put(6, fy - 2, "X");
  if (n === 10) put(6, fy - 2, "Z");
  if (n === 12) put(6, fy - 2, "R");
  if (n === 32) put(6, fy - 2, "O");
  if (n === 40) put(6, fy - 2, "I");

  if (n % 3 === 0) {
    put(7, fy - 4, "====");
    put(8, fy - 5, "$");
  }
  if (n % 7 === 0) {
    put(W - 16, fy - 4, "====");
    put(W - 15, fy - 5, "$");
  }

  const end = W - 10;
  if (cx < end - 8) {
    fill(cx, fy, end - 8 - cx, "#");
    cx = end - 8;
  }
  fill(end - 10, fy, 16, "#");
  if (n % 5 === 0 || n === STAGE_COUNT) put(end - 5, fy - 1, "!");
  else put(end - 5, fy - 1, pick());
  put(end, fy - 1, "P");
  put(end - 2, fy - 1, "i");
  sprinkleMobs(g, n, roles, rand, fy);
  dedupeMobs(g, roles, rand);
  return armTeeth(g, fy);
}

function dedupeMobs(g: Grid, roles: string[], rand: () => number) {
  const W = g.W;
  const list: { x: number; y: number; c: string }[] = [];
  for (let y = 0; y < g.length; y++) {
    for (let x = 0; x < W; x++) {
      const c = g[y][x];
      if (MOBS.includes(c) && c !== "!") list.push({ x, y, c });
    }
  }
  const usedNear = (x: number, y: number, skip: { x: number; y: number }) => {
    const s = new Set<string>();
    for (const m of list) {
      if (m.x === skip.x && m.y === skip.y) continue;
      if (Math.abs(m.x - x) <= 8 && Math.abs(m.y - y) <= 3) s.add(m.c);
    }
    return s;
  };
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    for (let j = i + 1; j < list.length; j++) {
      const b = list[j];
      if (a.c !== b.c) continue;
      if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) > 8) continue;
      const near = usedNear(b.x, b.y, b);
      const pool = roles.filter((r) => r !== b.c && !near.has(r));
      const src = pool.length ? pool : roles.filter((r) => r !== b.c);
      if (!src.length) continue;
      const next = src[Math.floor(rand() * src.length)];
      const row = g[b.y];
      g[b.y] = row.slice(0, b.x) + next + row.slice(b.x + 1);
      b.c = next;
    }
  }
}

function buildProgressive(n: number): string[] {
  return buildGenerated(n, false);
}

const REMAINDER_ROLES: string[][] = [
  ["Q", "U", "M", "1"],
  ["Q", "U", "N", "J", "M"],
  ["Q", "U", "N", "J", "L", "M", "5"],
  ["Q", "U", "N", "J", "L", "M", "9", "A", "B"],
];

function buildRemainder(n: number): string[] {
  return buildGenerated(n, true);
}

function progressiveMeta(n: number): LevelMeta {
  const theme = DISTRICTS[Math.min(DISTRICTS.length - 1, n)]?.theme ?? "street";
  const isBoss = n % 5 === 0 || n === STAGE_COUNT;
  const names = [
    "First Recount",
    "Side Ledger",
    "Broken Column",
    "Suction Yard",
    "Split Gallery",
    "Wall-Crawl Annex",
    "Summon Hall",
    "Gradient Slope",
    "Cross Corridor",
    "Echo Archive",
    "Deep Count",
    "Ink Drought",
    "Second Landing",
    "Symbol Court",
    "Closing Phrase",
    "Iris Gallery",
    "Trail Spire",
    "Port Mouth",
    "Slope Engine",
    "Seal Walk",
    "Copy Vault",
    "Arc Chamber",
    "Null Margin",
    "Tight Column",
    "Last Margin",
  ];
  const remainderNames = [
    "After the Point",
    "Plus Field",
    "Minus Cut",
    "Product Yard",
    "Quotient Shaft",
    "Pi Gallery",
    "Radix Ditch",
    "Summand Walk",
    "Difference Hall",
    "Fold Well",
    "Tide Road",
    "Operator Court",
    "Gold Remainder",
    "Hail Column",
    "Orrery Annex",
    "Glass Margin",
    "Script Vein",
    "Lattice Rise",
    "Void Phrase",
    "Last Operator",
  ];
  const name =
    n === FIRST_BOOK
      ? "The Period"
      : n === STAGE_COUNT
        ? "The Remainder"
        : n === 35
          ? "Summand"
          : n === 40
            ? "Difference"
            : n === 45
              ? "Product"
              : n === 50
                ? "Quotient"
                : n === 55
                  ? "Infinitum"
                  : isBoss
                    ? `Warden ${n}`
                    : n > FIRST_BOOK
                      ? `${remainderNames[(n - 31) % remainderNames.length]} ${n}`
                      : `${names[(n - 1) % names.length]} ${n}`;
  const tasks: TaskDef[] = [{ id: `clear-${n}`, text: isBoss ? "Defeat the warden" : "Reach the gate" }];
  if (n === 6) tasks.push({ id: "word-wall", text: "Pick up WALL" });
  if (n === 8) tasks.push({ id: "word-rise", text: "Pick up RISE" });
  if (n === 10) tasks.push({ id: "word-lock", text: "Pick up LOCK" });
  if (n === 12) tasks.push({ id: "word-burn", text: "Pick up BURN" });
  if (n === 32) tasks.push({ id: "word-fold", text: "Pick up FOLD" });
  if (n === 40) tasks.push({ id: "word-tide", text: "Pick up TIDE" });
  return {
    id: `stage${n}` as LevelId,
    name,
    theme,
    objective: isBoss
      ? n === FIRST_BOOK
        ? "End-Mark is the period. Close it. The sentence is not over."
        : n === STAGE_COUNT
          ? "The Remainder is the last unfiled mark. Write over it."
          : "Clear the warden. Take the gate."
      : n > FIRST_BOOK
        ? "Operators eat shelves. Fold off stems. Ride the belts."
        : n >= 10
          ? "Scribe the gaps. The floor will not carry you."
          : "Cross the ledger. Reach the gate.",
    tasks,
    rows: n > FIRST_BOOK ? buildRemainder(n) : buildProgressive(n),
    exit: n === STAGE_COUNT ? "win" : "hub",
    index: n,
  };
}

function buildHub(): string[] {
  const W = 102;
  const H = 11;
  const fy = 8;
  const g = grid(W, H, fy) as Grid;
  const { put, fill } = g;
  put(2, fy - 1, "@");
  put(4, fy - 1, "F");
  put(5, fy - 1, "i");
  put(7, fy - 1, "e");
  put(9, fy - 1, "t");
  fill(12, fy - 4, 36, "=");
  put(13, fy - 5, "r");
  put(16, fy - 5, "k");
  put(19, fy - 5, "n");
  put(22, fy - 5, "f");
  put(25, fy - 5, "d");
  put(28, fy - 5, "w");
  put(31, fy - 5, "x");
  put(34, fy - 5, "z");
  put(37, fy - 5, "l");
  put(40, fy - 5, "c");
  put(21, fy - 2, "i");
  put(29, fy - 2, "o");
  put(18, fy - 1, "[");
  put(26, fy - 1, "]");
  put(34, fy - 1, "{");
  put(42, fy - 1, "}");
  put(50, fy - 1, "(");
  for (let y = 1; y <= fy - 3; y++) {
    put(60, y, "#");
    put(64, y, "#");
  }
  put(62, fy - 1, "j");
  put(76, fy - 1, ">");
  put(92, fy - 1, "<");
  put(88, fy - 1, "h");
  return armTeeth(g, fy);
}

const hand: Record<string, LevelMeta> = {
  hub: {
    id: "hub",
    name: "Lower Register Stacks",
    theme: "hub",
    objective: "Left: five closed chapters, one ledger each. Right: the rest of the book — the only door that keeps changing.",
    tasks: [
      { id: "talk-e", text: "Talk to e" },
      { id: "talk-t", text: "Learn scribing from t" },
      { id: "enter-lanes", text: "Enter the Overcast Exchange" },
      { id: "enter-gutter", text: "Enter the Gutter Press", need: 1 },
      { id: "enter-coil", text: "Enter the Coil Yard", need: 3 },
      { id: "enter-fort", text: "Enter G's Fort", need: 4 },
      { id: "enter-ledger", text: "Enter the Null Ledger", need: 4 },
      { id: "continue", text: "Cross into the Unbound Sentence — the only door that keeps opening new ledgers", need: 5 },
    ],
    rows: buildHub(),
    index: 0,
  },
  stage1: {
    id: "stage1",
    name: "Overcast Exchange",
    theme: "street",
    objective: "Walk the street. Free Gale. Get the Drop Cap. Drop into the pit.",
    tasks: [
      { id: "talk-m", text: "Talk to m" },
      { id: "recruit-s", text: "Free s — Gale" },
      { id: "word-wall", text: "Pick up WALL" },
      { id: "drop-cap", text: "Get the Drop Cap" },
      { id: "dualis", text: "Defeat Dualis" },
      { id: "gate-stacks", text: "Take the STACKS gate" },
    ],
    rows: buildExchange(),
    exit: "hub",
    index: 1,
  },
  stage3: {
    id: "stage3",
    name: "Gutter Press",
    theme: "canal",
    objective: "Build shelves across the gaps. Recruit Tide. Learn RISE. Reach the gate.",
    tasks: [
      { id: "talk-u", text: "Talk to u" },
      { id: "recruit-e", text: "Recruit e — Tide" },
      { id: "word-rise", text: "Pick up RISE" },
      { id: "cross-gutter", text: "Cross the last canal" },
      { id: "gate-press", text: "Take the PRESS gate" },
    ],
    rows: buildGutter(),
    exit: "hub",
    index: 3,
  },
  stage4: {
    id: "stage4",
    name: "Coil Yard",
    theme: "coil",
    objective: "Use the vents. Recruit Ember. Dash the spikes. Learn LOCK.",
    tasks: [
      { id: "talk-p", text: "Talk to p" },
      { id: "recruit-r", text: "Recruit r — Ember" },
      { id: "word-lock", text: "Pick up LOCK" },
      { id: "gate-coil", text: "Take the COIL gate" },
    ],
    rows: buildCoil(),
    exit: "hub",
    index: 4,
  },
  stage2: {
    id: "stage2",
    name: "G's Fort",
    theme: "fort",
    objective: "Recruit b — Stone. Face G, who opened the ports. Take the CHAPTER gate.",
    tasks: [
      { id: "recruit-b", text: "Recruit b — Stone" },
      { id: "word-burn", text: "Pick up BURN" },
      { id: "importer", text: "Defeat G" },
      { id: "gate-chapter", text: "Take the CHAPTER gate" },
    ],
    rows: armTeeth(slice(`
################################################################################################
#..............................................................................................#
#.$..............vv..............|.............................................................#
#................vv..............|...................b.....................R...................#
#.........4.............*......F..............##########............========...................#
#...................########.........8........#........#.........2.............................#
#@..........====....#..vv..#...................#....*...#........4..............o...............#
#.............====..#..vv..#....^^^^..........#........#.........====..........................#
#....^^.............########......5...........##########...7........##############.............#
##########################################################################################.....#
#................................3.......................9...............................#P.!..#
################################################################################################
`)),
    exit: "hub",
    index: 2,
  },
  stage5: {
    id: "stage5",
    name: "The Null Ledger",
    theme: "vault",
    objective: "Cross every hazard. Defeat Nullis. Close the last account of the first book.",
    tasks: [
      { id: "talk-n", text: "Talk to n in the foyer" },
      { id: "cross-lasers", text: "Pass the laser corridor" },
      { id: "nullis", text: "Defeat Nullis" },
      { id: "gate-ledger", text: "Take the LEDGER gate" },
    ],
    rows: buildLedger(),
    exit: "hub",
    index: 5,
  },
};

export const LEVELS: Record<string, LevelMeta> = { ...hand };

for (let n = 6; n <= STAGE_COUNT; n++) {
  const meta = progressiveMeta(n);
  LEVELS[meta.id] = meta;
}

export function getLevel(id: string): LevelMeta {
  return LEVELS[id] ?? LEVELS.hub;
}

export function nextStageId(progress: number): LevelId {
  const n = Math.min(STAGE_COUNT, Math.max(1, progress + 1));
  return `stage${n}` as LevelId;
}

export function lastClearedId(progress: number): LevelId | null {
  if (progress < 1) return null;
  const n = Math.min(STAGE_COUNT, progress);
  return `stage${n}` as LevelId;
}

export function tileAt(rows: string[], tx: number, ty: number): string {
  if (ty < 0 || ty >= rows.length) return "#";
  const row = rows[ty];
  if (tx < 0 || tx >= row.length) return "#";
  return row[tx];
}
