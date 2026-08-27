import { DISTRICTS } from "./districts";
import type { LevelId, TaskDef } from "./types";
import { FIRST_BOOK, STAGE_COUNT } from "./types";
import { grid, armTeeth, type Grid, type LevelMeta } from "./levels-story";

const ROLE_TIERS = [
  ["1", "0"],
  ["1", "0", "2", "3"],
  ["1", "0", "2", "3", "5", "4"],
  ["1", "0", "2", "3", "5", "4", "7", "6"],
  ["1", "0", "2", "3", "5", "4", "7", "6", "8", "9"],
  ["1", "0", "2", "5", "7", "8", "9", "A", "B"],
  ["2", "5", "7", "8", "9", "A", "B", "C", "E", "Y"],
];

function rng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 4294967296;
  };
}

function buildGenerated(n: number): string[] {
  const rand = rng(n * 9973 + 42);
  const roles = ROLE_TIERS[Math.min(ROLE_TIERS.length - 1, Math.floor((n - 1) / 4))];
  const pick = () => roles[Math.floor(rand() * roles.length)];
  const H = 16;
  const fy = 12;
  const rooms = 6 + (n % 4) + (n >= 25 ? 1 : 0);
  const W = 28 + rooms * 14 + 18;
  const g = grid(W, H, fy) as Grid;
  const { put, fill } = g;
  const pit = (x: number, w: number) => {
    fill(x, fy, w, ".");
    if (fy + 1 < H - 1) fill(x, fy + 1, w, ".");
  };
  put(1, fy - 1, "@");
  put(3, fy - 1, "i");
  if (n >= 8) put(5, fy - 1, "h");
  let cx = 8;
  const land = (w = 4) => {
    fill(cx, fy, w, "#");
    cx += w;
  };
  const kinds = ["street", "chasm", "roofs", "belt", "springs", "gate", "needles", "yard", "firebar", "inktrench"];
  for (let i = 0; i < rooms; i++) {
    const kind = kinds[(n * 3 + i * 7) % kinds.length];
    land(2);
    if (kind === "chasm" || kind === "needles") {
      const w = 5 + (n % 4);
      pit(cx, w);
      if (w >= 7) put(cx + Math.floor(w / 2) - 1, fy - 2, "==");
      cx += w;
    } else if (kind === "roofs") {
      const w = 10;
      pit(cx, w);
      put(cx + 1, fy - 2, "===");
      put(cx + 5, fy - 3, "===");
      cx += w;
    } else if (kind === "belt") {
      const w = 8;
      pit(cx, w);
      put(cx, fy - 1, "/////");
      cx += w;
    } else if (kind === "springs") {
      const w = 8;
      pit(cx, w);
      put(cx + 1, fy - 1, "T");
      put(cx + 6, fy - 1, "T");
      cx += w;
    } else if (kind === "firebar") {
      const w = 9;
      pit(cx, w);
      put(cx + 2, fy - 1, "|");
      put(cx + 2, fy - 2, "|");
      put(cx + 6, fy - 1, "|");
      put(cx + 6, fy - 2, "|");
      cx += w;
    } else if (kind === "inktrench") {
      const w = 8;
      fill(cx, fy, w, ".");
      if (fy + 1 < H - 1) {
        fill(cx, fy + 1, w, "~");
        put(cx + 4, fy + 1, "T");
      }
      cx += w;
    } else if (kind === "gate") {
      const w = 8;
      fill(cx, fy, w, "#");
      put(cx + 3, fy - 1, "|");
      put(cx + 3, fy - 2, "|");
      cx += w;
    } else {
      const w = 10;
      fill(cx, fy, w, "#");
      pit(cx + 3, 2);
      if (i > 0 && i % 2 === 0) put(cx + w - 3, fy - 1, pick());
      cx += w;
    }
    land(2);
  }
  land(6);
  put(cx - 4, fy - 1, "%");
  put(cx - 2, fy - 1, "i");
  if (n === 6) put(6, fy - 2, "W");
  if (n === 8) put(6, fy - 2, "X");
  if (n === 10) put(6, fy - 2, "Z");
  if (n === 12) put(6, fy - 2, "R");
  if (n === 32) put(6, fy - 2, "O");
  if (n === 40) put(6, fy - 2, "I");
  const end = W - 10;
  fill(end - 10, fy, 16, "#");
  if (n % 5 === 0 || n === STAGE_COUNT) put(end - 5, fy - 1, "!");
  else put(end - 5, fy - 1, pick());
  put(end, fy - 1, "P");
  put(end - 2, fy - 1, "i");
  return armTeeth(g, fy);
}

export function progressiveMeta(n: number): LevelMeta {
  const theme = DISTRICTS[Math.min(DISTRICTS.length - 1, n)]?.theme ?? "street";
  const isBoss = n % 5 === 0 || n === STAGE_COUNT;
  const name =
    n === FIRST_BOOK
      ? "The Period"
      : n === STAGE_COUNT
        ? "The Remainder"
        : isBoss
          ? `Warden ${n}`
          : `Ledger ${n}`;
  const tasks: TaskDef[] = [{ id: `clear-${n}`, text: isBoss ? "Defeat the warden" : "Reach the gate" }];
  if (n === 6) tasks.push({ id: "word-wall", text: "Pick up WALL" });
  if (n === 8) tasks.push({ id: "word-rise", text: "Pick up RISE" });
  if (n === 10) tasks.push({ id: "word-lock", text: "Pick up LOCK" });
  if (n === 12) tasks.push({ id: "word-burn", text: "Pick up BURN" });
  if (n === 32) tasks.push({ id: "word-fold", text: "Pick up FOLD" });
  if (n === 40) tasks.push({ id: "word-tide", text: "Pick up TIDE" });
  return {
    id: `stage${n}` as LevelId,
    name,
    theme,
    objective: isBoss ? "Clear the warden. Take the gate." : "Cross the ledger. Reach the gate.",
    tasks,
    rows: buildGenerated(n),
    exit: n === STAGE_COUNT ? "win" : "hub",
    index: n,
  };
}
