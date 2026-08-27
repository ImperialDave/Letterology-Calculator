import type { Solid } from "./types";

const WALK_SKIP = new Set<Solid["type"]>(["sluice", "laser", "fan", "spike"]);
const HAZARD = new Set<Solid["type"]>(["sluice", "laser", "spike"]);

export type Body = { x: number; y: number; w: number; h: number };
export type QueryKind = "walk" | "hazard" | "all";

/** Uniform grid over static solids. Walls are queried separately (few, moving). */
export class SolidGrid {
  cell: number;
  private buckets = new Map<number, Solid[]>();
  count = 0;

  constructor(cell = 96) {
    this.cell = cell;
  }

  clear() {
    this.buckets.clear();
    this.count = 0;
  }

  rebuild(solids: Solid[]) {
    this.clear();
    for (const s of solids) this.insert(s);
  }

  insert(s: Solid) {
    if (s.broken) return;
    this.count += 1;
    const cell = this.cell;
    const x0 = Math.floor(s.x / cell);
    const y0 = Math.floor(s.y / cell);
    const x1 = Math.floor((s.x + s.w) / cell);
    const y1 = Math.floor((s.y + s.h) / cell);
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        const k = pack(cx, cy);
        let bin = this.buckets.get(k);
        if (!bin) {
          bin = [];
          this.buckets.set(k, bin);
        }
        bin.push(s);
      }
    }
  }

  query(box: Body, large: boolean, extra: Solid[] = [], kind: QueryKind = "walk"): Solid[] {
    const cell = this.cell;
    const x0 = Math.floor(box.x / cell) - 1;
    const y0 = Math.floor(box.y / cell) - 1;
    const x1 = Math.floor((box.x + box.w) / cell) + 1;
    const y1 = Math.floor((box.y + box.h) / cell) + 1;
    const out: Solid[] = [];
    const seen = new Set<Solid>();
    const take = (s: Solid) => {
      if (seen.has(s) || s.broken) return;
      if (kind === "walk") {
        if (WALK_SKIP.has(s.type)) return;
        if (s.type === "vent" && !large) return;
      } else if (kind === "hazard") {
        if (!HAZARD.has(s.type)) return;
      } else if (s.type === "vent" && !large) return;
      seen.add(s);
      out.push(s);
    };
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        const bin = this.buckets.get(pack(cx, cy));
        if (!bin) continue;
        for (const s of bin) take(s);
      }
    }
    for (const s of extra) take(s);
    return out;
  }
}

function pack(cx: number, cy: number) {
  return ((cy + 0x8000) << 16) | ((cx + 0x8000) & 0xffff);
}
