/** Beat painters. Glyphbound Doctrine: .grok/skills/glyphbound-ledgers/SKILL.md */
import { grid, type Grid } from "./levels-story";
import type { Beat } from "./chunks";
import type { Pocket, Verb } from "./recipe";
import type { ThemeId } from "./types";

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
  themes?: ThemeId[];
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
  if (ctx.pocket === "vent") {
    g.put(x + 3, FY - 1, "v");
    g.put(x + 3, FY - 2, "v");
    g.put(x + 3, FY - 3, "v");
  }
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
      g.put(6, FY - 1, "i");
      plantDeco(g, ctx, 8);
      if (ctx.deco === "_") g.fill(10, FY - 2, 6, "_");
      else g.fill(10, FY - 3, 5, "=");
      plantDeco(g, ctx, 14);
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
      g.put(6, FY - 1, ctx.enemy || "1");
      g.put(9, FY - 1, "0");
      g.put(12, FY - 1, ctx.enemy || "2");
      g.fill(4, FY - 3, 4, "=");
      g.put(5, FY - 4, "3");
      plantDeco(g, ctx, 15);
    },
  },
  {
    id: "combat-perch",
    beats: ["combat"],
    verbs: [],
    paint(g, ctx) {
      g.fill(5, FY - 3, 5, "=");
      g.put(6, FY - 4, ctx.enemy || "1");
      g.put(8, FY - 4, "0");
      g.put(14, FY - 1, "2");
      g.put(16, FY - 1, "5");
      plantDeco(g, ctx, 18);
    },
  },
  {
    id: "combat-saw",
    beats: ["combat"],
    verbs: ["S"],
    paint(g, ctx) {
      g.put(5, FY - 1, ctx.enemy || "1");
      g.put(8, FY - 1, "0");
      g.put(11, FY - 2, "S");
      g.fill(13, FY - 3, 4, "=");
      g.put(14, FY - 4, "7");
      plantDeco(g, ctx, 18);
    },
  },
  {
    id: "rest-check",
    beats: ["rest"],
    verbs: [],
    paint(g, ctx) {
      g.put(5, FY - 1, "%");
      g.put(7, FY - 1, "i");
      g.put(9, FY - 1, "i");
      g.put(11, FY - 1, "h");
      plantDeco(g, ctx, 13);
      plantDeco(g, ctx, 16);
      plantPocket(g, ctx, 12);
    },
  },
  {
    id: "street-bounce",
    beats: ["teach", "mix"],
    verbs: ["T"],
    themes: ["street"],
    paint(g, ctx) {
      const w = pitW(ctx);
      g.fill(6, FY, w, ".");
      g.put(6 + Math.floor(w / 2), FY - 1, "T");
      plantDeco(g, ctx, 5);
      g.fill(6 + w + 2, FY - 3, 4, "=");
      plantDeco(g, ctx, 8 + w);
    },
  },
  {
    id: "street-shelf",
    beats: ["land"],
    verbs: [],
    themes: ["street"],
    paint(g, ctx) {
      g.put(2, FY - 1, "@");
      g.put(4, FY - 1, "i");
      g.fill(6, FY - 3, 5, "=");
      plantDeco(g, ctx, 8);
      g.fill(13, FY - 2, 4, "=");
    },
  },
  {
    id: "fort-crumble",
    beats: ["teach", "mix"],
    verbs: ["-"],
    themes: ["fort"],
    paint(g, ctx) {
      g.fill(5, FY, 5, "-");
      g.fill(12, FY, 3, "#");
      plantDeco(g, ctx, 4);
      g.fill(16, FY - 3, 4, "=");
    },
  },
  {
    id: "fort-ember-loft",
    beats: ["mix"],
    verbs: ["=", "-"],
    themes: ["fort"],
    paint(g, ctx) {
      g.fill(5, FY, 4, "-");
      g.fill(11, FY - 3, 6, "=");
      plantDeco(g, ctx, 13);
      g.put(14, FY - 4, ctx.deco || "'");
    },
  },
  {
    id: "coil-crank",
    beats: ["teach", "mix"],
    verbs: ["T", "-"],
    themes: ["coil"],
    paint(g, ctx) {
      g.fill(5, FY, 3, ".");
      g.put(6, FY - 1, "T");
      g.fill(10, FY, 4, "-");
      plantDeco(g, ctx, 4);
    },
  },
  {
    id: "coil-belt",
    beats: ["teach", "mix"],
    verbs: ["/"],
    themes: ["coil"],
    paint(g, ctx) {
      const w = pitW(ctx, 3, 4);
      g.fill(6, FY, w, ".");
      g.fill(6, FY - 1, w, "/");
      plantDeco(g, ctx, 5);
      g.fill(6 + w + 2, FY - 3, 4, "=");
    },
  },
  {
    id: "vault-shelf",
    beats: ["land"],
    verbs: [],
    themes: ["vault"],
    paint(g, ctx) {
      g.put(2, FY - 1, "@");
      g.put(4, FY - 1, "i");
      g.fill(5, FY - 3, 6, "=");
      plantDeco(g, ctx, 7);
      g.fill(13, FY - 2, 4, "=");
    },
  },
  {
    id: "vault-laser",
    beats: ["teach", "mix"],
    verbs: ["|"],
    themes: ["vault"],
    paint(g, ctx) {
      plantDeco(g, ctx, 5);
      g.put(8, FY - 3, "|");
      g.put(8, FY - 4, "|");
      g.fill(11, FY - 3, 5, "=");
      plantDeco(g, ctx, 13);
    },
  },
  {
    id: "canal-dock",
    beats: ["teach", "mix"],
    verbs: ["T", "=", "~"],
    themes: ["canal"],
    paint(g, ctx) {
      const w = pitW(ctx);
      g.fill(6, FY, w, ".");
      g.put(6 + Math.floor(w / 2), FY - 1, "T");
      g.fill(6, FY + 1, w, "~");
      g.fill(6 + w + 2, FY - 3, 5, "=");
      plantDeco(g, ctx, 5);
    },
  },
  {
    id: "abyss-ash-stair",
    beats: ["teach", "mix"],
    verbs: ["T", "="],
    themes: ["abyss"],
    paint(g, ctx) {
      g.fill(5, FY - 2, 3, "=");
      g.fill(9, FY, 3, ".");
      g.put(10, FY - 1, "T");
      g.fill(13, FY - 4, 4, "=");
      plantDeco(g, ctx, 4);
    },
  },
  {
    id: "spire-step",
    beats: ["teach", "mix"],
    verbs: ["T", "="],
    themes: ["spire"],
    paint(g, ctx) {
      g.fill(5, FY - 2, 3, "=");
      g.fill(9, FY, 3, ".");
      g.put(10, FY - 1, "T");
      g.fill(13, FY - 4, 3, "=");
      g.fill(17, FY - 5, 3, "=");
      plantDeco(g, ctx, 4);
    },
  },
  {
    id: "combat-street-pack",
    beats: ["combat"],
    verbs: [],
    themes: ["street"],
    paint(g, ctx) {
      g.put(6, FY - 1, ctx.enemy || "1");
      g.put(9, FY - 1, "0");
      g.put(12, FY - 1, "2");
      g.fill(15, FY - 3, 5, "=");
      g.put(16, FY - 4, "3");
      plantDeco(g, ctx, 20);
    },
  },
  {
    id: "combat-fort-pack",
    beats: ["combat"],
    verbs: [],
    themes: ["fort"],
    paint(g, ctx) {
      g.put(5, FY - 1, ctx.enemy || "1");
      g.put(8, FY - 1, "0");
      g.fill(11, FY, 4, "-");
      g.fill(16, FY - 3, 4, "=");
      g.put(17, FY - 4, "2");
      plantDeco(g, ctx, 20);
    },
  },
  {
    id: "combat-canal-pack",
    beats: ["combat"],
    verbs: [],
    themes: ["canal"],
    paint(g, ctx) {
      g.put(6, FY - 1, ctx.enemy || "1");
      g.put(9, FY - 1, "0");
      g.put(12, FY - 1, "2");
      g.fill(15, FY - 3, 5, "=");
      plantDeco(g, ctx, 18);
    },
  },
  {
    id: "combat-coil-pack",
    beats: ["combat"],
    verbs: [],
    themes: ["coil"],
    paint(g, ctx) {
      g.put(6, FY - 1, ctx.enemy || "1");
      g.put(8, FY - 1, "0");
      g.put(11, FY - 1, "3");
      g.fill(14, FY - 3, 5, "=");
      g.put(15, FY - 4, "2");
      plantDeco(g, ctx, 20);
    },
  },
  {
    id: "combat-vault-pack",
    beats: ["combat"],
    verbs: [],
    themes: ["vault"],
    paint(g, ctx) {
      g.put(6, FY - 1, ctx.enemy || "1");
      g.put(9, FY - 1, "0");
      g.fill(12, FY - 3, 5, "=");
      g.put(13, FY - 4, "2");
      g.put(16, FY - 1, "3");
      plantDeco(g, ctx, 19);
    },
  },
  {
    id: "orbit-rings",
    beats: ["teach", "mix"],
    verbs: ["`"],
    themes: ["orbit"],
    paint(g, ctx) {
      const w = pitW(ctx);
      g.fill(5, FY, w, ".");
      g.put(5, FY - 1, "`");
      g.put(6, FY - 1, "`");
      g.fill(5 + w + 2, FY - 3, 5, "=");
      g.put(7 + w, FY - 4, ctx.deco || ";");
      g.fill(8, FY - 5, 3, "=");
      plantDeco(g, ctx, 4);
    },
  },
  {
    id: "ice-rail-run",
    beats: ["teach", "mix"],
    verbs: ["`", ")", "T"],
    themes: ["glacier"],
    paint(g, ctx) {
      g.fill(4, FY, 6, "_");
      g.fill(4, FY - 2, 5, "_");
      const w = pitW(ctx);
      g.fill(11, FY, w, ".");
      g.put(12, FY - 1, "T");
      g.fill(11 + w, FY, 5, "_");
      plantDeco(g, ctx, 9);
    },
  },
  {
    id: "script-trench",
    beats: ["teach", "mix"],
    verbs: ["g"],
    themes: ["remainder"],
    paint(g, ctx) {
      g.fill(8, FY, 1, "g");
      g.fill(12, FY - 4, 5, "=");
      g.put(14, FY - 5, ctx.deco || "?");
      plantDeco(g, ctx, 6);
    },
  },
  {
    id: "script-lift",
    beats: ["teach", "mix"],
    verbs: ["`"],
    themes: ["remainder"],
    paint(g, ctx) {
      const w = pitW(ctx);
      g.fill(6, FY, w, ".");
      g.put(6, FY - 1, "`");
      g.put(7, FY - 1, "`");
      g.fill(6 + w + 2, FY - 3, 4, "=");
      g.put(5, FY - 2, ctx.deco || "?");
    },
  },
  {
    id: "canal-jet",
    beats: ["teach", "mix"],
    verbs: ["g"],
    themes: ["canal"],
    paint(g, ctx) {
      g.fill(6, FY, 3, ".");
      g.fill(6, FY + 1, 3, "~");
      g.fill(10, FY, 1, "g");
      g.fill(5, FY - 3, 6, "=");
      g.put(4, FY - 2, ctx.deco || ",");
    },
  },
  {
    id: "spire-shaft",
    beats: ["teach", "mix"],
    verbs: ["|", "`"],
    themes: ["spire"],
    paint(g, ctx) {
      g.fill(5, FY - 2, 3, "=");
      g.fill(9, FY - 4, 3, "=");
      g.put(13, FY - 3, "|");
      g.put(13, FY - 4, "|");
      g.fill(15, FY - 5, 3, "=");
      g.put(8, FY - 1, "v");
      g.put(8, FY - 2, "v");
      g.put(8, FY - 3, "v");
      plantDeco(g, ctx, 4);
    },
  },
  {
    id: "abyss-ribs",
    beats: ["teach", "mix"],
    verbs: ["`", "="],
    themes: ["abyss"],
    paint(g, ctx) {
      g.fill(5, FY - 2, 3, "=");
      g.fill(9, FY - 4, 4, "=");
      g.fill(14, FY - 5, 3, "=");
      g.put(17, FY - 1, "v");
      g.put(17, FY - 2, "v");
      g.put(17, FY - 3, "v");
      plantDeco(g, ctx, 4);
    },
  },
  {
    id: "saw-overhang",
    beats: ["teach", "mix"],
    verbs: ["S"],
    themes: ["remainder", "vault"],
    paint(g, ctx) {
      g.put(8, FY - 2, "S");
      g.fill(11, FY - 3, 4, "=");
      plantDeco(g, ctx, 5);
    },
  },
  {
    id: "blink-wait",
    beats: ["teach", "mix"],
    verbs: [")"],
    themes: ["orbit", "glacier", "remainder"],
    paint(g, ctx) {
      const w = pitW(ctx, 3, 4);
      g.fill(6, FY, w, ".");
      g.put(7, FY - 1, ")");
      if (w > 3) g.put(8, FY - 1, ")");
      g.fill(6 + w, FY, 3, "#");
      plantDeco(g, ctx, 5);
    },
  },
  {
    id: "combat-loft",
    beats: ["combat"],
    verbs: [],
    themes: ["orbit", "spire", "abyss"],
    paint(g, ctx) {
      g.fill(5, FY - 3, 5, "=");
      g.put(6, FY - 4, ctx.enemy || "1");
      g.put(8, FY - 4, "0");
      g.put(14, FY - 1, "2");
      plantDeco(g, ctx, 16);
    },
  },
  {
    id: "rest-sun-loft",
    beats: ["rest"],
    verbs: [],
    themes: ["orbit"],
    paint(g, ctx) {
      g.fill(5, FY - 3, 6, "=");
      g.put(6, FY - 1, "%");
      g.put(8, FY - 4, "i");
      g.put(10, FY - 4, "h");
      plantDeco(g, ctx, 13);
      plantPocket(g, ctx, 12);
    },
  },
  {
    id: "arena-cover",
    beats: ["arena"],
    verbs: [],
    minW: 28,
    paint(g, ctx) {
      g.put(2, FY - 1, "@");
      g.put(5, FY - 1, "%");
      g.put(Math.floor(g.W / 2), FY - 1, "!");
      g.fill(8, FY - 3, 5, "=");
      g.fill(g.W - 14, FY - 4, 5, "=");
      plantDeco(g, ctx, 7);
      g.put(g.W - 6, FY - 1, "h");
      g.put(g.W - 4, FY - 1, "P");
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
  {
    id: "mix-sluice-laser",
    beats: ["mix"],
    verbs: ["~", "|"],
    themes: ["canal", "remainder"],
    paint(g, ctx) {
      const w = pitW(ctx);
      g.fill(6, FY, w, ".");
      g.fill(6, FY + 1, w, "~");
      g.put(6 + Math.floor(w / 2), FY - 1, "T");
      g.put(8, FY - 3, "|");
      g.put(8, FY - 4, "|");
      plantDeco(g, ctx, 5);
    },
  },
  {
    id: "mix-belts",
    beats: ["mix"],
    verbs: ["/"],
    paint(g, ctx) {
      g.fill(5, FY, 3, "/");
      g.fill(9, FY, 2, ".");
      g.fill(9, FY + 1, 2, "^");
      g.put(9, FY - 1, "T");
      g.fill(12, FY, 3, "\\");
      plantDeco(g, ctx, 4);
    },
  },
  {
    id: "mix-fan-laser",
    beats: ["mix"],
    verbs: ["|"],
    themes: ["coil", "vault", "spire"],
    paint(g, ctx) {
      g.fill(6, FY, 2, ".");
      g.put(6, FY - 1, ":");
      g.put(10, FY - 3, "|");
      g.put(10, FY - 4, "|");
      g.fill(12, FY - 3, 4, "=");
      plantDeco(g, ctx, 5);
    },
  },
  {
    id: "teach-retract",
    beats: ["teach", "mix"],
    verbs: ["|"],
    themes: ["coil", "vault"],
    paint(g, ctx) {
      g.put(7, FY - 3, "|");
      g.put(7, FY - 4, "|");
      g.fill(9, FY, 4, "#");
      g.fill(14, FY - 3, 4, "=");
      plantDeco(g, ctx, 5);
    },
  },
];

export function pickPattern(
  beat: Beat,
  featured: Verb,
  mix: Verb,
  rand: () => number,
  used: Set<string>,
  theme?: ThemeId,
): Pattern | null {
  const pool = PATTERNS.filter((p) => p.beats.includes(beat));
  const matched = pool.filter((p) => {
    if (used.has(p.id)) return false;
    if (beat === "teach") {
      if (theme && p.themes?.includes(theme) && p.verbs.includes(featured)) return true;
      return p.verbs.length === 1 && p.verbs[0] === featured;
    }
    if (beat === "mix") {
      if (!p.verbs.length) return false;
      return p.verbs.includes(featured) || p.verbs.includes(mix);
    }
    if (beat === "combat" && (featured === "S" || mix === "S")) {
      return p.id === "combat-saw" || p.verbs.length === 0;
    }
    return p.verbs.length === 0;
  });
  const themed = theme ? matched.filter((p) => p.themes?.includes(theme)) : [];
  const list = themed.length ? themed : matched.length ? matched : pool.filter((p) => !used.has(p.id));
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
