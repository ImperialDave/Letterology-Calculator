import * as THREE from "three";
import { groundHeight } from "./height";
import { landmarksFor, riverX, type Landmark } from "./landmarks";
import { FOG, PAPER, RUST, ashTex, brassTex, grassLeadTex, iceGroundTex, iceWaterTex, inkWaterTex, leadTex, n64Mat, rockTex, rustTex, slagWaterTex } from "./n64";

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
  const map = kit.groundTex().clone();
  map.repeat.set(22, 22);
  const mesh = new THREE.Mesh(geo, n64Mat(kit.ground, { map }));
  mesh.receiveShadow = true;
  return mesh;
}

function makeStrip(kit: BiomeKit, missionId: string) {
  const geo = new THREE.PlaneGeometry(420, 4200, 72, 120);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const cols = new Float32Array(pos.count * 3);
  const sand = new THREE.Color(0xf0dcb0);
  const grass = new THREE.Color(0x5ad848);
  const rock = new THREE.Color(0xb8a888);
  const dirt = new THREE.Color(kit.ground);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i) + 2100;
    const y = groundHeight(kit.id, x, z, missionId);
    pos.setY(i, y);
    let c = dirt;
    if (missionId === "coast") {
      const d = Math.abs(x - riverX(z));
      if (y < 3 || d < 22) c = sand;
      else if (y > 24) c = rock;
      else c = grass;
    }
    cols[i * 3] = c.r;
    cols[i * 3 + 1] = c.g;
    cols[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  geo.translate(0, 0, 2100);
  geo.computeVertexNormals();
  const paint = missionId === "coast";
  let mat: THREE.Material;
  if (paint) {
    mat = n64Mat(0xffffff, { vertexColors: true });
  } else {
    const map = kit.groundTex().clone();
    map.repeat.set(8, 48);
    mat = n64Mat(kit.ground, { map });
  }
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}

function hash01(n: number) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

function placeLandmark(root: THREE.Group, L: Landmark, kit: BiomeKit, biome: BiomeId, missionId: string) {
  const y0 = sit(biome, L.x, L.z, missionId);
  const metal = n64Mat(kit.metal, { map: kit.id === "press" || kit.id === "gutter" ? rustTex() : brassTex() });
  const paper = n64Mat(PAPER, { map: leadTex() });
  const dirt = n64Mat(kit.ground, { map: kit.groundTex() });
  const rock = n64Mat(0xc8b89a, { map: rockTex() });
  if (L.kind === "arch") {
    const moss = n64Mat(0x7a9a58, { map: rockTex() });
    const postL = new THREE.Mesh(new THREE.BoxGeometry(8, 22, 11), rock);
    const postR = new THREE.Mesh(new THREE.BoxGeometry(8, 22, 11), rock);
    postL.position.set(L.x - 16, y0 + 11, L.z);
    postR.position.set(L.x + 16, y0 + 11, L.z);
    postL.rotation.z = 0.08;
    postR.rotation.z = -0.08;
    const cap = new THREE.Mesh(new THREE.BoxGeometry(42, 9, 13), rock);
    cap.position.set(L.x, y0 + 24, L.z);
    cap.rotation.z = hash01(L.z) * 0.08 - 0.04;
    const inner = new THREE.Mesh(new THREE.BoxGeometry(28, 6, 8), moss);
    inner.position.set(L.x, y0 + 22, L.z);
    postL.castShadow = postR.castShadow = cap.castShadow = true;
    root.add(postL, postR, cap, inner);
    for (const s of [-16, 16]) {
      const foot = new THREE.Mesh(new THREE.DodecahedronGeometry(7.2, 0), rock);
      foot.position.set(L.x + s, y0 + 4.5, L.z + 1);
      foot.rotation.y = hash01(L.z + s) * 2;
      root.add(foot);
    }
    return;
  }
  if (L.kind === "gate") {
    const left = new THREE.Mesh(new THREE.BoxGeometry(22, L.h + 16, 22), rock);
    left.position.set(L.x - 16, y0 + (L.h + 16) * 0.42, L.z - 4);
    const right = new THREE.Mesh(new THREE.BoxGeometry(14, L.h * 0.7, 16), rock);
    right.position.set(L.x + 18, y0 + L.h * 0.28, L.z + 8);
    left.castShadow = right.castShadow = true;
    root.add(left, right);
    const mist = new THREE.Mesh(
      new THREE.SphereGeometry(7, 6, 5),
      new THREE.MeshBasicMaterial({ color: 0xd8fff8, transparent: true, opacity: 0.28, depthWrite: false }),
    );
    mist.position.set(L.x + 4, y0 + 8, L.z + 10);
    mist.scale.set(1.6, 0.7, 1.2);
    mist.name = "mist";
    root.add(mist);
    const fallMap = kit.waterTex().clone();
    fallMap.repeat.set(1, 3);
    for (const [dx, dz, w] of [
      [2, 6, 11],
      [5, 3, 8],
      [0, 8, 9],
      [-1, 10, 7],
    ] as const) {
      const fall = new THREE.Mesh(
        new THREE.PlaneGeometry(w, L.h + 6),
        new THREE.MeshBasicMaterial({
          map: fallMap,
          transparent: true,
          opacity: 0.7,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      fall.position.set(L.x + dx, y0 + L.h * 0.38, L.z + dz);
      fall.name = "fall";
      root.add(fall);
    }
    return;
  }
  if (L.kind === "tower") {
    const yaw = hash01(L.z + L.x) * 0.8 - 0.4;
    const face = L.x >= 0 ? -1 : 1;
    if (L.h > 50) {
      // Skyline C: spine + two arms opening toward the river.
      const spine = new THREE.Mesh(new THREE.BoxGeometry(7, L.h, 16), dirt);
      spine.position.set(L.x, y0 + L.h * 0.5, L.z);
      spine.rotation.y = yaw;
      const top = new THREE.Mesh(new THREE.BoxGeometry(18, 9, 16), paper);
      top.position.set(L.x + face * 8, y0 + L.h - 2, L.z);
      top.rotation.y = yaw;
      const bot = new THREE.Mesh(new THREE.BoxGeometry(15, 8, 16), dirt);
      bot.position.set(L.x + face * 6, y0 + 8, L.z);
      bot.rotation.y = yaw;
      spine.castShadow = top.castShadow = true;
      root.add(spine, top, bot);
      return;
    }
    const w = 11 + hash01(L.z) * 8;
    const d = 10 + hash01(L.x) * 7;
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, L.h, d), dirt);
    b.position.set(L.x, y0 + L.h * 0.5, L.z);
    b.rotation.y = yaw;
    b.castShadow = true;
    root.add(b);
    const win = n64Mat(0x3a5868, { emissive: 0x5ee0c0, glow: 0.18 });
    for (let row = 0; row < 3; row++) {
      const pane = new THREE.Mesh(new THREE.BoxGeometry(w * 0.18, 2.2, 0.4), win);
      pane.position.set(L.x, y0 + 6 + row * (L.h * 0.22), L.z + d * 0.52);
      pane.rotation.y = yaw;
      root.add(pane);
    }
    if (L.h > 36) {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(w * 0.6, 8, d * 0.6), paper);
      cap.position.set(L.x, y0 + L.h + 2, L.z);
      cap.rotation.y = yaw;
      root.add(cap);
    }
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 3.4, 6), metal);
    tank.position.set(L.x + w * 0.15, y0 + L.h + 6, L.z);
    root.add(tank);
    if (hash01(L.x * 3) > 0.55) {
      const annex = new THREE.Mesh(new THREE.BoxGeometry(w * 0.7, L.h * 0.45, d * 0.8), dirt);
      annex.position.set(L.x + Math.cos(yaw) * w * 0.7, y0 + L.h * 0.22, L.z + Math.sin(yaw) * w * 0.7);
      annex.rotation.y = yaw + 0.35;
      annex.castShadow = true;
      root.add(annex);
    }
    return;
  }
  if (L.kind === "highway") {
    const deck = new THREE.Mesh(new THREE.BoxGeometry(86, 3.2, 16), metal);
    deck.position.set(L.x, y0 + L.h, L.z);
    deck.castShadow = true;
    root.add(deck);
    for (const s of [-28, -10, 10, 28]) {
      const pier = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.8, L.h, 5), rock);
      pier.position.set(L.x + s, y0 + L.h * 0.5, L.z);
      root.add(pier);
    }
    const rail = new THREE.Mesh(new THREE.BoxGeometry(86, 0.7, 0.7), metal);
    rail.position.set(L.x, y0 + L.h + 2.4, L.z + 7);
    const rail2 = rail.clone();
    rail2.position.z = L.z - 7;
    root.add(rail, rail2);
    return;
  }
  if (L.kind === "tanker") {
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 70, 8, 1, true), metal);
    hull.rotation.x = Math.PI / 2;
    hull.position.set(L.x, y0 + 11, L.z);
    root.add(hull);
    for (const s of [-34, 34]) {
      const lip = new THREE.Mesh(new THREE.TorusGeometry(9.2, 1.1, 6, 10), metal);
      lip.position.set(L.x, y0 + 11, L.z + s);
      root.add(lip);
    }
    return;
  }
  if (L.kind === "stack") {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(7, 11, L.h, 6), n64Mat(RUST));
    b.position.set(L.x, y0 + L.h * 0.5, L.z);
    root.add(b);
    const smoke = new THREE.Mesh(
      new THREE.SphereGeometry(5, 5, 4),
      new THREE.MeshBasicMaterial({ color: 0xc9b896, transparent: true, opacity: 0.35 }),
    );
    smoke.position.set(L.x, y0 + L.h + 8, L.z);
    smoke.scale.set(1.4, 0.8, 1.4);
    root.add(smoke);
    return;
  }
  if (L.kind === "hangar") {
    const b = new THREE.Mesh(new THREE.BoxGeometry(36, L.h, 28), paper);
    b.position.set(L.x, y0 + L.h * 0.5, L.z);
    b.lookAt(0, y0 + L.h * 0.5, 0);
    root.add(b);
    return;
  }
  if (L.kind === "censer") {
    const b = new THREE.Mesh(new THREE.SphereGeometry(8, 6, 5), metal);
    b.position.set(L.x, y0 + L.h, L.z);
    root.add(b);
    return;
  }
  if (L.kind === "pad") {
    const disk = new THREE.Mesh(new THREE.CylinderGeometry(L.r * 0.55, L.r * 0.62, 3.2, 16), metal);
    disk.position.set(L.x, y0 + 1.4, L.z);
    disk.receiveShadow = true;
    root.add(disk);
    return;
  }
  if (L.kind === "slug" || L.kind === "rock") {
    const b = new THREE.Mesh(new THREE.DodecahedronGeometry(L.r * 0.45, 0), rock);
    b.position.set(L.x, y0 + L.h * 0.35, L.z);
    b.rotation.set(hash01(L.x) * 1.2, hash01(L.z) * 2, 0);
    b.castShadow = true;
    root.add(b);
  }
}

function scatterTrees(root: THREE.Group, kit: BiomeKit, missionId: string) {
  const grass = n64Mat(0x5ad848, { map: kit.groundTex() });
  const trunk = n64Mat(0x8a6a40);
  for (let i = 0; i < 70; i++) {
    const z = 900 + hash01(i * 3.1) * 2900;
    const side = hash01(i * 7.7) > 0.5 ? 1 : -1;
    const x = riverX(z) + side * (48 + hash01(i * 2.2) * 90);
    const y0 = sit(kit.id, x, z, missionId);
    if (y0 < 6) continue;
    const s = 0.7 + hash01(i) * 1.1;
    const tree = new THREE.Group();
    tree.name = "tree";
    tree.position.set(x, y0, z);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.5 * s, 0.7 * s, 4 * s, 4), trunk);
    stem.position.y = 2 * s;
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(3.4 * s, 6.2 * s, 5), grass);
    leaf.position.y = 5.6 * s;
    const leaf2 = new THREE.Mesh(new THREE.ConeGeometry(2.4 * s, 4.4 * s, 5), grass);
    leaf2.position.y = 8.4 * s;
    tree.add(stem, leaf, leaf2);
    tree.userData.phase = hash01(i * 9);
    root.add(tree);
  }
}

function farRidges(root: THREE.Group, kit: BiomeKit, missionId: string) {
  const rock = n64Mat(0xb8a888, { map: rockTex() });
  for (let i = 0; i < 6; i++) {
    const z = 400 + i * 620 + hash01(i * 4) * 80;
    const x = (i % 2 === 0 ? -1 : 1) * (280 + hash01(i * 9) * 90);
    const h = 48 + hash01(i * 2) * 56;
    const ridge = new THREE.Mesh(new THREE.DodecahedronGeometry(20 + hash01(i) * 14, 0), rock);
    ridge.position.set(x, sit(kit.id, x, z, missionId) + h * 0.22, z);
    ridge.scale.set(1.8 + hash01(i * 3), h / 20, 1.2);
    ridge.rotation.y = hash01(i * 5) * 2;
    root.add(ridge);
  }
}

export function dressBiome(root: THREE.Group, kit: BiomeKit, missionId = kit.id) {
  const biome = kit.id;
  root.add(makeSheet(kit, missionId));
  if (missionId !== "ice" && missionId !== "sky") root.add(makeStrip(kit, missionId));
  for (const L of landmarksFor(missionId)) placeLandmark(root, L, kit, biome, missionId);
  if (missionId === "coast" || missionId === "slug") scatterTrees(root, kit, missionId);
  if (missionId !== "sky") farRidges(root, kit, missionId);
}
