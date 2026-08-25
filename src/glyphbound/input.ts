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
  /** Dedicated stem (wall) on mobile / when set. */
  stem: boolean;
  /** Dedicated shelf (platform) on mobile. */
  shelf: boolean;
  /** 1-based party slot. 0 = none. */
  swap: number;
  /** -1 previous letter, +1 next letter, 0 = none. */
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
  "KeyK",
  "KeyL",
  "KeyE",
  "KeyQ",
  "KeyI",
  "KeyP",
  "KeyM",
  "KeyZ",
  "KeyX",
  "KeyR",
  "KeyF",
  "Tab",
  "Backquote",
  "BracketLeft",
  "BracketRight",
  "ShiftLeft",
  "ShiftRight",
  "Digit1",
  "Digit2",
  "Digit3",
  "Digit4",
  "Digit5",
  "Digit6",
  "Digit7",
  "Digit8",
  "Escape",
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
    // iOS drops element pointermove without capture; follow the finger on the window.
    window.addEventListener("pointermove", this.onPtrMove, { passive: false });
    document.addEventListener("visibilitychange", this.onVis);
    el.addEventListener("pointerdown", this.onPtrDown, { passive: false });
    el.addEventListener("pointermove", this.onPtrMove, { passive: false });
    el.addEventListener("pointerup", this.onPtrUp);
    el.addEventListener("pointercancel", this.onPtrUp);
    el.addEventListener("touchstart", this.blockScroll, { passive: false });
    el.addEventListener("touchmove", this.blockScroll, { passive: false });
    el.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  detach() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.clear);
    window.removeEventListener("pointerup", this.onWindowPtrEnd);
    window.removeEventListener("pointercancel", this.onWindowPtrEnd);
    window.removeEventListener("pointermove", this.onPtrMove);
    document.removeEventListener("visibilitychange", this.onVis);
    this.canvas?.removeEventListener("pointerdown", this.onPtrDown);
    this.canvas?.removeEventListener("pointermove", this.onPtrMove);
    this.canvas?.removeEventListener("pointerup", this.onPtrUp);
    this.canvas?.removeEventListener("pointercancel", this.onPtrUp);
    this.canvas?.removeEventListener("touchstart", this.blockScroll);
    this.canvas?.removeEventListener("touchmove", this.blockScroll);
    this.canvas?.removeEventListener("lostpointercapture", this.onLostCapture);
  }

  private onVis = () => {
    if (document.hidden) this.clear();
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (!this.enabled) return;
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    this.keys.add(e.code);
    this.latched.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  clear = () => {
    this.keys.clear();
    this.forced.clear();
    this.latched.clear();
    this.buttons.clear();
    this.pointers.clear();
    this.stick.active = false;
    this.stick.x = 0;
    this.stick.y = 0;
  };

  private blockScroll = (e: TouchEvent) => {
    const n = e.target as HTMLElement | null;
    if (n?.closest?.("button, a, input, textarea, [data-ui]")) return;
    e.preventDefault();
  };

  private onPtrDown = (e: PointerEvent) => {
    const t = roleOf(e);
    if (!t) return;
    const role = t.dataset.role;
    if (!role) return;
    e.preventDefault();
    try {
      t.setPointerCapture?.(e.pointerId);
    } catch {
      /* capture can fail on some mobile browsers; still track the pointer */
    }
    this.pointers.set(e.pointerId, { role });
    if (role === "stick") {
      this.stick.active = true;
      this.stick.ox = e.clientX;
      this.stick.oy = e.clientY;
      this.stick.x = 0;
      this.stick.y = 0;
    } else {
      this.buttons.add(role);
    }
  };

  private onPtrMove = (e: PointerEvent) => {
    const p = this.pointers.get(e.pointerId);
    if (!p) return;
    if (p.role === "stick") this.updateStick(e);
  };

  private releasePointer(pointerId: number) {
    const p = this.pointers.get(pointerId);
    if (!p) return;
    this.pointers.delete(pointerId);
    if (p.role === "stick") {
      const still = [...this.pointers.values()].some((q) => q.role === "stick");
      if (!still) {
        this.stick.active = false;
        this.stick.x = 0;
        this.stick.y = 0;
      }
    } else {
      this.buttons.delete(p.role);
    }
  }

  private onPtrUp = (e: PointerEvent) => {
    this.releasePointer(e.pointerId);
  };

  private onLostCapture = (e: PointerEvent) => {
    // Safari on iPhone fires this while the thumb is still down. Keep the stick.
    if (e.buttons) return;
    this.releasePointer(e.pointerId);
  };

  /** Window-level safety: if the finger lifts outside the game root, still release. */
  private onWindowPtrEnd = (e: PointerEvent) => {
    if (!this.pointers.has(e.pointerId)) return;
    this.releasePointer(e.pointerId);
  };

  private updateStick(e: PointerEvent) {
    let x = (e.clientX - this.stick.ox) / this.stickRadius;
    let y = (e.clientY - this.stick.oy) / this.stickRadius;
    const m = Math.hypot(x, y);
    if (m > 1) {
      x /= m;
      y /= m;
    }
    // Slightly larger dead-zone so a resting thumb does not drift into movement.
    if (m < 0.28) {
      x = 0;
      y = 0;
    }
    this.stick.x = x;
    this.stick.y = y;
  }

  setKeys(codes: string[]) {
    this.forced = new Set(codes);
  }

  held(code: string) {
    return this.keys.has(code) || this.forced.has(code);
  }

  edge(code: string) {
    return this.latched.has(code) || (this.held(code) && !this.prev.has(code));
  }

  poll(): Actions {
    // Defensive: if the stick claims active but no stick pointer remains, force-release.
    // Covers rare mobile cases where up/cancel/lostcapture never arrived.
    if (this.stick.active) {
      const stillStick = [...this.pointers.values()].some((q) => q.role === "stick");
      if (!stillStick) {
        this.stick.active = false;
        this.stick.x = 0;
        this.stick.y = 0;
      }
    }

    const a = empty();
    let mx = 0;
    if (this.held("KeyA") || this.held("ArrowLeft")) mx -= 1;
    if (this.held("KeyD") || this.held("ArrowRight")) mx += 1;
    if (this.stick.active) {
      if (this.stick.x > 0.28) mx += 1;
      else if (this.stick.x < -0.28) mx -= 1;
    }
    if (this.buttons.has("left")) mx -= 1;
    if (this.buttons.has("right")) mx += 1;
    a.moveX = Math.max(-1, Math.min(1, mx));
    a.down =
      this.held("KeyS") ||
      this.held("ArrowDown") ||
      this.stick.y > 0.48 ||
      this.buttons.has("down");
    const jumpNow =
      this.held("Space") ||
      this.held("KeyW") ||
      this.held("ArrowUp") ||
      this.buttons.has("jump");
    a.jumpHeld = jumpNow || this.stick.y < -0.48;
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

    // Stem / Shelf — keyboard L is stem (wall); hold down + L for shelf.
    // Touch: dedicated Stem / Shelf roles.
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

    // Direct party slots 1–8 (keyboard + portrait touch buttons).
    for (let i = 1; i <= 8; i++) {
      const digit = `Digit${i}`;
      const role = `p${i}`;
      if (this.edge(digit) || (this.buttons.has(role) && !this.prevButtons.has(role))) {
        a.swap = i;
        break;
      }
    }

    // Cycle the cell when the roster outgrows a single number row.
    // Tab / Q / ]  → next ·  ` / [ / R  → previous · touch: cycle / cyclePrev
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
