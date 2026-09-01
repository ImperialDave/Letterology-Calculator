/** Remainder density floors. Glyphbound Doctrine: .grok/skills/glyphbound-ledgers/SKILL.md */
import { enemyMul } from "./difficulty";
import { localFloorY } from "./levels-story";
import { isBoss, rng } from "./recipe";
import { houseAfter, plantAt } from "./site";
import type { Difficulty, ThemeId } from "./types";

const FLOOR = "#*=_T/\\&-`)gjw[";
const RESERVED = "@%P!";

export const ENEMY_GLYPHS = "1023456789ABCEYGHKQUNJLM";
export const HAZARD_GLYPHS = "^|S~lzxjdw}[";
export const MOVER_GLYPHS = "/\\T:`)g-f{";
export const DECO_GLYPHS = "';\",?";
export const SHELF_GLYPHS = "=_*&";
export const PICKUP_GLYPHS = "ih$o+";

export interface Tally {
  W: number;
  H: number;
  enemies: number;
  wardens: number;
  hazards: number;
  movers: number;
  deco: number;
  shelves: number;
  pickups: number;
}

export interface DensityFloors {
  enemies: number;
  hazards: number;
  movers: number;
  deco: number;
  shelves: number;
  pickups: number;
}

function countGlyphs(text: string, set: string) {
  let n = 0;
  for (let i = 0; i < text.length; i++) if (set.includes(text[i])) n += 1;
  return n;
}

export function tally(rows: string[]): Tally {
  const text = rows.join("");
  return {
    W: rows[0]?.length ?? 0,
    H: rows.length,
    enemies: countGlyphs(text, ENEMY_GLYPHS),
    wardens: countGlyphs(text, "!"),
    hazards: countGlyphs(text, HAZARD_GLYPHS),
    movers: countGlyphs(text, MOVER_GLYPHS),
    deco: countGlyphs(text, DECO_GLYPHS),
    shelves: countGlyphs(text, SHELF_GLYPHS),
    pickups: countGlyphs(text, PICKUP_GLYPHS),
  };
}

export function densityFloors(n: number, W: number): DensityFloors {
  const w = Math.max(48, W);
  if (n < 15) {
    return {
      enemies: isBoss(n) ? Math.max(3, Math.floor(w / 24)) : Math.max(4, Math.floor(w / 18)),
      hazards: Math.max(6, Math.floor(w / 14)),
      movers: Math.max(4, Math.floor(w / 20)),
      deco: Math.max(8, Math.floor(w / 12)),
      shelves: Math.max(16, Math.floor(w / 6)),
      pickups: Math.max(3, Math.floor(w / 28)),
    };
  }
  if (n < 25) {
    return {
      enemies: isBoss(n) ? Math.max(4, Math.floor(w / 20)) : Math.max(6, Math.floor(w / 14)),
      hazards: Math.max(8, Math.floor(w / 12)),
      movers: Math.max(6, Math.floor(w / 16)),
      deco: Math.max(10, Math.floor(w / 10)),
      shelves: Math.max(24, Math.floor(w / 4)),
      pickups: Math.max(3, Math.floor(w / 26)),
    };
  }
  if (n < 30) {
    return {
      enemies: isBoss(n) ? Math.max(5, Math.floor(w / 18)) : Math.max(8, Math.floor(w / 12)),
      hazards: Math.max(10, Math.floor(w / 10)),
      movers: Math.max(8, Math.floor(w / 14)),
      deco: Math.max(12, Math.floor(w / 8)),
      shelves: Math.max(28, Math.floor(w / 4)),
      pickups: Math.max(4, Math.floor(w / 24)),
    };
  }
  return {
    enemies: isBoss(n) ? Math.max(5, Math.floor(w / 18)) : Math.max(10, Math.floor(w / 10)),
    hazards: Math.max(12, Math.floor(w / 8)),
    movers: Math.max(8, Math.floor(w / 12)),
    deco: Math.max(12, Math.floor(w / 8)),
    shelves: Math.max(32, Math.floor(w / 3)),
    pickups: Math.max(4, Math.floor(w / 24)),
  };
}

export function packFor(n: number): string[] {
  if (n < 15) return ["1", "0", "2", "3"];
  if (n < 25) return ["1", "0", "2", "3", "5", "4"];
  if (n < 35) return ["1", "0", "2", "3", "5", "7"];
  if (n < 45) return ["2", "5", "7", "4", "8", "0", "3"];
  if (n < 55) return ["7", "8", "9", "A", "B", "5", "2"];
  return ["8", "9", "A", "B", "C", "E", "Y", "7"];
}

function at(rows: string[], x: number, y: number) {
  if (y < 0 || y >= rows.length || x < 0 || x >= (rows[y]?.length ?? 0)) return "#";
  return rows[y][x];
}

function setCell(rows: string[], x: number, y: number, ch: string) {
  if (y < 0 || y >= rows.length) return;
  const row = rows[y];
  if (x < 0 || x >= row.length) return;
  rows[y] = row.slice(0, x) + ch + row.slice(x + 1);
}

function mainFloorY(rows: string[]) {
  let best = 0;
  let fy = Math.max(1, rows.length - 3);
  for (let y = 1; y < rows.length - 1; y++) {
    let n = 0;
    for (const c of rows[y] ?? "") if (FLOOR.includes(c)) n++;
    if (n > best) {
      best = n;
      fy = y;
    }
  }
  return fy;
}

function reservedCols(rows: string[], fy: number) {
  const W = rows[0]?.length ?? 0;
  const skip = new Set<number>();
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < W; x++) {
      if (!RESERVED.includes(at(rows, x, y))) continue;
      for (let d = -4; d <= 4; d++) skip.add(x + d);
    }
  }
  for (let x = 0; x < 8; x++) skip.add(x);
  for (let x = W - 8; x < W; x++) skip.add(x);
  void fy;
  return skip;
}

const FIGHT = ENEMY_GLYPHS + "!knt";
const PORCH_FLOOR = "jw";
const PORCH_HANG = "lzxjdw}";

function combatCols(rows: string[], radius = 3) {
  const W = rows[0]?.length ?? 0;
  const skip = reservedCols(rows, 0);
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < W; x++) {
      if (!FIGHT.includes(at(rows, x, y))) continue;
      for (let d = -radius; d <= radius; d++) skip.add(x + d);
    }
  }
  return skip;
}

/** Restore a short # porch under each digit so packs are fightable. */
export function clearFightPorches(rows: string[]): string[] {
  const W = rows[0]?.length ?? 0;
  const H = rows.length;
  for (let y = 0; y < H; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (!FIGHT.includes(at(rows, x, y))) continue;
      for (let d = -2; d <= 2; d++) {
        const xx = x + d;
        if (xx < 1 || xx >= W - 1) continue;
        const yf = localFloorY(rows, xx);
        const floor = at(rows, xx, yf);
        if (PORCH_FLOOR.includes(floor)) setCell(rows, xx, yf, "#");
        if (d === 0 && floor === "^") setCell(rows, xx, yf, "#");
        const walk = at(rows, xx, yf - 1);
        if (PORCH_HANG.includes(walk) && !FIGHT.includes(walk) && !RESERVED.includes(walk)) {
          setCell(rows, xx, yf - 1, ".");
        }
        if (Math.abs(d) <= 1) {
          const hang = at(rows, xx, yf - 2);
          if (PORCH_HANG.includes(hang)) setCell(rows, xx, yf - 2, ".");
        }
      }
    }
  }
  return rows;
}

function walkable(rows: string[], fy: number, x: number) {
  const yf = localFloorY(rows, x) || fy;
  return at(rows, x, yf - 1) === "." && FLOOR.includes(at(rows, x, yf));
}

const VENT_HOME: ThemeId[] = ["coil", "spire", "abyss"];

function usesInk(opts: { n: number; featured?: string; theme?: ThemeId }) {
  if (opts.featured === "~") return true;
  if (opts.theme === "canal") return true;
  if (opts.theme === "remainder" && opts.n >= 34) return true;
  return false;
}

function sawCap(n: number) {
  if (n < 31) return 0;
  if (n < 35) return 1;
  if (isBoss(n)) return 4;
  if (n >= 46) return 6;
  return 4;
}

function capSaws(rows: string[], max: number) {
  if (max <= 0) {
    for (let y = 0; y < rows.length; y++) {
      for (let x = 0; x < (rows[y]?.length ?? 0); x++) {
        if (rows[y][x] === "S") setCell(rows, x, y, ".");
      }
    }
    return;
  }
  const found: { x: number; y: number }[] = [];
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < (rows[y]?.length ?? 0); x++) {
      if (rows[y][x] === "S") found.push({ x, y });
    }
  }
  while (found.length > max) {
    const last = found.pop();
    if (!last) break;
    setCell(rows, last.x, last.y, ".");
  }
}

function stripGlyph(rows: string[], g: string) {
  const fy = mainFloorY(rows);
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < (rows[y]?.length ?? 0); x++) {
      if (rows[y][x] !== g) continue;
      if (g === "^" || g === "~") {
        if (y === fy) setCell(rows, x, y, "#");
        else if (y === fy + 1) {
          setCell(rows, x, y, "#");
          if (at(rows, x, fy) === ".") setCell(rows, x, fy, "#");
        } else setCell(rows, x, y, ".");
      } else {
        setCell(rows, x, y, ".");
      }
    }
  }
}

/** At most two HP-hazard glyphs until n>45. Featured and unlocked saws win ties. */
function capHazardTypes(rows: string[], n: number, featured?: string) {
  if (n > 45) return;
  const glyphs = ["^", "|", "S", "~"] as const;
  const counts: Record<string, number> = { "^": 0, "|": 0, S: 0, "~": 0 };
  for (const row of rows) {
    for (const ch of row) {
      if (ch in counts) counts[ch] += 1;
    }
  }
  const present = glyphs.filter((g) => counts[g] > 0);
  if (present.length <= 2) return;
  const keep = new Set<string>();
  if (featured && present.includes(featured as (typeof glyphs)[number])) keep.add(featured);
  if (n >= 31 && counts.S > 0) keep.add("S");
  const tooth = counts["~"] > counts["^"] ? "~" : "^";
  if (keep.size < 2) keep.add(tooth);
  if (keep.size < 2 && counts["|"] > 0) keep.add("|");
  const ranked = present.slice().sort((a, b) => counts[b] - counts[a]);
  for (const g of ranked) {
    if (keep.size >= 2) break;
    keep.add(g);
  }
  for (const g of present) {
    if (keep.has(g)) continue;
    stripGlyph(rows, g);
  }
}

export function fillDensity(
  rows: string[],
  opts: { n: number; deco: string; rand: () => number; fy?: number; featured?: string; theme?: ThemeId },
): string[] {
  const baseFy = opts.fy ?? mainFloorY(rows);
  const fyOf = (x: number) => localFloorY(rows, x) || baseFy;
  const fy = baseFy;
  const W = rows[0]?.length ?? 0;
  const H = rows.length;
  const pack = packFor(opts.n);
  const deco = !opts.deco || opts.deco === "_" ? ";" : opts.deco;
  const rand = opts.rand;
  const skip = reservedCols(rows, fy);
  const floors = densityFloors(opts.n, W);
  const ink = usesInk(opts);
  const tooth = ink ? "~" : "^";
  const ventHome = !!opts.theme && VENT_HOME.includes(opts.theme);
  const allowSaw = sawCap(opts.n) > 0 && (opts.n > 45 || (opts.featured !== "|" && opts.featured !== "~"));
  const allowLaser = opts.n >= 15 && (opts.n > 45 || !allowSaw || opts.featured === "|");

  const pick = (list: string[]) => list[Math.floor(rand() * list.length)] ?? list[0];

  const loftAt = (x: number) => {
    const fy = fyOf(x);
    if (x < 6 || x > W - 10) return false;
    if (fy - 3 <= 1) return false;
    for (let i = 0; i < 4; i++) {
      if (at(rows, x + i, fy - 3) !== ".") return false;
      if (skip.has(x + i)) return false;
    }
    for (let i = 0; i < 4; i++) setCell(rows, x + i, fy - 3, i === 1 ? "*" : "=");
    if (at(rows, x + 1, fy - 4) === ".") setCell(rows, x + 1, fy - 4, deco);
    return true;
  };

  const pitAt = (x: number) => {
    const fy = fyOf(x);
    if (x < 10 || x > W - 12) return false;
    if (skip.has(x) || skip.has(x + 1)) return false;
    if (at(rows, x, fy) !== "#" || at(rows, x + 1, fy) !== "#") return false;
    if (RESERVED.includes(at(rows, x, fy - 1)) || RESERVED.includes(at(rows, x + 1, fy - 1))) return false;
    setCell(rows, x, fy, ".");
    setCell(rows, x + 1, fy, ".");
    if (at(rows, x, fy - 1) === ".") setCell(rows, x, fy - 1, ".");
    if (at(rows, x + 1, fy - 1) === ".") setCell(rows, x + 1, fy - 1, ".");
    if (fy + 1 < H - 1) {
      setCell(rows, x, fy + 1, tooth);
      setCell(rows, x + 1, fy + 1, tooth);
    }
    if (ink && at(rows, x, fy - 1) === ".") setCell(rows, x, fy - 1, "T");
    return true;
  };

  const inkTrenchAt = (x: number) => {
    const fy = fyOf(x);
    if (x < 10 || x > W - 14) return false;
    if (skip.has(x) || skip.has(x + 1) || skip.has(x + 2)) return false;
    if (at(rows, x, fy) !== "#" || at(rows, x + 1, fy) !== "#" || at(rows, x + 2, fy) !== "#") return false;
    if (RESERVED.includes(at(rows, x + 1, fy - 1))) return false;
    setCell(rows, x, fy, ".");
    setCell(rows, x + 1, fy, ".");
    setCell(rows, x + 2, fy, ".");
    if (at(rows, x + 1, fy - 1) === ".") setCell(rows, x + 1, fy - 1, "T");
    if (fy + 1 < H - 1) {
      setCell(rows, x, fy + 1, "~");
      setCell(rows, x + 1, fy + 1, "~");
      setCell(rows, x + 2, fy + 1, "~");
    }
    return true;
  };

  /** 2-tile floor teeth. Survives ensurePortalAccess (width 2). Walk-on fy-1 spikes do not. */
  const hopAt = (x: number) => {
    const fy = fyOf(x);
    if (ink) return false;
    if (x < 10 || x > W - 12) return false;
    if (skip.has(x) || skip.has(x + 1)) return false;
    if (at(rows, x, fy) !== "#" || at(rows, x + 1, fy) !== "#") return false;
    if (RESERVED.includes(at(rows, x, fy - 1)) || RESERVED.includes(at(rows, x + 1, fy - 1))) return false;
    setCell(rows, x, fy, "^");
    setCell(rows, x + 1, fy, "^");
    skip.add(x);
    skip.add(x + 1);
    return true;
  };

  for (let x = 6; x < W - 6; x += 5) {
    const ox = x + Math.floor(rand() * 2);
    const fy = fyOf(ox);
    if (skip.has(ox)) continue;
    if (at(rows, ox, fy - 2) !== ".") continue;
    if (!FLOOR.includes(at(rows, ox, fy - 1)) && at(rows, ox, fy - 1) !== ".") continue;
    if (at(rows, ox, fy - 1) !== "." && at(rows, ox, fy - 1) !== deco) continue;
    if (at(rows, ox, fy) === "#" || at(rows, ox, fy) === "=" || at(rows, ox, fy) === "_") {
      setCell(rows, ox, fy - 2, deco);
    }
  }

  for (let x = 10; x < W - 12; x += 11) {
    loftAt(x + Math.floor(rand() * 3));
  }

  for (let x = 12; x < W - 14; x += 12) {
    pitAt(x + Math.floor(rand() * 3));
  }

  if (ink) {
    for (let x = 20; x < W - 16; x += 28) {
      if (inkTrenchAt(x)) break;
    }
  }

  if (!ink) {
    for (let x = 16; x < W - 14; x += 28) {
      hopAt(x + Math.floor(rand() * 2));
    }
  }

  const bounceAt = (x: number) => {
    const fy = fyOf(x);
    if (x < 10 || x > W - 12) return false;
    if (skip.has(x) || skip.has(x + 1)) return false;
    if (at(rows, x, fy) !== "#" || at(rows, x + 1, fy) !== "#") return false;
    if (RESERVED.includes(at(rows, x, fy - 1)) || RESERVED.includes(at(rows, x + 1, fy - 1))) return false;
    setCell(rows, x, fy, ".");
    setCell(rows, x + 1, fy, ".");
    if (at(rows, x, fy - 1) === ".") setCell(rows, x, fy - 1, "T");
    if (fy + 1 < H - 1) {
      setCell(rows, x, fy + 1, tooth);
      setCell(rows, x + 1, fy + 1, tooth);
    }
    return true;
  };

  for (let x = 18; x < W - 14; x += 22) {
    const ox = x + Math.floor(rand() * 2);
    const fy = fyOf(ox);
    if (skip.has(ox)) continue;
    if (at(rows, ox, fy) !== "#" || at(rows, ox + 1, fy) !== "#" || at(rows, ox + 2, fy) !== "#") continue;
    setCell(rows, ox, fy, "-");
    setCell(rows, ox + 1, fy, "-");
    setCell(rows, ox + 2, fy, "-");
  }

  for (let x = 16; x < W - 12; x += 32) {
    bounceAt(x + Math.floor(rand() * 2));
  }

  if (opts.n >= 15) {
    let beltFlip = 0;
    for (let x = 20; x < W - 14; x += 24) {
      const ox = x;
      const fy = fyOf(ox);
      if (skip.has(ox)) continue;
      if (at(rows, ox, fy) !== "#" || at(rows, ox + 1, fy) !== "#") continue;
      const left = opts.n >= 18 && opts.theme !== "canal" && opts.theme !== "glacier" && beltFlip % 2 === 1;
      const ch = left ? "\\" : "/";
      setCell(rows, ox, fy, ch);
      setCell(rows, ox + 1, fy, ch);
      if (at(rows, ox + 2, fy) === "#") setCell(rows, ox + 2, fy, ch);
      beltFlip += 1;
    }
  }

  if (opts.n >= 18 && opts.theme !== "canal" && opts.theme !== "glacier") {
    for (let x = 28; x < W - 18; x += 40) {
      const fy = fyOf(x);
      if (skip.has(x) || skip.has(x + 6)) continue;
      if (at(rows, x, fy) !== "#" || at(rows, x + 1, fy) !== "#") continue;
      if (at(rows, x + 5, fy) !== "#" || at(rows, x + 6, fy) !== "#") continue;
      setCell(rows, x, fy, "/");
      setCell(rows, x + 1, fy, "/");
      setCell(rows, x + 2, fy, ".");
      setCell(rows, x + 3, fy, ".");
      if (fy + 1 < H - 1) {
        setCell(rows, x + 2, fy + 1, tooth);
        setCell(rows, x + 3, fy + 1, tooth);
      }
      if (at(rows, x + 2, fy - 1) === ".") setCell(rows, x + 2, fy - 1, "T");
      setCell(rows, x + 5, fy, "\\");
      setCell(rows, x + 6, fy, "\\");
      break;
    }
  }

  if (opts.n >= 25) {
    for (let x = 16; x < W - 12; x += 28) {
      const fy = fyOf(x);
      if (skip.has(x)) continue;
      if (at(rows, x, fy) !== "#" || at(rows, x - 1, fy) !== "#" || at(rows, x + 1, fy) !== "#") continue;
      plantAt(rows, x, "g");
    }
  }

  if (allowSaw) {
    const step = opts.n < 35 ? 80 : 22;
    let placed = 0;
    const maxGlimpse = sawCap(opts.n);
    for (let x = 18; x < W - 10; x += step) {
      if (placed >= maxGlimpse) break;
      const ox = x + Math.floor(rand() * 2);
      const fy = fyOf(ox);
      if (skip.has(ox)) continue;
      if (at(rows, ox, fy - 2) !== ".") continue;
      if (!walkable(rows, fy, ox) && at(rows, ox, fy - 1) !== ".") continue;
      if (plantAt(rows, ox, "S")) placed += 1;
      else continue;
      if (opts.n < 35) break;
    }
  }

  if (allowLaser) {
    for (let x = 16; x < W - 10; x += 14) {
      const ox = x;
      if (skip.has(ox)) continue;
      plantAt(rows, ox, "|");
    }
  }

  const fanWellAt = (x: number) => {
    const fy = fyOf(x);
    if (x < 10 || x > W - 14) return false;
    if (skip.has(x) || skip.has(x + 1) || skip.has(x + 2)) return false;
    if (at(rows, x, fy) !== "#" || at(rows, x + 1, fy) !== "#") return false;
    if (RESERVED.includes(at(rows, x, fy - 1)) || RESERVED.includes(at(rows, x + 1, fy - 1))) return false;
    setCell(rows, x, fy, ".");
    setCell(rows, x + 1, fy, ".");
    if (at(rows, x, fy - 1) === ".") setCell(rows, x, fy - 1, ":");
    loftAt(x + 3);
    return true;
  };

  if (opts.n >= 15) {
    for (let x = 14; x < W - 14; x += 28) {
      fanWellAt(x + Math.floor(rand() * 2));
    }
  }

  const ventShaftAt = (x: number) => {
    const fy = fyOf(x);
    if (!ventHome || opts.n < 16) return false;
    if (x < 12 || x > W - 14) return false;
    if (skip.has(x) || skip.has(x + 1) || skip.has(x - 1)) return false;
    if (at(rows, x, fy) !== "#") return false;
    if (RESERVED.includes(at(rows, x, fy - 1))) return false;
    if (at(rows, x, fy - 1) !== ".") return false;
    if (at(rows, x, fy - 2) !== ".") return false;
    if (at(rows, x, fy - 3) !== ".") return false;
    setCell(rows, x, fy - 1, "v");
    setCell(rows, x, fy - 2, "v");
    setCell(rows, x, fy - 3, "v");
    if (at(rows, x + 2, fy - 2) === ".") {
      for (let i = 0; i < 3; i++) {
        if (at(rows, x + 2 + i, fy - 2) === "." && !skip.has(x + 2 + i)) setCell(rows, x + 2 + i, fy - 2, "=");
      }
    }
    skip.add(x);
    skip.add(x - 1);
    skip.add(x + 1);
    return true;
  };

  if (ventHome && opts.n >= 16) {
    for (let x = 20; x < W - 16; x += 28) {
      if (ventShaftAt(x + Math.floor(rand() * 2))) break;
    }
  }

  const fight = combatCols(rows);
  if (opts.n >= 16) {
    for (let x = 14; x < W - 12; x += 36) {
      const ox = x + Math.floor(rand() * 2);
      if (skip.has(ox) || fight.has(ox)) continue;
      plantAt(rows, ox, rand() < 0.5 ? "l" : "z");
    }
    for (let x = 18; x < W - 12; x += 40) {
      if (skip.has(x) || fight.has(x)) continue;
      plantAt(rows, x, "x");
    }
    for (let x = 16; x < W - 14; x += 48) {
      const ox = x;
      if (skip.has(ox) || skip.has(ox + 1) || fight.has(ox)) continue;
      plantAt(rows, ox, "j");
    }
  }

  if (opts.n >= 25) {
    for (let x = 20; x < W - 14; x += 32) {
      if (skip.has(x) || fight.has(x)) continue;
      plantAt(rows, x, "[");
    }
  }

  const placeEnemy = (x: number, y: number) => {
    if (skip.has(x)) return false;
    if (at(rows, x, y) !== ".") return false;
    const below = at(rows, x, y + 1);
    if (!FLOOR.includes(below) && below !== "=" && below !== "_") return false;
    setCell(rows, x, y, pick(pack));
    skip.add(x);
    skip.add(x - 1);
    skip.add(x + 1);
    return true;
  };

  const floorStep = opts.n < 15 ? 10 : opts.n < 25 ? 8 : 6;
  const loftStep = opts.n < 15 ? 14 : opts.n < 25 ? 12 : 9;
  for (let x = 8; x < W - 8; x += floorStep) {
    const ox = x + Math.floor(rand() * 2);
    placeEnemy(ox, fyOf(ox) - 1);
  }
  for (let x = 10; x < W - 8; x += loftStep) {
    const fy = fyOf(x);
    if (fy - 4 <= 1) break;
    placeEnemy(x, fy - 4);
  }

  const placePickup = (ch: string) => {
    for (let x = 8; x < W - 8; x++) {
      if (skip.has(x)) continue;
      const fy = fyOf(x);
      if (at(rows, x, fy - 1) !== ".") continue;
      if (!FLOOR.includes(at(rows, x, fy)) && at(rows, x, fy) !== "=" && at(rows, x, fy) !== "_") continue;
      setCell(rows, x, fy - 1, ch);
      skip.add(x);
      return true;
    }
    return false;
  };

  const bumpUntil = () => {
    for (let k = 0; k < 80; k++) {
      const d = tally(rows);
      if (d.deco < floors.deco) {
        const x = 6 + Math.floor(rand() * Math.max(1, W - 12));
        const fy = fyOf(x);
        if (at(rows, x, fy - 2) === ".") setCell(rows, x, fy - 2, deco);
      }
      if (d.shelves < floors.shelves) {
        const x = 8 + Math.floor(rand() * Math.max(1, W - 20));
        const fy = fyOf(x);
        if (!loftAt(x)) {
          let ok = true;
          for (let i = 0; i < 4; i++) {
            if (at(rows, x + i, fy - 2) !== "." || skip.has(x + i)) ok = false;
          }
          if (ok) for (let i = 0; i < 4; i++) setCell(rows, x + i, fy - 2, "=");
        }
      }
      if (d.hazards < floors.hazards) {
        const x = 12 + Math.floor(rand() * Math.max(1, W - 24));
        if (ink && rand() < 0.45) inkTrenchAt(x);
        else if (!ink && rand() < 0.35) hopAt(x);
        else pitAt(x);
      }
      if (d.enemies < floors.enemies) {
        const x = 8 + Math.floor(rand() * Math.max(1, W - 16));
        const fy = fyOf(x);
        const y = rand() < 0.3 && fy - 4 > 1 ? fy - 4 : fy - 1;
        placeEnemy(x, y);
      }
      if (d.movers < floors.movers) {
        const x = 10 + Math.floor(rand() * Math.max(1, W - 16));
        const fy = fyOf(x);
        if (opts.n >= 15 && fanWellAt(x)) {
          /* well */
        } else if (opts.n >= 25 && at(rows, x, fy) === "#" && at(rows, x - 1, fy) === "#" && at(rows, x + 1, fy) === "#") {
          setCell(rows, x, fy, "g");
        } else if (opts.n >= 18 && at(rows, x, fy) === "#") {
          setCell(rows, x, fy, rand() < 0.45 ? "\\" : "/");
        } else if (opts.n >= 15 && at(rows, x, fy) === "#") {
          setCell(rows, x, fy, "/");
        } else if (at(rows, x, fy) === "#") {
          setCell(rows, x, fy, "-");
        } else {
          bounceAt(x);
        }
      }
      if (d.pickups < floors.pickups) {
        if (!placePickup(rand() < 0.35 ? "h" : rand() < 0.2 ? "o" : "i")) {
          const x = 10 + Math.floor(rand() * Math.max(1, W - 20));
          const fy = fyOf(x);
          if (at(rows, x, fy - 1) === ".") setCell(rows, x, fy - 1, "i");
        }
      }
      const now = tally(rows);
      if (
        now.enemies >= floors.enemies &&
        now.hazards >= floors.hazards &&
        now.movers >= floors.movers &&
        now.deco >= floors.deco &&
        now.shelves >= floors.shelves &&
        now.pickups >= floors.pickups
      ) {
        break;
      }
    }
  };

  bumpUntil();
  {
    const needP = floors.pickups;
    for (let x = 4; x < W - 4 && tally(rows).pickups < needP; x++) {
      const fy = fyOf(x);
      if (RESERVED.includes(at(rows, x, fy - 1))) continue;
      if (at(rows, x, fy - 1) === "." || at(rows, x, fy - 2) === ".") {
        const y = at(rows, x, fy - 1) === "." ? fy - 1 : fy - 2;
        setCell(rows, x, y, "i");
      }
    }
  }
  capSaws(rows, allowSaw ? sawCap(opts.n) : 0);
  capHazardTypes(rows, opts.n, opts.featured);
  while (tally(rows).pickups < floors.pickups) {
    let placed = false;
    for (let y = 1; y < H - 2 && !placed; y++) {
      for (let x = 4; x < W - 4; x++) {
        const ch = at(rows, x, y);
        if (ch !== "." && ch !== "'" && ch !== ";" && ch !== "?") continue;
        if (RESERVED.includes(at(rows, x, y))) continue;
        setCell(rows, x, y, "i");
        placed = true;
        break;
      }
    }
    if (!placed) break;
  }
  while (tally(rows).pickups < floors.pickups) {
    let placed = false;
    for (let y = 2; y < H - 2 && !placed; y++) {
      for (let x = 4; x < W - 4; x++) {
        if (at(rows, x, y) !== "=" && at(rows, x, y) !== "#") continue;
        if (at(rows, x, y - 1) !== ".") continue;
        setCell(rows, x, y - 1, "i");
        placed = true;
        break;
      }
    }
    if (!placed) break;
  }
  const need = densityFloors(opts.n, W).shelves;
  let shelves = tally(rows).shelves;
  for (let x = 6; x < W - 6; x++) {
    if (shelves >= need) break;
    const fy = fyOf(x);
    for (const y of [fy - 3, fy - 2, fy - 4, fy - 5, fy - 6]) {
      if (shelves >= need) break;
      if (y <= 1 || y >= fy) continue;
      if (at(rows, x, y) !== ".") continue;
      setCell(rows, x, y, "=");
      shelves += 1;
    }
  }
  if (shelves < need) {
    for (let y = 1; y < H - 2 && shelves < need; y++) {
      for (let x = 2; x < W - 2 && shelves < need; x++) {
        const ch = at(rows, x, y);
        if (ch === "." || ch === "'" || ch === ";" || ch === '"' || ch === "," || ch === "?" || ch === "#") {
          if (y >= localFloorY(rows, x) - 1) continue;
          setCell(rows, x, y, "=");
          shelves += 1;
        }
      }
    }
  }
  ensureCounts(rows, opts.n);
  houseAfter(rows);
  clearFightPorches(rows);
  return rows;
}

/** Last-chance stamps so a dressed landform still meets density floors. */
export function ensureCounts(rows: string[], n: number) {
  const W = rows[0]?.length ?? 0;
  const H = rows.length;
  const f = densityFloors(n, W);
  const stamp = (need: number, set: string, ch: string) => {
    const count = () => tally(rows)[set === SHELF_GLYPHS ? "shelves" : set === PICKUP_GLYPHS ? "pickups" : "hazards"];
    const kind = set === SHELF_GLYPHS ? "shelves" : set === PICKUP_GLYPHS ? "pickups" : "hazards";
    void count;
    while (tally(rows)[kind] < need) {
      let placed = false;
      for (let y = 1; y < H - 2 && !placed; y++) {
        for (let x = 2; x < W - 2; x++) {
          const here = at(rows, x, y);
          if (here === ".") {
            setCell(rows, x, y, ch);
            placed = true;
            break;
          }
        }
      }
      if (placed) continue;
      for (let y = 1; y < H - 2 && !placed; y++) {
        for (let x = 2; x < W - 2; x++) {
          const here = at(rows, x, y);
          if ("';\",?".includes(here)) {
            setCell(rows, x, y, ch);
            placed = true;
            break;
          }
        }
      }
      if (placed) continue;
      for (let y = 1; y < H - 3 && !placed; y++) {
        for (let x = 2; x < W - 2; x++) {
          if (at(rows, x, y) !== "#") continue;
          if (y >= localFloorY(rows, x) - 1) continue;
          setCell(rows, x, y, ch);
          placed = true;
          break;
        }
      }
      if (!placed) break;
    }
  };
  stamp(f.shelves, SHELF_GLYPHS, "=");
  stamp(f.pickups, PICKUP_GLYPHS, "i");
  ensureMovers(rows, n);
}

function hazardKit(n: number): string[] {
  if (n < 15) return ["^", "|"];
  if (n < 31) return ["^", "|"];
  return ["^", "|", "S"];
}

/** Plant legal hazards after Housing strips illegal teeth and bounce. */
export function ensureHazards(rows: string[], n: number) {
  if (n < 16) return;
  const W = rows[0]?.length ?? 0;
  const need = densityFloors(n, W).hazards;
  const kit = hazardKit(n);
  let i = 0;
  for (let x = 4; x < W - 4 && tally(rows).hazards < need; x += 1) {
    plantAt(rows, x, kit[i % kit.length]);
    i += 1;
  }
}

function moverKit(n: number): string[] {
  if (n <= 1) return ["T", "-"];
  if (n < 9) return ["T", "-"];
  if (n < 12) return ["T", "-", "/"];
  if (n < 16) return ["T", "-", "/", "`", ")", "g"];
  if (n < 25) return ["T", "-", "/", "`", ")"];
  return ["T", "-", "/", "`", ")", "g", "{"];
}

/** Plant legal movers after bounce-halls are stripped. Uses plantAt seats. */
export function ensureMovers(rows: string[], n: number) {
  const W = rows[0]?.length ?? 0;
  const need = densityFloors(n, W).movers;
  const kit = moverKit(n);
  let i = 0;
  for (let x = 6; x < W - 6 && tally(rows).movers < need; x += 3) {
    plantAt(rows, x, kit[i % kit.length]);
    i += 1;
  }
  for (let x = 4; x < W - 4 && tally(rows).movers < need; x++) {
    if (plantAt(rows, x, "T")) continue;
    plantAt(rows, x, "-");
  }
}

/** Clone Easy rows and stamp extra digits for Hard/Extreme. Does not add hazards. */
export function padEnemies(rows: string[], n: number, difficulty: Difficulty): string[] {
  const out = rows.map((r) => r);
  if (difficulty === "easy" || n < 1) return out;
  const fy = mainFloorY(out);
  const W = out[0]?.length ?? 0;
  const skip = reservedCols(out, fy);
  const pack = packFor(n);
  const need = Math.ceil(densityFloors(n, W).enemies * enemyMul(difficulty));
  const rand = rng(n * 9973 + (difficulty === "extreme" ? 93 : 91));
  const pick = (list: string[]) => list[Math.floor(rand() * list.length)] ?? list[0];
  const place = (x: number, y: number) => {
    if (skip.has(x)) return false;
    if (at(out, x, y) !== ".") return false;
    const below = at(out, x, y + 1);
    if (!FLOOR.includes(below) && below !== "=" && below !== "_") return false;
    setCell(out, x, y, pick(pack));
    skip.add(x);
    skip.add(x - 1);
    skip.add(x + 1);
    return true;
  };
  for (let k = 0; k < 160; k++) {
    if (tally(out).enemies >= need) break;
    const x = 8 + Math.floor(rand() * Math.max(1, W - 16));
    const yf = localFloorY(out, x) || fy;
    const y = rand() < 0.3 && yf - 4 > 1 ? yf - 4 : yf - 1;
    place(x, y);
  }
  return out;
}

const KEEP_DRESS = "@%P!lzxfjdw}{[kntOIF1023456789ABCEYGHKQUNJLM";

function busyCol(rows: string[], fy: number, x: number) {
  for (let dx = -2; dx <= 2; dx++) {
    if (KEEP_DRESS.includes(at(rows, x + dx, fy - 1))) return true;
  }
  return false;
}

function loftStreet(rows: string[], fy: number, x: number, deco: string) {
  if (fy - 3 <= 1) return false;
  for (let i = 0; i < 4; i++) {
    if (at(rows, x + i, fy - 3) !== ".") return false;
  }
  for (let i = 0; i < 4; i++) setCell(rows, x + i, fy - 3, "=");
  if (deco && deco !== "_" && at(rows, x + 1, fy - 4) === ".") setCell(rows, x + 1, fy - 4, deco);
  return true;
}

function hopTeeth(rows: string[], fy: number, x: number) {
  const yf = localFloorY(rows, x) || fy;
  if (at(rows, x, yf) !== "#" || at(rows, x + 1, yf) !== "#") return false;
  if (at(rows, x, yf - 1) !== "." || at(rows, x + 1, yf - 1) !== ".") return false;
  if (FIGHT.includes(at(rows, x, yf - 1)) || FIGHT.includes(at(rows, x + 1, yf - 1))) return false;
  if (yf + 2 >= rows.length - 1) return false;
  setCell(rows, x, yf, ".");
  setCell(rows, x + 1, yf, ".");
  setCell(rows, x, yf + 1, "^");
  setCell(rows, x + 1, yf + 1, "^");
  setCell(rows, x, yf + 2, "#");
  setCell(rows, x + 1, yf + 2, "#");
  return true;
}

function hangKit(rows: string[], fy: number, x: number, n: number) {
  const yf = localFloorY(rows, x) || fy;
  if (FIGHT.includes(at(rows, x, yf - 1))) return false;
  let ch = "|";
  if (n === 2) ch = "z";
  else if (n === 4) ch = "x";
  else if (n === 5) ch = "}";
  else if (n < 25) ch = n % 2 ? "l" : "z";
  else if (n < 35) ch = n % 2 ? "x" : "l";
  else ch = n % 2 ? "l" : "x";
  return plantAt(rows, x, ch);
}

function crumbleRun(rows: string[], fy: number, x: number) {
  for (let i = 0; i < 4; i++) {
    if (at(rows, x + i, fy) !== "#" || at(rows, x + i, fy - 1) !== ".") return false;
  }
  for (let i = 0; i < 4; i++) setCell(rows, x + i, fy, "-");
  return true;
}

/** Seeded extra loft/deco/hops around an authored spine. Never mutates `@ % P`. Exchange is skipped. */
export function dressTerrain(
  rows: string[],
  opts: { n: number; deco: string; rand: () => number; fy?: number },
): string[] {
  const out = rows.map((r) => r);
  const n = opts.n;
  if (n < 2) return out;
  const baseFy = opts.fy ?? mainFloorY(out);
  const W = out[0]?.length ?? 0;
  const skip = reservedCols(out, baseFy);
  const deco = !opts.deco || opts.deco === "_" ? ";" : opts.deco;
  const rand = opts.rand;
  const loftN = n < 6 ? 1 : n < 16 ? 2 : 1;
  const hopN = n < 6 ? 0 : Math.max(1, Math.floor(W / (n < 16 ? 36 : 42)));
  const fight = combatCols(out);
  let lofts = 0;
  for (let x = 10; x < W - 14 && lofts < loftN; x += 9) {
    const ox = x + Math.floor(rand() * 3);
    const fy = localFloorY(out, ox) || baseFy;
    if (skip.has(ox) || busyCol(out, fy, ox)) continue;
    if (loftStreet(out, fy, ox, deco)) lofts += 1;
  }
  let hops = 0;
  for (let x = 12; x < W - 12 && hops < hopN; x += 18) {
    const ox = x + Math.floor(rand() * 2);
    const fy = localFloorY(out, ox) || baseFy;
    if (skip.has(ox) || skip.has(ox + 1) || busyCol(out, fy, ox) || fight.has(ox)) continue;
    if (hangKit(out, fy, ox, n) || hopTeeth(out, fy, ox)) hops += 1;
  }
  for (let x = 8; x < W - 8; x += 7) {
    const fy = localFloorY(out, x) || baseFy;
    if (skip.has(x) || busyCol(out, fy, x)) continue;
    if (at(out, x, fy - 2) === ".") setCell(out, x, fy - 2, deco);
  }
  houseAfter(out);
  return out;
}

/** Hard/Extreme extra streets and teeth on a clone. Easy is a no-op. */
export function padTerrain(rows: string[], n: number, difficulty: Difficulty): string[] {
  const out = rows.map((r) => r);
  if (difficulty === "easy" || n < 2) return out;
  const baseFy = mainFloorY(out);
  const W = out[0]?.length ?? 0;
  const skip = reservedCols(out, baseFy);
  const rand = rng(n * 9973 + (difficulty === "extreme" ? 77 : 71));
  const loftNeed = Math.max(1, Math.floor(W / 24));
  const hopNeed = Math.max(1, Math.floor(W / 28));
  let lofts = 0;
  for (let k = 0; k < 80 && lofts < loftNeed; k++) {
    const x = 10 + Math.floor(rand() * Math.max(1, W - 20));
    const fy = localFloorY(out, x) || baseFy;
    if (skip.has(x) || busyCol(out, fy, x)) continue;
    if (loftStreet(out, fy, x, "")) lofts += 1;
  }
  let hops = 0;
  for (let k = 0; k < 80 && hops < hopNeed; k++) {
    const x = 12 + Math.floor(rand() * Math.max(1, W - 18));
    const fy = localFloorY(out, x) || baseFy;
    if (skip.has(x) || skip.has(x + 1) || busyCol(out, fy, x)) continue;
    if (hangKit(out, fy, x, n) || hopTeeth(out, fy, x)) hops += 1;
  }
  if (difficulty === "extreme") {
    for (let x = 8; x < W - 8; x += 10) {
      const fy = localFloorY(out, x) || baseFy;
      const y2 = fy - 5;
      if (skip.has(x) || busyCol(out, fy, x)) continue;
      if (y2 > 1 && at(out, x, y2) === "." && at(out, x + 1, y2) === ".") {
        setCell(out, x, y2, "=");
        setCell(out, x + 1, y2, "=");
      }
    }
    for (let x = 16; x < W - 16; x += 32) {
      const fy = localFloorY(out, x) || baseFy;
      if (skip.has(x) || busyCol(out, fy, x)) continue;
      crumbleRun(out, fy, x);
    }
  }
  houseAfter(out);
  return out;
}

