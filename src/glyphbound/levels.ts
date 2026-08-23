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
  const W = 176;
  const H = 12;
  const g = grid(W, H, 7) as Grid;
  const { put, fill } = g;
  const pit = 148;
  const pitW = 18;
  fill(pit, 7, pitW, ".");
  fill(pit, 9, pitW, ".");
  put(1, 6, "@");
  put(14, 6, "m");
  put(8, 5, "==");
  put(12, 5, "####");
  put(22, 6, "1");
  put(28, 3, "====");
  put(40, 1, "0");
  put(58, 6, "1");
  put(62, 5, "========");
  put(72, 5, "%");
  put(76, 5, "i");
  put(58, 2, "====");
  put(70, 1, "0");
  put(92, 5, "####");
  put(94, 4, "s");
  put(97, 4, "q");
  put(104, 3, "====");
  put(108, 3, "a");
  put(100, 1, "0");
  put(120, 5, "====");
  put(122, 4, "W");
  put(130, 6, "1");
  put(132, 5, "%");
  put(136, 6, "h");
  put(128, 3, "========");
  put(132, 2, "+");
  put(118, 1, "0");
  put(pit - 14, 6, "y");
  put(pit - 10, 5, "========");
  put(pit - 6, 4, "D");
  put(pit - 2, 5, "%");
  put(pit + 4, 6, "VV");
  put(pit + 8, 5, "o");
  put(pit + 4, 10, "P");
  put(pit + 10, 10, "!");
  put(90, 1, "0");
  return g;
}

function buildGutter(): string[] {
  const W = 164;
  const H = 13;
  const g = grid(W, H, 8) as Grid;
  const { put, fill } = g;
  const gap = (x: number, n: number) => {
    fill(x, 8, n, "~");
    fill(x, 9, n, "~");
  };

  put(1, 7, "@");
  put(10, 7, "u");
  put(16, 7, "1");
  put(8, 6, "==");
  put(20, 5, "====");
  put(22, 4, "i");

  gap(30, 8);
  put(38, 6, "%");
  put(42, 7, "3");
  put(48, 6, "====");

  gap(56, 9);
  put(58, 5, "----");
  put(68, 4, "====");
  put(70, 3, "X");
  put(74, 7, "g");
  put(80, 7, "%");
  put(84, 6, "i");

  gap(90, 10);
  put(92, 5, "==");
  put(98, 4, "----");
  put(108, 6, "====");
  put(112, 7, "3");
  put(118, 5, "========");
  put(120, 4, "h");
  put(128, 7, "0");

  gap(134, 12);
  put(136, 5, "====");
  put(144, 4, "====");
  put(150, 7, "P");
  put(154, 6, "+");
  put(40, 1, "0");
  put(100, 1, "0");
  return g;
}

function buildCoil(): string[] {
  const W = 168;
  const H = 13;
  const g = grid(W, H, 8) as Grid;
  const { put, fill } = g;

  put(1, 7, "@");
  put(10, 7, "p");
  put(16, 7, "1");
  put(22, 7, "^^^^");
  put(30, 6, "====");
  put(36, 7, "%");

  fill(44, 5, 3, "v");
  fill(44, 6, 3, "v");
  fill(44, 7, 3, "v");
  put(50, 7, "1");
  put(56, 5, "====");
  put(58, 4, "Z");
  put(64, 7, "6");

  put(72, 7, "^^^^^^^^");
  put(82, 6, "----");
  put(90, 7, "%");
  put(94, 4, "########");
  put(96, 3, "*");
  put(100, 3, "*");
  put(98, 2, "+");
  put(108, 7, "8");
  put(114, 5, "====");
  put(118, 7, "o");

  fill(126, 4, 2, "v");
  fill(126, 5, 2, "v");
  fill(126, 6, 2, "v");
  fill(126, 7, 2, "v");
  put(132, 6, "====");
  put(140, 7, "3");
  put(146, 5, "========");
  put(148, 4, "h");
  put(156, 7, "P");
  put(70, 1, "0");
  put(130, 1, "0");
  return g;
}

export const LEVELS: Record<LevelId, LevelMeta> = {
  hub: {
    id: "hub",
    name: "Lower Register Stacks",
    theme: "hub",
    objective: "Talk, then pick a door.",
    tasks: [
      { id: "talk-e", text: "Hear e, the Pawned Eye" },
      { id: "talk-t", text: "Learn scribing from t" },
      { id: "enter-lanes", text: "Enter the Overcast Exchange" },
      { id: "enter-gutter", text: "Enter the Gutter Press", need: "stage1" },
      { id: "enter-coil", text: "Enter the Coil Yard", need: "stage3" },
      { id: "enter-fort", text: "Enter Tetrarch's Fort", need: "stage4" },
    ],
    rows: slice(`
################################################
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
    objective: "Read the street. Claim the Drop Cap. Drop into the pit.",
    tasks: [
      { id: "talk-m", text: "Hear m, the Remainder" },
      { id: "recruit-s", text: "Free s, the Sibilant" },
      { id: "word-wall", text: "Inscribe WALL" },
      { id: "drop-cap", text: "Claim the Drop Cap" },
      { id: "dualis", text: "Round Dualis down" },
      { id: "gate-stacks", text: "Take the STACKS gate" },
    ],
    rows: buildExchange(),
    exit: "hub",
  },
  stage3: {
    id: "stage3",
    name: "Gutter Press",
    theme: "canal",
    objective: "Scribe the gaps. Learn RISE. Reach the press gate.",
    tasks: [
      { id: "talk-u", text: "Hear u, the Understroke" },
      { id: "word-rise", text: "Inscribe RISE" },
      { id: "cross-gutter", text: "Cross the last sluice" },
      { id: "gate-press", text: "Take the PRESS gate" },
    ],
    rows: buildGutter(),
    exit: "hub",
  },
  stage4: {
    id: "stage4",
    name: "Coil Yard",
    theme: "coil",
    objective: "Walk the vents. Dash the teeth. Learn LOCK.",
    tasks: [
      { id: "talk-p", text: "Hear p, the Pilcrow" },
      { id: "word-lock", text: "Inscribe LOCK" },
      { id: "gate-coil", text: "Take the COIL gate" },
    ],
    rows: buildCoil(),
    exit: "hub",
  },
  stage2: {
    id: "stage2",
    name: "Tetrarch's Right Angles",
    theme: "fort",
    objective: "Stand with b. Break Tetrarch. Take the last gate.",
    tasks: [
      { id: "recruit-b", text: "Stand with b, the Bulwark" },
      { id: "word-burn", text: "Inscribe BURN" },
      { id: "tetrarch", text: "Break Tetrarch" },
      { id: "gate-chapter", text: "Take the CHAPTER gate" },
    ],
    rows: slice(`
################################################################################################
#................vv............................................................................#
#................vv................................b.....................R.....................#
#.........4.............*......F..............##########............========...................#
#...................########.........8........#........#.......................................#
#@..........====....#..vv..#...................#....*...#........4..............o...............#
#.............====..#..vv..#..................#........#.........====..........................#
#...................########..................##########............##############.............#
##########################################################################################.....#
#........................................................................................#P.!..#
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
