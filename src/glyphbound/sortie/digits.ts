import * as THREE from "three";
import { BRASS, INK, PAPER, RUST, brassTex, n64Mat, rustTex } from "./n64";

function add(
  parent: THREE.Object3D,
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  extra?: { rx?: number; ry?: number; rz?: number; sx?: number; sy?: number; sz?: number; name?: string },
) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  if (extra?.rx) m.rotation.x = extra.rx;
  if (extra?.ry) m.rotation.y = extra.ry;
  if (extra?.rz) m.rotation.z = extra.rz;
  if (extra?.sx || extra?.sy || extra?.sz) m.scale.set(extra.sx ?? 1, extra.sy ?? 1, extra.sz ?? 1);
  if (extra?.name) m.name = extra.name;
  m.castShadow = true;
  parent.add(m);
  return m;
}

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

function digitMesh(ch: "1" | "0" | "2", mat: THREE.Material) {
  const sh = ch === "0" ? shape0() : ch === "2" ? shape2() : shape1();
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.42, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 1 });
  geo.center();
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return mesh;
}

export function makeDigit(ch: "1" | "0" | "2" | "!") {
  const g = new THREE.Group();
  const rust = n64Mat(ch === "0" ? PAPER : RUST, { map: rustTex(), emissive: RUST, glow: 0.25 });
  const brass = n64Mat(BRASS, { map: brassTex() });
  const dark = n64Mat(0x1a1210);
  const ink = n64Mat(INK, { emissive: INK, glow: 1.15 });

  if (ch !== "!") {
    g.add(digitMesh(ch, rust));
    g.scale.setScalar(1.85);
    return g;
  }

  add(g, new THREE.BoxGeometry(3.6, 0.55, 1.6), dark, 0, -0.15, 0);
  add(g, new THREE.BoxGeometry(3.2, 0.22, 1.9), brass, 0, 0.18, 0);
  const left = digitMesh("1", rust);
  const right = digitMesh("1", rust);
  left.position.set(-1.05, 0.95, 0);
  right.position.set(1.05, 0.95, 0);
  g.add(left, right);
  add(g, new THREE.BoxGeometry(2.6, 0.28, 0.45), rust, 0, 0.42, 0);
  add(g, new THREE.ConeGeometry(0.35, 0.8, 6), rust, 0, 0.55, 0.95, { rx: -Math.PI / 2 });
  add(g, new THREE.SphereGeometry(0.22, 6, 5), ink, -0.18, 0.62, 1.28);
  add(g, new THREE.SphereGeometry(0.22, 6, 5), ink, 0.18, 0.62, 1.28);
  add(g, new THREE.BoxGeometry(0.22, 0.22, 1.4), ink, -1.05, 0.55, 0.9);
  add(g, new THREE.BoxGeometry(0.22, 0.22, 1.4), ink, 1.05, 0.55, 0.9);
  add(g, new THREE.ConeGeometry(0.28, 0.7, 6), ink, -1.1, -0.2, -0.85, { rx: Math.PI / 2, name: "engine" });
  add(g, new THREE.ConeGeometry(0.28, 0.7, 6), ink, 1.1, -0.2, -0.85, { rx: Math.PI / 2 });
  add(g, new THREE.ConeGeometry(0.22, 0.55, 6), ink, 0, -0.2, -0.95, { rx: Math.PI / 2 });
  g.scale.setScalar(2.45);
  g.rotation.y = Math.PI;
  return g;
}
