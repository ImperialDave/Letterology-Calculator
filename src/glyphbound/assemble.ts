import { chunksFor, type Beat, type Chunk } from "./chunks";
import { FROZEN_REMAINDER } from "./remainder-hand";
import { remainderName, remainderObjective } from "./remainder-names";
import { isBoss, recipeFor, rng, themeFor, type Recipe } from "./recipe";
import { FY, paintPattern, pickPattern } from "./patterns";
import { clearFightPorches, dressTerrain, ensureCounts, fillDensity } from "./density";
import { validateLevel } from "./validate-level";
import type { LevelId, TaskDef, ThemeId } from "./types";
import { STAGE_COUNT } from "./types";
import { localFloorY, sealBasement, type LevelMeta } from "./levels-story";
import { repairPath } from "./sculpt";

const WORDS: Record<number, string> = {
  6: "W",
  8: "X",
  10: "Z",
  12: "R",
  32: "O",
  40: "I",
};

function tagFor(v: string): string {
  if (v === "T") return "bounce";
  if (v === "-") return "crumble";
  if (v === "|") return "laser";
  if (v === "/") return "conveyor";
  if (v === "`") return "lift";
  if (v === ")") return "blink";
  if (v === "g") return "geyser";
  if (v === "S") return "saw";
  if (v === "~") return "sluice";
  if (v === "=") return "loft";
  return v;
}

function pickChunk(beat: Beat, n: number, theme: ThemeId, rand: () => number, used: Set<string>, prefer: string[] = []): Chunk {
  const all = chunksFor(beat, n, theme);
  const themed = all.filter((c) => (c.theme === theme || c.tags.includes(theme)) && !used.has(c.id));
  const unused = all.filter((c) => !used.has(c.id));
  const liked = (themed.length ? themed : unused).filter((c) =>
    prefer.some((p) => c.tags.includes(p) || c.rows.join("").includes(p)),
  );
  const list = liked.length ? liked : themed.length ? themed : unused.length ? unused : all;
  const c = list[Math.floor(rand() * list.length)] ?? chunksFor(beat, n, "street")[0];
  if (!c) throw new Error(`no chunk for ${beat} @ ${n}`);
  used.add(c.id);
  return c;
}

function cloneRows(rows: string[]) {
  return rows.map((r) => r);
}

function setCell(rows: string[], x: number, y: number, ch: string) {
  if (y < 0 || y >= rows.length) return;
  const row = rows[y];
  if (x < 0 || x >= row.length) return;
  rows[y] = row.slice(0, x) + ch + row.slice(x + 1);
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

function landmarkDress(rows: string[], deco: string, rand: () => number) {
  const H = rows.length;
  const W = rows[0]?.length ?? 0;
  const step = 18;
  let placed = 0;
  for (let x = 4; x < W - 4; x += step) {
    const ox = x + Math.floor(rand() * 4);
    const fy = localFloorY(rows, ox) || FY;
    const y = fy - 2;
    if (y <= 0 || y >= H) continue;
    if (rows[y][ox] !== ".") continue;
    const below = rows[y + 1]?.[ox] ?? "#";
    if (below !== "#" && below !== "=" && below !== "_" && below !== "*") continue;
    const blocked = "@%P!".includes(rows[fy - 1]?.[ox] ?? "");
    if (blocked) continue;
    if (deco === "_") {
      if (rows[y][ox] === ".") setCell(rows, ox, y, "_");
    } else {
      setCell(rows, ox, y, deco);
    }
    placed += 1;
    if (placed >= Math.max(2, Math.floor(W / 20))) break;
  }
}

function mutate(rows: string[]): string[] {
  for (let k = 0; k < 6; k++) {
    const issues = validateLevel(rows);
    const fatal = issues.filter((i) =>
      ["path", "pit", "pit-wide", "laser-floor", "saw-path", "hang", "teeth", "rest-hazard", "embed"].includes(i.code),
    );
    if (!fatal.length) return rows;
    for (const issue of fatal) {
      if (issue.code === "saw-path") {
        for (let y = 0; y < rows.length; y++) {
          for (let x = 0; x < rows[y].length; x++) {
            if (rows[y][x] !== "S") continue;
            setCell(rows, x, y, ".");
            setCell(rows, x, Math.max(1, y - 1), "S");
          }
        }
      } else if (issue.code === "laser-floor") {
        for (let y = 0; y < rows.length; y++) {
          for (let x = 0; x < rows[y].length; x++) {
            if (rows[y][x] !== "|") continue;
            const fy = localFloorY(rows, x) || FY;
            if (y >= fy - 1) {
              setCell(rows, x, y, ".");
              setCell(rows, x, Math.max(1, fy - 3), "|");
            }
          }
        }
      } else if (issue.code === "pit" || issue.code === "pit-wide") {
        const m = issue.message.match(/(\d+)/);
        const x0 = m ? Number(m[1]) : 8;
        const fy = localFloorY(rows, x0) || FY;
        setCell(rows, x0 + 1, fy, "#");
        setCell(rows, x0 + 1, fy - 1, "T");
      } else if (issue.code === "path") {
        const W = rows[0]?.length ?? 0;
        for (let x = 2; x < W - 2; x += 6) {
          const fy = localFloorY(rows, x) || FY;
          setCell(rows, x, fy - 2, "=");
        }
      } else if (issue.code === "rest-hazard" || issue.code === "teeth") {
        const x = rows.findIndex ? -1 : -1;
        for (let y = 0; y < rows.length; y++) {
          const i = rows[y].indexOf("%");
          if (i < 0) continue;
          setCell(rows, i, y + 1, "#");
          if (rows[y][i] === "^" || rows[y][i] === "S") setCell(rows, i, y, "%");
        }
        void x;
      } else if (issue.code === "hang") {
        const mark = issue.message.startsWith("gate") ? "P" : issue.message.startsWith("spawn") ? "@" : "%";
        for (let y = 0; y < rows.length; y++) {
          const x = rows[y].indexOf(mark);
          if (x < 0) continue;
          setCell(rows, x, Math.min(rows.length - 2, y + 1), "#");
        }
      }
    }
  }
  return rows;
}

function paintBeat(beat: Beat, recipe: Recipe, n: number, rand: () => number, used: Set<string>): string[] {
  const width = n >= 30 ? 24 + Math.floor(rand() * 6) : n >= 15 ? 22 + Math.floor(rand() * 6) : 18 + Math.floor(rand() * 8);
  const pit = 2 + Math.floor(rand() * 2);
  const pattern = pickPattern(beat, recipe.featured, recipe.mix, rand, used, recipe.theme);
  if (pattern) {
    used.add(pattern.id);
    const rows = paintPattern(pattern, width, {
      enemy: recipe.enemy,
      deco: recipe.deco,
      pit,
      pocket: beat === "rest" || beat === "mix" ? recipe.pocket : "none",
      secret: beat === "rest" && recipe.secret,
      mix: recipe.mix,
    });
    return rows;
  }
  const chunk = pickChunk(beat, n, recipe.theme, rand, used, [tagFor(recipe.featured), tagFor(recipe.mix), recipe.featured, recipe.mix]);
  return cloneRows(chunk.rows);
}

export function assembleStage(n: number): LevelMeta {
  const frozen = FROZEN_REMAINDER[n];
  if (frozen) return frozen;
  const rand = rng(n * 9973 + 42);
  const recipe = recipeFor(n, rand);
  const used = new Set<string>();
  const parts: string[][] = [];
  for (let i = 0; i < recipe.beats.length; i++) {
    const beat = recipe.beats[i];
    const rows = paintBeat(beat, recipe, n, rand, used);
    if (i > 0) clearChar(rows, "@");
    if (i < recipe.beats.length - 1) clearChar(rows, "P");
    if (beat === "combat") replaceFirst(rows, "1", recipe.enemy);
    if (beat === "rest" && WORDS[n]) placeOnFloor(rows, WORDS[n]);
    if (beat === "land" && WORDS[n] && !recipe.beats.includes("rest")) placeOnFloor(rows, WORDS[n]);
    parts.push(rows);
  }
  let rows = stitch(parts);
  landmarkDress(rows, recipe.deco, rand);
  if (n >= 6) fillDensity(rows, { n, deco: recipe.deco, rand, fy: FY, featured: recipe.featured, theme: recipe.theme });
  rows = dressTerrain(rows, { n, deco: recipe.deco, rand, fy: FY });
  rows = mutate(rows);
  sealBasement(rows, FY);
  repairPath(rows);
  ensureCounts(rows, n);
  clearFightPorches(rows);
  const boss = isBoss(n);
  const tasks: TaskDef[] = [{ id: `clear-${n}`, text: boss ? "Defeat the warden" : "Reach the gate" }];
  if (n === 6) tasks.push({ id: "word-wall", text: "Pick up WALL" });
  if (n === 8) tasks.push({ id: "word-rise", text: "Pick up RISE" });
  if (n === 10) tasks.push({ id: "word-lock", text: "Pick up LOCK" });
  if (n === 12) tasks.push({ id: "word-burn", text: "Pick up BURN" });
  if (n === 32) tasks.push({ id: "word-fold", text: "Pick up FOLD" });
  if (n === 40) tasks.push({ id: "word-tide", text: "Pick up TIDE" });
  return {
    id: `stage${n}` as LevelId,
    name: remainderName(n, boss),
    theme: themeFor(n),
    objective: remainderObjective(n, boss),
    tasks,
    rows,
    exit: n === STAGE_COUNT ? "win" : "hub",
    index: n,
  };
}

export function assembleRecipe(n: number) {
  return recipeFor(n, rng(n * 9973 + 42));
}
