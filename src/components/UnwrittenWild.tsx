import { Link } from "@tanstack/react-router";
import { Map as MapIcon, X } from "lucide-react";
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
import { PROPS } from "@/wild/props";
import { HEIGHT_M } from "@/wild/scale";
import { drawSheet, sheetFrame, sheetUnproject } from "@/wild/sheet";
import { FEN, FORD, onFord, riverCenter, sheetVisible, terrainHeight, terrainRgb, trailDistance } from "@/wild/terrain";
import { toonGradient, toonify, toonMaterial } from "@/wild/toon";

const PALETTE: Record<string, number> = {
  leaf: 0x7cba4a,
  stone: 0xe4d8c4,
  wall: 0xf4ead4,
  roof: 0xc46a3a,
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
  const lockButtonRef = useRef<HTMLButtonElement>(null);
  const mapOpenRef = useRef(false);
  const lockRef = useRef(false);
  const stick = useRef({ on: false, id: -1, ox: 0, oy: 0, x: 0, y: 0 });
  const stickEl = useRef<HTMLDivElement>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const pinsRef = useRef<{ x: number; z: number }[]>([]);
  const [mapOpen, setMapOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuOpenRef = useRef(false);
  const verbButtonRef = useRef<HTMLButtonElement>(null);

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
      if (event.code === "Escape" && document.pointerLockElement == null) {
        menuOpenRef.current = !menuOpenRef.current;
        setMenuOpen(menuOpenRef.current);
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
    renderer.setClearColor(0x8ec8e8);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 280);
    scene.add(new THREE.HemisphereLight(0x8ec8e8, 0x7cba4a, 0.55));
    const sun = new THREE.DirectionalLight(0xfff1d0, 1.45);
    sun.position.set(18, 36, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 2;
    sun.shadow.camera.far = 70;
    sun.shadow.camera.left = -22;
    sun.shadow.camera.right = 22;
    sun.shadow.camera.top = 22;
    sun.shadow.camera.bottom = -22;
    sun.shadow.bias = -0.0008;
    scene.add(sun);
    scene.add(sun.target);
    scene.add(buildSky());
    const ground = buildGround();
    scene.add(ground);
    const cameraRay = new THREE.Raycaster();
    scene.fog = new THREE.Fog(0x8ec8e8, 55, 190);

    const loader = new GLTFLoader();
    const tex = new THREE.TextureLoader();
    const sway: THREE.Object3D[] = [];
    let traveler: THREE.Object3D | null = null;
    let mageMixer: { update: (d: number) => void; show: (name: string, once: boolean) => void } | null = null;
    let stepClock = 0;
    let landPlayed = false;
    let stagHitPlayed = false;
    const tone = (freq: number, dur: number, gain: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      const osc = audio.createOscillator();
      const amp = audio.createGain();
      osc.frequency.value = freq;
      amp.gain.setValueAtTime(gain, audio.currentTime);
      amp.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur);
      osc.connect(amp);
      amp.connect(audio.destination);
      osc.start();
      osc.stop(audio.currentTime + dur);
    };
    let stagBill: THREE.Object3D | null = null;
    let stagClips: { update: (d: number) => void; show: (name: string, once: boolean) => void } | null = null;
    const grassWind: { value: number }[] = [];
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
    function prep(source: THREE.Object3D, meters: number, palette: string, mode: "height" | "stand" | "longest" = "height") {
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
      const basis = mode === "longest" ? Math.max(sized.x, sized.y, sized.z) : sized.y;
      inner.scale.setScalar(meters / Math.max(basis, 0.001));
      inner.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(inner);
      const center = box.getCenter(new THREE.Vector3());
      inner.position.set(-center.x, -box.min.y, -center.z);
      const holder = new THREE.Group();
      holder.add(inner);
      toonify(holder, meters >= 0.8, meters > 4 ? 0.05 : 0.028);
      if (meters < 0.8) {
        holder.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (mesh.isMesh) mesh.castShadow = false;
        });
      }
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
      toonify(holder, true, 0.04);
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
        bridge: "/wild/vendor/kenney-nature/bridge_wood.glb",
        path: "/wild/vendor/kenney-nature/path_stone.glb",
        log: "/wild/vendor/kenney-nature/log.glb",
        stump: "/wild/vendor/kenney-nature/stump_round.glb",
        mushroom: "/wild/vendor/kenney-nature/mushroom_tanGroup.glb",
        flowerRed: "/wild/vendor/kenney-nature/flower_redA.glb",
        flowerPurple: "/wild/vendor/kenney-nature/flower_purpleA.glb",
        tent: "/wild/vendor/kenney-nature/tent_smallOpen.glb",
        column: "/wild/vendor/kenney-nature/statue_column.glb",
        pit: "/wild/vendor/kenney-survival/campfire-pit.glb",
        fence: "/wild/vendor/kenney-town/fence.glb",
        gate: "/wild/vendor/kenney-town/fence-gate.glb",
        cart: "/wild/vendor/kenney-town/cart.glb",
        stall: "/wild/vendor/kenney-town/stall.glb",
        bench: "/wild/vendor/kenney-town/stall-bench.glb",
        fountain: "/wild/vendor/kenney-town/fountain-round.glb",
        hedge: "/wild/vendor/kenney-town/hedge.glb",
        barrel: "/wild/vendor/kenney-survival/barrel.glb",
        chest: "/wild/vendor/kenney-survival/chest.glb",
        box: "/wild/vendor/kenney-survival/box.glb",
        signpost: "/wild/vendor/kenney-survival/signpost.glb",
        workbench: "/wild/vendor/kenney-survival/workbench.glb",
        wall: "/wild/vendor/kenney-town/wall.glb",
        door: "/wild/vendor/kenney-town/wall-door.glb",
        roof: "/wild/vendor/kenney-town/roof-gable.glb",
        roofTop: "/wild/vendor/kenney-town/roof-gable-top.glb",
        banner: "/wild/vendor/kenney-town/banner-green.glb",
        lantern: "/wild/vendor/kenney-town/lantern.glb",
        chimney: "/wild/vendor/kenney-town/chimney.glb",
        candle: "/wild/vendor/kaykit-dungeon/candle_lit.glb",
        torch: "/wild/vendor/kaykit-dungeon/torch_lit.glb",
        bannerBlue: "/wild/vendor/kaykit-dungeon/banner_patternA_blue.glb",
        table: "/wild/vendor/kaykit-dungeon/table_small_decorated_A.glb",
        chair: "/wild/vendor/kaykit-dungeon/chair.glb",
        shelf: "/wild/vendor/kaykit-dungeon/shelf_small_candles.glb",
        tableCloth: "/wild/vendor/kaykit-dungeon/table_medium_tablecloth.glb",
        bottle: "/wild/vendor/kaykit-dungeon/bottle_A_green.glb",
        jug: "/wild/vendor/kaykit-dungeon/bottle_C_brown.glb",
        coins: "/wild/vendor/kaykit-dungeon/coin_stack_small.glb",
        crates: "/wild/vendor/kaykit-dungeon/crates_stacked.glb",
        barrelStack: "/wild/vendor/kaykit-dungeon/barrel_small_stack.glb",
        pillarDecor: "/wild/vendor/kaykit-dungeon/pillar_decorated.glb",
        chestGold: "/wild/vendor/kaykit-dungeon/chest_gold.glb",
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
        mode: "height" | "stand" | "longest" = "height",
      ) => {
        for (const [x, z] of spots) {
          const prop = prep(kind, height, palette, mode);
          prop.position.set(x, terrainHeight(x, z), z);
          prop.rotation.y = (x * 13 + z * 7) % 6;
          scene.add(prop);
          if (wind) sway.push(prop);
        }
      };

      const tuft = prep(loaded.grass, HEIGHT_M.grass, "leaf");
      tuft.updateMatrixWorld(true);
      let grassGeo: THREE.BufferGeometry | null = null;
      tuft.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh || mesh.name === "outline" || grassGeo) return;
        grassGeo = mesh.geometry.clone();
        grassGeo.applyMatrix4(mesh.matrixWorld);
      });
      if (grassGeo) {
        const spots: [number, number][] = [];
        for (let x = -36; x <= 168; x += 2.15) {
          for (let z = -50; z <= 48; z += 2.15) {
            const px = x + ((Math.imul(x * 10, 13) ^ Math.imul(z * 10, 7)) % 9) * 0.06;
            const pz = z + ((Math.imul(x * 10, 3) ^ Math.imul(z * 10, 11)) % 9) * 0.06;
            if (trailDistance(px, pz) < 1.35 && pz < 40 && px < 150) continue;
            if (onFord(px, pz)) continue;
            if (HOUSES.some((house) => Math.hypot(px - house.x, pz - house.z) < SOLID_R.house)) continue;
            spots.push([px, pz]);
          }
        }
        const grassMat = toonMaterial(PALETTE.leaf);
        grassMat.onBeforeCompile = (shader) => {
          shader.uniforms.uTime = { value: 0 };
          grassWind.push(shader.uniforms.uTime);
          shader.vertexShader = shader.vertexShader.replace(
            "#include <begin_vertex>",
            `#include <begin_vertex>
             float blade = max(transformed.y, 0.0);
             #ifdef USE_INSTANCING
               vec4 planted = instanceMatrix * vec4(position, 1.0);
               float gust = sin(uTime * 1.7 + planted.x * 0.45);
             #else
               float gust = sin(uTime * 1.7);
             #endif
             transformed.x += gust * blade * 0.55;`,
          );
        };
        const field = new THREE.InstancedMesh(grassGeo, grassMat, spots.length);
        field.castShadow = false;
        field.receiveShadow = true;
        const dummy = new THREE.Object3D();
        spots.forEach(([px, pz], index) => {
          dummy.position.set(px, terrainHeight(px, pz), pz);
          dummy.rotation.y = (px * 13 + pz * 7) % 6;
          dummy.scale.setScalar(0.85 + ((index * 17) % 10) * 0.03);
          dummy.updateMatrix();
          field.setMatrixAt(index, dummy.matrix);
        });
        field.instanceMatrix.needsUpdate = true;
        scene.add(field);
      }
      scatter(loaded.grassLarge, HEIGHT_M.grassLarge, "leaf", [
        [12, 4],
        [24, 8],
        [-10, 8],
        [40, -6],
        [70, 4],
        [96, 2],
      ], true);
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

      for (const item of PROPS) {
        if (!item.file) continue;
        const source = loaded[item.file as keyof typeof loaded];
        const prop = prep(source, item.meters, item.palette, item.mode);
        prop.position.set(item.x, terrainHeight(item.x, item.z), item.z);
        prop.rotation.y = item.yaw ?? 0;
        scene.add(prop);
        if (item.wind) sway.push(prop);
      }
      const fordZ = riverCenter(FORD.x);
      const deck = piece(loaded.bridge, "roof", { width: FORD.halfX * 2, depth: FORD.halfZ * 2, pitch: 0.42 });
      deck.position.set(FORD.x, terrainHeight(FORD.x, fordZ), fordZ);
      scene.add(deck);
      for (let i = 1; i <= 7; i++) {
        const t = i / 9;
        const x = 2 + (112 - 2) * t + 1.4;
        const z = 6 + (0 - 6) * t;
        const stone = prep(loaded.path, 1.15, "stone", "longest");
        stone.position.set(x, terrainHeight(x, z), z);
        stone.rotation.y = t * 3;
        scene.add(stone);
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
        const stone = toonMaterial(PALETTE.stone);
        const bronze = toonMaterial(PALETTE.bronze);
        const gold = toonMaterial(PALETTE.gold);
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
      toonify(tower, true, 0.06);
      fitAssembly(tower, SPIRE_FIT, SPIRE.x, SPIRE.z, 0);

      const mageGltf = await new Promise<{ scene: THREE.Group; animations: THREE.AnimationClip[] }>((resolve, reject) => {
        loader.load("/wild/vendor/kaykit/Mage.glb", (gltf) => resolve(gltf), undefined, reject);
      });
      const mage = mageGltf.scene;
      toonify(mage, true, 0.035);
      mage.updateMatrixWorld(true);
      const fitted = new THREE.Box3().setFromObject(mage);
      const mageScale = HEIGHT_M.traveler / Math.max(fitted.max.y - fitted.min.y, 0.001);
      mage.scale.setScalar(mageScale);
      mage.position.y = -fitted.min.y * mageScale;
      traveler = new THREE.Group();
      traveler.add(mage);
      scene.add(traveler);
      const mixer = new THREE.AnimationMixer(mage);
      const actions: Record<string, THREE.AnimationAction> = {};
      for (const clip of mageGltf.animations) actions[clip.name] = mixer.clipAction(clip);
      let showing = "";
      const showClip = (name: string, once: boolean) => {
        const next = actions[name];
        if (!next || showing === name) return;
        next.reset().fadeIn(0.16).play();
        next.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity);
        next.clampWhenFinished = once;
        if (showing && actions[showing]) actions[showing].fadeOut(0.16);
        showing = name;
      };
      mageMixer = { update: (d) => mixer.update(d), show: showClip };

      const stagGltf = await new Promise<{ scene: THREE.Group; animations: THREE.AnimationClip[] }>((resolve, reject) => {
        loader.load("/wild/vendor/quaternius/stag.glb", (gltf) => resolve(gltf), undefined, reject);
      });
      const stag = stagGltf.scene;
      toonify(stag, true, 0.03);
      stag.updateMatrixWorld(true);
      const stagBox = new THREE.Box3().setFromObject(stag);
      const stagH = Math.max(stagBox.max.y - stagBox.min.y, 0.001);
      const stagScale = 1.7 / stagH;
      stag.scale.setScalar(stagScale);
      stag.position.y = -stagBox.min.y * stagScale;
      stagBill = new THREE.Group();
      stagBill.add(stag);
      brand = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 12, 10),
        new THREE.MeshBasicMaterial({ color: 0xffd27a }),
      );
      brand.position.set(0, 1.35, 0.42);
      stagBill.add(brand);
      scene.add(stagBill);
      const stagMixer = new THREE.AnimationMixer(stag);
      const stagActions: Record<string, THREE.AnimationAction> = {};
      for (const clip of stagGltf.animations) {
        if (!stagActions[clip.name]) stagActions[clip.name] = stagMixer.clipAction(clip);
      }
      let stagShowing = "";
      stagClips = {
        update: (d) => stagMixer.update(d),
        show: (name, once) => {
          const next = stagActions[name];
          if (!next || stagShowing === name) return;
          next.reset().fadeIn(0.12).play();
          next.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity);
          next.clampWhenFinished = once;
          if (stagShowing && stagActions[stagShowing]) stagActions[stagShowing].fadeOut(0.12);
          stagShowing = name;
        },
      };

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
      cards.push(serif);
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
      if (stick.current.on) {
        strafe += stick.current.x;
        forward += -stick.current.y;
      }
      const stickMag = Math.hypot(stick.current.x, stick.current.y);
      let lookAmt = look.current;
      look.current = 0;
      if (held.has("ArrowLeft")) lookAmt -= 1.6;
      if (held.has("ArrowRight")) lookAmt += 1.6;
      const state = stateRef.current;
      if (lockRef.current && !state.stagFreed) {
        state.camYaw = Math.atan2(-(state.stagX - state.x), -(state.stagZ - state.z));
        lookAmt = 0;
      }
      if (!mapOpenRef.current && !menuOpenRef.current) {
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
            sprint: held.has("ShiftLeft") || held.has("ShiftRight") || stickMag > 0.85,
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
      const head = new THREE.Vector3(state.x, state.y + 1.5, state.z);
      const desired = new THREE.Vector3(state.x - face.x * 6, state.y + 2.4, state.z - face.z * 6);
      sun.position.set(state.x + 16, 32, state.z + 10);
      sun.target.position.set(state.x, state.y, state.z);
      sun.shadow.camera.updateProjectionMatrix();
      const back = desired.clone().sub(head);
      const reach = back.length();
      cameraRay.set(head, back.normalize());
      cameraRay.far = reach;
      const blocked = cameraRay.intersectObject(ground, false);
      if (blocked.length > 0 && blocked[0].distance < reach - 0.35) {
        camera.position.copy(head).addScaledVector(back, Math.max(1.4, blocked[0].distance - 0.4));
      } else {
        camera.position.copy(desired);
      }
      camera.lookAt(state.x, state.y + 1.3, state.z);
      if (mageMixer) {
        mageMixer.update(dt);
        const clip =
          state.gait === "run" ? "Running_A" :
          state.gait === "walk" ? "Walking_A" :
          state.gait === "rise" ? "Jump_Start" :
          state.gait === "fall" ? "Jump_Idle" :
          state.gait === "land" ? "Jump_Land" :
          "Idle";
        mageMixer.show(clip, clip === "Jump_Start" || clip === "Jump_Land");
      }
      if (state.grounded && (state.gait === "walk" || state.gait === "run")) {
        stepClock -= dt;
        if (stepClock <= 0) {
          tone(state.gait === "run" ? 240 : 170, 0.06, 0.04);
          stepClock = state.gait === "run" ? 0.28 : 0.46;
        }
      } else stepClock = 0;
      if (state.gait === "land") {
        if (!landPlayed) tone(90, 0.14, 0.08);
        landPlayed = true;
      } else landPlayed = false;
      if (traveler) {
        traveler.position.set(state.x, state.y, state.z);
        traveler.rotation.y = state.yaw + Math.PI;
      }
      for (const gust of grassWind) gust.value = state.time;
      if (stagClips) {
        stagClips.update(dt);
        const dStag = Math.hypot(state.stagX - state.x, state.stagZ - state.z);
        const fleeing = state.stagFreed && state.stagFlee > 0;
        const chasing = !state.stagFreed && dStag < 13 && dStag > 2.6;
        const patrol = !state.stagFreed && dStag >= 13;
        const name = state.stagReact > 0 ? "Idle_HitReact_Left" : fleeing || (chasing && dStag < 6) ? "Gallop" : chasing || patrol ? "Walk" : "Idle";
        stagClips.show(name, name === "Idle_HitReact_Left");
      }
      if (state.stagReact > 0.3) {
        if (!stagHitPlayed) tone(130, 0.09, 0.1);
        stagHitPlayed = true;
      } else stagHitPlayed = false;
      if (stagBill) {
        const gy = terrainHeight(state.stagX, state.stagZ);
        stagBill.position.set(state.stagX, gy, state.stagZ);
        stagBill.rotation.y = state.stagYaw + Math.PI;
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
      const verb = contextPrompt(state);
      if (promptRef.current) promptRef.current.textContent = verb ?? "";
      if (verbButtonRef.current) {
        verbButtonRef.current.dataset.verb = verb && verb !== "Climb" ? verb : "";
        verbButtonRef.current.textContent = verb ?? "";
      }
      if (pipsRef.current) {
        const near = !state.stagFreed && Math.hypot(state.x - state.stagX, state.z - state.stagZ) < 16;
        pipsRef.current.textContent = near ? "●".repeat(3 - state.stagHits) + "○".repeat(state.stagHits) : "";
      }
      if (titleRef.current) titleRef.current.style.opacity = state.time < 6 ? "1" : "0";
      if (hintRef.current) hintRef.current.style.display = state.time < 8 ? "block" : "none";
      if (lockButtonRef.current) lockButtonRef.current.setAttribute("aria-pressed", lockRef.current ? "true" : "false");
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
    <div className="fixed inset-0 z-30 bg-[#c6a15a] font-display text-[#24180f]">
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none"
        onPointerDown={(event) => {
          if (!audioRef.current) {
            const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (Ctx) audioRef.current = new Ctx();
          }
          void audioRef.current?.resume();
          const rect = event.currentTarget.getBoundingClientRect();
          const localX = event.clientX - rect.left;
          if (localX < rect.width * 0.46) {
            stick.current = { on: true, id: event.pointerId, ox: event.clientX, oy: event.clientY, x: 0, y: 0 };
            event.currentTarget.setPointerCapture(event.pointerId);
            return;
          }
          event.currentTarget.setPointerCapture(event.pointerId);
          event.currentTarget.dataset.px = String(event.clientX);
          if (document.pointerLockElement !== event.currentTarget) void event.currentTarget.requestPointerLock();
        }}
        onPointerMove={(event) => {
          if (stick.current.on && event.pointerId === stick.current.id) {
            const dx = event.clientX - stick.current.ox;
            const dy = event.clientY - stick.current.oy;
            stick.current.x = Math.max(-1, Math.min(1, dx / 64));
            stick.current.y = Math.max(-1, Math.min(1, dy / 64));
            if (stickEl.current) {
              stickEl.current.hidden = false;
              stickEl.current.style.transform = `translate(${stick.current.x * 28}px, ${stick.current.y * 28}px)`;
            }
            return;
          }
          if (document.pointerLockElement === event.currentTarget) {
            look.current += event.movementX * 0.003;
            return;
          }
          if (event.buttons !== 1) return;
          const prev = Number(event.currentTarget.dataset.px ?? event.clientX);
          look.current += (event.clientX - prev) * 0.005;
          event.currentTarget.dataset.px = String(event.clientX);
        }}
        onPointerUp={(event) => {
          if (event.pointerId !== stick.current.id) return;
          stick.current.on = false;
          stick.current.x = 0;
          stick.current.y = 0;
          if (stickEl.current) stickEl.current.hidden = true;
        }}
      />
      <div
        ref={stickEl}
        hidden
        className="pointer-events-none absolute bottom-28 left-10 z-10 h-14 w-14 rounded-full border border-[#1c243f]/40 bg-[#efe6d4]/50 sm:hidden"
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-4 pt-14 text-center sm:pt-4">
        <p ref={titleRef} className="text-2xl text-[#1c243f] transition-opacity duration-300">The Unwritten Wild</p>
        <div ref={compassRef} className="relative mx-auto mt-2 h-6 max-w-sm border-b border-[#24180f]/20" hidden={mapOpen} />
        <p ref={objectiveRef} className="mx-auto mt-2 max-w-md text-sm leading-5 text-[#3a2a18]" />
        <p ref={pipsRef} className="mt-1 text-sm tracking-[0.35em] text-[#8d5a32]" />
      </div>
      <Link
        to="/"
        className="absolute left-3 top-3 z-10 inline-flex h-11 items-center rounded-full bg-[#efe6d4]/95 px-4 text-xs tracking-[0.16em] uppercase"
      >
        Club
      </Link>
      <p ref={toastRef} className="pointer-events-none absolute inset-x-8 top-[58%] z-10 text-center text-sm leading-5 text-[#24180f]" />
      <p ref={hintRef} className="pointer-events-none absolute inset-x-4 bottom-36 z-10 text-center text-sm leading-5 text-[#3a2a18]">
        WASD moves. A is left, D is right. Shift runs. Click to look, Esc releases the mouse.
      </p>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <p ref={promptRef} className="text-center text-sm leading-5 text-[#1c243f]" />
        <div className="flex items-end justify-between gap-3">
        <button
          type="button"
          className="pointer-events-auto inline-flex h-14 min-w-14 items-center gap-2 rounded-full bg-[#efe6d4]/95 px-4 text-xs tracking-[0.16em] uppercase"
          onClick={() => {
            mapOpenRef.current = !mapOpenRef.current;
            setMapOpen(mapOpenRef.current);
          }}
        >
          <MapIcon className="h-4 w-4" aria-hidden="true" />
          Sheet
        </button>
        <div className="pointer-events-auto flex items-end gap-2">
          <button
            type="button"
            className="mb-1 h-14 rounded-full bg-[#efe6d4] px-4 text-xs tracking-[0.12em] uppercase"
            onClick={() => {
              menuOpenRef.current = !menuOpenRef.current;
              setMenuOpen(menuOpenRef.current);
            }}
          >
            Menu
          </button>
          <button
            type="button"
            ref={lockButtonRef}
            className="mb-1 h-11 rounded-full bg-[#efe6d4] px-3 text-xs tracking-[0.12em] uppercase aria-pressed:bg-[#2c2418] aria-pressed:text-[#f3e6c8]"
            aria-pressed="false"
            onClick={() => {
              lockRef.current = !lockRef.current;
            }}
          >
            Lock
          </button>
          <div className="relative h-20 w-20">
            <div ref={ringRef} className="absolute inset-0 rounded-full bg-[#efe6d4]/70" />
            <button
              type="button"
              ref={verbButtonRef}
              className="absolute inset-1 flex items-center justify-center rounded-full bg-[#f3e6c8] px-1 text-center text-xs tracking-[0.08em] uppercase text-[#24305a]"
              aria-label="Do the thing in front of you"
              onPointerDown={() => {
                const verb = verbButtonRef.current?.dataset.verb;
                if (!verb) return;
                if (verb === "Cut") edges.current.cut = true;
                else edges.current.talk = true;
              }}
            />
          </div>
        </div>
        </div>
      </div>
      {mapOpen ? (
        <div className="absolute inset-0 z-20 flex items-end justify-center bg-[#24180f]/45 p-3 sm:items-center sm:p-6">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col bg-[#f4e7c8] p-4 text-[#24180f] shadow-[0_24px_60px_rgba(36,24,15,0.28)]" style={{ borderRadius: 28 }}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs tracking-[0.18em] uppercase text-[#3a2a18]">Survey</p>
                <h2 className="text-xl leading-6">The vellum sheet</h2>
              </div>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[#efe6d4]"
                aria-label="Close the sheet"
                onClick={() => {
                  mapOpenRef.current = false;
                  setMapOpen(false);
                }}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <canvas
              ref={mapCanvasRef}
              className="h-[62vh] w-full touch-none rounded-xl bg-[#f4e7c8] sm:h-[68vh]"
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                const u = (event.clientX - rect.left) / rect.width;
                const v = (event.clientY - rect.top) / rect.height;
                const state = stateRef.current;
                const frame = sheetFrame(state, rect.width / Math.max(1, rect.height));
                const { x, z } = sheetUnproject(u, v, frame);
                if (!sheetVisible(x, z, state.x, state.z, state.spireReached)) return;
                pinsRef.current = [...pinsRef.current, { x, z }].slice(-8);
              }}
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs leading-5 text-[#3a2a18]">
              <p>A drawing of the ground you know. Climb the spire to stamp the steppe.</p>
              <p className="tracking-[0.08em] uppercase">You · Camp · Fountain · Stag · Spire</p>
            </div>
          </div>
        </div>
      ) : null}
      {menuOpen ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#24180f]/50 p-4">
          <div className="w-full max-w-md bg-[#f4e7c8] p-6 text-[#24180f] shadow-[0_24px_60px_rgba(36,24,15,0.28)]" style={{ borderRadius: 28 }}>
            <p className="text-xs tracking-[0.18em] uppercase text-[#3a2a18]">Sable Quill</p>
            <h2 className="mt-1 text-2xl leading-7">The Unwritten Wild</h2>
            <div className="mt-4 flex gap-4">
              <div className="relative h-28 w-20 shrink-0 rounded-xl bg-[#24305a]" aria-hidden="true">
                <div className="absolute left-1/2 top-3 h-8 w-8 -translate-x-1/2 rounded-full bg-[#f0e2c4]" />
                <div className="absolute inset-x-2 bottom-2 top-12 rounded-t-full bg-[#2a3a72]" />
              </div>
              <p className="text-sm leading-6">{objectiveLine(stateRef.current)}</p>
            </div>
            <ul className="mt-5 space-y-1 text-sm leading-6 text-[#3a2a18]">
              <li>WASD moves. A is left, D is right. Shift runs.</li>
              <li>The round button does whatever is in front of you. E and K do the same from a keyboard.</li>
              <li>Click the picture to look. Esc releases the mouse, then opens this page.</li>
              <li>M opens the sheet.</li>
            </ul>
            <button
              type="button"
              className="mt-5 inline-flex h-11 items-center rounded-full bg-[#24305a] px-5 text-xs tracking-[0.14em] uppercase text-[#f4e7c8]"
              onClick={() => {
                menuOpenRef.current = false;
                setMenuOpen(false);
              }}
            >
              Return
            </button>
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
  const mesh = new THREE.Mesh(geo, new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: toonGradient() }));
  mesh.receiveShadow = true;
  return mesh;
}

function buildSky() {
  const geo = new THREE.SphereGeometry(220, 28, 16);
  const position = geo.attributes.position;
  const colors = new Float32Array(position.count * 3);
  const zenith = new THREE.Color(0x8ec8e8);
  const horizon = new THREE.Color(0xf3ddb0);
  const color = new THREE.Color();
  for (let i = 0; i < position.count; i++) {
    const y = position.getY(i);
    const t = THREE.MathUtils.clamp((y + 30) / 160, 0, 1);
    color.copy(horizon).lerp(zenith, t * t);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }),
  );
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
  if (width < 2 || height < 2) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawSheet(ctx, width, height, state, pins);
}
