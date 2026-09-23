import { Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import {
  CALDERA,
  HOUSES,
  SCRIPT,
  SERIF,
  SPIRE,
  freshWild,
  forwardFromYaw,
  loadWild,
  objectiveLine,
  rightFromForward,
  saveWild,
  stepWild,
  type WildState,
} from "@/wild/sim";

type Img = HTMLImageElement;

const ART = ["sable", "stag", "house", "shrine", "spire", "serif"] as const;

function loadImage(src: string) {
  return new Promise<Img>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(src));
    img.src = src;
  });
}

type Sprite = { kind: string; x: number; z: number; h: number; img: Img; boost?: number };

export function UnwrittenWild() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<WildState>(freshWild());
  const keys = useRef(new Set<string>());
  const look = useRef(0);
  const edges = useRef({ cut: false, talk: false, hop: false, save: false, load: false });
  const imgs = useRef<Partial<Record<(typeof ART)[number], Img>>>({});

  useEffect(() => {
    const held = keys.current;
    const onDown = (e: KeyboardEvent) => {
      held.add(e.code);
      if (e.repeat) return;
      if (e.code === "KeyK" || e.code === "KeyF") edges.current.cut = true;
      if (e.code === "KeyE") edges.current.talk = true;
      if (e.code === "Space") edges.current.hop = true;
      if (e.code === "F5") edges.current.save = true;
      if (e.code === "F9") edges.current.load = true;
    };
    const onUp = (e: KeyboardEvent) => held.delete(e.code);
    const onBlur = () => held.clear();
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    let cancelled = false;
    void Promise.all(ART.map(async (name) => [name, await loadImage(`/wild/${name}.png`)] as const)).then((pairs) => {
      if (cancelled) return;
      for (const [name, img] of pairs) imgs.current[name] = img;
    });
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
      cancelled = true;
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
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame = 0;
    let last = performance.now();
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
      const s = stateRef.current;
      stepWild(s, {
        forward,
        strafe,
        look: lookAmt,
        jumpHeld: held.has("Space"),
        hop: edges.current.hop,
        cut: edges.current.cut,
        talk: edges.current.talk,
      }, dt);
      if (edges.current.save) saveWild(s);
      if (edges.current.load) {
        const loaded = loadWild();
        if (loaded) stateRef.current = loaded;
      }
      edges.current = { cut: false, talk: false, hop: false, save: false, load: false };
      paint(ctx, canvas, stateRef.current, imgs.current);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="fixed inset-0 z-30 bg-[#c6a15a] text-[#24180f]" style={{ fontFamily: "Fraunces, serif" }}>
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none"
        onPointerDown={(e) => {
          (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
          look.current = 0;
          (e.currentTarget as HTMLCanvasElement).dataset.px = String(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.buttons !== 1) return;
          const el = e.currentTarget as HTMLCanvasElement;
          const prev = Number(el.dataset.px ?? e.clientX);
          look.current += (e.clientX - prev) * 0.005;
          el.dataset.px = String(e.clientX);
        }}
      />
      <Link
        to="/"
        className="absolute left-3 top-3 z-10 rounded-full bg-[#efe6d4]/90 px-3 py-2 text-xs tracking-[0.16em] uppercase"
      >
        Club
      </Link>
      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex items-end justify-between gap-3 px-3 pb-[env(safe-area-inset-bottom)]">
        <p className="max-w-xl text-sm leading-snug text-[#3a2a18]">
          WASD move. A is left, D is right. Drag or the left and right arrows look. Space hops, hold it to flutter. K cuts. E speaks.
        </p>
        <div className="pointer-events-auto flex gap-2">
          <button
            type="button"
            className="h-14 min-w-14 rounded-full bg-[#2c2418] px-4 text-sm text-[#f3e6c8]"
            onPointerDown={() => {
              edges.current.talk = true;
            }}
          >
            E
          </button>
          <button
            type="button"
            className="h-16 min-w-16 rounded-full bg-[#f3e6c8] px-4 text-lg text-[#24305a]"
            onPointerDown={() => {
              edges.current.cut = true;
            }}
          >
            K
          </button>
        </div>
      </div>
    </div>
  );
}

function paint(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  s: WildState,
  art: Partial<Record<(typeof ART)[number], Img>>,
) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.62);
  sky.addColorStop(0, "#7eafd4");
  sky.addColorStop(0.55, "#e7c48a");
  sky.addColorStop(1, "#f0d7a4");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  const ground = ctx.createLinearGradient(0, h * 0.48, 0, h);
  ground.addColorStop(0, "#e4c98a");
  ground.addColorStop(1, "#c49a48");
  ctx.fillStyle = ground;
  ctx.fillRect(0, h * 0.5, w, h * 0.5);

  const camF = forwardFromYaw(s.camYaw);
  const camR = rightFromForward(camF);
  const camX = s.x - camF.x * 7.2;
  const camZ = s.z - camF.z * 7.2;
  const horizon = h * 0.5;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, horizon, w, h - horizon);
  ctx.clip();
  const wind = Math.sin(s.time * 1.8);
  for (let i = 0; i < 70; i++) {
    const gx = s.x + ((i * 37) % 23) - 11 + wind * (0.2 + (i % 5) * 0.08);
    const gz = s.z + ((i * 19) % 16) - 3;
    const p = project(gx, gz, camX, camZ, camF, camR, w, horizon);
    if (!p) continue;
    ctx.strokeStyle = i % 4 === 0 ? "#6d8a3a" : "#d7b15a";
    ctx.lineWidth = Math.max(1, p.scale * 0.04);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + wind * p.scale * 0.35, p.y - p.scale * 0.55);
    ctx.stroke();
  }
  ctx.restore();

  const sprites: Sprite[] = [];
  const push = (kind: Sprite["kind"], x: number, z: number, height: number, boost = 0) => {
    const img = art[kind as (typeof ART)[number]];
    if (img) sprites.push({ kind, x, z, h: height, img, boost });
  };
  push("sable", s.x, s.z, s.fluttering ? 2.05 : 1.9);
  push("stag", s.stagX, s.stagZ, s.stagFreed ? 2.05 : 2.25, s.stagFreed ? 0 : 0.08);
  if (s.serif === 0) push("serif", SERIF.x, SERIF.z + Math.sin(s.time * 3) * 0.15, 0.9, 0.2);
  for (const house of HOUSES) push("house", house.x, house.z, house.h);
  push("shrine", SCRIPT.x, SCRIPT.z, 5.6);
  if (Math.hypot(camX - SPIRE.x, camZ - SPIRE.z) > 18) push("spire", SPIRE.x, SPIRE.z, 16);

  const drawn = sprites
    .map((sprite) => ({ sprite, p: project(sprite.x, sprite.z, camX, camZ, camF, camR, w, horizon) }))
    .filter((item): item is { sprite: Sprite; p: NonNullable<ReturnType<typeof project>> } => item.p !== null)
    .sort((a, b) => b.p.depth - a.p.depth);

  for (const { sprite, p } of drawn) {
    const aspect = sprite.img.width / sprite.img.height;
    const sh = sprite.h * p.scale;
    const sw = sh * aspect;
    ctx.save();
    if (sprite.boost) ctx.filter = `brightness(${1 + sprite.boost})`;
    ctx.drawImage(sprite.img, p.x - sw / 2, p.y - sh, sw, sh);
    ctx.restore();
  }

  ctx.fillStyle = "#1c243f";
  ctx.font = "600 28px Fraunces, serif";
  ctx.textAlign = "center";
  ctx.fillText("The Unwritten Wild", w / 2, 42);
  ctx.fillStyle = "#3a2a18";
  ctx.font = "500 16px Fraunces, serif";
  ctx.fillText(objectiveLine(s), w / 2, 68);
  if (s.toastLeft > 0) {
    ctx.fillText(s.toast, w / 2, h * 0.72);
  }
  const inkW = 180 * (s.stamina / 100);
  ctx.fillStyle = "rgba(48,34,20,0.45)";
  ctx.fillRect(20, h - 78, 188, 14);
  ctx.fillStyle = s.stamina > 30 ? "#e2c36a" : "#31406e";
  ctx.fillRect(22, h - 76, inkW, 10);
  ctx.fillStyle = "#3a2a18";
  ctx.textAlign = "left";
  ctx.font = "500 13px Fraunces, serif";
  ctx.fillText("Ink", 20, h - 86);
  if (Math.hypot(s.x - CALDERA.x, s.z - CALDERA.z) < 90) {
    ctx.fillStyle = "rgba(180, 90, 30, 0.18)";
    ctx.fillRect(0, 0, w, h);
  }
}

function project(
  x: number,
  z: number,
  camX: number,
  camZ: number,
  forward: { x: number; z: number },
  right: { x: number; z: number },
  width: number,
  horizon: number,
) {
  const dx = x - camX;
  const dz = z - camZ;
  const depth = dx * forward.x + dz * forward.z;
  const side = dx * right.x + dz * right.z;
  if (depth < 0.6) return null;
  const scale = 240 / depth;
  return { x: width / 2 + side * scale, y: horizon + scale * 0.15, scale, depth };
}

