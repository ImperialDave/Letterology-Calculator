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

export function drawParallax(
  ctx: CanvasRenderingContext2D,
  camX: number,
  camY: number,
  t: number,
  theme: ThemeId,
  shakeX: number,
  shakeY: number,
) {
  ctx.save();
  ctx.translate(shakeX, shakeY);
  const w = VIEW_W;
  const h = VIEW_H;
  if (theme === "hub") {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#121018");
    g.addColorStop(1, "#07080c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.35;
    for (let i = 0; i < 18; i++) {
      const px = ((i * 173 - camX * 0.08) % (w + 80)) - 40;
      const py = 40 + (i * 37) % 220;
      ctx.fillStyle = i % 2 ? "#c9b896" : "#8a7a62";
      ctx.font = `${18 + (i % 5) * 6}px "Fraunces", serif`;
      ctx.fillText(["Aa", "Ee", "Ss", "Rr", "Mm"][i % 5], px, py + Math.sin(t + i) * 6);
    }
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = "#5ee0c0";
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(((i * 220 - camX * 0.15) % (w + 100)) - 20, 0, 2, h);
    }
  } else if (theme === "street") {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#6d7c8c");
    g.addColorStop(0.28, "#8a97a4");
    g.addColorStop(0.55, "#5c6b78");
    g.addColorStop(0.78, "#3a4650");
    g.addColorStop(1, "#1c242c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const drawCloud = (cx: number, cy: number, s: number, a: number) => {
      ctx.globalAlpha = a;
      ctx.fillStyle = "#d5dde4";
      ctx.beginPath();
      ctx.ellipse(cx, cy, 48 * s, 16 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(cx - 28 * s, cy + 4 * s, 28 * s, 13 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 30 * s, cy + 3 * s, 26 * s, 12 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 6 * s, cy - 8 * s, 22 * s, 12 * s, 0, 0, Math.PI * 2);
      ctx.fill();
    };
    for (let i = 0; i < 7; i++) {
      const x = ((i * 170 - camX * 0.06) % (w + 220)) - 80;
      drawCloud(x, 28 + (i % 3) * 10, 0.7 + (i % 3) * 0.18, 0.22);
    }
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 6; i++) {
      const x = ((i * 210 - camX * 0.12) % (w + 260)) - 90;
      drawCloud(x, 58 + (i % 2) * 12, 1 + (i % 3) * 0.15, 0.16);
    }
    ctx.globalAlpha = 1;
    const skyline = [110, 190, 140, 240, 160, 210, 90, 260, 170, 130];
    for (let i = 0; i < 16; i++) {
      const bw = 42 + (i % 4) * 14;
      const bh = skyline[i % skyline.length];
      const x = ((i * 78 - camX * 0.2) % (w + 260)) - 90;
      const base = h - 78;
      ctx.fillStyle = i % 3 === 0 ? "#2c3944" : "#24303a";
      ctx.fillRect(x, base - bh, bw, bh);
      ctx.fillStyle = "rgba(200, 214, 224, 0.08)";
      ctx.fillRect(x + 2, base - bh, 3, bh);
      for (let wy = base - bh + 10; wy < base - 12; wy += 11) {
        for (let wx = x + 7; wx < x + bw - 6; wx += 8) {
          const on = ((i * 13 + wy + Math.floor(t * 0.4)) % 7) !== 0;
          ctx.fillStyle = on ? (i % 4 === 1 ? "rgba(232,210,150,0.45)" : "rgba(170,198,210,0.28)") : "rgba(12,16,20,0.35)";
          ctx.fillRect(wx, wy, 4, 6);
        }
      }
      if (i % 4 === 0) {
        ctx.fillStyle = "rgba(212,90,74,0.55)";
        ctx.font = "700 28px 'Source Serif 4', sans-serif";
        ctx.fillText(String((i * 3) % 10), x + bw * 0.25, base - bh + 32);
      }
    }
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#1a2228";
    for (let i = 0; i < 10; i++) {
      const x = ((i * 110 - camX * 0.38) % (w + 140)) - 50;
      ctx.fillRect(x, h - 92, 70 + (i % 3) * 16, 50);
      ctx.fillStyle = "rgba(232,210,150,0.12)";
      ctx.fillRect(x + 8, h - 84, 6, 8);
      ctx.fillStyle = "#1a2228";
    }
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#9aa8b4";
    ctx.fillRect(0, h - 70, w, 18);
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = "#b8c4ce";
    for (let i = 0; i < 55; i++) {
      const rx = ((i * 47 + t * 110 - camX * 0.55) % (w + 20)) - 10;
      const ry = ((i * 89 + t * 180) % (h - 40)) + 10;
      ctx.fillRect(rx, ry, 1.1, 7);
    }
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = "#d8e0e6";
    ctx.fillRect(0, h - 54, w, 54);
  } else if (theme === "canal") {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#0c1814");
    g.addColorStop(0.45, "#10241c");
    g.addColorStop(1, "#08140f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.28;
    for (let i = 0; i < 10; i++) {
      const x = ((i * 140 - camX * 0.12) % (w + 160)) - 40;
      ctx.fillStyle = i % 2 ? "#1a3a30" : "#16342a";
      ctx.fillRect(x, h - 160 - (i % 4) * 18, 28, 160);
      ctx.fillStyle = "rgba(94,224,192,0.08)";
      ctx.fillRect(x + 8, h - 150, 4, 80);
    }
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = "#2a6b5c";
    ctx.lineWidth = 10;
    for (let i = 0; i < 5; i++) {
      const x = ((i * 220 - camX * 0.28) % (w + 180)) - 60;
      ctx.beginPath();
      ctx.ellipse(x, h - 70, 70, 18, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = "#5ee0c0";
    for (let i = 0; i < 36; i++) {
      const rx = ((i * 53 + t * 20 - camX * 0.4) % (w + 20)) - 10;
      const ry = 40 + (i * 29 + t * 40) % (h - 80);
      ctx.fillRect(rx, ry, 1.4, 6);
    }
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = "#0a2018";
    ctx.fillRect(0, h - 64, w, 64);
  } else if (theme === "coil") {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#160814");
    g.addColorStop(0.5, "#1c0e22");
    g.addColorStop(1, "#0c0612");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = "#c46ad4";
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const x = ((i * 120 - camX * 0.16) % (w + 140)) - 50;
      ctx.beginPath();
      ctx.arc(x, 90 + (i % 3) * 40, 28 + (i % 3) * 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + 8, 118 + (i % 3) * 40, 22, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 14; i++) {
      const x = ((i * 90 - camX * 0.32) % (w + 120)) - 40;
      ctx.fillStyle = i % 2 ? "#2a1430" : "#221028";
      ctx.fillRect(x, h - 100 - (i % 5) * 16, 36, 100);
      ctx.fillStyle = "rgba(196,106,212,0.25)";
      ctx.fillRect(x + 8, h - 88, 3, 12);
      ctx.fillRect(x + 18, h - 88, 3, 12);
    }
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#e8a0f0";
    for (let i = 0; i < 28; i++) {
      const rx = ((i * 67 + t * 90 - camX * 0.5) % (w + 16)) - 8;
      const ry = (i * 41 + t * 70) % h;
      ctx.fillRect(rx, ry, 2, 2);
    }
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#101218");
    g.addColorStop(1, "#08090d");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = "#8aa0aa";
    ctx.lineWidth = 2;
    const gx = -((camX * 0.1) % 80);
    for (let x = gx; x < w + 80; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 20; y < h; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.5;
    const x4 = w * 0.55 - camX * 0.18;
    ctx.strokeStyle = "#7a8b96";
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(x4, 80);
    ctx.lineTo(x4, h - 40);
    ctx.moveTo(x4 - 70, 80);
    ctx.lineTo(x4 + 90, 80);
    ctx.stroke();
    ctx.globalAlpha = 0.07 + 0.04 * Math.sin(t * 0.7);
    ctx.fillStyle = "#d4c48a";
    ctx.beginPath();
    ctx.moveTo(w * 0.55, 0);
    ctx.lineTo(w * 0.35, h);
    ctx.lineTo(w * 0.75, h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function tileChar(rows: string[], tx: number, ty: number) {
  if (ty < 0 || ty >= rows.length || tx < 0 || tx >= rows[0].length) return "#";
  return rows[ty][tx];
}

function isBlock(ch: string) {
  return ch === "#" || ch === "*";
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
        drawSerifShelf(ctx, x, y, t, theme);
      } else if (ch === "-") {
        drawCrumble(ctx, x, y, t, theme);
      } else if (ch === "~") {
        drawSluice(ctx, x, y, t, theme);
      } else if (ch === ".") {
        const left = tileChar(rows, tx - 1, ty);
        const right = tileChar(rows, tx + 1, ty);
        const below = tileChar(rows, tx, ty + 1);
        if ((left === "#" || right === "#") && below !== "#" && ty > 5) {
          const g = ctx.createLinearGradient(x, y, x, y + TILE * 3);
          g.addColorStop(0, "rgba(232,236,240,0.08)");
          g.addColorStop(1, "rgba(94,224,192,0.12)");
          ctx.fillStyle = g;
          ctx.fillRect(x, y, TILE, TILE);
          ctx.fillStyle = `rgba(232,236,240,${0.12 + Math.sin(t * 3 + tx) * 0.06})`;
          ctx.fillRect(x + 18, y, 4, TILE);
        }
      } else if (ch === "v") {
        drawVent(ctx, x, y, t);
      } else if (ch === "^") {
        drawSpikes(ctx, x, y, t);
      } else if (ch === "F") {
        drawCaseFont(ctx, x, y, t);
      }
    }
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
  const stamp = (tx * 13 + ty * 7) % 6;
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
    ctx.fillStyle = "rgba(201,184,150,0.18)";
    ctx.font = "italic 22px 'Fraunces', serif";
    ctx.fillText(["e", "s", "r", "n", "c", "a"][stamp], x + 14, y + 32);
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
      ctx.font = "italic 14px 'Fraunces', serif";
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
      ctx.font = "700 13px 'Source Serif 4', sans-serif";
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
  if (brk) {
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
}

function drawSerifShelf(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, theme: string) {
  const pulse = 0.7 + Math.sin(t * 3 + x * 0.02) * 0.15;
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

function drawCrumble(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, theme: string) {
  ctx.save();
  ctx.globalAlpha = 0.75 + Math.sin(t * 6 + x) * 0.1;
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

function drawSluice(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, theme: string) {
  const ink = theme === "coil" ? "196,106,212" : "45,140,110";
  ctx.fillStyle = `rgba(${ink},0.55)`;
  ctx.fillRect(x, y + 16, TILE, TILE - 16);
  ctx.fillStyle = `rgba(${ink},0.28)`;
  ctx.fillRect(x, y + 8, TILE, 10);
  ctx.strokeStyle = `rgba(232,236,232,${0.15 + Math.sin(t * 4 + x * 0.05) * 0.1})`;
  ctx.beginPath();
  ctx.moveTo(x, y + 22 + Math.sin(t * 3 + x) * 2);
  ctx.quadraticCurveTo(x + 24, y + 18, x + TILE, y + 24);
  ctx.stroke();
}

function drawVent(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
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
  ctx.fillStyle = `rgba(94,224,192,${0.15 + Math.sin(t * 5 + y) * 0.1})`;
  ctx.fillRect(x + 14, y + ((t * 40 + y) % TILE), 8, 10);
}

function drawSpikes(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  for (let i = 0; i < 3; i++) {
    const ox = x + 4 + i * 14;
    ctx.fillStyle = "#6a2e2a";
    ctx.beginPath();
    ctx.moveTo(ox, y + TILE);
    ctx.lineTo(ox + 7, y + 10 + Math.sin(t * 8 + i) * 1.5);
    ctx.lineTo(ox + 14, y + TILE);
    ctx.fill();
    ctx.fillStyle = "#d45a4a";
    ctx.beginPath();
    ctx.moveTo(ox + 4, y + TILE);
    ctx.lineTo(ox + 7, y + 14);
    ctx.lineTo(ox + 10, y + TILE);
    ctx.fill();
  }
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
  ctx.font = "italic 16px 'Fraunces', serif";
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
  if (letter === "s") return { glow: "#7fd0ff", core: "#d8f4ff", deep: "#1a3a4a" };
  if (letter === "b") return { glow: "#c4b49a", core: "#efe4c8", deep: "#2a2418" };
  return {
    glow: capital ? "#9af8de" : "#5ee0c0",
    core: "#e8ece8",
    deep: "#0c201c",
  };
}

function emberEye(ctx: CanvasRenderingContext2D, x: number, y: number, glow: string) {
  ctx.fillStyle = "#e8ece8";
  ctx.beginPath();
  ctx.arc(x, y, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x + 0.7, y, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#07080c";
  ctx.beginPath();
  ctx.arc(x + 0.9, y, 0.55, 0, Math.PI * 2);
  ctx.fill();
}

function orbitMotes(ctx: CanvasRenderingContext2D, t: number, glow: string, r: number) {
  ctx.fillStyle = glow;
  for (let i = 0; i < 5; i++) {
    const a = t * 2.2 + i * 1.26;
    ctx.globalAlpha = 0.35 + Math.sin(t * 3 + i) * 0.15;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r, Math.sin(a * 1.15) * (r * 0.72), 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
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
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(4, 0, 9, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(10, -4);
  ctx.lineTo(20, 1);
  ctx.lineTo(10, 5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = glow;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.ellipse(3, 2, 5, 2.4, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#07080c";
  ctx.fillRect(15, 0, 2.2, 1.4);
  ctx.fillStyle = "#e8d48a";
  ctx.beginPath();
  ctx.ellipse(3, -3.2, 3.4, 2.6, -0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#07080c";
  ctx.beginPath();
  ctx.ellipse(4, -3.2, 0.85, 2.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(4.6, -4, 0.7, 0, Math.PI * 2);
  ctx.fill();
  if (capital) {
    ctx.strokeStyle = glow;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.quadraticCurveTo(4, -16, 11, -17);
    ctx.moveTo(-2, -5);
    ctx.quadraticCurveTo(-6, -14, -2, -18);
    ctx.stroke();
  }
  if (tongue) {
    const flick = Math.sin(t * 16) * 2.5;
    ctx.strokeStyle = "#d45a4a";
    ctx.lineWidth = 1.35;
    ctx.beginPath();
    ctx.moveTo(18, 2);
    ctx.lineTo(24 + flick, 3);
    ctx.lineTo(28 + flick, -1);
    ctx.moveTo(24 + flick, 3);
    ctx.lineTo(28 + flick, 7);
    ctx.stroke();
  }
  ctx.restore();
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
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(facing, 1);
  ctx.scale(1 / Math.max(0.7, squash), squash);
  if (hurt > 0) ctx.globalAlpha = 0.45 + 0.55 * Math.sin(t * 40);
  const bob = Math.sin(t * 6) * 1.4;
  ctx.translate(0, bob);
  const pal = inkPalette(letter, capital);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (letter === "c") {
    const r = capital ? 22 : 15;
    const thick = capital ? 7.5 : 4.8;
    const jaw = attack > 0 ? 0.22 : 0;
    const a0 = 0.55 - jaw;
    const a1 = Math.PI * 2 - 0.55 + jaw;
    ctx.strokeStyle = pal.glow;
    ctx.shadowColor = pal.glow;
    ctx.shadowBlur = capital ? 22 : 16;
    ctx.lineWidth = thick + 5;
    ctx.beginPath();
    ctx.arc(0, 0, r, a0, a1);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = pal.core;
    ctx.lineWidth = thick;
    ctx.beginPath();
    ctx.arc(0, 0, r, a0, a1);
    ctx.stroke();
    ctx.strokeStyle = pal.glow;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = thick * 0.4;
    ctx.beginPath();
    ctx.arc(0, 0, r - thick * 0.35, a0 + 0.2, a1 - 0.2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    emberEye(ctx, r * 0.12, -r * 0.2, pal.glow);
    if (capital) {
      ctx.strokeStyle = pal.core;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-2, -r - 3);
      ctx.lineTo(7, -r - 10);
      ctx.lineTo(12, -r - 4);
      ctx.stroke();
    }
    orbitMotes(ctx, t, pal.glow, r + 6);
    if (attack > 0) {
      ctx.strokeStyle = "rgba(232,236,232,0.75)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(8, 0, r + 11, -0.55, 0.7);
      ctx.stroke();
    }
    if (roll > 0) {
      ctx.rotate(t * 18);
      ctx.strokeStyle = "rgba(94,224,192,0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (letter === "s") {
    ctx.strokeStyle = pal.glow;
    ctx.shadowColor = pal.glow;
    ctx.shadowBlur = 14;
    ctx.lineWidth = 6.5;
    ctx.beginPath();
    ctx.moveTo(11, -13);
    ctx.bezierCurveTo(-18, -18, 18, 0, -11, 5);
    ctx.bezierCurveTo(-22, 10, 16, 18, 10, 13);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = pal.core;
    ctx.lineWidth = 3.6;
    ctx.stroke();
    emberEye(ctx, 6, -10, pal.glow);
    orbitMotes(ctx, t, pal.glow, 16);
    if (attack > 0) {
      ctx.strokeStyle = "rgba(127,208,255,0.7)";
      ctx.beginPath();
      ctx.moveTo(14, -6);
      ctx.lineTo(24, 2);
      ctx.stroke();
    }
  } else {
    ctx.strokeStyle = pal.glow;
    ctx.shadowColor = pal.glow;
    ctx.shadowBlur = 12;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-11, -18);
    ctx.lineTo(-11, 18);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(1, -8, 9, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(3, 8, 10, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = pal.core;
    ctx.lineWidth = 3.8;
    ctx.beginPath();
    ctx.moveTo(-11, -18);
    ctx.lineTo(-11, 18);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(1, -8, 9, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(3, 8, 10, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.stroke();
    emberEye(ctx, -4, -12, pal.glow);
    orbitMotes(ctx, t, pal.glow, 18);
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
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(e.facing, 1);
  if (e.stun > 0) {
    ctx.rotate(-0.18);
    ctx.globalAlpha = 0.55 + 0.45 * Math.sin(t * 28);
  } else if (e.flash > 0) ctx.globalAlpha = 0.5;
  const bob = e.stun > 0 ? 2 : Math.sin(t * 4 + e.t) * 1.5;
  ctx.translate(0, bob);
  const hide = "#2a4638";
  const scale = "#3d5a48";
  const metal = "#8aa0aa";
  const visor = "#d45a4a";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (e.kind === "one" || e.kind === "dummy") {
    ctx.strokeStyle = hide;
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(0, -e.h / 2 + 6);
    ctx.lineTo(0, e.h / 2 - 6);
    ctx.stroke();
    ctx.strokeStyle = metal;
    ctx.lineWidth = 3;
    ctx.stroke();
    drawScalesAlongArc(ctx, 2, -1.2, 1.2, 8, 6, "#1a2e24", metal, false);
    drawWyrmHead(ctx, 2, -e.h / 2 + 8, -0.4, 0.72, visor, scale, t, false, true);
    ctx.strokeStyle = scale;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-2, e.h / 2 - 8);
    ctx.quadraticCurveTo(-10, e.h / 2 - 2, -4, e.h / 2 + 4);
    ctx.stroke();
    ctx.strokeStyle = metal;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(6, 2);
    ctx.lineTo(16, 4);
    ctx.stroke();
    ctx.fillStyle = visor;
    ctx.fillRect(14, 2, 5, 3);
  } else if (e.kind === "zero") {
    ctx.strokeStyle = hide;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(0, 0, e.w / 2 - 3, 0.4, Math.PI * 2 - 0.2);
    ctx.stroke();
    ctx.strokeStyle = metal;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    drawScalesAlongArc(ctx, e.w / 2 - 3, 0.4, Math.PI * 2 - 0.2, 8, 12, "#1a2e24", metal, true);
    drawWyrmHead(ctx, e.w / 2 - 6, -4, -0.2, 0.7, visor, scale, t, false, true);
    ctx.fillStyle = "#07080c";
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = visor;
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.arc(0, 0, 9 + Math.sin(t * 3) * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (e.kind === "two" || e.kind === "dualis") {
    const s = e.kind === "dualis" ? 1.35 : 1;
    ctx.strokeStyle = hide;
    ctx.lineWidth = 8 * s;
    ctx.beginPath();
    ctx.moveTo(-10 * s, -12 * s);
    ctx.quadraticCurveTo(14 * s, -16 * s, 6 * s, -2 * s);
    ctx.quadraticCurveTo(-16 * s, 4 * s, 10 * s, 14 * s);
    ctx.stroke();
    ctx.strokeStyle = metal;
    ctx.lineWidth = 2.6 * s;
    ctx.stroke();
    drawWyrmHead(ctx, 8 * s, -14 * s, -0.5, 0.62 * s, visor, scale, t, e.kind === "dualis", true);
    drawWyrmHead(ctx, 10 * s, 12 * s, 0.5, 0.55 * s, visor, scale, t + 1, false, true);
    ctx.fillStyle = scale;
    ctx.beginPath();
    ctx.ellipse(-2, 0, 6 * s, 7 * s, 0.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.kind === "four" || e.kind === "tetrarch") {
    const s = e.kind === "tetrarch" ? 1.4 : 1;
    ctx.strokeStyle = hide;
    ctx.lineWidth = 9 * s;
    ctx.beginPath();
    ctx.moveTo(-12 * s, -16 * s);
    ctx.lineTo(-12 * s, 4 * s);
    ctx.lineTo(14 * s, 4 * s);
    ctx.moveTo(4 * s, -16 * s);
    ctx.lineTo(4 * s, 16 * s);
    ctx.stroke();
    ctx.strokeStyle = metal;
    ctx.lineWidth = 3 * s;
    ctx.stroke();
    drawWyrmHead(ctx, -8 * s, -16 * s, -1.3, 0.62 * s, visor, scale, t, e.kind === "tetrarch", true);
    ctx.fillStyle = scale;
    ctx.fillRect(-10 * s, 6, 16 * s, 7);
    ctx.strokeStyle = scale;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(4 * s, 16 * s);
    ctx.quadraticCurveTo(14 * s, 18 * s, 8 * s, 22 * s);
    ctx.stroke();
  } else if (e.kind === "eight") {
    ctx.strokeStyle = hide;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(0, -8, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 9, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = metal;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, -8, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 9, 10, 0, Math.PI * 2);
    ctx.stroke();
    drawWyrmHead(ctx, 8, -10, -0.2, 0.58, visor, scale, t, false, true);
    drawWyrmHead(ctx, -8, 10, 2.8, 0.5, visor, scale, t + 2, false, false);
  } else if (e.kind === "three") {
    ctx.strokeStyle = hide;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-10, -14);
    ctx.quadraticCurveTo(14, -16, 4, -2);
    ctx.quadraticCurveTo(-14, 4, 10, 14);
    ctx.stroke();
    ctx.strokeStyle = metal;
    ctx.lineWidth = 2.4;
    ctx.stroke();
    drawWyrmHead(ctx, 6, -14, -0.4, 0.6, visor, scale, t, false, true);
    ctx.fillStyle = scale;
    ctx.fillRect(-6, 10, 14, 5);
  } else if (e.kind === "six") {
    ctx.strokeStyle = hide;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(0, 6, 12, 0.2, Math.PI * 1.6);
    ctx.moveTo(-8, -2);
    ctx.quadraticCurveTo(-14, -16, 4, -14);
    ctx.stroke();
    ctx.strokeStyle = metal;
    ctx.lineWidth = 2.4;
    ctx.stroke();
    drawWyrmHead(ctx, 6, -14, -1.2, 0.58, visor, scale, t, false, true);
    ctx.fillStyle = visor;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(0, 8, 6 + Math.sin(t * 5) * 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
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
  if (e.kind === "dualis" || e.kind === "tetrarch") {
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
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.translate(0, Math.sin(t * 3 + x * 0.01) * 2);
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
  } else {
    ctx.fillStyle = "#d8e8e0";
    ctx.font = "600 42px 'Fraunces', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(glyph, 0, 0);
  }
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(232,236,232,0.75)";
  ctx.font = "500 9px 'Source Serif 4', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(glyph === "&" ? "board" : glyph, 0, 26);
  ctx.restore();
}


export function drawPlayer(ctx: CanvasRenderingContext2D, p: Player, camX: number, camY: number, t: number) {
  drawLetterForm(
    ctx,
    p.letter,
    p.letter === "c" && p.capital,
    p.x + p.w / 2 - camX,
    p.y + p.h / 2 - camY,
    p.facing,
    t + p.anim,
    p.squash,
    p.attack,
    p.roll,
    p.hurtFlash,
  );
  drawShieldBubble(ctx, p, camX, camY, t);
}

export function drawShot(ctx: CanvasRenderingContext2D, b: Bullet, camX: number, camY: number) {
  ctx.save();
  ctx.translate(b.x - camX, b.y - camY);
  ctx.rotate(Math.atan2(b.vy, b.vx));
  const col =
    b.from === "enemy"
      ? "#d45a4a"
      : b.kind === "solar"
        ? "#e8d48a"
        : b.kind === "venom"
          ? "#7fd0ff"
          : b.kind === "wind"
            ? "#9ad4e0"
            : "#5ee0c0";
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.shadowColor = col;
  ctx.shadowBlur = 10;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(0, 0, b.r, 0.7, Math.PI * 2 - 0.7);
  ctx.stroke();
  if (b.kind === "fang" || b.kind === "solar" || b.kind === "venom") {
    ctx.beginPath();
    ctx.moveTo(b.r - 1, -2.4);
    ctx.lineTo(b.r + 7, 0);
    ctx.lineTo(b.r - 1, 2.4);
    ctx.closePath();
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
) {
  const bob = Math.sin(t * 4 + x) * 3;
  ctx.save();
  ctx.translate(x, y + bob);
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
    ctx.font = "600 8px 'Source Serif 4', sans-serif";
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
    ctx.font = "600 8px 'Source Serif 4', sans-serif";
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
    ctx.font = "600 8px 'Source Serif 4', sans-serif";
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
    ctx.font = "600 9px 'Source Serif 4', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("DROP CAP", 0, 22);
  } else {
    ctx.fillStyle = "rgba(7,8,12,0.55)";
    roundRect(ctx, -16, -10, 32, 18, 6);
    ctx.fill();
    ctx.fillStyle = "#5ee0c0";
    ctx.font = "600 10px 'Source Serif 4', sans-serif";
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
  ctx.font = "600 10px 'Source Serif 4', sans-serif";
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
  ctx.font = "600 11px 'Source Serif 4', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(p.letter === "c" && p.capital ? "C" : p.letter, 310, 30);
  ctx.fillStyle = "#8ec8d4";
  ctx.font = "600 9px 'Source Serif 4', sans-serif";
  ctx.fillText(`FANG ${"I".repeat(p.shotLevel)}`, 310, 44);
  ctx.fillStyle = "rgba(232,236,232,0.85)";
  ctx.font = "500 13px 'Source Serif 4', sans-serif";
  if (objective) ctx.fillText(objective, 16, VIEW_H - 18);
  if (toast) {
    ctx.textAlign = "center";
    ctx.fillStyle = "#e8ece8";
    ctx.font = "600 16px 'Fraunces', serif";
    ctx.fillText(toast, VIEW_W / 2, 72);
  }
}
