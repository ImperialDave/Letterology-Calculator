import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  CALDERA,
  HOUSES,
  SCRIPT,
  SERIF,
  SPIRE,
  contextPrompt,
  freshWild,
  forwardFromYaw,
  loadWild,
  objectiveLine,
  rightFromForward,
  saveWild,
  stepWild,
  type WildState,
} from "@/wild/sim";
import {
  cliffSpots,
  fitScale,
  HOUSE_FIT,
  OAK_SPOTS,
  PINE_SPOTS,
  ROCK_SPOTS,
  SHRINE_FIT,
  SOLID_R,
  SPIRE_FIT,
  type AssemblyTarget,
} from "@/wild/bodies";
import { HEIGHT_M } from "@/wild/scale";
import { FEN, SHEET, sheetVisible, terrainHeight, terrainRgb } from "@/wild/terrain";

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
  const ringRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLParagraphElement>(null);
  const pipsRef = useRef<HTMLParagraphElement>(null);
  const compassRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLParagraphElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const mapCanvasRef = useRef<HTMLCanvasElement>(null);
  const mapOpenRef = useRef(false);
  const lockRef = useRef(false);
  const pinsRef = useRef<{ x: number; z: number }[]>([]);
  const [mapOpen, setMapOpen] = useState(false);

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
      if (event.code === "KeyM") {
        mapOpenRef.current = !mapOpenRef.current;
        setMapOpen(mapOpenRef.current);
      }
      if (event.code === "Tab") {
        event.preventDefault();
        lockRef.current = !lockRef.current;
      }
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
    const ground = buildGround();
    scene.add(ground);
    scene.fog = new THREE.Fog(0xe7c48a, 28, 140);
    camera.far = 280;
    camera.updateProjectionMatrix();

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

    function recolor(object: THREE.Object3D, palette: string) {
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
    }

    /** Scale a mesh to a meter height, stand a flat one up, and keep the offset on a child so later placement cannot wipe it. */
    function prep(source: THREE.Object3D, meters: number, palette: string, mode: "height" | "stand" = "height") {
      const inner = source.clone(true);
      recolor(inner, palette);
      inner.position.set(0, 0, 0);
      inner.rotation.set(0, 0, 0);
      inner.scale.setScalar(1);
      inner.updateMatrixWorld(true);
      if (mode === "stand") {
        const lying = new THREE.Box3().setFromObject(inner).getSize(new THREE.Vector3());
        if (lying.z >= lying.y && lying.z >= lying.x) inner.rotation.x = -Math.PI / 2;
        else if (lying.x > lying.y && lying.x >= lying.z) inner.rotation.z = Math.PI / 2;
        inner.updateMatrixWorld(true);
      }
      const sized = new THREE.Box3().setFromObject(inner).getSize(new THREE.Vector3());
      inner.scale.setScalar(meters / Math.max(sized.y, 0.001));
      inner.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(inner);
      const center = box.getCenter(new THREE.Vector3());
      inner.position.set(-center.x, -box.min.y, -center.z);
      const holder = new THREE.Group();
      holder.add(inner);
      return holder;
    }

    function piece(
      source: THREE.Object3D,
      palette: string,
      fit: { span?: number; height?: number; width?: number; depth?: number; pitch?: number },
    ) {
      const inner = source.clone(true);
      recolor(inner, palette);
      inner.position.set(0, 0, 0);
      inner.rotation.set(0, 0, 0);
      inner.scale.setScalar(1);
      inner.updateMatrixWorld(true);
      const size = new THREE.Box3().setFromObject(inner).getSize(new THREE.Vector3());
      if (fit.width && fit.depth && fit.pitch) {
        inner.scale.set(fit.width / Math.max(size.x, 0.001), fit.pitch / Math.max(size.y, 0.001), fit.depth / Math.max(size.z, 0.001));
      } else if (fit.span) {
        inner.scale.setScalar(fit.span / Math.max(size.x, size.z, 0.001));
      } else {
        inner.scale.setScalar((fit.height ?? 1) / Math.max(size.y, 0.001));
      }
      inner.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(inner);
      const center = box.getCenter(new THREE.Vector3());
      inner.position.set(-center.x, -box.min.y, -center.z);
      const holder = new THREE.Group();
      holder.add(inner);
      return holder;
    }

    function fitAssembly(group: THREE.Group, target: AssemblyTarget, x: number, z: number, yaw: number) {
      group.position.set(0, 0, 0);
      group.rotation.set(0, 0, 0);
      group.scale.set(1, 1, 1);
      group.updateMatrixWorld(true);
      const size = new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3());
      group.scale.setScalar(fitScale({ y: size.y, xz: Math.max(size.x, size.z) }, target));
      group.rotation.y = yaw;
      group.updateMatrixWorld(true);
      const seated = new THREE.Box3().setFromObject(group);
      group.position.set(x, terrainHeight(x, z) - seated.min.y, z);
      scene.add(group);
      return group;
    }

    function card(name: ArtName, height: number) {
      const material = new THREE.MeshBasicMaterial({
        map: tex.load(`/wild/${name}.png`),
        transparent: true,
        alphaTest: 0.45,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
      mesh.scale.set(height * 0.62, height, 1);
      mesh.position.y = height / 2;
      tex.load(`/wild/${name}.png`, (texture) => {
        material.map = texture;
        const aspect = (texture.image as { width: number; height: number }).width / (texture.image as { height: number }).height;
        mesh.scale.set(height * aspect, height, 1);
        material.needsUpdate = true;
      });
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
        bush: "/wild/vendor/kenney-nature/plant_bush.glb",
        bushLarge: "/wild/vendor/kenney-nature/plant_bushLarge.glb",
        cliff: "/wild/vendor/kenney-nature/cliff_rock.glb",
        cliffLarge: "/wild/vendor/kenney-nature/cliff_large_rock.glb",
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

      const scatter = (
        kind: THREE.Object3D,
        height: number,
        palette: string,
        spots: [number, number][],
        wind = false,
        mode: "height" | "stand" = "height",
      ) => {
        for (const [x, z] of spots) {
          const prop = prep(kind, height, palette, mode);
          prop.position.set(x, terrainHeight(x, z), z);
          prop.rotation.y = (x * 13 + z * 7) % 6;
          scene.add(prop);
          if (wind) sway.push(prop);
        }
      };

      const grassSpots: [number, number][] = [];
      for (let i = 0; i < 90; i++) {
        const x = ((i * 17) % 46) - 8;
        const z = ((i * 11) % 34) - 10;
        if (HOUSES.some((house) => Math.hypot(x - house.x, z - house.z) < SOLID_R.house + 0.6)) continue;
        grassSpots.push([x, z]);
      }
      scatter(loaded.grass, HEIGHT_M.grass, "leaf", grassSpots.slice(0, 70), true);
      scatter(loaded.grassLarge, HEIGHT_M.grassLarge, "leaf", grassSpots.slice(70), true);
      scatter(loaded.oak, HEIGHT_M.oak, "leaf", OAK_SPOTS);
      scatter(loaded.tree, HEIGHT_M.tree, "leaf", PINE_SPOTS);
      scatter(loaded.bush, HEIGHT_M.bush, "leaf", [
        [14, 8],
        [20, 1],
        [-4, 10],
      ], true);
      scatter(loaded.bushLarge, HEIGHT_M.bushLarge, "leaf", [
        [36, 6],
        [48, -8],
      ], true);
      scatter(loaded.rock, HEIGHT_M.rock, "stone", ROCK_SPOTS, false, "stand");
      scatter(loaded.pebble, HEIGHT_M.rockSmall, "stone", [
        [4, 8],
        [15, 4],
        [9, 18],
      ]);
      scatter(loaded.flower, HEIGHT_M.flower, "gold", [
        [12, 13],
        [10, 19],
        [-6, 13],
      ], true);
      for (const cliff of cliffSpots()) {
        const prop = prep(cliff.large ? loaded.cliffLarge : loaded.cliff, cliff.large ? HEIGHT_M.cliffLarge : HEIGHT_M.cliff, "stone");
        prop.position.set(cliff.x, terrainHeight(cliff.x, cliff.z), cliff.z);
        prop.rotation.y = cliff.yaw;
        scene.add(prop);
      }

      const cottage = () => {
        const group = new THREE.Group();
        const span = 2.7;
        const front = span / 2;
        const door = piece(loaded.door, "wall", { span });
        door.rotation.y = Math.PI / 2;
        door.position.set(-span / 2, 0, front);
        const frontWall = piece(loaded.wall, "wall", { span });
        frontWall.rotation.y = Math.PI / 2;
        frontWall.position.set(span / 2, 0, front);
        const backL = piece(loaded.wall, "wall", { span });
        backL.rotation.y = Math.PI / 2;
        backL.position.set(-span / 2, 0, -front);
        const backR = piece(loaded.wall, "wall", { span });
        backR.rotation.y = Math.PI / 2;
        backR.position.set(span / 2, 0, -front);
        const left = piece(loaded.wall, "wall", { span });
        left.position.set(-span, 0, 0);
        const right = piece(loaded.wall, "wall", { span });
        right.position.set(span, 0, 0);
        const roof = piece(loaded.roof, "roof", { width: 6, depth: 3.4, pitch: 1.5 });
        roof.position.y = span;
        const cap = piece(loaded.roofTop, "roof", { width: 2.2, depth: 1.2, pitch: 0.55 });
        cap.position.y = span + 1.5;
        const banner = piece(loaded.banner, "indigo", { height: HEIGHT_M.banner });
        banner.position.set(1.35, 1.15, front + 0.15);
        sway.push(banner);
        const lantern = piece(loaded.lantern, "bronze", { height: HEIGHT_M.lantern });
        lantern.position.set(-0.35, 0, front + 0.3);
        const chimney = piece(loaded.chimney, "stone", { height: HEIGHT_M.chimney });
        chimney.position.set(-1.5, span + 0.45, -0.25);
        group.add(door, frontWall, backL, backR, left, right, roof, cap, banner, lantern, chimney);
        return group;
      };
      for (const house of HOUSES) {
        fitAssembly(cottage(), HOUSE_FIT, house.x, house.z, Math.atan2(-house.x, 6 - house.z));
      }

      const scriptorium = new THREE.Group();
      {
        const span = 3.6;
        const back = piece(loaded.wall, "wall", { span: 4.2 });
        back.rotation.y = Math.PI / 2;
        back.position.set(0, 0, -span / 2);
        const left = piece(loaded.wall, "wall", { span });
        left.position.set(-2.1, 0, 0);
        const right = piece(loaded.wall, "wall", { span });
        right.position.set(2.1, 0, 0);
        const roof = piece(loaded.roof, "roof", { width: 4.8, depth: 4.0, pitch: 1.1 });
        roof.position.y = 3.5;
        const banner = piece(loaded.banner, "indigo", { height: HEIGHT_M.banner });
        banner.position.set(1.5, 1.3, span / 2);
        sway.push(banner);
        const lantern = piece(loaded.lantern, "bronze", { height: HEIGHT_M.lantern });
        lantern.position.set(-1.5, 0, span / 2);
        scriptorium.add(back, left, right, roof, banner, lantern);
      }
      fitAssembly(scriptorium, SHRINE_FIT, SCRIPT.x, SCRIPT.z, -Math.PI / 2);

      const tower = new THREE.Group();
      {
        const stone = new THREE.MeshStandardMaterial({ color: PALETTE.stone, roughness: 0.9 });
        const bronze = new THREE.MeshStandardMaterial({ color: PALETTE.bronze, roughness: 0.45 });
        const gold = new THREE.MeshStandardMaterial({ color: PALETTE.gold, roughness: 0.4 });
        const base = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.35, 2.6, 8), stone);
        base.position.y = 1.3;
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.55, 14.2, 8), stone);
        shaft.position.y = 2.6 + 7.1;
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 1.15, 3.4, 8), stone);
        neck.position.y = 16.8 + 1.7;
        const bell = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 0.78, 1.35, 8), bronze);
        bell.position.y = 20.2 + 0.675;
        const cap = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.35, 8), gold);
        cap.position.y = 21.55 + 0.675;
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.07, 8, 18), bronze);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 16.2;
        const lantern = piece(loaded.lantern, "bronze", { height: 0.7 });
        lantern.position.set(1.35, 12.4, 0);
        const banner = piece(loaded.banner, "indigo", { height: 1.6 });
        banner.position.set(-1.25, 14.2, 0.15);
        sway.push(banner);
        tower.add(base, shaft, neck, bell, cap, ring, lantern, banner);
      }
      fitAssembly(tower, SPIRE_FIT, SPIRE.x, SPIRE.z, 0);

      traveler = prep(loaded.traveler, HEIGHT_M.traveler, "vellum");
      scene.add(traveler);

      stagBill = card("stag", HEIGHT_M.stag);
      brand = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 12, 10),
        new THREE.MeshBasicMaterial({ color: 0xffd27a }),
      );
      brand.position.set(0.42, 0.72, 0.05);
      stagBill.add(brand);
      scene.add(stagBill);

      const serif = card("serif", HEIGHT_M.serif);
      serif.position.set(SERIF.x, terrainHeight(SERIF.x, SERIF.z) + HEIGHT_M.serif / 2, SERIF.z);
      const lens = new THREE.Mesh(
        new THREE.CircleGeometry(12, 28),
        new THREE.MeshBasicMaterial({ color: 0x1d3c66, transparent: true, opacity: 0.85 }),
      );
      lens.rotation.x = -Math.PI / 2;
      lens.position.set(FEN.x, terrainHeight(FEN.x, FEN.z) + 0.15, FEN.z);
      const caldera = new THREE.Mesh(
        new THREE.RingGeometry(8, 16, 28),
        new THREE.MeshBasicMaterial({ color: 0xc46a28, side: THREE.DoubleSide }),
      );
      caldera.rotation.x = -Math.PI / 2;
      caldera.position.set(CALDERA.x, terrainHeight(CALDERA.x, CALDERA.z) + 0.4, CALDERA.z);
      scene.add(lens, caldera, serif);
      cards.push(serif, stagBill);
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
      if (lockRef.current && !state.stagFreed) {
        state.camYaw = Math.atan2(-(state.stagX - state.x), -(state.stagZ - state.z));
        lookAmt = 0;
      }
      if (!mapOpenRef.current) {
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
      }
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
        const gy = terrainHeight(state.stagX, state.stagZ);
        stagBill.position.set(state.stagX, gy + HEIGHT_M.stag / 2, state.stagZ);
        stagBill.lookAt(camera.position.x, stagBill.position.y, camera.position.z);
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
      if (ringRef.current) {
        const deg = Math.round((state.stamina / 100) * 360);
        ringRef.current.style.background = `conic-gradient(#e2c36a ${deg}deg, rgba(36,24,15,0.25) ${deg}deg)`;
      }
      if (promptRef.current) promptRef.current.textContent = contextPrompt(state) ?? "";
      if (pipsRef.current) {
        const near = !state.stagFreed && Math.hypot(state.x - state.stagX, state.z - state.stagZ) < 16;
        pipsRef.current.textContent = near ? "●".repeat(3 - state.stagHits) + "○".repeat(state.stagHits) : "";
      }
      if (titleRef.current) titleRef.current.style.opacity = state.time < 6 ? "1" : "0";
      if (hintRef.current) hintRef.current.style.display = state.time < 8 ? "block" : "none";
      if (compassRef.current && !mapOpenRef.current) paintCompass(compassRef.current, state);
      if (mapOpenRef.current && mapCanvasRef.current) paintSheet(mapCanvasRef.current, state, pinsRef.current);
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
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-4 pt-3 text-center">
        <p ref={titleRef} className="text-2xl text-[#1c243f] transition-opacity">The Unwritten Wild</p>
        <div ref={compassRef} className="relative mx-auto mt-1 h-8 max-w-md" hidden={mapOpen} />
        <p ref={objectiveRef} className="mt-1 text-sm text-[#3a2a18]" />
        <p ref={pipsRef} className="mt-1 text-lg tracking-[0.4em] text-[#8d5a32]" />
      </div>
      <Link
        to="/"
        className="absolute left-3 top-3 z-10 rounded-full bg-[#efe6d4]/90 px-3 py-2 text-xs tracking-[0.16em] uppercase"
      >
        Club
      </Link>
      <p ref={toastRef} className="pointer-events-none absolute inset-x-6 top-[62%] z-10 text-center text-sm text-[#3a2a18]" />
      <p ref={hintRef} className="pointer-events-none absolute inset-x-4 bottom-24 z-10 text-center text-sm text-[#3a2a18]">
        WASD move. A is left, D is right. Drag to look. M opens the sheet.
      </p>
      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex items-end justify-between gap-3 px-3 pb-[env(safe-area-inset-bottom)]">
        <button
          type="button"
          className="pointer-events-auto h-12 rounded-full bg-[#efe6d4]/90 px-4 text-xs tracking-[0.16em] uppercase"
          onClick={() => {
            mapOpenRef.current = !mapOpenRef.current;
            setMapOpen(mapOpenRef.current);
          }}
        >
          Map
        </button>
        <p ref={promptRef} className="mb-3 text-sm text-[#1c243f]" />
        <div className="pointer-events-auto flex items-end gap-2">
          <button type="button" className="h-12 min-w-12 rounded-full bg-[#2c2418] px-3 text-sm text-[#f3e6c8]" onPointerDown={() => { edges.current.talk = true; }}>
            E
          </button>
          <button
            type="button"
            className="mb-2 h-10 rounded-full bg-[#efe6d4] px-3 text-xs uppercase"
            onClick={() => {
              lockRef.current = !lockRef.current;
            }}
          >
            Lock
          </button>
          <div className="relative h-20 w-20">
            <div ref={ringRef} className="absolute inset-0 rounded-full" />
            <button type="button" className="absolute inset-2 rounded-full bg-[#f3e6c8] text-2xl text-[#24305a]" onPointerDown={() => { edges.current.cut = true; }}>
              K
            </button>
          </div>
        </div>
      </div>
      {mapOpen ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#24180f]/50 p-4">
          <div className="w-full max-w-3xl rounded-lg bg-[#f3e6c8] p-3 shadow-lg">
            <div className="mb-2 flex items-center justify-between text-sm text-[#3a2a18]">
              <span>Vellum sheet</span>
              <button
                type="button"
                className="rounded-full px-3 py-1 uppercase tracking-[0.14em]"
                onClick={() => {
                  mapOpenRef.current = false;
                  setMapOpen(false);
                }}
              >
                Close
              </button>
            </div>
            <canvas
              ref={mapCanvasRef}
              className="h-[70vh] w-full touch-none rounded bg-[#efe2c4]"
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                const u = (event.clientX - rect.left) / rect.width;
                const v = (event.clientY - rect.top) / rect.height;
                const x = SHEET.x0 + u * (SHEET.x1 - SHEET.x0);
                const z = SHEET.z1 - v * (SHEET.z1 - SHEET.z0);
                const state = stateRef.current;
                if (!sheetVisible(x, z, state.x, state.z, state.spireReached)) return;
                pinsRef.current = [...pinsRef.current, { x, z }].slice(-8);
              }}
            />
            <p className="mt-2 text-center text-xs text-[#3a2a18]">Tap the known ground to drop an ink pin. Climb the spire to stamp the steppe.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function buildGround() {
  const x0 = -50;
  const x1 = 280;
  const z0 = -80;
  const z1 = 90;
  const step = 4;
  const nx = Math.ceil((x1 - x0) / step);
  const nz = Math.ceil((z1 - z0) / step);
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  for (let iz = 0; iz <= nz; iz++) {
    for (let ix = 0; ix <= nx; ix++) {
      const x = x0 + ix * step;
      const z = z0 + iz * step;
      const [r, g, b] = terrainRgb(x, z);
      positions.push(x, terrainHeight(x, z), z);
      colors.push(r, g, b);
    }
  }
  const row = nx + 1;
  for (let iz = 0; iz < nz; iz++) {
    for (let ix = 0; ix < nx; ix++) {
      const a = iz * row + ix;
      indices.push(a, a + row, a + 1, a + 1, a + row, a + row + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
}

function paintCompass(host: HTMLDivElement, state: WildState) {
  host.replaceChildren();
  const forward = forwardFromYaw(state.camYaw);
  const right = rightFromForward(forward);
  const marks = [
    { id: "N", x: state.x, z: state.z - 80, label: "N", show: true },
    { id: "spire", x: SPIRE.x, z: SPIRE.z, label: "Spire", show: true },
    { id: "stag", x: state.stagX, z: state.stagZ, label: "Stag", show: !state.stagFreed },
    { id: "serif", x: SERIF.x, z: SERIF.z, label: "Serif", show: state.serif === 0 },
    { id: "caldera", x: CALDERA.x, z: CALDERA.z, label: "Caldera", show: state.spireReached },
  ];
  for (const mark of marks) {
    if (!mark.show) continue;
    const dx = mark.x - state.x;
    const dz = mark.z - state.z;
    const len = Math.hypot(dx, dz) || 1;
    const side = (dx * right.x + dz * right.z) / len;
    const ahead = (dx * forward.x + dz * forward.z) / len;
    const angle = Math.atan2(side, ahead);
    if (Math.abs(angle) > 1.15) continue;
    const el = document.createElement("span");
    el.className = "absolute top-0 text-[11px] text-[#1c243f]";
    el.style.left = `${50 + (angle / Math.PI) * 42}%`;
    el.textContent = mark.id === "N" ? "N" : `${mark.label} ${Math.round(len)}`;
    host.appendChild(el);
  }
}

function paintSheet(canvas: HTMLCanvasElement, state: WildState, pins: { x: number; z: number }[]) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if (canvas.width !== Math.floor(width * dpr)) {
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "#f4e7c8";
  ctx.fillRect(0, 0, width, height);
  const cols = 90;
  const rows = 60;
  for (let iy = 0; iy < rows; iy++) {
    for (let ix = 0; ix < cols; ix++) {
      const x = SHEET.x0 + ((ix + 0.5) / cols) * (SHEET.x1 - SHEET.x0);
      const z = SHEET.z1 - ((iy + 0.5) / rows) * (SHEET.z1 - SHEET.z0);
      if (!sheetVisible(x, z, state.x, state.z, state.spireReached)) continue;
      const [r, g, b] = terrainRgb(x, z);
      ctx.fillStyle = `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
      ctx.fillRect((ix / cols) * width, (iy / rows) * height, width / cols + 1, height / rows + 1);
    }
  }
  const dot = (x: number, z: number, color: string, label: string) => {
    if (!sheetVisible(x, z, state.x, state.z, state.spireReached)) return;
    const px = ((x - SHEET.x0) / (SHEET.x1 - SHEET.x0)) * width;
    const py = ((SHEET.z1 - z) / (SHEET.z1 - SHEET.z0)) * height;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#24180f";
    ctx.font = "12px Fraunces, serif";
    ctx.fillText(label, px + 6, py - 4);
  };
  dot(SPIRE.x, SPIRE.z, "#8d5a32", "Spire");
  if (!state.stagFreed) dot(state.stagX, state.stagZ, "#c45a2a", "Stag");
  if (state.serif === 0) dot(SERIF.x, SERIF.z, "#e2c36a", "Serif");
  dot(SCRIPT.x, SCRIPT.z, "#2a3a72", "Script");
  for (const pin of pins) dot(pin.x, pin.z, "#24180f", "Pin");
  const px = ((state.x - SHEET.x0) / (SHEET.x1 - SHEET.x0)) * width;
  const py = ((SHEET.z1 - state.z) / (SHEET.z1 - SHEET.z0)) * height;
  const face = forwardFromYaw(state.yaw);
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(Math.atan2(face.x, -face.z));
  ctx.fillStyle = "#1c243f";
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(5, 6);
  ctx.lineTo(-5, 6);
  ctx.fill();
  ctx.restore();
}
