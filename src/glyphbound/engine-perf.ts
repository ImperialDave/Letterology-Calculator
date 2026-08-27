/**
 * Live patches on the 133k engine without replacing the file.
 * Loaded as a side-effect from the Glyphbound route.
 */
import { GameEngine } from "./engine";
import type { Enemy, Solid } from "./types";

type Body = { x: number; y: number; w: number; h: number; vx?: number; vy?: number; grounded?: boolean };

type AnyEng = GameEngine & {
  enemies: Enemy[];
  bullets: { alive: boolean }[];
  burns: unknown[];
  particles: { life: number }[];
  solids: Solid[];
  walls: unknown[];
  worldH: number;
  running: boolean;
  raf: number;
  last: number;
  acc: number;
  visHidden: boolean;
  bufW: number;
  checkX: number;
  collSmall: Solid[] | null;
  collBig: Solid[] | null;
  collWalls: number;
  audio: { unlock: () => void };
  input: { clear: () => void };
  updateEnemies: (dt: number) => void;
  updateBullets: (dt: number) => void;
  updateParticles: (dt: number) => void;
  loadLevel: (id: string, atCheck?: boolean) => void;
  moveActor: (a: Body, dt: number, large: boolean, drop?: boolean) => void;
  bumpColliders: () => void;
  tickBossArena: (e: Enemy, p: unknown, dt: number) => void;
  start: () => void;
  destroy: () => void;
};

const P = GameEngine.prototype as unknown as AnyEng;

function pinToFloor(eng: AnyEng, a: Body) {
  const maxY = eng.worldH - a.h - 2;
  if (a.y > maxY) {
    a.y = maxY;
    if (a.vy != null) a.vy = 0;
    a.grounded = true;
  }
  let top: number | null = null;
  const feet = a.y + a.h;
  for (const s of eng.solids) {
    if (s.type !== "solid" && s.type !== "oneway" && s.type !== "crumble" && s.type !== "conveyor") continue;
    if (s.broken) continue;
    if (a.x + a.w <= s.x + 2 || a.x >= s.x + s.w - 2) continue;
    if (feet > s.y - 6 && a.y < s.y + s.h) {
      if (top == null || s.y < top) top = s.y;
    }
  }
  if (top != null && a.y + a.h > top) {
    a.y = top - a.h;
    if (a.vy != null) a.vy = 0;
    a.grounded = true;
  }
}

function isArc(e: Enemy) {
  return e.kind === "endmark" && e.phase >= 2;
}

P.bumpColliders = function bumpCollidersPatched(this: AnyEng) {
  /* keep collSmall / collBig — rebuilding every tick melted long ledgers */
};

const prevMove = P.moveActor;
P.moveActor = function moveActorPatched(this: AnyEng, a: Body, dt: number, large: boolean, drop?: boolean) {
  const e = a as Enemy;
  const shard = e && e.kind === "endmark" && e.phase >= 2;
  prevMove.call(this, a, dt, shard ? false : large, drop);
  if (shard) pinToFloor(this, a);
};

const prevArena = P.tickBossArena;
P.tickBossArena = function tickBossArenaPatched(this: AnyEng, e: Enemy, p: unknown, dt: number) {
  if (isArc(e)) return;
  prevArena.call(this, e, p, dt);
};

const prevEnemies = P.updateEnemies;
P.updateEnemies = function updateEnemiesPatched(this: AnyEng, dt: number) {
  prevEnemies.call(this, dt);
  const list = this.enemies;
  let w = 0;
  for (let i = 0; i < list.length; i++) {
    const e = list[i];
    if (!e.alive) continue;
    if (isArc(e)) {
      if (e.vy != null && e.vy > 640) e.vy = 640;
      pinToFloor(this, e);
    }
    list[w++] = e;
  }
  list.length = w;
};

const prevBullets = P.updateBullets;
P.updateBullets = function updateBulletsPatched(this: AnyEng, dt: number) {
  prevBullets.call(this, dt);
  if (this.bullets.length > 32) this.bullets.length = 32;
  if (this.burns.length > 10) this.burns.length = 10;
};

const prevParticles = P.updateParticles;
P.updateParticles = function updateParticlesPatched(this: AnyEng, dt: number) {
  prevParticles.call(this, dt);
  const list = this.particles;
  if (!list) return;
  let w = 0;
  for (let i = 0; i < list.length; i++) {
    if (list[i].life > 0) list[w++] = list[i];
  }
  list.length = w;
  if (list.length > 40) list.length = 40;
};

const prevLoad = P.loadLevel;
P.loadLevel = function loadLevelPatched(this: AnyEng, id: string, atCheck?: boolean) {
  prevLoad.call(this, id, atCheck);
  this.collSmall = null;
  this.collBig = null;
  this.collWalls = -1;
  if (id === "hub" || !atCheck) return;
  const cut = this.checkX;
  if (!cut) return;
  const keep = this.enemies.filter((e) => e.x + e.w * 0.5 >= cut - 16);
  this.enemies.length = 0;
  for (const e of keep) this.enemies.push(e);
};

const prevStart = P.start;
P.start = function startPatched(this: AnyEng) {
  prevStart.call(this);
  const wake = () => {
    this.visHidden = false;
    this.last = performance.now();
    this.acc = 0;
    this.bufW = 0;
    try {
      this.audio.unlock();
    } catch {
      /* background audio */
    }
    if (!this.running) return;
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame((now) => {
      this.last = now;
    });
  };
  const onShow = () => wake();
  window.addEventListener("pageshow", onShow);
  window.addEventListener("focus", onShow);
  document.addEventListener("freeze", () => {
    this.visHidden = true;
    this.input.clear();
  });
  (this as unknown as { _onShow?: () => void })._onShow = onShow;
};

const prevDestroy = P.destroy;
P.destroy = function destroyPatched(this: AnyEng) {
  const onShow = (this as unknown as { _onShow?: () => void })._onShow;
  if (onShow) {
    window.removeEventListener("pageshow", onShow);
    window.removeEventListener("focus", onShow);
  }
  prevDestroy.call(this);
};
