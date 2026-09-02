import * as THREE from "three";
import { brassTex, hullTex, INK, n64Mat } from "./n64";
import type { SortieState } from "./sim";

export function makeCWing() {
  const g = new THREE.Group();
  g.name = "cwing";
  const brass = n64Mat(0xe8d48a, { map: brassTex() });
  const hull = n64Mat(0xc9a45a, { map: hullTex() });
  const ink = n64Mat(INK, { emissive: INK, glow: 0.9 });

  const shape = new THREE.Shape();
  const s = 1.22;
  shape.absarc(0, 0, 1.18 * s, 0.48, Math.PI * 2 - 0.48, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, 0.68 * s, 0.48, Math.PI * 2 - 0.48, true);
  shape.holes.push(hole);
  const body = new THREE.ExtrudeGeometry(shape, {
    depth: 0.5,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.06,
    bevelSegments: 1,
    steps: 1,
  });
  body.rotateY(Math.PI / 2);
  body.center();
  const letter = new THREE.Mesh(body, hull);
  letter.castShadow = true;
  letter.name = "letter";
  g.add(letter);

  const core = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.36, 0.46), n64Mat(0x1a2428, { emissive: INK, glow: 0.25 }));
  core.position.set(0.25, 0, 0);
  g.add(core);

  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.28, 6, 5, 0, Math.PI * 2, 0, Math.PI * 0.55), n64Mat(0x5ee0c0, { emissive: INK, glow: 0.4 }));
  canopy.position.set(0.55, 0.22, 0);
  canopy.scale.set(1.4, 0.7, 0.8);
  g.add(canopy);

  const wingGeo = new THREE.BoxGeometry(0.28, 0.07, 2.4);
  const wL = new THREE.Mesh(wingGeo, brass);
  const wR = new THREE.Mesh(wingGeo, brass);
  wL.name = "wingL";
  wR.name = "wingR";
  wL.position.set(0.05, 0.04, 1.22);
  wR.position.set(0.05, 0.04, -1.22);
  wL.rotation.x = 0.14;
  wR.rotation.x = -0.14;
  g.add(wL, wR);

  const tipL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.16), ink);
  const tipR = tipL.clone();
  tipL.position.set(0.15, 0.08, 2.35);
  tipR.position.set(0.15, 0.08, -2.35);
  g.add(tipL, tipR);

  const gun = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.08), ink);
  const gL = gun.clone();
  const gR = gun.clone();
  gL.name = "gunL";
  gR.name = "gunR";
  gL.position.set(0.95, -0.04, 0.32);
  gR.position.set(0.95, -0.04, -0.32);
  g.add(gL, gR);

  const engine = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 6), n64Mat(INK, { emissive: INK, glow: 1.2 }));
  engine.rotation.z = Math.PI / 2;
  engine.position.set(-1.35, 0, 0);
  engine.name = "engine";
  g.add(engine);

  const trail = new THREE.Mesh(
    new THREE.ConeGeometry(0.16, 1.4, 5),
    new THREE.MeshBasicMaterial({ color: 0x9af8de, transparent: true, opacity: 0.55 }),
  );
  trail.rotation.z = -Math.PI / 2;
  trail.position.set(-2.1, 0, 0);
  trail.name = "trail";
  g.add(trail);

  g.scale.setScalar(1.42);
  g.userData.wingL = wL;
  g.userData.wingR = wR;
  g.userData.engine = engine;
  g.userData.trail = trail;
  g.userData.gunL = gL;
  g.userData.gunR = gR;
  return g;
}

export function poseCWing(g: THREE.Group, s: SortieState) {
  const boost = s.speed > 70;
  const eng = g.userData.engine as THREE.Mesh;
  const trail = g.userData.trail as THREE.Mesh;
  const wL = g.userData.wingL as THREE.Mesh;
  const wR = g.userData.wingR as THREE.Mesh;
  const pulse = 1 + Math.sin(s.t * 18) * 0.08;
  if (eng) {
    eng.scale.setScalar((boost ? 1.35 : 1) * pulse);
    const mat = eng.material as THREE.MeshLambertMaterial;
    mat.emissiveIntensity = boost ? 1.6 : 0.9;
  }
  if (trail) {
    trail.scale.set(boost ? 1.4 : 0.8, boost ? 1.8 : 1, boost ? 1.4 : 0.8);
    const mat = trail.material as THREE.MeshBasicMaterial;
    mat.opacity = boost ? 0.7 : 0.28 + s.speed / 400;
    mat.color.setHex(s.barrel > 0 ? 0xe8d48a : 0x9af8de);
  }
  if (wL && wR) {
    const flex = s.roll * 0.35;
    wL.rotation.z = flex;
    wR.rotation.z = flex;
    wL.rotation.x = 0.14 + Math.abs(s.roll) * 0.08;
    wR.rotation.x = -0.14 - Math.abs(s.roll) * 0.08;
  }
  if (s.flash > 0) {
    const gunL = g.userData.gunL as THREE.Mesh;
    const gunR = g.userData.gunR as THREE.Mesh;
    const glow = 0.4 + s.flash * 4;
    for (const gun of [gunL, gunR]) {
      if (!gun) continue;
      const mat = gun.material as THREE.MeshLambertMaterial;
      mat.emissiveIntensity = glow;
    }
  }
}
