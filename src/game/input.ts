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
  pause: boolean;
};

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
  "Escape",
  "KeyP",
]);

export class Input {
  keys = new Set<string>();
  edges = new Set<string>();
  qaKeys: Set<string> | null = null;
  prev = new Set<string>();
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
  };
  private unbind: Array<() => void> = [];

  attach(el: HTMLElement): void {
    const down = (e: KeyboardEvent) => {
      if (GAME_KEYS.has(e.code)) e.preventDefault();
      if (!this.keys.has(e.code)) this.edges.add(e.code);
      this.keys.add(e.code);
    };
    const up = (e: KeyboardEvent) => {
      this.keys.delete(e.code);
    };
    const clear = () => this.keys.clear();
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
    let moveX = this.touch.moveX;
    let moveY = this.touch.moveY;
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
        const scale = ((mag - dz) / (1 - dz)) / mag;
        moveX = Math.max(-1, Math.min(1, moveX + ax * scale));
        moveY = Math.max(-1, Math.min(1, moveY + ay * scale));
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
      pause: just("Escape") || just("KeyP"),
    };

    this.touch.interact = false;
    this.touch.dynamite = false;
    this.touch.hellcharge = false;
    this.touch.fuelCan = false;
    this.touch.nanobots = false;
    this.touch.teleporter = false;
    this.touch.coolant = false;
    this.edges.clear();
    this.prev = this.qaKeys ? new Set(this.qaKeys) : new Set(this.keys);
    return actions;
  }
}
