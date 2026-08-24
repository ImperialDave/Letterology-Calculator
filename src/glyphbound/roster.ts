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
    weak: "The warning mark. First at nothing, present in everything.",
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
    h: 48,
    capW: 44,
    capH: 58,
    shotMul: 1.25,
    shotLife: 0.9,
    shotCd: 0.46,
    large: true,
    inkRate: 4.6,
    glow: "#c4b49a",
    core: "#efe4c8",
    deep: "#2a2418",
  },
  e: {
    id: "e",
    element: "Tide",
    skill: "Pulse",
    skillCap: "Well",
    weak: "Fang dies close. The most written, the least far. Canals know her.",
    spd: 198,
    jump: 500,
    hp: 6,
    w: 28,
    h: 36,
    capW: 38,
    capH: 48,
    shotMul: 0.9,
    shotLife: 0.48,
    shotCd: 0.3,
    large: false,
    inkRate: 8.4,
    glow: "#6ec8e8",
    core: "#e4f7ff",
    deep: "#0c2430",
  },
  r: {
    id: "r",
    element: "Ember",
    skill: "Flare",
    skillCap: "Inferno",
    weak: "A courier of heat. Four health. Ink burns faster than it fills.",
    spd: 268,
    jump: 568,
    hp: 4,
    w: 26,
    h: 36,
    capW: 34,
    capH: 50,
    shotMul: 0.95,
    shotLife: 0.95,
    shotCd: 0.28,
    large: false,
    inkRate: 3.6,
    glow: "#e07040",
    core: "#ffd8b0",
    deep: "#2a1008",
  },
  k: {
    id: "k",
    element: "Storm",
    skill: "Stomp",
    skillCap: "Quake",
    weak: "Needs the floor. Flyers laugh.",
    spd: 186,
    jump: 470,
    hp: 7,
    w: 30,
    h: 42,
    capW: 40,
    capH: 54,
    shotMul: 1.35,
    shotLife: 0.8,
    shotCd: 0.48,
    large: false,
    inkRate: 4.8,
    glow: "#c46ad4",
    core: "#f0d4f4",
    deep: "#241028",
  },
  n: {
    id: "n",
    element: "Bind",
    skill: "Pin",
    skillCap: "Bind",
    weak: "A connector, not a sprinter.",
    spd: 172,
    jump: 505,
    hp: 6,
    w: 30,
    h: 40,
    capW: 38,
    capH: 52,
    shotMul: 1,
    shotLife: 1,
    shotCd: 0.36,
    large: false,
    inkRate: 5,
    glow: "#8ec8d4",
    core: "#e0f4f8",
    deep: "#102028",
  },
  t: {
    id: "t",
    element: "Quill",
    skill: "Compose",
    skillCap: "Set",
    weak: "A nib, not a fang. Lives by scribing.",
    spd: 204,
    jump: 512,
    hp: 5,
    w: 26,
    h: 40,
    capW: 36,
    capH: 54,
    shotMul: 0.55,
    shotLife: 0.85,
    shotCd: 0.4,
    large: false,
    inkRate: 7.4,
    glow: "#9af8de",
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
