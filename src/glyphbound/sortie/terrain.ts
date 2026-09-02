import * as THREE from "three";
import { groundHeight } from "./height";
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
  sky: { id: "sky", fog: FOG, sky: 0x6aa8a0, water: 0x0e6a62, waterTex: inkWaterTex, ground: 0x2f8a3a, groundTex: grassLeadTex, metal: 0xe8d48a },
  coast: { id: "coast", fog: 0x7ab8c0, sky: 0x8ec8d4, water: 0x0e6a62, waterTex: inkWaterTex, ground: 0xc9b896, groundTex: leadTex, metal: 0xe8d48a },
  slug: { id: "slug", fog: 0x5a5048, sky: 0x3a3830, water: 0x2a1810, waterTex: slagWaterTex, ground: 0x5a6a74, groundTex: leadTex, metal: 0xe8d48a },
  gutter: { id: "gutter", fog: 0x3a6860, sky: 0x4a8078, water: 0x072a32, waterTex: inkWaterTex, ground: 0x6a4030, groundTex: ashTex, metal: 0xd45a4a },
  ice: { id: "ice", fog: 0xc8e4ec, sky: 0xd8f0f4, water: 0x7aa8b8, waterTex: iceWaterTex, ground: 0xe8f6fa, groundTex: iceGroundTex, metal: 0xe8d48a },
  press: { id: "press", fog: 0x6a3828, sky: 0x8a4830, water: 0x1a100c, waterTex: slagWaterTex, ground: 0x6a4030, groundTex: ashTex, metal: 0xd45a4a },
};

function sit(biome: BiomeId, x: number, z: number) {
  return groundHeight(biome, x, z);
}

function arch(root: THREE.Group, x: number, z: number, h: number, mat: THREE.Material, biome: BiomeId) {
  const y0 = sit(biome, x, z);
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

function makeSheet(kit: BiomeKit) {
  const segs = 88;
  const size = (ARENA_R + 36) * 2;
  const geo = new THREE.PlaneGeometry(size, size, segs, segs);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, groundHeight(kit.id, pos.getX(i), pos.getZ(i)));
  }
  geo.computeVertexNormals();
  const map = kit.groundTex();
  map.repeat.set(22, 22);
  const mesh = new THREE.Mesh(geo, n64Mat(kit.ground, { map }));
  mesh.receiveShadow = true;
  return mesh;
}

export function dressBiome(root: THREE.Group, kit: BiomeKit) {
  const biome = kit.id;
  root.add(makeSheet(kit));
  const metal = n64Mat(kit.metal, { map: kit.id === "press" || kit.id === "gutter" ? rustTex() : brassTex() });
  const dirt = n64Mat(kit.ground, { map: kit.groundTex() });
  const paper = n64Mat(PAPER, { map: leadTex() });

  if (kit.id === "coast" || kit.id === "sky") {
    for (let n = 0; n < 7; n++) arch(root, -70 + n * 22, 210 - n * 22, 32, paper, biome);
    for (let n = 0; n < 10; n++) {
      const x = -130 + (n % 5) * 28;
      const z = -30 - Math.floor(n / 5) * 36;
      const h = 22 + (n % 4) * 12;
      const b = new THREE.Mesh(new THREE.BoxGeometry(16, h, 16), dirt);
      b.position.set(x, sit(biome, x, z) + h * 0.5, z);
      b.castShadow = true;
      root.add(b);
    }
    const press = new THREE.Mesh(new THREE.BoxGeometry(70, 8, 48), metal);
    press.position.set(0, sit(biome, 0, -180) + 6, -180);
    root.add(press);
  }

  if (kit.id === "slug") {
    for (let n = 0; n < 16; n++) {
      const a = n * 0.62;
      const x = Math.cos(a) * 150;
      const z = Math.sin(a) * 150;
      const r = 10 + (n % 5) * 5;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(r * 0.5, 0), n64Mat(0x3a4248, { map: leadTex() }));
      rock.position.set(x, sit(biome, x, z) + r * 0.35, z);
      rock.castShadow = true;
      root.add(rock);
    }
  }

  if (kit.id === "gutter") {
    for (let n = 0; n < 5; n++) {
      const x = -120 + n * 55;
      const z = -80;
      const stack = new THREE.Mesh(new THREE.CylinderGeometry(8, 12, 70, 6), n64Mat(RUST));
      stack.position.set(x, sit(biome, x, z) + 35, z);
      root.add(stack);
    }
    const tanker = new THREE.Mesh(new THREE.BoxGeometry(90, 16, 22), n64Mat(BRASS, { map: brassTex() }));
    tanker.position.set(40, sit(biome, 40, 120) + 10, 120);
    root.add(tanker);
  }

  if (kit.id === "ice") {
    const barge = new THREE.Mesh(new THREE.BoxGeometry(70, 14, 24), n64Mat(PAPER, { map: leadTex() }));
    barge.position.set(-40, sit(biome, -40, 80) + 10, 80);
    root.add(barge);
  }

  if (kit.id === "press") {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(120, 10, 6, 16), n64Mat(RUST));
    rim.rotation.x = Math.PI / 2;
    rim.position.y = sit(biome, 0, 0) + 6;
    root.add(rim);
    for (let n = 0; n < 4; n++) {
      const x = Math.cos(n * 1.57) * 90;
      const z = Math.sin(n * 1.57) * 90;
      const censer = new THREE.Mesh(new THREE.SphereGeometry(8, 6, 5), n64Mat(BRASS, { map: brassTex() }));
      censer.position.set(x, sit(biome, x, z) + 36, z);
      root.add(censer);
    }
  }

  for (let n = 0; n < 10; n++) {
    const a = n * 0.63;
    const x = Math.cos(a) * (ARENA_R - 36);
    const z = Math.sin(a) * (ARENA_R - 36);
    const h = 28 + (n % 5) * 18;
    const spire = new THREE.Mesh(new THREE.ConeGeometry(8 + (n % 3) * 4, h, 5), metal);
    spire.position.set(x, sit(biome, x, z) + h * 0.45, z);
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
