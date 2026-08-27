import { FIRST_BOOK, STAGE_COUNT, type LevelId, type TaskDef } from "./types";
import { grid, type Grid, type LevelMeta } from "./levels-story";

function arena(n: number, name: string, theme: LevelMeta["theme"], boss: boolean): LevelMeta {
  const W = n === STAGE_COUNT ? 64 : 56;
  const H = 14;
  const fy = 10;
  const g = grid(W, H, fy) as Grid;
  const { put, fill } = g;
  put(2, fy - 1, "@");
  put(4, fy - 1, "i");
  put(12, fy - 1, "%");
  put(14, fy - 1, "h");
  fill(8, fy - 3, 5, "=");
  fill(W - 18, fy - 3, 5, "=");
  fill(22, fy - 5, 4, "=");
  if (boss) put(Math.floor(W / 2) - 1, fy - 1, "!");
  put(W - 5, fy - 1, "P");
  put(W - 7, fy - 1, "i");
  const tasks: TaskDef[] = boss
    ? [{ id: `clear-${n}`, text: n === FIRST_BOOK ? "Defeat End-Mark" : "Defeat the warden" }]
    : [{ id: `clear-${n}`, text: "Reach the gate" }];
  return {
    id: `stage${n}` as LevelId,
    name,
    theme,
    objective: boss ? "Clear the warden. Take the gate." : "Cross the ledger. Reach the gate.",
    tasks,
    rows: [...g],
    exit: n === STAGE_COUNT ? "win" : "hub",
    index: n,
  };
}

export const FROZEN_REMAINDER: Record<number, LevelMeta> = {
  [FIRST_BOOK]: arena(FIRST_BOOK, "The Period", "vault", true),
  [STAGE_COUNT]: arena(STAGE_COUNT, "The Remainder", "remainder", true),
};
