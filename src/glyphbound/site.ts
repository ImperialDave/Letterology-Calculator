/** Where each obstacle sits relative to local floor and neighbors.
 *  Collision is ASCII. These seats follow parse-map AABBs and toy poses. */
import { localFloorY } from "./levels-story";

const KEEP_ACTOR = "@%PihkntOIF!1023456789ABCEYGHKQUNJLM";
const KEEP_TOY = "lzxfjdw}{[S|^~T`)-g/:\\";
const KEEP = KEEP_ACTOR + KEEP_TOY;
const FLOOR = "#*=_T/\\&-`)gjw[{";

export type Seat = "crest" | "valley" | "slope" | "gap" | "court" | "pad" | "loft" | "pit" | "walk";

export function at(rows: string[], x: number, y: number) {
  if (y < 0 || y >= rows.length || x < 0 || x >= (rows[y]?.length ?? 0)) return "#";
  return rows[y][x] ?? "#";
}

export function setAt(rows: string[], x: number, y: number, ch: string) {
  if (y < 1 || y >= rows.length - 1 || x < 1 || x >= (rows[y]?.length ?? 1) - 1) return false;
  if (KEEP.includes(at(rows, x, y))) return false;
  rows[y] = rows[y].slice(0, x) + ch + rows[y].slice(x + 1);
  return true;
}

function overwrite(rows: string[], x: number, y: number, ch: string) {
  if (y < 1 || y >= rows.length - 1 || x < 1 || x >= (rows[y]?.length ?? 1) - 1) return false;
  if (KEEP_ACTOR.includes(at(rows, x, y))) return false;
  rows[y] = rows[y].slice(0, x) + ch + rows[y].slice(x + 1);
  return true;
}

function yfOf(rows: string[], x: number) {
  return localFloorY(rows, x);
}

function reservedNear(rows: string[], x: number, r = 2) {
  const W = rows[0]?.length ?? 0;
  for (let d = -r; d <= r; d++) {
    const xx = x + d;
    if (xx < 0 || xx >= W) continue;
    const yf = yfOf(rows, xx);
    for (const y of [yf - 1, yf, yf - 2]) {
      if (KEEP_ACTOR.includes(at(rows, xx, y))) return true;
    }
  }
  return false;
}

function isAir(ch: string) {
  return ch === "." || ch === "v";
}

function isGround(ch: string) {
  return FLOOR.includes(ch) || ch === "#";
}

/** Air with solid under it — the walk, not pit air. Never wall this. */
function isSidewalk(rows: string[], x: number, y: number) {
  return isAir(at(rows, x, y)) && isGround(at(rows, x, y + 1));
}

/** Local landform at x, from the carved floor — not from art. */
export function seatAt(rows: string[], x: number): Seat {
  const yf = yfOf(rows, x);
  const W = rows[0]?.length ?? 0;
  const left = x > 2 ? yfOf(rows, x - 2) : yf;
  const right = x < W - 3 ? yfOf(rows, x + 2) : yf;
  const floor = at(rows, x, yf);
  if (floor === "." || floor === "^") return "gap";
  if (floor === "^" || at(rows, x, yf + 1) === "^") return "pit";
  if (yf <= left - 1 && yf <= right - 1) return "crest";
  if (yf >= left + 1 && yf >= right + 1) return "valley";
  if (Math.abs(yf - left) >= 1 || Math.abs(yf - right) >= 1) return "slope";
  let flat = 1;
  for (let d = 1; d <= 3 && x + d < W - 1; d++) {
    if (yfOf(rows, x + d) !== yf) break;
    flat += 1;
  }
  if (at(rows, x, yf - 3) === "=") return "loft";
  if (flat >= 5) return "court";
  if (flat >= 3) return "pad";
  return "walk";
}

function clear(rows: string[], x: number, y: number) {
  const ch = at(rows, x, y);
  if (KEEP.includes(ch)) return false;
  if (ch === "#" || ch === "=" || ch === "*") return setAt(rows, x, y, ".");
  return isAir(ch) || ch === ".";
}

function anvil(rows: string[], x: number, y: number) {
  const ch = at(rows, x, y);
  if (KEEP.includes(ch)) return isGround(ch);
  if (ch === "." || ch === "^") return setAt(rows, x, y, "#");
  return isGround(ch);
}

/** Write a housing block onto air only. Never wall a sidewalk. */
function mount(rows: string[], x: number, y: number, ch: "#" | "=" | "&") {
  if (y < 1 || y >= rows.length - 1) return false;
  const here = at(rows, x, y);
  if (here === ch || here === "#" || here === "=" || here === "&") return true;
  if (here !== ".") return false;
  if (ch === "#" && isSidewalk(rows, x, y)) return false;
  return setAt(rows, x, y, ch);
}

function beamAbove(rows: string[], x: number, yf: number) {
  if (yf - 3 <= 1) return false;
  return mount(rows, x, yf - 3, "=") || mount(rows, x, yf - 3, "#");
}

/**
 * Plant one obstacle so its live AABB matches the terrain.
 * Returns false if the column is a porch, reserved, or the seat is wrong.
 */
export function plantAt(rows: string[], x: number, ch: string): boolean {
  if (!ch || reservedNear(rows, x, 2)) return false;
  const yf = yfOf(rows, x);
  const H = rows.length;
  if (yf < 3 || yf > H - 3) return false;
  switch (ch) {
    case "l":
      return plantHang(rows, x, yf, "l", 2);
    case "z":
      return plantStamper(rows, x, yf);
    case "x":
      return plantGuillotine(rows, x, yf);
    case "S":
      return plantSaw(rows, x, yf);
    case "f":
      return plantDropcap(rows, x, yf);
    case "d":
      return plantRotor(rows, x, yf);
    case "j":
      return plantFloorRun(rows, x, yf, "j", 2);
    case "w":
    case "~":
      return plantFloorRun(rows, x, yf, ch === "~" ? "~" : "w", 2);
    case "}":
      return plantShutter(rows, x, yf);
    case "{":
      return plantCarriage(rows, x, yf);
    case "[":
      return plantEcho(rows, x, yf);
    case "|":
      return plantLaser(rows, x, yf);
    case "^":
      return plantSpike(rows, x, yf);
    case "T":
      return plantBounce(rows, x, yf);
    case "-":
      return plantFloorRun(rows, x, yf, "-", 3);
    case "/":
    case "\\":
      return plantFloorRun(rows, x, yf, ch, 2);
    case "`":
    case ")":
      return plantRide(rows, x, yf, ch);
    case "g":
      return plantGeyser(rows, x, yf);
    case ":":
      return plantFan(rows, x, yf);
    default:
      return false;
  }
}

/** Hang toys occupy yf-2. Walk yf-1 stays air. Floor yf stays solid. */
function plantHang(rows: string[], x: number, yf: number, ch: string, swing: number) {
  if (yf - 2 <= 1) return false;
  if (!clear(rows, x, yf - 1)) return false;
  if (!anvil(rows, x, yf)) return false;
  for (let d = -swing; d <= swing; d++) {
    if (d === 0) continue;
    const xx = x + d;
    if (at(rows, xx, yf - 2) === "#") clear(rows, xx, yf - 2);
  }
  if (!setAt(rows, x, yf - 2, ch)) return false;
  if (ch === "l" || ch === "z" || ch === "f") beamAbove(rows, x, yf);
  return true;
}

function plantStamper(rows: string[], x: number, yf: number) {
  if (!plantHang(rows, x, yf, "z", 0)) return false;
  const waitL = isGround(at(rows, x - 1, yf)) || at(rows, x - 1, yf - 2) === "#";
  const waitR = isGround(at(rows, x + 1, yf)) || at(rows, x + 1, yf - 2) === "#";
  if (!waitL && !waitR && !isSidewalk(rows, x + 1, yf - 2)) setAt(rows, x + 1, yf - 2, "#");
  beamAbove(rows, x, yf);
  return true;
}

function plantDropcap(rows: string[], x: number, yf: number) {
  if (!plantHang(rows, x, yf, "f", 1)) return false;
  beamAbove(rows, x, yf);
  return true;
}

function plantSaw(rows: string[], x: number, yf: number) {
  if (!plantHang(rows, x, yf, "S", 2)) return false;
  for (let d = -2; d <= 2; d++) {
    if (d === 0) continue;
    if (isAir(at(rows, x + d, yf - 2))) mount(rows, x + d, yf - 2, "=");
  }
  return true;
}

function plantGuillotine(rows: string[], x: number, yf: number) {
  if (!plantHang(rows, x, yf, "x", 0)) return false;
  if (!clear(rows, x + 1, yf - 2) || !clear(rows, x + 2, yf - 2)) {
    setAt(rows, x, yf - 2, ".");
    return false;
  }
  if (at(rows, x - 1, yf - 2) === "." && !isSidewalk(rows, x - 1, yf - 2)) {
    setAt(rows, x - 1, yf - 2, "#");
  }
  return true;
}

function plantRotor(rows: string[], x: number, yf: number) {
  if (yf - 3 <= 1) return false;
  if (!anvil(rows, x, yf)) return false;
  for (const xx of [x - 1, x, x + 1]) {
    if (!clear(rows, xx, yf - 2)) return false;
  }
  if (!clear(rows, x, yf - 3) || !clear(rows, x, yf - 1)) return false;
  if (!setAt(rows, x, yf - 2, "d")) return false;
  if (at(rows, x, yf) === "#") setAt(rows, x, yf, "&") || true;
  else mount(rows, x, yf, "&");
  return true;
}

function plantFloorRun(rows: string[], x: number, yf: number, ch: string, n: number) {
  for (let i = 0; i < n; i++) {
    const xx = x + i;
    if (reservedNear(rows, xx, 1)) return false;
    if (!isGround(at(rows, xx, yf)) && at(rows, xx, yf) !== ".") return false;
    if (!clear(rows, xx, yf - 1) && !isAir(at(rows, xx, yf - 1))) return false;
  }
  for (let i = 0; i < n; i++) setAt(rows, x + i, yf, ch);
  if (ch === "j" || ch === "w" || ch === "~") {
    mount(rows, x - 1, yf, "#");
    mount(rows, x + n, yf, "#");
    for (let i = 0; i < n; i++) mount(rows, x + i, yf + 1, "#");
  }
  return true;
}

function plantShutter(rows: string[], x: number, yf: number) {
  if (!anvil(rows, x, yf) || !anvil(rows, x + 1, yf) || !anvil(rows, x + 2, yf)) return false;
  if (!clear(rows, x, yf - 1) || !clear(rows, x + 1, yf - 1) || !clear(rows, x + 2, yf - 1)) return false;
  setAt(rows, x, yf - 1, "}");
  setAt(rows, x + 1, yf - 1, "}");
  setAt(rows, x + 2, yf - 1, "}");
  for (let i = 0; i < 3; i++) mount(rows, x + i, yf - 2, "=");
  return true;
}

function plantCarriage(rows: string[], x: number, yf: number) {
  let gap = 0;
  for (let i = 0; i < 4; i++) {
    const f = at(rows, x + i, yf);
    if (f === "." || f === "^") gap += 1;
  }
  if (gap < 3) return false;
  if (!clear(rows, x, yf - 1)) return false;
  if (yf - 3 > 1) {
    for (let i = -3; i <= 3; i++) {
      if (isAir(at(rows, x + i, yf - 3))) mount(rows, x + i, yf - 3, "=");
    }
  }
  return setAt(rows, x, yf - 1, "{");
}

function plantEcho(rows: string[], x: number, yf: number) {
  if (at(rows, x, yf - 3) === "=") {
    setAt(rows, x - 1, yf - 3, "=");
    setAt(rows, x + 1, yf - 3, "=");
    return setAt(rows, x, yf - 3, "[");
  }
  if (!anvil(rows, x, yf)) return false;
  if (!clear(rows, x, yf - 1) && !isAir(at(rows, x, yf - 1))) return false;
  return setAt(rows, x, yf - 1, "[");
}

function plantLaser(rows: string[], x: number, yf: number) {
  if (yf - 4 <= 1) return false;
  if (isSidewalk(rows, x, yf - 3) || isSidewalk(rows, x, yf - 4)) return false;
  if (!clear(rows, x, yf - 1) && !isAir(at(rows, x, yf - 1))) return false;
  setAt(rows, x, yf - 3, "|");
  setAt(rows, x, yf - 4, "|");
  if (yf - 5 > 1) mount(rows, x, yf - 5, "#");
  return true;
}

function plantSpike(rows: string[], x: number, yf: number) {
  const floor = at(rows, x, yf);
  if (floor === "." || floor === "^") {
    const y = yf + 1 < rows.length - 1 ? yf + 1 : yf;
    if (!setAt(rows, x, y, "^") && at(rows, x, y) !== "^") return false;
    mount(rows, x, y + 1, "#");
    return true;
  }
  if (floor === "#" && at(rows, x + 1, yf) === "#") {
    if (yf + 2 >= rows.length - 1) return false;
    setAt(rows, x, yf, ".");
    setAt(rows, x + 1, yf, ".");
    setAt(rows, x, yf + 1, "^");
    setAt(rows, x + 1, yf + 1, "^");
    mount(rows, x, yf + 2, "#");
    mount(rows, x + 1, yf + 2, "#");
    return true;
  }
  return false;
}

function plantBounce(rows: string[], x: number, yf: number) {
  const floor = at(rows, x, yf);
  if (floor !== "." && floor !== "^") return false;
  const y = at(rows, x, yf - 1) === "." || at(rows, x, yf - 1) === "T" ? yf - 1 : yf;
  if (!setAt(rows, x, y, "T")) return at(rows, x, y) === "T";
  mount(rows, x, y + 1, "#");
  return true;
}

function plantRide(rows: string[], x: number, yf: number, ch: string) {
  const floor = at(rows, x, yf);
  if (floor !== "." && floor !== "^" && !isGround(floor)) return false;
  if (!clear(rows, x, yf - 1) && !isAir(at(rows, x, yf - 1))) return false;
  if (!setAt(rows, x, yf - 1, ch)) return false;
  if (isAir(at(rows, x - 1, yf - 1))) mount(rows, x - 1, yf, "#");
  else mount(rows, x + 1, yf, "#");
  return true;
}

function plantGeyser(rows: string[], x: number, yf: number) {
  if (!isGround(at(rows, x - 1, yf)) && !isGround(at(rows, x + 1, yf))) {
    mount(rows, x - 1, yf, "#");
    mount(rows, x + 1, yf, "#");
  }
  if (!isGround(at(rows, x - 1, yf)) && !isGround(at(rows, x + 1, yf))) return false;
  if (!clear(rows, x, yf - 1) && !isAir(at(rows, x, yf - 1))) return false;
  return setAt(rows, x, yf, "g");
}

function plantFan(rows: string[], x: number, yf: number) {
  if (!anvil(rows, x, yf)) return false;
  if (!clear(rows, x, yf - 1)) return false;
  if (!setAt(rows, x, yf - 1, ":")) return false;
  if (isAir(at(rows, x - 1, yf - 1))) mount(rows, x - 1, yf, "#");
  else mount(rows, x + 1, yf, "#");
  return true;
}

function isWalkNub(rows: string[], x: number, y: number) {
  if (!isAir(at(rows, x, y - 1))) return false;
  for (const d of [-1, 1] as const) {
    if (!isGround(at(rows, x + d, y))) continue;
    if (!isAir(at(rows, x + d, y - 1))) continue;
    if (yfOf(rows, x + d) === y) return true;
  }
  return false;
}

const DECO = "';\",?";

function pitifyNub(rows: string[], x: number, y: number) {
  if (KEEP_ACTOR.includes(at(rows, x, y))) return;
  if (isSidewalk(rows, x, y + 1)) {
    overwrite(rows, x, y, ".");
    return;
  }
  if (y + 2 >= rows.length - 1 || reservedNear(rows, x, 1)) {
    overwrite(rows, x, y, ".");
    return;
  }
  const below = at(rows, x, y + 1);
  if (KEEP_ACTOR.includes(below)) return;
  overwrite(rows, x, y, ".");
  if (below !== "^") overwrite(rows, x, y + 1, "^");
  mount(rows, x, y + 2, "#");
}

function houseBounce(rows: string[], x: number, y: number) {
  if (at(rows, x, y + 1) === "T") return;
  const below = at(rows, x, y + 1);
  if (below === "^") {
    mount(rows, x, y + 2, "#");
    return;
  }
  if (isAir(below) || below === "?" || below === "'" || below === ";" || below === '"' || below === ",") {
    if (isAir(below)) mount(rows, x, y + 1, "#");
    else overwrite(rows, x, y + 1, "#");
    return;
  }
  const gap =
    isAir(at(rows, x - 1, y + 1)) ||
    at(rows, x - 1, y + 1) === "^" ||
    isAir(at(rows, x + 1, y + 1)) ||
    at(rows, x + 1, y + 1) === "^";
  if (!gap && isGround(below)) overwrite(rows, x, y, ".");
}

function houseLaser(rows: string[], x: number, y: number) {
  const yf = yfOf(rows, x);
  const onWalk = y === yf || y === yf - 1 || isGround(at(rows, x, y + 1)) || at(rows, x, y + 1) === "~";
  if (onWalk) {
    overwrite(rows, x, y, ".");
    const dest = Math.max(2, Math.min(y, yf) - 3);
    if (dest !== y && at(rows, x, dest) === "." && !isGround(at(rows, x, dest + 1))) overwrite(rows, x, dest, "|");
    if (dest - 1 > 1) mount(rows, x, dest - 1, "#");
    return;
  }
  const up = at(rows, x, y - 1);
  if (up === "|" || up === "#" || up === "=" || up === "*" || up === "&") return;
  if (isAir(up)) mount(rows, x, y - 1, "#");
  else if (DECO.includes(up)) overwrite(rows, x, y - 1, "#");
}

/** Add missing sockets, basins, beams, rails. Never moves actors. */
export function houseAfter(rows: string[]): string[] {
  const H = rows.length;
  const W = rows[0]?.length ?? 0;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const ch = at(rows, x, y);
      if (ch === "^") {
        if (isWalkNub(rows, x, y)) pitifyNub(rows, x, y);
        else if (isSidewalk(rows, x, y + 1)) overwrite(rows, x, y, ".");
        else mount(rows, x, y + 1, "#");
      } else if (ch === "~" || ch === "w") {
        mount(rows, x - 1, y, "#");
        mount(rows, x + 1, y, "#");
        if (!isAir(at(rows, x, y + 1)) && at(rows, x, y + 1) !== "~" && at(rows, x, y + 1) !== "w") {
          /* already a floor or a deeper pool */
        } else if (at(rows, x, y + 1) !== "~" && at(rows, x, y + 1) !== "w") {
          mount(rows, x, y + 1, "#");
        }
      } else if (ch === "l" || ch === "z" || ch === "f") {
        const up = at(rows, x, y - 1);
        if (isAir(up)) mount(rows, x, y - 1, "=");
        else if (DECO.includes(up)) overwrite(rows, x, y - 1, "=");
      } else if (ch === "S") {
        for (let d = -2; d <= 2; d++) {
          if (d === 0) continue;
          if (isAir(at(rows, x + d, y))) mount(rows, x + d, y, "=");
        }
      } else if (ch === "|") {
        houseLaser(rows, x, y);
      } else if (ch === "}") {
        if (isAir(at(rows, x, y - 1))) mount(rows, x, y - 1, "=");
      } else if (ch === "{") {
        for (let d = -3; d <= 3; d++) {
          if (isAir(at(rows, x + d, y - 2))) mount(rows, x + d, y - 2, "=");
        }
      } else if (ch === "d") {
        const yf = yfOf(rows, x);
        if (at(rows, x, yf) === "#") setAt(rows, x, yf, "&");
        else mount(rows, x, yf, "&");
      } else if (ch === ":" || ch === "`") {
        if (isAir(at(rows, x, y + 1)) && !isSidewalk(rows, x, y + 1)) mount(rows, x, y + 1, "#");
        if (isAir(at(rows, x - 1, y))) mount(rows, x - 1, y + 1, "#");
        else if (isAir(at(rows, x + 1, y))) mount(rows, x + 1, y + 1, "#");
      } else if (ch === "T") {
        houseBounce(rows, x, y);
      } else if (ch === "x") {
        if (isAir(at(rows, x - 1, y)) && !isSidewalk(rows, x - 1, y)) mount(rows, x - 1, y, "#");
      } else if (ch === "[") {
        const under = at(rows, x, y + 1);
        if (isAir(under) && !isSidewalk(rows, x, y + 1)) mount(rows, x, y + 1, "#");
        else if (!isGround(under) && under !== "=") {
          if (isAir(at(rows, x - 1, y))) mount(rows, x - 1, y, "=");
          if (isAir(at(rows, x + 1, y))) mount(rows, x + 1, y, "=");
        }
      } else if (ch === "g") {
        if (!isGround(at(rows, x - 1, y)) && isAir(at(rows, x - 1, y)) && !isSidewalk(rows, x - 1, y)) {
          mount(rows, x - 1, y, "#");
        }
        if (!isGround(at(rows, x + 1, y)) && isAir(at(rows, x + 1, y)) && !isSidewalk(rows, x + 1, y)) {
          mount(rows, x + 1, y, "#");
        }
      }
    }
  }
  liftWalkLasers(rows);
  revealLids(rows);
  return rows;
}

const FLOOR_TRAP = "^jw~gT";

/** Open short dirt lids over floor traps. Long packed slabs lose the teeth. */
function revealLids(rows: string[]) {
  const H = rows.length;
  const W = rows[0]?.length ?? 0;
  for (let y = 1; y < H - 1; y++) {
    let x = 1;
    while (x < W - 1) {
      const ch = at(rows, x, y);
      const up = at(rows, x, y - 1);
      if (!FLOOR_TRAP.includes(ch) || (up !== "#" && up !== "*")) {
        x += 1;
        continue;
      }
      let x1 = x;
      while (
        x1 + 1 < W - 1 &&
        FLOOR_TRAP.includes(at(rows, x1 + 1, y)) &&
        (at(rows, x1 + 1, y - 1) === "#" || at(rows, x1 + 1, y - 1) === "*")
      ) {
        x1 += 1;
      }
      const wide = x1 - x + 1;
      const porch = reservedNear(rows, x, 1) || reservedNear(rows, x1, 1);
      for (let xx = x; xx <= x1; xx++) {
        const trap = at(rows, xx, y);
        if (trap === "^") {
          if (porch || wide > 3) overwrite(rows, xx, y, "#");
          else {
            overwrite(rows, xx, y - 1, ".");
            mount(rows, xx, y + 1, "#");
          }
        } else {
          overwrite(rows, xx, y - 1, ".");
        }
      }
      x = x1 + 1;
    }
  }
}

/** Match validate-level: | must not occupy fy or fy-1. */
function liftWalkLasers(rows: string[]) {
  const H = rows.length;
  const W = rows[0]?.length ?? 0;
  const fyAt = (x: number) => {
    for (let y = H - 2; y >= 1; y--) {
      const ch = at(rows, x, y);
      if (ch === "^" || ch === "S" || ch === "~") continue;
      if (FLOOR.includes(ch) && ch !== ".") continue;
      if (ch === "#" || ch === "*" || ch === "&") continue;
      return Math.min(H - 2, y + 1);
    }
    return yfOf(rows, x);
  };
  for (let x = 1; x < W - 1; x++) {
    const fy = fyAt(x);
    for (const y of [fy, fy - 1]) {
      if (at(rows, x, y) !== "|") continue;
      overwrite(rows, x, y, ".");
      let dest = fy - 3;
      while (dest > 2 && (at(rows, x, dest) !== "." || FLOOR.includes(at(rows, x, dest + 1)) || at(rows, x, dest + 1) === "#")) {
        dest -= 1;
      }
      if (dest > 1 && at(rows, x, dest) === ".") overwrite(rows, x, dest, "|");
      if (dest > 2) mount(rows, x, dest - 1, "#");
    }
  }
}
