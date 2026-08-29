/** Optional HD skins. Missing files fall back to code-drawn tiles. */
import { VIEW_W } from "./types";

export type ArtKind = "tiles" | "hazards" | "movers" | "props" | "bg" | "weapons" | "fx";

export interface ArtEntry {
  kind: ArtKind;
  name: string;
  /** Sprite-sheet columns; 1 = still. */
  cols?: number;
  /** Sprite-sheet rows; 1 = still. */
  rows?: number;
}

export const ART_MANIFEST: ArtEntry[] = [
  { kind: "tiles", name: "solid-hub" },
  { kind: "tiles", name: "solid-street" },
  { kind: "tiles", name: "solid-fort" },
  { kind: "tiles", name: "solid-canal" },
  { kind: "tiles", name: "solid-coil" },
  { kind: "tiles", name: "solid-vault" },
  { kind: "tiles", name: "solid-glacier" },
  { kind: "tiles", name: "solid-remainder" },
  { kind: "tiles", name: "solid-abyss" },
  { kind: "tiles", name: "solid-spire" },
  { kind: "tiles", name: "solid-orbit" },
  { kind: "hazards", name: "spike" },
  { kind: "hazards", name: "saw" },
  { kind: "movers", name: "shelf" },
  { kind: "movers", name: "bounce" },
  { kind: "movers", name: "conveyor" },
  { kind: "movers", name: "fan" },
  { kind: "movers", name: "lift" },
  { kind: "movers", name: "blink" },
  { kind: "movers", name: "geyser" },
  { kind: "props", name: "torch" },
  { kind: "props", name: "lantern" },
  { kind: "props", name: "fort-brazier" },
  { kind: "props", name: "vault-lamp" },
  { kind: "bg", name: "street-far" },
  { kind: "bg", name: "street-mid" },
  { kind: "bg", name: "hub-far" },
  { kind: "bg", name: "hub-mid" },
  { kind: "bg", name: "fort-far" },
  { kind: "bg", name: "canal-far" },
  { kind: "bg", name: "canal-mid" },
  { kind: "bg", name: "canal-near" },
  { kind: "bg", name: "coil-far" },
  { kind: "bg", name: "vault-far" },
  { kind: "bg", name: "abyss-far" },
  { kind: "bg", name: "spire-far" },
  { kind: "bg", name: "orbit-far" },
  { kind: "bg", name: "orbit-mid" },
  { kind: "bg", name: "orbit-near" },
  { kind: "bg", name: "glacier-far" },
  { kind: "bg", name: "glacier-mid" },
  { kind: "bg", name: "glacier-near" },
  { kind: "bg", name: "remainder-far" },
  { kind: "bg", name: "remainder-mid" },
  { kind: "weapons", name: "c" },
  { kind: "weapons", name: "s" },
  { kind: "weapons", name: "b" },
  { kind: "weapons", name: "e" },
  { kind: "weapons", name: "r" },
  { kind: "weapons", name: "k" },
  { kind: "weapons", name: "n" },
  { kind: "weapons", name: "t" },
  { kind: "fx", name: "slash-arc", cols: 2, rows: 2 },
  { kind: "fx", name: "slash-smash", cols: 2, rows: 2 },
  { kind: "fx", name: "slash-thrust", cols: 2, rows: 2 },
  { kind: "fx", name: "slash-ember", cols: 2, rows: 2 },
  { kind: "fx", name: "slash-side", cols: 2, rows: 2 },
  { kind: "fx", name: "slash-up", cols: 2, rows: 2 },
  { kind: "fx", name: "slash-down", cols: 2, rows: 2 },
  { kind: "fx", name: "slash-back", cols: 2, rows: 2 },
  { kind: "fx", name: "slash-dash", cols: 2, rows: 2 },
  { kind: "fx", name: "smash-burst", cols: 2, rows: 2 },
  { kind: "fx", name: "impact-hit", cols: 2, rows: 2 },
  { kind: "fx", name: "flourish-ring", cols: 2, rows: 2 },
  { kind: "fx", name: "flourish-reaper", cols: 2, rows: 2 },
  { kind: "fx", name: "flourish-slam", cols: 2, rows: 2 },
  { kind: "fx", name: "flourish-thrust", cols: 2, rows: 2 },
  { kind: "fx", name: "flourish-ember", cols: 2, rows: 2 },
  { kind: "fx", name: "art-c", cols: 3, rows: 2 },
];

const byKey = new Map<string, ArtEntry>();
for (const e of ART_MANIFEST) byKey.set(`${e.kind}/${e.name}`, e);

function keyOf(kind: string, name: string) {
  return `${kind}/${name}`;
}

export function artUrl(kind: string, name: string) {
  return `/glyphbound/${kind}/${name}.png`;
}

/** Pin the thickest part of a slash cell on the hitbox, not the cell center. */
export const FX_ORIGIN: Record<string, { ox: number; oy: number }> = {
  "slash-side": { ox: 0.38, oy: 0.5 },
  "slash-up": { ox: 0.48, oy: 0.78 },
  "slash-down": { ox: 0.5, oy: 0.3 },
  "slash-back": { ox: 0.62, oy: 0.5 },
  "slash-dash": { ox: 0.2, oy: 0.5 },
  "smash-burst": { ox: 0.5, oy: 0.5 },
  "slash-arc": { ox: 0.45, oy: 0.5 },
  "slash-thrust": { ox: 0.22, oy: 0.5 },
  "slash-ember": { ox: 0.28, oy: 0.5 },
  "slash-smash": { ox: 0.5, oy: 0.55 },
};

type Slot = HTMLImageElement | "fail";
const images = new Map<string, Slot>();
const pending = new Map<string, Promise<HTMLImageElement | null>>();
let primed = false;

function canLoad() {
  return typeof window !== "undefined" && typeof Image !== "undefined";
}

function load(url: string): Promise<HTMLImageElement | null> {
  const hit = images.get(url);
  if (hit === "fail") return Promise.resolve(null);
  if (hit) return Promise.resolve(hit);
  const running = pending.get(url);
  if (running) return running;
  if (!canLoad()) return Promise.resolve(null);
  const work = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      images.set(url, img);
      pending.delete(url);
      resolve(img);
    };
    img.onerror = () => {
      images.set(url, "fail");
      pending.delete(url);
      resolve(null);
    };
    img.src = url;
  });
  pending.set(url, work);
  return work;
}

export function preloadArt() {
  if (primed || !canLoad()) return;
  primed = true;
  for (const e of ART_MANIFEST) void load(artUrl(e.kind, e.name));
}

export function getArt(kind: string, name: string): HTMLImageElement | null {
  const url = artUrl(kind, name);
  const hit = images.get(url);
  if (hit === "fail") return null;
  if (hit) return hit;
  void load(url);
  return null;
}

export function artReady(kind: string, name: string) {
  return getArt(kind, name) != null;
}

/** Draw a still or a looping sheet cell. Returns false when the file is missing. */
export function blitArt(
  ctx: CanvasRenderingContext2D,
  kind: ArtKind,
  name: string,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  t = 0,
  frameOverride?: number,
): boolean {
  if (!byKey.has(keyOf(kind, name))) return false;
  const img = getArt(kind, name);
  if (!img) return false;
  const meta = byKey.get(keyOf(kind, name));
  const cols = Math.max(1, meta?.cols ?? 1);
  const rows = Math.max(1, meta?.rows ?? 1);
  const cw = img.width / cols;
  const ch = img.height / rows;
  if (cols === 1 && rows === 1) {
    ctx.drawImage(img, dx, dy, dw, dh);
    return true;
  }
  const n = cols * rows;
  const frame = frameOverride != null ? ((frameOverride % n) + n) % n : Math.floor(t * 8) % n;
  const sx = (frame % cols) * cw;
  const sy = Math.floor(frame / cols) * ch;
  ctx.drawImage(img, sx, sy, cw, ch, dx, dy, dw, dh);
  return true;
}

/** Repeatable strip offset. `camX + width / factor` yields the same seam. */
export function loopOffset(camX: number, factor: number, width: number) {
  const w = Math.max(1, width);
  let o = (-camX * factor) % w;
  if (o > 0) o -= w;
  return o;
}

/** Tile a scenery plate across the view. Returns false if the file is missing. */
export function blitLoop(
  ctx: CanvasRenderingContext2D,
  kind: ArtKind,
  name: string,
  camX: number,
  factor: number,
  y = 0,
  h = 0,
  camY = 0,
  yFactor = 0,
): boolean {
  const img = getArt(kind, name);
  if (!img || !img.width) return false;
  const dh = h || img.height;
  const dw = img.width * (dh / img.height);
  const x0 = loopOffset(camX, factor, dw);
  const dy = y - camY * yFactor;
  for (let x = x0; x < VIEW_W + dw; x += dw) {
    ctx.drawImage(img, x, dy, dw, dh);
  }
  return true;
}
