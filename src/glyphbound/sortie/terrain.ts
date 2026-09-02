import * as THREE from "three";
import { groundHeight } from "./height";
import { landmarksFor, type Landmark } from "./landmarks";
import { BRASS, FOG, PAPER, RUST, ashTex, brassTex, grassLeadTex, iceGroundTex, iceWaterTex, inkWaterTex, leadTex, n64Mat, rustTex, slagWaterTex } from "./n64";

const ARENA_R = 420;

export type BiomeId = "sky" | "coast" | "slug" | "gutter" | "ice" | "press";

export interface BiomeKit {
  id: BiomeId;
  fog: number;
  sky: number;
  water: number;
  waterTex: () => THREE.Texture;
  ground: number;
  groundTex: () => THREE.Texture;
  metal: number;
}

export const BIOMES: Record<BiomeId, BiomeKit> = {
  sky: { id: "sky", fog: FOG, sky: 0x7ad4f0, water: 0x4ae8dc, waterTex: inkWaterTex, ground: 0x6ae050, groundTex: grassLeadTex, metal: 0xffe08a },
  coast: { id: "coast", fog: 0xc8eef8, sky: 0x88d8f8, water: 0x48e0d8, waterTex: inkWaterTex, ground: 0xf0dcb0, groundTex: leadTex, metal: 0xffe08a },
  slug: { id: "slug", fog: 0xe8d0a8, sky: 0xf0c878, water: 0xe88850, waterTex: slagWaterTex, ground: 0xd8c090, groundTex: leadTex, metal: 0xffe08a },
  gutter: { id: "gutter", fog: 0xf0c8a0, sky: 0xf0a868, water: 0x48d0c8, waterTex: inkWaterTex, ground: 0xe8a070, groundTex: ashTex, metal: 0xff8060 },
  ice: { id: "ice", fog: 0xe0f4fc, sky: 0xd8f4ff, water: 0xa8e0f0, waterTex: iceWaterTex, ground: 0xf4ffff, groundTex: iceGroundTex, metal: 0xffe08a },
  press: { id: "press", fog: 0xf0c090, sky: 0xf0a060, water: 0xe07848, waterTex: slagWaterTex, ground: 0xe89860, groundTex: ashTex, metal: 0xff8060 },
};

function sit(biome: BiomeId, x: number, z: number, missionId?: string) {
  return groundHeight(biome, x, z, missionId);
}

function arch(root: THREE.Group, x: number, z: number, h: number, mat: THREE.Material, biome: BiomeId, missionId?: string) {
  const y0 = sit(biome, x, z, missionId);
  const col = new THREE.BoxGeometry(7, h, 9);
  const L = new THREE.Mesh(col, mat);
  const R = new THREE.Mesh(col, mat);
  L.position.set(x - 14, y0 + h * 0.5, z);
  R.position.set(x + 14, y0 + h * 0.5, z);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(36, 7, 11), mat);
  lintel.position.set(x, y0 + h + 3, z);
  L.castShadow = R.castShadow = lintel.castShadow = true;
  root.add(L, R, lintel);
}

function makeSheet(kit: BiomeKit, missionId?: string) {
  const segs = 88;
  const size = (ARENA_R + 36) * 2;
  const geo = new THREE.PlaneGeometry(size, size, segs, segs);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, groundHeight(kit.id, pos.getX(i), pos.getZ(i), missionId));
  }
  geo.computeVertexNormals();
  const map = kit.groundTex();
  map.repeat.set(22, 22);
  const mesh = new THREE.Mesh(geo, n64Mat(kit.ground, { map }));
  mesh.receiveShadow = true;
  return mesh;
}

function makeStrip(kit: BiomeKit, missionId: string) {
  const geo = new THREE.PlaneGeometry(280, 4200, 24, 96);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, groundHeight(kit.id, pos.getX(i), pos.getZ(i) + 2100, missionId));
  }
  geo.translate(0, 0, 2100);
  geo.computeVertexNormals();
  const map = kit.groundTex();
  map.repeat.set(8, 48);
  const mesh = new THREE.Mesh(geo, n64Mat(kit.ground, { map }));
  mesh.receiveShadow = true;
  return mesh;
}

function placeLandmark(root: THREE.Group, L: Landmark, kit: BiomeKit, biome: BiomeId, missionId: string) {
  const y0 = sit(biome, L.x, L.z, missionId);
  const metal = n64Mat(kit.metal, { map: kit.id === "press" || kit.id === "gutter" ? rustTex() : brassTex() });
  const paper = n64Mat(PAPER, { map: leadTex() });
  const dirt = n64Mat(kit.ground, { map: kit.groundTex() });
  if (L.kind === "arch" || L.kind === "gate") {
    arch(root, L.x, L.z, L.h, paper, biome, missionId);
    return;
  }
  if (L.kind === "tower") {
    const b = new THREE.Mesh(new THREE.BoxGeometry(14, L.h, 14), dirt);
    b.position.set(L.x, y0 + L.h * 0.5, L.z);
    b.castShadow = true;
    root.add(b);
    return;
  }
  if (L.kind === "highway") {
    const b = new THREE.Mesh(new THREE.BoxGeometry(90, 4, 18), metal);
    b.position.set(L.x, y0 + L.h, L.z);
    b.castShadow = true;
    root.add(b);
    return;
  }
  if (L.kind === "tanker") {
    const b = new THREE.Mesh(new THREE.BoxGeometry(90, 16, 22), metal);
    b.position.set(L.x, y0 + 10, L.z);
    root.add(b);
    return;
  }
  if (L.kind === "stack") {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(8, 12, L.h, 6), n64Mat(RUST));
    b.position.set(L.x, y0 + L.h * 0.5, L.z);
    root.add(b);
    return;
  }
  if (L.kind === "hangar") {
    const b = new THREE.Mesh(new THREE.BoxGeometry(36, L.h, 28), paper);
    b.position.set(L.x, y0 + L.h * 0.5, L.z);
    root.add(b);
    return;
  }
  if (L.kind === "censer") {
    const b = new THREE.Mesh(new THREE.SphereGeometry(8, 6, 5), metal);
    b.position.set(L.x, y0 + L.h, L.z);
    root.add(b);
    return;
  }
  if (L.kind === "slug" || L.kind === "rock") {
    const b = new THREE.Mesh(new THREE.DodecahedronGeometry(L.r * 0.45, 0), n64Mat(0x8a9aa8, { map: leadTex() }));
    b.position.set(L.x, y0 + L.h * 0.35, L.z);
    b.castShadow = true;
    root.add(b);
  }
}

export function dressBiome(root: THREE.Group, kit: BiomeKit, missionId = kit.id) {
  const biome = kit.id;
  root.add(makeSheet(kit, missionId));
  if (missionId !== "ice" && missionId !== "sky") root.add(makeStrip(kit, missionId));
  const metal = n64Mat(kit.metal, { map: kit.id === "press" || kit.id === "gutter" ? rustTex() : brassTex() });
  for (const L of landmarksFor(missionId)) placeLandmark(root, L, kit, biome, missionId);

  for (let n = 0; n < 10; n++) {
    const a = n * 0.63;
    const x = Math.cos(a) * (ARENA_R - 36);
    const z = Math.sin(a) * (ARENA_R - 36);
    const h = 28 + (n % 5) * 18;
    const spire = new THREE.Mesh(new THREE.ConeGeometry(8 + (n % 3) * 4, h, 5), metal);
    spire.position.set(x, sit(biome, x, z, missionId) + h * 0.45, z);
    spire.castShadow = true;
    root.add(spire);
  }

  const fogRing = new THREE.Mesh(
    new THREE.RingGeometry(ARENA_R - 8, ARENA_R + 24, 48),
    new THREE.MeshBasicMaterial({ color: kit.fog, transparent: true, opacity: 0.35, side: THREE.DoubleSide }),
  );
  fogRing.rotation.x = -Math.PI / 2;
  fogRing.position.y = 2;
  root.add(fogRing);
}
