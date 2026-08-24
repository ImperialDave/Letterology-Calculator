import { DISTRICTS } from "./districts";
import type { LevelId, TaskDef, ThemeId } from "./types";
import { FIRST_BOOK, STAGE_COUNT } from "./types";

export type { LevelId, ThemeId };
export { STAGE_COUNT, FIRST_BOOK };

// NOTE: Full levels body is in artifacts; this push will be completed with full content.
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

export const LEVELS: Record<string, LevelMeta> = {};
for (let n = 1; n <= STAGE_COUNT; n++) {
  // progressive placeholder until full content lands
}
