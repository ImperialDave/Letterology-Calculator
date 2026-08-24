import type { LetterId } from "./types";

export interface LetterKit {
  id: LetterId;
  element: string;
  skill: string;
  skillCap: string;
  weak: string;
  spd: number;
  jump: number;
  hp: number;
  w: number;
  h: number;
  capW: number;
  capH: number;
  shotMul: number;
  shotLife: number;
  shotCd: number;
  large: boolean;
  inkRate: number;
  glow: string;
  core: string;
  deep: string;
}

export const KITS: Record<LetterId, LetterKit> = {
  c: {
    id: "c",
    element: "Aether",
    skill: "Dash",
    skillCap: "Cage",
    weak: "The warning mark. Eight-way dash, through shot and digit. Once in the air.",
    spd: 218,
    jump: 522,
    hp: 6,
    w: 28,
    h: 36,
    capW: 40,
    capH: 52,
    shotMul: 1,
    shotLife: 1,
    shotCd: 0.34,
    large: false,
    inkRate: 5.5,
    glow: "#5ee0c0",
    core: "#e8ece8",
    deep: "#0c201c",
  },
  s: {
    id: "s",
    element: "Gale",
    skill: "Cut",
    skillCap: "Scythe",
    weak: "Glass. Four curves. A second jump, then the air forgets you.",
    spd: 256,
    jump: 548,
    hp: 4,
    w: 24,
    h: 32,
    capW: 30,
    capH: 44,
    shotMul: 0.85,
    shotLife: 1.08,
    shotCd: 0.26,
    large: false,
    inkRate: 5.2,
    glow: "#7fd0ff",
    core: "#e8f6ff",
    deep: "#123040",
  },
  b: {
    id: "b",
    element: "Stone",
    skill: "Brace",
    skillCap: "Bulwark",
    weak: "Slow. Too wide for vents. The door that learned to walk.",
    spd: 150,
    jump: 438,
    hp: 8,
    w: 36,
    h: 44,
    capW: 48,
    capH: 56,
    shotMul: 1.1,
    shotLife: 0.9,
    shotCd: 0.42,
    large: true,
    inkRate: 4.2,
    glow: "#c4b08a",
    core: "#efe4c8",
    deep: "#2a2010",
  },
  e: {
    id: "e",
    element: "Tide",
    skill: "Pulse",
    skillCap: "Well",
    weak: "Curves that hold water. Swim the sluice. Freeze the digit.",
    spd: 190,
    jump: 500,
    hp: 6,
    w: 28,
    h: 36,
    capW: 38,
    capH: 48,
    shotMul: 0.95,
    shotLife: 1.15,
    shotCd: 0.36,
    large: false,
    inkRate: 6.2,
    glow: "#5ee0c0",
    core: "#d8f8f0",
    deep: "#0c2820",
  },
  r: {
    id: "r",
    element: "Ember",
    skill: "Flare",
    skillCap: "Inferno",
    weak: "A leg and a fire. The trail burns after you.",
    spd: 232,
    jump: 510,
    hp: 5,
    w: 26,
    h: 38,
    capW: 34,
    capH: 50,
    shotMul: 1.05,
    shotLife: 0.95,
    shotCd: 0.3,
    large: false,
    inkRate: 4.8,
    glow: "#e07040",
    core: "#f8e0c8",
    deep: "#2a1008",
  },
  k: {
    id: "k",
    element: "Stem",
    skill: "Strike",
    skillCap: "Column",
    weak: "Teacher of stems. Not a recruit of the five.",
    spd: 200,
    jump: 480,
    hp: 6,
    w: 28,
    h: 40,
    capW: 36,
    capH: 52,
    shotMul: 1,
    shotLife: 1,
    shotCd: 0.35,
    large: false,
    inkRate: 5,
    glow: "#c9b896",
    core: "#efe4c8",
    deep: "#1c1810",
  },
  n: {
    id: "n",
    element: "Null",
    skill: "Mark",
    skillCap: "Seal",
    weak: "The ledger that remembers what was filed.",
    spd: 180,
    jump: 460,
    hp: 7,
    w: 30,
    h: 38,
    capW: 40,
    capH: 50,
    shotMul: 1,
    shotLife: 1,
    shotCd: 0.38,
    large: false,
    inkRate: 5,
    glow: "#8ec8d4",
    core: "#d8eef0",
    deep: "#101820",
  },
  t: {
    id: "t",
    element: "Shelf",
    skill: "Raise",
    skillCap: "Bridge",
    weak: "Teacher of shelves. Cross the gap.",
    spd: 195,
    jump: 490,
    hp: 6,
    w: 28,
    h: 40,
    capW: 36,
    capH: 52,
    shotMul: 1,
    shotLife: 1,
    shotCd: 0.35,
    large: false,
    inkRate: 5.5,
    glow: "#e8d48a",
    core: "#e8fff6",
    deep: "#0c2420",
  },
};

/** Found in the five closed chapters. Hub teachers never join from the Stacks. */
export const RECRUIT_LETTERS: LetterId[] = ["s", "b", "e", "r"];

export const PENTAD: LetterId[] = ["c", "s", "b", "e", "r"];

export function skillName(letter: LetterId, capital: boolean) {
  const k = KITS[letter] ?? KITS.c;
  return capital ? k.skillCap : k.skill;
}
