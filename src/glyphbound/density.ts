/** Remainder density floors. Glyphbound Doctrine: .grok/skills/glyphbound-ledgers/SKILL.md */
import { isBoss } from "./recipe";

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
  return {
    enemies: isBoss(n) ? Math.max(5, Math.floor(w / 18)) : Math.max(10, Math.floor(w / 10)),
    hazards: Math.max(8, Math.floor(w / 12)),
    movers: Math.max(8, Math.floor(w / 12)),
    deco: Math.max(12, Math.floor(w / 8)),
    shelves: Math.max(32, Math.floor(w / 3)),
    pickups: Math.max(4, Math.floor(w / 24)),
  };
}

export function packFor(n: number): string[] {
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

export function fillDensity(
  rows: string[],
  opts: { n: number; deco: string; rand: () => number; fy?: number; featured?: string },
): string[] {
  const fy = opts.fy ?? mainFloorY(rows);
  const W = rows[0]?.length ?? 0;
  const H = rows.length;
  const pack = packFor(opts.n);
  const deco = !opts.deco || opts.deco === "_" ? ";" : opts.deco;
  const rand = opts.rand;
  const skip = reservedCols(rows, fy);
  const floors = densityFloors(opts.n, W);

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
      setCell(rows, x, fy + 1, "^");
      setCell(rows, x + 1, fy + 1, "^");
    }
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

  for (let x = 14; x < W - 14; x += 16) {
    pitAt(x + Math.floor(rand() * 3));
  }

  for (let x = 18; x < W - 14; x += 22) {
    const ox = x + Math.floor(rand() * 2);
    if (skip.has(ox)) continue;
    if (at(rows, ox, fy) !== "#" || at(rows, ox + 1, fy) !== "#" || at(rows, ox + 2, fy) !== "#") continue;
    setCell(rows, ox, fy, "-");
    setCell(rows, ox + 1, fy, "-");
    setCell(rows, ox + 2, fy, "-");
  }

  for (let x = 20; x < W - 14; x += 24) {
    const ox = x;
    if (skip.has(ox)) continue;
    if (at(rows, ox, fy) !== "#" || at(rows, ox + 1, fy) !== "#") continue;
    setCell(rows, ox, fy, "/");
    setCell(rows, ox + 1, fy, "/");
    if (at(rows, ox + 2, fy) === "#") setCell(rows, ox + 2, fy, "/");
  }

  if (opts.n >= 25) {
    for (let x = 16; x < W - 12; x += 28) {
      if (skip.has(x)) continue;
      if (at(rows, x, fy) !== "#" || at(rows, x - 1, fy) !== "#" || at(rows, x + 1, fy) !== "#") continue;
      setCell(rows, x, fy, "g");
    }
  }

  if (opts.n >= 35) {
    for (let x = 18; x < W - 10; x += 20) {
      const ox = x + Math.floor(rand() * 2);
      if (skip.has(ox)) continue;
      if (at(rows, ox, fy - 2) !== ".") continue;
      if (!walkable(rows, fy, ox) && at(rows, ox, fy - 1) !== ".") continue;
      setCell(rows, ox, fy - 2, "S");
    }
  }

  if (opts.n >= 15) {
    for (let x = 22; x < W - 10; x += 18) {
      const ox = x;
      if (skip.has(ox)) continue;
      if (at(rows, ox, fy - 3) !== "." || at(rows, ox, fy - 4) !== ".") continue;
      setCell(rows, ox, fy - 3, "|");
      setCell(rows, ox, fy - 4, "|");
    }
  }

  for (let x = 12; x < W - 10; x += 17) {
    if (at(rows, x, fy - 2) !== ".") continue;
    if (skip.has(x)) continue;
    setCell(rows, x, fy - 2, ":");
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

  for (let x = 8; x < W - 8; x += 6) {
    const ox = x + Math.floor(rand() * 2);
    placeEnemy(ox, fy - 1);
  }
  for (let x = 10; x < W - 8; x += 9) {
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
      if (d.hazards < floors.hazards) pitAt(12 + Math.floor(rand() * Math.max(1, W - 24)));
      if (d.enemies < floors.enemies) {
        const x = 8 + Math.floor(rand() * Math.max(1, W - 16));
        const y = rand() < 0.3 && fy - 4 > 1 ? fy - 4 : fy - 1;
        placeEnemy(x, y);
      }
      if (d.movers < floors.movers && opts.n >= 25) {
        const x = 10 + Math.floor(rand() * Math.max(1, W - 16));
        if (at(rows, x, fy) === "#" && at(rows, x - 1, fy) === "#" && at(rows, x + 1, fy) === "#") {
          setCell(rows, x, fy, "g");
        } else if (at(rows, x, fy) === "#") {
          setCell(rows, x, fy, "-");
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
