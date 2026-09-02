/** 64px N64 paints. No three.js. wrap-safe so they tile. */

export type Plot = (x: number, y: number, r: number, g: number, b: number, a?: number) => void;

const BAYER = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
];

function wrap(v: number, n: number) {
  return ((v % n) + n) % n;
}

function dither(x: number, y: number, t: number) {
  return t * 64 > BAYER[(y & 7) * 8 + (x & 7)];
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function put(plot: Plot, x: number, y: number, c: [number, number, number], a = 255) {
  plot(x, y, c[0] | 0, c[1] | 0, c[2] | 0, a);
}

function band(plot: Plot, x: number, y: number, lo: [number, number, number], hi: [number, number, number], t: number) {
  put(plot, x, y, dither(x, y, t) ? hi : lo);
}

export function fillTex(n: number, paint: (plot: Plot, n: number) => void) {
  const buf = new Uint8ClampedArray(n * n * 4);
  const plot: Plot = (x, y, r, g, b, a = 255) => {
    const i = (wrap(y, n) * n + wrap(x, n)) * 4;
    buf[i] = r;
    buf[i + 1] = g;
    buf[i + 2] = b;
    buf[i + 3] = a ?? 255;
  };
  paint(plot, n);
  return buf;
}

export function paintInkWater(plot: Plot, n: number) {
  const deep = rgb("#1aa8b0");
  const mid = rgb("#5aeee0");
  const foam = rgb("#e8fff8");
  const glint = rgb("#ffffff");
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const w = Math.sin((x / n) * Math.PI * 4 + y * 0.12) * 0.5 + 0.5;
      const row = (y + w * 6) / n;
      const t = (Math.sin(row * Math.PI * 6) + 1) * 0.5 * 0.55 + w * 0.25;
      band(plot, x, y, deep, mid, 0.45 + t * 0.5);
      if (((x * 13 + y * 7) % 29 === 0) && dither(x, y, 0.55)) put(plot, x, y, foam);
      if ((x + y * 3) % 41 === 0) put(plot, x, y, glint);
    }
  }
}

export function paintIceWater(plot: Plot, n: number) {
  const a = rgb("#7ad0e8");
  const b = rgb("#e8f8ff");
  const c = rgb("#ffffff");
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const t = (Math.sin(x * 0.2) + Math.sin(y * 0.15) + 2) / 4;
      band(plot, x, y, a, b, 0.4 + t * 0.6);
      if ((x + y) % 17 === 0) put(plot, x, y, c);
    }
  }
}

export function paintSlagWater(plot: Plot, n: number) {
  const a = rgb("#c06038");
  const b = rgb("#f0a060");
  const c = rgb("#ffd080");
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const t = ((x * 3 + y * 5) % 23) / 23;
      band(plot, x, y, a, b, 0.4 + t * 0.55);
      if ((x * y) % 37 === 1) put(plot, x, y, c);
    }
  }
}

export function paintLead(plot: Plot, n: number) {
  const plate = rgb("#c8d4dc");
  const rib = rgb("#e8eef2");
  const rivet = rgb("#ffe08a");
  const shade = rgb("#8aa0b0");
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      put(plot, x, y, y % 8 < 2 ? rib : plate);
      if (x % 11 === 0) put(plot, x, y, shade);
      if (x % 16 === 4 && y % 16 === 4) put(plot, x, y, rivet);
      if (x % 16 === 12 && y % 16 === 12) put(plot, x, y, rivet);
    }
  }
}

export function paintBrass(plot: Plot, n: number) {
  const dark = rgb("#d4a040");
  const gold = rgb("#ffe08a");
  const shine = rgb("#fff8d8");
  const ink = rgb("#5ee0c0");
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const t = ((x + y) % 12) / 12;
      band(plot, x, y, dark, gold, 0.55 + t * 0.4);
      if ((x % 8 === 2 && y % 8 === 2) || (x % 8 === 6 && y % 8 === 6)) put(plot, x, y, shine);
      if (x % 32 === 0 && y % 4 < 2) put(plot, x, y, ink);
    }
  }
}

export function paintRust(plot: Plot, n: number) {
  const a = rgb("#e07048");
  const b = rgb("#ffb080");
  const c = rgb("#ffe0b0");
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const nse = ((x * 19 + y * 13) % 17) / 17;
      band(plot, x, y, a, b, 0.35 + nse * 0.55);
      if (nse > 0.82) put(plot, x, y, c);
    }
  }
}

export function paintGrass(plot: Plot, n: number) {
  const dirt = rgb("#d8c068");
  const leaf = rgb("#5ad848");
  const blade = rgb("#c8f878");
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      put(plot, x, y, leaf);
      const h = ((x * 7 + y * 3) % 11) / 11;
      if (dither(x, y, 0.25 + h * 0.2)) put(plot, x, y, dirt);
      if ((x + y * 2) % 9 === 0) put(plot, x, y, blade);
    }
  }
}

export function paintIce(plot: Plot, n: number) {
  const a = rgb("#c8ecf8");
  const b = rgb("#f4ffff");
  const c = rgb("#ffffff");
  const crack = rgb("#88c0d4");
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      band(plot, x, y, a, b, ((x ^ y) % 9) / 9);
      if (x % 21 === y % 13) put(plot, x, y, crack);
      if ((x + y) % 15 === 0) put(plot, x, y, c);
    }
  }
}

export function paintAsh(plot: Plot, n: number) {
  const a = rgb("#d88858");
  const b = rgb("#f0c090");
  const c = rgb("#ffe8b0");
  const ember = rgb("#ff8060");
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      band(plot, x, y, a, b, 0.4 + ((x * 5 + y * 9) % 16) / 16 * 0.5);
      if ((x * 3 + y) % 23 === 0) put(plot, x, y, ember);
      if ((x + y * 4) % 29 === 0) put(plot, x, y, c);
    }
  }
}

export function paintScale(plot: Plot, n: number) {
  const dark = rgb("#2e9a40");
  const mid = rgb("#6edc58");
  const lite = rgb("#c0f888");
  const eye = rgb("#fff060");
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      put(plot, x, y, dark);
      const ox = (Math.floor(y / 6) % 2) * 3;
      const cx = wrap(x - ox, n) % 6;
      const cy = y % 6;
      const d = Math.hypot(cx - 3, cy - 3);
      if (d < 2.8) put(plot, x, y, d < 1.4 ? lite : mid);
      if (d < 0.8 && (x + y) % 11 === 0) put(plot, x, y, eye);
    }
  }
}

export function paintCloud(plot: Plot, n: number) {
  const puff = rgb("#ffffff");
  const shade = rgb("#e8f0ff");
  const rim = rgb("#c8d8f0");
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      put(plot, x, y, puff, 0);
      const d1 = Math.hypot(wrap(x - 20, n) - 12, wrap(y - 28, n) - 10);
      const d2 = Math.hypot(wrap(x - 40, n) - 14, wrap(y - 22, n) - 8);
      const d3 = Math.hypot(wrap(x - 8, n) - 10, wrap(y - 40, n) - 9);
      const on = d1 < 14 || d2 < 12 || d3 < 11;
      if (!on) continue;
      const inner = d1 < 8 || d2 < 6 || d3 < 6;
      put(plot, x, y, inner ? puff : d1 < 11 ? shade : rim, inner ? 230 : 160);
    }
  }
}

export function paintHull(plot: Plot, n: number) {
  const seam = rgb("#3ab8a0");
  const brass = rgb("#f0d070");
  const gold = rgb("#fff4c4");
  const line = rgb("#5ee0c0");
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const panel = Math.floor(x / 8) + Math.floor(y / 8);
      band(plot, x, y, brass, gold, panel % 2 === 0 ? 0.72 : 0.5);
      if (x % 8 === 0 || y % 8 === 0) put(plot, x, y, seam);
      if (x % 8 === 4 && y % 8 === 4) put(plot, x, y, gold);
      if (y === 32) put(plot, x, y, line);
    }
  }
}

export function paintRock(plot: Plot, n: number) {
  const a = rgb("#8a7a68");
  const b = rgb("#c8b89a");
  const c = rgb("#e8dcc0");
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const nse = ((x * 17 + y * 11) % 19) / 19;
      band(plot, x, y, a, b, 0.4 + nse * 0.5);
      if (nse > 0.85) put(plot, x, y, c);
    }
  }
}

export const PAINTS: Record<string, (plot: Plot, n: number) => void> = {
  "water-ink": paintInkWater,
  "water-ice": paintIceWater,
  "water-slag": paintSlagWater,
  "ground-lead": paintLead,
  "ground-grass": paintGrass,
  "ground-ice": paintIce,
  "ground-ash": paintAsh,
  "metal-brass": paintBrass,
  "metal-rust": paintRust,
  "scale-olive": paintScale,
  "cloud-paper": paintCloud,
  "ship-hull": paintHull,
  "ground-rock": paintRock,
};
