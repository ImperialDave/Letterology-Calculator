import * as THREE from "three";
import { BRASS, INK, OLIVE, RUST, n64Mat, scaleOliveTex } from "./n64";
import type { EnemyKind } from "./sim";

let scaleMap: THREE.Texture | null = null;
function skinMat() {
  if (!scaleMap) scaleMap = scaleOliveTex();
  return n64Mat(OLIVE, { map: scaleMap });
}

function lizardCore(scale: number, wingSpan: number, fat: number) {
  const g = new THREE.Group();
  const skin = skinMat();
  const brass = n64Mat(BRASS);
  const rust = n64Mat(RUST);

  const body = new THREE.Mesh(new THREE.ConeGeometry(0.42 * fat, 1.8, 6), skin);
  body.rotation.x = Math.PI / 2;
  body.castShadow = true;
  g.add(body);

  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.38 * fat, 6, 5), skin);
  chest.position.z = 0.55;
  chest.scale.set(1, 0.7, 1.1);
  g.add(chest);

  const head = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.7, 5), skin);
  head.rotation.x = -Math.PI / 2;
  head.position.z = 1.05;
  g.add(head);

  const frill = new THREE.Mesh(new THREE.CircleGeometry(0.55, 6), rust);
  frill.position.set(0, 0.12, 0.92);
  frill.rotation.y = Math.PI;
  g.add(frill);

  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.07, 5, 4), n64Mat(INK, { emissive: INK }));
  const eyeR = eyeL.clone();
  eyeL.position.set(-0.14, 0.1, 1.18);
  eyeR.position.set(0.14, 0.1, 1.18);
  g.add(eyeL, eyeR);

  const wingGeo = new THREE.BoxGeometry(wingSpan, 0.04, 0.7);
  const wL = new THREE.Mesh(wingGeo, brass);
  const wR = new THREE.Mesh(wingGeo, brass);
  wL.position.set(-wingSpan * 0.45, 0.08, 0.1);
  wR.position.set(wingSpan * 0.45, 0.08, 0.1);
  wL.rotation.z = 0.35;
  wR.rotation.z = -0.35;
  g.add(wL, wR);

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.12, 1.1, 4), rust);
  tail.rotation.x = Math.PI / 2;
  tail.position.z = -1.15;
  g.add(tail);

  g.scale.setScalar(scale);
  g.rotation.y = Math.PI;
  return g;
}

export function makeLizard(kind: EnemyKind) {
  if (kind === "bomber") return lizardCore(1.55, 2.4, 1.35);
  if (kind === "cork") return lizardCore(1.25, 1.6, 0.9);
  if (kind === "ace") return lizardCore(1.4, 2.1, 0.85);
  if (kind === "mech") {
    const g = lizardCore(2.2, 1.2, 1.6);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.4, 0.25), n64Mat(BRASS));
    const lL = leg.clone();
    const lR = leg.clone();
    lL.position.set(-0.45, -0.9, 0.2);
    lR.position.set(0.45, -0.9, 0.2);
    g.add(lL, lR);
    return g;
  }
  if (kind === "mothership") {
    const g = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(6.4, 1.2, 3.2), skinMat());
    hull.castShadow = true;
    g.add(hull);
    const frill = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.2, 0.6), n64Mat(RUST));
    frill.position.y = 0.7;
    g.add(frill);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 5), n64Mat(INK, { emissive: INK }));
    eye.position.set(0, 0.2, 1.8);
    g.add(eye);
    return g;
  }
  if (kind === "turret") {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 0.6, 6), skinMat()));
    const neck = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.9, 5), n64Mat(RUST));
    neck.position.y = 0.6;
    g.add(neck);
    return g;
  }
  return lizardCore(1.2, 1.85, 1);
}
