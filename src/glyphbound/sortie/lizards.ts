import * as THREE from "three";
import { BRASS, INK, OLIVE, RUST, brassTex, n64Mat, rustTex, scaleOliveTex } from "./n64";
import type { AsterShape, EnemyKind } from "./sim";

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

function mats() {
  return {
    skin: n64Mat(OLIVE, { map: scaleOliveTex() }),
    brass: n64Mat(BRASS, { map: brassTex() }),
    rust: n64Mat(RUST, { map: rustTex() }),
    ink: n64Mat(INK, { emissive: INK, glow: 1.1 }),
    dark: n64Mat(0x6a5848),
    gold: n64Mat(0xffe08a, { emissive: 0xc8a040, glow: 0.45 }),
  };
}

function raptor(scale: number, span: number, fat: number, trim: "rust" | "gold" | "brass" = "rust") {
  const g = new THREE.Group();
  const m = mats();
  const armor = trim === "gold" ? m.gold : trim === "brass" ? m.brass : m.rust;

  add(g, new THREE.CylinderGeometry(0.28 * fat, 0.42 * fat, 1.85, 7), m.skin, 0, 0.02, 0.05, { rx: Math.PI / 2 });
  add(g, new THREE.SphereGeometry(0.48 * fat, 7, 6), m.skin, 0, 0.04, 0.72, { sy: 0.7, sz: 1.2 });
  add(g, new THREE.BoxGeometry(0.82 * fat, 0.16, 1.15), armor, 0, 0.22, 0.18);
  add(g, new THREE.ConeGeometry(0.34 * fat, 1.05, 6), m.skin, 0, 0.02, 1.35, { rx: -Math.PI / 2 });
  add(g, new THREE.ConeGeometry(0.22, 0.55, 5), m.dark, 0, -0.04, 1.72, { rx: -Math.PI / 2 });
  add(g, new THREE.BoxGeometry(0.62, 0.1, 0.55), armor, 0, 0.18, 1.12, { rx: 0.35 });
  add(g, new THREE.BoxGeometry(0.55, 0.08, 0.42), m.dark, 0, -0.12, 1.55);

  const eyeL = add(g, new THREE.SphereGeometry(0.1, 6, 5), m.ink, -0.18, 0.16, 1.48, { name: "eye" });
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.18;
  g.add(eyeR);

  const wingL = new THREE.Group();
  const wingR = new THREE.Group();
  wingL.name = "wingL";
  wingR.name = "wingR";
  wingL.position.set(-span * 0.18, 0.08, 0.08);
  wingR.position.set(span * 0.18, 0.08, 0.08);
  g.add(wingL, wingR);
  add(wingL, new THREE.BoxGeometry(span * 0.85, 0.045, 1.15), armor, -span * 0.28, 0, 0, { rz: 0.22 });
  add(wingR, new THREE.BoxGeometry(span * 0.85, 0.045, 1.15), armor, span * 0.28, 0, 0, { rz: -0.22 });
  add(wingL, new THREE.BoxGeometry(span * 0.42, 0.035, 0.7), m.skin, -span * 0.22, -0.03, -0.12, { rz: 0.14 });
  add(wingR, new THREE.BoxGeometry(span * 0.42, 0.035, 0.7), m.skin, span * 0.22, -0.03, -0.12, { rz: -0.14 });
  add(wingL, new THREE.BoxGeometry(0.12, 0.28, 0.55), armor, -span * 0.08, 0.12, 0.15);
  add(wingR, new THREE.BoxGeometry(0.12, 0.28, 0.55), armor, span * 0.08, 0.12, 0.15);

  add(g, new THREE.ConeGeometry(0.16, 1.55, 5), m.rust, 0, 0, -1.35, { rx: Math.PI / 2, name: "tail" });
  add(g, new THREE.BoxGeometry(0.85, 0.06, 0.32), armor, 0, 0.14, -1.72);
  add(g, new THREE.BoxGeometry(0.08, 0.5, 0.32), armor, 0, 0.34, -1.58);

  add(g, new THREE.CylinderGeometry(0.18, 0.26, 0.45, 6), m.dark, 0, 0, -0.95, { rx: Math.PI / 2 });
  add(g, new THREE.ConeGeometry(0.22, 0.62, 6), m.ink, 0, 0, -1.28, { rx: Math.PI / 2, name: "engine" });

  g.scale.setScalar(scale * 1.08);
  g.rotation.y = Math.PI;
  return g;
}

function makeAster(shape: AsterShape = "sort") {
  const g = new THREE.Group();
  const m = mats();
  if (shape === "slug") {
    add(g, new THREE.BoxGeometry(32, 9, 10), m.dark, 0, 0, 0);
    add(g, new THREE.BoxGeometry(26, 5.5, 7), m.rust, 0.4, 0.8, 0.3);
    add(g, new THREE.CylinderGeometry(1.4, 1.4, 4, 6), m.ink, 10, 0, 3.2, { rx: Math.PI / 2 });
    return g;
  }
  if (shape === "rule") {
    add(g, new THREE.BoxGeometry(9, 32, 10), m.dark, 0, 0, 0);
    add(g, new THREE.BoxGeometry(7, 6, 8), m.brass, 0, 14, 0.4);
    add(g, new THREE.BoxGeometry(6.2, 22, 7), m.rust, 0.3, -2, 0.2);
    return g;
  }
  if (shape === "quad") {
    add(g, new THREE.BoxGeometry(16, 16, 16), m.dark, 0, 0, 0);
    add(g, new THREE.BoxGeometry(13, 13, 3), m.rust, 0, 0, 7);
    add(g, new THREE.BoxGeometry(4, 4, 2), m.ink, 0, 0, 8.2);
    return g;
  }
  if (shape === "stone") {
    add(g, new THREE.IcosahedronGeometry(12, 0), m.dark, 0, 0, 0);
    add(g, new THREE.DodecahedronGeometry(6.5, 0), m.rust, 5, 3, 2);
    add(g, new THREE.DodecahedronGeometry(5, 0), m.dark, -4, -3, 3);
    return g;
  }
  add(g, new THREE.DodecahedronGeometry(6, 0), m.dark, 0, 0, 0);
  add(g, new THREE.DodecahedronGeometry(3.4, 0), m.rust, 1.8, 1.1, 0.8);
  return g;
}

export function makeLizard(kind: EnemyKind, shape?: AsterShape) {
  if (kind === "cork") {
    const g = raptor(1.22, 1.45, 0.82, "rust");
    const m = mats();
    for (let i = 0; i < 4; i++) {
      const fin = add(g, new THREE.BoxGeometry(1.35, 0.05, 0.32), m.rust, 0, 0, -0.15 + i * 0.28);
      fin.rotation.z = i * 0.7;
    }
    return g;
  }
  if (kind === "bomber") {
    const g = raptor(1.48, 2.5, 1.45, "rust");
    const m = mats();
    add(g, new THREE.SphereGeometry(0.7, 7, 6), m.skin, 0, -0.35, 0.1, { sy: 0.7, sz: 1.2 });
    add(g, new THREE.BoxGeometry(0.85, 0.22, 0.55), m.dark, 0, -0.62, 0.15);
    add(g, new THREE.CylinderGeometry(0.12, 0.16, 0.45, 5), m.rust, -0.22, -0.72, 0.1);
    add(g, new THREE.CylinderGeometry(0.12, 0.16, 0.45, 5), m.rust, 0.22, -0.72, 0.1);
    add(g, new THREE.ConeGeometry(0.2, 0.55, 6), m.ink, -0.45, 0.05, -1.05, { rx: Math.PI / 2, name: "engine" });
    add(g, new THREE.ConeGeometry(0.2, 0.55, 6), m.ink, 0.45, 0.05, -1.05, { rx: Math.PI / 2 });
    return g;
  }
  if (kind === "ace") {
    const g = raptor(1.38, 2.35, 0.78, "gold");
    const m = mats();
    add(g, new THREE.BoxGeometry(0.12, 0.55, 0.7), m.gold, 0, 0.32, -0.4);
    add(g, new THREE.ConeGeometry(0.12, 0.9, 5), m.gold, -0.22, 0.08, -1.55, { rx: Math.PI / 2 });
    add(g, new THREE.ConeGeometry(0.12, 0.9, 5), m.gold, 0.22, 0.08, -1.55, { rx: Math.PI / 2 });
    return g;
  }
  if (kind === "mech") {
    const g = new THREE.Group();
    const m = mats();
    const pelvis = new THREE.Group();
    pelvis.name = "pelvis";
    g.add(pelvis);
    add(pelvis, new THREE.BoxGeometry(1.15, 1.35, 0.85), m.skin, 0, 0.55, 0);
    add(pelvis, new THREE.BoxGeometry(1.35, 0.28, 0.95), m.brass, 0, 1.05, 0);
    add(pelvis, new THREE.ConeGeometry(0.38, 0.9, 6), m.skin, 0, 0.9, 0.7, { rx: -Math.PI / 2 });
    add(pelvis, new THREE.SphereGeometry(0.12, 6, 5), m.ink, -0.16, 0.98, 1.05);
    add(pelvis, new THREE.SphereGeometry(0.12, 6, 5), m.ink, 0.16, 0.98, 1.05);
    add(pelvis, new THREE.BoxGeometry(0.55, 0.18, 0.7), m.rust, 0, 0.75, 0.85);
    add(pelvis, new THREE.BoxGeometry(0.7, 0.22, 0.22), m.ink, -0.85, 0.75, 0.15, { name: "gunL" });
    add(pelvis, new THREE.BoxGeometry(0.7, 0.22, 0.22), m.ink, 0.85, 0.75, 0.15);
    add(pelvis, new THREE.ConeGeometry(0.16, 0.45, 5), m.ink, 0, 0.4, -0.55, { rx: Math.PI / 2, name: "engine" });
    const legL = new THREE.Group();
    const legR = new THREE.Group();
    legL.name = "legL";
    legR.name = "legR";
    legL.position.set(-0.42, 0.05, 0.1);
    legR.position.set(0.42, 0.05, 0.1);
    g.add(legL, legR);
    add(legL, new THREE.BoxGeometry(0.3, 1.15, 0.34), m.brass, 0, -0.55, 0);
    add(legR, new THREE.BoxGeometry(0.3, 1.15, 0.34), m.brass, 0, -0.55, 0);
    add(legL, new THREE.BoxGeometry(0.46, 0.18, 0.72), m.dark, 0, -1.18, 0.12);
    add(legR, new THREE.BoxGeometry(0.46, 0.18, 0.72), m.dark, 0, -1.18, 0.12);
    g.scale.setScalar(1.85);
    g.rotation.y = Math.PI;
    return g;
  }
  if (kind === "mothership") {
    const g = new THREE.Group();
    const m = mats();
    add(g, new THREE.CylinderGeometry(3.4, 3.9, 0.85, 10), m.skin, 0, 0, 0);
    add(g, new THREE.SphereGeometry(1.6, 8, 6), m.skin, 0, 0.45, 0, { sy: 0.45 });
    add(g, new THREE.TorusGeometry(3.6, 0.22, 6, 14), m.rust, 0, 0.35, 0, { rx: Math.PI / 2 });
    add(g, new THREE.BoxGeometry(7.4, 0.22, 0.7), m.rust, 0, 0.55, 0);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      add(g, new THREE.SphereGeometry(0.28, 6, 5), m.ink, Math.cos(a) * 2.4, 0.35, Math.sin(a) * 2.4);
    }
    add(g, new THREE.ConeGeometry(0.7, 1.1, 6), m.skin, 0, 0.15, 2.6, { rx: -Math.PI / 2 });
    add(g, new THREE.SphereGeometry(0.38, 6, 5), m.ink, 0, 0.35, 3.15, { name: "eye" });
    add(g, new THREE.ConeGeometry(0.85, 2.8, 7), m.rust, 0, -0.15, 1.6, { rx: Math.PI / 2, name: "drill" });
    for (const z of [-1.2, 0, 1.2]) {
      add(g, new THREE.ConeGeometry(0.35, 0.7, 6), m.ink, 0, -0.55, z, { rx: Math.PI, name: z === 0 ? "engine" : undefined });
    }
    g.scale.setScalar(1.15);
    g.rotation.y = Math.PI;
    return g;
  }
  if (kind === "turret") {
    const g = new THREE.Group();
    const m = mats();
    add(g, new THREE.CylinderGeometry(1.05, 1.2, 0.35, 8), m.dark, 0, -0.35, 0);
    add(g, new THREE.CylinderGeometry(0.7, 0.95, 0.55, 8), m.dark, 0, 0, 0);
    add(g, new THREE.CylinderGeometry(0.55, 0.7, 0.4, 8), m.skin, 0, 0.4, 0);
    add(g, new THREE.ConeGeometry(0.32, 0.7, 6), m.skin, 0, 0.85, 0.15, { rx: -0.4 });
    add(g, new THREE.SphereGeometry(0.1, 6, 5), m.ink, -0.12, 0.95, 0.42);
    add(g, new THREE.SphereGeometry(0.1, 6, 5), m.ink, 0.12, 0.95, 0.42);
    add(g, new THREE.BoxGeometry(0.18, 0.18, 1.15), m.rust, 0, 0.72, 0.7, { name: "gunL" });
    add(g, new THREE.BoxGeometry(1.1, 0.12, 0.55), m.rust, 0, 0.22, 0);
    g.scale.setScalar(1.35);
    g.rotation.y = Math.PI;
    return g;
  }
  if (kind === "aster") return makeAster(shape ?? "sort");
  return raptor(1.18, 1.95, 1, "rust");
}

export function poseLizard(g: THREE.Object3D, t: number, kind: EnemyKind, hp = 24, shape?: AsterShape) {
  const flap = Math.sin(t * (kind === "cork" ? 8 : 4.5)) * 0.18;
  const wL = g.getObjectByName("wingL");
  const wR = g.getObjectByName("wingR");
  if (wL) wL.rotation.z = 0.12 + flap;
  if (wR) wR.rotation.z = -0.12 - flap;
  const engine = g.getObjectByName("engine") as THREE.Mesh | undefined;
  if (engine) {
    const pulse = 1 + Math.sin(t * 14) * 0.12;
    engine.scale.setScalar(pulse);
  }
  if (kind === "cork") g.rotation.z = Math.sin(t * 3.2) * 0.35;
  if (kind === "mothership") {
    g.rotation.z = Math.sin(t * (hp <= 8 ? 2.4 : 0.6)) * (hp <= 8 ? 0.16 : 0.08);
    const drill = g.getObjectByName("drill");
    if (drill) {
      drill.rotation.z = t * 5;
      drill.visible = hp > 16;
    }
  }
  if (kind === "aster") {
    if (shape === "slug") g.rotation.set(t * 0.4, 0.15, 0.08);
    else if (shape === "rule") g.rotation.set(0.06, t * 0.35, 0.04);
    else if (shape === "quad") g.rotation.set(t * 0.18, t * 0.28, t * 0.1);
    else if (shape === "stone") g.rotation.set(t * 0.16, t * 0.22, t * 0.09);
    else g.rotation.set(t * 0.35, t * 0.5, t * 0.2);
  }
  if (kind === "mech") {
    const step = Math.sin(t * 2.4);
    const legL = g.getObjectByName("legL");
    const legR = g.getObjectByName("legR");
    if (legL) legL.rotation.x = step * 0.45;
    if (legR) legR.rotation.x = -step * 0.45;
    g.position.y = Math.abs(step) * 0.28;
  }
}
