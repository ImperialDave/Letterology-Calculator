import { FOREST, MESA } from "./terrain";
import { HERDER, HOUSES, SCRIPT, SERIF, SPIRE } from "./layout";
import { HEIGHT_M, PLAYER_M } from "./scale";

/** Horizontal radii in meters. The mover is stopped at solid.r + its own radius. */
export const PLAYER_R = 0.42;

export const SOLID_R = {
  stag: 1.15,
  house: 3.65,
  shrine: 3.05,
  spire: 2.05,
  tree: 0.55,
  rock: 0.7,
  serif: 0.34,
  cliff: 1.15,
  cliffLarge: 1.55,
} as const;

export type Solid = { x: number; z: number; r: number };

export type AssemblyTarget = { minHeight: number; minFootprint: number; maxHeight: number };

/** Cottages clear Sable's head and are wider than a person is tall. */
export const HOUSE_FIT: AssemblyTarget = { minHeight: 4.8, minFootprint: 5.4, maxHeight: 5.6 };
export const SHRINE_FIT: AssemblyTarget = { minHeight: 4.2, minFootprint: 4.4, maxHeight: 5.4 };
export const SPIRE_FIT: AssemblyTarget = { minHeight: 20, minFootprint: 4.0, maxHeight: 23 };

/**
 * How close Sable can stand and still use a thing.
 * Buildings use solid radius + her body + a step of slack, so the prompt
 * still appears after the hitbox stops her short of the center.
 */
export const REACH = {
  stag: SOLID_R.stag + PLAYER_R + 2.13,
  serif: 2.4,
  script: SOLID_R.shrine + PLAYER_R + 1.25,
  herder: 2.8,
  climbInner: SOLID_R.spire + PLAYER_R - 0.45,
  climbOuter: SOLID_R.spire + PLAYER_R + 1.6,
  climbPin: SOLID_R.spire + PLAYER_R + 0.06,
  bell: SOLID_R.spire + PLAYER_R + 2.2,
} as const;

/**
 * Uniform scale that makes a measured object at least minHeight tall and
 * minFootprint across, without exceeding maxHeight.
 */
export function fitScale(measured: { y: number; xz: number }, target: AssemblyTarget) {
  const y = Math.max(measured.y, 0.001);
  const xz = Math.max(measured.xz, 0.001);
  let scale = Math.max(target.minHeight / y, target.minFootprint / xz);
  if (y * scale > target.maxHeight) scale = target.maxHeight / y;
  return scale;
}

/** Names of assembly targets that would dwarf or shrink Sable. Empty means the set agrees. */
export function assemblyProblems(): string[] {
  const bad: string[] = [];
  if (!(HOUSE_FIT.minHeight > PLAYER_M * 2 && HOUSE_FIT.minHeight <= HOUSE_FIT.maxHeight)) bad.push("house height");
  if (!(HOUSE_FIT.minFootprint > PLAYER_M * 2.5)) bad.push("house footprint");
  if (!(SHRINE_FIT.minHeight > PLAYER_M * 2 && SHRINE_FIT.minFootprint > PLAYER_M * 2)) bad.push("shrine");
  if (!(SPIRE_FIT.minHeight > HEIGHT_M.oak * 2)) bad.push("spire height");
  if (!(SPIRE_FIT.minFootprint > PLAYER_M * 2)) bad.push("spire footprint");
  if (!(SOLID_R.house >= HOUSE_FIT.minFootprint / 2)) bad.push("house solid");
  if (!(SOLID_R.shrine >= SHRINE_FIT.minFootprint / 2)) bad.push("shrine solid");
  if (!(SOLID_R.spire * 2 >= SPIRE_FIT.minFootprint * 0.9)) bad.push("spire solid");
  if (!(SOLID_R.stag > PLAYER_R && SOLID_R.stag < PLAYER_M)) bad.push("stag solid");
  if (!(REACH.script > SOLID_R.shrine + PLAYER_R)) bad.push("script reach");
  if (!(REACH.climbPin > SOLID_R.spire + PLAYER_R)) bad.push("climb pin");
  if (!(REACH.climbInner < SOLID_R.spire + PLAYER_R && REACH.climbOuter > REACH.climbPin)) bad.push("climb band");
  const herder = HOUSES[0];
  const herderD = Math.hypot(HERDER.x - herder.x, HERDER.z - herder.z);
  if (!(herderD > SOLID_R.house + PLAYER_R)) bad.push("herder buried");
  return bad;
}

export const OAK_SPOTS: [number, number][] = [
  [18, -6],
  [28, 12],
  [-6, -4],
  [40, 2],
  [FOREST.x, FOREST.z],
  [FOREST.x + 8, FOREST.z - 6],
];

export const PINE_SPOTS: [number, number][] = [
  [8, -8],
  [33, -5],
  [70, 8],
];

export const ROCK_SPOTS: [number, number][] = [
  [6, -2],
  [22, 14],
];

export function cliffSpots(): { x: number; z: number; large: boolean; yaw: number }[] {
  const spots = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    spots.push({
      x: MESA.x + Math.cos(a) * 18,
      z: MESA.z + Math.sin(a) * 18,
      large: i % 2 === 0,
      yaw: Math.PI / 2 - a,
    });
  }
  return spots;
}

export function fixedSolids(): Solid[] {
  return [
    ...HOUSES.map((house) => ({ x: house.x, z: house.z, r: SOLID_R.house })),
    { x: SCRIPT.x, z: SCRIPT.z, r: SOLID_R.shrine },
    { x: SPIRE.x, z: SPIRE.z, r: SOLID_R.spire },
    ...OAK_SPOTS.map(([x, z]) => ({ x, z, r: SOLID_R.tree })),
    ...PINE_SPOTS.map(([x, z]) => ({ x, z, r: SOLID_R.tree })),
    ...ROCK_SPOTS.map(([x, z]) => ({ x, z, r: SOLID_R.rock })),
    ...cliffSpots().map((cliff) => ({ x: cliff.x, z: cliff.z, r: cliff.large ? SOLID_R.cliffLarge : SOLID_R.cliff })),
  ];
}

/** Solids that stop Sable. The stag and a dropped serif move with the world. */
export function playerSolids(s: { stagX: number; stagZ: number; serif: number }): Solid[] {
  const solids = fixedSolids();
  solids.push({ x: s.stagX, z: s.stagZ, r: SOLID_R.stag });
  if (s.serif === 0) solids.push({ x: SERIF.x, z: SERIF.z, r: SOLID_R.serif });
  return solids;
}

/** Solids that stop the stag. Includes Sable, not the stag itself. */
export function stagSolids(s: { x: number; z: number; serif: number }): Solid[] {
  const solids = fixedSolids();
  solids.push({ x: s.x, z: s.z, r: PLAYER_R });
  if (s.serif === 0) solids.push({ x: SERIF.x, z: SERIF.z, r: SOLID_R.serif });
  return solids;
}

export function overlaps(x: number, z: number, solid: Solid, padding = PLAYER_R) {
  return Math.hypot(x - solid.x, z - solid.z) < solid.r + padding;
}

/** Slide along a wall instead of stopping dead or passing through. */
export function slideMove(x0: number, z0: number, x1: number, z1: number, solids: Solid[], padding = PLAYER_R) {
  const hit = (x: number, z: number) => solids.some((solid) => overlaps(x, z, solid, padding));
  if (!hit(x1, z1)) return { x: x1, z: z1 };
  if (!hit(x1, z0)) return { x: x1, z: z0 };
  if (!hit(x0, z1)) return { x: x0, z: z1 };
  return { x: x0, z: z0 };
}
