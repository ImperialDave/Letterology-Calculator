import {
  TILE,
  VIEW_H,
  VIEW_W,
  type Bullet,
  type Enemy,
  type LetterId,
  type Marker,
  type Player,
  type ThemeId,
} from "./types";
import { blitArt } from "./art";
import { KITS } from "./roster";
import { meleeAngle, meleePhase, weaponFor, type MeleeFamily } from "./weapons";
import { fxLite } from "./sky";
import type { Solid } from "./types";

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export { drawParallax, drawWeatherFront, drawGrade, drawFgVeil, setFxLite } from "./sky";

function tileChar(rows: string[], tx: number, ty: number) {
  if (ty < 0 || ty >= rows.length || tx < 0 || tx >= rows[0].length) return "#";
  return rows[ty][tx];
}

function isBlock(ch: string) {
  return ch === "#" || ch === "*";
}

const TILE_CACHE = new Map<string, HTMLCanvasElement>();
let glowTile: HTMLCanvasElement | null = null;

function tileCanvas(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = TILE;
  c.height = TILE;
  return c;
}

function cachedTile(key: string, paint: (g: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  let c = TILE_CACHE.get(key);
  if (c) return c;
  c = tileCanvas();
  const g = c.getContext("2d");
  if (g) paint(g);
  TILE_CACHE.set(key, c);
  return c;
}

/** Loop a prop with world identity, never camera-relative screen x. */
export function animWave(t: number, worldX: number, speed: number, scale = 1) {
  return Math.sin(t * speed + worldX * scale);
}

function glowStamp(): HTMLCanvasElement {
  if (glowTile) return glowTile;
  glowTile = tileCanvas();
  const g = glowTile.getContext("2d");
  if (g) {
    const lg = g.createLinearGradient(0, 0, 0, TILE);
    lg.addColorStop(0, "rgba(232,236,240,0.08)");
    lg.addColorStop(1, "rgba(94,224,192,0.12)");
    g.fillStyle = lg;
    g.fillRect(0, 0, TILE, TILE);
    g.fillStyle = "rgba(232,236,240,0.12)";
    g.fillRect(18, 0, 4, TILE);
  }
  return glowTile;
}

export function drawTiles(
  ctx: CanvasRenderingContext2D,
  rows: string[],
  camX: number,
  camY: number,
  t: number,
  theme: ThemeId,
  broken: Set<string>,
) {
  const x0 = Math.max(0, Math.floor(camX / TILE) - 1);
  const y0 = Math.max(0, Math.floor(camY / TILE) - 1);
  const x1 = Math.min(rows[0].length - 1, Math.ceil((camX + VIEW_W) / TILE) + 1);
  const y1 = Math.min(rows.length - 1, Math.ceil((camY + VIEW_H) / TILE) + 1);

  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const ch = rows[ty][tx];
      const x = tx * TILE - camX;
      const y = ty * TILE - camY;
      if (ch === "#" || ch === "*") {
        if (ch === "*" && broken.has(`${tx},${ty}`)) continue;
        drawBlock(ctx, x, y, tx, ty, theme, ch === "*", t, !isBlock(tileChar(rows, tx, ty - 1)));
      } else if (ch === "=") {
        drawSerifShelf(ctx, x, y, t, theme, tx);
      } else if (ch === "-") {
        drawCrumble(ctx, x, y, t, theme, tx);
      } else if (ch === "~") {
        drawSluice(ctx, x, y, t, theme, tx);
      } else if (ch === "." && !fxLite) {
        const left = tileChar(rows, tx - 1, ty);
        const right = tileChar(rows, tx + 1, ty);
        const below = tileChar(rows, tx, ty + 1);
        if ((left === "#" || right === "#") && below !== "#" && ty > 5) {
          ctx.drawImage(glowStamp(), x, y);
        }
      } else if (ch === "v") {
        drawVent(ctx, x, y, t, ty);
      } else if (ch === "^") {
        drawSpikes(ctx, x, y, t, tx, ty);
      } else if (ch === "_") {
        drawRail(ctx, x, y, t, theme, tx);
      } else if (ch === "&") {
        drawPlinth(ctx, x, y, t, theme);
      } else if (ch === "'") {
        drawTorch(ctx, x, y, t, theme, tx);
      } else if (ch === ";") {
        drawLantern(ctx, x, y, t, theme, tx);
      } else if (ch === "\"") {
        drawBanner(ctx, x, y, t, theme, tx);
      } else if (ch === ",") {
        drawDrip(ctx, x, y, t, theme, tx);
      } else if (ch === "?") {
        drawShard(ctx, x, y, t, theme, tx);
      } else if (ch === "|") {
        drawLaser(ctx, x, y, t, tx);
      } else if (ch === "F") {
        drawCaseFont(ctx, x, y, t);
      } else if (ch === "/" || ch === "\\") {
        drawConveyor(ctx, x, y, t, ch === "/");
      } else if (ch === "T") {
        drawBounce(ctx, x, y, t, tx);
      } else if (ch === ":") {
        drawFan(ctx, x, y, t, tx);
      }
      // ` ) S g are drawn from solids so lifts/saws track their motion.
    }
  }
}

export function drawToys(
  ctx: CanvasRenderingContext2D,
  solids: Solid[],
  camX: number,
  camY: number,
  t: number,
  theme: ThemeId,
) {
  for (const s of solids) {
    if (s.broken && s.type === "blink") {
      ctx.save();
      ctx.globalAlpha = 0.16;
      drawBlink(ctx, s.x - camX, s.y - camY - 28, t, theme);
      ctx.restore();
      continue;
    }
    if (s.broken) continue;
    const x = s.x - camX;
    const y = s.y - camY;
    if (x + s.w < -16 || x > VIEW_W + 16 || y + s.h < -16 || y > VIEW_H + 16) continue;
    if (s.type === "lift") drawLift(ctx, x, y, t, theme);
    else if (s.type === "blink") drawBlink(ctx, x, y, t, theme);
    else if (s.type === "saw") drawSaw(ctx, x, y, t);
    else if (s.type === "geyser") drawGeyser(ctx, x, y, t, s);
  }
}

function drawLift(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, theme: ThemeId) {
  if (blitArt(ctx, "movers", "lift", x - 4, y - 8, TILE + 8, 24, t)) return;
  const c = inkOf(theme);
  ctx.fillStyle = "#1a1410";
  ctx.fillRect(x, y, TILE, 12);
  ctx.fillStyle = c.a;
  ctx.fillRect(x, y, TILE, 4);
  ctx.fillStyle = c.b;
  ctx.fillRect(x + 2, y + 1, TILE - 4, 2);
  ctx.fillStyle = "#5ee0c0";
  ctx.globalAlpha = 0.45 + Math.sin(t * 4) * 0.15;
  ctx.fillRect(x + 18, y - 6, 12, 6);
  ctx.globalAlpha = 1;
}

function drawBlink(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, theme: ThemeId) {
  if (blitArt(ctx, "movers", "blink", x - 4, y - 8, TILE + 8, 24, t)) return;
  const c = inkOf(theme);
  const pulse = 0.45 + Math.sin(t * 6) * 0.25;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = c.b;
  ctx.fillRect(x + 2, y, TILE - 4, 10);
  ctx.strokeStyle = "#5ee0c0";
  ctx.strokeRect(x + 2, y, TILE - 4, 10);
  ctx.restore();
}

function drawSaw(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  if (blitArt(ctx, "hazards", "saw", x - 4, y - 8, TILE + 8, TILE, t)) return;
  const cx = x + TILE / 2;
  const cy = y + 12;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(t * 8);
  ctx.fillStyle = "#2a1c18";
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d45a4a";
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 12, Math.sin(a) * 12);
    ctx.lineTo(Math.cos(a + 0.18) * 20, Math.sin(a + 0.18) * 20);
    ctx.lineTo(Math.cos(a + 0.36) * 12, Math.sin(a + 0.36) * 12);
    ctx.fill();
  }
  ctx.fillStyle = "#e8d48a";
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGeyser(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, s: Solid) {
  if (blitArt(ctx, "movers", "geyser", x - 8, y, TILE, TILE, t)) return;
  const cycle = (t + (s.phase ?? 0)) % 2.0;
  const hot = cycle < 0.7;
  ctx.fillStyle = "#3a2a18";
  ctx.fillRect(x + 6, y + 32, 20, 12);
  ctx.fillStyle = "#e8d48a";
  ctx.fillRect(x + 8, y + 34, 16, 3);
  if (hot) {
    const h = 20 + Math.sin(t * 18) * 6;
    ctx.fillStyle = `rgba(94,224,192,${0.35 + Math.sin(t * 12) * 0.15})`;
    ctx.fillRect(x + 10, y + 32 - h, 12, h);
    ctx.fillStyle = "rgba(232,236,232,0.35)";
    ctx.fillRect(x + 13, y + 28 - h, 6, 8);
  } else {
    ctx.fillStyle = "rgba(94,224,192,0.16)";
    ctx.fillRect(x + 12, y + 18, 8, 14);
  }
}

function drawBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tx: number,
  ty: number,
  theme: ThemeId,
  brk: boolean,
  t: number,
  top: boolean,
) {
  if (blitArt(ctx, "tiles", `solid-${theme}`, x, y, TILE, TILE)) {
    if (top) {
      ctx.fillStyle = "rgba(232,212,138,0.28)";
      ctx.fillRect(x, y, TILE, 4);
    }
    if (brk) paintBreak(ctx, x, y, tx, t);
    return;
  }
  const stamp = (tx * 13 + ty * 7) % 6;
  const key = `${theme}|${top ? 1 : 0}|${stamp}`;
  const sheet = cachedTile(key, (g) => paintBlock(g, 0, 0, tx, ty, theme, stamp, top));
  ctx.drawImage(sheet, x, y);
  if (brk) paintBreak(ctx, x, y, tx, t);
}

function paintBreak(ctx: CanvasRenderingContext2D, x: number, y: number, tx: number, t: number) {
  ctx.strokeStyle = "#5ee0c0";
  ctx.globalAlpha = 0.55 + Math.sin(t * 6 + tx) * 0.2;
  ctx.strokeRect(x + 6, y + 6, TILE - 12, TILE - 12);
  ctx.beginPath();
  ctx.moveTo(x + 10, y + 14);
  ctx.lineTo(x + 22, y + 28);
  ctx.lineTo(x + 34, y + 18);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function paintBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tx: number,
  ty: number,
  theme: ThemeId,
  stamp: number,
  top: boolean,
) {
  if (theme === "hub") {
    ctx.fillStyle = "#2c2436";
    ctx.fillRect(x, y, TILE + 0.5, TILE + 0.5);
    const g = ctx.createLinearGradient(x, y, x, y + TILE);
    g.addColorStop(0, "#4a3f54");
    g.addColorStop(1, "#261e30");
    ctx.fillStyle = g;
    ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
    if (top) {
      ctx.fillStyle = "#c9b896";
      ctx.fillRect(x, y, TILE, 7);
      ctx.fillStyle = "#efe4c8";
      ctx.fillRect(x + 2, y + 1, TILE - 6, 2);
      ctx.fillStyle = "#8a7048";
      for (let i = 0; i < 4; i++) ctx.fillRect(x + 8 + i * 10, y + 3, 3, 3);
    }
    if (!fxLite) {
      ctx.fillStyle = "rgba(201,184,150,0.18)";
      ctx.font = "italic 22px 'Cormorant Garamond', serif";
      ctx.fillText(["e", "s", "r", "n", "c", "a"][stamp], x + 14, y + 32);
    }
    if (stamp === 0) {
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.moveTo(x + 8, y + 18);
      ctx.lineTo(x + 36, y + 40);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(20,14,24,0.5)";
    ctx.fillRect(x, y + TILE - 6, TILE, 6);
  } else if (theme === "fort") {
    ctx.fillStyle = "#2a323c";
    ctx.fillRect(x, y, TILE + 0.5, TILE + 0.5);
    ctx.fillStyle = "#3e4a56";
    ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
    if (top) {
      ctx.fillStyle = "#b08a4a";
      ctx.fillRect(x, y, TILE, 6);
      ctx.fillStyle = "#e0c888";
      ctx.fillRect(x + 4, y + 1, TILE - 8, 2);
    }
    ctx.strokeStyle = "rgba(176,138,74,0.35)";
    ctx.strokeRect(x + 8, y + 10, TILE - 16, TILE - 20);
    ctx.fillStyle = "#1c2228";
    ctx.fillRect(x + 6, y + 6, 5, 5);
    ctx.fillRect(x + TILE - 12, y + 6, 5, 5);
    ctx.fillRect(x + 6, y + TILE - 12, 5, 5);
    ctx.fillRect(x + TILE - 12, y + TILE - 12, 5, 5);
  } else if (theme === "vault") {
    ctx.fillStyle = "#141c24";
    ctx.fillRect(x, y, TILE + 0.5, TILE + 0.5);
    ctx.fillStyle = "#1c2832";
    ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
    if (top) {
      ctx.fillStyle = "#8ec8d4";
      ctx.fillRect(x, y, TILE, 5);
      ctx.fillStyle = "#d8eef0";
      ctx.fillRect(x + 4, y + 1, TILE - 10, 2);
    }
    ctx.strokeStyle = "rgba(142,200,212,0.25)";
    ctx.strokeRect(x + 10, y + 12, TILE - 20, TILE - 22);
    ctx.fillStyle = "rgba(94,224,192,0.12)";
    ctx.font = "italic 16px 'Cormorant Garamond', serif";
    ctx.fillText("&", x + 16, y + 32);
    ctx.fillStyle = "#0c1418";
    ctx.fillRect(x, y + TILE - 6, TILE, 6);
  } else if (theme === "abyss") {
    ctx.fillStyle = "#0c1016";
    ctx.fillRect(x, y, TILE + 0.5, TILE + 0.5);
    ctx.fillStyle = "#161c24";
    ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
    if (top) {
      ctx.fillStyle = "#5c6a74";
      ctx.fillRect(x, y, TILE, 4);
    }
    ctx.fillStyle = "rgba(122,139,150,0.2)";
    ctx.fillRect(x + 8, y + 14, 6, 18);
    ctx.fillRect(x + 22, y + 10, 4, 22);
    ctx.fillStyle = "#080c10";
    ctx.fillRect(x, y + TILE - 6, TILE, 6);
  } else if (theme === "spire") {
    ctx.fillStyle = "#1a1620";
    ctx.fillRect(x, y, TILE + 0.5, TILE + 0.5);
    ctx.fillStyle = "#262030";
    ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
    if (top) {
      ctx.fillStyle = "#5ee0c0";
      ctx.fillRect(x, y, TILE, 4);
      ctx.fillStyle = "#9af8de";
      ctx.fillRect(x + 6, y + 1, TILE - 14, 1.5);
    }
    ctx.strokeStyle = "rgba(94,224,192,0.28)";
    ctx.beginPath();
    ctx.moveTo(x + 24, y + 8);
    ctx.lineTo(x + 24, y + TILE - 8);
    ctx.stroke();
    ctx.fillStyle = "#100e16";
    ctx.fillRect(x, y + TILE - 6, TILE, 6);
  } else if (theme === "canal") {
    ctx.fillStyle = "#14241c";
    ctx.fillRect(x, y, TILE + 0.5, TILE + 0.5);
    const g = ctx.createLinearGradient(x, y, x, y + TILE);
    g.addColorStop(0, "#2a4a3c");
    g.addColorStop(1, "#163028");
    ctx.fillStyle = g;
    ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
    if (top) {
      ctx.fillStyle = "#3d8a72";
      ctx.fillRect(x, y, TILE, 5);
      ctx.fillStyle = "#7fd0b8";
      ctx.fillRect(x + 4, y + 1, TILE - 10, 2);
    }
    ctx.fillStyle = "rgba(10,20,16,0.45)";
    ctx.fillRect(x + 8, y + 14, TILE - 16, 10);
    ctx.strokeStyle = "rgba(94,224,192,0.2)";
    ctx.strokeRect(x + 10, y + 18, TILE - 20, 12);
    if (stamp === 2) {
      ctx.fillStyle = "rgba(94,224,192,0.28)";
      ctx.font = "italic 14px 'Cormorant Garamond', serif";
      ctx.fillText("g", x + 18, y + 34);
    }
    ctx.fillStyle = "#0c1814";
    ctx.fillRect(x, y + TILE - 6, TILE, 6);
  } else if (theme === "coil") {
    ctx.fillStyle = "#1a1020";
    ctx.fillRect(x, y, TILE + 0.5, TILE + 0.5);
    ctx.fillStyle = "#2c1838";
    ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
    if (top) {
      ctx.fillStyle = "#c46ad4";
      ctx.fillRect(x, y, TILE, 4);
      ctx.fillStyle = "#e8a0f0";
      ctx.fillRect(x + 6, y + 1, TILE - 14, 1.5);
    }
    ctx.strokeStyle = "rgba(196,106,212,0.35)";
    ctx.beginPath();
    ctx.arc(x + 24, y + 26, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#120814";
    ctx.fillRect(x + 8, y + 12, 5, 5);
    ctx.fillRect(x + TILE - 14, y + 12, 5, 5);
    ctx.fillStyle = "#140c1a";
    ctx.fillRect(x, y + TILE - 6, TILE, 6);
  } else if (theme === "orbit") {
    ctx.fillStyle = "#12101c";
    ctx.fillRect(x, y, TILE + 0.5, TILE + 0.5);
    ctx.fillStyle = "#1c1830";
    ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
    if (top) {
      ctx.fillStyle = "#e8d48a";
      ctx.fillRect(x, y, TILE, 4);
    }
    ctx.strokeStyle = "rgba(232,212,138,0.35)";
    ctx.beginPath();
    ctx.arc(x + 24, y + 24, 11, 0.2, Math.PI * 1.8);
    ctx.stroke();
    ctx.fillStyle = "#0c0a14";
    ctx.fillRect(x, y + TILE - 6, TILE, 6);
  } else if (theme === "glacier") {
    ctx.fillStyle = "#1a2a34";
    ctx.fillRect(x, y, TILE + 0.5, TILE + 0.5);
    ctx.fillStyle = "#2a4450";
    ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
    if (top) {
      ctx.fillStyle = "#c8e8f4";
      ctx.fillRect(x, y, TILE, 5);
      ctx.fillStyle = "#e8f6fc";
      ctx.fillRect(x + 4, y + 1, TILE - 10, 2);
    }
    ctx.fillStyle = "rgba(200,232,244,0.12)";
    ctx.fillRect(x + 10, y + 14, 6, 18);
    ctx.fillStyle = "#122028";
    ctx.fillRect(x, y + TILE - 6, TILE, 6);
  } else if (theme === "remainder") {
    ctx.fillStyle = "#1a100c";
    ctx.fillRect(x, y, TILE + 0.5, TILE + 0.5);
    ctx.fillStyle = "#2a1810";
    ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
    if (top) {
      ctx.fillStyle = "#e07040";
      ctx.fillRect(x, y, TILE, 4);
    }
    ctx.fillStyle = "rgba(232,212,138,0.2)";
    ctx.font = "700 16px 'Source Sans 3', sans-serif";
    ctx.fillText("%", x + 16, y + 32);
    ctx.fillStyle = "#120c08";
    ctx.fillRect(x, y + TILE - 6, TILE, 6);
  } else {
    ctx.fillStyle = "#2a333c";
    ctx.fillRect(x, y, TILE + 0.5, TILE + 0.5);
    const g = ctx.createLinearGradient(x, y, x, y + TILE);
    g.addColorStop(0, "#4a5660");
    g.addColorStop(0.45, "#3a444c");
    g.addColorStop(1, "#2a3238");
    ctx.fillStyle = g;
    ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
    if (top) {
      ctx.fillStyle = "#c4b08a";
      ctx.fillRect(x, y, TILE, 5);
      ctx.fillStyle = "#efe0c0";
      ctx.fillRect(x + 3, y + 1, TILE - 8, 2);
      ctx.fillStyle = "rgba(232,236,240,0.18)";
      ctx.fillRect(x, y - 3, TILE, 3);
    }
    const lit = stamp !== 4;
    ctx.fillStyle = lit ? "rgba(232, 210, 150, 0.28)" : "rgba(18, 22, 26, 0.45)";
    ctx.fillRect(x + 8, y + 12, 12, 14);
    ctx.fillRect(x + 26, y + 12, 12, 14);
    ctx.strokeStyle = "rgba(12,14,16,0.45)";
    ctx.strokeRect(x + 8, y + 12, 12, 14);
    ctx.strokeRect(x + 26, y + 12, 12, 14);
    if (stamp === 1) {
      ctx.fillStyle = "rgba(212,90,74,0.45)";
      ctx.font = "700 13px 'Source Sans 3', sans-serif";
      ctx.fillText(String((tx + ty) % 10), x + 18, y + 40);
    }
    ctx.fillStyle = "#1a2026";
    ctx.fillRect(x, y + TILE - 6, TILE, 6);
    if (top && stamp % 2 === 0) {
      ctx.strokeStyle = "rgba(180,196,208,0.35)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x + 6, y + TILE);
      ctx.quadraticCurveTo(x + 18, y + TILE + 8, x + 30, y + TILE + 4);
      ctx.stroke();
    }
  }
}

function drawSerifShelf(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, theme: string, tx = 0) {
  if (blitArt(ctx, "movers", "shelf", x, y, TILE, TILE, t)) return;
  const pulse = 0.7 + animWave(t, tx, 3, 0.7) * 0.15;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = theme === "hub" ? "#c9b896" : theme === "fort" ? "#b08a4a" : theme === "coil" ? "#c46ad4" : theme === "canal" ? "#5ee0c0" : "#c4b08a";
  ctx.shadowColor = theme === "hub" ? "#c9b896" : theme === "fort" ? "#b08a4a" : theme === "coil" ? "#c46ad4" : "#d8c8a0";
  ctx.shadowBlur = 10;
  ctx.fillRect(x + 4, y + 8, TILE - 8, 5);
  ctx.shadowBlur = 0;
  ctx.fillRect(x, y + 6, 6, 10);
  ctx.fillRect(x + TILE - 6, y + 6, 6, 10);
  ctx.globalAlpha = 0.3;
  ctx.fillRect(x + 6, y + 14, TILE - 12, 4);
  ctx.restore();
}

function drawCrumble(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, theme: string, tx = 0) {
  if (blitArt(ctx, "movers", "crumble", x, y, TILE, TILE, t)) return;
  ctx.save();
  ctx.globalAlpha = 0.75 + animWave(t, tx, 6) * 0.1;
  ctx.fillStyle = theme === "coil" ? "#6a3a78" : "#6a5a40";
  ctx.fillRect(x + 2, y + 8, TILE - 4, 5);
  ctx.fillStyle = "#2a2018";
  ctx.fillRect(x + 8, y + 8, 4, 5);
  ctx.fillRect(x + 22, y + 8, 6, 5);
  ctx.strokeStyle = "rgba(232,200,150,0.4)";
  ctx.beginPath();
  ctx.moveTo(x + 6, y + 8);
  ctx.lineTo(x + 14, y + 13);
  ctx.lineTo(x + 28, y + 8);
  ctx.stroke();
  ctx.restore();
}

function drawSluice(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, theme: string, tx = 0) {
  if (blitArt(ctx, "hazards", "sluice", x, y, TILE, TILE, t)) return;
  const ink =
    theme === "coil"
      ? "196,106,212"
      : theme === "canal"
        ? "45,180,150"
        : theme === "glacier"
          ? "120,180,210"
          : "45,140,110";
  // Deep residual ink
  ctx.fillStyle = `rgba(${ink},0.62)`;
  ctx.fillRect(x, y + 18, TILE, TILE - 18);
  // Surface film
  ctx.fillStyle = `rgba(${ink},0.32)`;
  ctx.fillRect(x, y + 10, TILE, 12);
  // Moving surface wave
  ctx.strokeStyle = `rgba(232,236,232,${0.18 + animWave(t, tx, 3.2, 0.7) * 0.1})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y + 20 + animWave(t, tx, 2.6, 0.8) * 2.5);
  ctx.quadraticCurveTo(x + 16, y + 14 + Math.sin(t * 3.1) * 2, x + 32, y + 21);
  ctx.quadraticCurveTo(x + 40, y + 24, x + TILE, y + 19 + Math.cos(t * 2.4 + tx) * 2);
  ctx.stroke();
  // Occasional ink bubble
  const bx = x + 10 + ((animWave(t, tx, 1.7) + 1) * 0.5) * (TILE - 20);
  const by = y + 22 + animWave(t, tx, 4, 0.3) * 6;
  ctx.fillStyle = `rgba(232,236,232,${0.12 + animWave(t, tx, 5) * 0.06})`;
  ctx.beginPath();
  ctx.arc(bx, by, 2.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawVent(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, ty = 0) {
  if (blitArt(ctx, "movers", "vent", x, y, TILE, TILE, t)) return;
  ctx.fillStyle = "rgba(10,20,24,0.55)";
  ctx.fillRect(x + 6, y, TILE - 12, TILE);
  ctx.strokeStyle = "rgba(94,224,192,0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 8, y);
  ctx.lineTo(x + 8, y + TILE);
  ctx.moveTo(x + TILE - 8, y);
  ctx.lineTo(x + TILE - 8, y + TILE);
  ctx.stroke();
  ctx.strokeStyle = "rgba(94,224,192,0.2)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 8 + i * 12);
    ctx.lineTo(x + TILE - 10, y + 8 + i * 12);
    ctx.stroke();
  }
  ctx.fillStyle = `rgba(94,224,192,${0.15 + animWave(t, ty, 5) * 0.1})`;
  ctx.fillRect(x + 14, y + ((t * 40 + ty * 13) % TILE), 8, 10);
}

function drawLaser(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, tx: number) {
  if (blitArt(ctx, "hazards", "laser", x, y, TILE, TILE, t)) return;
  const cycle = (t + tx * 0.37) % 1.5;
  const hot = cycle < 0.5;
  const warn = !hot && cycle > 1.22;
  ctx.save();
  ctx.globalAlpha = hot ? 0.9 : warn ? 0.45 : 0.16;
  ctx.strokeStyle = hot ? "#d45a4a" : warn ? "#e8d48a" : "#7a8b96";
  ctx.shadowColor = hot ? "#d45a4a" : warn ? "#e8d48a" : "transparent";
  ctx.shadowBlur = hot ? 14 : warn ? 8 : 0;
  ctx.lineWidth = hot ? 3.5 : warn ? 2.5 : 1.6;
  ctx.beginPath();
  ctx.moveTo(x + 24, y + 2);
  ctx.lineTo(x + 24, y + TILE - 2);
  ctx.stroke();
  if (hot) {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#d45a4a";
    ctx.fillRect(x + 20, y, 8, TILE);
  } else if (warn) {
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#e8d48a";
    ctx.fillRect(x + 21, y, 6, TILE);
  }
  ctx.restore();
}

function drawConveyor(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, right: boolean) {
  if (blitArt(ctx, "movers", "conveyor", x, y, TILE, TILE, t)) return;
  ctx.fillStyle = "#1a2228";
  ctx.fillRect(x, y + 28, TILE, 12);
  ctx.fillStyle = "#e8d48a";
  ctx.fillRect(x, y + 28, TILE, 3);
  const dir = right ? 1 : -1;
  ctx.fillStyle = "#5ee0c0";
  for (let i = 0; i < 4; i++) {
    const ax = x + ((i * 14 + t * 40 * dir) % TILE + TILE) % TILE;
    ctx.beginPath();
    ctx.moveTo(ax, y + 32);
    ctx.lineTo(ax + dir * 6, y + 36);
    ctx.lineTo(ax, y + 40);
    ctx.fill();
  }
}

function drawBounce(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, tx = 0) {
  if (blitArt(ctx, "movers", "bounce", x, y, TILE, TILE, t)) return;
  const pop = 1 + animWave(t, tx, 8) * 0.08;
  ctx.fillStyle = "#2a2418";
  ctx.fillRect(x + 4, y + 30, TILE - 8, 10);
  ctx.fillStyle = "#e8d48a";
  ctx.beginPath();
  ctx.ellipse(x + TILE / 2, y + 30, 16 * pop, 7 * pop, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#5ee0c0";
  ctx.fillRect(x + 18, y + 24, 12, 4);
}

function drawFan(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, tx = 0) {
  if (blitArt(ctx, "movers", "fan", x, y, TILE, TILE, t)) return;
  ctx.save();
  ctx.globalAlpha = 0.22 + animWave(t, tx, 10) * 0.08;
  ctx.fillStyle = "#8ec8d4";
  ctx.fillRect(x + 18, y, 12, TILE);
  ctx.strokeStyle = "#5ee0c0";
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 4; i++) {
    const yy = y + ((t * 80 + i * 12) % TILE);
    ctx.beginPath();
    ctx.moveTo(x + 10, yy);
    ctx.lineTo(x + 24, yy - 6);
    ctx.lineTo(x + 38, yy);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSpikes(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, tx = 0, ty = 0) {
  if (blitArt(ctx, "hazards", "spike", x, y, TILE, TILE, t)) return;
  // Match engine pulse rule: ~30% of teeth retract on a 1.8s cycle.
  const pulse = ((tx * 17 + ty * 31) % 10) < 3;
  let extend = 1;
  if (pulse) {
    const phase = tx * 0.41 + ty * 0.17;
    const cycle = (t + phase) % 1.8;
    // Smooth rise/fall so it reads as mechanical lizard-tech rather than a blink.
    if (cycle < 0.2) extend = cycle / 0.2;
    else if (cycle < 1.0) extend = 1;
    else if (cycle < 1.25) extend = 1 - (cycle - 1.0) / 0.25;
    else extend = 0;
  }
  const tipY = y + TILE - (TILE - 10) * extend;
  const midY = y + TILE - (TILE - 14) * extend;
  for (let i = 0; i < 3; i++) {
    const ox = x + 4 + i * 14;
    const wobble = pulse ? 0 : Math.sin(t * 8 + i) * 1.5;
    ctx.fillStyle = pulse && extend < 0.35 ? "#3a2420" : "#6a2e2a";
    ctx.beginPath();
    ctx.moveTo(ox, y + TILE);
    ctx.lineTo(ox + 7, tipY + wobble);
    ctx.lineTo(ox + 14, y + TILE);
    ctx.fill();
    if (extend > 0.2) {
      ctx.fillStyle = "#d45a4a";
      ctx.beginPath();
      ctx.moveTo(ox + 4, y + TILE);
      ctx.lineTo(ox + 7, midY);
      ctx.lineTo(ox + 10, y + TILE);
      ctx.fill();
    }
  }
}

function inkOf(theme: ThemeId) {
  if (theme === "coil") return { a: "#c46ad4", b: "#e8a0f0", dim: "#2c1838" };
  if (theme === "canal") return { a: "#5ee0c0", b: "#7fd0b8", dim: "#163028" };
  if (theme === "fort") return { a: "#b08a4a", b: "#e0c888", dim: "#2a323c" };
  if (theme === "hub") return { a: "#c9b896", b: "#efe4c8", dim: "#2c2436" };
  if (theme === "glacier") return { a: "#c8e8f4", b: "#e8f6fc", dim: "#1a2a34" };
  if (theme === "orbit") return { a: "#e8d48a", b: "#f4e8b0", dim: "#1c1830" };
  if (theme === "remainder") return { a: "#e07040", b: "#e8d48a", dim: "#2a1810" };
  if (theme === "vault") return { a: "#8ec8d4", b: "#d8eef0", dim: "#141c24" };
  return { a: "#5ee0c0", b: "#e8d48a", dim: "#1a2228" };
}

function drawRail(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, theme: ThemeId, tx = 0) {
  if (blitArt(ctx, "movers", "rail", x, y, TILE, TILE, t)) return;
  const c = inkOf(theme);
  ctx.fillStyle = c.dim;
  ctx.fillRect(x, y + 34, TILE, 6);
  ctx.fillStyle = c.a;
  ctx.fillRect(x, y + 34, TILE, 2);
  ctx.fillStyle = c.b;
  ctx.globalAlpha = 0.55 + animWave(t, tx, 4) * 0.15;
  ctx.fillRect(x + 8, y + 35, 8, 2);
  ctx.globalAlpha = 1;
}

function drawPlinth(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, theme: ThemeId) {
  if (blitArt(ctx, "movers", "plinth", x, y, TILE, TILE, t)) return;
  const c = inkOf(theme);
  ctx.fillStyle = c.dim;
  ctx.fillRect(x + 8, y + 18, TILE - 16, TILE - 18);
  ctx.fillStyle = c.a;
  ctx.fillRect(x + 6, y + 14, TILE - 12, 6);
  ctx.strokeStyle = c.b;
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x + 16, y + 28);
  ctx.quadraticCurveTo(x + 24, y + 22 + Math.sin(t * 2) * 2, x + 32, y + 28);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawTorch(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, theme: ThemeId, tx = 0) {
  if (theme === "fort" && blitArt(ctx, "props", "fort-brazier", x, y, TILE, TILE, t)) return;
  if (blitArt(ctx, "props", "torch", x, y, TILE, TILE, t)) return;
  const c = inkOf(theme);
  ctx.fillStyle = c.dim;
  ctx.fillRect(x + 21, y + 22, 6, 18);
  ctx.fillStyle = c.a;
  ctx.fillRect(x + 19, y + 20, 10, 4);
  const flicker = 0.75 + animWave(t, tx, 11) * 0.2;
  ctx.save();
  ctx.globalAlpha = flicker;
  ctx.fillStyle = "#e8d48a";
  ctx.beginPath();
  ctx.moveTo(x + 24, y + 6);
  ctx.lineTo(x + 18, y + 20);
  ctx.lineTo(x + 30, y + 20);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff6d0";
  ctx.beginPath();
  ctx.moveTo(x + 24, y + 10);
  ctx.lineTo(x + 21, y + 20);
  ctx.lineTo(x + 27, y + 20);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawLantern(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, theme: ThemeId, tx = 0) {
  if (theme === "coil" && blitArt(ctx, "props", "coil-spark", x, y, TILE, TILE, t)) return;
  if (theme === "vault" && blitArt(ctx, "props", "vault-lamp", x, y, TILE, TILE, t)) return;
  if (blitArt(ctx, "props", "lantern", x, y, TILE, TILE, t)) return;
  const c = inkOf(theme);
  const sway = animWave(t, tx, 1.6, 0.7) * 4;
  ctx.save();
  ctx.translate(x + 24 + sway, y);
  ctx.strokeStyle = c.a;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 14);
  ctx.stroke();
  ctx.fillStyle = c.dim;
  ctx.fillRect(-8, 14, 16, 18);
  ctx.strokeStyle = c.b;
  ctx.strokeRect(-8, 14, 16, 18);
  ctx.fillStyle = `rgba(232,212,138,${0.35 + Math.sin(t * 5) * 0.12})`;
  ctx.fillRect(-6, 16, 12, 12);
  ctx.restore();
}

function drawBanner(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, theme: ThemeId, tx = 0) {
  if (blitArt(ctx, "props", "banner", x, y, TILE, TILE, t)) return;
  const c = inkOf(theme);
  const wave = animWave(t, tx, 2) * 3;
  ctx.fillStyle = c.dim;
  ctx.fillRect(x + 8, y, TILE - 16, 4);
  ctx.fillStyle = c.a;
  ctx.beginPath();
  ctx.moveTo(x + 10, y + 4);
  ctx.lineTo(x + TILE - 10, y + 4);
  ctx.lineTo(x + TILE - 12 + wave, y + 38);
  ctx.lineTo(x + 24, y + 44);
  ctx.lineTo(x + 12 - wave, y + 38);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = c.b;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(x + 24, y + 8);
  ctx.lineTo(x + 24 + wave * 0.4, y + 36);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawDrip(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, theme: ThemeId, tx = 0) {
  if (theme === "canal" && blitArt(ctx, "props", "canal-pipe", x, y, TILE, TILE, t)) return;
  if (theme === "glacier" && blitArt(ctx, "props", "glacier-icicle", x, y, TILE, TILE, t)) return;
  if (blitArt(ctx, "props", "drip", x, y, TILE, TILE, t)) return;
  const c = inkOf(theme);
  const fall = ((t * 40 + tx * 13) % (TILE + 20)) - 4;
  ctx.fillStyle = c.a;
  ctx.fillRect(x + 22, y, 4, 8);
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.ellipse(x + 24, y + 10 + fall, 3, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawShard(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, theme: ThemeId, tx = 0) {
  if (theme === "remainder" && blitArt(ctx, "props", "remainder-glyph", x, y, TILE, TILE, t)) return;
  if (blitArt(ctx, "props", "shard", x, y, TILE, TILE, t)) return;
  const c = inkOf(theme);
  ctx.save();
  ctx.translate(x + 24, y + 24);
  ctx.rotate(t * 0.6 + tx);
  ctx.strokeStyle = c.a;
  ctx.shadowColor = c.b;
  ctx.shadowBlur = 8;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(8, 0);
  ctx.lineTo(0, 10);
  ctx.lineTo(-8, 0);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawCaseFont(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  ctx.save();
  ctx.translate(x + 24, y + 24);
  ctx.rotate(Math.sin(t * 2) * 0.05);
  ctx.strokeStyle = "#e8ece8";
  ctx.shadowColor = "#5ee0c0";
  ctx.shadowBlur = 12;
  ctx.lineWidth = 2;
  ctx.strokeRect(-14, -16, 28, 32);
  ctx.fillStyle = "#5ee0c0";
  ctx.font = "italic 16px 'Cormorant Garamond', serif";
  ctx.textAlign = "center";
  ctx.fillText("Aa", 0, 4);
  ctx.restore();
}

export function drawMarkers(
  ctx: CanvasRenderingContext2D,
  markers: Marker[],
  camX: number,
  camY: number,
  t: number,
) {
  for (const m of markers) {
    if (m.kind !== "down") continue;
    const x = m.x + TILE / 2 - camX;
    const y = m.y + TILE / 2 - camY;
    if (x < -40 || x > VIEW_W + 40) continue;
    ctx.save();
    ctx.translate(x, y + Math.sin(t * 4 + m.x * 0.02) * 3);
    const a = 0.45 + Math.sin(t * 5) * 0.2;
    ctx.fillStyle = `rgba(94,224,192,${a})`;
    ctx.strokeStyle = `rgba(232,236,232,${a})`;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(-8, -6);
    ctx.lineTo(0, 8);
    ctx.lineTo(8, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function inkPalette(letter: LetterId, capital: boolean) {
  const k = KITS[letter] ?? KITS.c;
  if (letter === "c") {
    return {
      glow: capital ? "#9af8de" : k.glow,
      core: k.core,
      deep: k.deep,
    };
  }
  return { glow: k.glow, core: k.core, deep: k.deep };
}

function emberEye(ctx: CanvasRenderingContext2D, x: number, y: number, glow: string, t = 0, seed = 0) {
  const shut = ((t * 0.58 + seed * 1.17) % 3.35) > 3.18;
  if (shut) {
    ctx.strokeStyle = glow;
    ctx.lineWidth = 1.35;
    ctx.beginPath();
    ctx.moveTo(x - 2.6, y);
    ctx.quadraticCurveTo(x, y + 1.2, x + 2.6, y);
    ctx.stroke();
    return;
  }
  ctx.fillStyle = "#f4f6f2";
  ctx.beginPath();
  ctx.ellipse(x, y, 2.7, 2.35, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x + 0.65, y + 0.15, 1.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#07080c";
  ctx.beginPath();
  ctx.arc(x + 0.95, y + 0.15, 0.58, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(x + 1.35, y - 0.55, 0.55, 0, Math.PI * 2);
  ctx.fill();
}

function orbitMotes(ctx: CanvasRenderingContext2D, t: number, glow: string, r: number, run = 0) {
  if (run > 0.45) return;
  ctx.fillStyle = glow;
  const n = 3;
  for (let i = 0; i < n; i++) {
    const a = t * 1.4 + i * ((Math.PI * 2) / n);
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r, Math.sin(a * 1.05) * (r * 0.62), 1.05, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function strokeInk(
  ctx: CanvasRenderingContext2D,
  glow: string,
  core: string,
  width: number,
  path: () => void,
  _blur = 0,
) {
  ctx.shadowBlur = 0;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = glow;
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = width + 2.4;
  ctx.beginPath();
  path();
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = core;
  ctx.lineWidth = width;
  ctx.beginPath();
  path();
  ctx.stroke();
}

function inkStride(
  ctx: CanvasRenderingContext2D,
  gait: number,
  run: number,
  yBase: number,
  glow: string,
  core: string,
) {
  const amp = 0.12 + run * 0.88;
  const foot = (side: number, phase: number) => {
    const lift = Math.max(0, Math.sin(phase)) * 5.5 * amp;
    const slide = -Math.cos(phase) * 4.2 * amp;
    const x0 = side * 4.5 + slide;
    ctx.beginPath();
    ctx.moveTo(x0, yBase - 2 - lift);
    ctx.quadraticCurveTo(x0 + side * 2, yBase + 1 - lift * 0.35, x0 + side * 5 + 1, yBase + 3.2 - lift * 0.15);
    ctx.stroke();
  };
  ctx.lineCap = "round";
  ctx.strokeStyle = glow;
  ctx.lineWidth = 2.6;
  foot(-1, gait);
  foot(1, gait + Math.PI);
  ctx.strokeStyle = core;
  ctx.lineWidth = 1.5;
  foot(-1, gait);
  foot(1, gait + Math.PI);
}

type Motion = { vx?: number; vy?: number; grounded?: boolean; special?: number; melee?: number };

function poseOf(t: number, squash: number, motion: Motion) {
  const vx = motion.vx ?? 0;
  const vy = motion.vy ?? 0;
  const grounded = motion.grounded ?? true;
  const run = Math.min(1, Math.abs(vx) / 170);
  const gait = t * (5.2 + run * 3.6);
  const air = !grounded;
  const step = Math.sin(gait);
  const pass = Math.sin(gait * 2);
  const contact = grounded ? Math.abs(step) : 0;
  let sy = squash;
  if (air) sy *= vy < 0 ? 0.92 : 1.06;
  else sy *= 1 + contact * 0.035 * run;
  sy = Math.max(0.78, Math.min(1.18, sy));
  const lean = air
    ? Math.max(-0.14, Math.min(0.14, vx * 0.00045))
    : step * 0.042 * run;
  const bob = air
    ? (vy < 0 ? -1.2 : Math.min(3, vy * 0.004))
    : contact * (1.4 + run * 1.1);
  return { vx, vy, grounded, run, gait, air, step, pass, sy, lean, bob };
}

function drawScalesAlongArc(
  ctx: CanvasRenderingContext2D,
  r: number,
  a0: number,
  a1: number,
  thick: number,
  n: number,
  ridge: string,
  glow: string,
  spines: boolean,
) {
  for (let i = 1; i < n; i++) {
    const a = a0 + (a1 - a0) * (i / n);
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    ctx.strokeStyle = "rgba(8,20,16,0.55)";
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.arc(x, y, thick * 0.36, a - 1.1, a + 1.1);
    ctx.stroke();
    if (spines && i % 2 === 0) {
      const nx = Math.cos(a);
      const ny = Math.sin(a);
      ctx.strokeStyle = glow;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x + nx * thick * 0.15, y + ny * thick * 0.15);
      ctx.lineTo(x + nx * (thick * 0.72 + 2), y + ny * (thick * 0.72 + 2));
      ctx.stroke();
    }
    ctx.fillStyle = ridge;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.ellipse(x - Math.cos(a) * 2, y - Math.sin(a) * 2, 2.2, 1.4, a, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawWyrmHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rot: number,
  scale: number,
  glow: string,
  body: string,
  t: number,
  capital: boolean,
  tongue: boolean,
  lag = 0,
  bite = 0,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot + lag);
  ctx.scale(scale, scale);
  const shut = ((t * 0.52 + x * 0.02) % 3.15) > 2.98;
  const scan = (t * 2.4) % 1;
  ctx.fillStyle = "#1a2a24";
  ctx.beginPath();
  ctx.ellipse(-2, 0.6, 5.2, 4.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#8aa0aa";
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(-1, 0.4, 4.6, 0.4, Math.PI * 1.7);
  ctx.stroke();
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(3.4, 0.5, 10.6, 7, 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(10,18,14,0.45)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(1 + i * 1.6, -1 + i * 0.3, 7 - i, 4.4 - i * 0.4, 0.08, 0.4, 2.4);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(9.2, 2.1);
  ctx.rotate(0.18 + bite * 0.62 + Math.sin(t * 6) * 0.04);
  ctx.fillStyle = "#1c2c26";
  ctx.beginPath();
  ctx.moveTo(-3, -0.4);
  ctx.quadraticCurveTo(8, 3.4 + bite * 3.2, 15, 1.2);
  ctx.quadraticCurveTo(8, 7.2, -3, 3.4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#8aa0aa";
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(4 + i * 3.2, 1.2);
    ctx.lineTo(6 + i * 3.2, 4.4);
    ctx.lineTo(7.4 + i * 3.2, 1.4);
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(8.5, -4.6);
  ctx.quadraticCurveTo(17, -4.2, 23.5, -0.4 + bite);
  ctx.quadraticCurveTo(17, 3.6, 8.5, 4.8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#8aa0aa";
  ctx.lineWidth = 1.15;
  ctx.beginPath();
  ctx.moveTo(11, -3.2);
  ctx.lineTo(20, -0.6);
  ctx.stroke();
  ctx.fillStyle = glow;
  ctx.globalAlpha = 0.38;
  ctx.beginPath();
  ctx.ellipse(2.2, 2.4, 5.4, 2.3, 0.14, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#0c1012";
  roundRect(ctx, -1.2, -5.6, 10.4, 5.2, 1.4);
  ctx.fill();
  ctx.strokeStyle = glow;
  ctx.lineWidth = 1.05;
  ctx.stroke();
  if (shut) {
    ctx.strokeStyle = glow;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(0.2, -3);
    ctx.lineTo(7.6, -3);
    ctx.stroke();
  } else {
    ctx.fillStyle = "#3de8a8";
    ctx.beginPath();
    ctx.ellipse(3.4, -3, 3.3, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(3.8, -3, 1.7, 1.9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#07080c";
    ctx.beginPath();
    ctx.arc(4.1, -3, 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(232,236,232,${0.35 + scan * 0.5})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-0.6, -5.2 + scan * 4.6);
    ctx.lineTo(8.6, -5.2 + scan * 4.6);
    ctx.stroke();
  }
  ctx.fillStyle = "#07080c";
  ctx.fillRect(18.2, -0.6, 2.8, 1.35);
  ctx.strokeStyle = glow;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.moveTo(21.2, -0.1);
  ctx.lineTo(26 + Math.sin(t * 8) * 1.5, -0.1);
  ctx.stroke();
  ctx.globalAlpha = 1;
  if (capital) {
    const crest = Math.sin(t * 5) * 1.8;
    ctx.strokeStyle = "#8aa0aa";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-1, -7);
    ctx.lineTo(3, -15 + crest);
    ctx.lineTo(8, -10);
    ctx.moveTo(-3, -6);
    ctx.lineTo(-7, -14 - crest * 0.5);
    ctx.stroke();
    ctx.strokeStyle = glow;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  if (tongue) {
    const flick = Math.sin(t * 13.5) * 3.4;
    ctx.strokeStyle = glow;
    ctx.lineWidth = 1.35;
    ctx.beginPath();
    ctx.moveTo(20, 1.6);
    ctx.quadraticCurveTo(24 + flick * 0.25, 3.4, 28 + flick, 1.8);
    ctx.lineTo(32 + flick, -1.6);
    ctx.moveTo(28 + flick, 1.8);
    ctx.lineTo(32 + flick, 6.2);
    ctx.stroke();
  }
  ctx.restore();
}

function dashCircuit(ctx: CanvasRenderingContext2D, t: number, color: string, width: number, path: () => void) {
  ctx.save();
  ctx.setLineDash([5, 7]);
  ctx.lineDashOffset = -t * 32;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.globalAlpha = 0.55 + Math.sin(t * 6) * 0.2;
  ctx.beginPath();
  path();
  ctx.stroke();
  ctx.restore();
}

function energyCore(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, t: number, col: string) {
  const pulse = 0.75 + Math.sin(t * 5.2) * 0.25;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#07080c";
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = col;
  ctx.globalAlpha = 0.35 * pulse;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r * (1.4 + pulse * 0.35), 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, "#f4ece0");
  g.addColorStop(0.45, col);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(t * 1.8);
  ctx.strokeStyle = "rgba(232,236,232,0.55)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-r * 0.7, 0);
  ctx.lineTo(r * 0.7, 0);
  ctx.moveTo(0, -r * 0.7);
  ctx.lineTo(0, r * 0.7);
  ctx.stroke();
  ctx.restore();
}

function lizardLegs(
  ctx: CanvasRenderingContext2D,
  s: number,
  gait: number,
  run: number,
  grounded: boolean,
  hide: string,
  metal: string,
  visor: string,
) {
  const limb = (hipX: number, hipY: number, phase: number) => {
    const a = Math.sin(phase);
    const lift = grounded ? Math.max(0, -a) * (5.5 + run * 4) : 5;
    const reach = a * (4.5 + run * 5.5);
    const kneeX = hipX + reach * 0.4;
    const kneeY = hipY + 5.2 * s - lift * 0.35;
    const footX = hipX + reach;
    const footY = hipY + 11.2 * s - lift;
    ctx.strokeStyle = hide;
    ctx.lineWidth = 3.6 * s;
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(kneeX, kneeY);
    ctx.lineTo(footX, footY);
    ctx.stroke();
    ctx.strokeStyle = metal;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = hide;
    ctx.beginPath();
    ctx.arc(kneeX, kneeY, 1.7 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = visor;
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.moveTo(footX, footY);
    ctx.lineTo(footX - 3.4 * s, footY + 2.6 * s);
    ctx.moveTo(footX, footY);
    ctx.lineTo(footX + 0.4 * s, footY + 3.4 * s);
    ctx.moveTo(footX, footY);
    ctx.lineTo(footX + 3.2 * s, footY + 2.2 * s);
    ctx.stroke();
  };
  limb(-7 * s, 11 * s, gait);
  limb(7 * s, 11 * s, gait + Math.PI);
}

function lizardTail(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  s: number,
  gait: number,
  run: number,
  hide: string,
  visor: string,
) {
  const w1 = Math.sin(gait - 0.85) * (5 + run * 6);
  const w2 = Math.sin(gait - 1.7) * (7 + run * 7);
  ctx.strokeStyle = hide;
  ctx.lineWidth = 4.4 * Math.max(0.7, s);
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.bezierCurveTo(ox - 6 * s + w1, oy + 4 * s, ox - 12 * s + w2, oy + 9 * s, ox - 16 * s + w1 * 0.4, oy + 15 * s);
  ctx.stroke();
  ctx.strokeStyle = visor;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(ox - 16 * s + w1 * 0.4, oy + 15 * s);
  ctx.lineTo(ox - 20 * s + w2 * 0.3, oy + 18 * s);
  ctx.stroke();
}

export function drawLetterForm(
  ctx: CanvasRenderingContext2D,
  letter: LetterId,
  capital: boolean,
  cx: number,
  cy: number,
  facing: number,
  t: number,
  squash: number,
  attack: number,
  roll: number,
  hurt: number,
  motion: Motion = {},
) {
  const pose = poseOf(t, squash, motion);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(facing, 1);
  ctx.rotate(pose.lean + (hurt > 0 ? Math.sin(t * 38) * 0.12 : 0) + (roll > 0 ? t * 14 : 0));
  ctx.scale(1 / pose.sy, pose.sy);
  if (hurt > 0) ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 42);
  ctx.translate(0, pose.bob);
  const pal = inkPalette(letter, capital);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const atk = Math.max(0, Math.min(1, attack / 0.16));
  const wind = atk > 0.7 ? (atk - 0.7) / 0.3 : 0;
  const snap = atk > 0 && atk <= 0.7 ? 1 - atk / 0.7 : 0;
  const special = motion.special ?? 0;

  if (letter === "c") {
    const r = capital ? 22 : 15.4;
    const thick = capital ? 7.2 : 4.8;
    const jaw = 0.05 + snap * 0.22 - wind * 0.08 + Math.sin(t * 1.6) * 0.01;
    const a0 = 0.5 - jaw;
    const a1 = Math.PI * 2 - 0.48 + jaw;
    strokeInk(ctx, pal.glow, pal.core, thick, () => {
      ctx.arc(0, 0, r, a0, a1);
    });
    const tailX = Math.cos(a1) * r;
    const tailY = Math.sin(a1) * r;
    const wag = pose.step * (2.2 + pose.run * 2);
    ctx.strokeStyle = pal.core;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.quadraticCurveTo(tailX - 5, tailY + 7 + wag, tailX + 3, tailY + 9 + wag * 0.4);
    ctx.stroke();
    emberEye(ctx, r * 0.12, -r * 0.22, pal.glow, t, 1);
    if (capital) {
      ctx.strokeStyle = pal.core;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-2, -r - 2);
      ctx.quadraticCurveTo(4, -r - 11 + Math.sin(t * 4) * 1.2, 13, -r - 5);
      ctx.stroke();
    }
    if (pose.grounded) inkStride(ctx, pose.gait, pose.run, r * 0.72, pal.glow, pal.core);
    orbitMotes(ctx, t, pal.glow, r + 7, pose.run);
    if (snap > 0.2) {
      ctx.strokeStyle = "rgba(232,236,232,0.75)";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(8 + snap * 6, 0, r + 7 + snap * 5, -0.45, 0.65);
      ctx.stroke();
    }
    if (special > 0) {
      ctx.strokeStyle = "rgba(94,224,192,0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r + 10 + Math.sin(t * 20) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (letter === "s") {
    const rec = -wind * 6 + snap * 10;
    const tail = pose.step * 1.8 * pose.run;
    const sc = capital ? 1.24 : 1;
    ctx.save();
    ctx.scale(sc, sc);
    strokeInk(ctx, pal.glow, pal.core, capital ? 5.4 : 3.9, () => {
      ctx.moveTo(12, -14);
      ctx.bezierCurveTo(-18, -19, 18 + rec, -2, -12, 4);
      ctx.bezierCurveTo(-22, 10, 18, 18, 11, 13 + tail * 0.25);
    });
    ctx.strokeStyle = pal.glow;
    ctx.globalAlpha = 0.35 + pose.run * 0.25;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(12, -14);
    ctx.quadraticCurveTo(20 + rec * 0.4, -8 + pose.step, 18, 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    emberEye(ctx, 6, -10, pal.glow, t, 2);
    ctx.strokeStyle = pal.core;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(10, 13);
    ctx.quadraticCurveTo(16, 17 + tail, 8, 19 + tail * 0.4);
    ctx.stroke();
    if (capital) {
      ctx.strokeStyle = pal.glow;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(0, 0, 18 + Math.sin(t * 6) * 1.5, 16, pose.lean, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    if (pose.grounded) inkStride(ctx, pose.gait, pose.run, 16, pal.glow, pal.core);
    else {
      ctx.strokeStyle = pal.glow;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-10, 8);
      ctx.quadraticCurveTo(0, 16 + pose.step, 12, 10);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    orbitMotes(ctx, t, pal.glow, 17, pose.run);
    if (snap > 0.15) {
      ctx.strokeStyle = "rgba(127,208,255,0.8)";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(14, -4);
      ctx.quadraticCurveTo(24 + snap * 10, 2, 32 + snap * 12, 6);
      ctx.stroke();
    }
    if (special > 0) {
      ctx.strokeStyle = "rgba(127,208,255,0.45)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(8, 0, 16 + special * 30, -0.8, 0.8);
      ctx.stroke();
    }
  } else if (letter === "b") {
    const punch = snap * 5 - wind * 2;
    const sc = capital ? 1.2 : 1;
    ctx.save();
    ctx.scale(sc, sc);
    strokeInk(ctx, pal.glow, pal.core, capital ? 5.6 : 4.2, () => {
      ctx.moveTo(-12, -19);
      ctx.lineTo(-12, 18);
      ctx.moveTo(-12, -17);
      ctx.arc(2 + punch, -8, 10, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.moveTo(-12, 0);
      ctx.arc(4 + punch * 0.5, 9, 11, -Math.PI * 0.5, Math.PI * 0.5);
    });
    if (capital) {
      ctx.fillStyle = pal.glow;
      ctx.globalAlpha = 0.2;
      ctx.fillRect(-14, -20, 6, 40);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = pal.core;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-12, -20);
      ctx.lineTo(4, -22 + Math.sin(t * 3) * 0.8);
      ctx.stroke();
    }
    emberEye(ctx, -4, -12, pal.glow, t, 3);
    ctx.restore();
    if (pose.grounded) inkStride(ctx, pose.gait, pose.run, 18, pal.glow, pal.core);
    orbitMotes(ctx, t, pal.glow, 18, pose.run);
    if (special > 0) {
      ctx.strokeStyle = "rgba(196,180,154,0.5)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 18, 24 + special * 28, 7, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (letter === "e") {
    const sc = capital ? 1.22 : 1;
    const drip = Math.sin(t * 3.2) * 1.4;
    ctx.save();
    ctx.scale(sc, sc);
    if (capital) {
      strokeInk(ctx, pal.glow, pal.core, 5.1, () => {
        ctx.moveTo(13, -17);
        ctx.lineTo(-11, -17);
        ctx.lineTo(-11, 17);
        ctx.lineTo(13, 17);
        ctx.moveTo(-11, 0);
        ctx.lineTo(9, 0 + pose.step * 0.4);
      });
      ctx.strokeStyle = pal.glow;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(6, 17);
      ctx.quadraticCurveTo(8, 22 + drip, 4, 26 + drip);
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else {
      strokeInk(ctx, pal.glow, pal.core, 4.3, () => {
        ctx.arc(0, 1, 13.5, 0.4, Math.PI * 2 - 0.12);
        ctx.moveTo(-12, 1);
        ctx.lineTo(12, 1 + pose.step * 0.7);
      });
      ctx.strokeStyle = pal.glow;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 1, 9, 0.2, Math.PI - 0.2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    emberEye(ctx, capital ? -2 : 2, capital ? -8 : -6, pal.glow, t, 4);
    ctx.restore();
    if (pose.grounded) inkStride(ctx, pose.gait, pose.run, 15, pal.glow, pal.core);
    orbitMotes(ctx, t, pal.glow, 16, pose.run);
    if (special > 0) {
      ctx.strokeStyle = "rgba(110,200,232,0.5)";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 0, 20 + Math.sin(t * 18) * 5 + special * 24, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 12 + special * 16, 0.4, Math.PI - 0.4);
      ctx.stroke();
    }
  } else if (letter === "r") {
    const kick = snap * 7 + (special > 0 ? 10 : 0);
    const sc = capital ? 1.22 : 1;
    const flame = 3 + Math.sin(t * 14) * 1.6 + pose.run * 3;
    ctx.save();
    ctx.scale(sc, sc);
    strokeInk(ctx, pal.glow, pal.core, capital ? 5.2 : 4, () => {
      ctx.moveTo(-10, -16);
      ctx.lineTo(-10, 16);
      if (capital) {
        ctx.moveTo(-10, -16);
        ctx.arc(1, -8, 8.5, -Math.PI * 0.5, Math.PI * 0.45);
        ctx.moveTo(-2, 0);
        ctx.lineTo(11 + kick, 16);
      } else {
        ctx.moveTo(-10, -14);
        ctx.quadraticCurveTo(9, -16, 9, -6);
        ctx.quadraticCurveTo(7, 2, -4, 2);
        ctx.moveTo(-2, 2);
        ctx.lineTo(9 + kick * 0.45, 14);
      }
    });
    ctx.strokeStyle = pal.glow;
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-8, 16);
    ctx.quadraticCurveTo(-2, 18 + flame, 6, 14 + flame * 0.4);
    ctx.stroke();
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.moveTo(-6, 16);
    ctx.quadraticCurveTo(2, 22 + flame, 10 + kick * 0.2, 12);
    ctx.stroke();
    ctx.globalAlpha = 1;
    emberEye(ctx, -4, -10, pal.glow, t, 5);
    ctx.restore();
    if (pose.grounded) inkStride(ctx, pose.gait, pose.run, 16, pal.glow, pal.core);
    orbitMotes(ctx, t, pal.glow, 16, pose.run);
    if (special > 0) {
      ctx.strokeStyle = "rgba(224,112,64,0.5)";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-16, 8);
      ctx.quadraticCurveTo(0, 18, 20, 6);
      ctx.stroke();
    }
  } else if (letter === "k") {
    const kick = snap * 7 + (special > 0 ? 10 : 0);
    const sc = capital ? 1.18 : 1;
    ctx.save();
    ctx.scale(sc, sc);
    strokeInk(ctx, pal.glow, pal.core, capital ? 5.2 : 4.1, () => {
      ctx.moveTo(-10, -18);
      ctx.lineTo(-10, 16);
      ctx.moveTo(-10, 0);
      ctx.lineTo(10 + kick, -14);
      ctx.moveTo(-4, -4);
      ctx.lineTo(12 + kick * 0.4, 16);
    });
    emberEye(ctx, -4, -12, pal.glow, t, 6);
    ctx.restore();
    if (pose.grounded) inkStride(ctx, pose.gait, pose.run, 17, pal.glow, pal.core);
    orbitMotes(ctx, t, pal.glow, 17, pose.run);
    if (special > 0) {
      ctx.strokeStyle = "rgba(196,106,212,0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 16, 22 + special * 20, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (letter === "n") {
    const taut = special > 0 ? 4 : pose.step * 1.2;
    const sc = capital ? 1.18 : 1;
    ctx.save();
    ctx.scale(sc, sc);
    strokeInk(ctx, pal.glow, pal.core, capital ? 5 : 4, () => {
      ctx.moveTo(-11, 16);
      ctx.lineTo(-11, -16);
      if (capital) {
        ctx.lineTo(11 + taut, 16);
        ctx.lineTo(11, -16);
      } else {
        ctx.quadraticCurveTo(-8, -18, 2, -10);
        ctx.quadraticCurveTo(11, -4, 11, 16);
      }
    });
    emberEye(ctx, -5, -10, pal.glow, t, 7);
    ctx.restore();
    if (pose.grounded) inkStride(ctx, pose.gait, pose.run, 16, pal.glow, pal.core);
    orbitMotes(ctx, t, pal.glow, 16, pose.run);
    if (snap > 0.2) {
      ctx.strokeStyle = "rgba(142,200,212,0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(12, -4);
      ctx.lineTo(22 + snap * 10, -4);
      ctx.stroke();
    }
  } else if (letter === "t") {
    const sc = capital ? 1.2 : 1;
    ctx.save();
    ctx.scale(sc, sc);
    strokeInk(ctx, pal.glow, pal.core, capital ? 5.2 : 4, () => {
      if (capital) {
        ctx.moveTo(-14, -16);
        ctx.lineTo(14, -16);
        ctx.moveTo(0, -16);
        ctx.lineTo(0, 16);
      } else {
        ctx.moveTo(2, -16);
        ctx.lineTo(2, 14);
        ctx.quadraticCurveTo(6, 18, 10, 16);
        ctx.moveTo(-10, -6 + pose.step);
        ctx.lineTo(12, -6);
      }
    });
    emberEye(ctx, capital ? 4 : 6, capital ? -8 : -10, pal.glow, t, 8);
    ctx.restore();
    if (pose.grounded) inkStride(ctx, pose.gait, pose.run, 15, pal.glow, pal.core);
    orbitMotes(ctx, t, pal.glow, 16, pose.run);
  } else {
    strokeInk(ctx, pal.glow, pal.core, 4, () => {
      ctx.arc(0, 0, 14, 0.4, Math.PI * 2 - 0.4);
    });
    emberEye(ctx, 2, -6, pal.glow, t, 0);
  }
  ctx.restore();
}

export function drawShieldBubble(ctx: CanvasRenderingContext2D, p: Player, camX: number, camY: number, t: number) {
  if (p.shield <= 0 && p.shieldFlash <= 0) return;
  const cx = p.x + p.w / 2 - camX;
  const cy = p.y + p.h / 2 - camY;
  const flash = p.shieldFlash > 0;
  const a = flash ? 0.9 : 0.28 + p.shield * 0.1;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = flash ? "#e8ece8" : "#8ec8d4";
  ctx.fillStyle = flash ? "rgba(232,236,232,0.22)" : `rgba(94,224,192,${0.1 + p.shield * 0.04})`;
  ctx.shadowColor = "#8ec8d4";
  ctx.shadowBlur = flash ? 20 : 10;
  ctx.lineWidth = 2.6;
  ctx.globalAlpha = a;
  const rx = p.w * 0.72 + p.shield * 2.2;
  const ry = p.h * 0.58 + 4 + Math.sin(t * 4) * 1.2;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = a * 0.45;
  ctx.fill();
  ctx.restore();
}

export function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, camX: number, camY: number, t: number) {
  const cx = e.x + e.w / 2 - camX;
  const cy = e.y + e.h / 2 - camY;
  const spd = Math.hypot(e.vx, e.vy);
  const run = Math.min(1, spd / 80);
  const gait = e.t * (3.6 + run * 6.4);
  const step = Math.sin(gait);
  const bob = e.stun > 0 ? 2 : run > 0.1 ? Math.abs(step) * (2.8 + run * 2.4) : Math.sin(t * 2.4 + e.t) * 1.8;
  const lean = Math.max(-0.3, Math.min(0.3, e.vx * e.facing * 0.0036));
  const sq = e.hurt > 0 ? 1.16 : e.grounded ? 1 + Math.abs(step) * 0.09 * run : 0.88;
  const lag = step * -0.26 * run;
  const bite = e.hurt > 0 ? 0.55 : e.aux < 0.18 ? 0.4 : 0.07 + Math.sin(t * 5.2 + e.t) * 0.06;
  const s = Math.max(0.72, e.h / 50);
  const fly = e.kind === "zero" || e.kind === "nullis" || e.kind === "nullring" || e.kind === "mobius" || !e.grounded;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(e.facing, 1);
  ctx.rotate(lean + (e.stun > 0 ? -0.16 : 0));
  ctx.scale(1 / sq, sq);
  if (e.stun > 0) ctx.globalAlpha = 0.55 + 0.45 * Math.sin(t * 28);
  else if (e.flash > 0) ctx.globalAlpha = 0.5;
  ctx.translate(0, bob);
  const hide = "#24382e";
  const hide2 = "#3d5a48";
  const metal = "#b7c4c8";
  const visor = "#d45a4a";
  const aether = "#5ee0c0";
  if (e.phase === 1 || (e.aux > 0.7 && e.vx * e.vx < 900)) {
    ctx.save();
    ctx.globalAlpha = 0.22 + Math.sin(t * 14) * 0.1;
    ctx.strokeStyle = visor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, e.h * 0.42, 16 * s, 7 * s, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const body = (w: number, path: () => void, rim = metal) => {
    ctx.strokeStyle = hide;
    ctx.lineWidth = w;
    ctx.beginPath();
    path();
    ctx.stroke();
    ctx.strokeStyle = hide2;
    ctx.lineWidth = w * 0.7;
    ctx.beginPath();
    path();
    ctx.stroke();
    ctx.strokeStyle = rim;
    ctx.lineWidth = Math.max(1.8, w * 0.26);
    ctx.beginPath();
    path();
    ctx.stroke();
    dashCircuit(ctx, t + e.t, visor, Math.max(1.1, w * 0.16), path);
  };
  const head = (x: number, y: number, rot: number, sc: number, boss = false, tongue = true) =>
    drawWyrmHead(ctx, x, y, rot, sc, visor, hide2, t, boss, tongue, lag, bite);
  const legs = () => {
    if (fly) return;
    lizardLegs(ctx, s, gait, run, e.grounded, hide, metal, visor);
  };
  const tail = (ox: number, oy: number) => lizardTail(ctx, ox, oy, s, gait, run, hide, visor);
  const jets = (x: number, y: number) => {
    ctx.save();
    ctx.globalAlpha = 0.35 + Math.sin(t * 18) * 0.2;
    ctx.fillStyle = visor;
    ctx.beginPath();
    ctx.moveTo(x - 3, y);
    ctx.lineTo(x, y + 8 + Math.sin(t * 20) * 3);
    ctx.lineTo(x + 3, y);
    ctx.fill();
    ctx.fillStyle = aether;
    ctx.fillRect(x - 1, y + 2, 2, 5);
    ctx.restore();
  };

  const k = e.kind;
  if (k === "one" || k === "dummy") {
    body(10, () => {
      ctx.moveTo(-6 * s, -14 * s);
      ctx.lineTo(3 * s, -19 * s);
      ctx.lineTo(3 * s, 17 * s);
      ctx.moveTo(-8 * s, 17 * s);
      ctx.lineTo(11 * s, 17 * s);
    });
    ctx.strokeStyle = visor;
    ctx.lineWidth = 2.2;
    const pump = 10 + Math.sin(gait) * 4 * run;
    ctx.beginPath();
    ctx.moveTo(3 * s, 2 * s);
    ctx.lineTo(3 * s + pump, 4 * s);
    ctx.stroke();
    ctx.fillStyle = visor;
    ctx.fillRect(3 * s + pump, 2.4 * s, 5, 3.2);
    head(3 * s, -19 * s, -1.2, 0.64);
    tail(-6 * s, 16 * s);
    legs();
  } else if (k === "zero" || k === "nullis" || k === "nullring") {
    const big = k === "nullis" ? 1.32 : 1;
    if (k === "nullis") ctx.globalAlpha = (ctx.globalAlpha || 1) * (0.72 + Math.sin(t * 4) * 0.18);
    const spin = k === "nullring" ? t * 1.6 : t * 0.7;
    ctx.save();
    ctx.rotate(Math.sin(spin) * 0.08);
    body(9 * big, () => {
      ctx.ellipse(0, 0, 12 * s * big, 16 * s * big, 0, 0.12, Math.PI * 2 - 0.12);
    });
    energyCore(ctx, 0, 0, 5.2 * s * big, t, k === "nullring" ? visor : aether);
    if (k === "nullring") {
      ctx.strokeStyle = visor;
      ctx.globalAlpha = 0.4 + Math.sin(t * 5) * 0.2;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, (8 + Math.sin(t * 5) * 3) * s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    head(10 * s * big, -10 * s * big, -0.35, 0.6 * big, k === "nullis");
    ctx.restore();
    jets(-6 * s, 14 * s);
    jets(6 * s, 14 * s);
    tail(-11 * s * big, 10 * s * big);
  } else if (k === "two" || k === "dualis") {
    const b = k === "dualis" ? 1.32 : 1;
    const wiggle = step * 2.2 * run;
    body(8.5 * b, () => {
      ctx.moveTo(-11 * s * b, -11 * s * b + wiggle);
      ctx.quadraticCurveTo(-11 * s * b, -18 * s * b, 1 * s * b, -18 * s * b);
      ctx.quadraticCurveTo(13 * s * b, -18 * s * b, 13 * s * b, -9 * s * b);
      ctx.quadraticCurveTo(13 * s * b, -1 * s * b, -2 * s * b, 5 * s * b - wiggle);
      ctx.lineTo(-12 * s * b, 16 * s * b);
      ctx.lineTo(13 * s * b, 16 * s * b);
    });
    head(12 * s * b, -12 * s * b, -0.4, 0.6 * b, k === "dualis");
    if (k === "dualis") head(12 * s * b, 16 * s * b, 0.5, 0.5 * b, false);
    tail(-12 * s * b, 16 * s * b);
    legs();
  } else if (k === "three" || k === "triad") {
    const hop = e.vy < -40 ? -3 : 0;
    ctx.translate(0, hop);
    body(8.2, () => {
      ctx.moveTo(-11 * s, -17 * s);
      ctx.lineTo(4 * s, -17 * s);
      ctx.quadraticCurveTo(14 * s, -17 * s, 14 * s, -8 * s);
      ctx.quadraticCurveTo(14 * s, -1 * s, 3 * s, 0);
      ctx.moveTo(3 * s, 0);
      ctx.quadraticCurveTo(15 * s, 1 * s, 15 * s, 9 * s);
      ctx.quadraticCurveTo(15 * s, 18 * s, 3 * s, 18 * s);
      ctx.lineTo(-11 * s, 18 * s);
    });
    head(12 * s, -12 * s, -0.35, 0.56);
    if (k === "triad") {
      head(14 * s, 0, 0.05 + Math.sin(t * 4) * 0.15, 0.44, false, false);
      head(12 * s, 16 * s, 0.45, 0.5);
    }
    tail(-11 * s, 17 * s);
    legs();
  } else if (k === "four" || k === "tetrarch" || k === "crossseal") {
    const b = k === "tetrarch" ? 1.38 : 1;
    if (k === "crossseal") ctx.rotate(Math.sin(t * 1.5) * 0.4);
    body(8.6 * b, () => {
      ctx.moveTo(5 * s * b, 18 * s * b);
      ctx.lineTo(5 * s * b, -18 * s * b);
      ctx.lineTo(-13 * s * b, 5 * s * b);
      ctx.lineTo(15 * s * b, 5 * s * b);
    });
    ctx.save();
    ctx.translate(5 * s * b, 5 * s * b);
    ctx.rotate(t * (k === "crossseal" ? 2.2 : 0.8));
    ctx.strokeStyle = visor;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-10 * s, 0);
    ctx.lineTo(10 * s, 0);
    ctx.moveTo(0, -10 * s);
    ctx.lineTo(0, 10 * s);
    ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = 1;
    head(5 * s * b, -18 * s * b, -1.45, 0.6 * b, k === "tetrarch");
    if (k === "tetrarch") {
      head(-13 * s * b, 5 * s * b, 2.4, 0.5 * b, false, false);
      head(15 * s * b, 5 * s * b, 0.1, 0.5 * b);
    }
    tail(-8 * s * b, 16 * s * b);
    if (k !== "crossseal") legs();
  } else if (k === "five" || k === "archivist") {
    body(8.4, () => {
      ctx.moveTo(13 * s, -18 * s);
      ctx.lineTo(-11 * s, -18 * s);
      ctx.lineTo(-11 * s, -1 * s);
      ctx.lineTo(3 * s, -1 * s);
      ctx.quadraticCurveTo(14 * s, -1 * s, 14 * s, 8 * s);
      ctx.quadraticCurveTo(14 * s, 18 * s, 2 * s, 18 * s);
      ctx.lineTo(-11 * s, 18 * s);
    });
    const beam = 18 + Math.sin(t * 3) * 8;
    ctx.strokeStyle = `rgba(212,90,74,${0.25 + Math.sin(t * 7) * 0.15})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(13 * s, -18 * s);
    ctx.lineTo(13 * s + beam, -10 * s);
    ctx.stroke();
    head(13 * s, -18 * s, -0.2, 0.58);
    if (k === "archivist") {
      ctx.globalAlpha = 0.22 + Math.sin(t * 6) * 0.1;
      ctx.strokeStyle = aether;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(13 * s + 7, -18 * s);
      ctx.lineTo(-11 * s + 7, -18 * s);
      ctx.lineTo(-11 * s + 7, -1 * s);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    tail(-11 * s, 18 * s);
    legs();
  } else if (k === "six" || k === "summoner") {
    body(8.3, () => {
      ctx.moveTo(8 * s, -18 * s);
      ctx.quadraticCurveTo(-14 * s, -16 * s, -12 * s, 2 * s);
      ctx.quadraticCurveTo(-12 * s, 18 * s, 1 * s, 18 * s);
      ctx.quadraticCurveTo(14 * s, 18 * s, 14 * s, 7 * s);
      ctx.quadraticCurveTo(14 * s, -3 * s, 1 * s, -3 * s);
      ctx.quadraticCurveTo(-8 * s, -3 * s, -8 * s, 7 * s);
    });
    energyCore(ctx, 1 * s, 8 * s, 4.6 * s, t, k === "summoner" ? "#c46ad4" : visor);
    if (k === "summoner") {
      ctx.save();
      ctx.translate(0, -20 * s);
      ctx.rotate(t * 2);
      ctx.strokeStyle = "#c46ad4";
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, 7 + Math.sin(t * 6) * 2, 0, Math.PI * 2);
      ctx.moveTo(-6, 0);
      ctx.lineTo(6, 0);
      ctx.moveTo(0, -6);
      ctx.lineTo(0, 6);
      ctx.stroke();
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    head(8 * s, -18 * s, -1.15, 0.58);
    tail(-10 * s, 14 * s);
    legs();
  } else if (k === "seven" || k === "gradient") {
    if (k === "gradient") {
      ctx.rotate(-0.18 - run * 0.12);
      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = metal;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-14 * s - 12, -17 * s);
      ctx.lineTo(13 * s - 12, -17 * s);
      ctx.lineTo(-4 * s - 12, 18 * s);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    body(8.5, () => {
      ctx.moveTo(-13 * s, -17 * s);
      ctx.lineTo(13 * s, -17 * s);
      ctx.lineTo(-3 * s, 18 * s);
    });
    ctx.strokeStyle = visor;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-4 * s, -17 * s);
    ctx.lineTo(2 * s, -17 * s);
    ctx.stroke();
    head(13 * s, -17 * s, -0.15, 0.6);
    if (k === "gradient") jets(-3 * s, 16 * s);
    tail(-8 * s, 10 * s);
    legs();
  } else if (k === "eight" || k === "mobius" || k === "endmark") {
    const b = k === "endmark" ? (e.phase >= 2 ? 0.78 : 1.28) : 1;
    if (k === "mobius") ctx.rotate(t * 2.15 * e.facing);
    body(8 * b, () => {
      ctx.ellipse(0, -8 * s * b, 10 * s * b, 9 * s * b, 0, 0, Math.PI * 2);
      if (!(k === "endmark" && e.phase >= 2)) {
        ctx.moveTo(10 * s * b, 8 * s * b);
        ctx.ellipse(0, 9 * s * b, 11 * s * b, 9 * s * b, 0, 0, Math.PI * 2);
      }
    });
    energyCore(ctx, 0, -8 * s * b, 3.6 * s * b, t, visor);
    if (!(k === "endmark" && e.phase >= 2)) energyCore(ctx, 0, 9 * s * b, 3.6 * s * b, t + 1, aether);
    head(9 * s * b, -10 * s * b, -0.2, 0.54 * b, k === "endmark");
    if (k === "endmark" && e.phase < 2) head(10 * s * b, 12 * s * b, 0.55, 0.5 * b);
    if (k !== "mobius") {
      tail(-10 * s * b, 14 * s * b);
      legs();
    }
  } else if (k === "nine") {
    ctx.globalAlpha = 0.55 + Math.sin(t * 7 + e.t) * 0.35;
    body(8.3, () => {
      ctx.ellipse(0, -7 * s, 11 * s, 10 * s, 0, 0.15, Math.PI * 2 - 0.05);
      ctx.moveTo(10 * s, -2 * s);
      ctx.quadraticCurveTo(12 * s, 12 * s, 2 * s, 18 * s);
      ctx.lineTo(-8 * s, 16 * s);
    });
    ctx.globalAlpha = 1;
    energyCore(ctx, 0, -7 * s, 3.8 * s, t, visor);
    head(10 * s, -10 * s, -0.25, 0.56);
    tail(-6 * s, 16 * s);
    legs();
  } else if (k === "importer") {
    const gate = 0.35 + Math.sin(e.aux * 2) * 0.12;
    body(9.2, () => {
      ctx.ellipse(0, 2 * s, 14 * s, 16 * s, 0, gate, Math.PI * 2 - gate);
      ctx.moveTo(2 * s, 2 * s);
      ctx.lineTo(14 * s, 2 * s);
    }, "#c4b08a");
    energyCore(ctx, 0, 3 * s, 4.4 * s, t, "#c4b08a");
    head(12 * s, -12 * s, -0.45, 0.74, true);
    ctx.fillStyle = "#c4b08a";
    ctx.font = `700 ${13 * s}px 'Source Sans 3', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("G", 0, 4 * s);
    tail(-12 * s, 12 * s);
    legs();
  } else if (k === "plus" || k === "summand") {
    const b = k === "summand" ? 1.35 : 1;
    body(9 * b, () => {
      ctx.moveTo(-14 * s * b, 0);
      ctx.lineTo(14 * s * b, 0);
      ctx.moveTo(0, -14 * s * b);
      ctx.lineTo(0, 14 * s * b);
    }, "#e8d48a");
    energyCore(ctx, 0, 0, 3.4 * s * b, t, "#e8d48a");
    head(12 * s * b, -8 * s * b, -0.25, 0.52 * b, k === "summand");
    tail(-12 * s * b, 8 * s * b);
    legs();
  } else if (k === "minus" || k === "difference") {
    const b = k === "difference" ? 1.3 : 1;
    body(9 * b, () => {
      ctx.moveTo(-16 * s * b, 0);
      ctx.lineTo(16 * s * b, 0);
    }, "#d45a4a");
    energyCore(ctx, 0, 0, 3 * s * b, t, visor);
    head(14 * s * b, -4 * s * b, -0.2, 0.5 * b, k === "difference");
    tail(-14 * s * b, 4 * s * b);
    legs();
  } else if (k === "times" || k === "product") {
    const b = k === "product" ? 1.3 : 1;
    body(8.4 * b, () => {
      ctx.moveTo(-12 * s * b, -12 * s * b);
      ctx.lineTo(12 * s * b, 12 * s * b);
      ctx.moveTo(12 * s * b, -12 * s * b);
      ctx.lineTo(-12 * s * b, 12 * s * b);
    }, "#c46ad4");
    energyCore(ctx, 0, 0, 3.2 * s * b, t, "#c46ad4");
    head(10 * s * b, -10 * s * b, -0.35, 0.5 * b, k === "product");
    legs();
  } else if (k === "divide" || k === "quotient") {
    const b = k === "quotient" ? 1.3 : 1;
    body(8.2 * b, () => {
      ctx.moveTo(-12 * s * b, 8 * s * b);
      ctx.lineTo(12 * s * b, -8 * s * b);
    }, "#7fd0ff");
    ctx.fillStyle = "#7fd0ff";
    ctx.beginPath();
    ctx.arc(0, -12 * s * b, 3.2 * s * b, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 12 * s * b, 3.2 * s * b, 0, Math.PI * 2);
    ctx.fill();
    head(10 * s * b, -6 * s * b, -0.3, 0.5 * b, k === "quotient");
    legs();
  } else if (k === "pi") {
    body(8.5, () => {
      ctx.moveTo(-12 * s, -12 * s);
      ctx.lineTo(12 * s, -12 * s);
      ctx.moveTo(-6 * s, -12 * s);
      ctx.lineTo(-8 * s, 16 * s);
      ctx.moveTo(6 * s, -12 * s);
      ctx.quadraticCurveTo(10 * s, 4 * s, 4 * s, 16 * s);
    }, "#9af8de");
    energyCore(ctx, 0, -4 * s, 3 * s, t, aether);
    head(10 * s, -10 * s, -0.25, 0.52);
    tail(-8 * s, 14 * s);
    legs();
  } else if (k === "radix") {
    body(6.5, () => {
      ctx.arc(0, 4 * s, 7 * s, 0, Math.PI * 2);
    });
    head(6 * s, -2 * s, -0.2, 0.4);
  } else if (k === "infinitum") {
    body(9.4, () => {
      ctx.ellipse(-10 * s, 0, 10 * s, 8 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(10 * s, 0, 10 * s, 8 * s, 0, 0, Math.PI * 2);
    }, "#e8d48a");
    energyCore(ctx, -10 * s, 0, 3.4 * s, t, visor);
    energyCore(ctx, 10 * s, 0, 3.4 * s, t + 1, aether);
    head(18 * s, -8 * s, -0.3, 0.62, true);
    tail(-18 * s, 6 * s);
  } else if (k === "remainder") {
    body(10, () => {
      ctx.moveTo(-8 * s, -16 * s);
      ctx.lineTo(6 * s, 16 * s);
      ctx.ellipse(-6 * s, -10 * s, 7 * s, 7 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(6 * s, 10 * s, 7 * s, 7 * s, 0, 0, Math.PI * 2);
    }, "#e8d48a");
    energyCore(ctx, 0, 0, 4.2 * s, t, "#e8d48a");
    head(12 * s, -12 * s, -0.4, 0.7, true);
    tail(-12 * s, 12 * s);
    legs();
  } else {
    body(8, () => {
      ctx.ellipse(0, 0, 11 * s, 15 * s, 0, 0, Math.PI * 2);
    });
    head(10 * s, -8 * s, -0.3, 0.55);
    legs();
  }
  ctx.restore();
  if (e.stun > 0) {
    ctx.save();
    ctx.strokeStyle = "rgba(232,236,232,0.8)";
    ctx.lineWidth = 1.6;
    const sx = e.x + e.w / 2 - camX;
    const sy = e.y - camY - 6;
    ctx.beginPath();
    ctx.moveTo(sx - 5, sy);
    ctx.lineTo(sx + 5, sy - 4);
    ctx.moveTo(sx - 3, sy - 6);
    ctx.lineTo(sx + 6, sy);
    ctx.stroke();
    ctx.restore();
  }
  if (
    e.kind === "dualis" ||
    e.kind === "tetrarch" ||
    e.kind === "importer" ||
    e.kind === "nullis" ||
    e.kind === "endmark" ||
    e.kind === "summand" ||
    e.kind === "difference" ||
    e.kind === "product" ||
    e.kind === "quotient" ||
    e.kind === "infinitum" ||
    e.kind === "remainder"
  ) {
    const ratio = e.hp / e.maxHp;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(e.x - camX, e.y - camY - 10, e.w, 4);
    ctx.fillStyle = "#d45a4a";
    ctx.fillRect(e.x - camX, e.y - camY - 10, e.w * ratio, 4);
  }
}

function strokeGlyph(
  ctx: CanvasRenderingContext2D,
  glow: string,
  core: string,
  draw: () => void,
) {
  ctx.strokeStyle = glow;
  ctx.shadowColor = glow;
  ctx.shadowBlur = 12;
  ctx.lineWidth = 5.5;
  ctx.beginPath();
  draw();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = core;
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  draw();
  ctx.stroke();
}

export function drawNpcGlyph(
  ctx: CanvasRenderingContext2D,
  glyph: string,
  x: number,
  y: number,
  t: number,
  seed = 0,
) {
  ctx.save();
  ctx.translate(x, y);
  const breath = animWave(t, seed, 2.3, 0.02);
  ctx.translate(0, animWave(t, seed, 3, 0.01) * 3.2);
  ctx.rotate(breath * 0.05);
  ctx.scale(1 - breath * 0.03, 1 + breath * 0.05);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const glow = glyph === "k" ? "#8aa0aa" : "#5ee0c0";
  const core = "#e8ece8";
  if (glyph === "e") {
    strokeGlyph(ctx, glow, core, () => {
      ctx.ellipse(0, 0, 12, 14, 0, 0.35, Math.PI * 2 - 0.15);
      ctx.moveTo(-8, 0);
      ctx.lineTo(8, 0);
    });
    emberEye(ctx, 2, -3, glow);
  } else if (glyph === "t") {
    strokeGlyph(ctx, glow, core, () => {
      ctx.moveTo(0, -16);
      ctx.lineTo(0, 16);
      ctx.moveTo(-14, -12);
      ctx.lineTo(14, -12);
    });
    emberEye(ctx, 3, -8, glow);
  } else if (glyph === "r") {
    strokeGlyph(ctx, glow, core, () => {
      ctx.moveTo(-8, -14);
      ctx.lineTo(-8, 16);
      ctx.moveTo(-8, -12);
      ctx.quadraticCurveTo(12, -12, 6, -1);
      ctx.lineTo(12, 14);
    });
    emberEye(ctx, -4, -8, glow);
  } else if (glyph === "k") {
    strokeGlyph(ctx, glow, core, () => {
      ctx.moveTo(-10, -16);
      ctx.lineTo(-10, 16);
      ctx.moveTo(-10, 0);
      ctx.lineTo(12, -14);
      ctx.moveTo(-10, 0);
      ctx.lineTo(12, 16);
    });
    emberEye(ctx, -6, -8, glow);
  } else if (glyph === "&") {
    strokeGlyph(ctx, glow, core, () => {
      ctx.ellipse(-2, -6, 8, 8, -0.4, 0, Math.PI * 2);
      ctx.ellipse(2, 8, 9, 8, 0.3, 0, Math.PI * 1.8);
    });
    emberEye(ctx, -2, -6, glow);
  } else if (glyph === "m") {
    strokeGlyph(ctx, "#c4b08a", core, () => {
      ctx.moveTo(-12, 14);
      ctx.lineTo(-12, -8);
      ctx.quadraticCurveTo(-6, -16, 0, -6);
      ctx.quadraticCurveTo(6, -16, 12, -8);
      ctx.lineTo(12, 14);
    });
    emberEye(ctx, 0, -4, "#c4b08a");
  } else if (glyph === "a") {
    strokeGlyph(ctx, "#5ee0c0", core, () => {
      ctx.ellipse(0, 2, 11, 12, 0, 0, Math.PI * 2);
      ctx.moveTo(10, -6);
      ctx.lineTo(10, 16);
    });
    emberEye(ctx, 2, 0, "#5ee0c0");
  } else if (glyph === "y") {
    strokeGlyph(ctx, "#9ad4e0", core, () => {
      ctx.moveTo(-10, -14);
      ctx.lineTo(0, 2);
      ctx.lineTo(10, -14);
      ctx.moveTo(0, 2);
      ctx.lineTo(0, 10);
      ctx.quadraticCurveTo(0, 18, -8, 16);
    });
    emberEye(ctx, 0, -8, "#9ad4e0");
  } else if (glyph === "q") {
    strokeGlyph(ctx, "#8ec8d4", core, () => {
      ctx.ellipse(0, 0, 12, 14, 0, 0, Math.PI * 2);
      ctx.moveTo(6, 10);
      ctx.lineTo(14, 18);
    });
    emberEye(ctx, 2, -4, "#8ec8d4");
  } else if (glyph === "s") {
    strokeGlyph(ctx, "#7fd0ff", core, () => {
      ctx.moveTo(10, -12);
      ctx.bezierCurveTo(-16, -16, 16, 0, -10, 4);
      ctx.bezierCurveTo(-18, 8, 14, 16, 8, 12);
    });
    emberEye(ctx, 6, -10, "#7fd0ff");
  } else if (glyph === "b") {
    strokeGlyph(ctx, "#c4b49a", core, () => {
      ctx.moveTo(-10, -16);
      ctx.lineTo(-10, 16);
      ctx.moveTo(-10, -16);
      ctx.arc(0, -7, 8, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.moveTo(-10, 0);
      ctx.arc(2, 7, 9, -Math.PI * 0.5, Math.PI * 0.5);
    });
    emberEye(ctx, -6, -12, "#c4b49a");
  } else if (glyph === "e") {
    strokeGlyph(ctx, "#6ec8e8", core, () => {
      ctx.arc(0, 1, 12, 0.35, Math.PI * 2 - 0.15);
      ctx.moveTo(-10, 1);
      ctx.lineTo(10, 1);
    });
    emberEye(ctx, 2, -6, "#6ec8e8");
  } else if (glyph === "r") {
    strokeGlyph(ctx, "#e07040", core, () => {
      ctx.moveTo(-10, -14);
      ctx.lineTo(-10, 14);
      ctx.moveTo(-10, -12);
      ctx.quadraticCurveTo(8, -14, 8, -4);
      ctx.quadraticCurveTo(6, 2, -4, 2);
      ctx.moveTo(-2, 2);
      ctx.lineTo(8, 14);
    });
    emberEye(ctx, -4, -8, "#e07040");
  } else {
    ctx.fillStyle = "#d8e8e0";
    ctx.font = "600 42px 'Cormorant Garamond', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(glyph, 0, 0);
  }
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(232,236,232,0.75)";
  ctx.font = "500 9px 'Source Sans 3', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(glyph === "&" ? "board" : glyph, 0, 26);
  ctx.restore();
}


function drawCodeWeapon(ctx: CanvasRenderingContext2D, family: MeleeFamily, glow: string, core: string, scale: number) {
  ctx.strokeStyle = glow;
  ctx.fillStyle = core;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (family === "arc") {
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-4, 2);
    ctx.quadraticCurveTo(10, -2, 22, -10);
    ctx.quadraticCurveTo(16, 6, 4, 8);
    ctx.stroke();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = core;
    ctx.beginPath();
    ctx.moveTo(-2, 1);
    ctx.quadraticCurveTo(12, -4, 20, -8);
    ctx.stroke();
  } else if (family === "smash") {
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(-6, 4);
    ctx.lineTo(8, -2);
    ctx.stroke();
    ctx.fillStyle = glow;
    ctx.fillRect(6, -12, 16, 14);
    ctx.fillStyle = core;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(8, -10, 12, 10);
    ctx.globalAlpha = 1;
  } else if (family === "ember") {
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-5, 3);
    ctx.lineTo(20, -8);
    ctx.stroke();
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.moveTo(20, -8);
    ctx.lineTo(26, -4);
    ctx.lineTo(18, -2);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-6, 3);
    ctx.lineTo(24, -2);
    ctx.stroke();
    ctx.strokeStyle = core;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(18, -6);
    ctx.lineTo(24, -2);
    ctx.lineTo(18, 2);
    ctx.stroke();
  }
  void scale;
}

function drawMelee(ctx: CanvasRenderingContext2D, p: Player, cx: number, cy: number, t: number) {
  const wpn = weaponFor(p.letter);
  const pal = inkPalette(p.letter, p.capital);
  const phase = meleePhase(p.attack, p.letter);
  const idle = p.melee <= 0 && p.attack <= 0;
  const ang = meleeAngle(phase, wpn.family, idle);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(p.facing, 1);
  ctx.translate(p.w * 0.12, p.h * 0.02);
  ctx.rotate(ang);
  const swing = !idle && phase > 0.28 && phase < 0.72;
  if (swing) {
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.rotate(-0.35);
    drawCodeWeapon(ctx, wpn.family, pal.glow, pal.core, 1);
    ctx.restore();
  }
  const sprite = blitArt(ctx, "weapons", p.letter, -6, -22, 56, 48, 0);
  if (!sprite) drawCodeWeapon(ctx, wpn.family, pal.glow, pal.core, 1);
  ctx.restore();
  if (swing) {
    const fx = `slash-${wpn.family}`;
    const frame = Math.min(3, Math.floor(phase * 4));
    const ox = cx + p.facing * (18 + wpn.reach * 0.18);
    const oy = cy - 6;
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(p.facing, 1);
    const used = blitArt(ctx, "fx", fx, -28, -24, 72, 52, t, frame);
    if (!used) {
      ctx.strokeStyle = pal.glow;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(4, 4, 22 + phase * 8, -0.9, 0.8);
      ctx.stroke();
    }
    ctx.restore();
    if (p.attackHit && p.melee > wpn.time * 0.35) {
      blitArt(ctx, "fx", "impact-hit", ox - 16, oy - 16, 36, 36, t, frame);
    }
  }
}

export function drawPlayer(ctx: CanvasRenderingContext2D, p: Player, camX: number, camY: number, t: number) {
  const cx = Math.round(p.x + p.w / 2 - camX);
  const cy = Math.round(p.y + p.h / 2 - camY);
  const motion = { vx: p.vx, vy: p.vy, grounded: p.grounded, special: p.special };
  const ghosts = p.roll > 0 ? (p.letter === "r" ? 3 : p.letter === "c" ? 5 : 2) : p.letter === "s" && Math.abs(p.vx) > 180 ? 1 : 0;
  for (let i = ghosts; i >= 1; i--) {
    ctx.save();
    ctx.globalAlpha = p.letter === "c" ? 0.22 - i * 0.03 : p.letter === "r" ? 0.16 * i : 0.14;
    const ox = p.letter === "c" ? -(p.vx / 52) * i : -p.facing * (10 * i);
    const oy = p.letter === "c" ? -(p.vy / 52) * i : p.letter === "r" ? i : 0;
    drawLetterForm(
      ctx,
      p.letter,
      p.capital,
      cx + ox,
      cy + oy,
      p.facing,
      t + p.anim,
      p.squash * p.stretch,
      p.attack,
      0,
      0,
      motion,
    );
    ctx.restore();
  }
  drawLetterForm(
    ctx,
    p.letter,
    p.capital,
    cx,
    cy,
    p.facing,
    t + p.anim,
    p.squash * p.stretch,
    p.attack,
    p.roll,
    p.hurtFlash,
    motion,
  );
  drawMelee(ctx, p, cx, cy, t);
  drawShieldBubble(ctx, p, camX, camY, t);
}

export function drawShot(ctx: CanvasRenderingContext2D, b: Bullet, camX: number, camY: number) {
  ctx.save();
  ctx.translate(b.x - camX, b.y - camY);
  if (b.kind === "stamp") {
    const hot = b.life < 0.4;
    const r = hot ? b.r * (0.7 + (0.34 - b.life) * 2) : b.r * (1.15 - b.life);
    ctx.strokeStyle = hot ? "#d45a4a" : "#e8d48a";
    ctx.globalAlpha = hot ? 0.9 : 0.4;
    ctx.lineWidth = hot ? 4 : 2;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(6, r), 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = hot ? 0.25 : 0.12;
    ctx.fillStyle = hot ? "#d45a4a" : "#e8d48a";
    ctx.fill();
    ctx.restore();
    return;
  }
  if (b.kind === "wave") {
    ctx.fillStyle = b.from === "player" ? "#c4b08a" : "#d45a4a";
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#e8ece8";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
    return;
  }
  ctx.rotate(Math.atan2(b.vy, b.vx));
  const col =
    b.from === "enemy"
      ? b.kind === "mortar"
        ? "#e07040"
        : "#d45a4a"
      : b.kind === "solar"
        ? "#e8d48a"
        : b.kind === "echo"
          ? "#e8d48a"
          : b.kind === "nib"
            ? "#9af8de"
            : b.kind === "venom"
              ? "#7fd0ff"
              : b.kind === "wind"
                ? "#9ad4e0"
                : b.kind === "frost"
                  ? "#8ee0f4"
                  : b.kind === "ember"
                    ? "#e07040"
                    : "#5ee0c0";
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.shadowColor = col;
  ctx.shadowBlur = 10;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(0, 0, b.r, 0.7, Math.PI * 2 - 0.7);
  ctx.stroke();
  if (b.kind === "fang" || b.kind === "solar" || b.kind === "venom" || b.kind === "wind") {
    ctx.beginPath();
    ctx.moveTo(b.r - 1, -2.4);
    ctx.lineTo(b.r + 7, 0);
    ctx.lineTo(b.r - 1, 2.4);
    ctx.closePath();
    ctx.fill();
  }
  if (b.kind === "frost") {
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, -b.r - 3);
    ctx.lineTo(2, 0);
    ctx.lineTo(0, b.r + 3);
    ctx.lineTo(-2, 0);
    ctx.closePath();
    ctx.stroke();
  }
  if (b.kind === "ember") {
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(-b.r, 0);
    ctx.quadraticCurveTo(0, -b.r - 4, b.r + 4, 0);
    ctx.quadraticCurveTo(0, b.r + 2, -b.r, 0);
    ctx.fill();
  }
  if (b.kind === "solar") {
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(-4, 0, b.r + 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawPickup(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  kind: string,
  label: string,
  t: number,
  seed = 0,
) {
  const bob = animWave(t, seed, 4, 0.02) * 3;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.rotate(animWave(t, seed, 2.1, 0.02) * 0.12);
  const pulse = 1 + animWave(t, seed, 5, 0.02) * 0.08;
  ctx.scale(pulse, pulse);
  if (kind === "ink") {
    ctx.fillStyle = "#5ee0c0";
    ctx.shadowColor = "#5ee0c0";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === "heart") {
    ctx.fillStyle = "#d45a4a";
    ctx.beginPath();
    ctx.arc(-4, -1, 4, 0, Math.PI * 2);
    ctx.arc(4, -1, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(0, 10);
    ctx.lineTo(8, 0);
    ctx.fill();
  } else if (kind === "fang") {
    ctx.fillStyle = "#e8d48a";
    ctx.shadowColor = "#e8d48a";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(6, 8);
    ctx.lineTo(0, 4);
    ctx.lineTo(-6, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#5ee0c0";
    ctx.font = "600 8px 'Source Sans 3', sans-serif";
    ctx.textAlign = "center";
    ctx.shadowBlur = 0;
    ctx.fillText("FANG", 0, 16);
  } else if (kind === "scale") {
    ctx.fillStyle = "#8ec8d4";
    ctx.shadowColor = "#8ec8d4";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1a4a3c";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 2, 5, 0.4, 2.6);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#5ee0c0";
    ctx.font = "600 8px 'Source Sans 3', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SCALE", 0, 18);
  } else if (kind === "check") {
    ctx.strokeStyle = "#c4b08a";
    ctx.shadowColor = "#c4b08a";
    ctx.shadowBlur = 12;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#efe0c0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -7);
    ctx.moveTo(0, 0);
    ctx.lineTo(5, 3);
    ctx.stroke();
    ctx.fillStyle = "#c4b08a";
    ctx.font = "600 8px 'Source Sans 3', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("CHECK", 0, 20);
  } else if (kind === "drop") {
    ctx.strokeStyle = "#9af8de";
    ctx.shadowColor = "#9af8de";
    ctx.shadowBlur = 14;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0.5, Math.PI * 2 - 0.5);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#e8ece8";
    ctx.font = "600 9px 'Source Sans 3', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("DROP CAP", 0, 22);
  } else if (kind === "secret") {
    ctx.fillStyle = "#e8d48a";
    ctx.shadowColor = "#e8d48a";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#07080c";
    ctx.font = "700 11px 'Cormorant Garamond', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("$", 0, 1);
  } else if (kind === "relic") {
    ctx.fillStyle = "#e8d48a";
    ctx.shadowColor = "#e8d48a";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(8, 0);
    ctx.lineTo(0, 10);
    ctx.lineTo(-8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#07080c";
    ctx.font = "700 9px 'Cormorant Garamond', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText((label || "RELIC").slice(0, 6), 0, 0);
  } else {
    ctx.fillStyle = "rgba(7,8,12,0.55)";
    roundRect(ctx, -16, -10, 32, 18, 6);
    ctx.fill();
    ctx.fillStyle = "#5ee0c0";
    ctx.font = "600 10px 'Source Sans 3', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 0, 0);
  }
  ctx.restore();
}

export function drawBeacon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  camX: number,
  camY: number,
  t: number,
  label: string,
) {
  const px = x - camX;
  const py = y - camY;
  if (px < 8 || px > VIEW_W - 8 || py < 8 || py > VIEW_H - 8) return;
  ctx.save();
  const a = 0.5 + Math.sin(t * 4) * 0.25;
  ctx.translate(px, py - 28);
  ctx.fillStyle = `rgba(94,224,192,${a})`;
  ctx.beginPath();
  ctx.moveTo(-6, -6);
  ctx.lineTo(0, 5);
  ctx.lineTo(6, -6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = `rgba(232,236,232,${0.75 + Math.sin(t * 4) * 0.2})`;
  ctx.font = "600 10px 'Source Sans 3', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, 0, -10);
  ctx.restore();
}

export function drawHudCanvas(
  ctx: CanvasRenderingContext2D,
  p: Player,
  objective: string,
  toast: string,
) {
  ctx.fillStyle = "rgba(7,8,12,0.55)";
  roundRect(ctx, 132, 14, 210, 44, 10);
  ctx.fill();
  roundRect(ctx, 144, 22, 160, 8, 4);
  ctx.fillStyle = "rgba(232,236,232,0.12)";
  ctx.fill();
  ctx.fillStyle = "#d45a4a";
  ctx.fillRect(144, 22, Math.max(0, 160 * (p.hp / p.maxHp)), 8);
  ctx.fillStyle = "rgba(142,200,212,0.2)";
  roundRect(ctx, 144, 34, 160, 7, 3);
  ctx.fill();
  ctx.fillStyle = "#8ec8d4";
  ctx.fillRect(144, 34, Math.max(0, 160 * (p.shield / Math.max(1, p.maxShield))), 7);
  ctx.fillStyle = "#5ee0c0";
  ctx.fillRect(144, 44, Math.max(0, 160 * (p.ink / p.maxInk)), 5);
  ctx.fillStyle = "#e8ece8";
  ctx.font = "600 11px 'Source Sans 3', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(p.capital ? p.letter.toUpperCase() : p.letter, 310, 30);
  ctx.fillStyle = "#8ec8d4";
  ctx.font = "600 9px 'Source Sans 3', sans-serif";
  ctx.fillText(weaponFor(p.letter).name.toUpperCase(), 310, 44);
  ctx.fillStyle = "rgba(232,236,232,0.85)";
  ctx.font = "500 13px 'Source Sans 3', sans-serif";
  if (objective) ctx.fillText(objective, 16, VIEW_H - 18);
  if (toast) {
    ctx.textAlign = "center";
    ctx.fillStyle = "#e8ece8";
    ctx.font = "600 16px 'Cormorant Garamond', serif";
    ctx.fillText(toast, VIEW_W / 2, 72);
  }
}
