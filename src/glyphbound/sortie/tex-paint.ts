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

/** Seamless value in 0..1. Periods are integer cycles of the tile. */
function fbm(x: number, y: number, n: number) {
  const u = (x / n) * Math.PI * 2;
  const v = (y / n) * Math.PI * 2;
  const a = Math.sin(u * 3) * Math.cos(v * 2);
  const b = Math.sin(u * 7 + 1.1) * Math.cos(v * 5 + 0.4) * 0.45;
  const c = Math.sin(u * 4 + v * 3) * 0.22;
  const d = Math.sin(u * 11 - v * 8) * 0.12;
  return (a + b + c + d) * 0.5 + 0.5;
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
  const deep = rgb("#0e6e78");
  const mid = rgb("#2ec8c0");
  const crest = rgb("#9af8ee");
  const foam = rgb("#e8fff8");
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const u = (x / n) * Math.PI * 2;
      const v = (y / n) * Math.PI * 2;
      const wave = Math.sin(v * 6 + Math.sin(u * 3) * 0.8) * 0.5 + 0.5;
      const chop = fbm(x, y, n);
      const t = wave * 0.7 + chop * 0.3;
      const c = t > 0.72 ? mix(mid, crest, (t - 0.72) / 0.28) : mix(deep, mid, t / 0.72);
      put(plot, x, y, c);
      if (t > 0.86 && dither(x, y, 0.4)) put(plot, x, y, foam);
    }
  }
}

export function paintIceWater(plot: Plot, n: number) {
  const a = rgb("#5ab0c8");
  const b = rgb("#d4eef8");
  const c = rgb("#ffffff");
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const t = fbm(x + 4, y, n);
      put(plot, x, y, mix(a, b, t));
      if (t > 0.78 && dither(x, y, 0.35)) put(plot, x, y, c);
    }
  }
}

export function paintSlagWater(plot: Plot, n: number) {
  const a = rgb("#8a3818");
  const b = rgb("#d87840");
  const c = rgb("#ffc070");
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const t = fbm(x, y + 8, n);
      put(plot, x, y, mix(a, b, t));
      if (t > 0.8) put(plot, x, y, mix(b, c, (t - 0.8) / 0.2));
    }
  }
}

export function paintLead(plot: Plot, n: number) {
  const plate = rgb("#b8c4cc");
  const warm = rgb("#d8c8b0");
  const shade = rgb("#8a98a4");
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const t = fbm(x, y, n);
      put(plot, x, y, mix(shade, mix(plate, warm, t), 0.45 + t * 0.5));
    }
  }
}

export function paintBrass(plot: Plot, n: number) {
  const dark = rgb("#b87828");
  const gold = rgb("#e8c468");
  const shine = rgb("#fff0b8");
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const t = fbm(x + 9, y, n);
      put(plot, x, y, mix(dark, gold, t));
      if (t > 0.84) put(plot, x, y, shine);
    }
  }
}

export function paintRust(plot: Plot, n: number) {
  const a = rgb("#a04828");
  const b = rgb("#d87850");
  const c = rgb("#f0c090");
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const t = fbm(x, y + 3, n);
      put(plot, x, y, mix(a, b, t));
      if (t > 0.82) put(plot, x, y, c);
    }
  }
}

export function paintGrass(plot: Plot, n: number) {
  const dirt = rgb("#c4a050");
  const leaf = rgb("#3aaa38");
  const lush = rgb("#68c848");
  const blade = rgb("#b4e878");
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const t = fbm(x, y, n);
      put(plot, x, y, mix(leaf, lush, t));
      if (t < 0.28) put(plot, x, y, mix(dirt, leaf, t / 0.28));
      if (t > 0.78 && dither(x, y, 0.45)) put(plot, x, y, blade);
    }
  }
}

export function paintIce(plot: Plot, n: number) {
  const a = rgb("#b0d8e8");
  const b = rgb("#e8f8fc");
  const c = rgb("#ffffff");
  const crack = rgb("#7aa8bc");
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const t = fbm(x + 2, y + 6, n);
      put(plot, x, y, mix(a, b, t));
      const u = (x / n) * Math.PI * 2;
      const v = (y / n) * Math.PI * 2;
      if (Math.abs(Math.sin(u * 2 + v * 3)) < 0.04 && t < 0.55) put(plot, x, y, crack);
      if (t > 0.85) put(plot, x, y, c);
    }
  }
}

export function paintAsh(plot: Plot, n: number) {
  const a = rgb("#a06038");
  const b = rgb("#d8a070");
  const c = rgb("#f0d8a8");
  const ember = rgb("#e06840");
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const t = fbm(x + 5, y, n);
      put(plot, x, y, mix(a, b, t));
      if (t > 0.82) put(plot, x, y, c);
      if (t > 0.9 && dither(x, y, 0.5)) put(plot, x, y, ember);
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
  const a = rgb("#6a5a48");
  const b = rgb("#a89880");
  const c = rgb("#d4c8b0");
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const t = fbm(x + 7, y + 2, n);
      put(plot, x, y, mix(a, b, t));
      if (t > 0.8) put(plot, x, y, mix(b, c, (t - 0.8) / 0.2));
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
