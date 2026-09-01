import { clearFightPorches, ensureCounts } from "./density";
import { houseAfter } from "./site";
import { grid, sealBasement, type Grid } from "./levels-story";
import { armTeethAlongPath, dressPath, realizeLandform, repairPath, type LandOp } from "./sculpt";

/**
 * Second Book painters. Glyphbound Doctrine:
 * land → teach → mix → combat pack → rest → combat pack → gate
 * Unlock: 6–8 T-= · 9–11 | / · 12–14 ` ) g · 15 known. No saws.
 * Spikes in pits or 2-tile jumps. Lasers off the walkway. P on the floor.
 */

function paint(
  W: number,
  H: number,
  fy: number,
  fn: (g: Grid, fy: number) => void,
  land: LandOp[] = [],
  kit = "",
) {
  const g = grid(W, H, fy) as Grid;
  const spine = realizeLandform(g, land);
  fn(g, fy);
  if (kit) dressPath(g, kit);
  armTeethAlongPath(g, spine);
  sealBasement(g, fy);
  repairPath(g);
  ensureCounts(g, 30);
  houseAfter(g);
  clearFightPorches(g);
  return [...g];
}

function torches(g: Grid, y: number, x: number, n: number, ch: string, step = 2) {
  for (let i = 0; i < n; i++) g.put(x + i * step, y, ch);
}

/** 2-tile pit. Walk-on ^ at fy-1 is stripped by ensurePortalAccess. */
function hop(g: Grid, fy: number, x: number) {
  g.fill(x, fy, 2, ".");
}

function bouncePit(g: Grid, fy: number, x: number) {
  g.fill(x, fy, 3, ".");
  g.put(x + 1, fy - 1, "T");
}

function crumble(g: Grid, fy: number, x: number, n = 5) {
  g.fill(x, fy, n, "-");
}

function shelf(g: Grid, y: number, x: number, n: number, mob = "", deco = "") {
  g.fill(x, y, n, "=");
  if (deco) g.put(x + Math.floor(n / 2), y - 1, deco);
  if (mob) g.put(x + 1, y - 1, mob);
}

function terrace(g: Grid, fy: number, x: number, deco: string, mobs = "141") {
  g.fill(x, fy - 2, 4, "=");
  g.fill(x + 4, fy - 4, 4, "=");
  g.fill(x + 8, fy - 2, 4, "=");
  g.put(x + 1, fy - 3, deco);
  g.put(x + 5, fy - 5, deco);
  g.put(x + 9, fy - 3, deco);
  if (mobs) g.put(x + 1, fy - 3, mobs);
}

function zipper(g: Grid, fy: number, x: number, deco: string) {
  for (let i = 0; i < 5; i++) {
    const up = i % 2 === 0 ? 2 : 4;
    g.fill(x + i * 3, fy - up, 2, "=");
    g.put(x + i * 3, fy - up - 1, i % 2 === 0 ? "1" : deco);
  }
}

function colonnade(g: Grid, fy: number, x: number, cols: number, deco: string) {
  for (let i = 0; i < cols; i++) {
    const cx = x + i * 3;
    g.put(cx, fy - 3, "#");
    g.fill(cx, fy - 4, 2, "=");
    g.put(cx + 1, fy - 5, i % 2 ? deco : "1");
  }
}

function cascade(g: Grid, fy: number, x: number, deco: string, hang = "") {
  if (hang) g.put(x, fy - 2, hang);
  else g.put(x, fy - 1, "T");
  g.fill(x + 2, fy - 3, 3, "=");
  g.fill(x + 5, fy - 4, 3, "=");
  g.put(x + 8, fy - 1, "T");
  g.put(x + 3, fy - 4, deco);
  g.put(x + 6, fy - 5, "2");
}

function laserHang(g: Grid, fy: number, x: number, h = 2) {
  for (let i = 0; i < h; i++) g.put(x, fy - 2 - i, "|");
}

function belt(g: Grid, fy: number, x: number, n: number, right = true) {
  g.fill(x, fy, n, right ? "/" : "\\");
}

function liftPair(g: Grid, fy: number, x: number) {
  g.fill(x, fy, 2, ".");
  g.put(x, fy - 1, "`");
  g.put(x + 1, fy - 1, "`");
}

function blinkPair(g: Grid, fy: number, x: number) {
  g.fill(x, fy, 2, ".");
  g.put(x, fy - 1, ")");
  g.put(x + 1, fy - 1, ")");
  g.put(x - 1, fy - 1, "#");
  g.put(x + 2, fy - 1, "#");
}

function pack(g: Grid, fy: number, x: number, glyphs: string) {
  g.put(x, fy - 1, glyphs);
}

function hangCenser(g: Grid, fy: number, x: number) {
  g.put(x, fy - 2, "l");
}

function hangStamper(g: Grid, fy: number, x: number) {
  g.put(x, fy - 2, "z");
}

function hangGuillotine(g: Grid, fy: number, x: number) {
  g.put(x, fy - 2, "x");
}

function hangDropcap(g: Grid, fy: number, x: number) {
  g.put(x, fy - 2, "f");
}

function grateRun(g: Grid, fy: number, x: number, n = 3) {
  g.fill(x, fy, n, "j");
}

function hangRotor(g: Grid, fy: number, x: number) {
  g.put(x, fy - 2, "d");
}

function sinkWell(g: Grid, fy: number, x: number) {
  g.fill(x, fy, 2, "w");
}

function shutterGate(g: Grid, fy: number, x: number) {
  g.put(x, fy - 2, "}}}");
  g.fill(x, fy - 4, 3, "=");
}

function rideCarriage(g: Grid, fy: number, x: number) {
  g.put(x, fy - 1, "{");
  g.fill(x, fy - 3, 4, "=");
}

function echoLoft(g: Grid, fy: number, x: number) {
  g.put(x, fy - 3, "[");
  g.put(x - 1, fy - 3, "=");
  g.put(x + 1, fy - 3, "=");
}

const KEEP = "@%PihkntOIF!>lzxfjdw}{[1023456789ABCEYGHKQUNJLM";

function cell(g: Grid, x: number, y: number) {
  const ny = g.along ? g.along(x, y) : y;
  return g[ny]?.[x] ?? "#";
}

function kept(ch: string) {
  return KEEP.includes(ch);
}

type PressureKit = {
  hang?: string;
  floor?: string;
  echo?: boolean;
  ride?: boolean;
  laser?: boolean;
};

/** After the sentence is painted, pack leftover air with the stage's damage kit. Never on @ % P. */
function pressure(g: Grid, fy: number, deco: string, kit: PressureKit = {}) {
  const W = g.W;
  const ink = deco === "," || deco === "?";
  const busy = (x: number) => {
    for (let dx = -2; dx <= 3; dx++) {
      const xx = x + dx;
      for (let y = 1; y < g.H - 1; y++) {
        const ch = g[y]?.[xx] ?? "#";
        if (kept(ch)) return true;
      }
    }
    return false;
  };
  for (let x = 12; x < W - 16; x += 9) {
    if (busy(x)) continue;
    let clear = true;
    for (let i = 0; i < 7; i++) if (cell(g, x + i, fy - 3) !== ".") clear = false;
    if (!clear) continue;
    g.fill(x, fy - 3, 7, "=");
    g.put(x + 2, fy - 4, deco);
    g.put(x + 5, fy - 4, "1");
  }
  if (kit.hang) {
    let i = 0;
    for (let x = 11; x < W - 10; x += 16) {
      if (busy(x)) continue;
      if (cell(g, x, fy - 2) !== ".") continue;
      g.put(x, fy - 2, kit.hang[i % kit.hang.length] ?? kit.hang[0]);
      i += 1;
    }
  }
  if (kit.floor) {
    for (let x = 16; x < W - 12; x += 20) {
      if (busy(x) || busy(x + 1)) continue;
      if (cell(g, x, fy) !== "#" || cell(g, x + 1, fy) !== "#") continue;
      if (kept(cell(g, x, fy - 1)) || kept(cell(g, x + 1, fy - 1))) continue;
      g.fill(x, fy, 2, kit.floor);
    }
  }
  if (kit.echo) {
    for (let x = 18; x < W - 12; x += 20) {
      if (busy(x)) continue;
      if (cell(g, x, fy - 3) !== ".") continue;
      echoLoft(g, fy, x);
    }
  }
  if (kit.ride) {
    for (let x = 20; x < W - 14; x += 24) {
      if (busy(x)) continue;
      if (cell(g, x, fy - 1) !== ".") continue;
      rideCarriage(g, fy, x);
    }
  }
  if (kit.laser || (!kit.hang && !kit.floor && !ink)) {
    for (let x = 16; x < W - 10; x += 16) {
      if (busy(x)) continue;
      if (cell(g, x, fy - 3) === "." && cell(g, x, fy - 4) === ".") laserHang(g, fy, x, 2);
    }
  }
  if (ink) {
    for (let x = 20; x < W - 16; x += 28) {
      if (busy(x) || busy(x + 1)) continue;
      if (cell(g, x, fy) !== "#" || cell(g, x + 1, fy) !== "#" || cell(g, x + 2, fy) !== "#") continue;
      g.fill(x, fy, 3, ".");
      if (cell(g, x + 1, fy - 1) === ".") g.put(x + 1, fy - 1, "T");
      g.fill(x, fy + 1, 3, "~");
      break;
    }
  }
  let bounces = 0;
  for (let x = 18; x < W - 14 && bounces < 3; x += 22) {
    if (busy(x)) continue;
    if (cell(g, x, fy) !== "#" && cell(g, x, fy) !== "-") continue;
    bouncePit(g, fy, x);
    bounces += 1;
  }
  for (let x = 22; x < W - 14; x += 18) {
    if (busy(x)) continue;
    let solid = true;
    for (let i = 0; i < 5; i++) if (cell(g, x + i, fy) !== "#" || cell(g, x + i, fy - 1) !== ".") solid = false;
    if (solid) crumble(g, fy, x, 5);
  }
  for (let x = 8; x < W - 6; x += 3) {
    if (cell(g, x, fy - 2) === "." && cell(g, x, fy - 3) === ".") g.put(x, fy - 2, deco);
  }
}

/** VI — Foundry. Bounce teach, crumble mix, terraces of 4s. */
export function buildFoundry(): string[] {
  return paint(192, 16, 11, (g, fy) => {
    const { put, fill, W } = g;
    const d = "'";
    put(2, fy - 1, "@");
    put(3, fy - 1, "i");
    torches(g, fy - 2, 5, 6, d);
    pack(g, fy, 8, "11");
    hangCenser(g, fy, 11);
    // teach bounce
    bouncePit(g, fy, 14);
    shelf(g, fy - 3, 18, 5, "1", d);
    pack(g, fy, 24, "14");
    hangCenser(g, fy, 28);
    pack(g, fy, 32, "41");
    // mix crumble
    crumble(g, fy, 36, 6);
    pack(g, fy, 43, "14");
    bouncePit(g, fy, 48);
    terrace(g, fy, 54, d, "414");
    pack(g, fy, 68, "1414");
    hangCenser(g, fy, 74);
    colonnade(g, fy, 78, 5, d);
    pack(g, fy, 94, "44");
    put(98, fy - 1, "%");
    put(99, fy - 1, "i");
    put(100, fy - 1, "h");
    torches(g, fy - 2, 102, 4, d);
    // pack two
    pack(g, fy, 108, "141241");
    crumble(g, fy, 116, 5);
    hangCenser(g, fy, 122);
    zipper(g, fy, 128, d);
    pack(g, fy, 144, "41414");
    hangCenser(g, fy, 152);
    cascade(g, fy, 156, d, "l");
    shelf(g, fy - 3, 166, 6, "4", d);
    put(168, fy - 4, "$");
    pack(g, fy, 174, "141");
    torches(g, fy - 2, 178, 4, d);
    put(W - 8, fy - 1, "i");
    put(W - 4, fy - 1, "P");
    crumble(g, fy, 182, 4);
    bouncePit(g, fy, 88);
    pressure(g, fy, d, { hang: "l" });
  }, [
    { t: "hill", at: 22, w: 14, h: 2 },
    { t: "corridor", at: 52, w: 16 },
    { t: "valley", at: 78, w: 12, d: 2 },
    { t: "ridge", at: 108, w: 18 },
    { t: "pass", at: 148, w: 20 },
  ], "l");
}

/** VII — Keystroke. Rafter flyers, grate rescue, Stomp porch packed. */
export function buildKeystroke(): string[] {
  return paint(196, 16, 11, (g, fy) => {
    const { put, fill, W } = g;
    const d = "'";
    put(2, fy - 1, "@");
    put(3, fy - 1, "i");
    torches(g, fy - 2, 5, 5, d);
    pack(g, fy, 8, "14");
    hop(g, fy, 12);
    bouncePit(g, fy, 14);
    hangCenser(g, fy, 18);
    hangStamper(g, fy, 22);
    shelf(g, fy - 4, 12, 8, "", d);
    put(14, fy - 5, "0");
    put(16, fy - 5, "7");
    put(18, fy - 5, "0");
    hop(g, fy, 20);
    pack(g, fy, 24, "414");
    colonnade(g, fy, 30, 4, d);
    crumble(g, fy, 44, 5);
    pack(g, fy, 50, "41");
    // grate: walk-under, k inside
    fill(56, fy - 4, 10, "#");
    fill(56, fy - 5, 10, "#");
    put(56, fy - 3, "#");
    put(65, fy - 3, "#");
    put(60, fy - 1, "k");
    put(62, fy - 1, "i");
    // stomp porch
    pack(g, fy, 68, "444144");
    hop(g, fy, 76);
    terrace(g, fy, 80, d, "441");
    put(96, fy - 1, "%");
    put(97, fy - 1, "i");
    put(98, fy - 1, "h");
    shelf(g, fy - 4, 100, 8, "", d);
    put(102, fy - 5, "0");
    put(104, fy - 5, "7");
    put(106, fy - 5, "0");
    pack(g, fy, 110, "41441");
    bouncePit(g, fy, 118);
    crumble(g, fy, 124, 6);
    zipper(g, fy, 132, d);
    pack(g, fy, 148, "4441");
    hangStamper(g, fy, 154);
    cascade(g, fy, 158, d, "z");
    shelf(g, fy - 3, 170, 6, "4", d);
    put(172, fy - 4, "$");
    hop(g, fy, 176);
    pack(g, fy, 178, "1414");
    put(W - 8, fy - 1, "i");
    put(W - 4, fy - 1, "P");
    pressure(g, fy, d, { hang: "lz" });
    g.put(45, fy - 4, "^");
    g.put(46, fy - 4, "^");
    g.put(47, fy - 4, "^");
  }, [
    { t: "hill", at: 18, w: 12, h: 2 },
    { t: "grate", at: 56, w: 2 },
    { t: "valley", at: 88, w: 12, d: 2 },
    { t: "ridge", at: 120, w: 16 },
    { t: "pass", at: 154, w: 18 },
  ], "lz");
}

/** VIII — Fourfold Keep. Plus splitway, packs on three arms, Tetrarch. */
export function buildFourfold(): string[] {
  return paint(200, 16, 11, (g, fy) => {
    const { put, fill, W } = g;
    const d = "'";
    put(2, fy - 1, "@");
    put(3, fy - 1, "i");
    torches(g, fy - 2, 5, 6, d);
    pack(g, fy, 8, "414");
    bouncePit(g, fy, 14);
    hangDropcap(g, fy, 18);
    hop(g, fy, 20);
    pack(g, fy, 24, "441");
    crumble(g, fy, 30, 5);
    terrace(g, fy, 38, d, "414");
    colonnade(g, fy, 54, 4, d);
    pack(g, fy, 68, "4414");
    put(74, fy - 1, "%");
    put(75, fy - 1, "i");
    put(76, fy - 1, "h");
    // plus keep: left loft, high loft, right loft, floor stem
    shelf(g, fy - 3, 80, 10, "444", d);
    shelf(g, fy - 5, 88, 16, "41414", d);
    shelf(g, fy - 3, 108, 10, "441", d);
    pack(g, fy, 86, "44144");
    put(100, fy - 1, "!");
    pack(g, fy, 108, "414");
    hangDropcap(g, fy, 116);
    zipper(g, fy, 120, d);
    hangStamper(g, fy, 136);
    crumble(g, fy, 142, 5);
    pack(g, fy, 150, "44141");
    cascade(g, fy, 158, d, "f");
    shelf(g, fy - 3, 170, 8, "4", d);
    put(172, fy - 4, "$");
    pack(g, fy, 180, "1414");
    torches(g, fy - 2, 186, 4, d);
    put(W - 8, fy - 1, "i");
    put(W - 4, fy - 1, "P");
    pressure(g, fy, d, { hang: "zx", laser: true });
  }, [
    { t: "hill", at: 20, w: 12, h: 2 },
    { t: "switchback", at: 80 },
    { t: "valley", at: 118, w: 12, d: 2 },
    { t: "pass", at: 150, w: 20 },
    { t: "corridor", at: 176, w: 12 },
  ], "zxf");
}

/** IX — Ligature Canal. Sluice zippers, belts, 8-packs. */
export function buildLigature(): string[] {
  return paint(196, 16, 11, (g, fy) => {
    const { put, fill, W } = g;
    const d = ",";
    const wet = (x: number, n: number) => {
      fill(x, fy, n, "~");
      fill(x, fy + 1, n, "~");
    };
    put(2, fy - 1, "@");
    put(3, fy - 1, "i");
    torches(g, fy - 2, 5, 5, d);
    pack(g, fy, 8, "818");
    hop(g, fy, 14);
    bouncePit(g, fy, 18);
    pack(g, fy, 24, "181");
    shelf(g, fy - 3, 20, 6, "8", d);
    wet(28, 7);
    rideCarriage(g, fy, 30);
    shelf(g, fy - 2, 30, 4, "1", d);
    pack(g, fy, 38, "8181");
    crumble(g, fy, 44, 5);
    belt(g, fy, 50, 8, true);
    pack(g, fy, 52, "88");
    laserHang(g, fy, 60, 2);
    pack(g, fy, 62, "1818");
    put(70, fy - 1, "%");
    put(71, fy - 1, "i");
    put(72, fy - 1, "h");
    wet(76, 8);
    shelf(g, fy - 3, 78, 6, "8", d);
    pack(g, fy, 88, "81818");
    hop(g, fy, 96);
    belt(g, fy, 100, 8, false);
    pack(g, fy, 102, "88");
    fill(110, fy - 2, 6, "=");
    put(112, fy - 3, "Z");
    put(114, fy - 3, d);
    pack(g, fy, 118, "8168");
    zipper(g, fy, 128, d);
    wet(144, 7);
    shelf(g, fy - 2, 146, 4, "8");
    pack(g, fy, 154, "8181");
    put(158, fy - 1, "&");
    put(160, fy - 2, "&");
    put(162, fy - 1, "&");
    shelf(g, fy - 3, 158, 6, "", d);
    put(160, fy - 4, "$");
    cascade(g, fy, 168, d);
    pack(g, fy, 178, "1818");
    laserHang(g, fy, 184, 2);
    put(W - 8, fy - 1, "i");
    put(W - 4, fy - 1, "P");
    pressure(g, fy, d, { floor: "w", ride: true });
  }, [
    { t: "valley", at: 26, w: 12, d: 2 },
    { t: "sink", at: 28, n: 2 },
    { t: "bridge", at: 76, w: 6 },
    { t: "valley", at: 140, w: 12, d: 2 },
    { t: "sink", at: 144, n: 2 },
    { t: "hill", at: 168, w: 12, h: 1 },
  ], "w{");
}

/** X — Ampersand Dock. 8-cage, Pin porch, FOLD terrace. */
export function buildAmpersand(): string[] {
  return paint(192, 16, 11, (g, fy) => {
    const { put, fill, W } = g;
    const d = ",";
    const wet = (x: number, n: number) => {
      fill(x, fy, n, "~");
      fill(x, fy + 1, n, "~");
    };
    put(2, fy - 1, "@");
    put(3, fy - 1, "i");
    torches(g, fy - 2, 5, 5, d);
    pack(g, fy, 8, "8181");
    hop(g, fy, 14);
    bouncePit(g, fy, 18);
    terrace(g, fy, 24, d, "n8i");
    echoLoft(g, fy, 36);
    pack(g, fy, 40, "88818");
    crumble(g, fy, 48, 5);
    belt(g, fy, 54, 8, true);
    pack(g, fy, 56, "88");
    laserHang(g, fy, 64, 3);
    pack(g, fy, 66, "1818");
    put(74, fy - 1, "%");
    put(75, fy - 1, "i");
    put(76, fy - 1, "h");
    wet(80, 7);
    shelf(g, fy - 2, 82, 4, "8", d);
    pack(g, fy, 90, "81881");
    hop(g, fy, 98);
    zipper(g, fy, 102, d);
    terrace(g, fy, 118, ";", "O8");
    put(122, fy - 5, ";");
    pack(g, fy, 132, "8881");
    wet(138, 7);
    shelf(g, fy - 3, 140, 5, "8", d);
    belt(g, fy, 150, 6, false);
    pack(g, fy, 152, "81");
    cascade(g, fy, 160, d);
    shelf(g, fy - 4, 170, 6, "$", d);
    pack(g, fy, 178, "1818");
    put(W - 8, fy - 1, "i");
    put(W - 4, fy - 1, "P");
    pressure(g, fy, d, { echo: true, ride: true });
    g.put(27, fy - 1, "n");
  }, [
    { t: "hill", at: 22, w: 12, h: 1 },
    { t: "valley", at: 78, w: 12, d: 2 },
    { t: "switchback", at: 102 },
    { t: "ridge", at: 138, w: 16 },
    { t: "pass", at: 162, w: 16 },
  ], "[{w");
}

/** XI — Iris Bind. Laser colonnade, Null-Rings, The Iris bowl. */
export function buildIrisBind(): string[] {
  return paint(196, 16, 11, (g, fy) => {
    const { put, fill, W } = g;
    const d = ";";
    put(2, fy - 1, "@");
    put(3, fy - 1, "i");
    torches(g, fy - 2, 5, 5, d);
    pack(g, fy, 8, "101");
    bouncePit(g, fy, 14);
    put(20, fy - 1, "B");
    laserHang(g, fy, 24, 2);
    shelf(g, fy - 3, 26, 5, "1", d);
    pack(g, fy, 32, "1210");
    hop(g, fy, 38);
    colonnade(g, fy, 42, 5, d);
    laserHang(g, fy, 58, 3);
    pack(g, fy, 60, "B10");
    crumble(g, fy, 66, 5);
    belt(g, fy, 72, 7, true);
    pack(g, fy, 74, "15");
    put(82, fy - 1, "%");
    put(83, fy - 1, "i");
    put(84, fy - 1, "h");
    laserHang(g, fy, 88, 2);
    shelf(g, fy - 3, 90, 8, "B", d);
    pack(g, fy, 100, "10151");
    zipper(g, fy, 108, d);
    laserHang(g, fy, 124, 2);
    // bowl
    shelf(g, fy - 2, 126, 6, "", d);
    hangRotor(g, fy, 132);
    put(136, fy - 1, "!");
    shelf(g, fy - 2, 140, 6, "", d);
    pack(g, fy, 148, "B10");
    hangRotor(g, fy, 154);
    cascade(g, fy, 158, d, "d");
    pack(g, fy, 170, "1015");
    laserHang(g, fy, 176, 2);
    shelf(g, fy - 4, 178, 6, "$", d);
    pack(g, fy, 186, "12");
    put(W - 8, fy - 1, "h");
    put(W - 4, fy - 1, "P");
    pressure(g, fy, d, { hang: "d", laser: true });
  }, [
    { t: "corridor", at: 40, w: 18 },
    { t: "valley", at: 126, w: 14, d: 2 },
    { t: "hill", at: 154, w: 12, h: 2 },
    { t: "pass", at: 172, w: 16 },
  ], "d");
}

/** XII — Scriptorium. Cascade desks, bounce/Compose, recruit t. */
export function buildScriptorium(): string[] {
  return paint(188, 16, 11, (g, fy) => {
    const { put, fill, W } = g;
    const d = "?";
    put(2, fy - 1, "@");
    put(3, fy - 1, "i");
    torches(g, fy - 2, 5, 5, d);
    pack(g, fy, 8, "121");
    bouncePit(g, fy, 14);
    grateRun(g, fy, 18, 3);
    shelf(g, fy - 2, 22, 6, "ti", d);
    shelf(g, fy - 4, 20, 4, d);
    pack(g, fy, 26, "123");
    hop(g, fy, 32);
    bouncePit(g, fy, 36);
    cascade(g, fy, 42, d);
    pack(g, fy, 54, "1512");
    crumble(g, fy, 60, 5);
    liftPair(g, fy, 68);
    shelf(g, fy - 3, 72, 6, "2", d);
    pack(g, fy, 80, "101");
    put(86, fy - 1, "%");
    put(87, fy - 1, "i");
    put(88, fy - 1, "h");
    bouncePit(g, fy, 92);
    zipper(g, fy, 98, d);
    pack(g, fy, 114, "15121");
    hop(g, fy, 122);
    blinkPair(g, fy, 126);
    shelf(g, fy - 4, 130, 6, "$", d);
    cascade(g, fy, 140, d);
    pack(g, fy, 152, "12315");
    grateRun(g, fy, 160, 3);
    shelf(g, fy - 2, 166, 6, "i", d);
    pack(g, fy, 174, "121");
    put(W - 8, fy - 1, "i");
    put(W - 4, fy - 1, "P");
    pressure(g, fy, d, { floor: "j" });
  }, [
    { t: "grate", at: 18, n: 2 },
    { t: "hill", at: 42, w: 14, h: 2 },
    { t: "valley", at: 92, w: 10, d: 2 },
    { t: "ridge", at: 128, w: 16 },
    { t: "grate", at: 160, n: 2 },
  ], "j");
}

/** XIII — Rule and Storm. Four packed clauses, two packs. */
export function buildRuleStorm(): string[] {
  return paint(200, 16, 11, (g, fy) => {
    const { put, fill, W } = g;
    const d = ";";
    put(2, fy - 1, "@");
    put(3, fy - 1, "i");
    torches(g, fy - 2, 5, 4, d);
    // s vent
    fill(8, fy - 4, 2, "v");
    fill(8, fy - 3, 2, "v");
    fill(8, fy - 2, 2, "v");
    fill(8, fy - 1, 2, "v");
    pack(g, fy, 12, "11");
    pack(g, fy, 16, "44414");
    hangCenser(g, fy, 20);
    grateRun(g, fy, 22, 2);
    hop(g, fy, 24);
    bouncePit(g, fy, 28);
    put(34, fy - 1, "%");
    put(35, fy - 1, "i");
    belt(g, fy, 38, 10, true);
    pack(g, fy, 40, "88818");
    laserHang(g, fy, 52, 2);
    terrace(g, fy, 56, d, "441");
    bouncePit(g, fy, 72);
    pack(g, fy, 78, "151");
    put(84, fy - 1, "%");
    put(85, fy - 1, "h");
    put(86, fy - 1, "i");
    fill(90, fy - 4, 2, "v");
    fill(90, fy - 3, 2, "v");
    fill(90, fy - 2, 2, "v");
    pack(g, fy, 94, "444");
    colonnade(g, fy, 100, 4, d);
    belt(g, fy, 114, 8, false);
    pack(g, fy, 116, "88");
    zipper(g, fy, 126, d);
    liftPair(g, fy, 142);
    pack(g, fy, 148, "41518");
    hangCenser(g, fy, 156);
    cascade(g, fy, 160, d, "l");
    shelf(g, fy - 4, 172, 6, "$", d);
    pack(g, fy, 180, "14151");
    grateRun(g, fy, 188, 2);
    put(W - 8, fy - 1, "h");
    put(W - 4, fy - 1, "P");
    pressure(g, fy, d, { hang: "l", floor: "j" });
  }, [
    { t: "grate", at: 22, n: 2 },
    { t: "hill", at: 56, w: 14, h: 2 },
    { t: "corridor", at: 100, w: 14 },
    { t: "pass", at: 148, w: 18 },
    { t: "grate", at: 188, n: 2 },
  ], "lj");
}

/** XIV — Operator Approach. Lift, blink, geyser, TIDE switchback. */
export function buildApproach(): string[] {
  return paint(192, 16, 11, (g, fy) => {
    const { put, fill, W } = g;
    const d = "?";
    put(2, fy - 1, "@");
    put(3, fy - 1, "i");
    torches(g, fy - 2, 5, 5, d);
    pack(g, fy, 8, "171");
    bouncePit(g, fy, 14);
    liftPair(g, fy, 20);
    rideCarriage(g, fy, 24);
    shelf(g, fy - 2, 24, 8, "I", d);
    pack(g, fy, 34, "125");
    hop(g, fy, 40);
    fill(44, fy, 1, "g");
    g.put(43, fy - 1, "#");
    g.put(45, fy - 1, "#");
    pack(g, fy, 48, "1712");
    zipper(g, fy, 54, d);
    blinkPair(g, fy, 70);
    shelf(g, fy - 3, 74, 6, "2", d);
    put(82, fy - 1, "%");
    put(83, fy - 1, "i");
    put(84, fy - 1, "h");
    pack(g, fy, 88, "15171");
    fill(96, fy - 4, 2, "v");
    fill(96, fy - 3, 2, "v");
    fill(96, fy - 2, 2, "v");
    put(98, fy - 5, "$");
    liftPair(g, fy, 102);
    cascade(g, fy, 108, d);
    pack(g, fy, 120, "07125");
    hop(g, fy, 128);
    fill(132, fy, 1, "g");
    g.put(131, fy - 1, "#");
    g.put(133, fy - 1, "#");
    blinkPair(g, fy, 136);
    terrace(g, fy, 142, d, "171");
    pack(g, fy, 158, "12517");
    rideCarriage(g, fy, 166);
    colonnade(g, fy, 172, 4, d);
    pack(g, fy, 186, "11");
    put(W - 8, fy - 1, "i");
    put(W - 4, fy - 1, "P");
    pressure(g, fy, d, { ride: true });
  }, [
    { t: "bridge", at: 24, w: 6 },
    { t: "hill", at: 54, w: 14, h: 2 },
    { t: "switchback", at: 108 },
    { t: "valley", at: 140, w: 12, d: 2 },
    { t: "bridge", at: 166, w: 6 },
  ], "{g");
}

/** XV — Iconostasis. Crowded nave, loft packs, Archivant. */
export function buildIconostasis(): string[] {
  return paint(176, 16, 11, (g, fy) => {
    const { put, fill, W } = g;
    const d = "?";
    put(2, fy - 1, "@");
    put(3, fy - 1, "i");
    torches(g, fy - 2, 5, 4, d);
    pack(g, fy, 8, "1Q1");
    bouncePit(g, fy, 14);
    hop(g, fy, 18);
    crumble(g, fy, 22, 5);
    liftPair(g, fy, 28);
    bouncePit(g, fy, 32);
    terrace(g, fy, 36, d, "Q1U");
    hop(g, fy, 36);
    pack(g, fy, 40, "1Q1U1");
    colonnade(g, fy, 48, 4, d);
    put(62, fy - 1, "%");
    put(63, fy - 1, "h");
    put(64, fy - 1, "i");
    zipper(g, fy, 68, d);
    shelf(g, fy - 2, 84, 8, "Q", d);
    shelf(g, fy - 4, 90, 12, "QU1", d);
    pack(g, fy, 88, "Q1U");
    put(100, fy - 1, "!");
    hangRotor(g, fy, 104);
    echoLoft(g, fy, 106);
    pack(g, fy, 108, "UQ1");
    shelf(g, fy - 2, 112, 8, "U", d);
    hangRotor(g, fy, 122);
    cascade(g, fy, 126, d, "d");
    pack(g, fy, 138, "1Q1U");
    liftPair(g, fy, 146);
    shelf(g, fy - 4, 150, 6, "$", d);
    pack(g, fy, 158, "Q12");
    echoLoft(g, fy, 164);
    put(W - 8, fy - 1, "h");
    put(W - 4, fy - 1, "P");
    pressure(g, fy, d, { hang: "d", echo: true });
  }, [
    { t: "hill", at: 18, w: 12, h: 1 },
    { t: "ridge", at: 48, w: 16 },
    { t: "valley", at: 84, w: 12, d: 2 },
    { t: "switchback", at: 108 },
    { t: "pass", at: 140, w: 18 },
  ], "d[");
}
