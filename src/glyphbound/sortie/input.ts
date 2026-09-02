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
  "KeyB",
  "KeyM",
  "KeyV",
  "Tab",
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
  private lastQ = -9;
  private lastE = -9;
  private lastW = -9;
  private lastQUp = -9;
  private lastEUp = -9;
  private lastWUp = -9;
  private prevQ = false;
  private prevE = false;
  private prevW = false;
  private prevFire = false;
  private prevBomb = false;
  private prevPause = false;
  private prevV = false;
  touchBomb = false;
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
    let pitch = this.stick.y;
    if (has("KeyA") || has("ArrowLeft") || pad.left) roll += 1;
    if (has("KeyD") || has("ArrowRight") || pad.right) roll -= 1;
    if (has("KeyW") || has("ArrowUp") || pad.up) pitch += 1;
    if (has("KeyS") || has("ArrowDown") || pad.down) pitch -= 1;
    roll = Math.max(-1, Math.min(1, roll + pad.ax));
    pitch = Math.max(-1, Math.min(1, pitch - pad.ay));

    const q = has("KeyQ");
    const eKey = has("KeyE");
    let barrel = 0;
    const tapWindow = 0.38;
    const shortTap = 0.16;
    if (!q && this.prevQ) this.lastQUp = this.t;
    if (!eKey && this.prevE) this.lastEUp = this.t;
    if (q && !this.prevQ) {
      if (this.t - this.lastQ < tapWindow && this.lastQUp - this.lastQ < shortTap) barrel = 1;
      this.lastQ = this.t;
    }
    if (eKey && !this.prevE) {
      if (this.t - this.lastE < tapWindow && this.lastEUp - this.lastE < shortTap) barrel = -1;
      this.lastE = this.t;
    }
    this.prevQ = q;
    this.prevE = eKey;
    if (this.touchBarrel && barrel === 0) barrel = this.touchBarrel;
    this.touchBarrel = 0;

    const w = has("KeyW") || has("ArrowUp") || pad.up;
    let somersault = false;
    if (!w && this.prevW) this.lastWUp = this.t;
    if (w && !this.prevW) {
      if (this.t - this.lastW < 0.38 && this.lastWUp - this.lastW < 0.16) somersault = true;
      this.lastW = this.t;
    }
    this.prevW = w;

    const fireHeld = has("Space") || has("KeyJ") || pad.fire || this.touchFire;
    const fire = fireHeld && !this.prevFire;
    this.prevFire = fireHeld;
    const vKey = has("KeyV");
    const cockpit = vKey && !this.prevV;
    this.prevV = vKey;

    const out = emptyInput();
    out.roll = roll;
    out.pitch = pitch;
    out.rudder = pad.rudder;
    out.fire = fire;
    out.fireHeld = fireHeld;
    out.boost = has("ShiftLeft") || has("ShiftRight") || has("KeyK") || pad.boost || this.touchBoost;
    out.brake = has("ControlLeft") || has("ControlRight") || has("KeyX") || pad.brake || this.touchBrake;
    out.barrel = barrel;
    out.lockBreak = has("Tab");
    out.cockpit = cockpit;
    out.somersault = somersault;
    const bombHeld = has("KeyB") || has("KeyM");
    out.bomb = (bombHeld && !this.prevBomb) || this.touchBomb;
    this.prevBomb = bombHeld;
    this.touchBomb = false;
    this.injected = null;
    const pauseHeld = has("Escape") || pad.pause;
    const pause = pauseHeld && !this.prevPause;
    this.prevPause = pauseHeld;
    return { ...out, pause };
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
