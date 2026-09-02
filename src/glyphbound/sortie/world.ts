import * as THREE from "three";
import { ARENA_R } from "./sim";
import { cloudTex, n64Mat } from "./n64";
import { BIOMES, dressBiome, type BiomeId } from "./terrain";

export function makeWorld(biome: BiomeId = "sky", missionId = biome) {
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

  if (missionId !== "ice" && missionId !== "sky") {
    const stripW = kit.waterTex();
    stripW.repeat.set(8, 40);
    const strip = new THREE.Mesh(
      new THREE.PlaneGeometry(260, 4200, 1, 1),
      n64Mat(kit.water, { map: stripW }),
    );
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(0, 0.15, 2100);
    strip.receiveShadow = true;
    root.add(strip);
  }

  dressBiome(root, kit, missionId);

  return { root, waterMap, fog: kit.fog, sky: kit.sky };
}

export function makeSky(color = 0x8ec8f0) {
  const g = new THREE.Group();
  const geo = new THREE.SphereGeometry(720, 20, 14);
  const cols = new Float32Array(geo.attributes.position.count * 3);
  const top = new THREE.Color(color);
  const horz = new THREE.Color(color).lerp(new THREE.Color(0xf4ffe8), 0.55);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 720;
    const t = Math.max(0, Math.min(1, y * 0.85 + 0.35));
    const c = horz.clone().lerp(top, t);
    cols[i * 3] = c.r;
    cols[i * 3 + 1] = c.g;
    cols[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false })));

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(34, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xfff8d0, fog: false }),
  );
  sun.position.set(240, 180, -260);
  g.add(sun);
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(52, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xffe8a0, transparent: true, opacity: 0.35, fog: false, depthWrite: false }),
  );
  halo.position.copy(sun.position);
  g.add(halo);

  const cloud = cloudTex();
  cloud.repeat.set(1, 1);
  for (let i = 0; i < 11; i++) {
    const card = new THREE.Mesh(
      new THREE.PlaneGeometry(120 + (i % 3) * 28, 56 + (i % 2) * 14),
      new THREE.MeshBasicMaterial({ map: cloud, transparent: true, opacity: 0.92, depthWrite: false, fog: false }),
    );
    const ang = i * 0.62;
    const r = 210 + (i % 4) * 36;
    card.position.set(Math.cos(ang) * r, 78 + (i % 5) * 20, Math.sin(ang) * r);
    card.lookAt(0, 40, 0);
    g.add(card);
  }
  return g;
}
