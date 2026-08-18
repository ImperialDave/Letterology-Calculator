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
      line: "There is no vowel sequence. All guidance is civic — the consonants. Do one public act before sunset. Do not invent an inner weather the letters did not write.",
    };
  }
  const ranks = planets.map((planet) => PLANET_RANK[planet]);
  const allSame = ranks.every((rank) => rank === ranks[0]);
  if (allSame) {
    return {
      motion: "unison",
      ranks,
      line: "The vowels stay on one planet — a single note. Hold that weather for this week. Refuse a second mood until the job under that note is finished.",
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
        ? "The vowels climb and then stay in force. Take the next harder step before you rest. The last note is a decision — do not soft-land into a smaller errand."
        : "The vowels climb the spheres, Moon toward Saturn. Take the next harder step before you rest. Do not start a softer errand mid-climb.",
    };
  }
  if (down) {
    return {
      motion: "descent",
      ranks,
      line: "The vowels fall inward, toward the first dark. Return one matter to private judgment today. Do not perform it in the public room.",
    };
  }
  return {
    motion: "periodos",
    ranks,
    line: "The vowels climb and fall — a circuit. Schedule a return: name the thing you leave this week, and name when you will re-enter it. Do not treat the loop as a stall.",
  };
}
