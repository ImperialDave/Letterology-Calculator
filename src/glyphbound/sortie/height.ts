/** Shared ground height for collision and the visible mesh. No three.js. */
import { landmarkHeight } from "./landmarks";
import type { BiomeId } from "./terrain";

const ARENA_R = 420;

const PADS = [
  { x: 0, z: -180, r: 78, h: 38 },
  { x: 160, z: 40, r: 46, h: 28 },
  { x: -170, z: 70, r: 42, h: 24 },
  { x: 40, z: 210, r: 55, h: 16 },
  { x: -40, z: -40, r: 36, h: 44 },
];

function n2(x: number, z: number) {
  return (
    Math.sin(x * 0.018 + z * 0.015) * 0.52 +
    Math.sin(x * 0.041 - z * 0.029) * 0.28 +
    Math.sin(x * 0.09 + z * 0.07) * 0.14
  );
}

function mound(x: number, z: number, cx: number, cz: number, r: number, h: number) {
  const d = Math.hypot(x - cx, z - cz);
  if (d >= r) return 0;
  const t = 1 - (d / r) * (d / r);
  return h * t * t;
}

function biomeHills(biome: BiomeId, x: number, z: number) {
  const n = n2(x, z);
  if (biome === "coast") {
    const plaza = mound(x, z, 0, -160, 140, 22);
    const bankL = mound(x, z, -90, 180, 70, 36);
    const bankR = mound(x, z, 95, 160, 75, 34);
    const channel = z > 40 && Math.abs(x) < 44 ? Math.max(0, Math.abs(x) - 38) * 0.9 : 0;
    const city = z < 40 && z > -90 && Math.abs(x) > 50 ? 10 + n * 4 : 0;
    return Math.max(plaza, bankL, bankR, channel, city, 4 + n * 5);
  }
  if (biome === "slug") {
    let h = 6 + n * 8;
    for (let i = 0; i < 11; i++) {
      const a = i * 0.7;
      h = Math.max(h, mound(x, z, Math.cos(a) * 150, Math.sin(a) * 150, 28 + (i % 3) * 8, 14 + (i % 4) * 6));
    }
    return h;
  }
  if (biome === "gutter") {
    const dock = mound(x, z, 40, 120, 90, 12);
    const shore = mound(x, z, -80, -40, 160, 16);
    return Math.max(dock, shore, 3 + n * 4);
  }
  if (biome === "ice") {
    let h = 5 + n * 6;
    for (let i = 0; i < 4; i++) {
      h = Math.max(h, mound(x, z, Math.cos(i * 1.6) * 140, Math.sin(i * 1.6) * 140, 55, 10));
    }
    return h;
  }
  if (biome === "sorts") return 0;
  if (biome === "press") {
    const crater = Math.hypot(x, z);
    const bowl = crater < 130 ? Math.max(4, 14 - (130 - crater) * 0.08) : 16 + n * 7;
    return bowl + mound(x, z, 0, -180, 90, 28);
  }
  // sky / default: rolling ink-isles
  return 8 + n * 10;
}

export function groundHeight(biome: BiomeId, x: number, z: number, missionId?: string) {
  // Coast strip is a river valley. landmarkHeight owns it so the water
  // channel can sit *below* the biome's plaza floor instead of maxing with it.
  if (missionId === "coast" && z > 220) {
    return Math.max(0, landmarkHeight("coast", x, z));
  }
  let h = biomeHills(biome, x, z);
  if (missionId) h = Math.max(h, landmarkHeight(missionId, x, z));
  if (z > 180) return Math.max(0, h);
  const r = Math.hypot(x, z);
  if (r > ARENA_R + 8) return 0;
  for (const i of PADS) {
    h = Math.max(h, mound(x, z, i.x, i.z, i.r, i.h));
  }
  const fade = r > ARENA_R - 30 ? Math.max(0, (ARENA_R + 8 - r) / 38) : 1;
  return Math.max(0, h * fade);
}
