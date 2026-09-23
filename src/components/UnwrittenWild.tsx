import { Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  HOUSES,
  SCRIPT,
  SERIF,
  SPIRE,
  freshWild,
  forwardFromYaw,
  loadWild,
  objectiveLine,
  saveWild,
  stepWild,
  type WildState,
} from "@/wild/sim";

const PALETTE: Record<string, number> = {
  leaf: 0x7d9a3c,
  stone: 0xd9d0c0,
  wall: 0xefe6d4,
  roof: 0x8d5a32,
  indigo: 0x2a3a72,
  bronze: 0xb5813a,
  gold: 0xe2c36a,
  vellum: 0xf0e2c4,
};

type ArtName = "sable" | "stag" | "house" | "shrine" | "spire" | "serif";

export function UnwrittenWild() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<WildState>(freshWild());
  const keys = useRef(new Set<string>());
  const look = useRef(0);
  const edges = useRef({ cut: false, talk: false, hop: false, save: false, load: false });
  const objectiveRef = useRef<HTMLParagraphElement>(null);
  const toastRef = useRef<HTMLParagraphElement>(null);
  const inkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const held = keys.current;
    const onDown = (event: KeyboardEvent) => {
      held.add(event.code);
      if (event.repeat) return;
      if (event.code === "KeyK" || event.code === "KeyF") edges.current.cut = true;
      if (event.code === "KeyE") edges.current.talk = true;
      if (event.code === "Space") edges.current.hop = true;
      if (event.code === "F5") edges.current.save = true;
      if (event.code === "F9") edges.current.load = true;
    };
    const onUp = (event: KeyboardEvent) => held.delete(event.code);
    const onBlur = () => held.clear();
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    const probe = {
      getYaw: () => stateRef.current.camYaw,
      getSpeed: () => stateRef.current.speed,
      setKeys: (codes: string[]) => {
        held.clear();
        for (const code of codes) held.add(code);
      },
    };
    (window as unknown as { __controlsTest?: typeof probe }).__controlsTest = probe;
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
      const host = window as unknown as { __controlsTest?: typeof probe };
      if (host.__controlsTest === probe) delete host.__controlsTest;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setClearColor(0xc6a15a);
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xe7c48a, 22, 95);
    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 220);
    scene.add(new THREE.HemisphereLight(0xfff2d2, 0x6d8a3e, 0.95));
    const sun = new THREE.DirectionalLight(0xffe0a8, 1.15);
    sun.position.set(18, 36, 12);
    scene.add(sun);
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(90, 40),
      new THREE.MeshLambertMaterial({ color: 0xc49a48 }),
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const loader = new GLTFLoader();
    const tex = new THREE.TextureLoader();
    const sway: THREE.Object3D[] = [];
    let traveler: THREE.Object3D | null = null;
    let stagBill: THREE.Object3D | null = null;
    let brand: THREE.Object3D | null = null;
    const cards: THREE.Object3D[] = [];
    let alive = true;

    const loadModel = (url: string) =>
      new Promise<THREE.Group>((resolve, reject) => {
        loader.load(url, (gltf) => resolve(gltf.scene), undefined, reject);
      });

    function prep(source: THREE.Object3D, height: number, palette: string) {
      const object = source.clone(true);
      object.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;
        const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mesh.material = list.map((material) => {
          const next = material.clone() as THREE.MeshStandardMaterial;
          if ("color" in next) next.color = new THREE.Color(PALETTE[palette] ?? 0xffffff);
          return next;
        });
        mesh.castShadow = false;
        mesh.receiveShadow = false;
      });
      object.scale.setScalar(1);
      object.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(object);
      const size = box.getSize(new THREE.Vector3());
      const scale = height / Math.max(size.y, 0.001);
      object.scale.multiplyScalar(scale);
      object.updateMatrixWorld(true);
      const grounded = new THREE.Box3().setFromObject(object);
      object.position.y -= grounded.min.y;
      return object;
    }

    function card(name: ArtName, height: number) {
      const material = new THREE.MeshBasicMaterial({
        map: tex.load(`/wild/${name}.png`),
        transparent: true,
        alphaTest: 0.45,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
      mesh.scale.set(height * 0.7, height, 1);
      mesh.position.y = height / 2;
      return mesh;
    }

    void (async () => {
      const files = {
        grass: "/wild/vendor/kenney-nature/grass.glb",
        grassLarge: "/wild/vendor/kenney-nature/grass_large.glb",
        oak: "/wild/vendor/kenney-nature/tree_oak.glb",
        tree: "/wild/vendor/kenney-nature/tree_default.glb",
        rock: "/wild/vendor/kenney-nature/rock_largeA.glb",
        pebble: "/wild/vendor/kenney-nature/rock_smallA.glb",
        flower: "/wild/vendor/kenney-nature/flower_yellowA.glb",
        wall: "/wild/vendor/kenney-town/wall.glb",
        door: "/wild/vendor/kenney-town/wall-door.glb",
        roof: "/wild/vendor/kenney-town/roof-gable.glb",
        roofTop: "/wild/vendor/kenney-town/roof-gable-top.glb",
        banner: "/wild/vendor/kenney-town/banner-green.glb",
        lantern: "/wild/vendor/kenney-town/lantern.glb",
        chimney: "/wild/vendor/kenney-town/chimney.glb",
        traveler: "/wild/vendor/kenney-characters/character-a.glb",
      } as const;
      const loaded = Object.fromEntries(
        await Promise.all(Object.entries(files).map(async ([id, url]) => [id, await loadModel(url)])),
      ) as Record<keyof typeof files, THREE.Group>;
      if (!alive) return;

      const scatter = (kind: THREE.Object3D, height: number, palette: string, spots: [number, number][]) => {
        for (const [x, z] of spots) {
          const piece = prep(kind, height, palette);
          piece.position.x = x;
          piece.position.z = z;
          piece.rotation.y = (x * 13 + z * 7) % 6;
          scene.add(piece);
          if (palette === "leaf" || palette === "indigo") sway.push(piece);
        }
      };

      const grassSpots: [number, number][] = [];
      for (let i = 0; i < 90; i++) {
        const x = ((i * 17) % 46) - 8;
        const z = ((i * 11) % 34) - 10;
        if (Math.hypot(x - 11, z - 16) < 3) continue;
        grassSpots.push([x, z]);
      }
      scatter(loaded.grass, 0.7, "leaf", grassSpots.slice(0, 60));
      scatter(loaded.grassLarge, 1.15, "leaf", grassSpots.slice(60));
      scatter(loaded.oak, 4.2, "leaf", [
        [18, -6],
        [28, 12],
        [-6, -4],
        [40, 2],
      ]);
      scatter(loaded.tree, 3.4, "leaf", [
        [8, -8],
        [33, -5],
      ]);
      scatter(loaded.rock, 1.4, "stone", [
        [6, -2],
        [22, 14],
      ]);
      scatter(loaded.pebble, 0.45, "stone", [
        [4, 8],
        [15, 4],
        [9, 18],
      ]);
      scatter(loaded.flower, 0.55, "gold", [
        [12, 13],
        [10, 19],
        [-6, 13],
      ]);

      for (const house of HOUSES) {
        const group = new THREE.Group();
        const door = prep(loaded.door, 2.3, "wall");
        const back = prep(loaded.wall, 2.3, "wall");
        back.position.z = -2.2;
        back.rotation.y = Math.PI;
        const left = prep(loaded.wall, 2.3, "wall");
        left.position.x = -1.6;
        left.rotation.y = Math.PI / 2;
        const right = prep(loaded.wall, 2.3, "wall");
        right.position.x = 1.6;
        right.rotation.y = -Math.PI / 2;
        const roof = prep(loaded.roof, 1.4, "roof");
        roof.position.y = 2.15;
        const cap = prep(loaded.roofTop, 0.7, "roof");
        cap.position.y = 3.15;
        const banner = prep(loaded.banner, 1.5, "indigo");
        banner.position.set(0.9, 1.7, 0.4);
        sway.push(banner);
        const lantern = prep(loaded.lantern, 0.7, "bronze");
        lantern.position.set(-0.8, 1.3, 0.5);
        const chimney = prep(loaded.chimney, 1.1, "stone");
        chimney.position.set(-0.6, 2.8, -0.4);
        group.add(door, back, left, right, roof, cap, banner, lantern, chimney);
        group.position.set(house.x, 0, house.z);
        group.rotation.y = Math.atan2(-house.x, 6 - house.z);
        scene.add(group);
      }

      traveler = prep(loaded.traveler, 1.85, "vellum");
      scene.add(traveler);

      stagBill = card("stag", 2.3);
      brand = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 12, 10),
        new THREE.MeshBasicMaterial({ color: 0xffd27a }),
      );
      brand.position.set(0.42, 0.72, 0.05);
      stagBill.add(brand);
      scene.add(stagBill);

      const serif = card("serif", 0.9);
      serif.position.set(SERIF.x, 0, SERIF.z);
      const shrine = card("shrine", 5.2);
      shrine.position.set(SCRIPT.x, 0, SCRIPT.z);
      const spire = card("spire", 14);
      spire.position.set(SPIRE.x, 0, SPIRE.z);
      scene.add(serif, shrine, spire);
      cards.push(serif, shrine, spire, stagBill);
    })().catch((error) => {
      console.error("wild assets", error);
    });

    let last = performance.now();
    let frame = 0;
    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const held = keys.current;
      let forward = 0;
      let strafe = 0;
      if (held.has("KeyW")) forward += 1;
      if (held.has("KeyS")) forward -= 1;
      if (held.has("KeyD")) strafe += 1;
      if (held.has("KeyA")) strafe -= 1;
      let lookAmt = look.current;
      look.current = 0;
      if (held.has("ArrowLeft")) lookAmt -= 1.6;
      if (held.has("ArrowRight")) lookAmt += 1.6;
      const state = stateRef.current;
      stepWild(
        state,
        {
          forward,
          strafe,
          look: lookAmt,
          jumpHeld: held.has("Space"),
          hop: edges.current.hop,
          cut: edges.current.cut,
          talk: edges.current.talk,
        },
        dt,
      );
      if (edges.current.save) saveWild(state);
      if (edges.current.load) {
        const loaded = loadWild();
        if (loaded) stateRef.current = loaded;
      }
      edges.current = { cut: false, talk: false, hop: false, save: false, load: false };

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== Math.floor(width * renderer.getPixelRatio())) {
        renderer.setSize(width, height, false);
        camera.aspect = width / Math.max(height, 1);
        camera.updateProjectionMatrix();
      }
      const face = forwardFromYaw(state.camYaw);
      camera.position.set(state.x - face.x * 9, state.y + 5.2, state.z - face.z * 9);
      camera.lookAt(state.x, state.y + 1.3, state.z);
      if (traveler) {
        if (traveler.userData.baseScale === undefined) traveler.userData.baseScale = traveler.scale.x;
        const base = traveler.userData.baseScale as number;
        const cloak = state.fluttering ? 1.06 : 1;
        traveler.scale.setScalar(base * cloak);
        traveler.position.set(state.x, state.y, state.z);
        traveler.rotation.y = state.yaw + Math.PI;
      }
      if (stagBill) {
        stagBill.position.set(state.stagX, 0, state.stagZ);
        stagBill.lookAt(camera.position.x, stagBill.position.y + 1.1, camera.position.z);
      }
      if (brand) brand.visible = !state.stagFreed;
      for (const piece of sway) {
        piece.rotation.z = Math.sin(state.time * 1.8 + piece.position.x) * 0.18;
      }
      for (const piece of cards) {
        piece.lookAt(camera.position.x, piece.position.y + 1, camera.position.z);
      }
      if (objectiveRef.current) objectiveRef.current.textContent = objectiveLine(state);
      if (toastRef.current) {
        toastRef.current.textContent = state.toastLeft > 0 ? state.toast : "";
      }
      if (inkRef.current) inkRef.current.style.width = `${Math.round(state.stamina)}%`;
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-30 bg-[#c6a15a] text-[#24180f]" style={{ fontFamily: "Fraunces, serif" }}>
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          event.currentTarget.dataset.px = String(event.clientX);
        }}
        onPointerMove={(event) => {
          if (event.buttons !== 1) return;
          const prev = Number(event.currentTarget.dataset.px ?? event.clientX);
          look.current += (event.clientX - prev) * 0.005;
          event.currentTarget.dataset.px = String(event.clientX);
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-4 pt-4 text-center">
        <p className="text-2xl text-[#1c243f]">The Unwritten Wild</p>
        <p ref={objectiveRef} className="mt-1 text-sm text-[#3a2a18]" />
      </div>
      <Link
        to="/"
        className="absolute left-3 top-16 z-10 rounded-full bg-[#efe6d4]/90 px-3 py-2 text-xs tracking-[0.16em] uppercase"
      >
        Club
      </Link>
      <p ref={toastRef} className="pointer-events-none absolute inset-x-6 top-[68%] z-10 text-center text-sm text-[#3a2a18]" />
      <div className="pointer-events-none absolute bottom-24 left-4 z-10 w-44">
        <p className="text-xs uppercase tracking-[0.14em]">Ink</p>
        <div className="mt-1 h-3 rounded-full bg-[#3a2a18]/40">
          <div ref={inkRef} className="h-3 rounded-full bg-[#e2c36a]" style={{ width: "100%" }} />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex items-end justify-between gap-3 px-3 pb-[env(safe-area-inset-bottom)]">
        <p className="max-w-xl text-sm leading-snug text-[#3a2a18]">
          WASD move. A is left, D is right. Drag or the left and right arrows look. Space hops, hold it to flutter. K cuts. E speaks. Models by Kenney, CC0.
        </p>
        <div className="pointer-events-auto flex gap-2">
          <button type="button" className="h-14 min-w-14 rounded-full bg-[#2c2418] px-4 text-sm text-[#f3e6c8]" onPointerDown={() => { edges.current.talk = true; }}>
            E
          </button>
          <button type="button" className="h-16 min-w-16 rounded-full bg-[#f3e6c8] px-4 text-lg text-[#24305a]" onPointerDown={() => { edges.current.cut = true; }}>
            K
          </button>
        </div>
      </div>
    </div>
  );
}
