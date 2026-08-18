import type { Planet } from "./hymn";

export const PLANET_RANK: Record<Planet, number> = {
  moon: 0,
  mercury: 1,
  venus: 2,
  sun: 3,
  mars: 4,
  jupiter: 5,
  saturn: 6,
};

export type HymnMotion = "silent" | "unison" | "ascent" | "descent" | "periodos";

export type MotionReading = {
  motion: HymnMotion;
  ranks: number[];
  line: string;
};

export function motionOf(planets: Planet[]): MotionReading {
  if (planets.length === 0) {
    return {
      motion: "silent",
      ranks: [],
      line: "There is no vowel sequence. The ladder is unclimbed. The work of this name is all consonants — public, colliding, and without a sung weather.",
    };
  }
  const ranks = planets.map((planet) => PLANET_RANK[planet]);
  const allSame = ranks.every((rank) => rank === ranks[0]);
  if (allSame) {
    return {
      motion: "unison",
      ranks,
      line: "The vowels stay on one planet. A single note. That can be devotion, or a refusal to move. Ask which.",
    };
  }
  let up = true;
  let down = true;
  for (let i = 1; i < ranks.length; i += 1) {
    if (ranks[i] < ranks[i - 1]) up = false;
    if (ranks[i] > ranks[i - 1]) down = false;
  }
  if (up) {
    const hardened = ranks[ranks.length - 1] === ranks[ranks.length - 2];
    return {
      motion: "ascent",
      ranks,
      line: hardened
        ? "The vowels climb and then stay in force. The last note is a decision, not a rest."
        : "The vowels climb the spheres, Moon toward Saturn. Proodos of the hymn: each step is farther from the first dark.",
    };
  }
  if (down) {
    return {
      motion: "descent",
      ranks,
      line: "The vowels fall inward, toward the first dark — epistrophe of the hymn. This is not failure. It is a return to night-mind.",
    };
  }
  return {
    motion: "periodos",
    ranks,
    line: "The vowels climb and fall — a circuit, not a march. What leaves comes back. Do not treat the loop as a stall.",
  };
}
