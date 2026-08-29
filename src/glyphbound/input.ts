import { codesFor, KEY_DEFS, type KeyAction } from "./keys";

export type Actions = {
  moveX: number;
  /** Stick / arrows for melee aim. -1 left, +1 right. */
  aimX: number;
  /** Stick / arrows for melee aim. -1 up, +1 down. */
  aimY: number;
  down: boolean;
  jump: boolean;
  jumpHeld: boolean;
  attack: boolean;
  attackHeld: boolean;
  fang: boolean;
  fangHeld: boolean;
  special: boolean;
  specialHeld: boolean;
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
  aimX: 0,
  aimY: 0,
  down: false,
  jump: false,
  jumpHeld: false,
  attack: false,
  attackHeld: false,
  fang: false,
  fangHeld: false,
  special: false,
  specialHeld: false,
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
  "KeyH",
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
  keymap: Partial<Record<string, string>> = {};
  capturing = false;
  private stickRadius = 56;
  private padHeld = new Set<number>();

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

  private boundCodes() {
    const out = new Set(GAME_KEYS);
    for (const d of KEY_DEFS) for (const c of codesFor(this.keymap, d.id)) out.add(c);
    return out;
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (!this.enabled || this.capturing) return;
    if (this.boundCodes().has(e.code)) e.preventDefault();
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
    const act = (id: KeyAction) => codesFor(this.keymap, id).some((c) => this.held(c));
    const edgeAct = (id: KeyAction) => codesFor(this.keymap, id).some((c) => this.edge(c));
    let mx = 0;
    if (act("left")) mx -= 1;
    if (act("right")) mx += 1;
    if (this.stick.active) {
      if (this.stick.x > 0.28) mx += 1;
      else if (this.stick.x < -0.28) mx -= 1;
    }
    if (this.buttons.has("left")) mx -= 1;
    if (this.buttons.has("right")) mx += 1;
    a.moveX = Math.max(-1, Math.min(1, mx));
    a.down = act("down") || this.stick.y > 0.48 || this.buttons.has("down");
    const upKey = act("up");
    const attackHeld = act("attack") || this.buttons.has("attack");
    let aimX = mx;
    if (this.stick.active && Math.abs(this.stick.x) > 0.28) aimX = this.stick.x;
    a.aimX = Math.max(-1, Math.min(1, aimX));
    if (this.stick.active && Math.abs(this.stick.y) > 0.4) {
      a.aimY = this.stick.y > 0 ? 1 : -1;
    } else if (a.down && !upKey) {
      a.aimY = 1;
    } else if (upKey && !a.down) {
      a.aimY = -1;
    } else {
      a.aimY = 0;
    }
    const jumpBtn = act("jump") || this.buttons.has("jump");
    // W / ArrowUp / stick-up aim the melee kit. Space and the Jump pad still hop.
    // Holding Strike plus up is an up-tilt / up-smash, not a jump.
    const tapJump = (upKey || this.stick.y < -0.48) && !attackHeld;
    a.jumpHeld = jumpBtn || tapJump;
    a.jump =
      edgeAct("jump") ||
      (this.buttons.has("jump") && !this.prevButtons.has("jump")) ||
      (!attackHeld && edgeAct("up"));
    a.attackHeld = attackHeld;
    a.attack = edgeAct("attack") || (this.buttons.has("attack") && !this.prevButtons.has("attack"));
    a.fangHeld = act("fang") || this.buttons.has("fang");
    a.fang = edgeAct("fang") || (this.buttons.has("fang") && !this.prevButtons.has("fang"));
    a.special = edgeAct("special") || (this.buttons.has("special") && !this.prevButtons.has("special"));
    a.specialHeld = act("special") || this.buttons.has("special");
    a.interact = edgeAct("interact") || (this.buttons.has("interact") && !this.prevButtons.has("interact"));
    a.pause = edgeAct("pause") || (this.buttons.has("pause") && !this.prevButtons.has("pause"));

    // Stem / Shelf — keyboard L is stem (wall); hold down + L for shelf.
    // Touch: dedicated Stem / Shelf roles.
    const stemTap = this.buttons.has("stem") && !this.prevButtons.has("stem");
    const shelfTap = this.buttons.has("shelf") && !this.prevButtons.has("shelf");
    const wordKey = edgeAct("stem") || (this.buttons.has("word") && !this.prevButtons.has("word"));
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
    // F is Fang, never cycle.
    if (edgeAct("cycle") || (this.buttons.has("cycle") && !this.prevButtons.has("cycle"))) {
      a.cycle = 1;
    } else if (
      this.edge("Backquote") ||
      this.edge("BracketLeft") ||
      this.edge("KeyR") ||
      (this.buttons.has("cyclePrev") && !this.prevButtons.has("cyclePrev"))
    ) {
      a.cycle = -1;
    }

    this.mergeGamepad(a);

    this.prev = new Set([...this.keys, ...this.forced]);
    this.prevButtons = new Set(this.buttons);
    this.latched.clear();
    return a;
  }

  private mergeGamepad(a: Actions) {
    const pads =
      typeof navigator !== "undefined" && typeof navigator.getGamepads === "function"
        ? navigator.getGamepads()
        : [];
    const next = new Set<number>();
    for (const gp of pads) {
      if (!gp) continue;
      applyGamepad(a, gp, this.padHeld, next);
    }
    this.padHeld = next;
  }
}

const PAD_DEAD = 0.28;

/** Standard layout: A jump, X/B strike, Y fang, RB skill, LB cycle, Start pause. */
export function applyGamepad(
  a: Actions,
  gp: { axes: readonly number[]; buttons: readonly { pressed: boolean }[] },
  prev: Set<number>,
  next: Set<number>,
) {
  const ax = gp.axes[0] ?? 0;
  const ay = gp.axes[1] ?? 0;
  if (ax > PAD_DEAD) a.moveX = Math.min(1, a.moveX + 1);
  else if (ax < -PAD_DEAD) a.moveX = Math.max(-1, a.moveX - 1);
  if (Math.abs(ax) > PAD_DEAD) a.aimX = Math.max(-1, Math.min(1, ax));
  if (ay > 0.48) {
    a.down = true;
    a.aimY = 1;
  } else if (ay < -0.48) {
    a.aimY = -1;
  }
  const down = (i: number) => !!gp.buttons[i]?.pressed;
  const edge = (i: number) => {
    if (down(i)) next.add(i);
    return down(i) && !prev.has(i);
  };
  if (down(14)) a.moveX = Math.max(-1, a.moveX - 1);
  if (down(15)) a.moveX = Math.min(1, a.moveX + 1);
  if (down(14)) a.aimX = -1;
  if (down(15)) a.aimX = 1;
  if (down(13)) {
    a.down = true;
    a.aimY = 1;
  }
  if (down(12) && a.aimY === 0) a.aimY = -1;
  if (down(0)) a.jumpHeld = true;
  if (edge(0)) a.jump = true;
  if (down(1) || down(2)) a.attackHeld = true;
  if (edge(1) || edge(2)) a.attack = true;
  if (down(3)) a.fangHeld = true;
  if (edge(3)) a.fang = true;
  if (down(5)) a.specialHeld = true;
  if (edge(5)) a.special = true;
  if (edge(4)) a.cycle = 1;
  if (edge(9) || edge(8)) a.pause = true;
}
