import {
  ARTIFACTS,
  GATE_THICK,
  HELL_1,
  HELL_2,
  HELL_3,
  dirtForDepth,
  hellLevel,
  ORES,
  SURFACE_Y,
  T,
  WORLD_H,
  WORLD_W,
  type TileId,
} from "./data";
import { hash2, mulberry32 } from "./rng";

export class World {
  grid: Uint8Array;
  seed: number;
  w = WORLD_W;
  h = WORLD_H;

  constructor(seed: number, grid?: Uint8Array) {
    this.seed = seed;
    if (grid && grid.length === WORLD_W * WORLD_H) {
      this.grid = grid;
    } else {
      this.grid = new Uint8Array(WORLD_W * WORLD_H);
      this.generate();
    }
  }

  idx(x: number, y: number): number {
    return y * WORLD_W + x;
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < WORLD_W && y < WORLD_H;
  }

  get(x: number, y: number): number {
    if (!this.inBounds(x, y)) return T.CORE;
    return this.grid[this.idx(x, y)]!;
  }

  set(x: number, y: number, t: TileId | number): void {
    if (!this.inBounds(x, y)) return;
    this.grid[this.idx(x, y)] = t;
  }

  generate(): void {
    const rand = mulberry32(this.seed);
    const g = this.grid;
    g.fill(T.EMPTY);

    for (let y = 0; y < WORLD_H; y++) {
      for (let x = 0; x < WORLD_W; x++) {
        const i = y * WORLD_W + x;
        if (y >= WORLD_H - 3) {
          g[i] = T.CORE;
          continue;
        }
        if (x === 0 || x === WORLD_W - 1) {
          g[i] = y < SURFACE_Y ? T.EMPTY : T.BEDROCK;
          continue;
        }
        if (y < SURFACE_Y) {
          g[i] = T.EMPTY;
          continue;
        }
        if (y === SURFACE_Y && x >= 2 && x <= 62) {
          g[i] = T.PAD;
          continue;
        }

        const d = y - SURFACE_Y;
        let t: number = dirtForDepth(d);

        const n = hash2(x, y, this.seed);
        const hell = hellLevel(d);
        if (hell === 0) {
          if (d > 70 && n < 0.045 + d * 0.00012) t = T.BEDROCK;
          else if (d > 40 && n < 0.08) t = T.STONE;
        } else if (t !== T.HELLGATE && n < 0.04 + hell * 0.012) {
          t = T.BEDROCK;
        }

        // cracks in hellgates so a maxed rig can thread through
        if (t === T.HELLGATE && x % 11 === 4) {
          t = hell === 0 || d < HELL_1 ? T.CINDER : dirtForDepth(d + GATE_THICK);
        }

        g[i] = t;
      }
    }

    // Bedrock blobs in the crust
    const blobs = 40 + Math.floor(rand() * 30);
    for (let b = 0; b < blobs; b++) {
      const cx = 2 + Math.floor(rand() * (WORLD_W - 4));
      const cy = SURFACE_Y + 80 + Math.floor(rand() * (HELL_1 - 90));
      const r = 1 + Math.floor(rand() * 3);
      for (let y = cy - r; y <= cy + r; y++) {
        for (let x = cx - r; x <= cx + r; x++) {
          if (!this.inBounds(x, y)) continue;
          const cur = this.get(x, y);
          if (cur === T.PAD || cur === T.CORE || cur === T.HELLGATE) continue;
          if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r + (rand() > 0.5 ? 1 : 0)) {
            if (y > SURFACE_Y) this.set(x, y, T.BEDROCK);
          }
        }
      }
    }

    // Ores
    for (let y = SURFACE_Y + 1; y < WORLD_H - 4; y++) {
      const d = y - SURFACE_Y;
      for (let x = 1; x < WORLD_W - 1; x++) {
        const cur = this.get(x, y);
        if (cur === T.BEDROCK || cur === T.PAD || cur === T.CORE || cur === T.EMPTY || cur === T.HELLGATE) continue;
        const r = hash2(x * 13, y * 7, this.seed + 99);
        let placed = false;
        for (let k = ORES.length - 1; k >= 0; k--) {
          const ore = ORES[k]!;
          if (d < ore.minDepth) continue;
          const boost = Math.min(0.018, (d - ore.minDepth) * 0.00005);
          if (r < ore.rarity + boost) {
            this.set(x, y, ore.id);
            placed = true;
            break;
          }
        }
        if (placed) continue;
        const ar = hash2(x * 3, y * 11, this.seed + 42);
        for (let k = ARTIFACTS.length - 1; k >= 0; k--) {
          const art = ARTIFACTS[k]!;
          if (d < art.minDepth) continue;
          if (ar < art.rarity) {
            this.set(x, y, art.id);
            break;
          }
        }
      }
    }

    this.placeWellSeal(rand);

    // Gas pockets (crust)
    const gasN = 55;
    for (let i = 0; i < gasN; i++) {
      const cx = 2 + Math.floor(rand() * (WORLD_W - 4));
      const cy = SURFACE_Y + 170 + Math.floor(rand() * Math.max(20, HELL_1 - 190));
      this.blob(cx, cy, 1 + Math.floor(rand() * 2), T.GAS);
    }

    // Crust lava
    const lavaN = 28;
    for (let i = 0; i < lavaN; i++) {
      const cx = 2 + Math.floor(rand() * (WORLD_W - 4));
      const cy = SURFACE_Y + 250 + Math.floor(rand() * Math.max(20, HELL_1 - 260));
      this.blob(cx, cy, 1 + Math.floor(rand() * 2), T.LAVA);
    }

    // Hell lava — denser each layer, still leaves corridors
    for (let layer = 1; layer <= 3; layer++) {
      const y0 = SURFACE_Y + (layer === 1 ? HELL_1 : layer === 2 ? HELL_2 : HELL_3);
      const y1 = SURFACE_Y + (layer === 1 ? HELL_2 : layer === 2 ? HELL_3 : WORLD_H - 8);
      const n = 18 + layer * 10;
      for (let i = 0; i < n; i++) {
        const cx = 2 + Math.floor(rand() * (WORLD_W - 4));
        const cy = y0 + 6 + Math.floor(rand() * Math.max(8, y1 - y0 - 12));
        this.blob(cx, cy, 1 + Math.floor(rand() * (1 + layer * 0.5)), T.HELL_LAVA);
      }
      if (layer >= 2) {
        const rivers = 3 + layer;
        for (let r = 0; r < rivers; r++) {
          const yy = y0 + 10 + Math.floor(rand() * Math.max(8, y1 - y0 - 20));
          const x0 = 4 + Math.floor(rand() * 20);
          const x1 = x0 + 8 + Math.floor(rand() * 18);
          for (let x = x0; x <= x1 && x < WORLD_W - 2; x++) {
            const cur = this.get(x, yy);
            if (cur === T.CORE || cur === T.PAD || cur === T.HELLGATE) continue;
            this.set(x, yy, T.HELL_LAVA);
          }
        }
      }
    }
  }

  private blob(cx: number, cy: number, r: number, tile: number): void {
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        if (!this.inBounds(x, y)) continue;
        const t = this.get(x, y);
        if (t === T.BEDROCK || t === T.CORE || t === T.PAD || t === T.HELLGATE) continue;
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) this.set(x, y, tile);
      }
    }
  }

  private placeWellSeal(rand: () => number): void {
    for (let i = 0; i < this.grid.length; i++) {
      if (this.grid[i] === T.ART_WELL) return;
    }
    const y0 = SURFACE_Y + HELL_3 + 24;
    const y1 = WORLD_H - 6;
    for (let n = 0; n < 80; n++) {
      const x = 2 + Math.floor(rand() * (WORLD_W - 4));
      const y = y0 + Math.floor(rand() * Math.max(1, y1 - y0));
      const cur = this.get(x, y);
      if (cur === T.PAD || cur === T.CORE || cur === T.EMPTY || cur === T.HELLGATE) continue;
      this.set(x, y, T.ART_WELL);
      return;
    }
    this.set(Math.floor(WORLD_W / 2), Math.min(WORLD_H - 6, y0 + 8), T.ART_WELL);
  }

  encode(): string {
    const u8 = this.grid;
    let s = "";
    for (let i = 0; i < u8.length; i += 0x8000) {
      s += String.fromCharCode(...u8.subarray(i, i + 0x8000));
    }
    return btoa(s);
  }

  static decode(b64: string): Uint8Array {
    const bin = atob(b64);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return u8;
  }
}
