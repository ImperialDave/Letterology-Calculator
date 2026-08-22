export type Actions = {
  moveX: number;
  moveY: number;
  interact: boolean;
  dynamite: boolean;
  hellcharge: boolean;
  fuelCan: boolean;
  nanobots: boolean;
  teleporter: boolean;
  coolant: boolean;
  nullcharge: boolean;
  plantNail: boolean;
  chorus: boolean;
  veinBell: boolean;
  hook: boolean;
  pause: boolean;
  drill: boolean;
};

/** 0 up, 1 right, 2 down, 3 left — same as player.drillDir */
export type Cardinal = 0 | 1 | 2 | 3;

const GAME_KEYS = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Space",
  "KeyE",
  "KeyF",
  "KeyR",
  "KeyT",
  "KeyX",
  "KeyC",
  "KeyV",
  "KeyN",
  "KeyG",
  "KeyQ",
  "KeyH",
  "Escape",
  "KeyP",
]);

/** Old Kiln firing order. Letters that never steer the rig. */
export const KILN_CODE = "kiln33";
const CHEAT_GAP = 2800;
const CHEAT_MAX = 16;

export function letterFromCode(code: string): string | null {
  if (/^Key[A-Z]$/.test(code)) return code.slice(3).toLowerCase();
  if (/^Digit[0-9]$/.test(code)) return code.slice(5);
  return null;
}

export function feedCheat(buf: string, ch: string, now: number, last: number): string {
  const next = (last > 0 && now - last > CHEAT_GAP ? "" : buf) + ch;
  return next.length > CHEAT_MAX ? next.slice(-CHEAT_MAX) : next;
}

export function kilnOffered(buf: string): boolean {
  return buf.includes(KILN_CODE);
}

export function spokenKiln(raw: string): boolean {
  return raw.toLowerCase().replace(/[^a-z0-9]/g, "") === KILN_CODE;
}
/**
 * Tile miners hate analog diagonals: they chatter between two walls.
 * Snap a stick vector to one cardinal, with hysteresis so 45° corners
 * do not flip every frame. Once past the deadzone, output is full ±1
 * so dig thresholds never flicker.
 */
export function snapCardinal(
  x: number,
  y: number,
  locked: Cardinal | null,
  dead = 0.2,
): { x: number; y: number; lock: Cardinal | null } {
  const mag = Math.hypot(x, y);
  if (mag < dead) return { x: 0, y: 0, lock: null };
  const nx = x / mag;
  const ny = y / mag;
  const score = (dir: Cardinal) => {
    if (dir === 1) return nx;
    if (dir === 3) return -nx;
    if (dir === 2) return ny;
    return -ny;
  };
  let pick: Cardinal = 2;
  if (locked != null && score(locked) >= 0.38) {
    pick = locked;
  } else {
    let best = -2;
    for (const dir of [0, 1, 2, 3] as const) {
      const s = score(dir);
      if (s > best) {
        best = s;
        pick = dir;
      }
    }
  }
  return {
    x: pick === 1 ? 1 : pick === 3 ? -1 : 0,
    y: pick === 2 ? 1 : pick === 0 ? -1 : 0,
    lock: pick,
  };
}

/**
 * Drag from a planted origin, in CSS pixels (+x right, +y down).
 * Direction is the swipe — not where the tap sits relative to the rig.
 */
export function aimFromDelta(
  dx: number,
  dy: number,
  locked: Cardinal | null,
  deadPx = 24,
): { x: number; y: number; lock: Cardinal | null } {
  if (Math.hypot(dx, dy) < deadPx) return { x: 0, y: 0, lock: null };
  return snapCardinal(dx, dy, locked, 0.05);
}

/** If the finger outruns the throw, slide the origin so a long swipe still steers. */
export function slideOrigin(
  origin: { x: number; y: number },
  pointer: { x: number; y: number },
  maxR: number,
): { origin: { x: number; y: number }; dx: number; dy: number } {
  let dx = pointer.x - origin.x;
  let dy = pointer.y - origin.y;
  const mag = Math.hypot(dx, dy);
  if (mag > maxR && mag > 0) {
    const extra = mag - maxR;
    origin = { x: origin.x + (dx / mag) * extra, y: origin.y + (dy / mag) * extra };
    dx = pointer.x - origin.x;
    dy = pointer.y - origin.y;
  }
  return { origin, dx, dy };
}

export const STICK_THROW = 56;

export class Input {
  keys = new Set<string>();
  edges = new Set<string>();
  qaKeys: Set<string> | null = null;
  prev = new Set<string>();
  touchLock: Cardinal | null = null;
  dragOrigin: { x: number; y: number } | null = null;
  touch = {
    moveX: 0,
    moveY: 0,
    interact: false,
    dynamite: false,
    hellcharge: false,
    fuelCan: false,
    nanobots: false,
    teleporter: false,
    coolant: false,
    nullcharge: false,
    plantNail: false,
    chorus: false,
    veinBell: false,
    hook: false,
    drill: false,
  };
  cheatBuf = "";
  cheatAt = 0;
  private cheatReady = false;
  private unbind: Array<() => void> = [];

  takeCheat(): boolean {
    if (!this.cheatReady) return false;
    this.cheatReady = false;
    return true;
  }

  attach(el: HTMLElement): void {
    const down = (e: KeyboardEvent) => {
      const typing =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable);
      if (typing) return;
      if (GAME_KEYS.has(e.code)) e.preventDefault();
      if (!this.keys.has(e.code)) this.edges.add(e.code);
      this.keys.add(e.code);
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const ch = letterFromCode(e.code);
      if (!ch) return;
      const now = performance.now();
      this.cheatBuf = feedCheat(this.cheatBuf, ch, now, this.cheatAt);
      this.cheatAt = now;
      if (kilnOffered(this.cheatBuf)) {
        this.cheatReady = true;
        this.cheatBuf = "";
      }
    };
    const up = (e: KeyboardEvent) => {
      this.keys.delete(e.code);
    };
    const clear = () => {
      this.keys.clear();
      this.touch.moveX = 0;
      this.touch.moveY = 0;
      this.touch.drill = false;
      this.touchLock = null;
      this.dragOrigin = null;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) clear();
    });
    el.style.touchAction = "none";
    const rejectGesture = (e: Event) => e.preventDefault();
    const rejectTouch = (e: TouchEvent) => e.preventDefault();
    el.addEventListener("gesturestart", rejectGesture);
    el.addEventListener("gesturechange", rejectGesture);
    el.addEventListener("gestureend", rejectGesture);
    el.addEventListener("touchmove", rejectTouch, { passive: false });
    this.unbind.push(
      () => window.removeEventListener("keydown", down),
      () => window.removeEventListener("keyup", up),
      () => window.removeEventListener("blur", clear),
      () => el.removeEventListener("gesturestart", rejectGesture),
      () => el.removeEventListener("gesturechange", rejectGesture),
      () => el.removeEventListener("gestureend", rejectGesture),
      () => el.removeEventListener("touchmove", rejectTouch),
    );
  }

  detach(): void {
    for (const u of this.unbind) u();
    this.unbind = [];
  }

  setQa(codes: string[]): void {
    this.qaKeys = new Set(codes);
  }

  clearQa(): void {
    this.qaKeys = null;
  }

  private held(code: string): boolean {
    if (this.qaKeys) return this.qaKeys.has(code);
    return this.keys.has(code);
  }

  poll(): Actions {
    const snapped = snapCardinal(this.touch.moveX, this.touch.moveY, this.touchLock);
    this.touchLock = snapped.lock;
    let moveX = snapped.x;
    let moveY = snapped.y;
    if (this.held("KeyA") || this.held("ArrowLeft")) moveX -= 1;
    if (this.held("KeyD") || this.held("ArrowRight")) moveX += 1;
    if (this.held("KeyW") || this.held("ArrowUp")) moveY -= 1;
    if (this.held("KeyS") || this.held("ArrowDown")) moveY += 1;
    moveX = Math.max(-1, Math.min(1, moveX));
    moveY = Math.max(-1, Math.min(1, moveY));

    const just = (code: string) => {
      if (this.qaKeys) return this.qaKeys.has(code) && !this.prev.has(code);
      return this.edges.has(code);
    };

    const pads = typeof navigator !== "undefined" ? navigator.getGamepads?.() ?? [] : [];
    for (const pad of pads) {
      if (!pad || pad.mapping !== "standard") continue;
      const ax = pad.axes[0] ?? 0;
      const ay = pad.axes[1] ?? 0;
      const mag = Math.hypot(ax, ay);
      const dz = 0.18;
      if (mag > dz) {
        const padSnap = snapCardinal(ax, ay, this.touchLock, dz);
        moveX = Math.max(-1, Math.min(1, moveX + padSnap.x));
        moveY = Math.max(-1, Math.min(1, moveY + padSnap.y));
        if (padSnap.lock != null) this.touchLock = padSnap.lock;
      }
      if (pad.buttons[14]?.pressed) moveX -= 1;
      if (pad.buttons[15]?.pressed) moveX += 1;
      if (pad.buttons[12]?.pressed) moveY -= 1;
      if (pad.buttons[13]?.pressed) moveY += 1;
    }

    const actions: Actions = {
      moveX: Math.max(-1, Math.min(1, moveX)),
      moveY: Math.max(-1, Math.min(1, moveY)),
      interact: just("KeyE") || this.touch.interact,
      dynamite: just("Space") || this.touch.dynamite,
      hellcharge: just("KeyX") || this.touch.hellcharge,
      fuelCan: just("KeyF") || this.touch.fuelCan,
      nanobots: just("KeyR") || this.touch.nanobots,
      teleporter: just("KeyT") || this.touch.teleporter,
      coolant: just("KeyC") || this.touch.coolant,
      nullcharge: just("KeyV") || this.touch.nullcharge,
      plantNail: just("KeyN") || this.touch.plantNail,
      chorus: just("KeyQ") || this.touch.chorus,
      veinBell: just("KeyG") || this.touch.veinBell,
      hook: just("KeyH") || this.touch.hook,
      pause: just("Escape") || just("KeyP"),
      drill: this.touch.drill || (pads.some((pad) => pad?.mapping === "standard" && pad.buttons[0]?.pressed) ?? false),
    };

    this.touch.interact = false;
    this.touch.dynamite = false;
    this.touch.hellcharge = false;
    this.touch.fuelCan = false;
    this.touch.nanobots = false;
    this.touch.teleporter = false;
    this.touch.coolant = false;
    this.touch.nullcharge = false;
    this.touch.plantNail = false;
    this.touch.chorus = false;
    this.touch.veinBell = false;
    this.touch.hook = false;
    this.edges.clear();
    this.prev = this.qaKeys ? new Set(this.qaKeys) : new Set(this.keys);
    return actions;
  }
}
