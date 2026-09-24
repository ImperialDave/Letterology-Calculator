/** Cartographic sheet. North is up. The picture uses the same ground as the walk. */

import { forwardFromYaw } from "./sim";
import { HOUSES, SCRIPT, SERIF, SPIRE } from "./layout";
import { FORD, MESA, riverCenter, SHEET, sheetVisible, terrainHeight, terrainRgb } from "./terrain";

export const RELIEF_W = 480;
export const RELIEF_H = 300;

const PAPER = [244, 231, 200] as const;
const INK = "#1c243f";

export type SheetView = {
  x: number;
  z: number;
  yaw: number;
  stagX: number;
  stagZ: number;
  stagFreed: boolean;
  serif: number;
  spireReached: boolean;
};

export type SheetFrame = { x0: number; x1: number; z0: number; z1: number };

function fitAspect(frame: SheetFrame, aspect: number): SheetFrame {
  let { x0, x1, z0, z1 } = frame;
  const worldAspect = (x1 - x0) / (z1 - z0);
  if (worldAspect < aspect) {
    const grow = ((z1 - z0) * aspect - (x1 - x0)) / 2;
    x0 -= grow;
    x1 += grow;
  } else if (worldAspect > aspect) {
    const grow = ((x1 - x0) / aspect - (z1 - z0)) / 2;
    z0 -= grow;
    z1 += grow;
  }
  return { x0, x1, z0, z1 };
}

/** Before the spire, the sheet frames the camp and wherever she is standing. After it, the whole steppe. */
export function sheetFrame(view: { x: number; z: number; spireReached: boolean }, aspect = 210 / 115): SheetFrame {
  if (view.spireReached) return fitAspect(SHEET, aspect);
  const circles = [
    { x: 0, z: 6, r: 34 },
    { x: view.x, z: view.z, r: 22 },
  ];
  let x0 = Infinity;
  let x1 = -Infinity;
  let z0 = Infinity;
  let z1 = -Infinity;
  for (const circle of circles) {
    x0 = Math.min(x0, circle.x - circle.r);
    x1 = Math.max(x1, circle.x + circle.r);
    z0 = Math.min(z0, circle.z - circle.r);
    z1 = Math.max(z1, circle.z + circle.r);
  }
  return fitAspect({ x0, x1, z0, z1 }, aspect);
}

export function sheetProject(x: number, z: number, width: number, height: number, frame: SheetFrame = SHEET) {
  return {
    px: ((x - frame.x0) / (frame.x1 - frame.x0)) * width,
    py: ((frame.z1 - z) / (frame.z1 - frame.z0)) * height,
  };
}

export function sheetUnproject(u: number, v: number, frame: SheetFrame) {
  return {
    x: frame.x0 + u * (frame.x1 - frame.x0),
    z: frame.z1 - v * (frame.z1 - frame.z0),
  };
}

/** Radians, canvas-clockwise, for an arrow that points up at angle 0. Yaw 0 faces south, so the arrow points down. */
export function markerAngle(yaw: number) {
  const face = forwardFromYaw(yaw);
  return Math.atan2(face.x, face.z);
}

/** 0 is dark, 1 is fully lit. The light sits in the north-west. Kept as a placement guide, not the sheet the player sees. */
export function hillshade(x: number, z: number, step = 8) {
  const dx = (terrainHeight(x + step, z) - terrainHeight(x - step, z)) / (2 * step);
  const dz = (terrainHeight(x, z + step) - terrainHeight(x, z - step)) / (2 * step);
  const nx = -dx;
  const ny = 1;
  const nz = -dz;
  const nLen = Math.hypot(nx, ny, nz) || 1;
  const lx = -0.62;
  const ly = 0.74;
  const lz = 0.28;
  const lLen = Math.hypot(lx, ly, lz);
  const light = (nx * lx + ny * ly + nz * lz) / (nLen * lLen);
  return Math.max(0, Math.min(1, light));
}

function contourMix(x: number, z: number) {
  const band = 5;
  const h = terrainHeight(x, z);
  const hx = terrainHeight(x + 4, z);
  const hz = terrainHeight(x, z + 4);
  if (Math.hypot(hx - h, hz - h) / 4 < 0.22) return 0;
  const frac = Math.abs(h / band - Math.round(h / band));
  if (frac > 0.1) return 0;
  return 1 - frac / 0.1;
}

/** RGBA relief of the whole sheet, hillshaded and contoured. Built once. A guide for the drawing, not the drawing. */
export function buildRelief(): Uint8ClampedArray {
  const data = new Uint8ClampedArray(RELIEF_W * RELIEF_H * 4);
  for (let iy = 0; iy < RELIEF_H; iy++) {
    for (let ix = 0; ix < RELIEF_W; ix++) {
      const u = (ix + 0.5) / RELIEF_W;
      const v = (iy + 0.5) / RELIEF_H;
      const x = SHEET.x0 + u * (SHEET.x1 - SHEET.x0);
      const z = SHEET.z1 - v * (SHEET.z1 - SHEET.z0);
      const shade = hillshade(x, z);
      const [r, g, b] = terrainRgb(x, z);
      const grain = ((Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263)) >>> 0) % 13;
      const lit = 0.34 + shade * 0.86;
      const ink = contourMix(x, z);
      let rr = r * lit * 255 + grain * 0.35;
      let gg = g * lit * 255 + grain * 0.28;
      let bb = b * lit * 255 + grain * 0.18;
      rr = rr * (1 - ink * 0.28) + 48 * ink * 0.28;
      gg = gg * (1 - ink * 0.28) + 36 * ink * 0.28;
      bb = bb * (1 - ink * 0.28) + 24 * ink * 0.28;
      const i = (iy * RELIEF_W + ix) * 4;
      data[i] = rr;
      data[i + 1] = gg;
      data[i + 2] = bb;
      data[i + 3] = 255;
    }
  }
  return data;
}

function knownMask(width: number, height: number, view: SheetView, frame: SheetFrame) {
  const mask = document.createElement("canvas");
  mask.width = Math.max(1, Math.floor(width));
  mask.height = Math.max(1, Math.floor(height));
  const ink = mask.getContext("2d");
  if (!ink) return mask;
  if (view.spireReached) {
    ink.fillStyle = "#fff";
    ink.fillRect(0, 0, mask.width, mask.height);
    return mask;
  }
  const sx = width / (frame.x1 - frame.x0);
  const sy = height / (frame.z1 - frame.z0);
  const wash = (x: number, z: number, radius: number) => {
    const projected = sheetProject(x, z, width, height, frame);
    const rx = radius * sx;
    const ry = radius * sy;
    const fade = ink.createRadialGradient(projected.px, projected.py, rx * 0.9, projected.px, projected.py, rx);
    fade.addColorStop(0, "rgba(255,255,255,1)");
    fade.addColorStop(1, "rgba(255,255,255,0)");
    ink.fillStyle = fade;
    ink.beginPath();
    ink.ellipse(projected.px, projected.py, rx, ry, 0, 0, Math.PI * 2);
    ink.fill();
  };
  wash(0, 6, 28);
  wash(view.x, view.z, 16);
  return mask;
}

function strokePoly(
  ctx: CanvasRenderingContext2D,
  points: { x: number; z: number }[],
  width: number,
  height: number,
  frame: SheetFrame,
) {
  if (points.length < 2) return;
  ctx.beginPath();
  points.forEach((point, index) => {
    const projected = sheetProject(point.x, point.z, width, height, frame);
    if (index === 0) ctx.moveTo(projected.px, projected.py);
    else ctx.lineTo(projected.px, projected.py);
  });
  ctx.stroke();
}

function iconFountain(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.strokeStyle = "#2a3a72";
  ctx.lineWidth = 1.6 * s;
  ctx.beginPath();
  ctx.arc(x, y, 7 * s, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#8ec8e8";
  ctx.beginPath();
  ctx.arc(x, y, 3 * s, 0, Math.PI * 2);
  ctx.fill();
}

function iconSpire(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.fillStyle = "#8d5a32";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.25 * s;
  ctx.beginPath();
  ctx.moveTo(x, y - 13 * s);
  ctx.lineTo(x + 6 * s, y + 5 * s);
  ctx.lineTo(x - 6 * s, y + 5 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function iconStag(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.fillStyle = "#6e2414";
  ctx.beginPath();
  ctx.ellipse(x - s, y + s, 9 * s, 4.4 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 8 * s, y - 2.2 * s, 3 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.35 * s;
  ctx.beginPath();
  ctx.moveTo(x + 6 * s, y - 4 * s);
  ctx.lineTo(x + 4 * s, y - 11 * s);
  ctx.moveTo(x + 8 * s, y - 4 * s);
  ctx.lineTo(x + 12 * s, y - 11 * s);
  ctx.moveTo(x + 10 * s, y - 3 * s);
  ctx.lineTo(x + 14 * s, y - 8 * s);
  ctx.stroke();
}

function iconPin(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(x, y - 2 * s, 3.2 * s, 0, Math.PI * 2);
  ctx.moveTo(x, y + 6 * s);
  ctx.lineTo(x - 2.8 * s, y + s);
  ctx.lineTo(x + 2.8 * s, y + s);
  ctx.fill();
}

function roof(ctx: CanvasRenderingContext2D, x: number, y: number, span: number) {
  ctx.fillStyle = "#c46a3a";
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1, span / 8);
  ctx.beginPath();
  ctx.moveTo(x - span, y + span * 0.38);
  ctx.lineTo(x, y - span * 0.72);
  ctx.lineTo(x + span, y + span * 0.38);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/** Names sit beside the marks. The marks themselves have no letters in them. */
function caption(
  ctx: CanvasRenderingContext2D,
  featureX: number,
  featureZ: number,
  text: string,
  pixelX: number,
  pixelY: number,
  width: number,
  height: number,
  view: SheetView,
  frame: SheetFrame,
) {
  if (!sheetVisible(featureX, featureZ, view.x, view.z, view.spireReached)) return;
  const mark = sheetProject(featureX, featureZ, width, height, frame);
  const unit = Math.max(0.85, width / 700);
  const font = Math.max(13, Math.round(width / 46));
  let nameX = mark.px + pixelX * unit;
  let nameY = mark.py + pixelY * unit;
  const wide = text.length * font * 0.52;
  if (pixelX >= 0 && nameX + wide > width - 4) nameX = mark.px - Math.abs(pixelX) * unit;
  if (pixelX < 0 && nameX - wide < 4) nameX = mark.px + Math.abs(pixelX) * unit;
  if (nameY < 22) nameY = mark.py + Math.abs(pixelY) * unit;
  if (nameY > height - 28) nameY = mark.py - Math.abs(pixelY) * unit;
  const name = { px: nameX, py: nameY };
  const dx = name.px - mark.px;
  const dy = name.py - mark.py;
  const len = Math.hypot(dx, dy) || 1;
  if (len > 16) {
    ctx.strokeStyle = "rgba(36, 24, 15, 0.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mark.px + (dx / len) * 9, mark.py + (dy / len) * 9);
    ctx.lineTo(name.px - (dx / len) * 6, name.py - (dy / len) * 6);
    ctx.stroke();
  }
  const left = dx < -4;
  ctx.font = `${font}px Fraunces, Palatino, serif`;
  ctx.textAlign = Math.abs(dx) < 8 ? "center" : left ? "right" : "left";
  ctx.textBaseline = "middle";
  const tx = name.px + (left ? -2 : 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#f4e7c8";
  ctx.lineJoin = "round";
  ctx.strokeText(text, tx, name.py);
  ctx.fillStyle = "#24180f";
  ctx.fillText(text, tx, name.py);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function paintPicture(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  view: SheetView,
  frame: SheetFrame,
) {
  const sx = width / (frame.x1 - frame.x0);
  const sy = height / (frame.z1 - frame.z0);
  ctx.fillStyle = "#c5d98a";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#6fa33a";
  ctx.lineWidth = 1.1;
  ctx.globalAlpha = 0.45;
  for (let x = Math.floor(frame.x0); x < frame.x1; x += 7) {
    for (let z = Math.floor(frame.z0); z < frame.z1; z += 6) {
      const n = (Math.imul(x, 13) ^ Math.imul(z, 29)) >>> 0;
      if (n % 5 > 1) continue;
      const projected = sheetProject(x, z, width, height, frame);
      ctx.beginPath();
      ctx.moveTo(projected.px, projected.py);
      ctx.lineTo(projected.px - 2.2, projected.py + 4);
      ctx.moveTo(projected.px, projected.py);
      ctx.lineTo(projected.px + 2.2, projected.py + 4);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  const inked = (x: number, z: number) => {
    if (view.spireReached) return true;
    return Math.hypot(x, z - 6) < 22 || Math.hypot(x - view.x, z - view.z) < 12;
  };

  if (inked(MESA.x, MESA.z)) {
    const mesa = sheetProject(MESA.x, MESA.z, width, height, frame);
    ctx.fillStyle = "#e4d8c4";
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(1.15, width / 640);
    ctx.beginPath();
    ctx.ellipse(mesa.px, mesa.py, 20 * sx, 16 * sy, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(mesa.px, mesa.py, 11 * sx, 8 * sy, 0, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 7; i++) {
      const angle = Math.PI * 0.15 + i * 0.22;
      const inner = sheetProject(MESA.x + Math.cos(angle) * 12, MESA.z + Math.sin(angle) * 9, width, height, frame);
      const outer = sheetProject(MESA.x + Math.cos(angle) * 19, MESA.z + Math.sin(angle) * 15, width, height, frame);
      ctx.beginPath();
      ctx.moveTo(inner.px, inner.py);
      ctx.lineTo(outer.px, outer.py);
      ctx.stroke();
    }
  }

  const rise = sheetProject(SPIRE.x, SPIRE.z, width, height, frame);
  if (inked(SPIRE.x, SPIRE.z)) {
    ctx.fillStyle = "#efe4cc";
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(1.15, width / 640);
    ctx.beginPath();
    ctx.ellipse(rise.px, rise.py, 12 * sx, 10 * sy, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  const riverRuns: { x: number; z: number }[][] = [];
  let riverRun: { x: number; z: number }[] = [];
  for (let x = -18; x <= 100; x += 2) {
    if (Math.abs(x - FORD.x) < FORD.halfX) {
      if (riverRun.length > 1) riverRuns.push(riverRun);
      riverRun = [];
      continue;
    }
    const z = riverCenter(x);
    if (!inked(x, z)) {
      if (riverRun.length > 1) riverRuns.push(riverRun);
      riverRun = [];
      continue;
    }
    riverRun.push({ x, z });
  }
  if (riverRun.length > 1) riverRuns.push(riverRun);
  ctx.strokeStyle = "#7d9468";
  ctx.lineWidth = Math.max(5, 8 * Math.min(sx, sy));
  ctx.lineCap = "butt";
  for (const run of riverRuns) strokePoly(ctx, run, width, height, frame);
  const fordZ = riverCenter(FORD.x);
  if (inked(FORD.x, fordZ)) {
    ctx.strokeStyle = "#f3e2b0";
    ctx.lineWidth = Math.max(2, 2.4 * sx);
    for (let i = -1; i <= 1; i++) {
      const a = sheetProject(FORD.x - 2.2, fordZ + i * 1.15, width, height, frame);
      const b = sheetProject(FORD.x + 2.2, fordZ + i * 1.15, width, height, frame);
      ctx.beginPath();
      ctx.moveTo(a.px, a.py);
      ctx.lineTo(b.px, b.py);
      ctx.stroke();
    }
  }

  const trail: { x: number; z: number }[] = [];
  for (let i = 0; i <= 28; i++) {
    const t = i / 28;
    trail.push({ x: 2 + (SPIRE.x - 2) * t, z: 6 + (SPIRE.z - 6) * t });
  }
  ctx.strokeStyle = "#f3e2b0";
  ctx.lineWidth = Math.max(4, 5.5 * Math.min(sx, sy));
  strokePoly(ctx, trail, width, height, frame);
  ctx.strokeStyle = "rgba(36, 24, 15, 0.4)";
  ctx.lineWidth = Math.max(1, width / 700);
  strokePoly(ctx, trail, width, height, frame);

  for (const house of HOUSES) {
    const projected = sheetProject(house.x, house.z, width, height, frame);
    roof(ctx, projected.px, projected.py, Math.max(9, 3.2 * sx));
  }
  if (inked(SCRIPT.x, SCRIPT.z)) {
    const script = sheetProject(SCRIPT.x, SCRIPT.z, width, height, frame);
    roof(ctx, script.px, script.py, Math.max(10, 3.6 * sx));
  }

}

export function drawSheet(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  view: SheetView,
  pins: { x: number; z: number }[],
) {
  const frame = sheetFrame(view, width / Math.max(1, height));
  ctx.fillStyle = `rgb(${PAPER[0]},${PAPER[1]},${PAPER[2]})`;
  ctx.fillRect(0, 0, width, height);

  const picture = document.createElement("canvas");
  picture.width = Math.max(1, Math.floor(width));
  picture.height = Math.max(1, Math.floor(height));
  const ink = picture.getContext("2d");
  if (ink) paintPicture(ink, picture.width, picture.height, view, frame);

  ctx.save();
  ctx.drawImage(picture, 0, 0, width, height);
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(knownMask(width, height, view, frame), 0, 0);
  ctx.restore();
  ctx.save();
  ctx.globalCompositeOperation = "destination-over";
  ctx.fillStyle = `rgb(${PAPER[0]},${PAPER[1]},${PAPER[2]})`;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  const s = Math.max(0.9, Math.min(1.6, width / 520));
  const mark = (x: number, z: number, radius: number, draw: (px: number, py: number) => void) => {
    if (!sheetVisible(x, z, view.x, view.z, view.spireReached)) return;
    const projected = sheetProject(x, z, width, height, frame);
    ctx.fillStyle = "rgba(244, 231, 200, 0.94)";
    ctx.beginPath();
    ctx.arc(projected.px, projected.py, radius, 0, Math.PI * 2);
    ctx.fill();
    draw(projected.px, projected.py);
  };
  mark(6.5, 14, 11 * s, (px, py) => iconFountain(ctx, px, py, s));
  mark(SPIRE.x, SPIRE.z, 12 * s, (px, py) => iconSpire(ctx, px, py - 2 * s, s));
  if (!view.stagFreed) mark(view.stagX, view.stagZ, 13 * s, (px, py) => iconStag(ctx, px, py, s));
  if (view.serif === 0) mark(SERIF.x, SERIF.z, 8 * s, (px, py) => iconPin(ctx, px, py, s));
  for (const pin of pins) mark(pin.x, pin.z, 7 * s, (px, py) => iconPin(ctx, px, py, s * 0.9));

  const close = frame.x1 - frame.x0 < 120;
  caption(ctx, -8.5, 15, "Camp", close ? 0 : -56, close ? -44 : -6, width, height, view, frame);
  caption(ctx, 6.5, 14, "Fountain", close ? -8 : 0, close ? -58 : -46, width, height, view, frame);
  caption(ctx, MESA.x, MESA.z, "Mesa", 28, 22, width, height, view, frame);
  caption(ctx, SPIRE.x, SPIRE.z, "Spire", 36, -8, width, height, view, frame);
  caption(ctx, SCRIPT.x, SCRIPT.z, "Script", 8, -46, width, height, view, frame);
  if (!view.stagFreed) caption(ctx, view.stagX, view.stagZ, "Stag", 46, -26, width, height, view, frame);
  if (view.serif === 0) caption(ctx, SERIF.x, SERIF.z, "Serif", 42, -32, width, height, view, frame);

  const here = sheetProject(view.x, view.z, width, height, frame);
  ctx.save();
  ctx.translate(here.px, here.py);
  ctx.rotate(markerAngle(view.yaw));
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.moveTo(0, -11);
  ctx.lineTo(6, 8);
  ctx.lineTo(-6, 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  const span = frame.x1 - frame.x0;
  const barMeters = span > 140 ? 40 : 10;
  const bar = barMeters * (width / span);
  ctx.strokeStyle = "#24180f";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(16, height - 18);
  ctx.lineTo(16 + bar, height - 18);
  ctx.moveTo(16, height - 22);
  ctx.lineTo(16, height - 14);
  ctx.moveTo(16 + bar, height - 22);
  ctx.lineTo(16 + bar, height - 14);
  ctx.stroke();
  ctx.fillStyle = "#24180f";
  ctx.font = "12px Fraunces, Palatino, serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`${barMeters} m`, 16, height - 26);

  const roseX = width - 28;
  const roseY = 28;
  ctx.beginPath();
  ctx.moveTo(roseX, roseY - 12);
  ctx.lineTo(roseX, roseY + 10);
  ctx.moveTo(roseX - 8, roseY);
  ctx.lineTo(roseX + 8, roseY);
  ctx.stroke();
  ctx.fillText("N", roseX - 4, roseY - 16);
}
