import { grid, sealBasement, type Grid } from "./levels-story";
import type { Beat, Chunk } from "./chunks";
import { armTeethAlongPath, chunkLand, realizeLandform } from "./sculpt";
import type { ThemeId } from "./types";

const H = 16;
const FY = 11;

function make(
  id: string,
  name: string,
  beats: Beat[],
  tags: string[],
  paint: (g: Grid) => void,
  opts: { w?: number; min?: number; max?: number; theme?: ThemeId } = {},
): Chunk {
  const w = opts.w ?? 22;
  const g = grid(w, H, FY) as Grid;
  const spine = realizeLandform(g, chunkLand(w, id));
  paint(g);
  armTeethAlongPath(g, spine);
  sealBasement(g, FY);
  return {
    id,
    name,
    kind: "chunk",
    theme: opts.theme ?? "remainder",
    rows: [...g],
    socket: { leftFloor: FY, rightFloor: FY },
    beats,
    tags,
    minStage: opts.min ?? 31,
    maxStage: opts.max ?? 60,
  };
}

export const REMAINDER_CHUNKS: Chunk[] = [
  make("land-orbit", "Orrery porch", ["land"], ["orbit"], (g) => {
    g.put(2, FY - 1, "@");
    g.put(5, FY - 1, "i");
    g.put(7, FY - 2, ";");
    g.fill(9, FY - 3, 5, "=");
    g.put(11, FY - 4, "?");
  }, { w: 20, theme: "orbit" }),
  make("land-glacier", "Ice porch", ["land"], ["glacier"], (g) => {
    g.put(2, FY - 1, "@");
    g.put(5, FY - 1, "h");
    g.fill(8, FY - 2, 6, "_");
    g.put(16, FY - 1, "T");
  }, { w: 20, theme: "glacier" }),
  make("land-remainder", "Char porch", ["land"], ["remainder"], (g) => {
    g.put(2, FY - 1, "@");
    g.put(4, FY - 1, "%");
    g.put(6, FY - 1, "i");
    g.put(8, FY - 2, "?");
    g.fill(10, FY - 3, 5, "=");
    g.put(16, FY - 2, '"');
  }, { w: 20, theme: "remainder" }),
  make("land-vault-late", "Glass porch", ["land"], ["vault"], (g) => {
    g.put(2, FY - 1, "@");
    g.put(5, FY - 1, "i");
    g.put(8, FY - 2, ";");
    g.fill(11, FY - 3, 4, "=");
  }, { w: 18, min: 48, theme: "vault" }),
  make("land-spire", "Spire porch", ["land"], ["spire"], (g) => {
    g.put(2, FY - 1, "@");
    g.put(6, FY - 1, "i");
    g.fill(8, FY - 4, 4, "=");
    g.put(9, FY - 5, ";");
    g.fill(14, FY - 2, 4, "=");
  }, { w: 20, min: 40, theme: "spire" }),

  make("teach-orbit-lift", "Rising ring", ["teach"], ["orbit", "lift"], (g) => {
    g.fill(6, FY, 3, ".");
    g.put(6, FY - 1, "`");
    g.put(7, FY - 1, "`");
    g.put(8, FY - 2, ";");
    g.fill(12, FY - 4, 5, "=");
    g.put(14, FY - 5, "i");
  }, { w: 22, theme: "orbit" }),
  make("teach-glacier-blink", "Fading ice", ["teach"], ["glacier", "blink"], (g) => {
    g.fill(6, FY, 4, ".");
    g.put(7, FY - 1, ")");
    g.put(8, FY - 1, ")");
    g.fill(12, FY, 4, "#");
    g.put(14, FY - 2, ";");
  }, { w: 22, theme: "glacier" }),
  make("teach-remainder-saw", "Cutting rule", ["teach"], ["remainder", "saw"], (g) => {
    g.put(7, FY - 2, "S");
    g.put(9, FY - 2, "?");
    g.fill(12, FY - 3, 5, "=");
    g.put(14, FY - 4, "i");
  }, { w: 22, theme: "remainder" }),
  make("teach-remainder-geyser", "Ember jet", ["teach"], ["remainder", "geyser"], (g) => {
    g.fill(8, FY, 1, "g");
    g.put(6, FY - 2, '"');
    g.fill(12, FY - 4, 5, "=");
    g.put(14, FY - 5, "h");
  }, { w: 22, theme: "remainder" }),
  make("teach-abyss-blink", "Void rule", ["teach"], ["abyss", "blink"], (g) => {
    g.fill(6, FY, 3, ".");
    g.put(7, FY - 1, ")");
    g.fill(11, FY - 3, 5, "=");
  }, { w: 20, min: 50, theme: "abyss" }),
  make("teach-canal-late", "Late trench", ["teach"], ["canal", "sluice", "geyser"], (g) => {
    g.fill(6, FY, 3, ".");
    g.fill(6, FY + 1, 3, "~");
    g.put(9, FY, "g");
    g.put(5, FY - 2, ",");
    g.fill(13, FY - 3, 4, "=");
  }, { w: 22, min: 40, theme: "canal" }),

  make("mix-orbit-lift-laser", "Ring over bar", ["mix"], ["orbit", "lift", "laser"], (g) => {
    g.fill(6, FY, 3, ".");
    g.put(6, FY - 1, "`");
    g.put(7, FY - 1, "`");
    g.put(10, FY - 3, "|");
    g.put(10, FY - 4, "|");
    g.fill(13, FY - 3, 4, "=");
    g.put(16, FY - 2, ";");
  }, { w: 24, min: 32, theme: "orbit" }),
  make("mix-glacier-rail-geyser", "Rime jet", ["mix"], ["glacier", "geyser", "loft"], (g) => {
    g.fill(5, FY - 2, 5, "_");
    g.fill(11, FY, 1, "g");
    g.fill(14, FY - 4, 5, "=");
    g.put(16, FY - 5, "i");
  }, { w: 24, min: 33, theme: "glacier" }),
  make("mix-remainder-blink-saw", "Rule and disc", ["mix"], ["remainder", "blink", "saw"], (g) => {
    g.fill(6, FY, 4, ".");
    g.put(7, FY - 1, ")");
    g.put(8, FY - 1, ")");
    g.put(12, FY - 2, "S");
    g.fill(15, FY, 4, "#");
    g.put(17, FY - 2, "?");
  }, { w: 24, min: 34, theme: "remainder" }),
  make("mix-remainder-lift-geyser", "Desk and jet", ["mix"], ["remainder", "lift", "geyser"], (g) => {
    g.fill(6, FY, 2, ".");
    g.put(6, FY - 1, "`");
    g.fill(10, FY, 1, "g");
    g.fill(14, FY - 4, 5, "=");
    g.put(16, FY - 5, "$");
  }, { w: 24, min: 36, theme: "remainder" }),
  make("mix-spire-loft", "Twin spires", ["mix"], ["spire", "loft", "laser"], (g) => {
    g.fill(5, FY - 3, 4, "=");
    g.put(8, FY - 2, "|");
    g.put(8, FY - 3, "|");
    g.fill(12, FY - 5, 4, "=");
    g.fill(18, FY - 2, 3, "=");
  }, { w: 24, min: 40, theme: "spire" }),
  make("mix-vault-blink", "Glass fade", ["mix"], ["vault", "blink"], (g) => {
    g.fill(6, FY, 3, ".");
    g.put(7, FY - 1, ")");
    g.put(10, FY - 2, ";");
    g.fill(13, FY - 3, 5, "=");
  }, { w: 22, min: 48, theme: "vault" }),
  make("mix-abyss-saw", "Rib disc", ["mix"], ["abyss", "saw", "loft"], (g) => {
    g.put(7, FY - 2, "S");
    g.fill(10, FY - 4, 5, "=");
    g.put(12, FY - 5, "1");
    g.fill(17, FY - 2, 3, "=");
  }, { w: 24, min: 50, theme: "abyss" }),

  make("combat-orbit", "Orrery fight", ["combat"], ["orbit", "loft"], (g) => {
    g.fill(5, FY - 3, 4, "=");
    g.put(6, FY - 4, "1");
    g.put(12, FY - 2, ";");
    g.put(16, FY - 1, "5");
    g.fill(18, FY - 3, 3, "=");
  }, { w: 24, min: 31, theme: "orbit" }),
  make("combat-glacier", "Ice fight", ["combat"], ["glacier", "loft"], (g) => {
    g.fill(4, FY - 2, 6, "_");
    g.put(6, FY - 3, "2");
    g.put(14, FY - 1, "7");
    g.put(17, FY - 1, "T");
  }, { w: 22, min: 33, theme: "glacier" }),
  make("combat-remainder", "Script fight", ["combat"], ["remainder", "saw"], (g) => {
    g.put(6, FY - 1, "1");
    g.put(10, FY - 2, "S");
    g.put(14, FY - 1, "8");
    g.fill(8, FY - 3, 4, "=");
    g.put(16, FY - 2, "?");
  }, { w: 22, min: 34, theme: "remainder" }),
  make("combat-remainder-loft", "High script", ["combat"], ["remainder", "loft"], (g) => {
    g.fill(4, FY - 2, 4, "=");
    g.fill(12, FY - 4, 5, "=");
    g.put(5, FY - 3, "5");
    g.put(14, FY - 5, "9");
    g.put(18, FY - 1, "2");
  }, { w: 24, min: 40, theme: "remainder" }),
  make("combat-spire", "Spire pair", ["combat"], ["spire", "loft"], (g) => {
    g.fill(5, FY - 4, 4, "=");
    g.put(6, FY - 5, "A");
    g.put(14, FY - 1, "B");
    g.fill(16, FY - 3, 4, "=");
  }, { w: 24, min: 42, theme: "spire" }),

  make("rest-orbit", "Quiet ring", ["rest"], ["orbit"], (g) => {
    g.put(4, FY - 1, "%");
    g.put(7, FY - 1, "i");
    g.put(10, FY - 2, ";");
    g.fill(12, FY - 3, 5, "=");
    g.put(14, FY - 4, "h");
  }, { w: 20, theme: "orbit" }),
  make("rest-glacier", "Cold bench", ["rest"], ["glacier"], (g) => {
    g.put(4, FY - 1, "%");
    g.fill(7, FY - 2, 6, "_");
    g.put(10, FY - 3, "i");
    g.put(16, FY - 1, "h");
  }, { w: 20, theme: "glacier" }),
  make("rest-spire", "High bench", ["rest"], ["spire"], (g) => {
    g.put(4, FY - 1, "%");
    g.fill(8, FY - 4, 5, "=");
    g.put(10, FY - 5, "i");
    g.put(16, FY - 1, ";");
  }, { w: 20, min: 40, theme: "spire" }),
  make("rest-abyss", "Dark margin", ["rest"], ["abyss"], (g) => {
    g.put(4, FY - 1, "%");
    g.put(7, FY - 1, "i");
    g.put(11, FY - 2, "?");
    g.fill(14, FY - 3, 4, "=");
  }, { w: 20, min: 50, theme: "abyss" }),

  make("arena-orbit", "Orrery court", ["arena"], ["orbit", "arena", "lift"], (g) => {
    g.put(2, FY - 1, "@");
    g.fill(8, FY, 3, ".");
    g.put(8, FY - 1, "`");
    g.put(9, FY - 1, "`");
    g.put(Math.floor(g.W / 2), FY - 1, "!");
    g.fill(4, FY - 3, 4, "=");
    g.fill(g.W - 10, FY - 3, 4, "=");
    g.put(6, FY - 2, ";");
    g.put(g.W - 8, FY - 2, ";");
    g.put(g.W - 4, FY - 1, "P");
  }, { w: 32, min: 31, theme: "orbit" }),
  make("arena-glacier", "Ice court", ["arena"], ["glacier", "arena"], (g) => {
    g.put(2, FY - 1, "@");
    g.fill(6, FY - 2, 5, "_");
    g.put(Math.floor(g.W / 2), FY - 1, "!");
    g.fill(g.W - 12, FY - 2, 5, "_");
    g.put(8, FY - 1, "T");
    g.put(g.W - 8, FY - 1, "T");
    g.put(4, FY - 1, "%");
    g.put(g.W - 4, FY - 1, "P");
  }, { w: 32, min: 33, theme: "glacier" }),
  make("arena-remainder", "Script court", ["arena"], ["remainder", "arena", "saw"], (g) => {
    g.put(2, FY - 1, "@");
    g.put(6, FY - 2, "S");
    g.put(Math.floor(g.W / 2), FY - 1, "!");
    g.fill(5, FY - 3, 5, "=");
    g.fill(g.W - 12, FY - 3, 5, "=");
    g.put(8, FY - 2, "?");
    g.put(g.W - 10, FY - 2, '"');
    g.put(4, FY - 1, "%");
    g.put(g.W - 4, FY - 1, "P");
  }, { w: 34, min: 34, theme: "remainder" }),
  make("arena-abyss", "Rib court", ["arena"], ["abyss", "arena"], (g) => {
    g.put(2, FY - 1, "@");
    g.put(Math.floor(g.W / 2), FY - 1, "!");
    g.fill(6, FY - 4, 4, "=");
    g.fill(g.W - 12, FY - 4, 4, "=");
    g.put(4, FY - 1, "%");
    g.put(g.W - 4, FY - 1, "P");
  }, { w: 32, min: 50, theme: "abyss" }),

  make("gate-orbit", "Ring gate", ["gate"], ["orbit"], (g) => {
    g.put(4, FY - 1, "i");
    g.put(7, FY - 2, ";");
    g.fill(9, FY - 3, 3, "=");
    g.put(g.W - 4, FY - 1, "P");
  }, { w: 16, theme: "orbit" }),
  make("gate-glacier", "Ice gate", ["gate"], ["glacier"], (g) => {
    g.put(4, FY - 1, "%");
    g.fill(6, FY - 2, 4, "_");
    g.put(g.W - 4, FY - 1, "P");
  }, { w: 16, theme: "glacier" }),
  make("gate-remainder", "Last margin", ["gate"], ["remainder"], (g) => {
    g.put(3, FY - 1, "%");
    g.put(6, FY - 1, "i");
    g.put(8, FY - 2, "?");
    g.put(g.W - 4, FY - 1, "P");
  }, { w: 16, theme: "remainder" }),

  make("mix-late-gauntlet", "Triple mark", ["mix"], ["any", "lift", "blink", "saw"], (g) => {
    g.fill(5, FY, 2, ".");
    g.put(5, FY - 1, "`");
    g.fill(9, FY, 3, ".");
    g.put(10, FY - 1, ")");
    g.put(14, FY - 2, "S");
    g.fill(17, FY, 3, "#");
  }, { w: 24, min: 46 }),
  make("combat-late-pair", "Operator pair", ["combat"], ["any", "loft"], (g) => {
    g.fill(5, FY - 3, 4, "=");
    g.put(6, FY - 4, "A");
    g.put(14, FY - 1, "C");
    g.fill(16, FY - 2, 4, "=");
  }, { w: 24, min: 42 }),
];
