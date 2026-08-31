import type { Beat } from "./chunks";
import { DISTRICTS } from "./districts";
import type { ThemeId } from "./types";
import { STAGE_COUNT } from "./types";

export type Verb = "T" | "-" | "=" | "|" | "/" | "`" | ")" | "g" | "S" | "~";
export type Pocket = "none" | "loft" | "vent";

export interface Recipe {
  beats: Beat[];
  featured: Verb;
  mix: Verb;
  enemy: string;
  deco: string;
  pocket: Pocket;
  secret: boolean;
  theme: ThemeId;
}

const ROLE_TIERS = [
  ["1", "0"],
  ["1", "0", "2", "3"],
  ["1", "0", "2", "3", "5", "4"],
  ["1", "0", "2", "3", "5", "4", "7", "6"],
  ["1", "0", "2", "3", "5", "4", "7", "6", "8", "9"],
  ["1", "0", "2", "5", "7", "8", "9", "A", "B"],
  ["2", "5", "7", "8", "9", "A", "B", "C", "E", "Y"],
];

const VENT_HOME: ThemeId[] = ["coil", "spire", "abyss"];

export function rng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 4294967296;
  };
}

export function isBoss(n: number) {
  return n % 5 === 0 || n === STAGE_COUNT;
}

export function themeFor(n: number): ThemeId {
  return DISTRICTS[Math.min(DISTRICTS.length - 1, n)]?.theme ?? "street";
}

export function decoFor(theme: ThemeId) {
  if (theme === "fort") return "'";
  if (theme === "canal") return ",";
  if (theme === "glacier") return "_";
  if (theme === "remainder" || theme === "abyss") return "?";
  if (theme === "street" || theme === "hub") return '"';
  return ";";
}

export function verbsFor(n: number): Verb[] {
  if (n < 15) return ["T", "-", "="];
  if (n < 25) return ["|", "/", "T"];
  if (n < 35) return ["`", ")", "g"];
  if (n < 45) return ["S", "`", ")"];
  return ["S", "g", "|", "`"];
}

/** Mix pool. Sluice is mix-only — never featured, never before the Press, never glacier/orbit. */
export function mixVerbsFor(n: number, theme: ThemeId): Verb[] {
  const base = verbsFor(n);
  if (theme === "glacier" || theme === "orbit") return base;
  if (n >= 12 && (theme === "canal" || (theme === "remainder" && n >= 34))) {
    return [...base, "~"];
  }
  return base;
}

function pick<T>(rand: () => number, list: T[]): T {
  return list[Math.floor(rand() * list.length)] ?? list[0];
}

function beatOptions(n: number): Beat[][] {
  if (isBoss(n)) {
    return n >= 45
      ? [["land", "mix", "combat", "rest", "arena", "gate"]]
      : [["land", "teach", "combat", "rest", "arena", "gate"]];
  }
  if (n < 20) {
    return [
      ["land", "teach", "mix", "combat", "rest", "gate"],
      ["land", "teach", "mix", "rest", "combat", "gate"],
    ];
  }
  if (n < 31) {
    return [
      ["land", "teach", "mix", "combat", "rest", "combat", "gate"],
      ["land", "teach", "combat", "rest", "mix", "combat", "gate"],
    ];
  }
  const band = Math.min(5, Math.floor((n - 31) / 5));
  const seqs: Beat[][] = [
    [
      ["land", "teach", "mix", "combat", "rest", "combat", "gate"],
      ["land", "teach", "combat", "rest", "mix", "combat", "gate"],
    ],
    [
      ["land", "teach", "mix", "combat", "rest", "combat", "gate"],
      ["land", "teach", "mix", "combat", "rest", "mix", "gate"],
    ],
    [
      ["land", "teach", "mix", "combat", "rest", "combat", "gate"],
      ["land", "mix", "combat", "rest", "combat", "gate"],
    ],
    [
      ["land", "teach", "mix", "combat", "rest", "combat", "gate"],
      ["land", "teach", "combat", "rest", "mix", "combat", "gate"],
    ],
    [
      ["land", "teach", "mix", "combat", "rest", "combat", "gate"],
      ["land", "mix", "combat", "rest", "mix", "combat", "gate"],
    ],
    [
      ["land", "mix", "combat", "rest", "mix", "combat", "gate"],
      ["land", "teach", "mix", "combat", "rest", "combat", "gate"],
    ],
  ];
  return seqs[band];
}

export function recipeFor(n: number, rand: () => number): Recipe {
  const theme = themeFor(n);
  const pool = verbsFor(n);
  const featured = pick(rand, pool);
  const others = mixVerbsFor(n, theme).filter((v) => v !== featured);
  const mix = others.length ? pick(rand, others) : featured;
  const roles = ROLE_TIERS[Math.min(ROLE_TIERS.length - 1, Math.floor((n - 1) / 4))];
  const pocketRoll = rand();
  const ventHome = VENT_HOME.includes(theme);
  const pocket: Pocket =
    n < 16
      ? "none"
      : pocketRoll < 0.32
        ? "loft"
        : pocketRoll < (ventHome ? 0.58 : 0.44)
          ? "vent"
          : "none";
  return {
    beats: pick(rand, beatOptions(n)),
    featured,
    mix,
    enemy: pick(rand, roles),
    deco: decoFor(theme),
    pocket,
    secret: n >= 20 && rand() < 0.4,
    theme,
  };
}
