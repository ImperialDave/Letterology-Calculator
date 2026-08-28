import type { LevelId } from "./types";
import { STAGE_COUNT, FIRST_BOOK } from "./types";
import { armTeeth, slice, grid, type LevelMeta, type Grid } from "./levels-story";
import { buildExchange, buildGutter, buildCoil, buildLedger } from "./levels-chapters";
import { assembleStage } from "./assemble";

export type { LevelId, LevelMeta };
export type { ThemeId } from "./types";
export { STAGE_COUNT, FIRST_BOOK };

function buildHub(): string[] {
  const W = 54;
  const H = 11;
  const fy = 8;
  const g = grid(W, H, fy) as Grid;
  const { put, fill } = g;
  put(2, fy - 1, "@");
  put(3, fy - 1, "F");
  put(4, fy - 1, "i");
  put(6, fy - 1, "e");
  put(8, fy - 1, "t");
  // Play order, left to right: Exchange → Press → Coil → Fort → Ledger
  put(12, fy - 1, "[");
  put(17, fy - 1, "{");
  put(22, fy - 1, "}");
  put(27, fy - 1, "]");
  put(32, fy - 1, "(");
  fill(11, fy - 4, 24, "=");
  put(12, fy - 5, "r");
  put(15, fy - 5, "k");
  put(18, fy - 5, "n");
  put(21, fy - 5, "f");
  put(24, fy - 5, "d");
  put(27, fy - 5, "w");
  put(30, fy - 5, "x");
  put(33, fy - 5, "c");
  put(20, fy - 2, "i");
  put(26, fy - 2, "o");
  for (let y = 1; y <= fy - 3; y++) {
    put(37, y, "#");
    put(39, y, "#");
  }
  put(38, fy - 1, "j");
  put(42, fy - 1, ">");
  put(49, fy - 1, "<");
  put(47, fy - 1, "h");
  return armTeeth(g, fy);
}

const hand: Record<string, LevelMeta> = {
  hub: {
    id: "hub",
    name: "Lower Register Stacks",
    theme: "hub",
    objective: "Five chapter doors in the hall. Past the arch: the Unbound Sentence and the Studio desk.",
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
#@..........====....#..vv..#...................#....*...#........4..............o...........!.P.#
#.............====..#..vv..#....^^^^..........#........#.........====..........................#
######^^............########......5...........##########...7........############################
################################################################################################
################################################################################################
################################################################################################
`), 8),
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
  const meta = assembleStage(n);
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

export function beatenLedgers(progress: number) {
  const n = Math.max(0, Math.min(STAGE_COUNT, progress | 0));
  return listLedgers().filter((l) => l.index >= 1 && l.index <= n);
}

export function listLedgers(): { id: string; name: string; index: number; theme: string }[] {
  const out: { id: string; name: string; index: number; theme: string }[] = [
    { id: "hub", name: LEVELS.hub.name, index: 0, theme: LEVELS.hub.theme },
  ];
  for (let n = 1; n <= STAGE_COUNT; n++) {
    const m = LEVELS[`stage${n}`];
    if (m) out.push({ id: m.id, name: m.name, index: n, theme: m.theme });
  }
  return out;
}

export function tileAt(rows: string[], tx: number, ty: number): string {
  if (ty < 0 || ty >= rows.length) return "#";
  const row = rows[ty];
  if (tx < 0 || tx >= row.length) return "#";
  return row[tx];
}
