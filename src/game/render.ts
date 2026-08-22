import {
  SURFACE_Y,
  T,
  TILE,
  WORLD_H,
  WORLD_W,
  artifactById,
  dirtForDepth,
  hellLevel,
  isArtifact,
  isOre,
  oreById,
} from "./data";
import { hash2 } from "./rng";
import type { Sim } from "./sim";

const DIRT: Record<number, [string, string]> = {
  [T.DIRT]: ["#6a4a32", "#5a3e2a"],
  [T.PACKED]: ["#5a3e2c", "#4a3224"],
  [T.HARD]: ["#4a382c", "#3a2c24"],
  [T.STONE]: ["#3a342e", "#2c2824"],
  [T.BASALT]: ["#2a2624", "#1c1a18"],
  [T.BEDROCK]: ["#1a1816", "#12100e"],
  [T.PAD]: ["#4a4640", "#3a3834"],
  [T.CORE]: ["#3a1810", "#1a0c08"],
  [T.CINDER]: ["#5a2418", "#3a1810"],
  [T.BRIMROCK]: ["#4a1c14", "#2a100c"],
  [T.HEARTFIRE]: ["#3a140e", "#1c0a08"],
  [T.HELLGATE]: ["#2a1210", "#140808"],
};

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `rgb(${r},${g},${b})`;
}

function hexRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  w = 0;
  h = 0;
  camX = 0;
  camY = 0;
  time = 0;
  reduced = false;
  zoom = 1.3;
  tex: Record<string, HTMLImageElement> = {};

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("canvas");
    this.ctx = ctx;
    this.loadTiles();
  }

  resize(): void {
    const dpr = this.bufferScale();
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width * dpr));
    const h = Math.max(1, Math.floor(rect.height * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.w = w;
    this.h = h;
  }

  get viewW(): number {
    const css = this.canvas.getBoundingClientRect().width;
    return Math.max(1, (css || this.w / Math.max(1, this.bufferScale())) / this.zoom);
  }

  get viewH(): number {
    const css = this.canvas.getBoundingClientRect().height;
    return Math.max(1, (css || this.h / Math.max(1, this.bufferScale())) / this.zoom);
  }

  bufferScale(): number {
    return Math.min(2, window.devicePixelRatio || 1);
  }

  follow(sim: Sim, dt: number): void {
    const p = sim.player;
    const cssH = this.canvas.getBoundingClientRect().height || this.h;
    const cssW = this.canvas.getBoundingClientRect().width || this.w;
    const phone = cssH < 920;
    const landscape = cssW > cssH && cssH < 520;
    const bias = landscape ? 0.46 : phone ? 0.3 : 0.42;
    const vw = this.viewW;
    const vh = this.viewH;
    const targetX = p.x - vw / 2;
    const targetY = p.y - vh * bias;
    const k = 1 - Math.exp(-6 * dt);
    this.camX += (targetX - this.camX) * k;
    this.camY += (targetY - this.camY) * k;
    this.clampCam(vw, vh);
  }

  snapFollow(sim: Sim): void {
    this.resize();
    const cssH = this.canvas.getBoundingClientRect().height || this.h;
    const cssW = this.canvas.getBoundingClientRect().width || this.w;
    const phone = cssH < 920;
    const landscape = cssW > cssH && cssH < 520;
    const bias = landscape ? 0.46 : phone ? 0.3 : 0.42;
    const vw = this.viewW;
    const vh = this.viewH;
    this.camX = sim.player.x - vw / 2;
    this.camY = sim.player.y - vh * bias;
    this.clampCam(vw, vh);
  }

  private clampCam(vw: number, vh: number): void {
    const maxX = WORLD_W * TILE - vw;
    const maxY = WORLD_H * TILE - vh;
    this.camX = Math.max(0, Math.min(Math.max(0, maxX), this.camX));
    this.camY = Math.max(-40, Math.min(Math.max(0, maxY), this.camY));
  }

  draw(sim: Sim, dt: number): void {
    this.time += dt;
    this.resize();
    const ctx = this.ctx;
    this.follow(sim, dt);

    let shakeX = 0;
    let shakeY = 0;
    if (!this.reduced && sim.trauma > 0.01 && sim.trauma) {
      const s = sim.trauma * sim.trauma;
      shakeX = (Math.random() * 2 - 1) * s * 14;
      shakeY = (Math.random() * 2 - 1) * s * 14;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#0c0a09";
    ctx.fillRect(0, 0, this.w, this.h);

    const z = this.bufferScale() * this.zoom;
    ctx.save();
    ctx.setTransform(z, 0, 0, z, -this.camX * z + shakeX * z, -this.camY * z + shakeY * z);

    this.drawSky(sim);
    this.drawBuildings(sim);
    this.drawTiles(sim);
    this.drawParticles(sim);
    if (!sim.dead || sim.explodeT < 0.35) this.drawRig(sim);
    this.drawFloaters(sim);

    ctx.restore();

    if (sim.player.flash > 0) {
      ctx.fillStyle = `rgba(196, 69, 54, ${sim.player.flash * 0.45})`;
      ctx.fillRect(0, 0, this.w, this.h);
    }
    if (sim.dead) {
      ctx.fillStyle = `rgba(12, 10, 8, ${Math.min(0.55, sim.explodeT * 0.7)})`;
      ctx.fillRect(0, 0, this.w, this.h);
    } else if (hellLevel(sim.depth()) > 0) {
      const h = hellLevel(sim.depth());
      ctx.fillStyle = `rgba(90, 20, 10, ${0.07 + h * 0.045})`;
      ctx.fillRect(0, 0, this.w, this.h);
    }
  }

  private drawSky(sim: Sim): void {
    const ctx = this.ctx;
    const surfacePy = SURFACE_Y * TILE;
    const vw = this.viewW;
    const vh = this.viewH;
    const top = Math.min(surfacePy, this.camY + vh);
    if (this.camY < surfacePy) {
      const g = ctx.createLinearGradient(0, 0, 0, surfacePy);
      g.addColorStop(0, "#1c1410");
      g.addColorStop(0.45, "#3a2418");
      g.addColorStop(0.78, "#6a3a22");
      g.addColorStop(1, "#8a5a38");
      ctx.fillStyle = g;
      ctx.fillRect(this.camX - 20, Math.min(0, this.camY) - 40, vw + 40, surfacePy + 60);

      // dust sun
      ctx.fillStyle = "rgba(232, 140, 80, 0.22)";
      ctx.beginPath();
      ctx.arc(WORLD_W * TILE * 0.72, surfacePy * 0.35, 90, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(240, 180, 110, 0.5)";
      ctx.beginPath();
      ctx.arc(WORLD_W * TILE * 0.72, surfacePy * 0.35, 28, 0, Math.PI * 2);
      ctx.fill();

      const seed = sim.world.seed;
      ctx.fillStyle = "rgba(239, 232, 220, 0.55)";
      for (let i = 0; i < 40; i++) {
        const sx = hash2(i, 2, seed) * WORLD_W * TILE;
        const sy = hash2(i, 9, seed) * surfacePy * 0.7;
        const r = 0.6 + hash2(i, 4, seed) * 1.4;
        ctx.fillRect(sx, sy, r, r);
      }
    }

    // horizon haze
    ctx.fillStyle = "rgba(140, 90, 50, 0.25)";
    ctx.fillRect(0, surfacePy - 18, WORLD_W * TILE, 18);
  }

  private drawBuildings(sim: Sim): void {
    const ctx = this.ctx;
    const ground = SURFACE_Y * TILE;

    const drawHut = (x0: number, x1: number, color: string, accent: string, label: string, sealed = false) => {
      const x = x0 * TILE;
      const w = (x1 - x0 + 1) * TILE;
      const h = 86;
      const y = ground - h;
      ctx.fillStyle = "#1a1612";
      ctx.fillRect(x + 6, y + 8, w - 12, h);
      ctx.fillStyle = sealed ? "#2a221c" : color;
      ctx.fillRect(x + 8, y + 10, w - 16, h - 10);
      ctx.fillStyle = "#2a221c";
      ctx.beginPath();
      ctx.moveTo(x + 2, y + 16);
      ctx.lineTo(x + w / 2, y - 10);
      ctx.lineTo(x + w - 2, y + 16);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = sealed ? "#3a3228" : accent;
      ctx.fillRect(x + 14, y + 28, 16, 22);
      ctx.fillRect(x + w - 30, y + 28, 16, 22);
      ctx.fillStyle = "#0e0c0a";
      ctx.fillRect(x + w / 2 - 10, y + 48, 20, 38);
      if (sealed) {
        ctx.strokeStyle = "#4a3a30";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + w / 2 - 8, y + 52);
        ctx.lineTo(x + w / 2 + 8, y + 82);
        ctx.moveTo(x + w / 2 + 8, y + 52);
        ctx.lineTo(x + w / 2 - 8, y + 82);
        ctx.stroke();
      }
      ctx.fillStyle = sealed ? "#6e655c" : "#efe8dc";
      ctx.font = "600 11px 'IBM Plex Sans', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(sealed ? "SEALED" : label, x + w / 2, y + 22);
    };

    drawHut(2, 9, "#4a2018", "#c45c3a", "KILN", !sim.hellUnlocked);
    drawHut(14, 22, "#4a3a30", "#c4a574", "EXCHANGE");
    drawHut(32, 41, "#3a3834", "#8a8580", "RIGWORKS");
    drawHut(50, 59, "#3a3228", "#4a9b82", "DEPOT");

    // fuel tanks at depot
    ctx.fillStyle = "#5a5048";
    ctx.fillRect(59 * TILE + 4, ground - 48, 18, 48);
    ctx.fillRect(60 * TILE + 8, ground - 62, 16, 62);
    ctx.fillStyle = "#4a9b82";
    ctx.fillRect(59 * TILE + 6, ground - 20, 14, 6);

    // kiln stack
    if (sim.hellUnlocked) {
      ctx.fillStyle = "#3a2018";
      ctx.fillRect(9 * TILE + 4, ground - 110, 14, 110);
      ctx.fillStyle = `rgba(224, 80, 30, ${0.35 + Math.sin(this.time * 3) * 0.15})`;
      ctx.fillRect(9 * TILE + 6, ground - 108, 10, 10);
    }

    // pad stripe
    ctx.fillStyle = "#5a5248";
    ctx.fillRect(2 * TILE, ground, 61 * TILE, 6);
    ctx.fillStyle = "#c45c3a";
    for (let i = 0; i < 14; i++) {
      ctx.fillRect((4 + i * 4) * TILE, ground + 1, TILE, 3);
    }
  }

  private loadTiles(): void {
    const names = ["dirt", "packed", "stone", "basalt", "cinder", "brimrock", "heartfire"];
    for (const n of names) {
      const img = new Image();
      img.onload = () => {
        this.tex[n] = img;
      };
      img.src = `/tiles/${n}.png`;
    }
  }

  private texName(t: number, y: number): string {
    if (isOre(t) || isArtifact(t)) {
      return this.texName(dirtForDepth(Math.max(0, y - SURFACE_Y)), y);
    }
    switch (t) {
      case T.DIRT:
        return "dirt";
      case T.PACKED:
      case T.PAD:
        return "packed";
      case T.HARD:
        return "stone";
      case T.STONE:
        return "stone";
      case T.BASALT:
      case T.BEDROCK:
      case T.HELLGATE:
        return "basalt";
      case T.CINDER:
        return "cinder";
      case T.BRIMROCK:
        return "brimrock";
      case T.HEARTFIRE:
      case T.CORE:
        return "heartfire";
      default:
        return "dirt";
    }
  }

  private caveHex(y: number): string {
    const hell = hellLevel(Math.max(0, y - SURFACE_Y));
    if (hell >= 3) return "#120706";
    if (hell >= 2) return "#110806";
    if (hell >= 1) return "#100806";
    return "#0d0a08";
  }

  private blitTile(img: HTMLImageElement, dx: number, dy: number, wx: number, wy: number): void {
    const ctx = this.ctx;
    const tw = img.width;
    const th = img.height;
    if (!tw || !th) return;
    const sx = ((wx % tw) + tw) % tw;
    const sy = ((wy % th) + th) % th;
    const w1 = Math.min(TILE, tw - sx);
    const h1 = Math.min(TILE, th - sy);
    ctx.drawImage(img, sx, sy, w1, h1, dx, dy, w1, h1);
    if (w1 < TILE) ctx.drawImage(img, 0, sy, TILE - w1, h1, dx + w1, dy, TILE - w1, h1);
    if (h1 < TILE) ctx.drawImage(img, sx, 0, w1, TILE - h1, dx, dy + h1, w1, TILE - h1);
    if (w1 < TILE && h1 < TILE) {
      ctx.drawImage(img, 0, 0, TILE - w1, TILE - h1, dx + w1, dy + h1, TILE - w1, TILE - h1);
    }
  }

  private fillEarth(t: number, x: number, y: number, light: number, seed: number): void {
    const rx = x * TILE;
    const ry = y * TILE;
    const ctx = this.ctx;
    const name = this.texName(t, y);
    const img = this.tex[name];
    const pair = DIRT[t] ?? DIRT[T.PACKED];
    if (img && img.width) {
      this.blitTile(img, rx, ry, x * TILE, y * TILE);
    } else {
      const n0 = hash2(x, y, seed);
      const base = n0 > 0.5 ? pair![0] : pair![1];
      ctx.fillStyle = this.lit(base, 1);
      ctx.fillRect(rx, ry, TILE, TILE);
    }
    if (t === T.HARD) {
      ctx.fillStyle = "rgba(62, 38, 24, 0.3)";
      ctx.fillRect(rx, ry, TILE, TILE);
    } else if (t === T.BEDROCK) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fillRect(rx, ry, TILE, TILE);
    } else if (t === T.PAD) {
      ctx.fillStyle = "rgba(70, 62, 52, 0.22)";
      ctx.fillRect(rx, ry, TILE, TILE);
    } else if (t === T.PACKED) {
      ctx.fillStyle = "rgba(40, 24, 16, 0.1)";
      ctx.fillRect(rx, ry, TILE, TILE);
    }
    const n = hash2(x, y, seed);
    if (n > 0.6) {
      ctx.fillStyle = `rgba(8, 6, 5, ${(n - 0.6) * 0.22})`;
      ctx.fillRect(rx, ry, TILE, TILE);
    } else if (n < 0.22) {
      ctx.fillStyle = `rgba(220, 180, 120, ${(0.22 - n) * 0.12})`;
      ctx.fillRect(rx, ry, TILE, TILE);
    }
    const band = hash2(1, y, seed);
    if (band > 0.74 && t !== T.PAD) {
      const yy = ry + Math.floor(hash2(2, y, seed) * (TILE - 2));
      ctx.fillStyle = `rgba(12, 8, 6, ${0.1 + (band - 0.74) * 0.35})`;
      ctx.fillRect(rx, yy, TILE, band > 0.9 ? 2 : 1);
    }
    const dark = Math.max(0, Math.min(0.84, 1.02 - light));
    if (dark > 0.02) {
      ctx.fillStyle = `rgba(6, 4, 3, ${dark})`;
      ctx.fillRect(rx, ry, TILE, TILE);
    }
    if (light > 0.9) {
      ctx.fillStyle = `rgba(255, 200, 140, ${(light - 0.9) * 0.14})`;
      ctx.fillRect(rx, ry, TILE, TILE);
    }
  }

  private carveExposed(x: number, y: number, seed: number, cave: string, sim: Sim): void {
    const ctx = this.ctx;
    const rx = x * TILE;
    const ry = y * TILE;
    const segs = 6;
    const step = TILE / segs;
    const world = sim.world;
    const faces = [
      world.get(x, y - 1) === T.EMPTY && y - 1 > SURFACE_Y ? 0 : -1,
      world.get(x + 1, y) === T.EMPTY && y > SURFACE_Y ? 1 : -1,
      world.get(x, y + 1) === T.EMPTY && y + 1 > SURFACE_Y ? 2 : -1,
      world.get(x - 1, y) === T.EMPTY && y > SURFACE_Y ? 3 : -1,
    ];
    for (const side of faces) {
      if (side < 0) continue;
      for (let i = 0; i < segs; i++) {
        const n = hash2(x * 19 + i, y * 23 + side, seed);
        const depth = 1.2 + n * 4.8;
        const o = i * step;
        ctx.fillStyle = cave;
        if (side === 0) ctx.fillRect(rx + o - 0.2, ry, step + 0.5, depth);
        else if (side === 1) ctx.fillRect(rx + TILE - depth, ry + o - 0.2, depth, step + 0.5);
        else if (side === 2) ctx.fillRect(rx + o - 0.2, ry + TILE - depth, step + 0.5, depth);
        else ctx.fillRect(rx, ry + o - 0.2, depth, step + 0.5);
      }
      ctx.fillStyle = "rgba(16, 10, 8, 0.42)";
      const lip = 2.2;
      if (side === 0) ctx.fillRect(rx, ry + 2, TILE, lip);
      else if (side === 1) ctx.fillRect(rx + TILE - 4.5, ry, lip, TILE);
      else if (side === 2) ctx.fillRect(rx, ry + TILE - 4.5, TILE, lip);
      else ctx.fillRect(rx + 2, ry, lip, TILE);
    }
  }

  private drawGrit(x: number, y: number, t: number, light: number, seed: number): void {
    const n = hash2(x * 3, y * 5, seed);
    if (n < 0.52) return;
    const ctx = this.ctx;
    const rx = x * TILE;
    const ry = y * TILE;
    const pair = DIRT[t] ?? DIRT[T.DIRT]!;
    const px = rx + 4 + (n * 17) % 20;
    const py = ry + 5 + (hash2(x, y + 9, seed) * 15) % 18;
    const s = 2 + n * 3;
    ctx.fillStyle = this.lit(shade(pair[1], -20), light);
    ctx.globalAlpha = 0.5;
    ctx.fillRect(px, py, s, s * 0.7);
    ctx.fillStyle = this.lit(shade(pair[0], 30), light);
    ctx.fillRect(px, py, s * 0.4, 1);
    ctx.globalAlpha = 1;
  }

  private drawCave(x: number, y: number, sim: Sim, light: number, cave: string): void {
    const ctx = this.ctx;
    const rx = x * TILE;
    const ry = y * TILE;
    const seed = sim.world.seed;
    ctx.fillStyle = cave;
    ctx.fillRect(rx, ry, TILE, TILE);

    const host = dirtForDepth(Math.max(0, y - SURFACE_Y));
    const img = this.tex[this.texName(host, y)];
    if (img && img.width) {
      ctx.globalAlpha = 0.28 + light * 0.22;
      this.blitTile(img, rx, ry, x * TILE, y * TILE);
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = `rgba(8, 5, 4, ${0.48 + (1 - Math.min(1, light)) * 0.28})`;
    ctx.fillRect(rx, ry, TILE, TILE);

    const nubs: Array<[number, number, number]> = [
      [x - 1, y, 3],
      [x + 1, y, 1],
      [x, y - 1, 0],
      [x, y + 1, 2],
    ];
    for (const [nx, ny, side] of nubs) {
      const nt = sim.world.get(nx, ny);
      if (!nt || nt === T.EMPTY) continue;
      const pair = DIRT[nt] ?? DIRT[dirtForDepth(Math.max(0, ny - SURFACE_Y))] ?? DIRT[T.PACKED]!;
      const segs = 5;
      const step = TILE / segs;
      for (let i = 0; i < segs; i++) {
        const n = hash2(x * 11 + i, y * 7 + side, seed);
        const depth = 2.2 + n * 6.5;
        const o = i * step;
        ctx.fillStyle = this.lit(shade(pair[1], -10), light * 0.75);
        if (side === 3) ctx.fillRect(rx, ry + o, depth, step + 0.4);
        else if (side === 1) ctx.fillRect(rx + TILE - depth, ry + o, depth, step + 0.4);
        else if (side === 0) ctx.fillRect(rx + o, ry, step + 0.4, depth);
        else ctx.fillRect(rx + o, ry + TILE - depth, step + 0.4, depth);
      }
    }

    const up = sim.world.get(x, y - 1);
    if (up && up !== T.EMPTY) {
      const n = hash2(x, y * 3, seed);
      const pair = DIRT[up] ?? DIRT[T.DIRT]!;
      ctx.fillStyle = this.lit(shade(pair[1], -8), light * 0.7);
      ctx.fillRect(rx + 3 + (n * 8) % 10, ry, 4 + n * 5, 2 + n * 8);
      if (n > 0.4) ctx.fillRect(rx + 18, ry, 3.5, 2 + (1 - n) * 6);
      if (n > 0.72 && y - SURFACE_Y < 80) {
        ctx.fillStyle = this.lit("#3a2a18", light * 0.5);
        ctx.fillRect(rx + 10 + (n * 9) % 8, ry, 1.2, 6 + n * 10);
      }
    }
    const down = sim.world.get(x, y + 1);
    if (down && down !== T.EMPTY) {
      const n = hash2(x + 4, y, seed);
      ctx.fillStyle = "rgba(28, 18, 12, 0.55)";
      ctx.fillRect(rx + n * 6, ry + TILE - 3, 7 + n * 9, 3);
      ctx.fillRect(rx + 14, ry + TILE - 2, 9, 2);
    }

    ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
    const L = sim.world.get(x - 1, y) !== T.EMPTY;
    const R = sim.world.get(x + 1, y) !== T.EMPTY;
    const U = sim.world.get(x, y - 1) !== T.EMPTY;
    const Dwn = sim.world.get(x, y + 1) !== T.EMPTY;
    if (L && U) ctx.fillRect(rx, ry, 7, 7);
    if (R && U) ctx.fillRect(rx + TILE - 7, ry, 7, 7);
    if (L && Dwn) ctx.fillRect(rx, ry + TILE - 7, 7, 7);
    if (R && Dwn) ctx.fillRect(rx + TILE - 7, ry + TILE - 7, 7, 7);
  }

  private drawCracks(x: number, y: number, t: number, seed: number): void {
    const ctx = this.ctx;
    const rx = x * TILE;
    const ry = y * TILE;
    const cx = rx + TILE / 2;
    const cy = ry + TILE / 2;
    ctx.save();
    ctx.strokeStyle = `rgba(8, 6, 4, ${0.28 + t * 0.6})`;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const rays = 4 + Math.floor(t * 3);
    for (let i = 0; i < rays; i++) {
      const a = hash2(x + i, y, seed) * Math.PI * 2;
      const len = (7 + hash2(x, y + i, seed) * 11) * (0.4 + t * 0.75);
      ctx.lineWidth = 0.8 + t * 1.8;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * len * 0.55, cy + Math.sin(a) * len * 0.55);
      ctx.lineTo(cx + Math.cos(a + 0.35) * len, cy + Math.sin(a + 0.35) * len);
      ctx.stroke();
    }
    if (t > 0.4) {
      ctx.fillStyle = `rgba(6, 4, 3, ${(t - 0.4) * 1.1})`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 2.5 + t * 5, 2 + t * 4, hash2(x, y, seed), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawTiles(sim: Sim): void {
    const ctx = this.ctx;
    const x0 = Math.max(0, Math.floor(this.camX / TILE) - 1);
    const y0 = Math.max(0, Math.floor(this.camY / TILE) - 1);
    const x1 = Math.min(WORLD_W - 1, Math.ceil((this.camX + this.viewW) / TILE) + 1);
    const y1 = Math.min(WORLD_H - 1, Math.ceil((this.camY + this.viewH) / TILE) + 1);
    const px = sim.player.x;
    const py = sim.player.y;
    const dir = sim.player.drillDir;
    const lampDx = dir === 1 ? 1 : dir === 3 ? -1 : 0;
    const lampDy = dir === 2 ? 1 : dir === 0 ? -1 : 0;
    const seed = sim.world.seed;

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const t = sim.world.get(x, y);
        const rx = x * TILE;
        const ry = y * TILE;
        const cx = rx + TILE / 2;
        const cy = ry + TILE / 2;
        const dx = (cx - px) / TILE;
        const dy = (cy - py) / TILE;
        const dist = Math.hypot(dx, dy);
        const along = dx * lampDx + dy * lampDy;
        const lamp = Math.max(0, 1 - dist / 9.5) * (0.45 + Math.max(0, along) * 0.55);
        const depth = Math.max(0, y - SURFACE_Y);
        const ambient = Math.max(hellLevel(depth) > 0 ? 0.24 : 0.18, 0.95 - Math.max(0, depth - 6) * 0.002);
        const light = Math.min(1.2, ambient + lamp * 0.85);
        const cave = this.caveHex(y);

        if (t === T.EMPTY) {
          if (y > SURFACE_Y) this.drawCave(x, y, sim, light, cave);
          continue;
        }

        if (t === T.GAS) {
          const pulse = 0.55 + Math.sin(this.time * 4 + x) * 0.2;
          ctx.fillStyle = `rgba(140, 170, 50, ${0.35 * light * pulse})`;
          ctx.fillRect(rx, ry, TILE, TILE);
          ctx.fillStyle = `rgba(190, 220, 70, ${0.5 * light * pulse})`;
          ctx.beginPath();
          ctx.arc(cx, cy, 7, 0, Math.PI * 2);
          ctx.fill();
          this.carveExposed(x, y, seed, cave, sim);
          continue;
        }
        if (t === T.LAVA || t === T.HELL_LAVA) {
          const hot = t === T.HELL_LAVA;
          const pulse = 0.7 + Math.sin(this.time * 5 + y) * 0.3;
          ctx.fillStyle = shade(hot ? "#6a1008" : "#8a2010", -20);
          ctx.fillRect(rx, ry, TILE, TILE);
          ctx.fillStyle = `rgba(${hot ? "255, 90, 30" : "224, 80, 30"}, ${0.7 * pulse})`;
          ctx.beginPath();
          ctx.ellipse(cx, cy, 11, 10, hash2(x, y, seed), 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(255, ${hot ? "210" : "180"}, 60, ${0.5 * pulse})`;
          ctx.beginPath();
          ctx.ellipse(cx + 2, cy - 1, 5, 4.5, 0.4, 0, Math.PI * 2);
          ctx.fill();
          this.carveExposed(x, y, seed, cave, sim);
          continue;
        }

        this.fillEarth(t, x, y, light, seed);

        if (t === T.HELLGATE) {
          const pulse = 0.35 + Math.sin(this.time * 2.4 + x * 0.4) * 0.2;
          ctx.fillStyle = `rgba(196, 70, 40, ${pulse})`;
          ctx.fillRect(rx + 4, ry + 2, 3, TILE - 4);
          ctx.fillRect(rx + TILE - 8, ry + 6, 3, TILE - 10);
          ctx.fillStyle = `rgba(255, 140, 60, ${pulse * 0.6})`;
          ctx.fillRect(rx + 5, ry + TILE / 2 - 2, TILE - 10, 3);
        } else if (t === T.CORE) {
          ctx.fillStyle = `rgba(196, 92, 58, ${0.25 + Math.sin(this.time * 2 + x * 0.3) * 0.1})`;
          ctx.fillRect(rx + 4, ry + 4, TILE - 8, TILE - 8);
        } else if (t === T.HEARTFIRE) {
          const pulse = 0.12 + Math.sin(this.time * 2.1 + x * 0.5 + y * 0.2) * 0.08;
          ctx.fillStyle = `rgba(255, 80, 30, ${pulse})`;
          ctx.fillRect(rx + 8, ry + 4, 2, TILE - 10);
          ctx.fillRect(rx + 18, ry + 10, 2, TILE - 16);
        }

        if (!isOre(t) && !isArtifact(t)) this.drawGrit(x, y, t, light, seed);
        this.carveExposed(x, y, seed, cave, sim);

        if (t === T.PAD) {
          ctx.fillStyle = this.lit("#6a6258", light);
          ctx.fillRect(rx, ry, TILE, 3);
          const g = hash2(x, 99, seed);
          ctx.strokeStyle = this.lit("#6e5a32", Math.min(1.1, light + 0.2));
          ctx.lineWidth = 1;
          for (let i = 0; i < 3; i++) {
            const gx = rx + 3 + ((g * 13 + i * 9) % 24);
            const gh = 3 + ((g * 7 + i) % 4);
            ctx.beginPath();
            ctx.moveTo(gx, ry + 1);
            ctx.lineTo(gx + (i % 2 === 0 ? 1.2 : -1), ry - gh);
            ctx.stroke();
          }
        }

        const dig = sim.player.digging;
        if (dig && dig.x === x && dig.y === y) {
          this.drawCracks(x, y, dig.t, seed);
        }

        if (isOre(t)) {
          const o = oreById(t);
          if (!o) continue;
          this.drawOre(x, y, o.color, o.glow, light, seed);
        } else if (isArtifact(t)) {
          const a = artifactById(t);
          this.drawArtifact(x, y, a?.color ?? "#f0d080", light, seed);
        }
      }
    }
  }

  private drawOre(x: number, y: number, color: string, glow: string, light: number, seed: number): void {
    const ctx = this.ctx;
    const rx = x * TILE;
    const ry = y * TILE;
    const cx = rx + TILE / 2;
    const cy = ry + TILE / 2;
    const [r, g, b] = hexRgb(color);
    const [gr, gg, gb] = hexRgb(glow);
    const pulse = this.reduced ? 1 : 0.88 + Math.sin(this.time * 2.4 + x * 1.4 + y * 0.8) * 0.12;
    const vis = 0.82 + light * 0.18;
    const ang = hash2(x, y, seed) * Math.PI;

    ctx.save();
    ctx.fillStyle = `rgba(${r},${g},${b},${0.5 * vis})`;
    ctx.fillRect(rx + 3, ry + 3, TILE - 6, TILE - 6);

    ctx.strokeStyle = `rgba(${r},${g},${b},${0.75 * vis})`;
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(ang) * 11, cy - Math.sin(ang) * 9);
    ctx.lineTo(cx + Math.cos(ang) * 11, cy + Math.sin(ang) * 9);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(ang + 0.7) * 8, cy - Math.sin(ang + 0.7) * 7);
    ctx.lineTo(cx + Math.cos(ang + 0.7) * 7, cy + Math.sin(ang + 0.7) * 6);
    ctx.stroke();

    const halo = ctx.createRadialGradient(cx, cy, 1.5, cx, cy, 14);
    halo.addColorStop(0, `rgba(${gr},${gg},${gb},${0.8 * pulse})`);
    halo.addColorStop(0.42, `rgba(${r},${g},${b},${0.38 * pulse})`);
    halo.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();

    const extra = hash2(x + 3, y, seed) > 0.5 ? 1 : 0;
    for (let i = 0; i < 2 + extra; i++) {
      const ox = i === 0 ? 0 : (hash2(x, y + i, seed) - 0.5) * 6;
      const oy = i === 0 ? 0 : (hash2(x + i, y, seed) - 0.5) * 6;
      const scale = i === 0 ? 1 : 0.4 + hash2(x + i, y + 2, seed) * 0.16;
      ctx.save();
      ctx.translate(cx + ox, cy + oy);
      ctx.rotate(hash2(x + i * 7, y, seed) * Math.PI);
      this.crystalPath(scale);
      ctx.fillStyle = `rgba(10, 8, 6, ${0.55 * vis})`;
      ctx.fill();
      ctx.translate(-0.6, -0.8);
      this.crystalPath(scale);
      ctx.fillStyle = color;
      ctx.globalAlpha = vis;
      ctx.fill();
      ctx.strokeStyle = "rgba(8, 6, 4, 0.75)";
      ctx.lineWidth = 1.15;
      ctx.stroke();
      ctx.fillStyle = glow;
      ctx.globalAlpha = vis * 0.92;
      ctx.beginPath();
      ctx.moveTo(-1.2 * scale, -8.5 * scale);
      ctx.lineTo(3.2 * scale, -1.5 * scale);
      ctx.lineTo(-0.4 * scale, 3.5 * scale);
      ctx.lineTo(-4.2 * scale, -0.8 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.globalAlpha = 0.7 + 0.3 * pulse;
    ctx.fillStyle = "#ffffff";
    const sx = cx - 2 + hash2(x, y + 11, seed) * 4;
    const sy = cy - 7 + hash2(x + 5, y, seed) * 3;
    ctx.fillRect(sx, sy, 2.6, 2.6);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  private crystalPath(scale: number): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(0, -11.5 * scale);
    ctx.lineTo(6.6 * scale, -2.8 * scale);
    ctx.lineTo(4.8 * scale, 9.2 * scale);
    ctx.lineTo(0, 11.5 * scale);
    ctx.lineTo(-5.8 * scale, 8.5 * scale);
    ctx.lineTo(-7.4 * scale, -2.1 * scale);
    ctx.closePath();
  }

  private drawArtifact(x: number, y: number, color: string, light: number, seed: number): void {
    const ctx = this.ctx;
    const cx = x * TILE + TILE / 2;
    const cy = y * TILE + TILE / 2;
    const [r, g, b] = hexRgb(color);
    const pulse = this.reduced ? 1 : 0.88 + Math.sin(this.time * 2.1 + x) * 0.12;
    const vis = 0.85 + light * 0.15;
    const halo = ctx.createRadialGradient(cx, cy, 2, cx, cy, 16);
    halo.addColorStop(0, `rgba(${r},${g},${b},${0.7 * pulse})`);
    halo.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(hash2(x, y, seed) * 0.4);
    ctx.fillStyle = `rgba(12, 10, 8, 0.65)`;
    ctx.fillRect(-8, -8, 16, 16);
    ctx.fillStyle = color;
    ctx.globalAlpha = vis;
    ctx.fillRect(-7, -7, 14, 14);
    ctx.strokeStyle = "#fff8e8";
    ctx.lineWidth = 1.6;
    ctx.strokeRect(-7, -7, 14, 14);
    ctx.fillStyle = "#fff8e8";
    ctx.globalAlpha = 0.85 * pulse;
    ctx.beginPath();
    ctx.moveTo(0, -4.5);
    ctx.lineTo(4.5, 0);
    ctx.lineTo(0, 4.5);
    ctx.lineTo(-4.5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  private lit(hex: string, light: number): string {
    const n = parseInt(hex.slice(1), 16);
    const k = Math.max(0.2, Math.min(1.25, light));
    const r = Math.round(Math.min(255, ((n >> 16) & 255) * k));
    const g = Math.round(Math.min(255, ((n >> 8) & 255) * k));
    const b = Math.round(Math.min(255, (n & 255) * k));
    return `rgb(${r},${g},${b})`;
  }

  private drawRig(sim: Sim): void {
    const ctx = this.ctx;
    const p = sim.player;
    const x = p.x;
    const y = p.y;
    ctx.save();
    ctx.translate(x, y);
    if (p.facing < 0) ctx.scale(-1, 1);

    // skids
    ctx.fillStyle = "#2a2622";
    ctx.fillRect(-13, 10, 26, 4);
    ctx.fillRect(-11, 8, 4, 4);
    ctx.fillRect(7, 8, 4, 4);

    // body
    ctx.fillStyle = p.flash > 0 ? "#efe8dc" : "#8a5a3a";
    ctx.fillRect(-12, -8, 24, 18);
    ctx.fillStyle = "#6a4030";
    ctx.fillRect(-12, -8, 24, 4);
    ctx.fillStyle = "#c45c3a";
    ctx.fillRect(-12, 6, 24, 3);

    // cabin
    ctx.fillStyle = "#1a1612";
    ctx.fillRect(-2, -6, 12, 10);
    ctx.fillStyle = "#7ec4c0";
    ctx.globalAlpha = 0.7;
    ctx.fillRect(0, -4, 8, 6);
    ctx.globalAlpha = 1;

    // drill
    const spin = this.time * (p.digging ? 28 : 6);
    ctx.save();
    const dirs = p.drillDir;
    if (dirs === 2) {
      ctx.translate(0, 12);
      ctx.rotate(Math.PI / 2);
    } else if (dirs === 0) {
      ctx.translate(0, -12);
      ctx.rotate(-Math.PI / 2);
    } else {
      ctx.translate(14, 2);
    }
    ctx.rotate(spin);
    ctx.fillStyle = "#c8c4bc";
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-4, 5);
    ctx.lineTo(-4, -5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#6a6660";
    ctx.fillRect(-6, -3, 8, 6);
    ctx.restore();

    // headlamp
    ctx.fillStyle = "#efe8dc";
    ctx.fillRect(10, -2, 3, 3);

    ctx.restore();

    // light cone (screen space-ish, drawn in world)
    if (sim.depth() > 8) {
      ctx.save();
      ctx.translate(x, y);
      const ang = p.drillDir === 1 ? 0 : p.drillDir === 3 ? Math.PI : p.drillDir === 0 ? -Math.PI / 2 : Math.PI / 2;
      ctx.rotate(ang);
      const g = ctx.createRadialGradient(20, 0, 4, 90, 0, 140);
      g.addColorStop(0, "rgba(239,232,220,0.16)");
      g.addColorStop(1, "rgba(239,232,220,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(160, -70);
      ctx.lineTo(160, 70);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // radar blips
    this.drawRadar(sim);
  }

  private drawRadar(sim: Sim): void {
    const ctx = this.ctx;
    const p = sim.player;
    const r = Math.round(sim.scannerRange());
    const tx = Math.floor(p.x / TILE);
    const ty = Math.floor(p.y / TILE);
    for (let y = ty - r; y <= ty + r; y++) {
      for (let x = tx - r; x <= tx + r; x++) {
        const t = sim.world.get(x, y);
        if (!isOre(t) && !isArtifact(t)) continue;
        const o = isOre(t) ? oreById(t) : artifactById(t);
        if (!o) continue;
        const color = "glow" in o ? o.glow : o.color;
        const [r, g, b] = hexRgb(color);
        const bx = (x + 0.5) * TILE;
        const by = (y + 0.5) * TILE;
        ctx.fillStyle = `rgba(${r},${g},${b},0.35)`;
        ctx.beginPath();
        ctx.arc(bx, by, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.95;
        ctx.beginPath();
        ctx.arc(bx, by, 3.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawParticles(sim: Sim): void {
    const ctx = this.ctx;
    for (const q of sim.particles) {
      ctx.globalAlpha = Math.max(0, q.life / q.max);
      ctx.fillStyle = q.color;
      if (q.size > 3.2) {
        ctx.fillRect(q.x, q.y, q.size, q.size * 0.72);
        ctx.fillRect(q.x + 1, q.y - 1, q.size * 0.55, q.size * 0.5);
      } else {
        ctx.fillRect(q.x, q.y, q.size, q.size);
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawFloaters(sim: Sim): void {
    const ctx = this.ctx;
    ctx.font = "600 12px 'IBM Plex Sans', sans-serif";
    ctx.textAlign = "center";
    for (const f of sim.floaters) {
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }
}
