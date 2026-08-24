import type { LevelId, TaskDef, ThemeId } from "./types";
import { STAGE_COUNT } from "./types";

export type { LevelId, ThemeId };
export { STAGE_COUNT };

export interface LevelMeta {
  id: LevelId;
  name: string;
  theme: ThemeId;
  objective: string;
  tasks: TaskDef[];
  rows: string[];
  exit?: "hub" | "win";
  /** Numeric index 0 = hub, 1..STAGE_COUNT = progressive stages */
  index: number;
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
    if (x < 0 || x >= r.length) return;
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

// Hand-crafted and progressive builders are in the full local file.
// This restore keeps the game bootable while the full progressive book is applied.
function buildMinimalHub(): string[] {
  return slice(`
################################################################################
#..............................................................................#
#......................+.......................................................#
#..............====............................................................#
#..........====................................................................#
#....e...t........r...k....n........f...d....w....x....z....l....o....i....c...#
#@...F...i.......[....]...{....}......d......>......<....h....o......j.........#
################################################################################
################################################################################
`);
}

function buildProgressive(n: number): string[] {
  const W = 130 + Math.min(110, n * 5);
  const H = 12 + Math.min(7, Math.floor(n / 4));
  const floorY = H - 3;
  const g = grid(W, H, floorY) as Grid;
  const { put, fill } = g;
  put(1, floorY - 1, "@");
  put(4, floorY - 1, "i");
  const mid = Math.floor(W * 0.42);
  put(mid, floorY - 1, "%");
  put(mid + 2, floorY - 1, "i");
  const roles = ["1", "0", "2", "5", "7", "A", "B", "C", "E", "Y", "G", "H"];
  const tier = Math.min(roles.length - 1, Math.floor((n - 1) / 3));
  const enemyCount = 5 + Math.floor(n * 0.55);
  for (let i = 0; i < enemyCount; i++) {
    const x = 12 + Math.floor(((i * 37 + n * 13) % (W - 40)));
    put(x, floorY - 1, roles[Math.min(tier, i % (tier + 1))]);
  }
  for (let x = 20; x < W - 20; x += 18) {
    if ((x + n) % 5 === 0) put(x, floorY - 1, "^");
    if ((x + n) % 7 === 0) put(x, floorY - 1, "-");
    if ((x + n) % 11 === 0 && n >= 4) {
      put(x, floorY - 2, "|");
      put(x, floorY - 1, "|");
    }
  }
  for (let i = 0; i < 3 + Math.floor(n / 3); i++) {
    const x = 10 + i * 15;
    const y = 3 + (i % 3);
    put(x, y, "====");
    if (i % 2 === 0) put(x + 1, y - 1, "i");
  }
  const end = W - 10;
  put(end - 8, floorY - 1, n % 5 === 0 || n === STAGE_COUNT ? "!" : "1");
  put(end, floorY - 1, "P");
  return g;
}

function progressiveMeta(n: number): LevelMeta {
  const isBoss = n % 5 === 0 || n === STAGE_COUNT;
  return {
    id: `stage${n}` as LevelId,
    name: n === STAGE_COUNT ? "Final Account" : isBoss ? `Warden ${n}` : `Ledger ${n}`,
    theme: (["street", "canal", "coil", "fort", "vault", "abyss", "spire"] as ThemeId[])[Math.min(6, Math.floor((n - 1) / 4))],
    objective: isBoss ? "Clear the warden. Take the gate." : "Cross the ledger. Reach the gate.",
    tasks: [{ id: `clear-${n}`, text: isBoss ? "Defeat the warden" : "Reach the gate" }],
    rows: buildProgressive(n),
    exit: n === STAGE_COUNT ? "win" : "hub",
    index: n,
  };
}

const hand: Record<string, LevelMeta> = {
  hub: {
    id: "hub",
    name: "Lower Register Stacks",
    theme: "hub",
    objective: "Talk to the letters, then pick a door. Continue opens the next unread ledger.",
    tasks: [
      { id: "talk-e", text: "Talk to e" },
      { id: "enter-lanes", text: "Enter the Overcast Exchange" },
      { id: "continue", text: "Take the Continue gate deeper", need: 5 },
    ],
    rows: buildMinimalHub(),
    index: 0,
  },
};

// Re-export milestone stages from progressive for bootability; full hand-crafted maps in local artifacts
for (let n = 1; n <= 5; n++) {
  hand[`stage${n}`] = progressiveMeta(n);
}

export const LEVELS: Record<string, LevelMeta> = { ...hand };
for (let n = 6; n <= STAGE_COUNT; n++) {
  const meta = progressiveMeta(n);
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

export function tileAt(rows: string[], tx: number, ty: number): string {
  if (ty < 0 || ty >= rows.length) return "#";
  const row = rows[ty];
  if (tx < 0 || tx >= row.length) return "#";
  return row[tx];
}
