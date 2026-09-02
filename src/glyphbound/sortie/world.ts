import * as THREE from "three";
import { ARENA_R } from "./sim";
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

  dressBiome(root, kit);

  return { root, waterMap, fog: kit.fog, sky: kit.sky };
}

export function makeSky(color = 0x8eb0a0) {
  const g = new THREE.Group();
  const geo = new THREE.SphereGeometry(720, 20, 14);
  const cols = new Float32Array(geo.attributes.position.count * 3);
  const top = new THREE.Color(color);
  const horz = new THREE.Color(color).multiplyScalar(0.42);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 720;
    const t = Math.max(0, Math.min(1, y * 0.7 + 0.45));
    const c = horz.clone().lerp(top, t);
    cols[i * 3] = c.r;
    cols[i * 3 + 1] = c.g;
    cols[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false })));

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(28, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xfff0c4, fog: false }),
  );
  sun.position.set(220, 160, -280);
  g.add(sun);
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(42, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.22, fog: false, depthWrite: false }),
  );
  halo.position.copy(sun.position);
  g.add(halo);

  const cloud = cloudTex();
  cloud.repeat.set(1, 1);
  for (let i = 0; i < 11; i++) {
    const card = new THREE.Mesh(
      new THREE.PlaneGeometry(110 + (i % 3) * 30, 52 + (i % 2) * 16),
      new THREE.MeshBasicMaterial({ map: cloud, transparent: true, opacity: 0.42 + (i % 3) * 0.08, depthWrite: false, fog: false }),
    );
    const ang = i * 0.62;
    const r = 200 + (i % 4) * 40;
    card.position.set(Math.cos(ang) * r, 70 + (i % 5) * 22, Math.sin(ang) * r);
    card.lookAt(0, 40, 0);
    g.add(card);
  }
  return g;
}
