import { GameEngine } from "./engine";

type Eng = GameEngine & {
  running: boolean;
  visHidden: boolean;
  last: number;
  acc: number;
  raf: number;
  bufW: number;
  tick?: ((now: number) => void) | null;
  _wakeRaf?: number;
  step: (dt: number) => void;
  draw: () => void;
  audio: { unlock: () => void };
  input: { clear: () => void };
};

const STEP = 1 / 60;
const engines = new Set<Eng>();

function drive(eng: Eng, now: number) {
  let dt = (now - eng.last) / 1000;
  if (!Number.isFinite(dt) || dt < 0) dt = 0;
  if (dt > 0.1) dt = 0.1;
  eng.last = now;
  try {
    eng.step(STEP);
    eng.draw();
  } catch (err) {
    console.warn("glyphbound wake frame", err);
  }
}

function ensureFallback(eng: Eng) {
  if (eng._wakeRaf) return;
  const loop = (now: number) => {
    eng._wakeRaf = requestAnimationFrame(loop);
    if (!eng.running || document.hidden) return;
    if (typeof eng.tick === "function") {
      cancelAnimationFrame(eng.raf);
      eng.raf = requestAnimationFrame(eng.tick);
      return;
    }
    // If the real loop is alive it updates `last` every frame.
    if (now - eng.last < 40) return;
    eng.visHidden = false;
    drive(eng, now);
  };
  eng._wakeRaf = requestAnimationFrame(loop);
}

function wake(eng: Eng) {
  eng.visHidden = false;
  eng.acc = 0;
  eng.bufW = 0;
  try {
    eng.audio.unlock();
  } catch {
    /* ignore */
  }
  if (!eng.running) return;
  if (typeof eng.tick === "function") {
    eng.last = performance.now();
    cancelAnimationFrame(eng.raf);
    eng.raf = requestAnimationFrame(eng.tick);
    return;
  }
  ensureFallback(eng);
  if (performance.now() - eng.last > 80) drive(eng, performance.now());
}

export function installWake() {
  const proto = GameEngine.prototype as unknown as Eng;
  const origStart = proto.start as unknown as (() => void) | undefined;
  if (origStart && !(origStart as { _gbWake?: boolean })._gbWake) {
    const wrapped = function (this: Eng) {
      origStart.call(this);
      engines.add(this);
      ensureFallback(this);
    };
    (wrapped as { _gbWake?: boolean })._gbWake = true;
    (proto as unknown as { start: () => void }).start = wrapped;
  }
  const origDestroy = proto.destroy as unknown as (() => void) | undefined;
  if (origDestroy && !(origDestroy as { _gbWake?: boolean })._gbWake) {
    const wrapped = function (this: Eng) {
      engines.delete(this);
      if (this._wakeRaf) cancelAnimationFrame(this._wakeRaf);
      this._wakeRaf = 0;
      origDestroy.call(this);
    };
    (wrapped as { _gbWake?: boolean })._gbWake = true;
    (proto as unknown as { destroy: () => void }).destroy = wrapped;
  }

  const onShow = () => {
    for (const eng of engines) wake(eng);
  };
  const onHide = () => {
    for (const eng of engines) {
      eng.visHidden = true;
      eng.input.clear();
      eng.last = performance.now();
    }
  };
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) onHide();
    else onShow();
  });
  window.addEventListener("pageshow", onShow);
  window.addEventListener("focus", onShow);
  window.addEventListener("resume", onShow);
  document.addEventListener("freeze", onHide);

  window.setInterval(() => {
    if (document.hidden) return;
    for (const eng of engines) {
      if (!eng.running) continue;
      if (performance.now() - eng.last < 280) continue;
      wake(eng);
    }
  }, 250);
}
