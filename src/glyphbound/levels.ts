import type { LevelId, TaskDef, ThemeId } from "./types";

export type { LevelId, ThemeId };

export interface LevelMeta {
  id: LevelId;
  name: string;
  theme: ThemeId;
  objective: string;
  tasks: TaskDef[];
  rows: string[];
  exit?: "hub" | "win";
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
  // y=0 is solid ceiling; y=1 is kept open so high platforms have real headroom
  // (avoids the old ceiling-clip / sticky-ceiling problem on tall ledges).
  const rows = Array.from({ length: H }, (_, y) => {
    if (y === 0 || y === H - 1) return "#".repeat(W);
    return "#" + ".".repeat(W - 2) + "#";
  });
  const put = (x: number, y: number, s: string) => {
    if (y < 0 || y >= H) return;
    const r = rows[y];
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
  // H+1 and all y+1 → extra open row under the solid ceiling (higher headroom).
  const W = 176;
  const H = 13;
  const g = grid(W, H, 8) as Grid;
  const { put, fill } = g;
  const pit = 148;
  const pitW = 18;
  fill(pit, 8, pitW, ".");
  fill(pit, 10, pitW, ".");
  put(1, 7, "@");
  put(14, 7, "m");
  put(8, 6, "==");
  put(12, 6, "####");
  put(22, 7, "1");
  put(28, 4, "====");
  put(40, 2, "0");
  put(58, 7, "1");
  put(62, 6, "========");
  put(72, 6, "%");
  put(76, 6, "i");
  put(58, 3, "====");
  put(70, 2, "0");
  put(92, 6, "####");
  put(94, 5, "s");
  put(97, 5, "q");
  put(104, 4, "====");
  put(108, 4, "a");
  put(100, 2, "0");
  put(120, 6, "====");
  put(122, 5, "W");
  put(130, 7, "1");
  put(132, 6, "%");
  put(136, 7, "h");
  put(128, 4, "========");
  put(132, 3, "+");
  put(118, 2, "0");
  put(pit - 14, 7, "y");
  put(pit - 10, 6, "========");
  put(pit - 6, 5, "D");
  put(pit - 2, 6, "%");
  put(pit + 4, 7, "VV");
  put(pit + 8, 6, "o");
  put(pit + 4, 11, "P");
  put(pit + 10, 11, "!");
  put(90, 2, "0");
  // secret: far left high ledge
  put(4, 3, "====");
  put(5, 2, "$");
  // secret: past the pit boss shelf
  put(pit + 14, 10, "==");
  put(pit + 14, 9, "$");
  put(48, 7, "5");
  put(110, 7, "7");
  return g;
}

function buildGutter(): string[] {
  const W = 164;
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
  put(20, 6, "====");
  put(22, 5, "i");

  gap(30, 8);
  put(38, 7, "%");
  put(42, 8, "3");
  put(48, 7, "====");

  gap(56, 9);
  put(58, 6, "----");
  put(68, 5, "====");
  put(70, 4, "X");
  put(74, 8, "g");
  put(80, 8, "%");
  put(84, 7, "i");

  gap(90, 10);
  put(92, 6, "==");
  put(98, 5, "----");
  put(108, 7, "====");
  put(112, 8, "3");
  put(118, 6, "========");
  put(120, 5, "h");
  put(128, 8, "0");

  gap(134, 12);
  put(136, 6, "====");
  put(144, 5, "====");
  put(150, 8, "P");
  put(154, 7, "+");
  put(40, 2, "0");
  put(100, 2, "0");
  // secret: high over the first canal
  put(24, 3, "====");
  put(25, 2, "$");
  // secret: dead end after last sluice
  put(158, 6, "==");
  put(158, 5, "$");
  put(64, 8, "5");
  put(122, 8, "7");
  return g;
}

function buildCoil(): string[] {
  const W = 168;
  const H = 14;
  const g = grid(W, H, 9) as Grid;
  const { put, fill } = g;

  put(1, 8, "@");
  put(10, 8, "p");
  put(16, 8, "1");
  put(22, 8, "^^^^");
  put(30, 7, "====");
  put(36, 8, "%");

  fill(44, 6, 3, "v");
  fill(44, 7, 3, "v");
  fill(44, 8, 3, "v");
  put(50, 8, "1");
  put(56, 6, "====");
  put(58, 5, "Z");
  put(64, 8, "6");

  put(72, 8, "^^^^^^^^");
  put(82, 7, "----");
  put(90, 8, "%");
  put(94, 5, "########");
  put(96, 4, "*");
  put(100, 4, "*");
  put(98, 3, "+");
  put(108, 8, "8");
  put(114, 6, "====");
  put(118, 8, "o");

  fill(126, 5, 2, "v");
  fill(126, 6, 2, "v");
  fill(126, 7, 2, "v");
  fill(126, 8, 2, "v");
  put(132, 7, "====");
  put(140, 8, "3");
  put(146, 6, "========");
  put(148, 5, "h");
  put(156, 8, "P");
  put(70, 2, "0");
  put(130, 2, "0");
  // secret: above the locked coils
  put(100, 2, "====");
  put(102, 2, "$");
  // secret: far right high shelf
  put(150, 4, "====");
  put(151, 3, "$");
  put(40, 8, "5");
  put(120, 8, "7");
  return g;
}

export const LEVELS: Record<LevelId, LevelMeta> = {
  hub: {
    id: "hub",
    name: "Lower Register Stacks",
    theme: "hub",
    objective: "Talk to the letters, then pick a door.",
    tasks: [
      { id: "talk-e", text: "Talk to e" },
      { id: "talk-t", text: "Learn scribing from t" },
      { id: "enter-lanes", text: "Enter the Overcast Exchange" },
      { id: "enter-gutter", text: "Enter the Gutter Press", need: "stage1" },
      { id: "enter-coil", text: "Enter the Coil Yard", need: "stage3" },
      { id: "enter-fort", text: "Enter G's Fort", need: "stage4" },
    ],
    rows: slice(`
################################################
#..............................................#
#......................+.......................#
#..............====............................#
#..........====................................#
#....e...t........r...k....n...................#
#@...F...i.......[....]...{....}......h....o...#
################################################
################################################
`),
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
  },
  stage2: {
    id: "stage2",
    name: "G's Fort",
    theme: "fort",
    objective: "Recruit b. Face G, who opened the ports. Take the last gate.",
    tasks: [
      { id: "recruit-b", text: "Recruit b" },
      { id: "word-burn", text: "Pick up BURN" },
      { id: "importer", text: "Defeat G" },
      { id: "gate-chapter", text: "Take the CHAPTER gate" },
    ],
    rows: slice(`
################################################################################################
#..............................................................................................#
#.$..............vv............................................................................#
#................vv................................b.....................R.....................#
#.........4.............*......F..............##########............========...................#
#...................########.........8........#........#.......................................#
#@..........====....#..vv..#...................#....*...#........4..............o...............#
#.............====..#..vv..#..................#........#.........====..........................#
#...................########..................##########............##############.............#
##########################################################################################.....#
#................................5.......................7...............................#P.!..#
################################################################################################
`),
    exit: "win",
  },
};

export function tileAt(rows: string[], tx: number, ty: number): string {
  if (ty < 0 || ty >= rows.length) return "#";
  const row = rows[ty];
  if (tx < 0 || tx >= row.length) return "#";
  return row[tx];
}
