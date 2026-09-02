import * as THREE from "three";
import { brassTex, hullTex, INK, n64Mat } from "./n64";
import type { SortieState } from "./sim";

function add(
  parent: THREE.Object3D,
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  extra?: { rx?: number; ry?: number; rz?: number; sx?: number; sy?: number; sz?: number; name?: string; cast?: boolean },
) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  if (extra?.rx) m.rotation.x = extra.rx;
  if (extra?.ry) m.rotation.y = extra.ry;
  if (extra?.rz) m.rotation.z = extra.rz;
  if (extra?.sx || extra?.sy || extra?.sz) m.scale.set(extra.sx ?? 1, extra.sy ?? 1, extra.sz ?? 1);
  if (extra?.name) m.name = extra.name;
  m.castShadow = extra?.cast !== false;
  parent.add(m);
  return m;
}

function crescentGeo() {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 1.78, 0.38, Math.PI * 2 - 0.38, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, 0.98, 0.38, Math.PI * 2 - 0.38, true);
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.48,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.06,
    bevelSegments: 1,
    steps: 1,
  });
  geo.rotateX(-Math.PI / 2);
  geo.center();
  return geo;
}

export function makeCWing() {
  const g = new THREE.Group();
  g.name = "cwing";
  const brass = n64Mat(0xe8d48a, { map: brassTex() });
  const hull = n64Mat(0xb8924a, { map: hullTex() });
  const dark = n64Mat(0x12181c, { emissive: INK, glow: 0.18 });
  const ink = n64Mat(INK, { emissive: INK, glow: 0.95 });
  const glass = n64Mat(0x7af0d4, { emissive: INK, glow: 0.55 });
  const lead = n64Mat(0x2a3238, { map: hullTex() });
  const gunMat = n64Mat(INK, { emissive: INK, glow: 0.5 });

  const letter = add(g, crescentGeo(), hull, 0, 0.02, 0, { name: "letter" });
  letter.scale.set(1.08, 1.15, 1.08);

  add(g, new THREE.BoxGeometry(3.4, 0.42, 0.62), dark, 0.15, 0, 0);
  add(g, new THREE.BoxGeometry(2.2, 0.18, 0.92), lead, 0.05, 0.22, 0);
  add(g, new THREE.BoxGeometry(1.6, 0.22, 0.38), brass, -0.2, -0.28, 0);
  add(g, new THREE.ConeGeometry(0.38, 1.55, 6), hull, 1.72, 0, 0, { rz: -Math.PI / 2 });
  add(g, new THREE.BoxGeometry(0.7, 0.16, 0.7), dark, 1.15, -0.18, 0);
  add(g, new THREE.CylinderGeometry(0.16, 0.22, 0.7, 6), lead, 0.85, 0.08, 0.42, { rz: Math.PI / 2 });
  add(g, new THREE.CylinderGeometry(0.16, 0.22, 0.7, 6), lead, 0.85, 0.08, -0.42, { rz: Math.PI / 2 });

  const canopy = add(g, new THREE.SphereGeometry(0.36, 7, 5, 0, Math.PI * 2, 0, Math.PI * 0.58), glass, 0.72, 0.32, 0, { sx: 1.55, sy: 0.72, sz: 0.78 });
  canopy.name = "canopy";
  add(g, new THREE.BoxGeometry(0.5, 0.08, 0.42), dark, 0.55, 0.18, 0);

  add(g, new THREE.BoxGeometry(0.18, 0.55, 0.7), brass, -0.15, 0.42, 0);
  add(g, new THREE.BoxGeometry(0.12, 0.7, 0.22), brass, -0.85, 0.38, 0.18);
  add(g, new THREE.BoxGeometry(0.12, 0.7, 0.22), brass, -0.85, 0.38, -0.18);

  const wingL = new THREE.Group();
  const wingR = new THREE.Group();
  wingL.name = "wingL";
  wingR.name = "wingR";
  wingL.position.set(0.05, 0.06, 1.42);
  wingR.position.set(0.05, 0.06, -1.42);
  wingL.rotation.x = 0.16;
  wingR.rotation.x = -0.16;
  g.add(wingL, wingR);

  add(wingL, new THREE.BoxGeometry(1.15, 0.09, 2.55), brass, 0, 0, 0.55);
  add(wingR, new THREE.BoxGeometry(1.15, 0.09, 2.55), brass, 0, 0, -0.55);
  add(wingL, new THREE.BoxGeometry(0.55, 0.07, 1.1), hull, 0.35, 0.04, 0.15);
  add(wingR, new THREE.BoxGeometry(0.55, 0.07, 1.1), hull, 0.35, 0.04, -0.15);
  add(wingL, new THREE.BoxGeometry(0.7, 0.16, 0.22), ink, 0.15, 0.05, 1.72);
  add(wingR, new THREE.BoxGeometry(0.7, 0.16, 0.22), ink, 0.15, 0.05, -1.72);
  add(wingL, new THREE.BoxGeometry(0.35, 0.28, 0.08), dark, -0.2, 0.12, 0.9);
  add(wingR, new THREE.BoxGeometry(0.35, 0.28, 0.08), dark, -0.2, 0.12, -0.9);

  const gL = add(g, new THREE.BoxGeometry(1.05, 0.12, 0.12), gunMat, 1.22, -0.12, 0.48, { name: "gunL" });
  const gR = add(g, new THREE.BoxGeometry(1.05, 0.12, 0.12), gunMat, 1.22, -0.12, -0.48, { name: "gunR" });
  gL.userData.home = { x: 1.22, y: -0.12, z: 0.48 };
  gR.userData.home = { x: 1.22, y: -0.12, z: -0.48 };
  add(g, new THREE.CylinderGeometry(0.07, 0.09, 0.35, 5), dark, 1.72, -0.12, 0.48, { rz: Math.PI / 2 });
  add(g, new THREE.CylinderGeometry(0.07, 0.09, 0.35, 5), dark, 1.72, -0.12, -0.48, { rz: Math.PI / 2 });

  const muzzleMat = new THREE.MeshBasicMaterial({ color: 0x9af8de, transparent: true, opacity: 0 });
  const muzzleGeo = new THREE.ConeGeometry(0.2, 0.95, 5);
  const muzzleL = add(g, muzzleGeo, muzzleMat, 1.85, -0.12, 0.48, { rz: -Math.PI / 2, name: "muzzleL", cast: false });
  const muzzleR = add(g, muzzleGeo, muzzleMat.clone(), 1.85, -0.12, -0.48, { rz: -Math.PI / 2, name: "muzzleR", cast: false });
  muzzleL.visible = false;
  muzzleR.visible = false;

  const muzzleLight = new THREE.PointLight(0x9af8de, 0, 26);
  muzzleLight.name = "muzzleLight";
  muzzleLight.position.set(2.0, 0, 0);
  g.add(muzzleLight);

  const engines = new THREE.Group();
  engines.name = "engine";
  engines.position.set(-1.62, 0, 0);
  g.add(engines);
  add(engines, new THREE.CylinderGeometry(0.28, 0.34, 0.55, 6), dark, 0, 0, 0.38, { rz: Math.PI / 2 });
  add(engines, new THREE.CylinderGeometry(0.28, 0.34, 0.55, 6), dark, 0, 0, -0.38, { rz: Math.PI / 2 });
  add(engines, new THREE.ConeGeometry(0.26, 0.55, 6), ink, -0.38, 0, 0.38, { rz: Math.PI / 2, name: "bellL" });
  add(engines, new THREE.ConeGeometry(0.26, 0.55, 6), ink, -0.38, 0, -0.38, { rz: Math.PI / 2, name: "bellR" });
  const engLight = new THREE.PointLight(0x5ee0c0, 1.4, 18);
  engLight.name = "engineLight";
  engLight.position.set(-0.6, 0, 0);
  engines.add(engLight);

  const trail = new THREE.Group();
  trail.name = "trail";
  trail.position.set(-2.35, 0, 0);
  g.add(trail);
  const trailMat = new THREE.MeshBasicMaterial({ color: 0x9af8de, transparent: true, opacity: 0.55 });
  add(trail, new THREE.ConeGeometry(0.18, 1.7, 5), trailMat, 0, 0, 0.38, { rz: -Math.PI / 2, cast: false });
  add(trail, new THREE.ConeGeometry(0.18, 1.7, 5), trailMat, 0, 0, -0.38, { rz: -Math.PI / 2, cast: false });

  g.scale.setScalar(1.52);
  g.userData.wingL = wingL;
  g.userData.wingR = wingR;
  g.userData.engine = engines;
  g.userData.trail = trail;
  g.userData.gunL = gL;
  g.userData.gunR = gR;
  g.userData.muzzleL = muzzleL;
  g.userData.muzzleR = muzzleR;
  g.userData.muzzleLight = muzzleLight;
  g.userData.engineLight = engLight;
  g.userData.canopy = canopy;
  return g;
}

export function poseCWing(g: THREE.Group, s: SortieState) {
  const boost = s.speed > 70;
  const eng = g.userData.engine as THREE.Group;
  const trail = g.userData.trail as THREE.Group;
  const wL = g.userData.wingL as THREE.Group;
  const wR = g.userData.wingR as THREE.Group;
  const pulse = 1 + Math.sin(s.t * 22) * 0.1;
  if (eng) {
    eng.scale.setScalar((boost ? 1.28 : 1) * pulse);
    eng.traverse((n) => {
      const mesh = n as THREE.Mesh;
      const mat = mesh.material as THREE.MeshLambertMaterial | undefined;
      if (mat?.emissiveIntensity !== undefined && mesh.name.startsWith("bell")) mat.emissiveIntensity = boost ? 2.1 : 1.1;
    });
  }
  const engLight = g.userData.engineLight as THREE.PointLight;
  if (engLight) engLight.intensity = (boost ? 3.2 : 1.3) * pulse;

  if (trail) {
    trail.scale.set(boost ? 1.35 : 0.85, boost ? 1.9 : 1, boost ? 1.35 : 0.85);
    trail.traverse((n) => {
      const mesh = n as THREE.Mesh;
      const mat = mesh.material as THREE.MeshBasicMaterial | undefined;
      if (!mat || mat.opacity === undefined) return;
      mat.opacity = boost ? 0.78 : 0.3 + s.speed / 380;
      mat.color.setHex(s.barrel > 0 ? 0xe8d48a : 0x9af8de);
    });
  }
  if (wL && wR) {
    const flex = s.roll * 0.38;
    wL.rotation.z = flex;
    wR.rotation.z = flex;
    wL.rotation.x = 0.16 + Math.abs(s.roll) * 0.1;
    wR.rotation.x = -0.16 - Math.abs(s.roll) * 0.1;
    wL.visible = s.wings >= 1;
    wR.visible = s.wings >= 2;
  }
  const gunL = g.userData.gunL as THREE.Mesh;
  const gunR = g.userData.gunR as THREE.Mesh;
  const muzzleL = g.userData.muzzleL as THREE.Mesh;
  const muzzleR = g.userData.muzzleR as THREE.Mesh;
  const muzzleLight = g.userData.muzzleLight as THREE.PointLight;
  const kick = s.flash * 0.32;
  const glow = 0.4 + s.flash * 6;
  for (const gun of [gunL, gunR]) {
    if (!gun) continue;
    const home = gun.userData.home as { x: number; y: number; z: number } | undefined;
    if (home) gun.position.set(home.x - kick, home.y, home.z);
    const mat = gun.material as THREE.MeshLambertMaterial;
    mat.emissiveIntensity = glow;
    gun.scale.set(1 + s.flash * 0.45, 1 + s.flash * 1.5, 1 + s.flash * 0.7);
  }
  for (const muzzle of [muzzleL, muzzleR]) {
    if (!muzzle) continue;
    muzzle.visible = s.flash > 0.04;
    const mat = muzzle.material as THREE.MeshBasicMaterial;
    mat.opacity = s.flash * 0.95;
    muzzle.scale.setScalar(0.75 + s.flash * 1.7);
  }
  if (muzzleLight) muzzleLight.intensity = s.flash * 8;
  const canopy = g.userData.canopy as THREE.Mesh;
  if (canopy) {
    const mat = canopy.material as THREE.MeshLambertMaterial;
    mat.emissiveIntensity = 0.45 + (boost ? 0.35 : 0) + s.flash * 0.8;
  }
}
