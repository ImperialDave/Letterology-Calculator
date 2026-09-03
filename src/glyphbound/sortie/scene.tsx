import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
THREE.ColorManagement.enabled = true;
import { makeCWing, poseCWing } from "./cwing";
import { makeDigit } from "./digits";
import { makeLizard, poseLizard } from "./lizards";
import { sortieSfx } from "./audio";
import {
  BOOST_FOV,
  CAM_LOOK_K,
  CAM_POS_K,
  CHASE_BACK,
  CHASE_FOV,
  CHASE_LOOK,
  CHASE_UP,
  COCKPIT_FOV,
  COCKPIT_FWD,
  COCKPIT_LOOK,
  COCKPIT_UP,
} from "./cam";
import { RING_R, RING_TUBE } from "./landmarks";
import { BARREL_T, type EnemyKind, type PickupKind, type SortieState } from "./sim";
import { makeSky, makeWorld } from "./world";

function fwd(yaw: number, pitch: number) {
  const cp = Math.cos(pitch);
  return new THREE.Vector3(-Math.sin(yaw) * cp, Math.sin(pitch), -Math.cos(yaw) * cp);
}

function pickupColor(kind: PickupKind) {
  if (kind === "gold" || kind === "kit") return 0xe8d48a;
  if (kind === "silver") return 0xd0d4d8;
  if (kind === "repair") return 0x7ad0a8;
  if (kind === "bomb") return 0xe8d48a;
  return 0x5ee0c0;
}

function FlightRig({ sim }: { sim: MutableRefObject<SortieState> }) {
  const ship = useMemo(() => makeCWing(), []);
  const biome = sim.current.biome;
  const missionId = sim.current.missionId;
  const world = useMemo(() => makeWorld(biome, missionId), [biome, missionId]);
  const sky = useMemo(() => makeSky(world.sky), [world.sky]);
  const dress = useMemo(() => {
    const falls: THREE.Mesh[] = [];
    const trees: THREE.Object3D[] = [];
    const mists: THREE.Object3D[] = [];
    world.root.traverse((o) => {
      if (o.name === "fall") falls.push(o as THREE.Mesh);
      if (o.name === "tree") trees.push(o);
      if (o.name === "mist") mists.push(o);
    });
    return { falls, trees, mists };
  }, [world]);
  const fx = useMemo(() => {
    const g = new THREE.Group();
    g.name = "fx";
    const foam: THREE.Mesh[] = [];
    const booms: THREE.Mesh[] = [];
    for (let i = 0; i < 36; i++) {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(3.4, 1.2),
        new THREE.MeshBasicMaterial({ color: 0xe8fff8, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }),
      );
      m.rotation.x = -Math.PI / 2;
      m.visible = false;
      g.add(m);
      foam.push(m);
    }
    for (let i = 0; i < 48; i++) {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(6, 6),
        new THREE.MeshBasicMaterial({ color: 0xff9040, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }),
      );
      m.visible = false;
      g.add(m);
      booms.push(m);
    }
    return { g, foam, booms };
  }, []);
  const foamLife = useRef<number[]>(Array(36).fill(0));
  const boomLife = useRef<number[]>(Array(48).fill(0));
  const foamI = useRef(0);
  const boomI = useRef(0);
  const wakeAcc = useRef(0);
  const wasAlive = useRef(new Map<number, boolean>());
  const molds = useMemo(() => {
    const kinds: EnemyKind[] = ["fighter", "cork", "bomber", "turret", "ace", "mech", "mothership", "aster"];
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
  const lookT = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05);
    const s = sim.current;
    const f = fwd(s.yaw, s.pitch);
    ship.position.set(s.x, s.y, s.z);
    ship.rotation.order = "YXZ";
    ship.rotation.y = s.yaw;
    ship.rotation.x = -s.pitch;
    const spin = s.barrel > 0 ? s.barrelDir * Math.PI * 2 * (1 - s.barrel / BARREL_T) : 0;
    ship.rotation.z = s.roll + spin;
    poseCWing(ship, s);

    const size = state.size;
    if (size.height > 0) s.aspect = size.width / size.height;
    if (s.cockpit) {
      tmp.set(s.x, s.y, s.z).addScaledVector(f, COCKPIT_FWD);
      tmp.y += COCKPIT_UP;
      lookT.set(s.x, s.y, s.z).addScaledVector(f, COCKPIT_LOOK);
      state.camera.fov = COCKPIT_FOV;
    } else {
      tmp.set(s.x, s.y, s.z).addScaledVector(f, -CHASE_BACK);
      tmp.y += CHASE_UP;
      lookT.set(s.x, s.y, s.z).addScaledVector(f, CHASE_LOOK);
      state.camera.fov = s.speed > 70 ? BOOST_FOV : CHASE_FOV;
    }
    state.camera.position.lerp(tmp, 1 - Math.exp(-CAM_POS_K * d));
    if (look.lengthSq() < 0.01) look.copy(lookT);
    else look.lerp(lookT, 1 - Math.exp(-CAM_LOOK_K * d));
    if (s.shake && s.trauma > 0.02) {
      const tr = s.trauma * s.trauma * (s.cockpit ? 0.5 : 1);
      state.camera.position.x += Math.sin(s.t * 53.1) * tr * 0.55;
      state.camera.position.y += Math.cos(s.t * 41.7) * tr * 0.38;
    }
    state.camera.lookAt(look);
    state.camera.updateProjectionMatrix();

    world.waterMap.offset.x = s.t * 0.03;
    world.waterMap.offset.y = s.t * 0.02;
    const river = world.root.getObjectByName("river") as THREE.Mesh | undefined;
    const rmap = (river?.material as THREE.MeshLambertMaterial | undefined)?.map;
    if (rmap) rmap.offset.y = s.t * 0.08;
    const fmap = (dress.falls[0]?.material as THREE.MeshBasicMaterial | undefined)?.map;
    if (fmap) fmap.offset.y = s.t * 0.28;
    for (const tree of dress.trees) {
      tree.rotation.z = Math.sin(s.t * 1.4 + (tree.userData.phase ?? 0) * 6) * 0.06;
    }
    for (const mist of dress.mists) {
      mist.scale.y = 0.7 + Math.sin(s.t * 1.8) * 0.12;
    }

    const fdir = fwd(s.yaw, s.pitch);
    wakeAcc.current += d;
    if (s.skim && wakeAcc.current > 0.07) {
      wakeAcc.current = 0;
      for (const side of [-1, 1]) {
        const i = foamI.current % fx.foam.length;
        foamI.current += 1;
        const card = fx.foam[i];
        card.visible = true;
        card.position.set(s.x - fdir.x * 4 + side * 1.6, 1.2, s.z - fdir.z * 4);
        card.rotation.z = s.yaw;
        foamLife.current[i] = 1;
      }
    }
    for (let i = 0; i < fx.foam.length; i++) {
      if (foamLife.current[i] <= 0) {
        fx.foam[i].visible = false;
        continue;
      }
      foamLife.current[i] -= d * 1.6;
      const mat = fx.foam[i].material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, foamLife.current[i] * 0.45);
      fx.foam[i].scale.setScalar(1 + (1 - foamLife.current[i]) * 1.8);
    }

    for (const e of s.enemies) {
      const prev = wasAlive.current.get(e.id);
      if (prev && !e.alive) {
        const palette = [0xfff0c0, 0xff9030, 0xff6020, 0xc9b896, 0xffe08a, 0x8a7060];
        for (let k = 0; k < 6; k++) {
          const i = boomI.current % fx.booms.length;
          boomI.current += 1;
          const b = fx.booms[i];
          b.visible = true;
          b.position.set(e.x + (k % 3 - 1) * 1.4, e.y + Math.floor(k / 3) * 1.2, e.z);
          (b.material as THREE.MeshBasicMaterial).color.setHex(palette[k]);
          boomLife.current[i] = 1 - k * 0.06;
        }
        sortieSfx.boom();
      }
      wasAlive.current.set(e.id, e.alive);
    }
    for (const imp of s.fxq) {
      if (imp.kill) continue;
      const palette = [0xfff4c8, 0xffb048];
      for (let k = 0; k < 2; k++) {
        const i = boomI.current % fx.booms.length;
        boomI.current += 1;
        const b = fx.booms[i];
        b.visible = true;
        b.position.set(imp.x + (k - 0.5) * 0.8, imp.y + k * 0.5, imp.z);
        (b.material as THREE.MeshBasicMaterial).color.setHex(palette[k]);
        boomLife.current[i] = 0.55 - k * 0.12;
      }
      sortieSfx.hit();
    }
    s.fxq.length = 0;
    for (let i = 0; i < fx.booms.length; i++) {
      if (boomLife.current[i] <= 0) {
        fx.booms[i].visible = false;
        continue;
      }
      boomLife.current[i] -= d * 2.4;
      const mat = fx.booms[i].material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, boomLife.current[i]);
      fx.booms[i].scale.setScalar(0.6 + (1 - boomLife.current[i]) * 3.2);
      fx.booms[i].lookAt(state.camera.position);
    }

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
      if (e.kind === "aster") {
        const body = e.hp >= 8 ? 22 : 10;
        node.scale.setScalar((body * 0.9) / 1.15);
      } else if (e.kind === "turret" || e.kind === "mech" || e.kind === "mothership" || e.kind === "dualis") {
        node.lookAt(s.x, e.kind === "turret" ? e.y : s.y, s.z);
      } else {
        const spd = Math.hypot(e.vx, e.vy, e.vz);
        if (spd > 0.5) node.lookAt(e.x + e.vx, e.y + e.vy, e.z + e.vz);
        else node.lookAt(e.x, e.y, e.z - 10);
      }
      const body = node.children[0];
      if (body) poseLizard(body, s.t + e.t, e.kind, e.hp);
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
        m.scale.set(2.4, 2.4, 22);
        tmp.set(sh.x + sh.vx, sh.y + sh.vy, sh.z + sh.vz);
        m.lookAt(tmp);
      } else if (sh.kind === "charge") {
        m.scale.set(5.2, 5.2, 7.5);
        tmp.set(sh.x + sh.vx, sh.y + sh.vy, sh.z + sh.vz);
        m.lookAt(tmp);
      } else if (sh.kind === "bomb") {
        m.scale.setScalar(3.8);
        m.rotation.set(s.t * 4, s.t * 2, 0);
      } else {
        m.scale.set(3.1, 3.1, 3.1);
        tmp.set(sh.x + sh.vx, sh.y + sh.vy, sh.z + sh.vz);
        m.lookAt(tmp);
      }
      (m.material as THREE.MeshBasicMaterial).color.set(
        sh.kind === "bomb" ? 0xe8d48a : sh.friendly ? (sh.kind === "charge" ? 0xc8ff70 : 0x7efff8) : 0xff4a38,
      );
    }

    while (rings.current.length < s.rings.length) {
      const m = new THREE.Mesh(
        new THREE.TorusGeometry(RING_R, RING_TUBE, 8, 18),
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
      m.scale.setScalar(p.kind === "kit" ? 1.45 : 1);
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
      <primitive object={fx.g} />
      <hemisphereLight args={[0xfff6dc, 0x88d060, 1.15]} />
      <ambientLight intensity={0.62} />
      <directionalLight
        position={[90, 150, 55]}
        intensity={1.45}
        color="#fff8e8"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={30}
        shadow-camera-far={520}
        shadow-camera-left={-160}
        shadow-camera-right={160}
        shadow-camera-top={160}
        shadow-camera-bottom={-160}
        shadow-intensity={0.28}
      />
      <pointLight position={[0, 90, 0]} intensity={0.55} color="#fff0c0" />
      <fog attach="fog" args={[world.fog, 140, 980]} />
    </group>
  );
}

export function SortieCanvas({ sim }: { sim: MutableRefObject<SortieState> }) {
  const biome = sim.current.biome;
  const missionId = sim.current.missionId;
  return (
    <Canvas
      key={`${biome}-${missionId}`}
      dpr={1}
      gl={{ antialias: false, powerPreference: "high-performance", toneMapping: THREE.NoToneMapping }}
      camera={{ fov: 52, near: 0.4, far: 1400, position: [0, 54, 140] }}
      onCreated={({ gl }) => {
        const world = makeWorld(biome, missionId);
        gl.toneMapping = THREE.NoToneMapping;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.setClearColor(world.fog, 1);
        gl.shadowMap.enabled = true;
      }}
      style={{ imageRendering: "pixelated", width: "100%", height: "100%" }}
    >
      <FlightRig sim={sim} />
    </Canvas>
  );
}
