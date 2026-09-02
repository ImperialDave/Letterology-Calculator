import * as THREE from "three";
import { ARENA_R, ISLANDS } from "./sim";
import { FOG, grassLeadTex, inkWaterTex, leadTex, n64Mat, PAPER } from "./n64";

export function makeWorld() {
  const root = new THREE.Group();
  root.name = "world";

  const waterMap = inkWaterTex();
  waterMap.repeat.set(18, 18);
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(ARENA_R + 40, 48),
    n64Mat(0x1a4038, { map: waterMap }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.2;
  water.receiveShadow = true;
  root.add(water);

  const lead = leadTex();
  lead.repeat.set(6, 6);
  const grass = grassLeadTex();
  grass.repeat.set(8, 8);

  for (const i of ISLANDS) {
    const geo = new THREE.CylinderGeometry(i.r * 0.2, i.r, i.h, i.arch ? 6 : 8);
    const mesh = new THREE.Mesh(geo, n64Mat(i.id === "press" ? 0x4a4030 : 0x3d6a44, { map: i.id === "press" ? lead : grass }));
    mesh.position.set(i.x, i.h * 0.5, i.z);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    mesh.userData.island = i.id;
    root.add(mesh);

    if (i.id === "press") {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(i.r * 1.1, 4, i.r * 0.7), n64Mat(0x6a5428, { map: lead }));
      plate.position.set(i.x, i.h + 2, i.z);
      root.add(plate);
    }
    if (i.arch) {
      const t = n64Mat(PAPER, { map: lead });
      const col = new THREE.BoxGeometry(6, i.h, 8);
      const L = new THREE.Mesh(col, t);
      const R = new THREE.Mesh(col, t);
      L.position.set(i.x - 12, i.h * 0.5, i.z);
      R.position.set(i.x + 12, i.h * 0.5, i.z);
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(32, 6, 10), t);
      lintel.position.set(i.x, i.h + 2, i.z);
      root.add(L, R, lintel);
    }
  }

  const fogRing = new THREE.Mesh(
    new THREE.RingGeometry(ARENA_R - 8, ARENA_R + 24, 48),
    new THREE.MeshBasicMaterial({ color: FOG, transparent: true, opacity: 0.35, side: THREE.DoubleSide }),
  );
  fogRing.rotation.x = -Math.PI / 2;
  fogRing.position.y = 2;
  root.add(fogRing);

  return { root, waterMap };
}

export function makeSky() {
  const geo = new THREE.SphereGeometry(700, 16, 12);
  const mat = new THREE.MeshBasicMaterial({ color: 0x8eb0a0, side: THREE.BackSide, fog: false });
  return new THREE.Mesh(geo, mat);
}
