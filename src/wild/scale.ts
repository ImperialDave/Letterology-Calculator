/** Sable is 1.8 m. Every other height is chosen against that, not against the file's raw size. */

export const PLAYER_M = 1.8;

export const HEIGHT_M = {
  grass: 0.45,
  grassLarge: 0.95,
  flower: 0.4,
  bush: 1.1,
  bushLarge: 1.7,
  lantern: 0.55,
  banner: 1.4,
  traveler: PLAYER_M,
  stag: 2.2,
  wall: 2.5,
  door: 2.5,
  roof: 1.35,
  roofTop: 0.7,
  chimney: 1.15,
  rockSmall: 0.45,
  rock: 1.5,
  cliff: 3.4,
  cliffLarge: 5.2,
  tree: 6.2,
  oak: 8.4,
  serif: 0.75,
  shrine: 5.4,
  spire: 22,
} as const;

/** Returns the names that are out of proportion to the traveler. Empty means the set agrees. */
export function scaleProblems(): string[] {
  const h = HEIGHT_M;
  const bad: string[] = [];
  if (!(h.grass < h.traveler * 0.4)) bad.push("grass");
  if (!(h.lantern < h.traveler * 0.45)) bad.push("lantern");
  if (!(h.banner < h.traveler)) bad.push("banner");
  if (!(h.stag > h.traveler && h.stag < h.traveler * 1.5)) bad.push("stag");
  if (!(h.wall > h.traveler && h.wall < h.traveler * 1.8)) bad.push("wall");
  if (!(h.cliff > h.wall && h.cliff < h.oak)) bad.push("cliff");
  if (!(h.oak > h.traveler * 3 && h.oak < h.spire * 0.5)) bad.push("oak");
  if (!(h.spire > h.oak * 2)) bad.push("spire");
  if (!(h.serif < h.traveler * 0.5)) bad.push("serif");
  return bad;
}
