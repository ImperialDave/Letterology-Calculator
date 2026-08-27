import type { EnemyKind } from "./types";

export type BrushGroup =
  | "terrain"
  | "hazard"
  | "mover"
  | "deco"
  | "enemy"
  | "boss"
  | "pickup"
  | "npc"
  | "meta";

export interface Brush {
  ch: string;
  group: BrushGroup;
  label: string;
}

export const ENEMY_CHARS: Record<string, EnemyKind> = {
  "1": "one",
  "0": "zero",
  "2": "two",
  "3": "three",
  "4": "four",
  "5": "five",
  "6": "six",
  "7": "seven",
  "8": "eight",
  "9": "nine",
  A: "triad",
  B: "nullring",
  C: "mobius",
  E: "summoner",
  Y: "gradient",
  G: "importer",
  H: "archivist",
  K: "crossseal",
  Q: "plus",
  U: "minus",
  N: "times",
  J: "divide",
  L: "pi",
  M: "radix",
};

export const ENEMY_CHAR_LIST = "1023456789ABCEYGHKQUNJLM";

const BRUSHES: Brush[] = [
  { ch: ".", group: "terrain", label: "Erase" },
  { ch: "#", group: "terrain", label: "Solid" },
  { ch: "=", group: "terrain", label: "Shelf" },
  { ch: "*", group: "terrain", label: "Break" },
  { ch: "-", group: "terrain", label: "Crumble" },
  { ch: "_", group: "terrain", label: "Rail" },
  { ch: "&", group: "terrain", label: "Plinth" },
  { ch: "v", group: "terrain", label: "Vent" },

  { ch: "^", group: "hazard", label: "Spike" },
  { ch: "~", group: "hazard", label: "Sluice" },
  { ch: "|", group: "hazard", label: "Laser" },
  { ch: "S", group: "hazard", label: "Saw" },

  { ch: "/", group: "mover", label: "Belt →" },
  { ch: "\\", group: "mover", label: "Belt ←" },
  { ch: "T", group: "mover", label: "Bounce" },
  { ch: ":", group: "mover", label: "Fan" },
  { ch: "`", group: "mover", label: "Lift" },
  { ch: ")", group: "mover", label: "Blink" },
  { ch: "g", group: "mover", label: "Geyser" },

  { ch: "'", group: "deco", label: "Torch" },
  { ch: ";", group: "deco", label: "Lantern" },
  { ch: '"', group: "deco", label: "Banner" },
  { ch: ",", group: "deco", label: "Drip" },
  { ch: "?", group: "deco", label: "Shard" },

  ...Object.entries(ENEMY_CHARS).map(([ch, kind]) => ({
    ch,
    group: "enemy" as const,
    label: kind,
  })),
  { ch: "!", group: "boss", label: "Stage warden" },

  { ch: "i", group: "pickup", label: "Ink" },
  { ch: "h", group: "pickup", label: "Heart" },
  { ch: "o", group: "pickup", label: "Scale" },
  { ch: "+", group: "pickup", label: "Fang" },
  { ch: "$", group: "pickup", label: "Secret" },
  { ch: "W", group: "pickup", label: "WALL" },
  { ch: "R", group: "pickup", label: "BURN" },
  { ch: "X", group: "pickup", label: "RISE" },
  { ch: "Z", group: "pickup", label: "LOCK" },
  { ch: "O", group: "pickup", label: "FOLD" },
  { ch: "I", group: "pickup", label: "TIDE" },
  { ch: "D", group: "pickup", label: "Drop Cap" },
  { ch: "F", group: "pickup", label: "Case font" },

  { ch: "c", group: "npc", label: "c" },
  { ch: "s", group: "npc", label: "s / recruit" },
  { ch: "b", group: "npc", label: "b / recruit" },
  { ch: "e", group: "npc", label: "e / recruit" },
  { ch: "r", group: "npc", label: "r / recruit" },
  { ch: "k", group: "npc", label: "k" },
  { ch: "n", group: "npc", label: "n" },
  { ch: "t", group: "npc", label: "t" },

  { ch: "@", group: "meta", label: "Spawn" },
  { ch: "%", group: "meta", label: "Check" },
  { ch: "P", group: "meta", label: "Gate" },
  { ch: ">", group: "meta", label: "Arrow / Rest of book" },
  { ch: "<", group: "meta", label: "Arrow / Last page" },
  { ch: "V", group: "meta", label: "Down" },
  { ch: "[", group: "meta", label: "Door Exchange" },
  { ch: "]", group: "meta", label: "Door Fort" },
  { ch: "{", group: "meta", label: "Door Press" },
  { ch: "}", group: "meta", label: "Door Coil" },
  { ch: "(", group: "meta", label: "Door Ledger" },
];

const byChar = new Map<string, Brush>();
for (const b of BRUSHES) if (!byChar.has(b.ch)) byChar.set(b.ch, b);

/** Lowercase lore letters that are not already a primary brush (`v` is vent). */
const LORE_LETTERS = "abcdefghijklmnopqrstuvwxyz";
for (const ch of LORE_LETTERS) {
  if (!byChar.has(ch)) byChar.set(ch, { ch, group: "npc", label: ch });
}

export const CATALOG: Brush[] = [...byChar.values()];

export const ALLOWED_CHARS = new Set(byChar.keys());

export function brushFor(ch: string): Brush | undefined {
  return byChar.get(ch);
}

export function catalogGroup(group: BrushGroup): Brush[] {
  return CATALOG.filter((b) => b.group === group);
}
