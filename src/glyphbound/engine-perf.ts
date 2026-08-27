/**
 * FPS and wake patches applied to GameEngine without rewriting the 133k body.
 * Import as a side-effect from the Glyphbound route.
 */
import { GameEngine } from "./engine";
import type { Enemy } from "./types";

type AnyEng = GameEngine & {
  enemies: Enemy[];
  bullets: { alive: boolean }[];
  burns: unknown[];
  particles: { life: number }[];
  running: boolean;
  raf: number;
  last: number;
  acc: number;
  visHidden: boolean;
  bufW: number;
  checkX: number;
  stage: string;
  audio: { unlock: () => void };
  input: { clear: () => void };
  updateEnemies: (dt: number) => void;
  updateBullets: (dt: number) => void;
  updateParticles: (dt: number) => void;
  loadLevel: (id: string, atCheck?: boolean) => void;
  start: () => void;
  destroy: () => void;
};

const P = GameEngine.prototype as unknown as AnyEng;

const prevEnemies = P.updateEnemies;
P.updateEnemies = function updateEnemiesPatched(this: AnyEng, dt: number) {
  prevEnemies.call(this, dt);
  const list = this.enemies;
  let w = 0;
  for (let i = 0; i < list.length; i++) {
    if (list[i].alive) list[w++] = list[i];
  }
  list.length = w;
};

const prevBullets = P.updateBullets;
P.updateBullets = function updateBulletsPatched(this: AnyEng, dt: number) {
  prevBullets.call(this, dt);
  if (this.bullets.length > 48) this.bullets.length = 48;
  if (this.burns.length > 16) this.burns.length = 16;
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
};

const prevLoad = P.loadLevel;
P.loadLevel = function loadLevelPatched(this: AnyEng, id: string, atCheck?: boolean) {
  prevLoad.call(this, id, atCheck);
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
