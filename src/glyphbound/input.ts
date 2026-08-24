export type Actions = {
  moveX: number;
  down: boolean;
  jump: boolean;
  jumpHeld: boolean;
  attack: boolean;
  attackHeld: boolean;
  special: boolean;
  interact: boolean;
  pause: boolean;
  word: boolean;
  stem: boolean;
  shelf: boolean;
  swap: number;
  cycle: number;
  caseShift: boolean;
};

const empty = (): Actions => ({
  moveX: 0,
  down: false,
  jump: false,
  jumpHeld: false,
  attack: false,
  attackHeld: false,
  special: false,
  interact: false,
  pause: false,
  word: false,
  stem: false,
  shelf: false,
  swap: 0,
  cycle: 0,
  caseShift: false,
});

const GAME_KEYS = new Set([
  "Space", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
  "KeyW", "KeyA", "KeyS", "KeyD", "KeyJ", "KeyK", "KeyL", "KeyE", "KeyQ",
  "KeyI", "KeyP", "KeyM", "KeyZ", "KeyX", "KeyR", "KeyF", "Tab",
  "Backquote", "BracketLeft", "BracketRight", "ShiftLeft", "ShiftRight",
  "Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Escape",
]);

function roleOf(e: Event): HTMLElement | null {
  const t = e.target;
  if (!(t instanceof Element)) return null;
  return t.closest("[data-role]") as HTMLElement | null;
}

export class Input {
  keys = new Set<string>();
  prev = new Set<string>();
  forced = new Set<string>();
  latched = new Set<string>();
  pointers = new Map<number, { role: string }>();
  stick = { x: 0, y: 0, active: false, ox: 0, oy: 0 };
  buttons = new Set<string>();
  prevButtons = new Set<string>();
  canvas: HTMLElement | null = null;
  enabled = true;
  private stickRadius = 56;

  attach(el: HTMLElement) {
    this.canvas = el;
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.clear);
    window.addEventListener("pointerup", this.onWindowPtrEnd);
    window.addEventListener("pointercancel", this.onWindowPtrEnd);
    document.addEventListener("visibilitychange", this.onVis);
    el.addEventListener("pointerdown", this.onPtrDown);
    el.addEventListener("pointermove", this.onPtrMove);
    el.addEventListener("pointerup", this.onPtrUp);
    el.addEventListener("pointercancel", this.onPtrUp);
    el.addEventListener("lostpointercapture", this.onLostCapture);
    el.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  detach() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.clear);
    window.removeEventListener("pointerup", this.onWindowPtrEnd);
    window.removeEventListener("pointercancel", this.onWindowPtrEnd);
    document.removeEventListener("visibilitychange", this.onVis);
    if (this.canvas) {
      this.canvas.removeEventListener("pointerdown", this.onPtrDown);
      this.canvas.removeEventListener("pointermove", this.onPtrMove);
      this.canvas.removeEventListener("pointerup", this.onPtrUp);
      this.canvas.removeEventListener("pointercancel", this.onPtrUp);
      this.canvas.removeEventListener("lostpointercapture", this.onLostCapture);
    }
  }

  private onVis = () => {
    if (document.visibilityState === "hidden") this.clear();
  };

  private onWindowPtrEnd = (e: PointerEvent) => {
    if (this.pointers.has(e.pointerId)) this.endPtr(e.pointerId);
  };

  private onLostCapture = (e: Event) => {
    const pe = e as PointerEvent;
    if (this.pointers.has(pe.pointerId)) this.endPtr(pe.pointerId);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (!this.enabled) return;
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    this.keys.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private clear = () => {
    this.keys.clear();
    this.forced.clear();
    this.buttons.clear();
    this.pointers.clear();
    this.stick.active = false;
    this.stick.x = 0;
    this.stick.y = 0;
  };

  private onPtrDown = (e: PointerEvent) => {
    if (!this.enabled) return;
    const role = roleOf(e)?.dataset.role;
    if (!role) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    this.pointers.set(e.pointerId, { role });
    if (role === "stick") {
      this.stick.active = true;
      this.stick.ox = e.clientX;
      this.stick.oy = e.clientY;
      this.updateStick(e.clientX, e.clientY);
    } else {
      this.buttons.add(role);
      this.latched.add(role);
    }
  };

  private onPtrMove = (e: PointerEvent) => {
    const p = this.pointers.get(e.pointerId);
    if (!p) return;
    if (p.role === "stick") this.updateStick(e.clientX, e.clientY);
  };

  private onPtrUp = (e: PointerEvent) => {
    this.endPtr(e.pointerId);
  };

  private endPtr(id: number) {
    const p = this.pointers.get(id);
    if (!p) return;
    this.pointers.delete(id);
    if (p.role === "stick") {
      this.stick.active = false;
      this.stick.x = 0;
      this.stick.y = 0;
    } else {
      this.buttons.delete(p.role);
    }
  };

  private updateStick(cx: number, cy: number) {
    const dx = cx - this.stick.ox;
    const dy = cy - this.stick.oy;
    const len = Math.hypot(dx, dy) || 1;
    const r = this.stickRadius;
    const clamped = Math.min(len, r) / r;
    this.stick.x = (dx / len) * clamped;
    this.stick.y = (dy / len) * clamped;
  };

  private held(code: string) {
    return this.keys.has(code) || this.forced.has(code);
  }

  private edge(code: string) {
    return this.held(code) && !this.prev.has(code);
  }

  poll(): Actions {
    const a = empty();
    let mx = 0;
    if (this.held("ArrowLeft") || this.held("KeyA")) mx -= 1;
    if (this.held("ArrowRight") || this.held("KeyD")) mx += 1;
    if (this.stick.active) mx += this.stick.x;
    a.moveX = Math.max(-1, Math.min(1, mx));
    a.down =
      this.held("ArrowDown") ||
      this.held("KeyS") ||
      this.buttons.has("down") ||
      (this.stick.active && this.stick.y > 0.45);
    const stickUp = this.stick.active && this.stick.y < -0.45;
    a.jumpHeld =
      this.held("Space") ||
      this.held("KeyW") ||
      this.held("ArrowUp") ||
      this.buttons.has("jump") ||
      stickUp;
    a.jump =
      this.edge("Space") ||
      this.edge("KeyW") ||
      this.edge("ArrowUp") ||
      (this.buttons.has("jump") && !this.prevButtons.has("jump"));
    a.attackHeld = this.held("KeyJ") || this.held("KeyZ") || this.buttons.has("attack");
    a.attack =
      this.edge("KeyJ") ||
      this.edge("KeyZ") ||
      (this.buttons.has("attack") && !this.prevButtons.has("attack"));
    a.special =
      this.edge("KeyK") ||
      this.edge("KeyX") ||
      (this.buttons.has("special") && !this.prevButtons.has("special"));
    a.interact =
      this.edge("KeyE") ||
      (this.buttons.has("interact") && !this.prevButtons.has("interact"));
    a.pause =
      this.edge("Escape") ||
      this.edge("KeyP") ||
      (this.buttons.has("pause") && !this.prevButtons.has("pause"));
    const stemTap = this.buttons.has("stem") && !this.prevButtons.has("stem");
    const shelfTap = this.buttons.has("shelf") && !this.prevButtons.has("shelf");
    const wordKey =
      this.edge("KeyL") ||
      this.edge("KeyI") ||
      (this.buttons.has("word") && !this.prevButtons.has("word"));
    a.stem = stemTap || (wordKey && !a.down && !shelfTap);
    a.shelf = shelfTap || (wordKey && a.down);
    a.word = wordKey || stemTap || shelfTap;
    if (shelfTap) a.down = true;
    a.caseShift =
      this.edge("ShiftLeft") ||
      this.edge("ShiftRight") ||
      (this.buttons.has("case") && !this.prevButtons.has("case"));
    for (let i = 1; i <= 8; i++) {
      const digit = `Digit${i}`;
      const role = `p${i}`;
      if (this.edge(digit) || (this.buttons.has(role) && !this.prevButtons.has(role))) {
        a.swap = i;
        break;
      }
    }
    if (
      this.edge("Tab") ||
      this.edge("KeyQ") ||
      this.edge("BracketRight") ||
      this.edge("KeyF") ||
      (this.buttons.has("cycle") && !this.prevButtons.has("cycle"))
    ) {
      a.cycle = 1;
    } else if (
      this.edge("Backquote") ||
      this.edge("BracketLeft") ||
      this.edge("KeyR") ||
      (this.buttons.has("cyclePrev") && !this.prevButtons.has("cyclePrev"))
    ) {
      a.cycle = -1;
    }
    this.prev = new Set([...this.keys, ...this.forced]);
    this.prevButtons = new Set(this.buttons);
    this.latched.clear();
    return a;
  }
}
