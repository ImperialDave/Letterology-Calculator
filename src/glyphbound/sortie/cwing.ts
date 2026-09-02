import * as THREE from "three";
import { brassTex, INK, n64Mat } from "./n64";

export function makeCWing() {
  const g = new THREE.Group();
  g.name = "cwing";

  const shape = new THREE.Shape();
  const s = 1.15;
  shape.absarc(0, 0, 1.15 * s, 0.55, Math.PI * 2 - 0.55, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, 0.72 * s, 0.55, Math.PI * 2 - 0.55, true);
  shape.holes.push(hole);

  const body = new THREE.ExtrudeGeometry(shape, { depth: 0.42, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 1, steps: 1 });
  body.rotateY(Math.PI / 2);
  body.center();
  const brass = n64Mat(0xc9a45a, { map: brassTex() });
  const mesh = new THREE.Mesh(body, brass);
  mesh.castShadow = true;
  g.add(mesh);

  const fuselage = new THREE.BoxGeometry(1.6, 0.28, 0.38);
  const core = new THREE.Mesh(fuselage, n64Mat(0x2a323c, { emissive: INK }));
  core.position.set(0.15, 0, 0);
  g.add(core);

  const wing = new THREE.BoxGeometry(0.2, 0.08, 1.8);
  const wL = new THREE.Mesh(wing, brass);
  const wR = new THREE.Mesh(wing, brass);
  wL.position.set(0.1, 0.05, 0.95);
  wR.position.set(0.1, 0.05, -0.95);
  wL.rotation.x = 0.12;
  wR.rotation.x = -0.12;
  g.add(wL, wR);

  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), n64Mat(INK, { emissive: INK }));
  glow.position.set(-1.05, 0, 0);
  g.add(glow);
  g.scale.setScalar(1.35);
  return g;
}
