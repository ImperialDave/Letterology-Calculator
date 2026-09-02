import * as THREE from "three";
import { ARENA_R, type Island } from "./sim";
import { BRASS, FOG, PAPER, RUST, ashTex, brassTex, grassLeadTex, iceGroundTex, iceWaterTex, inkWaterTex, leadTex, n64Mat, rustTex, slagWaterTex } from "./n64";

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
  sky: { id: "sky", fog: FOG, sky: 0x6aa8a0, water: 0x0e6a62, waterTex: inkWaterTex, ground: 0x2f8a3a, groundTex: grassLeadTex, metal: 0xe8d48a },
  coast: { id: "coast", fog: 0x7ab8c0, sky: 0x8ec8d4, water: 0x0e6a62, waterTex: inkWaterTex, ground: 0xc9b896, groundTex: leadTex, metal: 0xe8d48a },
  slug: { id: "slug", fog: 0x5a5048, sky: 0x3a3830, water: 0x2a1810, waterTex: slagWaterTex, ground: 0x5a6a74, groundTex: leadTex, metal: 0xe8d48a },
  gutter: { id: "gutter", fog: 0x3a6860, sky: 0x4a8078, water: 0x072a32, waterTex: inkWaterTex, ground: 0x6a4030, groundTex: ashTex, metal: 0xd45a4a },
  ice: { id: "ice", fog: 0xc8e4ec, sky: 0xd8f0f4, water: 0x7aa8b8, waterTex: iceWaterTex, ground: 0xe8f6fa, groundTex: iceGroundTex, metal: 0xe8d48a },
  press: { id: "press", fog: 0x6a3828, sky: 0x8a4830, water: 0x1a100c, waterTex: slagWaterTex, ground: 0x6a4030, groundTex: ashTex, metal: 0xd45a4a },
};

function arch(root: THREE.Group, x: number, z: number, h: number, mat: THREE.Material) {
  const col = new THREE.BoxGeometry(6, h, 8);
  const L = new THREE.Mesh(col, mat);
  const R = new THREE.Mesh(col, mat);
  L.position.set(x - 12, h * 0.5, z);
  R.position.set(x + 12, h * 0.5, z);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(32, 6, 10), mat);
  lintel.position.set(x, h + 2, z);
  root.add(L, R, lintel);
}

export function dressBiome(root: THREE.Group, kit: BiomeKit, islands: Island[]) {
  const ground = kit.groundTex();
  ground.repeat.set(8, 8);
  const metal = n64Mat(kit.metal, { map: kit.id === "press" || kit.id === "gutter" ? rustTex() : brassTex() });
  const dirt = n64Mat(kit.ground, { map: ground });
  const paper = n64Mat(PAPER, { map: leadTex() });

  for (const i of islands) {
    const geo = new THREE.CylinderGeometry(i.r * 0.22, i.r, i.h, i.arch ? 6 : 8);
    const mesh = new THREE.Mesh(geo, i.id === "press" ? metal : dirt);
    mesh.position.set(i.x, i.h * 0.5, i.z);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    root.add(mesh);
    if (i.arch) arch(root, i.x, i.z, i.h, paper);
    if (i.id === "press") {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(i.r * 1.1, 4, i.r * 0.7), metal);
      plate.position.set(i.x, i.h + 2, i.z);
      root.add(plate);
    }
  }

  if (kit.id === "coast") {
    for (let n = 0; n < 7; n++) arch(root, -90 + n * 28, 200 - n * 18, 36, paper);
    for (let n = 0; n < 6; n++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(18, 28 + (n % 3) * 10, 18), dirt);
      b.position.set(-140 + n * 22, 18, -40);
      b.castShadow = true;
      root.add(b);
    }
  }

  if (kit.id === "slug") {
    for (let n = 0; n < 14; n++) {
      const r = 8 + (n % 5) * 4;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(r * 0.45, 0), n64Mat(0x3a4248, { map: leadTex() }));
      const ang = n * 0.7;
      rock.position.set(Math.cos(ang) * 160, r * 0.4, Math.sin(ang) * 160);
      root.add(rock);
    }
  }

  if (kit.id === "gutter") {
    for (let n = 0; n < 5; n++) {
      const stack = new THREE.Mesh(new THREE.CylinderGeometry(8, 12, 70, 6), n64Mat(RUST));
      stack.position.set(-120 + n * 55, 35, -80);
      root.add(stack);
    }
    const tanker = new THREE.Mesh(new THREE.BoxGeometry(90, 16, 22), n64Mat(BRASS, { map: brassTex() }));
    tanker.position.set(40, 14, 120);
    root.add(tanker);
  }

  if (kit.id === "ice") {
    for (let n = 0; n < 4; n++) {
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(36, 40, 8, 8), n64Mat(0xd8e4e8, { map: brassTex() }));
      pad.position.set(Math.cos(n * 1.6) * 140, 4, Math.sin(n * 1.6) * 140);
      root.add(pad);
    }
    const barge = new THREE.Mesh(new THREE.BoxGeometry(70, 14, 24), n64Mat(PAPER, { map: leadTex() }));
    barge.position.set(-40, 18, 80);
    root.add(barge);
  }

  if (kit.id === "press") {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(120, 10, 6, 16), n64Mat(RUST));
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 8;
    root.add(rim);
    for (let n = 0; n < 4; n++) {
      const censer = new THREE.Mesh(new THREE.SphereGeometry(8, 6, 5), n64Mat(BRASS, { map: brassTex() }));
      censer.position.set(Math.cos(n * 1.57) * 90, 48, Math.sin(n * 1.57) * 90);
      root.add(censer);
    }
  }

  const fogRing = new THREE.Mesh(
    new THREE.RingGeometry(ARENA_R - 8, ARENA_R + 24, 48),
    new THREE.MeshBasicMaterial({ color: kit.fog, transparent: true, opacity: 0.35, side: THREE.DoubleSide }),
  );
  fogRing.rotation.x = -Math.PI / 2;
  fogRing.position.y = 2;
  root.add(fogRing);
}
