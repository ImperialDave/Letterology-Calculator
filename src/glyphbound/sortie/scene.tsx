import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { makeCWing, poseCWing } from "./cwing";
import { makeDigit } from "./digits";
import { makeLizard, poseLizard } from "./lizards";
import type { EnemyKind, PickupKind, SortieState } from "./sim";
import { makeSky, makeWorld } from "./world";

function fwd(yaw: number, pitch: number) {
  const cp = Math.cos(pitch);
  return new THREE.Vector3(-Math.sin(yaw) * cp, Math.sin(pitch), -Math.cos(yaw) * cp);
}

function pickupColor(kind: PickupKind) {
  if (kind === "gold") return 0xe8d48a;
  if (kind === "silver") return 0xd0d4d8;
  if (kind === "repair") return 0x7ad0a8;
  if (kind === "bomb") return 0xe8d48a;
  return 0x5ee0c0;
}

function FlightRig({ sim }: { sim: MutableRefObject<SortieState> }) {
  const ship = useMemo(() => makeCWing(), []);
  const biome = sim.current.biome;
  const world = useMemo(() => makeWorld(biome), [biome]);
  const sky = useMemo(() => makeSky(world.sky), [world.sky]);
  const molds = useMemo(() => {
    const kinds: EnemyKind[] = ["fighter", "cork", "bomber", "turret", "ace", "mech", "mothership"];
    const out: Partial<Record<EnemyKind, THREE.Group>> = { dualis: makeDigit("!") };
    for (const k of kinds) out[k] = makeLizard(k);
    return out;
  }, []);
  const extra = useRef<THREE.Group[]>([]);
  const pool = useRef<THREE.Group[]>([]);
  const shots = useRef<THREE.Mesh[]>([]);
  const rings = useRef<THREE.Mesh[]>([]);
  const loot = useRef<THREE.Mesh[]>([]);
  const root = useRef<THREE.Group>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05);
    const s = sim.current;
    const f = fwd(s.yaw, s.pitch);
    ship.position.set(s.x, s.y, s.z);
    ship.rotation.order = "YXZ";
    ship.rotation.y = s.yaw;
    ship.rotation.x = -s.pitch;
    ship.rotation.z = s.roll;
    poseCWing(ship, s);

    tmp.set(s.x, s.y, s.z).addScaledVector(f, -21);
    tmp.y += 6.4;
    state.camera.position.lerp(tmp, 1 - Math.exp(-5.2 * d));
    look.set(s.x, s.y, s.z).addScaledVector(f, 16);
    state.camera.lookAt(look);
    state.camera.fov = (s.speed > 70 ? 64 : 52) + s.flash * 4;
    state.camera.updateProjectionMatrix();

    world.waterMap.offset.x = s.t * 0.03;
    world.waterMap.offset.y = s.t * 0.02;

    const g = root.current;
    if (!g) return;
    while (pool.current.length < s.enemies.length) {
      const n = new THREE.Group();
      g.add(n);
      pool.current.push(n);
    }
    for (let i = 0; i < pool.current.length; i++) {
      const node = pool.current[i];
      const e = s.enemies[i];
      node.visible = Boolean(e?.alive);
      if (!e?.alive) continue;
      if (node.userData.kind !== e.kind) {
        node.clear();
        const mold = molds[e.kind] ?? molds.fighter;
        if (mold) node.add(mold.clone());
        node.userData.kind = e.kind;
      }
      node.position.set(e.x, e.y, e.z);
      if (e.kind === "turret") {
        node.lookAt(s.x, e.y, s.z);
      } else {
        node.lookAt(s.x, s.y, s.z);
      }
      const body = node.children[0];
      if (body) poseLizard(body, s.t + e.t, e.kind);
    }

    while (shots.current.length < s.shots.length) {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.16, 1),
        new THREE.MeshBasicMaterial({ color: 0x5ee0c0 }),
      );
      g.add(m);
      shots.current.push(m);
    }
    for (let i = 0; i < shots.current.length; i++) {
      const m = shots.current[i];
      const sh = s.shots[i];
      m.visible = Boolean(sh);
      if (!sh) continue;
      m.position.set(sh.x, sh.y, sh.z);
      if (sh.kind === "laser") {
        m.scale.set(0.7, 0.7, 8.5);
        tmp.set(sh.x + sh.vx, sh.y + sh.vy, sh.z + sh.vz);
        m.lookAt(tmp);
      } else if (sh.kind === "charge") {
        m.scale.set(2.2, 2.2, 4.4);
        tmp.set(sh.x + sh.vx, sh.y + sh.vy, sh.z + sh.vz);
        m.lookAt(tmp);
      } else if (sh.kind === "bomb") {
        m.scale.setScalar(3.4);
        m.rotation.set(s.t * 4, s.t * 2, 0);
      } else {
        m.scale.set(1.3, 1.3, 2.4);
        tmp.set(sh.x + sh.vx, sh.y + sh.vy, sh.z + sh.vz);
        m.lookAt(tmp);
      }
      (m.material as THREE.MeshBasicMaterial).color.set(
        sh.kind === "bomb" ? 0xe8d48a : sh.friendly ? (sh.kind === "charge" ? 0xffe08a : 0xb8fff0) : 0xff6a55,
      );
    }

    while (rings.current.length < s.rings.length) {
      const m = new THREE.Mesh(
        new THREE.TorusGeometry(5.5, 0.45, 6, 14),
        new THREE.MeshLambertMaterial({ color: 0xe8d48a, emissive: 0x6a5428, emissiveIntensity: 0.7 }),
      );
      g.add(m);
      rings.current.push(m);
    }
    for (let i = 0; i < rings.current.length; i++) {
      const m = rings.current[i];
      const r = s.rings[i];
      m.visible = Boolean(r) && !r.taken;
      if (!r) continue;
      m.position.set(r.x, r.y, r.z);
      m.rotation.y = s.t * 1.4;
      m.rotation.x = Math.sin(s.t) * 0.2;
    }

    while (loot.current.length < s.pickups.length) {
      const m = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.15, 0),
        new THREE.MeshLambertMaterial({ color: 0x5ee0c0, emissive: 0x5ee0c0, emissiveIntensity: 0.8 }),
      );
      m.castShadow = true;
      g.add(m);
      loot.current.push(m);
    }
    for (let i = 0; i < loot.current.length; i++) {
      const m = loot.current[i];
      const p = s.pickups[i];
      m.visible = Boolean(p) && !p.taken;
      if (!p) continue;
      m.position.set(p.x, p.y + Math.sin(s.t * 3 + i) * 0.6, p.z);
      m.rotation.y = s.t * 2.2;
      const mat = m.material as THREE.MeshLambertMaterial;
      mat.color.setHex(pickupColor(p.kind));
      mat.emissive.setHex(pickupColor(p.kind));
    }
    void extra;
  });

  return (
    <group ref={root}>
      <primitive object={sky} />
      <primitive object={world.root} />
      <primitive object={ship} />
      <hemisphereLight args={[0xd8f4ec, 0x243028, 0.72]} />
      <ambientLight intensity={0.22} />
      <directionalLight
        position={[90, 150, 55]}
        intensity={1.65}
        color="#fff2d0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={30}
        shadow-camera-far={520}
        shadow-camera-left={-160}
        shadow-camera-right={160}
        shadow-camera-top={160}
        shadow-camera-bottom={-160}
      />
      <pointLight position={[0, 90, 0]} intensity={0.35} color="#5ee0c0" />
      <fog attach="fog" args={[world.fog, 90, 520]} />
    </group>
  );
}

export function SortieCanvas({ sim }: { sim: MutableRefObject<SortieState> }) {
  const biome = sim.current.biome;
  return (
    <Canvas
      key={biome}
      dpr={1}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      camera={{ fov: 52, near: 0.4, far: 980, position: [0, 54, 140] }}
      onCreated={({ gl }) => {
        const world = makeWorld(biome);
        gl.setClearColor(world.fog, 1);
        gl.shadowMap.enabled = true;
      }}
      style={{ imageRendering: "pixelated", width: "100%", height: "100%" }}
    >
      <FlightRig sim={sim} />
    </Canvas>
  );
}
