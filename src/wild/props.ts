/** Placed CC0 props. A radius stops Sable. A line is what E says when she is close. */

import { STEPPE, type LevelProp } from "./level";

export type PropMode = LevelProp["mode"];
export type Prop = LevelProp;

export const PROPS: Prop[] = STEPPE.props;

export function propSolids() {
  return PROPS.filter((prop) => prop.r && prop.r > 0).map((prop) => ({ x: prop.x, z: prop.z, r: prop.r as number }));
}

export function nearestExamine(x: number, z: number, yaw?: number) {
  const fx = yaw === undefined ? 0 : -Math.sin(yaw);
  const fz = yaw === undefined ? 0 : -Math.cos(yaw);
  let best: { say: string; d: number; verb: string } | null = null;
  for (const prop of PROPS) {
    if (!prop.say || !prop.reach) continue;
    const dx = prop.x - x;
    const dz = prop.z - z;
    const d = Math.hypot(dx, dz);
    if (d > prop.reach) continue;
    if (yaw !== undefined && d > 0.25 && (fx * dx + fz * dz) / d < 0.35) continue;
    const verb = prop.verb ?? (prop.id === "gate" || prop.id === "door" ? "Open" : "Read");
    if (!best || d < best.d) best = { say: prop.say, d, verb };
  }
  return best;
}
