import * as THREE from "three";
import { n64Mat, PAPER, RUST } from "./n64";

function shape1() {
  const s = new THREE.Shape();
  s.moveTo(-0.18, -0.95);
  s.lineTo(0.22, -0.95);
  s.lineTo(0.22, 0.55);
  s.lineTo(0.48, 0.55);
  s.lineTo(0.48, 0.9);
  s.lineTo(-0.42, 0.9);
  s.lineTo(-0.42, 0.55);
  s.lineTo(-0.18, 0.55);
  s.lineTo(-0.18, -0.95);
  return s;
}

function shape0() {
  const s = new THREE.Shape();
  s.absellipse(0, 0, 0.62, 0.92, 0, Math.PI * 2, false);
  const h = new THREE.Path();
  h.absellipse(0, 0, 0.32, 0.55, 0, Math.PI * 2, true);
  s.holes.push(h);
  return s;
}

function shape2() {
  const s = new THREE.Shape();
  s.moveTo(-0.55, 0.72);
  s.lineTo(-0.55, 0.95);
  s.lineTo(0.55, 0.95);
  s.lineTo(0.55, 0.15);
  s.lineTo(-0.18, 0.15);
  s.lineTo(-0.18, -0.55);
  s.lineTo(0.55, -0.55);
  s.lineTo(0.55, -0.95);
  s.lineTo(-0.55, -0.95);
  s.lineTo(-0.55, -0.35);
  s.lineTo(0.18, -0.35);
  s.lineTo(0.18, 0.55);
  s.lineTo(-0.55, 0.55);
  s.lineTo(-0.55, 0.72);
  return s;
}

export function makeDigit(ch: "1" | "0" | "2" | "!") {
  const g = new THREE.Group();
  const sh = ch === "0" ? shape0() : ch === "2" ? shape2() : shape1();
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.38, bevelEnabled: false });
  geo.center();
  const mesh = new THREE.Mesh(geo, n64Mat(ch === "0" ? PAPER : RUST, { emissive: RUST }));
  mesh.castShadow = true;
  g.add(mesh);
  if (ch === "!") {
    const twin = mesh.clone();
    twin.position.x = 0.95;
    mesh.position.x = -0.95;
    g.add(twin, new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 0.32), n64Mat(0x3a2420)));
  }
  g.scale.setScalar(ch === "!" ? 2.6 : 1.7);
  return g;
}
