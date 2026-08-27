import { remainderName, remainderObjective } from "./remainder-names";
import { FIRST_BOOK, STAGE_COUNT, type LevelId, type TaskDef } from "./types";
import { grid, type Grid, type LevelMeta } from "./levels-story";
import type { ThemeId } from "./types";

function ledger(
  n: number,
  theme: ThemeId,
  boss: boolean,
  paint: (g: Grid, fy: number) => void,
  opts: { w?: number; h?: number; fy?: number; exit?: "hub" | "win" } = {},
): LevelMeta {
  const W = opts.w ?? 64;
  const H = opts.h ?? 14;
  const fy = opts.fy ?? 10;
  const g = grid(W, H, fy) as Grid;
  paint(g, fy);
  const tasks: TaskDef[] = boss
    ? [{ id: `clear-${n}`, text: n === FIRST_BOOK ? "Defeat End-Mark" : n === STAGE_COUNT ? "Defeat the Remainder" : "Defeat the warden" }]
    : [{ id: `clear-${n}`, text: "Reach the gate" }];
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

export const FROZEN_REMAINDER: Record<number, LevelMeta> = {
  30: ledger(30, "vault", true, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(6, fy - 2, ";");
    put(9, fy - 1, "%");
    fill(12, fy - 3, 6, "=");
    put(14, fy - 4, ";");
    fill(20, fy, 3, ".");
    put(21, fy - 1, ")");
    fill(26, fy - 3, 5, "=");
    put(28, fy - 2, ";");
    const mid = Math.floor(W / 2);
    put(mid, fy - 1, "!");
    fill(mid - 8, fy - 3, 5, "=");
    fill(mid + 4, fy - 3, 5, "=");
    put(W - 14, fy - 2, ";");
    put(W - 10, fy - 1, "h");
    put(W - 7, fy - 1, "i");
    put(W - 4, fy - 1, "P");
  }, { w: 58 }),

  35: ledger(35, "orbit", true, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(6, fy - 2, ";");
    fill(8, fy, 3, ".");
    put(8, fy - 1, "`");
    put(9, fy - 1, "`");
    fill(14, fy - 4, 6, "=");
    put(16, fy - 5, ";");
    put(22, fy - 1, "%");
    const mid = Math.floor(W / 2);
    put(mid, fy - 1, "!");
    fill(mid - 7, fy - 3, 4, "=");
    fill(mid + 4, fy - 3, 4, "=");
    put(W - 12, fy - 2, ";");
    put(W - 7, fy - 1, "i");
    put(W - 4, fy - 1, "P");
  }, { w: 60 }),

  40: ledger(40, "remainder", true, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "%");
    put(6, fy - 2, "?");
    put(5, fy - 1, "I");
    fill(8, fy, 3, ".");
    put(9, fy - 1, ")");
    put(14, fy - 2, "S");
    fill(18, fy - 3, 5, "=");
    put(20, fy - 4, '"');
    const mid = Math.floor(W / 2);
    put(mid, fy - 1, "!");
    fill(mid - 6, fy - 3, 4, "=");
    fill(mid + 3, fy - 4, 4, "=");
    put(W - 12, fy - 2, "?");
    put(W - 8, fy - 1, "h");
    put(W - 4, fy - 1, "P");
  }, { w: 62 }),

  45: ledger(45, "remainder", true, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(7, fy - 2, '"');
    fill(9, fy, 1, "g");
    fill(13, fy - 4, 5, "=");
    put(15, fy - 5, "?");
    put(20, fy - 2, "S");
    put(24, fy - 1, "%");
    const mid = Math.floor(W / 2);
    put(mid, fy - 1, "!");
    fill(mid - 8, fy - 3, 5, "=");
    fill(mid + 4, fy - 3, 5, "=");
    put(W - 14, fy - 2, '"');
    put(W - 8, fy - 1, "h");
    put(W - 4, fy - 1, "P");
  }, { w: 64 }),

  50: ledger(50, "vault", true, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(6, fy - 2, ";");
    fill(8, fy, 4, ".");
    put(9, fy - 1, ")");
    put(10, fy - 1, ")");
    fill(16, fy - 3, 6, "=");
    put(18, fy - 4, ";");
    put(26, fy - 1, "%");
    const mid = Math.floor(W / 2);
    put(mid, fy - 1, "!");
    fill(mid - 6, fy - 4, 4, "=");
    fill(mid + 3, fy - 3, 5, "=");
    put(W - 12, fy - 2, ";");
    put(W - 7, fy - 1, "i");
    put(W - 4, fy - 1, "P");
  }, { w: 64 }),

  55: ledger(55, "remainder", true, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "%");
    put(6, fy - 2, "?");
    fill(8, fy, 3, ".");
    put(8, fy - 1, "`");
    put(9, fy - 1, "`");
    put(14, fy - 2, "S");
    fill(18, fy, 1, "g");
    fill(22, fy - 4, 5, "=");
    const mid = Math.floor(W / 2);
    put(mid, fy - 1, "!");
    fill(mid - 7, fy - 3, 5, "=");
    fill(mid + 4, fy - 4, 4, "=");
    put(W - 14, fy - 2, '"');
    put(W - 8, fy - 1, "h");
    put(W - 4, fy - 1, "P");
  }, { w: 66 }),

  60: ledger(60, "remainder", true, (g, fy) => {
    const { put, fill, W } = g;
    put(2, fy - 1, "@");
    put(4, fy - 1, "i");
    put(6, fy - 2, '"');
    put(8, fy - 1, "%");
    fill(11, fy, 3, ".");
    put(12, fy - 1, ")");
    put(17, fy - 2, "S");
    fill(21, fy, 1, "g");
    fill(25, fy - 4, 5, "=");
    put(27, fy - 5, "?");
    fill(32, fy, 3, ".");
    put(32, fy - 1, "`");
    put(33, fy - 1, "`");
    fill(38, fy - 3, 5, "=");
    const mid = Math.floor(W / 2);
    put(mid + 4, fy - 1, "!");
    fill(mid - 4, fy - 3, 4, "=");
    fill(mid + 8, fy - 4, 4, "=");
    put(W - 16, fy - 2, '"');
    put(W - 12, fy - 2, "?");
    put(W - 8, fy - 1, "h");
    put(W - 6, fy - 1, "i");
    put(W - 4, fy - 1, "P");
  }, { w: 72, exit: "win" }),
};
