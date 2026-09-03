/** Instanced non-colliding dressing. Shared geos/mats. No hole law. */

import * as THREE from "three";
import { groundHeight } from "./height";
import { riverX } from "./landmarks";
import {
  barkTex,
  cityFarTex,
  flagInkTex,
  iceSpireTex,
  leafConeTex,
  leafFlatTex,
  letterStoneTex,
  n64Mat,
  paperPageTex,
  rustTex,
  sortNightTex,
  woodCrateTex,
} from "./n64";
import type { BiomeId } from "./terrain";

export type DressArchetype =
  | "tree-cone"
  | "tree-flat"
  | "tree-dead"
  | "flag"
  | "wreck-bit"
  | "paper-scrap"
  | "city-slab"
  | "lamp"
  | "ice-spire"
  | "space-sort"
  | "barge"
  | "crate"
  | "moth";

export interface DressLayer {
  archetype: DressArchetype;
  count: number;
}

/** Catalog counts. Scatter retries until it fills, or reports what it placed. */
export const DRESSING: Record<string, DressLayer[]> = {
  coast: [
    { archetype: "tree-cone", count: 260 },
    { archetype: "tree-flat", count: 160 },
    { archetype: "tree-dead", count: 70 },
    { archetype: "flag", count: 70 },
    { archetype: "barge", count: 36 },
    { archetype: "crate", count: 80 },
    { archetype: "lamp", count: 70 },
    { archetype: "city-slab", count: 28 },
    { archetype: "wreck-bit", count: 40 },
    { archetype: "paper-scrap", count: 80 },
  ],
  slug: [
    { archetype: "tree-dead", count: 180 },
    { archetype: "tree-cone", count: 80 },
    { archetype: "crate", count: 120 },
    { archetype: "wreck-bit", count: 90 },
    { archetype: "barge", count: 40 },
    { archetype: "lamp", count: 50 },
    { archetype: "city-slab", count: 20 },
    { archetype: "paper-scrap", count: 120 },
  ],
  gutter: [
    { archetype: "crate", count: 180 },
    { archetype: "lamp", count: 120 },
    { archetype: "wreck-bit", count: 140 },
    { archetype: "city-slab", count: 24 },
    { archetype: "flag", count: 40 },
    { archetype: "paper-scrap", count: 120 },
    { archetype: "barge", count: 80 },
  ],
  ice: [
    { archetype: "ice-spire", count: 320 },
    { archetype: "wreck-bit", count: 80 },
    { archetype: "crate", count: 40 },
    { archetype: "lamp", count: 36 },
    { archetype: "paper-scrap", count: 40 },
  ],
  sorts: [
    { archetype: "space-sort", count: 480 },
    { archetype: "moth", count: 180 },
    { archetype: "paper-scrap", count: 80 },
  ],
  press: [
    { archetype: "city-slab", count: 36 },
    { archetype: "wreck-bit", count: 160 },
    { archetype: "crate", count: 80 },
    { archetype: "lamp", count: 70 },
    { archetype: "flag", count: 40 },
    { archetype: "paper-scrap", count: 80 },
    { archetype: "tree-dead", count: 160 },
  ],
  sky: [],
};

export function dressingCatalogCount(missionId: string) {
  return (DRESSING[missionId] ?? []).reduce((n, l) => n + l.count, 0);
}

export function hash01(n: number) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

interface Part {
  geo: THREE.BufferGeometry;
  mat: THREE.Material;
}

const geoCache = new Map<string, Part[]>();
const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _e = new THREE.Euler();

function partsOf(kind: DressArchetype): Part[] {
  const hit = geoCache.get(kind);
  if (hit) return hit;
  const parts: Part[] = [];
  if (kind === "tree-cone") {
    const trunk = new THREE.CylinderGeometry(0.5, 0.7, 4, 4);
    trunk.translate(0, 2, 0);
    const crown = new THREE.ConeGeometry(3.4, 6.2, 5);
    crown.translate(0, 5.6, 0);
    const cap = new THREE.ConeGeometry(2.4, 4.4, 5);
    cap.translate(0, 8.4, 0);
    const bark = n64Mat(0x8a6a40, { map: barkTex() });
    const leaf = n64Mat(0x5ad848, { map: leafConeTex() });
    parts.push({ geo: trunk, mat: bark }, { geo: crown, mat: leaf }, { geo: cap, mat: leaf });
  } else if (kind === "tree-flat") {
    const trunk = new THREE.CylinderGeometry(0.45, 0.6, 3.2, 4);
    trunk.translate(0, 1.6, 0);
    const crown = new THREE.SphereGeometry(2.6, 5, 4);
    crown.translate(0, 4.2, 0);
    parts.push(
      { geo: trunk, mat: n64Mat(0x8a6a40, { map: barkTex() }) },
      { geo: crown, mat: n64Mat(0x4cbc58, { map: leafFlatTex() }) },
    );
  } else if (kind === "tree-dead") {
    const trunk = new THREE.CylinderGeometry(0.35, 0.55, 5.5, 4);
    trunk.translate(0, 2.7, 0);
    const arm = new THREE.BoxGeometry(2.4, 0.28, 0.28);
    arm.translate(0.8, 4.4, 0);
    const wood = n64Mat(0xa08058, { map: barkTex() });
    parts.push({ geo: trunk, mat: wood }, { geo: arm, mat: wood });
  } else if (kind === "flag") {
    const pole = new THREE.CylinderGeometry(0.12, 0.16, 8, 4);
    pole.translate(0, 4, 0);
    const cloth = new THREE.PlaneGeometry(3.4, 1.8);
    cloth.translate(1.8, 6.6, 0);
    parts.push(
      { geo: pole, mat: n64Mat(0xc8b070, { map: barkTex() }) },
      { geo: cloth, mat: n64Mat(0xffffff, { map: flagInkTex() }) },
    );
  } else if (kind === "wreck-bit") {
    parts.push({ geo: new THREE.TetrahedronGeometry(1.6, 0), mat: n64Mat(0xb07050, { map: rustTex() }) });
  } else if (kind === "paper-scrap") {
    const p = new THREE.PlaneGeometry(1.6, 1.1);
    parts.push({
      geo: p,
      mat: new THREE.MeshLambertMaterial({
        map: paperPageTex(),
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.92,
        flatShading: true,
      }),
    });
  } else if (kind === "city-slab") {
    parts.push({ geo: new THREE.BoxGeometry(28, 22, 18), mat: n64Mat(0xd4c8b0, { map: cityFarTex() }) });
  } else if (kind === "lamp") {
    const pole = new THREE.CylinderGeometry(0.14, 0.2, 6.2, 4);
    pole.translate(0, 3.1, 0);
    const bulb = new THREE.SphereGeometry(0.55, 5, 4);
    bulb.translate(0, 6.4, 0);
    parts.push(
      { geo: pole, mat: n64Mat(0x8a7a60) },
      { geo: bulb, mat: n64Mat(0xffe08a, { emissive: 0xc8a040, glow: 0.55 }) },
    );
  } else if (kind === "ice-spire") {
    const spire = new THREE.ConeGeometry(2.2, 11, 5);
    spire.translate(0, 5.5, 0);
    parts.push({ geo: spire, mat: n64Mat(0xe8f8fc, { map: iceSpireTex() }) });
  } else if (kind === "space-sort") {
    parts.push({ geo: new THREE.DodecahedronGeometry(1, 0), mat: n64Mat(0xb8a888, { map: sortNightTex() }) });
  } else if (kind === "barge") {
    parts.push({ geo: new THREE.BoxGeometry(7.5, 1.2, 2.6), mat: n64Mat(0xc48848, { map: woodCrateTex() }) });
  } else if (kind === "crate") {
    parts.push({ geo: new THREE.BoxGeometry(1.8, 1.6, 1.8), mat: n64Mat(0xc48848, { map: woodCrateTex() }) });
  } else if (kind === "moth") {
    const wing = new THREE.PlaneGeometry(2.4, 1.1);
    parts.push({
      geo: wing,
      mat: new THREE.MeshLambertMaterial({
        map: letterStoneTex(),
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        flatShading: true,
      }),
    });
  }
  geoCache.set(kind, parts);
  return parts;
}

function stamp(mesh: THREE.InstancedMesh, i: number, x: number, y: number, z: number, sx: number, sy: number, sz: number, ry: number, rx = 0, rz = 0) {
  _p.set(x, y, z);
  _e.set(rx, ry, rz);
  _q.setFromEuler(_e);
  _s.set(sx, sy, sz);
  _m.compose(_p, _q, _s);
  mesh.setMatrixAt(i, _m);
}

type Sit = (x: number, z: number) => number;

function pickCoastLand(i: number, seed: number, sit: Sit) {
  const z = 280 + hash01(i * 3.1 + seed) * 3600;
  const side = hash01(i * 7.7 + seed) > 0.5 ? 1 : -1;
  const x = riverX(z) + side * (46 + hash01(i * 2.2 + seed) * 110);
  const y0 = sit(x, z);
  if (y0 < 5.5) return null;
  return { x, y: y0, z, s: 0.65 + hash01(i + seed) * 1.15, ry: hash01(i * 5 + seed) * Math.PI * 2 };
}

function pickCoastFar(i: number, seed: number, sit: Sit) {
  const z = 200 + hash01(i * 4 + seed) * 3700;
  const side = i % 2 === 0 ? -1 : 1;
  const x = side * (220 + hash01(i * 9 + seed) * 120);
  const y0 = sit(x, z);
  return { x, y: y0, z, s: 0.9 + hash01(i + seed) * 1.4, ry: hash01(i * 5 + seed) * Math.PI * 2 };
}

function pickCoastWater(i: number, seed: number, sit: Sit) {
  const z = 400 + hash01(i * 2.8 + seed) * 3200;
  const x = riverX(z) + (hash01(i * 6 + seed) - 0.5) * 18;
  const y0 = sit(x, z);
  return { x, y: Math.max(0.8, y0 + 0.6), z, s: 0.8 + hash01(i + seed) * 0.7, ry: hash01(i * 3 + seed) * 0.4 };
}

function pickSlug(i: number, seed: number, sit: Sit) {
  const a = hash01(i * 1.7 + seed) * Math.PI * 2;
  const r = 40 + hash01(i * 4.2 + seed) * 280;
  const z = (hash01(i * 2.1 + seed) - 0.15) * 2800;
  const x = Math.cos(a) * r;
  const y0 = sit(x, z);
  if (y0 < 3) return null;
  return { x, y: y0, z, s: 0.7 + hash01(i + seed) * 1.2, ry: a };
}

function pickGutter(i: number, seed: number, sit: Sit) {
  const z = 180 + hash01(i * 3.4 + seed) * 2500;
  const x = (hash01(i * 8.1 + seed) - 0.5) * 220;
  const y0 = sit(x, z);
  if (Math.abs(x) < 18 && y0 < 5) return null;
  return { x, y: y0, z, s: 0.75 + hash01(i + seed) * 0.9, ry: hash01(i * 5 + seed) * Math.PI * 2 };
}

function pickIce(i: number, seed: number, sit: Sit) {
  const a = hash01(i * 2.2 + seed) * Math.PI * 2;
  const r = 90 + hash01(i * 5.1 + seed) * 260;
  const x = Math.cos(a) * r;
  const z = Math.sin(a) * r;
  if (Math.hypot(x, z) < 78) return null;
  const y0 = sit(x, z);
  return { x, y: y0, z, s: 0.6 + hash01(i + seed) * 1.6, ry: a };
}

function pickPress(i: number, seed: number, sit: Sit) {
  const z = 120 + hash01(i * 3.3 + seed) * 2400;
  const x = (hash01(i * 7.4 + seed) - 0.5) * 240;
  const y0 = sit(x, z);
  if (Math.abs(x) < 22 && z > 200) return null;
  return { x, y: y0, z, s: 0.8 + hash01(i + seed) * 1.1, ry: hash01(i * 4 + seed) * Math.PI * 2 };
}

function pickSorts(i: number, seed: number) {
  const z = 180 + hash01(i * 3.3 + seed) * 3400;
  const x = (hash01(i * 8.1 + seed) - 0.5) * 420;
  const y = (hash01(i * 5.7 + seed) - 0.5) * 180 + 48;
  if (Math.abs(x) < 90 && Math.abs(y - 48) < 56) return null;
  return { x, y, z, s: 0.7 + hash01(i * 2 + seed) * 2.4, ry: hash01(i * 4 + seed) * Math.PI * 2 };
}

function pickOf(missionId: string, kind: DressArchetype, i: number, sit: Sit) {
  const seed = kind.length * 13;
  if (missionId === "sorts") return pickSorts(i, seed);
  if (kind === "city-slab") {
    if (missionId === "coast") return pickCoastFar(i, seed, sit);
    if (missionId === "gutter") return pickGutter(i, seed + 1, sit);
    if (missionId === "press") return pickPress(i, seed + 2, sit);
    if (missionId === "slug") return pickSlug(i, seed + 3, sit);
  }
  if (kind === "barge") {
    if (missionId === "coast") return pickCoastWater(i, seed, sit);
    if (missionId === "gutter") return pickGutter(i, seed + 9, sit);
    if (missionId === "slug") return pickCoastWater(i, seed + 4, sit);
  }
  if (missionId === "coast") return pickCoastLand(i, seed, sit);
  if (missionId === "slug") return pickSlug(i, seed, sit);
  if (missionId === "gutter") return pickGutter(i, seed, sit);
  if (missionId === "ice") return pickIce(i, seed, sit);
  if (missionId === "press") return pickPress(i, seed, sit);
  return pickCoastLand(i, seed, sit);
}

export function scatterDressing(root: THREE.Group, biome: BiomeId, missionId: string) {
  const layers = DRESSING[missionId];
  if (!layers?.length) return;
  const g = new THREE.Group();
  g.name = "dressing";
  const sit: Sit = (x, z) => groundHeight(biome, x, z, missionId);
  let placed = 0;
  for (const layer of layers) {
    const parts = partsOf(layer.archetype);
    const meshes = parts.map((p) => {
      const mesh = new THREE.InstancedMesh(p.geo, p.mat, layer.count);
      mesh.name = `dressing-${layer.archetype}`;
      mesh.castShadow = layer.archetype !== "paper-scrap" && layer.archetype !== "moth";
      mesh.frustumCulled = true;
      mesh.userData.shared = true;
      return mesh;
    });
    let n = 0;
    for (let i = 0; n < layer.count && i < layer.count * 8; i++) {
      const p = pickOf(missionId, layer.archetype, i, sit);
      if (!p) continue;
      const rx = layer.archetype === "paper-scrap" || layer.archetype === "moth" ? hash01(i * 9) * 1.2 : 0;
      const rz = layer.archetype === "paper-scrap" ? hash01(i * 11) * 0.8 : 0;
      for (const mesh of meshes) stamp(mesh, n, p.x, p.y, p.z, p.s, p.s, p.s, p.ry, rx, rz);
      n += 1;
    }
    for (const mesh of meshes) {
      mesh.count = n;
      mesh.instanceMatrix.needsUpdate = true;
      g.add(mesh);
    }
    placed += n;
  }
  g.userData.dressCount = placed;
  root.add(g);
}
