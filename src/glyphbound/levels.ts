import type { LevelId } from "./types";
import { STAGE_COUNT, FIRST_BOOK } from "./types";
import { armTeeth, grid, type LevelMeta, type Grid } from "./levels-story";
import { buildExchange, buildGutter, buildCoil, buildLedger, buildFort } from "./levels-chapters";
import {
  buildAmpersand,
  buildApproach,
  buildFoundry,
  buildFourfold,
  buildIconostasis,
  buildIrisBind,
  buildKeystroke,
  buildLigature,
  buildRuleStorm,
  buildScriptorium,
} from "./levels-numberomicons";
import { assembleStage } from "./assemble";
import { finishLedger } from "./density";

export type { LevelId, LevelMeta };
export type { ThemeId } from "./types";
export { STAGE_COUNT, FIRST_BOOK };

function buildHub(): string[] {
  const W = 86;
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
  // Numberomicon replay doors: Keystroke, Fourfold, Ampersand, Scriptorium, Iconostasis
  put(44, fy - 1, "7");
  put(49, fy - 1, "8");
  put(54, fy - 1, "A");
  put(59, fy - 1, "B");
  put(64, fy - 1, "C");
  fill(43, fy - 4, 24, "=");
  put(72, fy - 1, ">");
  put(80, fy - 1, "<");
  put(77, fy - 1, "h");
  return armTeeth(g, fy);
}

const hand: Record<string, LevelMeta> = {
  hub: {
    id: "hub",
    name: "Lower Register Stacks",
    theme: "hub",
    objective: "Five chapter doors, then the Numberomicons. Past the icon: the Unbound Sentence and the Studio desk.",
    tasks: [
      { id: "talk-e", text: "Talk to e" },
      { id: "talk-t", text: "Learn scribing from t" },
      { id: "enter-lanes", text: "Enter the Overcast Exchange" },
      { id: "enter-gutter", text: "Enter the Gutter Press", need: 1 },
      { id: "enter-coil", text: "Enter the Coil Yard", need: 3 },
      { id: "enter-fort", text: "Enter G's Fort", need: 4 },
      { id: "enter-ledger", text: "Enter the Null Ledger", need: 4 },
      { id: "enter-keystroke", text: "Enter Keystroke Yard — recruit k", need: 5 },
      { id: "enter-fourfold", text: "Enter Fourfold Keep — Tetrarch", need: 7 },
      { id: "enter-ampersand", text: "Enter Ampersand Dock — recruit n", need: 9 },
      { id: "enter-scriptorium", text: "Enter the Scriptorium — recruit t", need: 11 },
      { id: "enter-iconostasis", text: "Enter the Iconostasis — Archivant", need: 14 },
      { id: "continue", text: "Walk the next unread ledger — Numberomicons, then the Unbound Sentence", need: 5 },
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
    rows: buildFort(),
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
  stage6: {
    id: "stage6",
    name: "Foundry Margin",
    theme: "fort",
    objective: "Walk G's leftover forges. Bounce the case. Read the painted 4s.",
    tasks: [{ id: "clear-6", text: "Reach the gate" }],
    rows: buildFoundry(),
    exit: "hub",
    index: 6,
  },
  stage7: {
    id: "stage7",
    name: "Keystroke Yard",
    theme: "fort",
    objective: "Flyers first. Free k. Then Stomp the floor the count still owns.",
    tasks: [
      { id: "recruit-k", text: "Recruit k — Storm" },
      { id: "clear-7", text: "Reach the gate" },
    ],
    rows: buildKeystroke(),
    exit: "hub",
    index: 7,
  },
  stage8: {
    id: "stage8",
    name: "Fourfold Keep",
    theme: "fort",
    objective: "The keep is a plus sign. Drop Tetrarch · 4.",
    tasks: [
      { id: "tetrarch", text: "Defeat Tetrarch" },
      { id: "clear-8", text: "Take the gate" },
    ],
    rows: buildFourfold(),
    exit: "hub",
    index: 8,
  },
  stage9: {
    id: "stage9",
    name: "Ligature Canal",
    theme: "canal",
    objective: "8s heal each other. Burst them. n was here.",
    tasks: [{ id: "clear-9", text: "Cross the last canal" }],
    rows: buildLigature(),
    exit: "hub",
    index: 9,
  },
  stage10: {
    id: "stage10",
    name: "Ampersand Dock",
    theme: "canal",
    objective: "Free n. Pin the 8s. FOLD waits on a stem roof.",
    tasks: [
      { id: "recruit-n", text: "Recruit n — Bind" },
      { id: "word-fold", text: "Pick up FOLD" },
      { id: "clear-10", text: "Reach the gate" },
    ],
    rows: buildAmpersand(),
    exit: "hub",
    index: 10,
  },
  stage11: {
    id: "stage11",
    name: "Iris Bind",
    theme: "vault",
    objective: "Wait outside the pull. Pin from the rim. Drop The Iris.",
    tasks: [
      { id: "iris", text: "Defeat The Iris" },
      { id: "clear-11", text: "Take the gate" },
    ],
    rows: buildIrisBind(),
    exit: "hub",
    index: 11,
  },
  stage12: {
    id: "stage12",
    name: "Scriptorium",
    theme: "remainder",
    objective: "Fang is a trap. Write a shelf. Free t — the nib, not the fang.",
    tasks: [
      { id: "recruit-t", text: "Recruit t — Quill" },
      { id: "clear-12", text: "Reach the gate" },
    ],
    rows: buildScriptorium(),
    exit: "hub",
    index: 12,
  },
  stage13: {
    id: "stage13",
    name: "Rule and Storm",
    theme: "spire",
    objective: "The octet is in play. Each clause asks for a letter.",
    tasks: [{ id: "clear-13", text: "Pass every clause" }],
    rows: buildRuleStorm(),
    exit: "hub",
    index: 13,
  },
  stage14: {
    id: "stage14",
    name: "Operator Approach",
    theme: "abyss",
    objective: "TIDE drifts the last shelves. The icon waits past the quiet.",
    tasks: [
      { id: "word-tide", text: "Pick up TIDE" },
      { id: "clear-14", text: "Reach the gate" },
    ],
    rows: buildApproach(),
    exit: "hub",
    index: 14,
  },
  stage15: {
    id: "stage15",
    name: "The Iconostasis",
    theme: "remainder",
    objective: "Archivant copies the letter you are holding. Swap, or be filed.",
    tasks: [
      { id: "archivant", text: "Defeat Archivant" },
      { id: "clear-15", text: "Take the gate" },
    ],
    rows: buildIconostasis(),
    exit: "hub",
    index: 15,
  },
};

export const LEVELS: Record<string, LevelMeta> = { ...hand };

for (let n = 16; n <= STAGE_COUNT; n++) {
  const meta = assembleStage(n);
  LEVELS[meta.id] = meta;
}

for (const id of Object.keys(LEVELS)) {
  if (id === "hub") continue;
  finishLedger(LEVELS[id].rows, LEVELS[id].index || 1);
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
