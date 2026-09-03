/** Density floors for StarWords 10× geography. Collision-free; data only. */

import { dressingCatalogCount } from "./dressing";
import { landmarksFor } from "./landmarks";

export { dressingCatalogCount };

export const DRESSING_FLOOR: Record<string, number> = {
  coast: 800,
  sorts: 700,
  slug: 700,
  gutter: 700,
  ice: 500,
  press: 600,
};

/** Landmark / fly-through / dip targets. Enforced as missions are rewritten. */
export const LANDMARK_TARGET: Record<
  string,
  { landmarks: number; flythroughs: number; dips: number; paints: number }
> = {
  coast: { landmarks: 22, flythroughs: 3, dips: 1, paints: 8 },
  sorts: { landmarks: 18, flythroughs: 3, dips: 1, paints: 6 },
  slug: { landmarks: 18, flythroughs: 2, dips: 1, paints: 6 },
  gutter: { landmarks: 18, flythroughs: 3, dips: 1, paints: 6 },
  ice: { landmarks: 10, flythroughs: 1, dips: 0, paints: 5 },
  press: { landmarks: 16, flythroughs: 2, dips: 1, paints: 6 },
};

export function landmarkCount(missionId: string) {
  return landmarksFor(missionId).length;
}

export function flythroughCount(missionId: string) {
  return landmarksFor(missionId).filter((L) => L.pay).length;
}

export function dressingFloor(missionId: string) {
  return DRESSING_FLOOR[missionId] ?? 0;
}

export function meetsDressingFloor(missionId: string) {
  const floor = dressingFloor(missionId);
  if (floor <= 0) return true;
  return dressingCatalogCount(missionId) >= floor;
}
