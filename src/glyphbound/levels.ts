import { DISTRICTS } from "./districts";
import type { LevelId, TaskDef, ThemeId } from "./types";
import { STAGE_COUNT } from "./types";

export type { LevelId, ThemeId };
export { STAGE_COUNT };

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
  put(88, 2, "0");
  return g;
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
  return g;
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
  put(72, 4, "0");

  put(76, 8, "^^^^^^^^");
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
  return g;
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

  put(1, 10, "@");
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

  fill(218, 11, 5, ".");
  fill(218, 12, 5, ".");
  fill(218, 13, 5, ".");
  put(220, 10, "!");
  put(222, 14, "P");
  put(218, 13, "==");
  put(222, 12, "==");
  return g;
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

function buildProgressive(n: number): string[] {
  const rand = rng(n * 9973 + 42);
  const tier = Math.min(ROLE_TIERS.length - 1, Math.floor((n - 1) / 3));
  const roles = ROLE_TIERS[tier];
  const pick = () => roles[Math.floor(rand() * roles.length)];
  const H = 15 + Math.min(11, Math.floor(n / 2.4));
  const floorY = H - 3;
  const beats = 4 + Math.floor((n - 1) / 5);
  const W = 28 + beats * (16 + Math.min(8, Math.floor(n / 4))) + 22;
  const g = grid(W, H, floorY) as Grid;
  const { put, fill } = g;

  const pit = (x: number, w: number, spiked = true) => {
    fill(x, floorY, w, ".");
    if (spiked && floorY + 1 < H - 1) fill(x, floorY + 1, w, "^");
  };

  put(1, floorY - 1, "@");
  put(3, floorY - 1, "i");
  if (n >= 8) put(5, floorY - 1, "h");

  let cx = 8;
  const island = (w: number, loot = true) => {
    fill(cx, floorY, w, "#");
    if (loot && rand() < 0.55) put(cx + Math.max(0, Math.floor(w / 2) - 1), floorY - 1, "i");
    if (loot && rand() < 0.22 && n >= 8) put(cx + 1, floorY - 1, "h");
    cx += w;
  };

  const catalog: string[] = ["gap", "stairs", "crumble", "canal"];
  if (n >= 8) catalog.push("laser", "tease");
  if (n >= 11) catalog.push("climb", "squeeze");
  if (n >= 14) catalog.push("vent", "false");
  if (n >= 18) catalog.push("lockgate", "rhythm");
  if (n >= 22) catalog.push("double", "bounce");
  if (n >= 26) catalog.push("gauntlet");

  const used: string[] = [];
  for (let s = 0; s < beats; s++) {
    let kind = catalog[(s * 3 + n * 2) % catalog.length];
    if (used[used.length - 1] === kind) kind = catalog[(s * 5 + n) % catalog.length];
    used.push(kind);
    island(3 + (s === 0 ? 2 : 0), s === 0);

    if (kind === "gap") {
      const w = 5 + Math.min(4, Math.floor(n / 8));
      pit(cx, w, true);
      if (n >= 12 && w >= 7) put(cx + Math.floor(w / 2), floorY - 1, "--");
      if (rand() < 0.4) put(cx - 1, floorY - 1, pick());
      cx += w;
    } else if (kind === "stairs") {
      const span = 10 + Math.min(4, Math.floor(n / 10));
      pit(cx, span, true);
      put(cx + 1, floorY - 2, "===");
      put(cx + 6, floorY - 4, "==");
      if (n >= 10) put(cx + span - 3, floorY - 6, "==");
      if (n >= 16) put(cx + 4, floorY - 5, "=");
      cx += span;
    } else if (kind === "crumble") {
      const w = 7 + Math.min(5, Math.floor(n / 7));
      pit(cx, w, true);
      put(cx, floorY - 1, "-".repeat(Math.min(6, w - 1)));
      if (n >= 14) put(cx + 3, floorY - 3, "----");
      cx += w;
    } else if (kind === "canal") {
      const w = 6 + Math.min(4, Math.floor(n / 9));
      fill(cx, floorY, w, "~");
      if (floorY + 1 < H - 1) fill(cx, floorY + 1, w, "~");
      put(cx, floorY - 1, "=");
      put(cx + w - 1, floorY - 1, "=");
      if (n >= 15) put(cx + 2, floorY - 3, "===");
      cx += w;
    } else if (kind === "laser") {
      const w = 7 + (n >= 18 ? 2 : 0);
      pit(cx, w, n >= 12);
      put(cx + 2, floorY - 1, "|");
      put(cx + 2, floorY - 2, "|");
      if (n >= 12) {
        put(cx + 4, floorY - 1, "|");
        put(cx + 4, floorY - 2, "|");
        put(cx + 4, floorY - 3, "|");
      }
      if (n >= 18) {
        put(cx + 6, floorY - 2, "|");
        put(cx + 6, floorY - 1, "|");
      }
      put(cx + 1, floorY - 5, "====");
      if (rand() < 0.5) put(cx + w - 1, floorY - 1, pick());
      cx += w;
    } else if (kind === "tease") {
      const w = 8;
      pit(cx, w, true);
      put(cx + 2, floorY - 2, "==");
      put(cx + 5, floorY - 2, "--");
      put(cx + 3, floorY - 4, "=");
      cx += w;
    } else if (kind === "climb") {
      const w = 8;
      pit(cx, w, true);
      for (let y = 2; y <= floorY; y++) {
        put(cx, y, "#");
        put(cx + w - 1, y, "#");
      }
      put(cx + 1, floorY - 2, "==");
      put(cx + w - 3, floorY - 5, "==");
      put(cx + 1, floorY - 8, "==");
      if (n >= 20) put(cx + w - 3, floorY - 11, "==");
      put(cx + 2, floorY - 6, "i");
      cx += w;
    } else if (kind === "squeeze") {
      const w = 7 + (n >= 20 ? 2 : 0);
      pit(cx, w, true);
      fill(cx, floorY - 3, w, "#");
      put(cx + 1, floorY - 2, "i");
      cx += w;
    } else if (kind === "vent") {
      const w = 6;
      fill(cx + 2, Math.max(2, floorY - 5), 1, "v");
      for (let y = Math.max(2, floorY - 5); y <= floorY - 1; y++) put(cx + 2, y, "v");
      pit(cx + 3, 3, true);
      put(cx, floorY - 1, pick());
      cx += w;
    } else if (kind === "false") {
      const w = 8;
      pit(cx, w, true);
      put(cx, floorY - 1, "-".repeat(w - 1));
      put(cx + 2, floorY - 3, "----");
      put(cx + 4, floorY - 5, "--");
      cx += w;
    } else if (kind === "lockgate") {
      const w = 8;
      pit(cx, w, true);
      put(cx + 1, floorY - 2, "===");
      put(cx + 2, floorY - 3, pick());
      put(cx + 5, floorY - 4, "==");
      cx += w;
    } else if (kind === "rhythm") {
      const w = 12;
      pit(cx, w, true);
      put(cx + 1, floorY - 2, "==");
      put(cx + 5, floorY - 3, "==");
      put(cx + 9, floorY - 2, "==");
      if (n >= 22) put(cx + 6, floorY - 5, "--");
      cx += w;
    } else if (kind === "double") {
      const w = 11;
      pit(cx, 5, true);
      fill(cx + 5, floorY, 2, "#");
      put(cx + 5, floorY - 1, "--");
      pit(cx + 7, 4, true);
      cx += w;
    } else if (kind === "bounce") {
      const w = 9;
      pit(cx, w, true);
      put(cx + 1, floorY - 2, "===");
      put(cx + 1, floorY - 5, "===");
      put(cx + 1, floorY - 8, "===");
      put(cx + w - 3, floorY - 3, "==");
      put(cx + w - 3, floorY - 6, "==");
      cx += w;
    } else if (kind === "gauntlet") {
      const w = 12;
      pit(cx, w, true);
      put(cx + 2, floorY - 1, "|");
      put(cx + 2, floorY - 2, "|");
      put(cx + 5, floorY - 3, "====");
      put(cx + 6, floorY - 4, pick());
      put(cx + 9, floorY - 1, "|");
      put(cx + 9, floorY - 2, "|");
      put(cx + 9, floorY - 3, "|");
      put(cx + 3, floorY - 6, "====");
      cx += w;
    } else {
      const w = 6;
      pit(cx, w, true);
      cx += w;
    }
  }

  island(8, true);
  put(cx - 6, floorY - 1, "%");
  put(cx - 4, floorY - 1, "i");

  if (n === 6) put(6, floorY - 2, "W");
  if (n === 8) put(6, floorY - 2, "X");
  if (n === 10) put(6, floorY - 2, "Z");
  if (n === 12) put(6, floorY - 2, "R");

  if (n % 3 === 0) {
    put(6, 3, "====");
    put(7, 2, "$");
  }
  if (n % 7 === 0) {
    put(W - 16, 3, "====");
    put(W - 15, 2, "$");
  }

  const end = W - 10;
  if (cx < end - 14) {
    const remain = end - 14 - cx;
    pit(cx, remain, true);
    for (let x = cx + 2; x < cx + remain - 2; x += 5 + Math.min(3, Math.floor(n / 10))) {
      put(x, floorY - 2, "==");
    }
  }
  fill(end - 12, floorY, 14, "#");
  put(end - 8, floorY - 2, "====");
  if (n % 5 === 0 || n === STAGE_COUNT) put(end - 6, floorY - 1, "!");
  else put(end - 6, floorY - 1, pick());
  put(end, floorY - 1, "P");
  put(end - 2, floorY - 1, "i");
  return g;
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
  const name =
    n === STAGE_COUNT ? "Final Account" : isBoss ? `Warden ${n}` : `${names[(n - 1) % names.length]} ${n}`;
  const tasks: TaskDef[] = [{ id: `clear-${n}`, text: isBoss ? "Defeat the warden" : "Reach the gate" }];
  if (n === 6) tasks.push({ id: "word-wall", text: "Pick up WALL" });
  if (n === 8) tasks.push({ id: "word-rise", text: "Pick up RISE" });
  if (n === 10) tasks.push({ id: "word-lock", text: "Pick up LOCK" });
  if (n === 12) tasks.push({ id: "word-burn", text: "Pick up BURN" });
  return {
    id: `stage${n}` as LevelId,
    name,
    theme,
    objective: isBoss
      ? "Clear the warden. Take the gate."
      : n >= 10
        ? "Scribe the gaps. The floor will not carry you."
        : "Cross the ledger. Reach the gate.",
    tasks,
    rows: buildProgressive(n),
    exit: n === STAGE_COUNT ? "win" : "hub",
    index: n,
  };
}

function buildHub(): string[] {
  return slice(`
################################################################################
#..............................................................................#
#......................+.......................................................#
#..............====............................................................#
#..........====................................................................#
#....e...t........r...k....n........f...d....w....x....z....l....o....i....c...#
#@...F...i.......[....]...{....}..(...d......>......<....h....o......j.........#
################################################################################
################################################################################
`);
}

const hand: Record<string, LevelMeta> = {
  hub: {
    id: "hub",
    name: "Lower Register Stacks",
    theme: "hub",
    objective: "Talk to the letters, then pick a door. Continue opens the next unread ledger.",
    tasks: [
      { id: "talk-e", text: "Talk to e" },
      { id: "talk-t", text: "Learn scribing from t" },
      { id: "enter-lanes", text: "Enter the Overcast Exchange" },
      { id: "enter-gutter", text: "Enter the Gutter Press", need: 1 },
      { id: "enter-coil", text: "Enter the Coil Yard", need: 3 },
      { id: "enter-fort", text: "Enter G's Fort", need: 4 },
      { id: "enter-ledger", text: "Enter the Null Ledger", need: 4 },
      { id: "continue", text: "Take the Continue gate deeper", need: 5 },
    ],
    rows: buildHub(),
    index: 0,
  },
  stage1: {
    id: "stage1",
    name: "Overcast Exchange",
    theme: "street",
    objective: "Walk the street. Get the Drop Cap. Drop into the pit.",
    tasks: [
      { id: "talk-m", text: "Talk to m" },
      { id: "recruit-s", text: "Free s" },
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
    objective: "Build shelves across the gaps. Learn RISE. Reach the gate.",
    tasks: [
      { id: "talk-u", text: "Talk to u" },
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
    objective: "Use the vents. Dash the spikes. Learn LOCK.",
    tasks: [
      { id: "talk-p", text: "Talk to p" },
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
    objective: "Recruit b. Face G, who opened the ports. Take the CHAPTER gate.",
    tasks: [
      { id: "recruit-b", text: "Recruit b" },
      { id: "word-burn", text: "Pick up BURN" },
      { id: "importer", text: "Defeat G" },
      { id: "gate-chapter", text: "Take the CHAPTER gate" },
    ],
    rows: slice(`
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
#................................5.......................7...............................#P.!..#
################################################################################################
`),
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
