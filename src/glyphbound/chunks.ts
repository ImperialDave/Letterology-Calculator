import { grid, type Grid } from "./levels-story";
import type { ThemeId } from "./types";

export type Beat = "land" | "teach" | "mix" | "combat" | "rest" | "arena" | "gate";

export interface Chunk {
  id: string;
  name: string;
  kind: "chunk";
  theme: ThemeId;
  rows: string[];
  socket: { leftFloor: number; rightFloor: number };
  beats: Beat[];
  tags: string[];
  minStage: number;
  maxStage: number;
}

const H = 12;
const FY = 8;

function make(
  id: string,
  name: string,
  beats: Beat[],
  tags: string[],
  paint: (g: Grid) => void,
  opts: { w?: number; min?: number; max?: number; theme?: ThemeId; fy?: number } = {},
): Chunk {
  const w = opts.w ?? 20;
  const fy = opts.fy ?? FY;
  const g = grid(w, H, fy) as Grid;
  paint(g);
  return {
    id,
    name,
    kind: "chunk",
    theme: opts.theme ?? "street",
    rows: [...g],
    socket: { leftFloor: fy, rightFloor: fy },
    beats,
    tags,
    minStage: opts.min ?? 6,
    maxStage: opts.max ?? 60,
  };
}

export const CHUNKS: Chunk[] = [
  make("land-a", "Quiet margin", ["land"], ["any"], (g) => {
    g.put(2, FY - 1, "@");
    g.put(4, FY - 1, "i");
    g.fill(1, FY, g.W - 2, "#");
  }, { w: 16 }),
  make("land-b", "Low step", ["land"], ["any", "loft"], (g) => {
    g.put(2, FY - 1, "@");
    g.put(5, FY - 1, "i");
    g.fill(8, FY - 2, 5, "=");
  }, { w: 18 }),
  make("land-c", "Heart porch", ["land"], ["any"], (g) => {
    g.put(2, FY - 1, "@");
    g.put(6, FY - 1, "h");
    g.fill(10, FY - 2, 4, "=");
  }, { w: 18, min: 8 }),
  make("land-d", "Check porch", ["land"], ["any"], (g) => {
    g.put(2, FY - 1, "@");
    g.put(7, FY - 1, "%");
    g.put(9, FY - 1, "i");
  }, { w: 16 }),

  make("teach-spike", "Short teeth", ["teach"], ["any", "spike"], (g) => {
    g.fill(6, FY, 3, ".");
    g.put(6, FY + 1, "^");
    g.put(8, FY + 1, "^");
    g.put(7, FY - 1, "T");
  }, { w: 18 }),
  make("teach-laser", "One bar", ["teach"], ["any", "laser"], (g) => {
    g.put(8, FY - 2, "|");
    g.put(8, FY - 3, "|");
    g.fill(10, FY - 4, 4, "=");
  }, { w: 18, min: 15 }),
  make("teach-belt", "Belt run", ["teach"], ["any", "conveyor"], (g) => {
    g.fill(6, FY, 4, ".");
    g.fill(6, FY - 1, 4, "/");
  }, { w: 20, min: 15 }),
  make("teach-sluice", "Ink trench", ["teach"], ["any", "sluice"], (g) => {
    g.fill(6, FY, 3, ".");
    g.fill(6, FY + 1, 3, "~");
    g.put(7, FY - 1, "T");
  }, { w: 20, min: 12 }),
  make("teach-crumble", "Crumble shelf", ["teach"], ["any", "crumble"], (g) => {
    g.fill(6, FY - 1, 6, "-");
    g.fill(14, FY, 3, "#");
  }, { w: 20 }),
  make("teach-loft", "Two shelves", ["teach"], ["any", "loft"], (g) => {
    g.fill(4, FY - 2, 4, "=");
    g.fill(10, FY - 4, 4, "=");
    g.fill(16, FY - 2, 3, "=");
  }, { w: 22 }),

  make("mix-laser-belt", "Bar over belt", ["mix"], ["any", "laser", "conveyor"], (g) => {
    g.fill(6, FY, 4, ".");
    g.fill(6, FY - 1, 4, "/");
    g.put(8, FY - 3, "|");
    g.put(8, FY - 4, "|");
  }, { w: 20, min: 16 }),
  make("mix-bounce-sluice", "Spring over ink", ["mix"], ["any", "bounce", "sluice"], (g) => {
    g.fill(6, FY, 4, ".");
    g.fill(6, FY + 1, 4, "~");
    g.put(7, FY - 1, "T");
    g.put(8, FY - 1, "T");
  }, { w: 20, min: 12 }),
  make("mix-loft-spike", "Loft over teeth", ["mix"], ["any", "loft", "spike"], (g) => {
    g.fill(7, FY, 3, ".");
    g.fill(7, FY + 1, 3, "^");
    g.put(8, FY - 1, "T");
    g.fill(6, FY - 3, 6, "=");
  }, { w: 22 }),
  make("mix-crumble-laser", "Crumble then bar", ["mix"], ["any", "crumble", "laser"], (g) => {
    g.fill(4, FY - 1, 5, "-");
    g.put(12, FY - 2, "|");
    g.put(12, FY - 3, "|");
    g.fill(14, FY - 2, 4, "=");
  }, { w: 22, min: 15 }),

  make("combat-a", "Floor fight", ["combat"], ["any"], (g) => {
    g.put(8, FY - 1, "1");
    g.fill(4, FY - 2, 3, "=");
  }, { w: 18 }),
  make("combat-b", "Split perch", ["combat"], ["any", "loft"], (g) => {
    g.fill(5, FY - 3, 4, "=");
    g.put(6, FY - 4, "1");
    g.put(14, FY - 1, "0");
  }, { w: 20, min: 10 }),
  make("combat-c", "Cover teeth", ["combat"], ["any", "spike"], (g) => {
    g.fill(8, FY, 3, ".");
    g.put(8, FY + 1, "^");
    g.put(10, FY + 1, "^");
    g.put(9, FY - 1, "T");
    g.put(5, FY - 1, "1");
    g.put(14, FY - 1, "2");
  }, { w: 20, min: 10 }),
  make("combat-d", "Loft pair", ["combat"], ["any", "loft"], (g) => {
    g.fill(4, FY - 2, 4, "=");
    g.fill(12, FY - 4, 4, "=");
    g.put(5, FY - 3, "1");
    g.put(13, FY - 5, "3");
  }, { w: 22, min: 14 }),

  make("rest-a", "Ink and check", ["rest"], ["any"], (g) => {
    g.put(6, FY - 1, "%");
    g.put(8, FY - 1, "i");
    g.put(11, FY - 1, "h");
  }, { w: 16 }),
  make("rest-b", "Secret loft", ["rest"], ["any", "loft"], (g) => {
    g.put(4, FY - 1, "%");
    g.fill(8, FY - 3, 5, "=");
    g.put(10, FY - 4, "$");
    g.put(14, FY - 1, "i");
  }, { w: 18 }),
  make("rest-c", "Wide bench", ["rest"], ["any"], (g) => {
    g.fill(3, FY - 2, 8, "=");
    g.put(5, FY - 1, "h");
    g.put(9, FY - 3, "i");
    g.put(12, FY - 1, "%");
  }, { w: 18 }),

  make("arena-a", "Flat court", ["arena"], ["any", "arena"], (g) => {
    g.fill(1, FY, g.W - 2, "#");
    g.put(Math.floor(g.W / 2), FY - 1, "!");
    g.fill(4, FY - 3, 4, "=");
    g.fill(g.W - 10, FY - 3, 4, "=");
  }, { w: 28 }),
  make("arena-b", "Cover court", ["arena"], ["any", "arena", "loft"], (g) => {
    g.put(14, FY - 1, "!");
    g.fill(6, FY - 3, 5, "=");
    g.fill(18, FY - 3, 5, "=");
    g.put(8, FY - 1, "%");
  }, { w: 30, min: 20 }),
  make("arena-c", "Period court", ["arena"], ["any", "arena"], (g) => {
    g.put(16, FY - 1, "!");
    g.fill(3, FY - 2, 3, "=");
    g.fill(22, FY - 2, 3, "=");
    g.put(6, FY - 1, "%");
  }, { w: 32, min: 25 }),

  make("gate-a", "Plain gate", ["gate"], ["any"], (g) => {
    g.put(g.W - 4, FY - 1, "P");
    g.put(g.W - 6, FY - 1, "i");
  }, { w: 14 }),
  make("gate-b", "Checked gate", ["gate"], ["any"], (g) => {
    g.put(4, FY - 1, "%");
    g.put(g.W - 4, FY - 1, "P");
  }, { w: 16 }),
];

export function chunksFor(beat: Beat, n: number, theme: ThemeId): Chunk[] {
  return CHUNKS.filter(
    (c) =>
      c.beats.includes(beat) &&
      n >= c.minStage &&
      n <= c.maxStage &&
      (c.tags.includes("any") || c.tags.includes(theme)),
  );
}
