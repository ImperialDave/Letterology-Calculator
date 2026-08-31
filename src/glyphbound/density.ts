/** Remainder density floors. Glyphbound Doctrine: .grok/skills/glyphbound-ledgers/SKILL.md */
import { enemyMul } from "./difficulty";
import { isBoss, rng } from "./recipe";
import type { Difficulty, ThemeId } from "./types";

const FLOOR = "#*=_T/\\&-`)g";
const RESERVED = "@%P!";

export const ENEMY_GLYPHS = "1023456789ABCEYGHKQUNJLM";
export const HAZARD_GLYPHS = "^|S~";
export const MOVER_GLYPHS = "/\\T:`)g-";
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

function walkable(rows: string[], fy: number, x: number) {
  return at(rows, x, fy - 1) === "." && FLOOR.includes(at(rows, x, fy));
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
  const fy = opts.fy ?? mainFloorY(rows);
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
    for (let x = 16; x < W - 14; x += 18) {
      hopAt(x + Math.floor(rand() * 2));
    }
  }

  const bounceAt = (x: number) => {
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
    if (skip.has(ox)) continue;
    if (at(rows, ox, fy) !== "#" || at(rows, ox + 1, fy) !== "#" || at(rows, ox + 2, fy) !== "#") continue;
    setCell(rows, ox, fy, "-");
    setCell(rows, ox + 1, fy, "-");
    setCell(rows, ox + 2, fy, "-");
  }

  for (let x = 16; x < W - 12; x += 20) {
    bounceAt(x + Math.floor(rand() * 2));
  }

  if (opts.n >= 15) {
    let beltFlip = 0;
    for (let x = 20; x < W - 14; x += 24) {
      const ox = x;
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
      if (skip.has(x)) continue;
      if (at(rows, x, fy) !== "#" || at(rows, x - 1, fy) !== "#" || at(rows, x + 1, fy) !== "#") continue;
      setCell(rows, x, fy, "g");
    }
  }

  if (allowSaw) {
    const step = opts.n < 35 ? 80 : 22;
    let placed = 0;
    const maxGlimpse = sawCap(opts.n);
    for (let x = 18; x < W - 10; x += step) {
      if (placed >= maxGlimpse) break;
      const ox = x + Math.floor(rand() * 2);
      if (skip.has(ox)) continue;
      if (at(rows, ox, fy - 2) !== ".") continue;
      if (!walkable(rows, fy, ox) && at(rows, ox, fy - 1) !== ".") continue;
      setCell(rows, ox, fy - 2, "S");
      placed += 1;
      if (opts.n < 35) break;
    }
  }

  if (allowLaser) {
    for (let x = 16; x < W - 10; x += 14) {
      const ox = x;
      if (skip.has(ox)) continue;
      if (at(rows, ox, fy - 3) !== "." || at(rows, ox, fy - 4) !== ".") continue;
      setCell(rows, ox, fy - 3, "|");
      setCell(rows, ox, fy - 4, "|");
    }
  }

  const fanWellAt = (x: number) => {
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
    placeEnemy(ox, fy - 1);
  }
  for (let x = 10; x < W - 8; x += loftStep) {
    if (fy - 4 <= 1) break;
    placeEnemy(x, fy - 4);
  }

  const placePickup = (ch: string) => {
    for (let x = 8; x < W - 8; x++) {
      if (skip.has(x)) continue;
      if (!walkable(rows, fy, x)) continue;
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
        if (at(rows, x, fy - 2) === ".") setCell(rows, x, fy - 2, deco);
      }
      if (d.shelves < floors.shelves) {
        const x = 8 + Math.floor(rand() * Math.max(1, W - 20));
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
        const y = rand() < 0.3 && fy - 4 > 1 ? fy - 4 : fy - 1;
        placeEnemy(x, y);
      }
      if (d.movers < floors.movers) {
        const x = 10 + Math.floor(rand() * Math.max(1, W - 16));
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
      if (d.pickups < floors.pickups) placePickup(rand() < 0.35 ? "h" : rand() < 0.2 ? "o" : "i");
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
  capSaws(rows, allowSaw ? sawCap(opts.n) : 0);
  capHazardTypes(rows, opts.n, opts.featured);
  const need = densityFloors(opts.n, W).shelves;
  let shelves = tally(rows).shelves;
  const loftYs = [fy - 3, fy - 2, fy - 5].filter((y) => y > 1 && y < fy);
  for (const y of loftYs) {
    if (shelves >= need) break;
    for (let x = 6; x < W - 6; x++) {
      if (shelves >= need) break;
      if (at(rows, x, y) !== ".") continue;
      if (RESERVED.includes(at(rows, x, y + 1))) continue;
      setCell(rows, x, y, "=");
      shelves += 1;
    }
  }
  return rows;
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
    const y = rand() < 0.3 && fy - 4 > 1 ? fy - 4 : fy - 1;
    place(x, y);
  }
  return out;
}
