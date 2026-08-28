import { grid, type Grid } from "./levels-story";
import type { Beat } from "./chunks";
import type { Pocket, Verb } from "./recipe";

const H = 12;
export const FY = 8;

export interface PaintCtx {
  enemy: string;
  deco: string;
  pit: number;
  pocket: Pocket;
  secret: boolean;
  mix: Verb;
}

export interface Pattern {
  id: string;
  beats: Beat[];
  verbs: Verb[];
  minW?: number;
  paint: (g: Grid, ctx: PaintCtx) => void;
}

function pitW(ctx: PaintCtx, lo = 2, hi = 3) {
  return Math.max(lo, Math.min(hi, ctx.pit || 3));
}

function plantPocket(g: Grid, ctx: PaintCtx, x: number) {
  if (ctx.pocket === "none" && !ctx.secret) return;
  g.fill(x, FY - 3, 4, "=");
  const prize = ctx.secret ? "$" : "i";
  g.put(x + 1, FY - 4, prize);
  if (ctx.pocket === "vent") g.put(x + 3, FY - 2, "v");
}

function plantDeco(g: Grid, ctx: PaintCtx, x: number) {
  if (!ctx.deco || ctx.deco === "_") return;
  g.put(x, FY - 2, ctx.deco);
}

export const PATTERNS: Pattern[] = [
  {
    id: "land-porch",
    beats: ["land"],
    verbs: [],
    paint(g, ctx) {
      g.put(2, FY - 1, "@");
      g.put(4, FY - 1, "i");
      plantDeco(g, ctx, 7);
      if (ctx.deco === "_") g.fill(8, FY - 2, 5, "_");
      else g.fill(10, FY - 3, 4, "=");
    },
  },
  {
    id: "teach-bounce",
    beats: ["teach", "mix"],
    verbs: ["T"],
    paint(g, ctx) {
      const w = pitW(ctx);
      g.fill(6, FY, w, ".");
      g.put(6 + Math.floor(w / 2), FY - 1, "T");
      plantDeco(g, ctx, 5);
    },
  },
  {
    id: "teach-crumble",
    beats: ["teach", "mix"],
    verbs: ["-"],
    paint(g, ctx) {
      g.fill(5, FY - 1, 5, "-");
      g.fill(12, FY, 3, "#");
    },
  },
  {
    id: "teach-shelf",
    beats: ["teach", "mix"],
    verbs: ["="],
    paint(g, ctx) {
      g.fill(5, FY - 2, 4, "=");
      g.fill(11, FY - 4, 4, "=");
      g.fill(17, FY - 2, 3, "=");
    },
  },
  {
    id: "teach-laser",
    beats: ["teach", "mix"],
    verbs: ["|"],
    paint(g, ctx) {
      plantDeco(g, ctx, 6);
      g.put(8, FY - 2, "|");
      g.put(8, FY - 3, "|");
      g.fill(11, FY - 4, 4, "=");
    },
  },
  {
    id: "teach-belt",
    beats: ["teach", "mix"],
    verbs: ["/"],
    paint(g, ctx) {
      const w = pitW(ctx, 3, 4);
      g.fill(6, FY, w, ".");
      g.fill(6, FY - 1, w, "/");
    },
  },
  {
    id: "teach-lift",
    beats: ["teach", "mix"],
    verbs: ["`"],
    paint(g, ctx) {
      const w = pitW(ctx);
      g.fill(6, FY, w, ".");
      g.put(6, FY - 1, "`");
      if (w > 2) g.put(7, FY - 1, "`");
      g.fill(6 + w + 2, FY - 3, 4, "=");
    },
  },
  {
    id: "teach-blink",
    beats: ["teach", "mix"],
    verbs: [")"],
    paint(g, ctx) {
      const w = pitW(ctx, 3, 4);
      g.fill(6, FY, w, ".");
      g.put(7, FY - 1, ")");
      if (w > 3) g.put(8, FY - 1, ")");
      g.fill(6 + w + 1, FY, 3, "#");
    },
  },
  {
    id: "teach-geyser",
    beats: ["teach", "mix"],
    verbs: ["g"],
    paint(g, ctx) {
      g.fill(8, FY, 1, "g");
      g.fill(12, FY - 4, 4, "=");
      plantDeco(g, ctx, 6);
    },
  },
  {
    id: "teach-saw",
    beats: ["teach", "mix"],
    verbs: ["S"],
    paint(g, ctx) {
      g.put(8, FY - 2, "S");
      g.fill(12, FY - 3, 4, "=");
      plantDeco(g, ctx, 5);
    },
  },
  {
    id: "mix-bounce-laser",
    beats: ["mix"],
    verbs: ["T", "|"],
    paint(g, ctx) {
      g.fill(6, FY, 3, ".");
      g.put(7, FY - 1, "T");
      g.put(10, FY - 2, "|");
      g.put(10, FY - 3, "|");
      g.fill(13, FY - 3, 4, "=");
    },
  },
  {
    id: "mix-lift-saw",
    beats: ["mix"],
    verbs: ["`", "S"],
    paint(g, ctx) {
      g.fill(6, FY, 3, ".");
      g.put(6, FY - 1, "`");
      g.put(7, FY - 1, "`");
      g.put(11, FY - 2, "S");
      g.fill(14, FY - 3, 4, "=");
    },
  },
  {
    id: "mix-blink-laser",
    beats: ["mix"],
    verbs: [")", "|"],
    paint(g, ctx) {
      g.fill(6, FY, 4, ".");
      g.put(7, FY - 1, ")");
      g.put(8, FY - 1, ")");
      g.put(8, FY - 3, "|");
      g.put(8, FY - 4, "|");
      g.fill(12, FY, 4, "#");
    },
  },
  {
    id: "mix-geyser-loft",
    beats: ["mix"],
    verbs: ["g", "="],
    paint(g, ctx) {
      g.fill(8, FY, 1, "g");
      g.fill(12, FY - 3, 5, "=");
      plantDeco(g, ctx, 5);
    },
  },
  {
    id: "mix-belt-laser",
    beats: ["mix"],
    verbs: ["/", "|"],
    paint(g, ctx) {
      g.fill(6, FY, 4, ".");
      g.fill(6, FY - 1, 4, "/");
      g.put(8, FY - 3, "|");
      g.put(8, FY - 4, "|");
    },
  },
  {
    id: "combat-floor",
    beats: ["combat"],
    verbs: [],
    paint(g, ctx) {
      g.put(8, FY - 1, ctx.enemy || "1");
      g.fill(4, FY - 2, 3, "=");
      plantDeco(g, ctx, 12);
    },
  },
  {
    id: "combat-perch",
    beats: ["combat"],
    verbs: [],
    paint(g, ctx) {
      g.fill(5, FY - 3, 4, "=");
      g.put(6, FY - 4, ctx.enemy || "1");
      g.put(14, FY - 1, "0");
    },
  },
  {
    id: "combat-saw",
    beats: ["combat"],
    verbs: ["S"],
    paint(g, ctx) {
      g.put(6, FY - 1, ctx.enemy || "1");
      g.put(10, FY - 2, "S");
      g.fill(12, FY - 3, 4, "=");
    },
  },
  {
    id: "rest-check",
    beats: ["rest"],
    verbs: [],
    paint(g, ctx) {
      g.put(5, FY - 1, "%");
      g.put(8, FY - 1, "i");
      g.put(11, FY - 1, "h");
      plantDeco(g, ctx, 14);
      plantPocket(g, ctx, 12);
    },
  },
  {
    id: "arena-court",
    beats: ["arena"],
    verbs: [],
    minW: 28,
    paint(g, ctx) {
      g.put(2, FY - 1, "@");
      g.put(4, FY - 1, "%");
      g.put(Math.floor(g.W / 2), FY - 1, "!");
      g.fill(6, FY - 3, 4, "=");
      g.fill(g.W - 12, FY - 3, 4, "=");
      plantDeco(g, ctx, 8);
      g.put(g.W - 4, FY - 1, "P");
    },
  },
  {
    id: "gate-plain",
    beats: ["gate"],
    verbs: [],
    paint(g, ctx) {
      g.put(4, FY - 1, "i");
      plantDeco(g, ctx, 7);
      g.put(g.W - 4, FY - 1, "P");
    },
  },
];

export function pickPattern(
  beat: Beat,
  featured: Verb,
  mix: Verb,
  rand: () => number,
  used: Set<string>,
): Pattern | null {
  const pool = PATTERNS.filter((p) => p.beats.includes(beat));
  const matched = pool.filter((p) => {
    if (used.has(p.id)) return false;
    if (beat === "teach") return p.verbs.length === 1 && p.verbs[0] === featured;
    if (beat === "mix") {
      if (!p.verbs.length) return false;
      return p.verbs.includes(featured) || p.verbs.includes(mix);
    }
    if (beat === "combat" && (featured === "S" || mix === "S")) return p.id === "combat-saw" || p.verbs.length === 0;
    return p.verbs.length === 0;
  });
  const list = matched.length ? matched : pool.filter((p) => !used.has(p.id));
  const pick = list[Math.floor(rand() * list.length)] ?? pool[0];
  return pick ?? null;
}

export function paintPattern(p: Pattern, width: number, ctx: PaintCtx): string[] {
  const w = Math.max(p.minW ?? 18, Math.min(28, width));
  const g = grid(w, H, FY) as Grid;
  p.paint(g, ctx);
  if (ctx.pocket !== "none" && p.beats[0] !== "rest" && p.beats[0] !== "land") {
    plantPocket(g, ctx, Math.min(g.W - 8, 14));
  }
  return [...g];
}
