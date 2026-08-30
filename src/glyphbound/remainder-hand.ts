/** Frozen Remainder showpieces. Glyphbound Doctrine: .grok/skills/glyphbound-ledgers/SKILL.md */
import { fillDensity } from "./density";
import { remainderName, remainderObjective } from "./remainder-names";
import { decoFor, rng } from "./recipe";
import { FIRST_BOOK, STAGE_COUNT, type LevelId, type TaskDef, type ThemeId } from "./types";
import { grid, sealBasement, type Grid, type LevelMeta } from "./levels-story";

function ledger(
  n: number,
  theme: ThemeId,
  boss: boolean,
  paint: (g: Grid, fy: number) => void,
  opts: { w?: number; h?: number; fy?: number; exit?: "hub" | "win" } = {},
): LevelMeta {
  const W = opts.w ?? 104;
  const H = opts.h ?? 14;
  const fy = opts.fy ?? 10;
  const g = grid(W, H, fy) as Grid;
  paint(g, fy);
  fillDensity(g, { n, deco: decoFor(theme), rand: rng(n * 9973 + 91), fy });
  sealBasement(g, fy);
  const tasks: TaskDef[] = boss
    ? [{ id: `clear-${n}`, text: n === FIRST_BOOK ? "Defeat End-Mark" : n === STAGE_COUNT ? "Defeat the Remainder" : "Defeat the warden" }]
    : [{ id: `clear-${n}`, text: "Reach the gate" }];
  if (n === 32) tasks.push({ id: "word-fold", text: "Pick up FOLD" });
  if (n === 40) tasks.push({ id: "word-tide", text: "Pick up TIDE" });
  return {
    id: `stage${n}` as LevelId,
    name: remainderName(n, boss),
    theme,
    objective: remainderObjective(n, boss),
    tasks,
    rows: [...g],
    exit: opts.exit ?? (n === STAGE_COUNT ? "win" : "hub"),
    index: n,
  };
}

function pocket(g: Grid, fy: number, x: number, prize = "$") {
  const { put, fill } = g;
  fill(x, fy - 4, 5, "=");
  put(x + 2, fy - 5, prize);
}

export const FROZEN_REMAINDER: Record<number, LevelMeta> = {
  16: ledger(16, "abyss", false, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(6, fy - 2, "?");
    fill(8, fy - 2, 3, "=");
    fill(13, fy - 4, 4, "=");
    put(18, fy - 3, "|");
    put(18, fy - 4, "|");
    fill(20, fy - 5, 3, "=");
    put(28, fy - 1, "%");
    put(30, fy - 1, "i");
    put(36, fy - 1, "2");
    put(38, fy - 1, "0");
    put(40, fy - 1, "5");
    fill(46, fy - 3, 5, "=");
    put(48, fy - 4, "?");
    put(W - 8, fy - 1, "h");
    put(W - 4, fy - 1, "P");
  }, { w: 104 }),

  18: ledger(18, "canal", false, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(6, fy - 2, ",");
    fill(10, fy, 5, "/");
    fill(24, fy, 2, ".");
    fill(24, fy + 1, 2, "~");
    fill(28, fy - 3, 6, "=");
    put(30, fy - 4, ",");
    put(38, fy - 1, "%");
    put(34, fy - 1, "i");
    put(40, fy - 1, "2");
    put(42, fy - 1, "5");
    put(44, fy - 1, "0");
    fill(50, fy - 3, 4, "=");
    put(W - 8, fy - 1, "h");
    put(W - 4, fy - 1, "P");
  }, { w: 108 }),

  20: ledger(20, "spire", true, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    fill(7, fy - 2, 4, "=");
    fill(12, fy - 4, 4, "=");
    put(17, fy - 3, "|");
    put(17, fy - 4, "|");
    fill(19, fy - 5, 4, "=");
    put(21, fy - 6, ";");
    put(26, fy - 1, "%");
    put(28, fy - 1, "i");
    put(32, fy - 1, "2");
    put(34, fy - 1, "5");
    put(36, fy - 1, "4");
    const mid = Math.floor(W / 2);
    put(mid, fy - 1, "!");
    fill(mid - 8, fy - 3, 5, "=");
    put(mid - 7, fy - 4, "3");
    fill(mid + 5, fy - 4, 5, "=");
    put(W - 14, fy - 2, ";");
    put(W - 10, fy - 1, "h");
    put(W - 7, fy - 1, "i");
    put(W - 4, fy - 1, "P");
  }, { w: 108 }),

  22: ledger(22, "spire", false, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    fill(7, fy - 2, 3, "=");
    fill(12, fy - 4, 3, "=");
    put(16, fy - 3, "|");
    put(16, fy - 4, "|");
    fill(18, fy - 5, 4, "=");
    put(20, fy - 6, ";");
    fill(26, fy, 3, ".");
    put(27, fy - 1, "T");
    put(34, fy - 1, "%");
    put(36, fy - 1, "i");
    put(42, fy - 1, "5");
    put(44, fy - 1, "2");
    put(46, fy - 1, "0");
    fill(52, fy - 3, 4, "=");
    put(W - 8, fy - 1, "h");
    put(W - 4, fy - 1, "P");
  }, { w: 108 }),

  24: ledger(24, "fort", false, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(6, fy - 2, "'");
    fill(10, fy, 5, "-");
    fill(18, fy, 4, ".");
    fill(18, fy - 1, 4, "/");
    fill(24, fy - 3, 5, "=");
    put(26, fy - 4, "'");
    put(34, fy - 1, "%");
    put(36, fy - 1, "i");
    put(42, fy - 1, "5");
    put(44, fy - 1, "2");
    put(46, fy - 1, "4");
    fill(52, fy - 3, 4, "=");
    put(W - 8, fy - 1, "h");
    put(W - 4, fy - 1, "P");
  }, { w: 104 }),

  25: ledger(25, "coil", true, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(6, fy - 2, ";");
    fill(10, fy, 3, ".");
    put(10, fy - 1, "`");
    put(11, fy - 1, "`");
    fill(16, fy, 1, "g");
    fill(20, fy - 3, 5, "=");
    put(22, fy - 4, ";");
    put(28, fy - 1, "%");
    put(30, fy - 1, "i");
    put(34, fy - 1, "5");
    put(36, fy - 1, "2");
    put(38, fy - 1, "7");
    const mid = Math.floor(W / 2);
    put(mid, fy - 1, "!");
    fill(mid - 8, fy - 3, 5, "=");
    put(mid - 7, fy - 4, "3");
    fill(mid + 5, fy - 4, 5, "=");
    put(W - 14, fy - 2, ";");
    put(W - 10, fy - 1, "h");
    put(W - 7, fy - 1, "i");
    put(W - 4, fy - 1, "P");
  }, { w: 108 }),

  28: ledger(28, "abyss", false, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(6, fy - 2, "?");
    fill(8, fy - 2, 3, "=");
    fill(12, fy, 3, ".");
    put(12, fy - 1, "`");
    put(13, fy - 1, "`");
    fill(18, fy - 4, 4, "=");
    fill(23, fy - 5, 4, "=");
    put(25, fy - 6, "?");
    put(28, fy - 3, "v");
    fill(30, fy - 2, 3, "=");
    put(38, fy - 1, "%");
    put(40, fy - 1, "i");
    put(46, fy - 1, "7");
    put(48, fy - 1, "5");
    put(50, fy - 1, "2");
    fill(56, fy - 3, 4, "=");
    put(W - 8, fy - 1, "h");
    put(W - 4, fy - 1, "P");
  }, { w: 108 }),

  30: ledger(30, "vault", true, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(6, fy - 2, ";");
    fill(10, fy - 3, 5, "=");
    put(12, fy - 4, ";");
    fill(18, fy, 3, ".");
    put(19, fy - 1, ")");
    put(20, fy - 1, ")");
    fill(24, fy - 3, 5, "=");
    put(26, fy - 2, ";");
    put(32, fy - 1, "%");
    put(34, fy - 1, "i");
    put(38, fy - 1, "2");
    put(40, fy - 1, "0");
    put(42, fy - 1, "5");
    fill(46, fy - 4, 5, "=");
    const mid = Math.floor(W / 2);
    put(mid, fy - 1, "!");
    fill(mid - 8, fy - 3, 5, "=");
    put(mid - 7, fy - 4, "3");
    fill(mid + 4, fy - 3, 5, "=");
    put(mid + 6, fy - 4, "7");
    fill(mid + 16, fy, 3, ".");
    put(mid + 17, fy - 1, ")");
    put(W - 16, fy - 2, ";");
    fill(W - 18, fy - 3, 5, "=");
    put(W - 16, fy - 4, "7");
    put(W - 10, fy - 1, "h");
    put(W - 7, fy - 1, "i");
    put(W - 4, fy - 1, "P");
  }, { w: 108 }),

  31: ledger(31, "orbit", false, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(6, fy - 2, ";");
    fill(9, fy, 3, ".");
    put(9, fy - 1, "`");
    put(10, fy - 1, "`");
    fill(15, fy - 3, 6, "=");
    put(17, fy - 4, ";");
    fill(18, fy - 5, 4, "=");
    pocket(g, fy, 22, "$");
    fill(32, fy - 3, 5, "=");
    put(36, fy - 1, "1");
    put(38, fy - 1, "0");
    put(40, fy - 1, "2");
    put(45, fy - 1, "%");
    put(47, fy - 1, "i");
    put(54, fy - 2, ";");
    fill(56, fy - 3, 4, "=");
    put(W - 8, fy - 1, "h");
    put(W - 4, fy - 1, "P");
  }, { w: 108 }),

  32: ledger(32, "orbit", false, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(7, fy - 2, ";");
    fill(11, fy, 3, ".");
    put(12, fy - 1, ")");
    put(13, fy - 1, ")");
    put(18, fy - 1, "%");
    put(22, fy - 1, "O");
    put(24, fy - 1, "i");
    fill(28, fy - 3, 5, "=");
    put(28, fy - 4, "2");
    put(30, fy - 4, "0");
    put(34, fy - 1, "3");
    put(38, fy - 2, ";");
    put(42, fy - 1, "h");
    put(W - 4, fy - 1, "P");
  }, { w: 100 }),

  33: ledger(33, "glacier", false, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    fill(6, fy, 10, "_");
    fill(8, fy - 2, 7, "_");
    fill(18, fy, 3, ".");
    put(19, fy - 1, "T");
    fill(22, fy, 10, "_");
    fill(24, fy - 2, 6, "_");
    put(34, fy - 1, "%");
    fill(38, fy - 4, 5, "=");
    put(40, fy - 5, "i");
    put(46, fy - 1, "0");
    put(48, fy - 1, "2");
    put(50, fy - 1, "1");
    fill(54, fy, 6, "_");
    put(W - 8, fy - 1, "h");
    put(W - 4, fy - 1, "P");
  }, { w: 108 }),

  34: ledger(34, "remainder", false, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(6, fy - 2, "?");
    fill(10, fy, 1, "g");
    fill(14, fy - 4, 6, "=");
    put(16, fy - 5, "?");
    fill(24, fy - 3, 5, "=");
    put(32, fy - 1, "%");
    put(34, fy - 1, "i");
    put(38, fy - 1, "5");
    put(40, fy - 1, "2");
    put(42, fy - 1, "0");
    fill(46, fy - 3, 4, "=");
    put(W - 8, fy - 1, "h");
    put(W - 4, fy - 1, "P");
  }, { w: 104 }),

  35: ledger(35, "orbit", true, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(6, fy - 2, ";");
    fill(9, fy, 3, ".");
    put(9, fy - 1, "`");
    put(10, fy - 1, "`");
    put(16, fy - 1, "%");
    fill(18, fy - 3, 5, "=");
    put(22, fy - 1, "2");
    put(24, fy - 1, "0");
    put(26, fy - 1, "5");
    const mid = Math.floor(W / 2);
    put(mid, fy - 1, "!");
    fill(mid - 9, fy - 3, 5, "=");
    put(mid - 8, fy - 4, "7");
    fill(mid + 5, fy - 4, 5, "=");
    put(mid + 7, fy - 5, "3");
    put(W - 14, fy - 2, ";");
    put(W - 8, fy - 1, "h");
    put(W - 6, fy - 1, "i");
    put(W - 4, fy - 1, "P");
  }, { w: 108 }),

  36: ledger(36, "glacier", false, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(5, fy - 1, "i");
    fill(7, fy, 8, "_");
    fill(9, fy - 2, 6, "_");
    fill(18, fy, 3, ".");
    put(19, fy - 1, ")");
    put(20, fy - 1, ")");
    fill(22, fy, 8, "_");
    put(32, fy - 1, "%");
    fill(36, fy - 4, 5, "=");
    put(38, fy - 5, "i");
    put(44, fy - 1, "7");
    put(46, fy - 1, "2");
    put(48, fy - 1, "0");
    fill(52, fy, 5, "_");
    put(W - 4, fy - 1, "P");
  }, { w: 104 }),

  38: ledger(38, "orbit", false, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(7, fy - 2, ";");
    fill(10, fy, 3, ".");
    put(10, fy - 1, "`");
    put(11, fy - 1, "`");
    fill(18, fy, 3, ".");
    put(19, fy - 1, ")");
    put(20, fy - 1, ")");
    fill(26, fy - 4, 7, "=");
    put(28, fy - 5, "i");
    put(30, fy - 5, ";");
    put(38, fy - 1, "%");
    put(40, fy - 1, "h");
    put(44, fy - 1, "3");
    put(46, fy - 1, "1");
    put(48, fy - 1, "5");
    fill(52, fy - 3, 4, "=");
    put(W - 4, fy - 1, "P");
  }, { w: 112 }),

  40: ledger(40, "remainder", true, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(6, fy - 2, "?");
    put(8, fy - 1, "I");
    fill(12, fy, 3, ".");
    put(13, fy - 1, ")");
    put(14, fy - 1, ")");
    put(20, fy - 1, "%");
    put(24, fy - 1, "2");
    put(26, fy - 1, "5");
    put(28, fy - 1, "7");
    const mid = Math.floor(W / 2);
    put(mid, fy - 1, "!");
    fill(mid - 8, fy - 3, 5, "=");
    put(mid - 7, fy - 4, "8");
    fill(mid + 6, fy - 4, 5, "=");
    put(mid + 8, fy - 5, "0");
    put(W - 14, fy - 2, "?");
    put(W - 8, fy - 1, "h");
    put(W - 4, fy - 1, "P");
  }, { w: 108 }),

  42: ledger(42, "canal", false, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(6, fy - 2, ",");
    fill(8, fy - 3, 10, "=");
    fill(12, fy, 3, ".");
    fill(12, fy + 1, 3, "~");
    fill(16, fy, 1, "g");
    put(22, fy - 2, ",");
    put(26, fy - 1, "%");
    put(28, fy - 1, "i");
    put(32, fy - 1, "5");
    put(34, fy - 1, "2");
    put(36, fy - 1, "7");
    fill(40, fy - 3, 5, "=");
    put(W - 8, fy - 1, "h");
    put(W - 4, fy - 1, "P");
  }, { w: 112 }),

  44: ledger(44, "spire", false, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    fill(7, fy - 2, 4, "=");
    fill(12, fy - 4, 4, "=");
    put(17, fy - 3, "|");
    put(17, fy - 4, "|");
    fill(19, fy - 5, 4, "=");
    put(21, fy - 6, ";");
    fill(28, fy - 2, 4, "=");
    put(34, fy - 1, "%");
    put(36, fy - 1, "i");
    put(40, fy - 1, "A");
    put(42, fy - 1, "8");
    put(44, fy - 1, "5");
    fill(48, fy - 3, 4, "=");
    put(W - 4, fy - 1, "P");
  }, { w: 108 }),

  45: ledger(45, "remainder", true, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(6, fy - 2, '"');
    put(10, fy - 2, "S");
    put(16, fy - 1, "%");
    put(20, fy - 1, "8");
    put(22, fy - 1, "9");
    put(24, fy - 1, "A");
    const mid = Math.floor(W / 2);
    put(mid, fy - 1, "!");
    fill(mid - 9, fy - 3, 5, "=");
    put(mid - 8, fy - 4, "B");
    fill(mid + 5, fy - 4, 5, "=");
    put(mid + 7, fy - 5, "7");
    put(W - 16, fy - 2, '"');
    put(W - 8, fy - 1, "h");
    put(W - 4, fy - 1, "P");
  }, { w: 108 }),

  48: ledger(48, "remainder", false, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(7, fy - 2, "?");
    fill(10, fy, 3, ".");
    put(11, fy - 1, ")");
    put(12, fy - 1, ")");
    put(18, fy - 2, "S");
    put(22, fy - 1, "%");
    put(24, fy - 1, "h");
    put(30, fy - 1, "8");
    put(32, fy - 1, "9");
    put(34, fy - 1, "A");
    fill(38, fy - 3, 5, "=");
    put(50, fy - 2, "?");
    put(W - 4, fy - 1, "P");
  }, { w: 108 }),

  50: ledger(50, "vault", true, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(6, fy - 2, ";");
    fill(10, fy, 3, ".");
    put(11, fy - 1, ")");
    put(12, fy - 1, ")");
    put(18, fy - 1, "%");
    put(22, fy - 1, "9");
    put(24, fy - 1, "A");
    put(26, fy - 1, "8");
    const mid = Math.floor(W / 2);
    put(mid, fy - 1, "!");
    fill(mid - 8, fy - 4, 5, "=");
    put(mid - 7, fy - 5, "B");
    fill(mid + 6, fy - 3, 5, "=");
    put(mid + 8, fy - 4, "7");
    put(W - 14, fy - 2, ";");
    put(W - 8, fy - 1, "i");
    put(W - 4, fy - 1, "P");
  }, { w: 112 }),

  51: ledger(51, "remainder", false, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(6, fy - 2, "?");
    fill(8, fy - 4, 8, "=");
    put(12, fy - 5, "$");
    put(16, fy - 1, "9");
    put(18, fy - 1, "A");
    put(20, fy - 1, "8");
    put(26, fy - 1, "%");
    put(28, fy - 1, "i");
    fill(34, fy - 3, 5, "=");
    put(40, fy - 1, "B");
    put(42, fy - 1, "7");
    put(46, fy - 2, "?");
    put(W - 8, fy - 1, "h");
    put(W - 4, fy - 1, "P");
  }, { w: 112 }),

  54: ledger(54, "abyss", false, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    fill(7, fy - 2, 4, "=");
    fill(12, fy - 4, 4, "=");
    fill(17, fy - 5, 4, "=");
    put(19, fy - 6, "?");
    put(22, fy - 3, "v");
    fill(24, fy - 2, 3, "=");
    put(30, fy - 1, "%");
    put(32, fy - 1, "i");
    put(36, fy - 1, "B");
    put(38, fy - 1, "C");
    put(40, fy - 1, "9");
    fill(44, fy - 3, 4, "=");
    put(W - 4, fy - 1, "P");
  }, { w: 108 }),

  55: ledger(55, "remainder", true, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(6, fy - 2, "?");
    fill(9, fy, 3, ".");
    put(9, fy - 1, "`");
    put(10, fy - 1, "`");
    put(16, fy - 2, "S");
    put(20, fy - 1, "%");
    put(24, fy - 1, "A");
    put(26, fy - 1, "B");
    put(28, fy - 1, "9");
    const mid = Math.floor(W / 2);
    put(mid, fy - 1, "!");
    fill(mid - 8, fy - 3, 5, "=");
    put(mid - 7, fy - 4, "C");
    fill(mid + 6, fy - 4, 4, "=");
    put(mid + 7, fy - 5, "E");
    put(W - 14, fy - 2, '"');
    put(W - 8, fy - 1, "h");
    put(W - 4, fy - 1, "P");
  }, { w: 112 }),

  57: ledger(57, "orbit", false, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(6, fy - 2, ";");
    fill(9, fy, 3, ".");
    put(9, fy - 1, "`");
    put(10, fy - 1, "`");
    put(16, fy - 3, "|");
    put(16, fy - 4, "|");
    fill(18, fy - 3, 5, "=");
    put(28, fy - 1, "%");
    put(30, fy - 1, "i");
    put(34, fy - 1, "C");
    put(36, fy - 1, "A");
    put(38, fy - 1, "9");
    fill(42, fy - 3, 4, "=");
    put(54, fy - 2, ";");
    put(W - 4, fy - 1, "P");
  }, { w: 108 }),

  59: ledger(59, "orbit", false, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(7, fy - 2, ";");
    fill(11, fy, 3, ".");
    put(12, fy - 1, ")");
    put(13, fy - 1, ")");
    put(20, fy - 1, "%");
    put(24, fy - 1, "0");
    put(26, fy - 1, "2");
    put(28, fy - 1, "8");
    pocket(g, fy, W - 20, "$");
    put(W - 8, fy - 1, "i");
    put(W - 4, fy - 1, "P");
  }, { w: 104 }),

  60: ledger(60, "remainder", true, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(6, fy - 2, '"');
    fill(10, fy, 3, ".");
    put(11, fy - 1, ")");
    put(12, fy - 1, ")");
    put(18, fy - 2, "S");
    fill(24, fy, 1, "g");
    fill(28, fy - 3, 4, "=");
    fill(34, fy, 3, ".");
    put(34, fy - 1, "`");
    put(35, fy - 1, "`");
    put(42, fy - 1, "%");
    put(44, fy - 1, "h");
    put(46, fy - 1, "A");
    put(48, fy - 1, "B");
    put(50, fy - 1, "9");
    const mid = 62;
    put(mid, fy - 1, "!");
    fill(mid - 6, fy - 3, 4, "=");
    put(mid - 5, fy - 4, "C");
    fill(mid + 5, fy - 4, 4, "=");
    put(mid + 6, fy - 5, "E");
    put(W - 16, fy - 2, '"');
    put(W - 12, fy - 2, "?");
    put(W - 8, fy - 1, "i");
    put(W - 4, fy - 1, "P");
  }, { w: 120, exit: "win" }),
};
