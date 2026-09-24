/** Cartographic sheet. North is up. The relief is the same ground the player walks. */

import { forwardFromYaw } from "./sim";
import { SCRIPT, SERIF, SPIRE } from "./layout";
import { MESA, SHEET, sheetVisible, terrainHeight, terrainRgb } from "./terrain";

export const RELIEF_W = 480;
export const RELIEF_H = 300;

const PAPER = [244, 231, 200] as const;

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

export function sheetProject(x: number, z: number, width: number, height: number) {
  return {
    px: ((x - SHEET.x0) / (SHEET.x1 - SHEET.x0)) * width,
    py: ((SHEET.z1 - z) / (SHEET.z1 - SHEET.z0)) * height,
  };
}

/** Radians, canvas-clockwise, for an arrow that points up at angle 0. Yaw 0 faces south, so the arrow points down. */
export function markerAngle(yaw: number) {
  const face = forwardFromYaw(yaw);
  return Math.atan2(face.x, face.z);
}

/** 0 is dark, 1 is fully lit. The light sits in the north-west. */
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

/** RGBA relief of the whole sheet, hillshaded and contoured. Built once. */
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

let reliefCanvas: HTMLCanvasElement | null = null;

function reliefSource() {
  if (reliefCanvas) return reliefCanvas;
  const canvas = document.createElement("canvas");
  canvas.width = RELIEF_W;
  canvas.height = RELIEF_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const image = ctx.createImageData(RELIEF_W, RELIEF_H);
  image.data.set(buildRelief());
  ctx.putImageData(image, 0, 0);
  reliefCanvas = canvas;
  return canvas;
}

function withKnown(
  ctx: CanvasRenderingContext2D,
  view: SheetView,
  width: number,
  height: number,
  draw: () => void,
) {
  ctx.save();
  if (!view.spireReached) {
    const sx = width / (SHEET.x1 - SHEET.x0);
    const sy = height / (SHEET.z1 - SHEET.z0);
    const camp = sheetProject(0, 6, width, height);
    const here = sheetProject(view.x, view.z, width, height);
    ctx.beginPath();
    ctx.ellipse(camp.px, camp.py, 28 * sx, 28 * sy, 0, 0, Math.PI * 2);
    ctx.ellipse(here.px, here.py, 16 * sx, 16 * sy, 0, 0, Math.PI * 2);
    ctx.clip();
  }
  draw();
  ctx.restore();
}

function strokePoly(ctx: CanvasRenderingContext2D, points: { x: number; z: number }[], width: number, height: number) {
  if (points.length < 2) return;
  ctx.beginPath();
  points.forEach((point, index) => {
    const projected = sheetProject(point.x, point.z, width, height);
    if (index === 0) ctx.moveTo(projected.px, projected.py);
    else ctx.lineTo(projected.px, projected.py);
  });
  ctx.stroke();
}

function label(ctx: CanvasRenderingContext2D, x: number, z: number, text: string, width: number, height: number, view: SheetView) {
  if (!sheetVisible(x, z, view.x, view.z, view.spireReached)) return;
  const projected = sheetProject(x, z, width, height);
  ctx.font = "13px Fraunces, Palatino, serif";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#f4e7c8";
  ctx.strokeText(text, projected.px + 8, projected.py - 6);
  ctx.fillStyle = "#24180f";
  ctx.fillText(text, projected.px + 8, projected.py - 6);
}

function mark(ctx: CanvasRenderingContext2D, x: number, z: number, color: string, width: number, height: number, view: SheetView) {
  if (!sheetVisible(x, z, view.x, view.z, view.spireReached)) return;
  const projected = sheetProject(x, z, width, height);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(projected.px, projected.py, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

export function drawSheet(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  view: SheetView,
  pins: { x: number; z: number }[],
) {
  ctx.fillStyle = `rgb(${PAPER[0]},${PAPER[1]},${PAPER[2]})`;
  ctx.fillRect(0, 0, width, height);
  withKnown(ctx, view, width, height, () => {
    ctx.drawImage(reliefSource(), 0, 0, width, height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(36, 24, 15, 0.55)";
    ctx.lineWidth = Math.max(1, width / 520);
    const trail = [];
    for (let i = 0; i <= 28; i++) {
      const t = i / 28;
      trail.push({ x: 2 + (SPIRE.x - 2) * t, z: 6 + (SPIRE.z - 6) * t });
    }
    strokePoly(ctx, trail, width, height);
  });

  label(ctx, 0, 6, "Camp", width, height, view);
  label(ctx, MESA.x, MESA.z, "Mesa", width, height, view);
  label(ctx, SPIRE.x, SPIRE.z, "Spire", width, height, view);
  label(ctx, SCRIPT.x, SCRIPT.z - 6, "Script", width, height, view);
  mark(ctx, SPIRE.x, SPIRE.z, "#8d5a32", width, height, view);
  mark(ctx, SCRIPT.x, SCRIPT.z, "#2a3a72", width, height, view);
  if (!view.stagFreed) mark(ctx, view.stagX, view.stagZ, "#9a3a22", width, height, view);
  if (view.serif === 0) mark(ctx, SERIF.x, SERIF.z, "#c4a15a", width, height, view);
  for (const pin of pins) mark(ctx, pin.x, pin.z, "#24180f", width, height, view);

  const here = sheetProject(view.x, view.z, width, height);
  ctx.save();
  ctx.translate(here.px, here.py);
  ctx.rotate(markerAngle(view.yaw));
  ctx.fillStyle = "#1c243f";
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(5, 7);
  ctx.lineTo(-5, 7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  const sx = width / (SHEET.x1 - SHEET.x0);
  const bar = 40 * sx;
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
  ctx.fillText("40 m", 16, height - 26);

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
