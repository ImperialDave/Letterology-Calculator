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

/**
 * Overcast Exchange — first true stage.
 * Pacing: teach hop → crumble → mixed digit roles → recruit under fire → Drop Cap under spikes.
 * Enemies are roles (patrol 1, floater 0, star 5, charger 7, tank 4), not copies of one kind.
 */
function buildExchange(): string[] {
  const W = 184;
  const H = 13;
  const g = grid(W, H, 8) as Grid;
  const { put, fill } = g;
  const pit = 156;
  const pitW = 20;
  fill(pit, 8, pitW, ".");
  fill(pit, 10, pitW, ".");

  // —— Opening lane: hop over a short spike bed, one 1, floating 0 above ——
  put(1, 7, "@");
  put(12, 7, "m");
  put(8, 6, "==");
  put(14, 6, "####");
  put(20, 7, "1");
  put(24, 7, "^^^");
  put(28, 5, "====");
  put(30, 4, "0");
  put(36, 7, "i");

  // —— Crumble bridge: must keep moving; 2 waits on far shelf, 5 on floor ——
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

  // —— Cage + recruit: breakable wall, s + WALL, elevated 7, floor 3 ——
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

  // —— Drop Cap run: staggered shelves, tank 4, short laser beat ——
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
  // single laser column forces a pause before the pit
  put(148, 5, "|");
  put(148, 6, "|");
  put(148, 7, "|");
  put(150, 6, "==");
  put(118, 2, "0");

  // —— Pit approach + Dualis ——
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

  // Secrets (out of the main path)
  put(4, 3, "====");
  put(5, 2, "$");
  put(pit + 16, 10, "==");
  put(pit + 16, 9, "$");
  put(88, 2, "0");
  return g;
}

/**
 * Gutter Press — canal tools under strain.
 * Each canal teaches a different crossing: shelf, crumble mid-air, multi-height.
 * Enemies rotate roles so the same jump never feels safe twice.
 */
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

  // Canal 1 — narrow lips, 3 on far pad, floating 0 above the water
  gap(30, 11);
  put(34, 7, "%");
  put(38, 6, "====");
  put(40, 8, "3");
  put(44, 5, "----");
  put(48, 7, "====");
  put(50, 6, "0");
  put(52, 8, "1");

  // Canal 2 — mid-air shelves + spikes on the bank; RISE word; 5 + 7 roles
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

  // Canal 3 — longest water, three height tiers, 6 on high shelf, 3/1 on floor
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

  // Final sluice — crumble chain into gate, short spike before portal
  gap(140, 14);
  put(142, 6, "====");
  put(146, 5, "----");
  put(150, 5, "====");
  put(152, 4, "5");
  put(156, 8, "P");
  put(160, 7, "+");
  put(158, 8, "^^^");

  // High secrets
  put(40, 2, "0");
  put(100, 2, "0");
  put(24, 3, "====");
  put(25, 2, "$");
  put(164, 6, "==");
  put(164, 5, "$");
  return g;
}

/**
 * Coil Yard — vents, spikes, lasers, breakables.
 * Path forces LOCK timing, vent climbs into mixed numbers, and a laser gate before the 8.
 */
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

  // Vent shaft 1 — exit into 5 + short spike, LOCK word on high shelf
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

  // Spike field → laser gate → breakable vault with Fang
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

  // Vent shaft 2 — taller, exits into 9 + spikes + crumble into gate
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

  // Secrets
  put(70, 2, "0");
  put(130, 2, "0");
  put(106, 2, "====");
  put(108, 2, "$");
  put(158, 4, "====");
  put(160, 3, "$");
  put(40, 8, "5");
  return g;
}

/**
 * The Null Ledger — full toolbox under pressure.
 * Foyer → dual canals → vent/spike → breakables → dense laser corridor → arena.
 * One Nullis only. Roles stay distinct: 2 patrol, 5 star, 7 charge, 8/9 specials.
 */
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

  // —— 1. Foyer: spike hop, 1 then 2, elevated 5 ——
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

  // —— 2. First sluice: shelf + crumble, 4 mid, 6 high ——
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

  // —— 3. Second sluice: longer, multi-height, 7 + 1 ——
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

  // —— 4. Vent + spikes: 8 waits mid, 9 at exit ——
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

  // —— 5. Breakable wall: Fang + 8/4 on far side ——
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

  // —— 6. Laser corridor: staggered on/off columns, platforms between ——
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

  // —— High ledges / secrets ——
  put(50, 4, "====");
  put(52, 3, "$");
  put(100, 3, "====");
  put(102, 2, "0");
  put(150, 4, "====");
  put(152, 3, "$");
  put(200, 4, "====");
  put(202, 3, "i");
  put(60, 5, "====");
  put(62, 4, "2");
  put(130, 4, "----");
  put(140, 5, "====");
  put(142, 4, "6");
  put(170, 8, "9");

  // —— Arena: one Nullis, soft shelves, portal ——
  fill(218, 11, 5, ".");
  fill(218, 12, 5, ".");
  fill(218, 13, 5, ".");
  put(220, 10, "!");
  put(222, 14, "P");
  put(218, 13, "==");
  put(222, 12, "==");

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
      { id: "enter-ledger", text: "Enter the Null Ledger", need: "stage2" },
    ],
    rows: slice(`
########################################################
#......................................................#
#......................+...............................#
#..............====....................................#
#..........====........................................#
#....e...t........r...k....n...........................#
#@...F...i.......[....]...{....}......h....o......d....#
########################################################
########################################################
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
    objective: "Recruit b. Face G, who opened the ports. Take the CHAPTER gate.",
    tasks: [
      { id: "recruit-b", text: "Recruit b" },
      { id: "word-burn", text: "Pick up BURN" },
      { id: "importer", text: "Defeat G" },
      { id: "gate-chapter", text: "Take the CHAPTER gate" },
    ],
    // Vertical fort: vent cage, laser on the high route, spike beds on the floor,
    // mixed roles (2 / 4 / 5 / 7 / 8), crumbler approach to b, still one G.
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
  },
  stage5: {
    id: "stage5",
    name: "The Null Ledger",
    theme: "vault",
    objective: "Cross every hazard. Defeat Nullis. Close the last account.",
    tasks: [
      { id: "talk-n", text: "Talk to n in the foyer" },
      { id: "cross-lasers", text: "Pass the laser corridor" },
      { id: "nullis", text: "Defeat Nullis" },
      { id: "gate-ledger", text: "Take the LEDGER gate" },
    ],
    rows: buildLedger(),
    exit: "win",
  },
};

export function tileAt(rows: string[], tx: number, ty: number): string {
  if (ty < 0 || ty >= rows.length) return "#";
  const row = rows[ty];
  if (tx < 0 || tx >= row.length) return "#";
  return row[tx];
}
