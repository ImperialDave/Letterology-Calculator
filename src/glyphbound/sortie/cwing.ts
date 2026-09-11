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
  // Parts are built with +X as the nose. Scene Euler is YXZ for a craft whose
  // nose is parent −Z (yaw 0 flies world −Z). +90° Y sends model +X to −Z.
  const body = new THREE.Group();
  body.name = "cwing-body";
  body.rotation.y = Math.PI / 2;
  g.add(body);
  const brass = n64Mat(0xe8d48a, { map: brassTex() });
  const hull = n64Mat(0xb8924a, { map: hullTex() });
  const dark = n64Mat(0x4a6070, { emissive: INK, glow: 0.22 });
  const ink = n64Mat(INK, { emissive: INK, glow: 0.95 });
  const glass = n64Mat(0x9af8e8, { emissive: INK, glow: 0.7 });
  const lead = n64Mat(0xd8e0e8, { map: hullTex() });
  const gunMat = n64Mat(INK, { emissive: INK, glow: 0.5 });

  const letter = add(body, crescentGeo(), hull, 0.05, 0.04, 0, { name: "letter" });
  letter.scale.set(1.28, 1.05, 1.32);

  add(body, new THREE.CylinderGeometry(0.22, 0.38, 3.6, 7), hull, 0.15, 0, 0, { rz: Math.PI / 2 });
  add(body, new THREE.ConeGeometry(0.28, 1.85, 7), brass, 1.95, 0, 0, { rz: -Math.PI / 2 });
  add(body, new THREE.BoxGeometry(1.8, 0.16, 0.72), lead, 0.2, 0.22, 0);
  add(body, new THREE.BoxGeometry(1.4, 0.14, 0.42), dark, -0.15, -0.22, 0);

  const canopy = add(body, new THREE.SphereGeometry(0.42, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.62), glass, 0.62, 0.38, 0, { sx: 1.7, sy: 0.78, sz: 0.86 });
  canopy.name = "canopy";
  add(body, new THREE.BoxGeometry(0.55, 0.07, 0.48), dark, 0.48, 0.22, 0);
  add(body, new THREE.BoxGeometry(0.16, 0.42, 0.55), brass, -0.05, 0.48, 0);

  const wingL = new THREE.Group();
  const wingR = new THREE.Group();
  wingL.name = "wingL";
  wingR.name = "wingR";
  wingL.position.set(0.05, 0.06, 1.42);
  wingR.position.set(0.05, 0.06, -1.42);
  wingL.rotation.x = 0.16;
  wingR.rotation.x = -0.16;
  body.add(wingL, wingR);

  add(wingL, new THREE.BoxGeometry(1.35, 0.08, 3.1), brass, 0.05, 0, 0.7);
  add(wingR, new THREE.BoxGeometry(1.35, 0.08, 3.1), brass, 0.05, 0, -0.7);
  add(wingL, new THREE.BoxGeometry(0.7, 0.06, 1.35), hull, 0.4, 0.05, 0.2);
  add(wingR, new THREE.BoxGeometry(0.7, 0.06, 1.35), hull, 0.4, 0.05, -0.2);
  add(wingL, new THREE.BoxGeometry(0.85, 0.18, 0.18), ink, 0.2, 0.06, 2.05);
  add(wingR, new THREE.BoxGeometry(0.85, 0.18, 0.18), ink, 0.2, 0.06, -2.05);
  add(wingL, new THREE.BoxGeometry(0.28, 0.42, 0.08), dark, -0.25, 0.16, 1.05);
  add(wingR, new THREE.BoxGeometry(0.28, 0.42, 0.08), dark, -0.25, 0.16, -1.05);

  const gL = add(body, new THREE.BoxGeometry(1.05, 0.12, 0.12), gunMat, 1.22, -0.12, 0.48, { name: "gunL" });
  const gR = add(body, new THREE.BoxGeometry(1.05, 0.12, 0.12), gunMat, 1.22, -0.12, -0.48, { name: "gunR" });
  gL.userData.home = { x: 1.22, y: -0.12, z: 0.48 };
  gR.userData.home = { x: 1.22, y: -0.12, z: -0.48 };
  add(body, new THREE.CylinderGeometry(0.07, 0.09, 0.35, 5), dark, 1.72, -0.12, 0.48, { rz: Math.PI / 2 });
  add(body, new THREE.CylinderGeometry(0.07, 0.09, 0.35, 5), dark, 1.72, -0.12, -0.48, { rz: Math.PI / 2 });

  const muzzleMat = new THREE.MeshBasicMaterial({ color: 0x9af8de, transparent: true, opacity: 0 });
  const muzzleGeo = new THREE.ConeGeometry(0.2, 0.95, 5);
  const muzzleL = add(body, muzzleGeo, muzzleMat, 1.85, -0.12, 0.48, { rz: -Math.PI / 2, name: "muzzleL", cast: false });
  const muzzleR = add(body, muzzleGeo, muzzleMat.clone(), 1.85, -0.12, -0.48, { rz: -Math.PI / 2, name: "muzzleR", cast: false });
  muzzleL.visible = false;
  muzzleR.visible = false;

  const muzzleLight = new THREE.PointLight(0x9af8de, 0, 26);
  muzzleLight.name = "muzzleLight";
  muzzleLight.position.set(2.0, 0, 0);
  body.add(muzzleLight);

  const chargeBall = add(
    body,
    new THREE.SphereGeometry(0.22, 6, 6),
    new THREE.MeshBasicMaterial({ color: 0xe8d48a, transparent: true, opacity: 0 }),
    1.95,
    0.02,
    0,
    { name: "chargeBall", cast: false },
  );
  chargeBall.visible = false;

  const gunC = add(body, new THREE.BoxGeometry(1.15, 0.1, 0.1), gunMat, 1.28, -0.18, 0, { name: "gunC" });
  gunC.userData.home = { x: 1.28, y: -0.18, z: 0 };
  gunC.visible = false;
  const muzzleC = add(body, muzzleGeo.clone(), muzzleMat.clone(), 1.9, -0.18, 0, { rz: -Math.PI / 2, name: "muzzleC", cast: false });
  muzzleC.visible = false;

  const canards = new THREE.Group();
  canards.name = "canards";
  canards.visible = false;
  body.add(canards);
  add(canards, new THREE.BoxGeometry(0.55, 0.06, 0.9), brass, 0.55, 0.22, 0.55);
  add(canards, new THREE.BoxGeometry(0.55, 0.06, 0.9), brass, 0.55, 0.22, -0.55);

  const shield = add(
    body,
    new THREE.TorusGeometry(1.85, 0.06, 6, 16),
    new THREE.MeshBasicMaterial({ color: 0x5ee0c0, transparent: true, opacity: 0.45 }),
    0.15,
    0.02,
    0,
    { ry: Math.PI / 2, name: "shield", cast: false },
  );
  shield.visible = false;

  const engines = new THREE.Group();
  engines.name = "engine";
  engines.position.set(-1.62, 0, 0);
  body.add(engines);
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
  body.add(trail);
  const trailMat = new THREE.MeshBasicMaterial({ color: 0x9af8de, transparent: true, opacity: 0.55 });
  add(trail, new THREE.ConeGeometry(0.18, 1.7, 5), trailMat, 0, 0, 0.38, { rz: -Math.PI / 2, cast: false });
  add(trail, new THREE.ConeGeometry(0.18, 1.7, 5), trailMat, 0, 0, -0.38, { rz: -Math.PI / 2, cast: false });
  add(trail, new THREE.ConeGeometry(0.12, 2.6, 5), trailMat.clone(), -0.4, 0, 0.38, { rz: -Math.PI / 2, cast: false });
  add(trail, new THREE.ConeGeometry(0.12, 2.6, 5), trailMat.clone(), -0.4, 0, -0.38, { rz: -Math.PI / 2, cast: false });

  const sparkle = new THREE.Group();
  sparkle.name = "sparkle";
  body.add(sparkle);
  const sparkMat = new THREE.MeshBasicMaterial({ color: 0xe8d48a, transparent: true, opacity: 0.85 });
  for (let i = 0; i < 10; i++) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.9), sparkMat.clone());
    const a = (i / 10) * Math.PI * 2;
    p.position.set(Math.cos(a) * 1.6, Math.sin(a) * 1.1, 0);
    p.rotation.z = a;
    sparkle.add(p);
  }
  sparkle.visible = false;

  g.scale.setScalar(1.68);
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
  g.userData.chargeBall = chargeBall;
  g.userData.sparkle = sparkle;
  g.userData.gunC = gunC;
  g.userData.muzzleC = muzzleC;
  g.userData.canards = canards;
  g.userData.shield = shield;
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

  const sparkle = g.userData.sparkle as THREE.Group | undefined;
  if (sparkle) {
    sparkle.visible = s.barrel > 0;
    if (s.barrel > 0) sparkle.rotation.x = (1 - s.barrel / 0.42) * Math.PI * 2;
  }
  if (trail) {
    trail.scale.set(boost ? 1.55 : 0.85, boost ? 2.4 : 1, boost ? 1.55 : 0.85);
    trail.traverse((n) => {
      const mesh = n as THREE.Mesh;
      const mat = mesh.material as THREE.MeshBasicMaterial | undefined;
      if (!mat || mat.opacity === undefined) return;
      mat.opacity = boost ? 0.88 : 0.42 + s.speed / 280;
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
  const gunC = g.userData.gunC as THREE.Mesh | undefined;
  const muzzleC = g.userData.muzzleC as THREE.Mesh | undefined;
  if (gunC) {
    gunC.visible = s.mods.extraLaser;
    if (gunC.visible) {
      const home = gunC.userData.home as { x: number; y: number; z: number } | undefined;
      if (home) gunC.position.set(home.x - kick, home.y, home.z);
      gunC.scale.set(1 + s.flash * 0.45, 1 + s.flash * 1.5, 1 + s.flash * 0.7);
    }
  }
  if (muzzleC) {
    muzzleC.visible = s.mods.extraLaser && s.flash > 0.08;
    if (muzzleC.visible) {
      (muzzleC.material as THREE.MeshBasicMaterial).opacity = Math.min(1, s.flash * 1.4);
      muzzleC.scale.setScalar(0.75 + s.flash * 1.7);
    }
  }
  const canards = g.userData.canards as THREE.Group | undefined;
  if (canards) {
    canards.visible = (s.kitRanks.caret ?? 0) >= 1;
    canards.rotation.z = s.pitch * 0.55;
  }
  const shield = g.userData.shield as THREE.Mesh | undefined;
  if (shield) {
    shield.visible = s.shield > 0;
    if (shield.visible) {
      const pulse = 0.92 + Math.sin(s.t * 6) * 0.08;
      shield.scale.setScalar(pulse);
      (shield.material as THREE.MeshBasicMaterial).opacity = 0.28 + s.shield * 0.18;
    }
  }
  for (const muzzle of [muzzleL, muzzleR]) {
    if (!muzzle) continue;
    muzzle.visible = s.flash > 0.04;
    const mat = muzzle.material as THREE.MeshBasicMaterial;
    mat.opacity = s.flash * 0.95;
    muzzle.scale.setScalar(0.75 + s.flash * 1.7);
  }
  if (muzzleLight) muzzleLight.intensity = s.flash * 8;
  const chargeBall = g.userData.chargeBall as THREE.Mesh;
  if (chargeBall) {
    const on = s.charge > 0.12;
    chargeBall.visible = on;
    const mat = chargeBall.material as THREE.MeshBasicMaterial;
    mat.opacity = Math.min(0.95, s.charge * 0.9);
    mat.color.setHex(s.lockHard ? 0xd45a4a : 0xe8d48a);
    chargeBall.scale.setScalar(0.7 + s.charge * 1.4);
  }
  const canopy = g.userData.canopy as THREE.Mesh;
  if (canopy) {
    const mat = canopy.material as THREE.MeshLambertMaterial;
    mat.emissiveIntensity = 0.45 + (boost ? 0.35 : 0) + s.flash * 0.8;
  }
}
