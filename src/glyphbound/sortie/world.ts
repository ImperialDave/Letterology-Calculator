import * as THREE from "three";
import { ARENA_R, ISLANDS } from "./sim";
import { cloudTex, n64Mat } from "./n64";
import { BIOMES, dressBiome, type BiomeId } from "./terrain";

export function makeWorld(biome: BiomeId = "sky") {
  const kit = BIOMES[biome] ?? BIOMES.sky;
  const root = new THREE.Group();
  root.name = "world";

  const waterMap = kit.waterTex();
  waterMap.repeat.set(18, 18);
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(ARENA_R + 40, 48),
    n64Mat(kit.water, { map: waterMap }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.2;
  water.receiveShadow = true;
  root.add(water);

  dressBiome(root, kit, ISLANDS);

  return { root, waterMap, fog: kit.fog, sky: kit.sky };
}

export function makeSky(color = 0x8eb0a0) {
  const g = new THREE.Group();
  const geo = new THREE.SphereGeometry(700, 16, 12);
  const mat = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide, fog: false });
  g.add(new THREE.Mesh(geo, mat));
  const cloud = cloudTex();
  cloud.repeat.set(1, 1);
  for (let i = 0; i < 5; i++) {
    const card = new THREE.Mesh(
      new THREE.PlaneGeometry(90, 48),
      new THREE.MeshBasicMaterial({ map: cloud, transparent: true, opacity: 0.55, depthWrite: false, fog: false }),
    );
    const ang = i * 1.25;
    card.position.set(Math.cos(ang) * 220, 90 + (i % 2) * 30, Math.sin(ang) * 220);
    card.lookAt(0, 40, 0);
    g.add(card);
  }
  return g;
}
