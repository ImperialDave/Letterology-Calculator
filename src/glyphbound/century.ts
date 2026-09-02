/** Second Century ledgers (61–160). Glyphbound Doctrine: land → teach → mix → combat → rest → combat → gate. */
import { CENTURY, centurySpec, type CenturySetpiece, type CenturySpec } from "./century-catalog";
import { clearFightPorches, densityFloors, ensureCounts, fillDensity, finishLedger, tally } from "./density";
import { decoFor, isBoss, rng } from "./recipe";
import { houseAfter, plantAt } from "./site";
import { realizeLandform, repairPath } from "./sculpt";
import { grid, localFloorY, sealBasement, type Grid, type LevelMeta } from "./levels-story";
import { STAGE_COUNT, type LevelId, type TaskDef } from "./types";
import { validateLevel } from "./validate-level";

function writeCell(rows: string[], x: number, y: number, ch: string) {
  if (y < 0 || y >= rows.length) return;
  const row = rows[y];
  if (x < 0 || x >= row.length) return;
  if ("@%P".includes(row[x] ?? "")) return;
  rows[y] = row.slice(0, x) + ch + row.slice(x + 1);
}

function capMainPits(rows: string[]) {
  const H = rows.length;
  const W = rows[0]?.length ?? 0;
  let spawnY = 0;
  for (let y = 0; y < H; y++) {
    if (rows[y].includes("@")) {
      spawnY = y;
      break;
    }
  }
  const main = Math.min(H - 2, spawnY + 1);
  const floorish = "#*=_T/\\&-`)gjw[";
  let x = 1;
  while (x < W - 1) {
    if (floorish.includes(rows[main]?.[x] ?? "#")) {
      x += 1;
      continue;
    }
    const x0 = x;
    while (x < W - 1 && !floorish.includes(rows[main]?.[x] ?? "#")) x += 1;
    const span = x - x0;
    if (span > 4) {
      for (let i = x0 + 3; i < x; i++) {
        writeCell(rows, i, main, "#");
        if (rows[spawnY][i] === "T") writeCell(rows, i, spawnY, ".");
      }
      writeCell(rows, x0 + 1, spawnY, "T");
      writeCell(rows, x0 + 1, main, ".");
      writeCell(rows, x0 + 1, main + 1, "#");
    }
  }
}

function ensureFeatured(rows: string[], spec: CenturySpec, fy: number) {
  const v = spec.featured;
  if (rows.join("").includes(v)) return;
  let spawnY = fy - 1;
  for (let y = 0; y < rows.length; y++) {
    if (rows[y].includes("@")) {
      spawnY = y;
      break;
    }
  }
  const main = spawnY + 1;
  const x = Math.max(18, spec.teachX);
  if (v === "w" || v === "j" || v === "~") {
    writeCell(rows, x, main, v);
    writeCell(rows, x + 1, main, v);
    writeCell(rows, x - 1, main, "#");
    writeCell(rows, x + 2, main, "#");
    writeCell(rows, x, spawnY, ".");
    writeCell(rows, x + 1, spawnY, ".");
    return;
  }
  const yf = localFloorY(rows, x) || fy;
  if (v === "d") {
    writeCell(rows, x, yf, "&");
    writeCell(rows, x, yf - 2, "d");
    writeCell(rows, x - 1, yf - 2, ".");
    writeCell(rows, x + 1, yf - 2, ".");
    writeCell(rows, x, yf - 1, ".");
    writeCell(rows, x, yf - 3, ".");
    return;
  }
  if (v === "|" ) {
    writeCell(rows, x, yf - 3, "|");
    writeCell(rows, x, yf - 4, "|");
    writeCell(rows, x, yf - 5, "#");
    return;
  }
  if (v === "S" || v === "l" || v === "z" || v === "f" || v === "x") {
    writeCell(rows, x, yf - 2, v);
    writeCell(rows, x, yf, "#");
    writeCell(rows, x, yf - 3, "=");
    return;
  }
  writeCell(rows, x, yf - 1, v);
}

function healPath(rows: string[]) {
  for (let k = 0; k < 6; k++) {
    const issues = validateLevel(rows).filter((i) =>
      ["path", "pit", "pit-wide", "hang", "laser-floor", "saw-path"].includes(i.code),
    );
    if (!issues.length) return;
    capMainPits(rows);
    for (const issue of issues) {
      const pitAt = /pit at (\d+) is (\d+)/.exec(issue.message);
      if (pitAt && (issue.code === "pit" || issue.code === "pit-wide")) {
        const x0 = Number(pitAt[1]);
        const span = Number(pitAt[2]);
        let spawnY = 0;
        for (let y = 0; y < rows.length; y++) {
          if (rows[y].includes("@")) {
            spawnY = y;
            break;
          }
        }
        const main = spawnY + 1;
        for (let i = 0; i < span; i++) {
          writeCell(rows, x0 + i, main, "#");
          if (rows[spawnY][x0 + i] === "T") writeCell(rows, x0 + i, spawnY, ".");
        }
        writeCell(rows, x0 + 1, main, ".");
        writeCell(rows, x0 + 2, main, ".");
        writeCell(rows, x0 + 1, spawnY, "T");
        writeCell(rows, x0 + 1, main + 1, "#");
        continue;
      }
      if (issue.code === "path") {
        const W = rows[0]?.length ?? 0;
        let spawnY = 0;
        for (let y = 0; y < rows.length; y++) {
          if (rows[y].includes("@")) {
            spawnY = y;
            break;
          }
        }
        for (let x = 2; x < W - 2; x += 5) {
          writeCell(rows, x, spawnY + 1, "#");
          writeCell(rows, x, spawnY, ".");
          writeCell(rows, x, Math.max(1, spawnY - 1), "=");
        }
      } else if (issue.code === "hang") {
        for (const mark of ["@", "%", "P"]) {
          for (let y = 0; y < rows.length; y++) {
            const x = rows[y].indexOf(mark);
            if (x < 0) continue;
            writeCell(rows, x, Math.min(rows.length - 2, y + 1), "#");
          }
        }
      } else if (issue.code === "laser-floor") {
        for (let y = 0; y < rows.length; y++) {
          for (let x = 0; x < rows[y].length; x++) {
            if (rows[y][x] !== "|") continue;
            const yf = localFloorY(rows, x);
            if (y >= yf - 1) {
              writeCell(rows, x, y, ".");
              writeCell(rows, x, Math.max(1, yf - 3), "|");
            }
          }
        }
      }
    }
  }
}

function tryPlant(rows: string[], x: number, ch: string) {
  if (!ch) return false;
  if (plantAt(rows, x, ch)) return true;
  for (const d of [2, -2, 3, -3, 1, -1, 4, -4]) {
    if (plantAt(rows, x + d, ch)) return true;
  }
  return false;
}

function carveSeat(g: Grid, fy: number, x: number, verb: string) {
  const { put, fill } = g;
  if (verb === "T") {
    fill(x, fy, 3, ".");
    put(x + 1, fy + 1, "^");
    put(x + 2, fy + 1, "^");
    put(x, fy + 2, "#");
    put(x + 3, fy, "#");
  } else if (verb === "`" || verb === ")") {
    fill(x, fy, 3, ".");
    put(x - 1, fy, "#");
    put(x + 3, fy, "#");
  } else if (verb === "{") {
    fill(x, fy, 5, ".");
    fill(x - 1, fy - 3, 7, "=");
  } else if (verb === "-") {
    fill(x, fy, 5, "-");
    put(x - 1, fy, "#");
    put(x + 5, fy, "#");
  } else if (verb === "/") {
    fill(x, fy, 4, "/");
  } else if (verb === "\\") {
    fill(x, fy, 4, "\\");
  } else if (verb === "=") {
    fill(x, fy - 2, 4, "=");
    fill(x + 5, fy - 4, 4, "=");
    fill(x + 10, fy - 2, 3, "=");
  } else if (verb === "~" || verb === "w") {
    fill(x, fy, 2, ".");
  } else if (verb === "g") {
    fill(x, fy, 1, ".");
    put(x - 1, fy, "#");
    put(x + 1, fy, "#");
  }
  if (verb === "=" || verb === "-" || verb === "/") return;
  tryPlant(g, x, verb);
}

function decoOf(theme: CenturySpec["theme"]) {
  const d = decoFor(theme);
  return !d || d === "_" ? ";" : d;
}

function sealSpawn(g: Grid, fy: number) {
  const { put, fill } = g;
  fill(1, fy, 12, "#");
  for (let x = 1; x <= 12; x++) {
    for (let y = 1; y < fy; y++) {
      if (g[y][x] === "#") put(x, y, ".");
    }
  }
}

function land(g: Grid, fy: number, spec: CenturySpec) {
  const { put } = g;
  const deco = decoOf(spec.theme);
  put(2, fy - 1, "@");
  put(4, fy - 1, "i");
  put(6, fy - 2, deco);
  put(8, fy - 1, "i");
  put(10, fy - 2, deco);
}

function forceFeatured(g: Grid, fy: number, x: number, verb: string) {
  carveSeat(g, fy, x, verb);
  if (g.some((r) => r.includes(verb))) return;
  const { put, fill } = g;
  if (verb === "d") {
    fill(x - 2, fy, 8, "#");
    put(x, fy, "&");
    put(x - 1, fy - 2, ".");
    put(x, fy - 2, "d");
    put(x + 1, fy - 2, ".");
    put(x, fy - 1, ".");
    put(x, fy - 3, ".");
    return;
  }
  if (verb === "{" || verb === "`" || verb === ")" || verb === "T") {
    fill(x, fy, 4, ".");
    put(x - 1, fy, "#");
    put(x + 4, fy, "#");
    put(x + 1, fy - 1, verb === "{" ? "{" : verb);
    if (verb === "{") fill(x - 1, fy - 3, 7, "=");
    if (verb === "T") put(x + 1, fy + 1, "#");
    return;
  }
  tryPlant(g, Math.max(18, x), verb);
}

function assistWidePits(rows: string[]) {
  const H = rows.length;
  const W = rows[0]?.length ?? 0;
  const set = (x: number, y: number, ch: string) => {
    if (y < 1 || y >= H - 1 || x < 1 || x >= W - 1) return;
    if ("@%P".includes(rows[y][x] ?? "")) return;
    rows[y] = rows[y].slice(0, x) + ch + rows[y].slice(x + 1);
  };
  let walk = 0;
  for (let y = 0; y < H; y++) {
    if (rows[y].includes("@")) {
      walk = y;
      break;
    }
  }
  if (!walk) walk = Math.max(1, H - 4);
  let x = 2;
  while (x < W - 2) {
    const ch = rows[walk + 1]?.[x] ?? "#";
    if (ch !== "." && ch !== "^") {
      x += 1;
      continue;
    }
    const x0 = x;
    while (x < W - 2) {
      const c = rows[walk + 1]?.[x] ?? "#";
      if (c !== "." && c !== "^") break;
      x += 1;
    }
    const span = x - x0;
    if (span > 4) {
      const mid = x0 + Math.floor(span / 2);
      set(mid, walk, "T");
      set(mid, walk + 1, "#");
    }
    if (span > 7) {
      const a = x0 + 2;
      const b = x - 3;
      set(a, walk, "T");
      set(a, walk + 1, "#");
      set(b, walk, "T");
      set(b, walk + 1, "#");
    }
  }
}

function stampDeco(rows: string[], deco: string, need: number) {
  const H = rows.length;
  const W = rows[0]?.length ?? 0;
  let n = 0;
  for (const r of rows) for (const c of r) if ("';\",?".includes(c)) n += 1;
  for (let x = 10; x < W - 10 && n < need; x += 5) {
    for (let y = 2; y < H - 3; y++) {
      if (rows[y][x] !== ".") continue;
      const below = rows[y + 1][x];
      if (below !== "#" && below !== "=" && below !== "_") continue;
      if ("@%P".includes(rows[y][x] ?? "")) continue;
      rows[y] = rows[y].slice(0, x) + deco + rows[y].slice(x + 1);
      n += 1;
      break;
    }
  }
}

function porch(g: Grid, fy: number, x: number, glyphs: string) {
  const { put, fill } = g;
  const w = Math.max(7, glyphs.length + 6);
  fill(x, fy, w, "#");
  for (let i = 0; i < w; i++) put(x + i, fy - 1, ".");
  const start = x + 2;
  for (let i = 0; i < glyphs.length; i++) {
    const ch = glyphs[i];
    if (ch && ch !== " ") put(start + i, fy - 1, ch);
  }
}

function rest(g: Grid, fy: number, x: number) {
  const { put, fill } = g;
  fill(x, fy, 6, "#");
  put(x + 1, fy - 1, "%");
  put(x + 3, fy - 1, "h");
  put(x + 5, fy - 1, "i");
}

function pocket(g: Grid, fy: number, x: number, prize: string) {
  const { put, fill } = g;
  fill(x, fy - 3, 5, "=");
  put(x + 2, fy - 4, prize);
}

function gate(g: Grid, fy: number) {
  const { put, W } = g;
  put(W - 8, fy - 1, "i");
  put(W - 6, fy - 2, decoOf("remainder"));
  put(W - 4, fy - 1, "P");
}

function setpiece(g: Grid, fy: number, x: number, kind: CenturySetpiece, deco: string) {
  const { put, fill } = g;
  if (kind === "colonnade") {
    for (let i = 0; i < 4; i++) {
      const cx = x + i * 3;
      put(cx, fy - 3, "#");
      fill(cx, fy - 4, 2, "=");
      put(cx + 1, fy - 5, i % 2 ? deco : "1");
    }
  } else if (kind === "zipper") {
    for (let i = 0; i < 5; i++) {
      const up = i % 2 === 0 ? 2 : 4;
      fill(x + i * 3, fy - up, 2, "=");
      put(x + i * 3, fy - up - 1, i % 2 === 0 ? deco : "2");
    }
  } else if (kind === "terrace") {
    fill(x, fy - 2, 4, "=");
    fill(x + 4, fy - 4, 4, "=");
    fill(x + 8, fy - 2, 4, "=");
    put(x + 1, fy - 3, deco);
    put(x + 5, fy - 5, deco);
    put(x + 9, fy - 3, "0");
  } else if (kind === "ice") {
    fill(x, fy - 2, 6, "_");
    fill(x + 8, fy - 3, 5, "=");
    put(x + 2, fy - 3, deco);
  } else if (kind === "ribs") {
    for (let i = 0; i < 3; i++) {
      put(x + i * 4, fy - 2, "#");
      put(x + i * 4, fy - 3, "#");
      fill(x + i * 4 - 1, fy - 4, 3, "=");
    }
  } else if (kind === "torches") {
    for (let i = 0; i < 5; i++) put(x + i * 2, fy - 2, deco);
  } else if (kind === "dual-loft") {
    fill(x, fy - 3, 5, "=");
    fill(x + 8, fy - 5, 5, "=");
    put(x + 2, fy - 4, deco);
    put(x + 10, fy - 6, "i");
  } else if (kind === "vent") {
    put(x, fy - 1, "v");
    put(x, fy - 2, "v");
    put(x, fy - 3, "v");
    fill(x + 2, fy - 4, 4, "=");
    put(x + 3, fy - 5, "$");
  } else if (kind === "switchback") {
    fill(x, fy - 2, 3, "=");
    fill(x + 4, fy - 4, 3, "=");
    fill(x + 8, fy - 2, 3, "=");
    fill(x + 12, fy - 4, 3, "=");
    put(x + 1, fy - 3, deco);
    put(x + 5, fy - 5, "3");
  } else if (kind === "court") {
    fill(x, fy, 8, "#");
    fill(x + 1, fy - 3, 6, "=");
    put(x + 3, fy - 4, deco);
    tryPlant(g, x + 4, "d");
  }
}

function extraDress(g: Grid, fy: number, spec: CenturySpec) {
  const deco = decoOf(spec.theme);
  const { put, fill } = g;
  if (spec.silhouette === "loft-street") {
    fill(spec.extraX, fy - 2, 8, "=");
    fill(spec.extraX + 10, fy - 4, 6, "=");
  } else if (spec.silhouette === "pit-chain") {
    carveSeat(g, fy, spec.extraX, "T");
    carveSeat(g, fy, spec.extraX + 8, spec.featured === "T" ? "`" : "T");
  } else if (spec.silhouette === "saw-rail") {
    tryPlant(g, spec.extraX, "S");
  } else if (spec.silhouette === "shutter-gallery") {
    tryPlant(g, spec.extraX, "}");
  } else if (spec.silhouette === "echo-lofts") {
    fill(spec.extraX, fy - 3, 5, "=");
    tryPlant(g, spec.extraX + 2, "[");
  } else if (spec.silhouette === "carriage-canyon") {
    carveSeat(g, fy, spec.extraX, "{");
  } else if (spec.silhouette === "laser-nave") {
    tryPlant(g, spec.extraX, "|");
    tryPlant(g, spec.extraX + 6, "|");
  } else if (spec.silhouette === "geyser-row") {
    carveSeat(g, fy, spec.extraX, "g");
  } else if (spec.silhouette === "ice-shelf") {
    fill(spec.extraX, fy - 2, 10, "_");
  } else if (spec.silhouette === "rib-climb") {
    fill(spec.extraX, fy - 2, 3, "=");
    fill(spec.extraX + 4, fy - 4, 3, "=");
    fill(spec.extraX + 8, fy - 3, 3, "=");
  } else if (spec.silhouette === "well-loft-well") {
    carveSeat(g, fy, spec.extraX, "`");
    fill(spec.extraX + 6, fy - 3, 4, "=");
  }
  put(spec.extraX + 3, fy - 2, deco);
}

function paint(g: Grid, fy: number, spec: CenturySpec) {
  const deco = decoOf(spec.theme);
  const teachX = Math.max(18, spec.teachX);
  land(g, fy, spec);
  forceFeatured(g, fy, teachX, spec.featured);
  porch(g, fy, spec.porchAX, spec.porchA);
  carveSeat(g, fy, spec.mixX, spec.mix);
  rest(g, fy, spec.restX);
  extraDress(g, fy, spec);
  setpiece(g, fy, spec.setX, spec.setpiece, deco);
  porch(g, fy, spec.porchBX, spec.porchB);
  pocket(g, fy, spec.pocketX, spec.prize);
  gate(g, fy);
}

function ledger(spec: CenturySpec): LevelMeta {
  const W = spec.w;
  const H = 16;
  const fy = 11;
  const g = grid(W, H, fy) as Grid;
  const landOps = spec.land.map((op) => ({ ...op, at: Math.max(18, op.at) }));
  realizeLandform(g, landOps);
  sealSpawn(g, fy);
  paint(g, fy, spec);
  fillDensity(g, {
    n: spec.n,
    deco: decoOf(spec.theme),
    rand: rng(spec.n * 9973 + 91),
    fy,
    theme: spec.theme,
    featured: spec.featured,
  });
  sealBasement(g, fy);
  repairPath(g);
  assistWidePits(g);
  ensureCounts(g, spec.n);
  finishLedger(g, spec.n);
  houseAfter(g);
  clearFightPorches(g);
  stampDeco(g, decoOf(spec.theme), Math.max(16, Math.floor(W / 7)));
  capMainPits(g);
  ensureFeatured(g, spec, fy);
  healPath(g);
  ensureFeatured(g, spec, fy);
  const boss = isBoss(spec.n);
  const tasks: TaskDef[] = [
    { id: `clear-${spec.n}`, text: boss ? "Defeat the warden" : "Reach the gate" },
  ];
  return {
    id: `stage${spec.n}` as LevelId,
    name: spec.name,
    theme: spec.theme,
    objective: spec.objective,
    tasks,
    rows: [...g],
    exit: spec.n === STAGE_COUNT ? "win" : "hub",
    index: spec.n,
  };
}

export const FROZEN_CENTURY: Record<number, LevelMeta> = {};
for (const spec of CENTURY) {
  FROZEN_CENTURY[spec.n] = ledger(spec);
}

/** Re-apply after campaign finishLedger so featured toys and loft floors survive. */
export function polishCentury(meta: LevelMeta) {
  const spec = centurySpec(meta.index);
  if (!spec) return;
  padShelves(meta.rows, spec.n);
  ensureFeatured(meta.rows, spec, 11);
  capMainPits(meta.rows);
  healPath(meta.rows);
  stampDeco(meta.rows, decoOf(spec.theme), Math.max(16, Math.floor((meta.rows[0]?.length ?? 80) / 7)));
  padHazards(meta.rows, spec.n);
  houseAfter(meta.rows);
  clearFightPorches(meta.rows);
  houseAfter(meta.rows);
  footToys(meta.rows);
  houseKit(meta.rows);
  openLids(meta.rows);
  stripBounceHall(meta.rows);
  ensureFeatured(meta.rows, spec, 11);
  footToys(meta.rows);
  houseKit(meta.rows);
  openLids(meta.rows);
  healPath(meta.rows);
  clearWalk(meta.rows);
  padHazards(meta.rows, spec.n);
  padShelves(meta.rows, spec.n);
  ensureFeatured(meta.rows, spec, 11);
}

function clearWalk(rows: string[]) {
  const H = rows.length;
  const W = rows[0]?.length ?? 0;
  let spawnY = 0;
  for (let y = 0; y < H; y++) {
    if (rows[y].includes("@")) {
      spawnY = y;
      break;
    }
  }
  if (!spawnY) return;
  const main = Math.min(H - 2, spawnY + 1);
  for (let x = 2; x < W - 2; x++) {
    const ch = rows[spawnY][x];
    if (ch === "^" || ch === "S" || ch === "|") writeCell(rows, x, spawnY, ".");
    if (ch === "#" || ch === "*" || ch === "&") {
      let x1 = x;
      while (x1 < W - 2 && "#*&".includes(rows[spawnY][x1] ?? ".")) x1 += 1;
      if (x1 - x > 2) {
        for (let i = x + 2; i < x1; i++) writeCell(rows, i, spawnY, ".");
      }
      x = x1 - 1;
    }
  }
  void main;
}

function houseKit(rows: string[]) {
  const H = rows.length;
  const W = rows[0]?.length ?? 0;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const ch = rows[y][x];
      if (ch === "|") {
        if (rows[y - 1][x] === ".") writeCell(rows, x, y - 1, "#");
      }
      if (ch === "^") {
        if (rows[y + 1][x] === ".") writeCell(rows, x, y + 1, "#");
      }
      if (ch === "[") {
        if (rows[y + 1][x] === ".") writeCell(rows, x, y + 1, "#");
      }
      if (ch === "`" || ch === ":") {
        if (rows[y][x - 1] === ".") writeCell(rows, x - 1, y, "#");
        if (rows[y + 1][x] === ".") writeCell(rows, x, y + 1, "#");
      }
      if (ch === "x") {
        if (rows[y][x - 1] === ".") writeCell(rows, x - 1, y, "#");
      }
    }
  }
}

function openLids(rows: string[]) {
  const H = rows.length;
  const W = rows[0]?.length ?? 0;
  for (let y = 2; y < H - 1; y++) {
    let x = 1;
    while (x < W - 1) {
      if (rows[y][x] !== "^" || rows[y - 1][x] !== "#") {
        x += 1;
        continue;
      }
      const x0 = x;
      while (x < W - 1 && rows[y][x] === "^" && rows[y - 1][x] === "#") x += 1;
      const span = x - x0;
      if (span <= 3) {
        for (let i = x0; i < x; i++) writeCell(rows, i, y - 1, ".");
      } else {
        for (let i = x0; i < x; i++) writeCell(rows, i, y, "#");
      }
    }
  }
}

function stripBounceHall(rows: string[]) {
  const H = rows.length;
  const W = rows[0]?.length ?? 0;
  const floorish = "#*&";
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (rows[y][x] !== "T") continue;
      const below = rows[y + 1][x];
      const l = rows[y + 1][x - 1];
      const r = rows[y + 1][x + 1];
      const gap = l === "." || l === "^" || r === "." || r === "^";
      if (floorish.includes(below) && !gap) writeCell(rows, x, y, ".");
    }
  }
}

function footToys(rows: string[]) {
  const H = rows.length;
  const W = rows[0]?.length ?? 0;
  for (let y = 1; y < H - 2; y++) {
    for (let x = 1; x < W - 1; x++) {
      const ch = rows[y][x];
      if (ch === "T") {
        const below = rows[y + 1][x];
        const deep = rows[y + 2][x];
        if (deep === "^" || below === "^") {
          writeCell(rows, x, y, ".");
          if (below === "#") writeCell(rows, x, y + 1, ".");
          continue;
        }
        if (below === "." || below === "v" || below === "=") writeCell(rows, x, y + 1, "#");
      }
      if (ch === "`" || ch === ")" || ch === "g") {
        const below = rows[y + 1][x];
        if (below === "." || below === "v") writeCell(rows, x, y + 1, "#");
      }
      if (ch === "w" || ch === "j" || ch === "~") {
        if (rows[y + 1][x] === ".") writeCell(rows, x, y + 1, "#");
        if (rows[y][x - 1] === ".") writeCell(rows, x - 1, y, "#");
        if (rows[y][x + 1] === ".") writeCell(rows, x + 1, y, "#");
      }
    }
  }
}

function padHazards(rows: string[], n: number) {
  const W = rows[0]?.length ?? 0;
  const need = densityFloors(n, W).hazards;
  let x = 10;
  let guard = 0;
  while (tally(rows).hazards < need && guard++ < 80) {
    const xx = 8 + ((x + guard * 3) % Math.max(8, W - 16));
    if (!plantAt(rows, xx, "|")) {
      const yf = localFloorY(rows, xx);
      writeCell(rows, xx, Math.max(1, yf - 3), "|");
      writeCell(rows, xx, Math.max(1, yf - 4), "|");
      writeCell(rows, xx, Math.max(1, yf - 5), "#");
    }
    x += 3;
  }
}

function padShelves(rows: string[], n: number) {
  const W = rows[0]?.length ?? 0;
  const need = densityFloors(n, W).shelves;
  let y = 4;
  for (let x = 8; tally(rows).shelves < need && x < W - 8; x += 4) {
    const yf = localFloorY(rows, x);
    const loft = Math.max(2, yf - 2 - (y % 2));
    if (rows[loft]?.[x] === ".") {
      writeCell(rows, x, loft, "=");
      writeCell(rows, x + 1, loft, "=");
    }
    y += 1;
  }
}

export function centuryNames(): Record<number, string> {
  const out: Record<number, string> = {};
  for (const spec of CENTURY) out[spec.n] = spec.name;
  return out;
}

export function centuryObjectives(): Record<number, string> {
  const out: Record<number, string> = {};
  for (const spec of CENTURY) out[spec.n] = spec.objective;
  return out;
}

export { centurySpec };
