import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { makeCWing } from "./cwing";
import { makeDigit } from "./digits";
import { FOG } from "./n64";
import type { SortieState } from "./sim";
import { makeSky, makeWorld } from "./world";

function fwd(yaw: number, pitch: number) {
  const cp = Math.cos(pitch);
  return new THREE.Vector3(-Math.sin(yaw) * cp, Math.sin(pitch), -Math.cos(yaw) * cp);
}

function FlightRig({ sim }: { sim: MutableRefObject<SortieState> }) {
  const ship = useMemo(() => makeCWing(), []);
  const sky = useMemo(() => makeSky(), []);
  const world = useMemo(() => makeWorld(), []);
  const digits = useMemo(
    () => ({
      "1": makeDigit("1"),
      "0": makeDigit("0"),
      "2": makeDigit("2"),
      dualis: makeDigit("!"),
    }),
    [],
  );
  const extra = useRef<THREE.Group[]>([]);
  const pool = useRef<THREE.Group[]>([]);
  const shots = useRef<THREE.Mesh[]>([]);
  const rings = useRef<THREE.Mesh[]>([]);
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

    tmp.set(s.x, s.y, s.z).addScaledVector(f, -18);
    tmp.y += 5.5;
    state.camera.position.lerp(tmp, 1 - Math.exp(-5.2 * d));
    look.set(s.x, s.y, s.z).addScaledVector(f, 14);
    state.camera.lookAt(look);
    state.camera.fov = s.speed > 70 ? 62 : 54;
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
        node.add(digits[e.kind].clone());
        node.userData.kind = e.kind;
      }
      node.position.set(e.x, e.y, e.z);
      node.lookAt(s.x, s.y, s.z);
    }

    while (shots.current.length < s.shots.length) {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 6, 6),
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
      (m.material as THREE.MeshBasicMaterial).color.set(sh.friendly ? (sh.kind === "charge" ? 0xe8d48a : 0x5ee0c0) : 0xd45a4a);
    }

    while (rings.current.length < s.rings.length) {
      const m = new THREE.Mesh(
        new THREE.TorusGeometry(5.5, 0.45, 6, 12),
        new THREE.MeshLambertMaterial({ color: 0xe8d48a, emissive: 0x6a5428 }),
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
    }
    void extra;
  });

  return (
    <group ref={root}>
      <primitive object={sky} />
      <primitive object={world.root} />
      <primitive object={ship} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[80, 120, 40]} intensity={1.15} color="#f4e8c0" castShadow />
      <fog attach="fog" args={[FOG, 70, 480]} />
    </group>
  );
}

export function SortieCanvas({ sim }: { sim: MutableRefObject<SortieState> }) {
  return (
    <Canvas
      dpr={1}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      camera={{ fov: 54, near: 0.4, far: 900, position: [0, 54, 140] }}
      onCreated={({ gl }) => {
        gl.setClearColor(FOG, 1);
        gl.shadowMap.enabled = true;
      }}
      style={{ imageRendering: "pixelated", width: "100%", height: "100%" }}
    >
      <FlightRig sim={sim} />
    </Canvas>
  );
}
