import { chunksFor, type Beat, type Chunk } from "./chunks";
import { DISTRICTS } from "./districts";
import { FROZEN_REMAINDER } from "./remainder-hand";
import { remainderName, remainderObjective } from "./remainder-names";
import type { LevelId, TaskDef, ThemeId } from "./types";
import { FIRST_BOOK, STAGE_COUNT } from "./types";
import type { LevelMeta } from "./levels-story";

const ROLE_TIERS = [
  ["1", "0"],
  ["1", "0", "2", "3"],
  ["1", "0", "2", "3", "5", "4"],
  ["1", "0", "2", "3", "5", "4", "7", "6"],
  ["1", "0", "2", "3", "5", "4", "7", "6", "8", "9"],
  ["1", "0", "2", "5", "7", "8", "9", "A", "B"],
  ["2", "5", "7", "8", "9", "A", "B", "C", "E", "Y"],
];

const WORDS: Record<number, string> = {
  6: "W",
  8: "X",
  10: "Z",
  12: "R",
  32: "O",
  40: "I",
};

function rng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 4294967296;
  };
}

function themeFor(n: number): ThemeId {
  return DISTRICTS[Math.min(DISTRICTS.length - 1, n)]?.theme ?? "street";
}

function pickChunk(beat: Beat, n: number, theme: ThemeId, rand: () => number, used: Set<string>): Chunk {
  const all = chunksFor(beat, n, theme);
  const themed = all.filter((c) => (c.theme === theme || c.tags.includes(theme)) && !used.has(c.id));
  const unused = all.filter((c) => !used.has(c.id));
  const list = themed.length ? themed : unused.length ? unused : all;
  const c = list[Math.floor(rand() * list.length)] ?? chunksFor(beat, n, "street")[0];
  if (!c) throw new Error(`no chunk for ${beat} @ ${n}`);
  used.add(c.id);
  return c;
}

function beatsFor(n: number): Beat[] {
  if (isBoss(n)) return n >= 45 ? ["land", "mix", "arena", "gate"] : ["land", "arena", "gate"];
  if (n < 31) return ["land", "teach", "mix", "combat", "rest", "gate"];
  const band = Math.min(5, Math.floor((n - 31) / 5));
  const seqs: Beat[][] = [
    ["land", "teach", "mix", "combat", "rest", "gate"],
    ["land", "teach", "mix", "mix", "combat", "gate"],
    ["land", "mix", "combat", "rest", "mix", "gate"],
    ["land", "teach", "mix", "combat", "combat", "gate"],
    ["land", "mix", "mix", "combat", "rest", "gate"],
    ["land", "mix", "combat", "mix", "rest", "gate"],
  ];
  return seqs[band];
}

function decoFor(theme: ThemeId) {
  if (theme === "fort") return "'";
  if (theme === "coil") return ";";
  if (theme === "canal") return ",";
  if (theme === "glacier") return ";";
  if (theme === "orbit") return ";";
  if (theme === "remainder") return "?";
  if (theme === "vault") return ";";
  if (theme === "spire") return ";";
  if (theme === "abyss") return "?";
  return '"';
}

function dress(rows: string[], theme: ThemeId, rand: () => number) {
  const deco = decoFor(theme);
  const H = rows.length;
  const W = rows[0]?.length ?? 0;
  let placed = 0;
  const want = 4 + Math.floor(rand() * 4);
  for (let k = 0; k < 80 && placed < want; k++) {
    const x = 2 + Math.floor(rand() * Math.max(1, W - 4));
    const y = 2 + Math.floor(rand() * Math.max(1, H - 4));
    if (rows[y][x] !== ".") continue;
    const below = rows[y + 1]?.[x] ?? "#";
    if (below !== "#" && below !== "=" && below !== "_" && below !== "*") continue;
    rows[y] = rows[y].slice(0, x) + deco + rows[y].slice(x + 1);
    placed += 1;
  }
}

function cloneRows(rows: string[]) {
  return rows.map((r) => r);
}

function replaceFirst(rows: string[], from: string, to: string) {
  for (let y = 0; y < rows.length; y++) {
    const x = rows[y].indexOf(from);
    if (x < 0) continue;
    rows[y] = rows[y].slice(0, x) + to + rows[y].slice(x + 1);
    return true;
  }
  return false;
}

const FLOOR = "#*=_T/\\&-`)g";

function placeOnFloor(rows: string[], ch: string) {
  for (let y = rows.length - 3; y >= 1; y--) {
    for (let x = 2; x < rows[y].length - 2; x++) {
      if (rows[y][x] !== ".") continue;
      if (!FLOOR.includes(rows[y + 1][x])) continue;
      rows[y] = rows[y].slice(0, x) + ch + rows[y].slice(x + 1);
      return true;
    }
  }
  return replaceFirst(rows, ".", ch);
}

function clearChar(rows: string[], ch: string) {
  for (let y = 0; y < rows.length; y++) {
    if (!rows[y].includes(ch)) continue;
    rows[y] = rows[y].replaceAll(ch, ".");
  }
}

function stitch(parts: string[][]): string[] {
  const H = parts[0].length;
  const out = Array.from({ length: H }, () => "");
  for (let i = 0; i < parts.length; i++) {
    for (let y = 0; y < H; y++) {
      let row = parts[i][y];
      if (i > 0) row = row.slice(1);
      if (i < parts.length - 1) row = row.slice(0, -1);
      out[y] += row;
    }
  }
  const w = out[0].length;
  return out.map((r, y) => {
    if (y === 0 || y === H - 1) return "#".repeat(w);
    return "#" + r.slice(1, -1) + "#";
  });
}

function roleFor(n: number, rand: () => number) {
  const roles = ROLE_TIERS[Math.min(ROLE_TIERS.length - 1, Math.floor((n - 1) / 4))];
  return roles[Math.floor(rand() * roles.length)];
}

function isBoss(n: number) {
  return n % 5 === 0 || n === STAGE_COUNT;
}

export function assembleStage(n: number): LevelMeta {
  const frozen = FROZEN_REMAINDER[n];
  if (frozen) return frozen;
  const theme = themeFor(n);
  const rand = rng(n * 9973 + 42);
  const used = new Set<string>();
  const beats = beatsFor(n);
  const parts: string[][] = [];
  for (let i = 0; i < beats.length; i++) {
    const chunk = pickChunk(beats[i], n, theme, rand, used);
    const rows = cloneRows(chunk.rows);
    if (i > 0) clearChar(rows, "@");
    if (i < beats.length - 1) clearChar(rows, "P");
    if (beats[i] === "combat") replaceFirst(rows, "1", roleFor(n, rand));
    if (beats[i] === "rest" && WORDS[n]) placeOnFloor(rows, WORDS[n]);
    if (beats[i] === "land" && WORDS[n] && !beats.includes("rest")) placeOnFloor(rows, WORDS[n]);
    parts.push(rows);
  }
  const rows = stitch(parts);
  dress(rows, theme, rand);
  const boss = isBoss(n);
  const name = n >= FIRST_BOOK ? remainderName(n, boss) : boss ? `Warden ${n}` : `Ledger ${n}`;
  const tasks: TaskDef[] = [{ id: `clear-${n}`, text: boss ? "Defeat the warden" : "Reach the gate" }];
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
    objective: n >= FIRST_BOOK ? remainderObjective(n, boss) : boss ? "Clear the warden. Take the gate." : "Cross the ledger. Reach the gate.",
    tasks,
    rows,
    exit: n === STAGE_COUNT ? "win" : "hub",
    index: n,
  };
}
