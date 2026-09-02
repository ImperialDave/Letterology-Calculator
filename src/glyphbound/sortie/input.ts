import { clampSight } from "./cam";
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
  mouseFire = false;
  aim = { x: 0, y: 0 };
  private mx = 0;
  private my = 0;
  private mouseMoved = false;
  private keyRoll = 0;
  private keyPitch = 0;
  private prevQ = false;
  private prevE = false;
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
    const clear = () => {
      this.keys.clear();
      this.mouseFire = false;
    };
    const move = (e: MouseEvent) => {
      if (typeof document === "undefined" || document.pointerLockElement == null) return;
      this.mx += e.movementX * 0.0022;
      this.my -= e.movementY * 0.0022;
      this.mouseMoved = true;
      const c = clampSight(this.mx, this.my);
      this.mx = c.x;
      this.my = c.y;
    };
    const pointerDown = (e: PointerEvent) => {
      if (e.button === 0 && document.pointerLockElement) this.mouseFire = true;
    };
    const pointerUp = (e: PointerEvent) => {
      if (e.button === 0) this.mouseFire = false;
    };
    const lockLost = () => {
      if (document.pointerLockElement) return;
      this.mouseFire = false;
    };
    el.addEventListener("keydown", down as EventListener);
    el.addEventListener("keyup", up as EventListener);
    window.addEventListener("blur", clear);
    window.addEventListener("mousemove", move);
    window.addEventListener("pointerdown", pointerDown);
    window.addEventListener("pointerup", pointerUp);
    document.addEventListener("pointerlockchange", lockLost);
    const hide = () => {
      if (document.hidden) clear();
    };
    window.addEventListener("visibilitychange", hide);
    return () => {
      el.removeEventListener("keydown", down as EventListener);
      el.removeEventListener("keyup", up as EventListener);
      window.removeEventListener("blur", clear);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("pointerdown", pointerDown);
      window.removeEventListener("pointerup", pointerUp);
      document.removeEventListener("pointerlockchange", lockLost);
      window.removeEventListener("visibilitychange", hide);
    };
  }

  setKeys(codes: string[]) {
    this.injected = codes;
  }

  setSight(x: number, y: number) {
    const c = clampSight(x, y);
    this.mx = c.x;
    this.my = c.y;
  }

  poll(dt: number, allRange = false): SortieInput & { pause: boolean } {
    this.t += dt;
    const has = (c: string) => (this.injected ? this.injected.includes(c) : this.keys.has(c));
    const pad = this.pad();
    const keyScale = allRange ? 0.62 : 1;
    let keyWantR = 0;
    let keyWantP = 0;
    if (has("KeyA") || has("ArrowLeft") || pad.left) keyWantR += keyScale;
    if (has("KeyD") || has("ArrowRight") || pad.right) keyWantR -= keyScale;
    if (has("KeyW") || has("ArrowUp") || pad.up) keyWantP += keyScale;
    if (has("KeyS") || has("ArrowDown") || pad.down) keyWantP -= keyScale;
    const ease = (cur: number, want: number) => {
      const toward = Math.abs(want) > Math.abs(cur) + 0.02;
      const k = toward ? 11 : 7;
      return cur + (want - cur) * (1 - Math.exp(-k * dt));
    };
    this.keyRoll = ease(this.keyRoll, keyWantR);
    this.keyPitch = ease(this.keyPitch, keyWantP);
    let roll = this.stick.x + this.keyRoll + pad.ax;
    let pitch = this.stick.y + this.keyPitch - pad.ay;
    roll = Math.max(-1, Math.min(1, roll));
    pitch = Math.max(-1, Math.min(1, pitch));

    const q = has("KeyQ");
    const eKey = has("KeyE");
    let barrel = 0;
    if (q && !this.prevQ) barrel = 1;
    if (eKey && !this.prevE) barrel = -1;
    this.prevQ = q;
    this.prevE = eKey;
    if (this.touchBarrel && barrel === 0) barrel = this.touchBarrel;
    this.touchBarrel = 0;

    const touchAim = Math.hypot(this.aim.x, this.aim.y) > 0.04;
    const padAim = Math.hypot(pad.aimX, pad.aimY) > 0.08;
    if (this.mouseMoved) {
      /* mx/my already integrated from pointer lock */
    } else if (touchAim) {
      const c = clampSight(this.aim.x, this.aim.y);
      this.mx = c.x;
      this.my = c.y;
    } else if (padAim) {
      const c = clampSight(pad.aimX, pad.aimY);
      this.mx = c.x;
      this.my = c.y;
    } else {
      const spring = Math.exp(-10 * dt);
      this.mx *= spring;
      this.my *= spring;
    }
    this.mouseMoved = false;

    const fireHeld = has("Space") || has("KeyJ") || pad.fire || this.touchFire || this.mouseFire;
    const fire = fireHeld && !this.prevFire;
    this.prevFire = fireHeld;
    const vKey = has("KeyV");
    const cockpit = vKey && !this.prevV;
    this.prevV = vKey;

    const out = emptyInput();
    out.roll = roll;
    out.pitch = pitch;
    out.rudder = pad.rudder;
    out.sightX = this.mx;
    out.sightY = this.my;
    out.fire = fire;
    out.fireHeld = fireHeld;
    out.boost = has("ShiftLeft") || has("ShiftRight") || has("KeyK") || pad.boost || this.touchBoost;
    out.brake = has("ControlLeft") || has("ControlRight") || has("KeyX") || pad.brake || this.touchBrake;
    out.barrel = barrel;
    out.lockBreak = has("Tab");
    out.cockpit = cockpit;
    out.somersault = false;
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
      return { ax: 0, ay: 0, aimX: 0, aimY: 0, left: false, right: false, up: false, down: false, fire: false, boost: false, brake: false, pause: false, rudder: 0 };
    }
    const st = dead(g.axes[0] ?? 0, g.axes[1] ?? 0);
    const aim = dead(g.axes[2] ?? 0, g.axes[3] ?? 0);
    return {
      ax: -st.x,
      ay: st.y,
      aimX: aim.x,
      aimY: -aim.y,
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
