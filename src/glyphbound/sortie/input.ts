import { emptyInput, type SortieInput } from "./sim";

const GAME = new Set([
  "Space",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "KeyJ",
  "KeyZ",
  "KeyK",
  "KeyX",
  "ShiftLeft",
  "ShiftRight",
  "ControlLeft",
  "ControlRight",
  "KeyQ",
  "KeyE",
  "KeyR",
  "KeyC",
  "Escape",
]);

export class SortieKeys {
  keys = new Set<string>();
  injected: string[] | null = null;
  stick = { x: 0, y: 0 };
  touchFire = false;
  touchBoost = false;
  touchBrake = false;
  touchBarrel = 0;
  private lastA = -9;
  private lastD = -9;
  private prevA = false;
  private prevD = false;
  private prevR = false;
  private prevFire = false;
  t = 0;

  attach(el: Window | HTMLElement = window) {
    const down = (e: KeyboardEvent) => {
      this.keys.add(e.code);
      if (GAME.has(e.code)) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => this.keys.delete(e.code);
    const clear = () => this.keys.clear();
    el.addEventListener("keydown", down as EventListener);
    el.addEventListener("keyup", up as EventListener);
    window.addEventListener("blur", clear);
    window.addEventListener("visibilitychange", () => {
      if (document.hidden) clear();
    });
    return () => {
      el.removeEventListener("keydown", down as EventListener);
      el.removeEventListener("keyup", up as EventListener);
      window.removeEventListener("blur", clear);
    };
  }

  setKeys(codes: string[]) {
    this.injected = codes;
  }

  poll(dt: number): SortieInput & { pause: boolean } {
    this.t += dt;
    const has = (c: string) => (this.injected ? this.injected.includes(c) : this.keys.has(c));
    const pad = this.pad();
    let roll = this.stick.x;
    let pitch = -this.stick.y;
    if (has("KeyA") || has("ArrowLeft") || pad.left) roll += 1;
    if (has("KeyD") || has("ArrowRight") || pad.right) roll -= 1;
    if (has("KeyW") || has("ArrowUp") || pad.up) pitch += 1;
    if (has("KeyS") || has("ArrowDown") || pad.down) pitch -= 1;
    roll = Math.max(-1, Math.min(1, roll + pad.ax));
    pitch = Math.max(-1, Math.min(1, pitch - pad.ay));

    const a = has("KeyA") || has("ArrowLeft") || pad.left;
    const d = has("KeyD") || has("ArrowRight") || pad.right;
    let barrel = 0;
    if (a && !this.prevA) {
      if (this.t - this.lastA < 0.28) barrel = 1;
      this.lastA = this.t;
    }
    if (d && !this.prevD) {
      if (this.t - this.lastD < 0.28) barrel = -1;
      this.lastD = this.t;
    }
    this.prevA = a;
    this.prevD = d;
    const rKey = has("KeyR") || has("KeyC");
    if (rKey && !this.prevR && barrel === 0) barrel = roll >= 0 ? 1 : -1;
    this.prevR = rKey;
    if (this.touchBarrel && barrel === 0) barrel = this.touchBarrel;
    this.touchBarrel = 0;

    const fireHeld =
      has("KeyJ") || has("KeyZ") || has("Space") || pad.fire || this.touchFire;
    const fire = fireHeld && !this.prevFire;
    this.prevFire = fireHeld;

    const out = emptyInput();
    out.roll = roll;
    out.pitch = pitch;
    out.rudder = (has("KeyQ") ? 1 : 0) + (has("KeyE") ? -1 : 0) + pad.rudder;
    out.fire = fire;
    out.fireHeld = fireHeld;
    out.boost = has("KeyK") || has("ShiftLeft") || has("ShiftRight") || pad.boost || this.touchBoost;
    out.brake = has("KeyX") || has("ControlLeft") || has("ControlRight") || pad.brake || this.touchBrake;
    out.barrel = barrel;
    this.injected = null;
    return { ...out, pause: has("Escape") || pad.pause };
  }

  private pad() {
    const g = typeof navigator !== "undefined" ? navigator.getGamepads?.()[0] : null;
    const dead = (x: number, y: number) => {
      const m = Math.hypot(x, y);
      if (m < 0.18) return { x: 0, y: 0 };
      const s = ((m - 0.18) / 0.82) / m;
      return { x: x * s, y: y * s };
    };
    if (!g) {
      return { ax: 0, ay: 0, left: false, right: false, up: false, down: false, fire: false, boost: false, brake: false, pause: false, rudder: 0 };
    }
    const st = dead(g.axes[0] ?? 0, g.axes[1] ?? 0);
    return {
      ax: -st.x,
      ay: st.y,
      left: g.buttons[14]?.pressed ?? false,
      right: g.buttons[15]?.pressed ?? false,
      up: g.buttons[12]?.pressed ?? false,
      down: g.buttons[13]?.pressed ?? false,
      fire: g.buttons[0]?.pressed || g.buttons[2]?.pressed || false,
      boost: g.buttons[7]?.pressed || g.buttons[5]?.pressed || false,
      brake: g.buttons[6]?.pressed || g.buttons[4]?.pressed || false,
      pause: g.buttons[9]?.pressed ?? false,
      rudder: (g.buttons[4]?.pressed ? 1 : 0) + (g.buttons[5]?.pressed ? -1 : 0),
    };
  }
}
