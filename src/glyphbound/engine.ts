import {
  drawBeacon,
  drawEnemy,
  drawHudCanvas,
  drawLetterForm,
  drawMarkers,
  drawNpcGlyph,
  drawParallax,
  drawPickup,
  drawPlayer,
  drawShot,
  drawTiles,
  drawWeatherFront,
  drawGrade,
  setFxLite,
} from "./draw";
import { AudioBus } from "./audio";
import { Input } from "./input";
import { lastClearedId, LEVELS, nextStageId, STAGE_COUNT, type LevelId } from "./levels";
import { parseRows } from "./parse-map";
import { CATALOG } from "./catalog";
import { folioFromMeta, padRows, type Folio } from "./folio";
import { blankFolio, cloneRows, folioTheme, resizeRows, sandboxSave, stampCell } from "./studio";
import { collectedLore, loreIdFromGlyph } from "./lore";
import { KITS, PENTAD } from "./roster";
import { clearSave, defaultSave, loadSave, writeSave } from "./save";
import { SolidGrid } from "./spatial";
import {
  STEP,
  TILE,
  VIEW_H,
  VIEW_W,
  FIRST_BOOK,
  type Bullet,
  type Construct,
  type Enemy,
  type EnemyKind,
  type LetterId,
  type Marker,
  type Mode,
  type Npc,
  type Particle,
  type Pickup,
  type Player,
  type RelicId,
  type SaveData,
  type ThemeId,
  type Solid,
  type TaskSnap,
  type UiSnap,
  type WordId,
} from "./types";

function aabb(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function padBox(r: { x: number; y: number; w: number; h: number }, px: number, py = px) {
  return { x: r.x - px, y: r.y - py, w: r.w + px * 2, h: r.h + py * 2 };
}

function bodySize(letter: LetterId, capital: boolean): { w: number; h: number } {
  const k = KITS[letter] ?? KITS.c;
  return capital ? { w: k.capW, h: k.capH } : { w: k.w, h: k.h };
}

function isLarge(letter: LetterId, capital: boolean) {
  return capital || KITS[letter]?.large === true;
}

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  input = new Input();
  audio = new AudioBus();
  save: SaveData = loadSave();
  mode: Mode = "title";
  prevMode: Mode = "title";
  acc = 0;
  time = 0;
  raf = 0;
  last = 0;
  running = false;
  introPage = 0;
  toast = "";
  toastT = 0;
  dialogue: UiSnap["dialogue"] = null;
  dialogueQueue: { name: string; text: string; who: string }[] = [];
  talkingNpc: string | null = null;
  transformT = 0;
  camX = 0;
  camY = 0;
  look = 0;
  trauma = 0;
  hitstop = 0;
  objective = "";
  stage: LevelId = "hub";
  rows: string[] = [];
  solids: Solid[] = [];
  broken = new Set<string>();
  enemies: Enemy[] = [];
  bullets: Bullet[] = [];
  particles: Particle[] = [];
  pickups: Pickup[] = [];
  npcs: Npc[] = [];
  markers: Marker[] = [];
  player!: Player;
  selectedWord = 0;
  wordCd = 0;
  swapCd = 0;
  walls: Construct[] = [];
  burns: { x: number; y: number; w: number; h: number; life: number }[] = [];
  spawnX = 80;
  spawnY = 80;
  checkX = 80;
  checkY = 80;
  lastSafeX = 80;
  lastSafeY = 80;
  recallCd = 0;
  oobT = 0;
  dashVx = 0;
  dashVy = 0;
  airDash = 1;
  worldW = 1000;
  worldH = 600;
  ui: (s: UiSnap) => void;
  titleC = 0;
  /** Title-screen type buffer for the Chief69 unlock. */
  cheatBuf = "";
  private uiAt = 0;
  hard = false;
  wordMenu = false;
  returnT = 0;
  intBuf = 0;
  nearHint = "";
  lastDone = new Set<string>();
  lastCheck = "";
  wallCoyote = 0;
  wallDir: 1 | -1 = 1;
  lite = false;
  fps = 0;
  frameMs = 0;
  drawMs = 0;
  showFps = true;
  tick: ((now: number) => void) | null = null;
  private bufW = 0;
  private bufH = 0;
  private visHidden = false;
  private holdVisible = false;
  private grid = new SolidGrid(96);
  private fpsEma = 60;
  private frames = 0;
  private fpsStamp = 0;
  private lastRaf = 0;
  private watch = 0;
  sandbox = false;
  studioPlaying = false;
  studioBrush = "#";
  studioHover = { tx: -1, ty: -1 };
  private campaignSave: SaveData | null = null;
  private draft: Folio | null = null;
  private undo: string[][] = [];
  private themeOverride: ThemeId | null = null;

  constructor(canvas: HTMLCanvasElement, ui: (s: UiSnap) => void) {
    this.canvas = canvas;
    const ctx =
      canvas.getContext("2d", { alpha: false }) || canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    this.ctx = ctx;
    this.ui = ui;
    this.hard = this.save.hard;
    this.player = this.makePlayer();
  }

  start() {
    this.running = true;
    this.lite =
      window.matchMedia("(pointer: coarse)").matches ||
      Math.min(window.innerWidth, window.innerHeight) < 520 ||
      /iPhone|iPod|iPad/.test(navigator.userAgent);
    setFxLite(this.lite);
    this.last = performance.now();
    this.fpsStamp = this.last;
    const onVis = () => {
      if (this.holdVisible) {
        this.visHidden = false;
        return;
      }
      this.visHidden = document.hidden;
      if (!this.visHidden) this.wake();
    };
    document.addEventListener("visibilitychange", onVis);
    (this as unknown as { _onVis?: () => void })._onVis = onVis;
    const onVp = () => {
      this.bufW = 0;
    };
    window.visualViewport?.addEventListener("resize", onVp);
    window.addEventListener("orientationchange", onVp);
    (this as unknown as { _onVp?: () => void })._onVp = onVp;
    const onShow = () => this.wake();
    window.addEventListener("pageshow", onShow);
    window.addEventListener("focus", onShow);
    const onFreeze = () => {
      if (this.holdVisible) return;
      this.visHidden = true;
      this.input.clear();
    };
    document.addEventListener("freeze", onFreeze);
    (this as unknown as { _onShow?: () => void; _onFreeze?: () => void })._onShow = onShow;
    (this as unknown as { _onFreeze?: () => void })._onFreeze = onFreeze;
    const loop = (now: number) => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      this.lastRaf = now;
      this.pump(now);
    };
    this.tick = loop;
    this.raf = requestAnimationFrame(loop);
    this.watch = window.setInterval(() => {
      if (!this.running || this.visHidden) return;
      const now = performance.now();
      if (now - this.lastRaf < 32) return;
      this.pump(now);
    }, 16);
    this.emit();
    this.exposeQa();
  }

  /** Resume the loop after a background tab or a headless rAF stall. */
  wake(hold = false) {
    if (hold) this.holdVisible = true;
    this.visHidden = false;
    this.last = performance.now();
    this.acc = 0;
    this.bufW = 0;
    try {
      this.audio.unlock();
    } catch {
      /* background audio */
    }
    if (!this.running || !this.tick) return;
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(this.tick);
  }

  pump(now = performance.now()) {
    if (!this.running) return;
    if (this.visHidden) {
      this.last = now;
      return;
    }
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > 0.1) dt = 0.1;
    if (dt < 0) dt = 0;
    this.frameMs = dt * 1000;
    const inst = dt > 0.0005 ? 1 / dt : 60;
    this.fpsEma = this.fpsEma * 0.9 + inst * 0.1;
    this.frames += 1;
    if (now - this.fpsStamp >= 250) {
      this.fps = this.fpsEma;
      this.fpsStamp = now;
    }
    this.acc += dt;
    this.time += dt;
    if (this.hitstop > 0) this.hitstop -= dt;
    let steps = 0;
    while (this.acc >= STEP && steps < 4) {
      this.acc -= STEP;
      steps += 1;
      if (this.hitstop <= 0) this.step(STEP);
    }
    if (this.acc > STEP * 2) this.acc = 0;
    this.audio.tickMusic(dt);
    const d0 = performance.now();
    this.draw();
    this.drawMs = performance.now() - d0;
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    if (this.watch) {
      clearInterval(this.watch);
      this.watch = 0;
    }
    this.input.detach();
    const extra = this as unknown as { _onVis?: () => void; _onVp?: () => void; _onShow?: () => void; _onFreeze?: () => void };
    if (extra._onVis) document.removeEventListener("visibilitychange", extra._onVis);
    if (extra._onVp) {
      window.visualViewport?.removeEventListener("resize", extra._onVp);
      window.removeEventListener("orientationchange", extra._onVp);
    }
    if (extra._onShow) {
      window.removeEventListener("pageshow", extra._onShow);
      window.removeEventListener("focus", extra._onShow);
    }
    if (extra._onFreeze) document.removeEventListener("freeze", extra._onFreeze);
    const w = window as unknown as { __glyphbound?: unknown };
    if (w.__glyphbound && (w.__glyphbound as { engine?: GameEngine }).engine === this) {
      delete w.__glyphbound;
    }
  }

  private syncVitals() {
    const p = this.player;
    const kit = KITS[p.letter] ?? KITS.c;
    p.maxShield = this.save.maxShield + (p.capital ? 1 : 0) - (p.letter === "s" || p.letter === "r" ? 1 : 0);
    if (p.maxShield < 2) p.maxShield = 2;
    if (p.shield > p.maxShield) p.shield = p.maxShield;
    p.shotLevel = this.save.shotLevel;
    p.maxInk = 40 + this.save.words.length * 8 + (p.letter === "t" || p.letter === "e" ? 8 : 0) - (p.letter === "r" ? 8 : 0);
    const extra = (p.capital ? 2 : 0) + (this.save.relics.includes("spine") ? 1 : 0);
    p.maxHp = kit.hp + extra;
    if (p.hp > p.maxHp) p.hp = p.maxHp;
  }

  private makePlayer(): Player {
    const cap = this.save.capital && this.save.hasCapital;
    const startLetter =
      this.save.letter && this.save.party.includes(this.save.letter) ? this.save.letter : "c";
    const sz = bodySize(startLetter, cap);
    const kit = KITS[startLetter] ?? KITS.c;
    const maxShield = this.save.maxShield + (cap ? 1 : 0) - (startLetter === "s" || startLetter === "r" ? 1 : 0);
    return {
      x: 80,
      y: 80,
      vx: 0,
      vy: 0,
      w: sz.w,
      h: sz.h,
      letter: startLetter,
      capital: cap,
      facing: 1,
      hp: this.save.hp || kit.hp,
      maxHp: kit.hp + (cap ? 2 : 0) + (this.save.relics.includes("spine") ? 1 : 0),
      ink: this.save.ink > 0 ? this.save.ink : 18,
      maxInk: 40 + this.save.words.length * 8 + (startLetter === "e" ? 8 : 0) - (startLetter === "r" ? 8 : 0),
      coyote: 0,
      jumpBuf: 0,
      jumpCut: false,
      grounded: false,
      invuln: 0,
      attack: 0,
      attackHit: false,
      special: 0,
      specialCd: 0,
      roll: 0,
      squash: 1,
      stretch: 1,
      anim: 0,
      hurtFlash: 0,
      shield: Math.max(2, maxShield),
      maxShield: Math.max(2, maxShield),
      shieldCd: 3,
      shieldFlash: 0,
      shotLevel: this.save.shotLevel || 1,
      shotCd: 0,
      airHop: startLetter === "s" ? 1 : 0,
    };
  }

  private applySize() {
    const p = this.player;
    const sz = bodySize(p.letter, p.capital);
    const feet = p.y + p.h;
    const mid = p.x + p.w / 2;
    p.w = sz.w;
    p.h = sz.h;
    p.y = feet - p.h;
    p.x = mid - p.w / 2;
    const large = isLarge(p.letter, p.capital);
    if (this.solids.length && this.blockedAt(p.x, p.y, p.w, p.h, large)) {
      for (let i = 0; i < 28 && this.blockedAt(p.x, p.y, p.w, p.h, large); i++) p.y -= 2;
    }
    this.syncVitals();
  }

  private settleOnFloor() {
    const p = this.player;
    if (!this.solids.length) return;
    const large = isLarge(p.letter, p.capital);
    for (let i = 0; i < 96; i++) {
      if (this.blockedAt(p.x + 3, p.y + p.h, p.w - 6, 4, large)) break;
      p.y += 2;
      if (p.y > this.worldH) break;
    }
    for (let i = 0; i < 32 && this.blockedAt(p.x, p.y, p.w, p.h, large); i++) p.y -= 2;
    if (p.x < TILE) p.x = TILE + 4;
    if (p.x + p.w > this.worldW - TILE) p.x = this.worldW - TILE - p.w - 4;
  }

  private markSafeGround() {
    const p = this.player;
    if (!p.grounded || p.vy < -12 || p.roll > 0) return;
    if (p.y + p.h > this.worldH - TILE) return;
    const large = isLarge(p.letter, p.capital);
    if (!this.blockedAt(p.x + 4, p.y + p.h, p.w - 8, 6, large)) return;
    if (this.hazardAt(p.x, p.y, p.w, p.h)) return;
    this.lastSafeX = p.x;
    this.lastSafeY = p.y;
  }

  private watchBounds(dt: number) {
    const p = this.player;
    if (this.mode !== "play" && this.mode !== "hub") {
      this.oobT = 0;
      return;
    }
    if (this.recallCd > 0) return;
    const offX = p.x + p.w < -TILE || p.x > this.worldW + TILE;
    const offY = p.y > this.worldH + 20 || p.y + p.h < -TILE * 2;
    if (offX || offY) {
      this.oobT += dt;
      if (this.oobT > 0.2) this.recallToMap();
    } else {
      this.oobT = 0;
    }
  }

  private recallToMap() {
    const p = this.player;
    let x = this.lastSafeX;
    let y = this.lastSafeY;
    const bad =
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      y > this.worldH - TILE ||
      x < 0 ||
      x > this.worldW;
    if (bad) {
      x = this.checkX || this.spawnX;
      y = this.checkY || this.spawnY;
    }
    p.x = x;
    p.y = y;
    p.vx = 0;
    p.vy = 0;
    p.invuln = 0.9;
    p.squash = 0.82;
    p.stretch = 1.08;
    p.roll = 0;
    this.recallCd = 0.4;
    this.oobT = 0;
    this.settleOnFloor();
    this.lastSafeX = p.x;
    this.lastSafeY = p.y;
    this.camX = p.x - VIEW_W * 0.35;
    this.camY = p.y - VIEW_H * 0.62;
    this.burst(p.x + p.w / 2, p.y + p.h / 2, "#e8d48a", 10, "glyph");
    this.audio.sfxWord();
    this.say("Back on the page.");
  }

  loadLevel(id: LevelId, atCheck = false) {
    const meta = LEVELS[id];
    if (!meta) return;
    this.stage = id;
    this.themeOverride = null;
    this.rows = meta.rows;
    this.objective = meta.objective;
    const parsed = parseRows(this.rows, {
      id,
      exit: meta.exit,
      index: this.stageIndex(id),
      isHub: id === "hub",
      party: this.save.party,
      words: this.save.words,
      relics: this.save.relics,
      hasCapital: this.save.hasCapital,
      powerups: this.save.powerups,
      maxShield: this.save.maxShield,
      shotLevel: this.save.shotLevel,
      talked: this.save.talked,
      bossKind: this.bossKindFor(id),
    });
    this.solids = parsed.solids;
    this.enemies = parsed.enemySpawns.map((s) => this.spawnEnemy(s.kind, s.x, s.y));
    this.bullets = [];
    this.pickups = parsed.pickups;
    if (id === "hub" && !this.pickups.some((u) => u.id === "studio")) {
      this.pickups.push({
        kind: "door",
        id: "studio",
        x: 82 * TILE - 12,
        y: 7 * TILE + TILE - 96,
        w: 72,
        h: 96,
        taken: false,
        label: "STUDIO",
      });
    }
    this.npcs = parsed.npcs;
    this.markers = parsed.markers;
    this.walls = [];
    this.burns = [];
    this.broken = new Set();
    this.worldW = parsed.worldW;
    this.worldH = parsed.worldH;
    this.rebuildGrid();
    this.spawnX = parsed.spawnX;
    this.spawnY = parsed.spawnY;
    this.checkX = this.save.stage === id && this.save.checkX ? this.save.checkX : this.spawnX;
    this.checkY = this.save.stage === id && this.save.checkY ? this.save.checkY : this.spawnY;
    if (atCheck && this.checkX) {
      const cut = this.checkX;
      this.enemies = this.enemies.filter((e) => e.x + e.w * 0.5 >= cut - 16);
    }
    const p = this.player;
    p.x = atCheck ? this.checkX : this.spawnX;
    p.y = atCheck ? this.checkY : this.spawnY;
    if (id === "hub" && this.save.progress >= 5 && !atCheck) {
      const bound = this.pickups.find((u) => u.id === "continue");
      if (bound) {
        p.x = bound.x - p.w - 10;
        p.y = bound.y + bound.h - p.h;
      }
    }
    p.vx = 0;
    p.vy = 0;
    p.invuln = 0.6;
    this.applySize();
    this.settleOnFloor();
    this.lastSafeX = p.x;
    this.lastSafeY = p.y;
    this.recallCd = 0;
    this.oobT = 0;
    this.airDash = 1;
    this.camX = p.x - VIEW_W * 0.35;
    this.camY = p.y - VIEW_H * 0.62;
    this.mode = id === "hub" ? "hub" : "play";
    if (!this.sandbox) {
      this.save.stage = id;
      if (!this.save.visited.includes(id)) this.save.visited.push(id);
    }
    this.lastDone = new Set(this.currentTasks().filter((t) => t.done).map((t) => t.id));
    if (id === "hub")
      this.say(
        this.save.progress >= 5
          ? "Those five doors are finished chapters. This hall is the rest of the book — the only door that keeps opening new ledgers."
          : "Left hall: five closed chapters, one ledger each. Finish them, then the Unbound Sentence opens on the right.",
      );
    this.persist();
    this.emit();
  }

  enterStudio(folio?: Folio) {
    if (!this.sandbox) this.campaignSave = structuredClone(this.save);
    this.sandbox = true;
    this.save = sandboxSave();
    this.save.muted = this.audio.muted;
    this.save.hard = this.hard;
    this.player = this.makePlayer();
    this.draft = folio ? { ...folio, rows: padRows(folio.rows) } : blankFolio();
    this.undo = [];
    this.studioPlaying = false;
    this.studioBrush = "#";
    this.applyDraft("studio");
    this.audio.unlock();
    this.audio.sfxUi();
    this.say("The desk is open. Paint the ledger. Play to walk it.");
  }

  leaveStudio() {
    this.sandbox = false;
    this.studioPlaying = false;
    this.draft = null;
    this.undo = [];
    this.themeOverride = null;
    if (this.campaignSave) {
      this.save = this.campaignSave;
      this.campaignSave = null;
    }
    this.player = this.makePlayer();
    this.mode = "title";
    this.rows = [];
    this.emit();
  }

  studioFolio(): Folio | null {
    if (!this.draft) return null;
    return { ...this.draft, rows: cloneRows(this.draft.rows) };
  }

  studioSetBrush(ch: string) {
    this.studioBrush = ch || ".";
    this.emit();
  }

  studioSetName(name: string) {
    if (!this.draft) return;
    this.draft.name = name.slice(0, 48);
    this.emit();
  }

  studioSetTheme(theme: ThemeId) {
    if (!this.draft) return;
    this.draft.theme = folioTheme(theme);
    this.themeOverride = this.draft.theme;
    this.emit();
  }

  studioResize(w: number, h: number) {
    if (!this.draft || this.mode !== "studio") return;
    this.pushUndo();
    this.draft.rows = resizeRows(this.draft.rows, w, h);
    this.applyDraft("studio");
  }

  studioStamp(tx: number, ty: number, ch = this.studioBrush) {
    if (!this.draft || this.mode !== "studio") return false;
    this.pushUndo();
    if (!stampCell(this.draft.rows, tx, ty, ch)) {
      this.undo.pop();
      return false;
    }
    this.applyDraft("studio");
    return true;
  }

  studioUndo() {
    const prev = this.undo.pop();
    if (!prev || !this.draft || this.mode !== "studio") return;
    this.draft.rows = prev;
    this.applyDraft("studio");
  }

  studioPlay() {
    if (!this.draft) this.enterStudio();
    if (!this.draft) return;
    this.studioPlaying = true;
    this.applyDraft("play");
    this.say("Walking the draft. Esc returns to the desk.");
  }

  studioStop() {
    if (!this.draft) return;
    this.studioPlaying = false;
    this.applyDraft("studio");
  }

  studioCopyStage(id: string) {
    const meta = LEVELS[id];
    if (!meta) return;
    const folio = folioFromMeta(meta, "user");
    folio.id = "folio-" + Date.now().toString(36);
    folio.name = meta.name + " copy";
    this.enterStudio(folio);
  }

  screenToTile(clientX: number, clientY: number) {
    const r = this.canvas.getBoundingClientRect();
    const cw = r.width || VIEW_W;
    const ch = r.height || VIEW_H;
    const scale = Math.min(cw / VIEW_W, ch / VIEW_H);
    const ox = (cw - VIEW_W * scale) / 2;
    const oy = (ch - VIEW_H * scale) / 2;
    const worldX = this.camX + (clientX - r.left - ox) / scale;
    const worldY = this.camY + (clientY - r.top - oy) / scale;
    return { tx: Math.floor(worldX / TILE), ty: Math.floor(worldY / TILE) };
  }

  private applyDraft(mode: "studio" | "play") {
    const folio = this.draft;
    if (!folio) return;
    this.themeOverride = folio.theme;
    this.objective = folio.objective ?? "Write a ledger.";
    this.stage = folio.id as LevelId;
    const parsed = parseRows(folio.rows, {
      id: folio.id,
      exit: folio.exit === "win" ? "win" : "hub",
      index: folio.index ?? 0,
      isHub: false,
      party: this.save.party,
      words: this.save.words,
      relics: this.save.relics,
      hasCapital: this.save.hasCapital,
      powerups: this.save.powerups,
      maxShield: this.save.maxShield,
      shotLevel: this.save.shotLevel,
      talked: this.save.talked,
      bossKind: this.bossKindFor(folio.index ? `stage${folio.index}` : folio.id),
    });
    this.rows = folio.rows;
    this.solids = parsed.solids;
    this.enemies = parsed.enemySpawns.map((s) => this.spawnEnemy(s.kind, s.x, s.y));
    this.bullets = [];
    this.pickups = parsed.pickups;
    this.npcs = parsed.npcs;
    this.markers = parsed.markers;
    this.walls = [];
    this.burns = [];
    this.broken = new Set();
    this.worldW = parsed.worldW;
    this.worldH = parsed.worldH;
    this.rebuildGrid();
    this.spawnX = parsed.spawnX;
    this.spawnY = parsed.spawnY;
    this.checkX = parsed.spawnX;
    this.checkY = parsed.spawnY;
    const p = this.player;
    p.x = this.spawnX;
    p.y = this.spawnY;
    p.vx = 0;
    p.vy = 0;
    p.hp = p.maxHp;
    p.invuln = 0.4;
    this.applySize();
    this.settleOnFloor();
    this.lastSafeX = p.x;
    this.lastSafeY = p.y;
    this.camX = Math.max(0, p.x - VIEW_W * 0.35);
    this.camY = Math.max(0, p.y - VIEW_H * 0.62);
    this.mode = mode;
    this.emit();
  }

  private pushUndo() {
    if (!this.draft) return;
    this.undo.push(cloneRows(this.draft.rows));
    if (this.undo.length > 64) this.undo.shift();
  }

  private stageIndex(id: string = this.stage): number {
    if (id === "hub") return 0;
    const n = Number(String(id).replace("stage", ""));
    return Number.isFinite(n) ? n : 0;
  }

  private isBossKind(kind: EnemyKind) {
    return (
      kind === "dualis" ||
      kind === "tetrarch" ||
      kind === "importer" ||
      kind === "nullis" ||
      kind === "endmark" ||
      kind === "summand" ||
      kind === "difference" ||
      kind === "product" ||
      kind === "quotient" ||
      kind === "infinitum" ||
      kind === "remainder"
    );
  }

  private bossKindFor(id: string): EnemyKind {
    if (id === "stage1") return "dualis";
    if (id === "stage2") return "importer";
    if (id === "stage5") return "nullis";
    const n = this.stageIndex(id);
    if (n === FIRST_BOOK) return "endmark";
    if (n === STAGE_COUNT) return "remainder";
    if (n === 35) return "summand";
    if (n === 40) return "difference";
    if (n === 45) return "product";
    if (n === 50) return "quotient";
    if (n === 55) return "infinitum";
    if (n % 10 === 0) return n > FIRST_BOOK ? "product" : "tetrarch";
    if (n % 10 === 5) return n > FIRST_BOOK ? "summand" : "nullis";
    return n > FIRST_BOOK ? "difference" : "importer";
  }

  private markProgress() {
    if (this.sandbox) return;
    const n = this.stageIndex();
    if (n < 1) return;
    this.save.progress = Math.max(this.save.progress, n);
    if (n === 1) this.save.stage1 = true;
    if (n === 2) this.save.stage2 = true;
    if (n === 3) this.save.stage3 = true;
    if (n === 4) this.save.stage4 = true;
    if (n === 5) this.save.stage5 = true;
    if (n === FIRST_BOOK && !this.save.relics.includes("counter")) {
      this.save.relics.push("counter");
      this.say("The Counter. What strikes the ward writes back.");
    }
    this.persist();
  }

  private spawnEnemy(kind: EnemyKind, x: number, y: number): Enemy {
    const sizes: Record<EnemyKind, { w: number; h: number; hp: number; name: string }> = {
      one: { w: 26, h: 44, hp: 2, name: "1" },
      dummy: { w: 26, h: 44, hp: 99, name: "Dummy 1" },
      zero: { w: 36, h: 36, hp: 6, name: "0" },
      two: { w: 38, h: 42, hp: 8, name: "2" },
      three: { w: 30, h: 40, hp: 5, name: "3" },
      four: { w: 40, h: 48, hp: 11, name: "4" },
      five: { w: 42, h: 52, hp: 16, name: "5" },
      six: { w: 34, h: 46, hp: 7, name: "6" },
      seven: { w: 28, h: 56, hp: 5, name: "7" },
      eight: { w: 38, h: 50, hp: 14, name: "8" },
      nine: { w: 34, h: 40, hp: 7, name: "9" },
      dualis: { w: 64, h: 72, hp: 36, name: "Dualis · 2" },
      tetrarch: { w: 78, h: 88, hp: 64, name: "Tetrarch · 4" },
      importer: { w: 70, h: 80, hp: 62, name: "G the Importer" },
      nullis: { w: 72, h: 72, hp: 74, name: "Nullis · 0" },
      triad: { w: 36, h: 42, hp: 8, name: "3-Splitter" },
      nullring: { w: 42, h: 42, hp: 11, name: "0-Iris" },
      mobius: { w: 32, h: 34, hp: 9, name: "8-Coil" },
      summoner: { w: 38, h: 48, hp: 13, name: "6-Caller" },
      gradient: { w: 36, h: 40, hp: 9, name: "7-Fall" },
      crossseal: { w: 44, h: 44, hp: 12, name: "4-Seal" },
      archivist: { w: 34, h: 46, hp: 11, name: "5-Clerk" },
      endmark: { w: 82, h: 86, hp: 92, name: "End-Mark · 8" },
      plus: { w: 40, h: 42, hp: 11, name: "+" },
      minus: { w: 38, h: 28, hp: 10, name: "−" },
      times: { w: 40, h: 40, hp: 12, name: "×" },
      divide: { w: 36, h: 44, hp: 11, name: "÷" },
      pi: { w: 38, h: 42, hp: 12, name: "π" },
      radix: { w: 24, h: 28, hp: 3, name: "." },
      summand: { w: 76, h: 80, hp: 78, name: "Summand · +" },
      difference: { w: 74, h: 70, hp: 82, name: "Difference · −" },
      product: { w: 78, h: 78, hp: 88, name: "Product · ×" },
      quotient: { w: 72, h: 84, hp: 90, name: "Quotient · ÷" },
      infinitum: { w: 86, h: 70, hp: 102, name: "Infinitum · ∞" },
      remainder: { w: 90, h: 88, hp: 118, name: "Remainder · %" },
    };
    const s = sizes[kind];
    const hp = this.hard ? Math.ceil(s.hp * 1.35) : s.hp;
    return {
      kind,
      x,
      y: y + TILE - s.h,
      vx: 0,
      vy: 0,
      w: s.w,
      h: s.h,
      hp,
      maxHp: hp,
      facing: -1,
      t: Math.random() * 10,
      hurt: 0,
      flash: 0,
      stun: 0,
      alive: true,
      grounded: false,
      phase: 0,
      aux: 0,
      aux2: 0,
      armor: kind === "eight" ? 1 : 0,
      name: s.name,
    };
  }

  begin() {
    if (this.mode !== "title") return;
    if (!this.uiOnce()) return;
    this.audio.unlock();
    this.audio.sfxUi();
    if (this.save.progress > 0 || this.save.stage1 || this.save.hasCapital) {
      this.loadLevel("hub");
    } else {
      this.mode = "intro";
      this.introPage = 0;
    }
    this.emit();
  }

  continueGame() {
    if (this.mode !== "title") return;
    if (!this.uiOnce()) return;
    this.audio.unlock();
    this.audio.sfxUi();
    const id = (this.save.stage as LevelId) || "hub";
    this.loadLevel(LEVELS[id] ? id : "hub", true);
  }

  newGame() {
    this.audio.unlock();
    clearSave();
    this.save = defaultSave();
    this.save.hard = this.hard;
    this.player = this.makePlayer();
    this.mode = "intro";
    this.introPage = 0;
    this.cheatBuf = "";
    this.emit();
  }

  /**
   * Title-screen cheat: type "Chief69" (case-insensitive) to open every ledger,
   * recruit the full pentad, grant capital case, all words, and all relics.
   * A small mercy for the Chief who already walked the path once.
   */
  feedCheat(ch: string) {
    if (this.mode !== "title") return;
    if (!ch || ch.length !== 1) return;
    this.cheatBuf = (this.cheatBuf + ch).slice(-24);
    if (!/chief69/i.test(this.cheatBuf)) return;
    this.cheatBuf = "";
    this.unlockAll();
  }

  unlockAll() {
    this.save.progress = STAGE_COUNT;
    this.save.stage1 = true;
    this.save.stage2 = true;
    this.save.stage3 = true;
    this.save.stage4 = true;
    this.save.stage5 = true;
    this.save.hasCapital = true;
    this.save.capital = true;
    this.save.party = [...PENTAD];
    this.save.words = ["WALL", "BURN", "RISE", "LOCK", "FOLD", "TIDE"];
    this.save.relics = ["dropCap", "spine", "copper", "counter"];
    this.save.shotLevel = 3;
    this.save.maxShield = 6;
    this.save.hp = 10;
    this.save.ink = 80;
    this.save.letter = "c";
    this.save.stage = "hub";
    this.player = this.makePlayer();
    this.player.hp = this.player.maxHp;
    this.player.ink = this.player.maxInk;
    this.player.shield = this.player.maxShield;
    this.player.shotLevel = 3;
    this.player.capital = true;
    writeSave(this.save);
    this.audio.unlock();
    this.audio.sfxUi();
    this.say("The ledgers open. Every page already written.");
    this.emit();
  }

  private persist() {
    if (this.sandbox) return;
    const p = this.player;
    this.save.hp = p.hp;
    this.save.ink = p.ink;
    this.save.capital = p.capital;
    this.save.checkX = this.checkX;
    this.save.checkY = this.checkY;
    this.save.muted = this.audio.muted;
    this.save.hard = this.hard;
    this.save.shotLevel = p.shotLevel;
    this.save.letter = p.letter;
    writeSave(this.save);
  }

  step(dt: number) {
    const a = this.input.poll();
    if (this.mode === "title") {
      this.titleC += dt;
      return;
    }
    if (this.mode === "studio") {
      if (a.pause) {
        this.leaveStudio();
        return;
      }
      this.camX += a.moveX * 340 * dt;
      if (a.jumpHeld) this.camY -= 280 * dt;
      if (a.down) this.camY += 280 * dt;
      this.camX = Math.max(0, Math.min(Math.max(0, this.worldW - VIEW_W), this.camX));
      this.camY = Math.max(0, Math.min(Math.max(0, this.worldH - VIEW_H), this.camY));
      return;
    }
    if (this.mode === "intro") {
      if (a.attack || a.jump || a.interact) {
        this.introPage += 1;
        this.audio.sfxUi();
        if (this.introPage > 3) this.loadLevel("hub");
        this.emit();
      }
      return;
    }
    if (this.mode === "pause" || this.mode === "codex") {
      if (a.pause) this.resume();
      return;
    }
    if (this.mode === "dead") {
      if (a.jump || a.attack) this.respawn();
      return;
    }
    if (this.mode === "win") return;
    if (this.mode === "dialogue") {
      if (a.attack || a.jump || a.interact) this.advanceDialogue();
      return;
    }
    if (this.mode === "transform") {
      this.transformT -= dt;
      this.burst(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, "#5ee0c0", 6, "glyph");
      if (this.transformT <= 0) {
        this.mode = this.stage === "hub" ? "hub" : "play";
        this.say("The curve closes. You are C.");
      }
      this.physicsPlayer(dt, { ...a, moveX: 0, jump: false, attack: false, attackHeld: false });
      this.updateParticles(dt);
      return;
    }
    if (a.pause) {
      if (this.studioPlaying) {
        this.studioStop();
        return;
      }
      this.prevMode = this.mode;
      this.mode = "pause";
      this.persist();
      this.emit();
      return;
    }
    if (this.toastT > 0) {
      this.toastT -= dt;
      if (this.toastT <= 0) this.toast = "";
    }
    if (this.returnT > 0) {
      this.returnT -= dt;
      if (this.returnT <= 0) this.loadLevel("hub");
    }
    this.physicsPlayer(dt, a);
    this.updateCombat(dt, a);
    this.updateEnemies(dt);
    this.updateBullets(dt);
    this.updatePickups();
    this.updateParticles(dt);
    this.walls = this.walls.filter((w) => {
      if (this.save.words.includes("TIDE") && w.kind === "plat") w.x += this.player.facing * 42 * dt;
      w.life -= this.save.words.includes("TIDE") ? dt * 0.62 : dt;
      return w.life > 0;
    });
    this.burns = this.burns.filter((b) => {
      b.life -= dt;
      return b.life > 0;
    });
    if (this.save.words.includes("BURN")) {
      for (const w of this.walls) {
        for (const e of this.enemies) {
          if (e.alive && aabb(e, w) && e.hurt <= 0) this.hitEnemy(e, 1, this.player.facing);
        }
      }
    }
    if (this.save.words.includes("LOCK")) {
      for (const w of this.walls) {
        for (const e of this.enemies) {
          if (e.alive && aabb(e, w) && e.stun < 0.35 && !this.isBossKind(e.kind)) e.stun = 1.45;
        }
      }
    }
    for (const e of this.enemies) {
      if (!e.alive || (e.kind !== "minus" && e.kind !== "difference")) continue;
      for (const w of this.walls) {
        const dx = w.x + w.w / 2 - (e.x + e.w / 2);
        const dy = w.y + w.h / 2 - (e.y + e.h / 2);
        if (Math.hypot(dx, dy) < 90) {
          w.life -= 2.4 * dt;
          if (w.life < 1) this.burst(w.x + w.w / 2, w.y, "#d45a4a", 4, "ink");
        }
      }
    }
    if (this.wordCd > 0) this.wordCd -= dt;
    if (this.swapCd > 0) this.swapCd -= dt;
    this.followCam(dt);
    this.trauma = Math.max(0, this.trauma - dt * 1.8);
    this.recallCd = Math.max(0, this.recallCd - dt);
    this.watchBounds(dt);
    this.maybeHud();
    this.noteTasks();
  }

  private hudAcc = 0;
  private maybeHud() {
    this.hudAcc += STEP;
    if (this.hudAcc > 0.12) {
      this.hudAcc = 0;
      this.emit();
    }
  }

  private physicsPlayer(dt: number, a: ReturnType<Input["poll"]>) {
    const p = this.player;
    const large = isLarge(p.letter, p.capital);
    const kit = KITS[p.letter] ?? KITS.c;
    const spd = kit.spd + (p.capital ? -12 : 0);
    if (p.roll <= 0) {
      if (a.moveX !== 0) p.facing = a.moveX > 0 ? 1 : -1;
      const target = a.moveX * spd;
      const reversing = a.moveX !== 0 && p.vx * a.moveX < 0;
      const rate = p.grounded ? (reversing ? 32 : 22) : reversing ? 14 : 10;
      p.vx += (target - p.vx) * (1 - Math.exp(-rate * dt));
      if (a.moveX === 0 && Math.abs(p.vx) < 6) p.vx = 0;
    }
    const gUp = 1300;
    const gDown = 2400;
    const aetherDash = p.roll > 0 && p.letter === "c";
    if (!a.jumpHeld && !p.jumpCut && p.vy < 0 && !aetherDash) {
      p.vy *= 0.52;
      p.jumpCut = true;
    }
    if (!aetherDash) {
      p.vy += (p.vy < 0 ? gUp : gDown) * dt;
      if (p.vy > 860) p.vy = 860;
    }
    if (p.letter === "s" && p.capital && a.jumpHeld && !p.grounded && p.vy > 60) {
      p.vy = 70;
    }
    if (p.grounded) p.airHop = p.letter === "s" ? 1 : 0;
    if (p.grounded) this.airDash = 1;
    if (p.grounded) p.coyote = 0.1;
    else p.coyote -= dt;
    if (a.jump) p.jumpBuf = 0.12;
    else p.jumpBuf -= dt;
    if (!aetherDash) {
    if (p.jumpBuf > 0 && p.coyote > 0) {
      p.vy = -kit.jump;
      p.grounded = false;
      p.coyote = 0;
      p.jumpBuf = 0;
      p.jumpCut = false;
      p.squash = 0.74;
      this.audio.sfxJump();
    } else if (p.jumpBuf > 0 && p.letter === "s" && p.airHop > 0 && !p.grounded) {
      p.vy = -(kit.jump * (p.capital ? 0.92 : 0.8));
      p.airHop = 0;
      p.jumpBuf = 0;
      p.jumpCut = false;
      p.squash = 0.8;
      p.stretch = 0.84;
      this.audio.sfxJump();
      this.burst(p.x + p.w / 2, p.y + p.h, "#7fd0ff", 8, "glyph");
      this.say("GALE");
    } else if (p.jumpBuf > 0 && this.save.words.includes("FOLD") && this.wallCoyote > 0 && !p.grounded) {
      p.vy = -505;
      p.vx = this.wallDir * 240;
      p.facing = this.wallDir;
      p.jumpBuf = 0;
      this.wallCoyote = 0;
      p.jumpCut = false;
      p.squash = 0.8;
      this.audio.sfxJump();
      this.burst(p.x + p.w / 2, p.y + p.h / 2, "#e8d48a", 6, "glyph");
    }
    }
    if (p.roll > 0) {
      p.roll -= dt;
      if (p.letter === "c") {
        p.vx = this.dashVx;
        p.vy = this.dashVy;
        for (const e of this.enemies) {
          if (e.alive && aabb(p, e) && e.hurt <= 0) {
            this.hitEnemy(e, 2, p.facing);
            e.stun = Math.max(e.stun, 0.4);
          }
        }
        for (const b of this.bullets) {
          if (!b.alive || b.from !== "enemy") continue;
          if (Math.hypot(b.x - (p.x + p.w / 2), b.y - (p.y + p.h / 2)) < 28) {
            b.alive = false;
            this.burst(b.x, b.y, "#5ee0c0", 4, "spark");
          }
        }
        if (Math.floor(this.time * 18) !== Math.floor((this.time - dt) * 18)) {
          this.burst(p.x + p.w / 2, p.y + p.h / 2, "#5ee0c0", 3, "glyph");
        }
        if (p.roll <= 0) {
          p.vx *= 0.38;
          p.vy *= 0.22;
        }
      } else {
        p.vx = p.facing * (p.letter === "r" ? (p.capital ? 360 : 310) : p.capital ? 250 : 270);
        if (p.letter === "r") {
          for (const e of this.enemies) {
            if (e.alive && aabb(p, e) && e.hurt <= 0) this.hitEnemy(e, p.capital ? 3 : 2, p.facing);
          }
          if (Math.floor(this.time * 14) !== Math.floor((this.time - dt) * 14)) {
            this.burns.push({
              x: p.x + 2,
              y: p.y + p.h - 12,
              w: p.w - 4,
              h: 12,
              life: p.capital ? 1.35 : 0.7,
            });
          }
        }
      }
    }
    p.invuln = Math.max(0, p.invuln - dt);
    p.hurtFlash = Math.max(0, p.hurtFlash - dt);
    p.attack = Math.max(0, p.attack - dt);
    p.special = Math.max(0, p.special - dt);
    p.specialCd = Math.max(0, p.specialCd - dt);
    p.shotCd = Math.max(0, p.shotCd - dt);
    p.shieldFlash = Math.max(0, p.shieldFlash - dt);
    if (p.shield < p.maxShield) {
      p.shieldCd -= dt;
      if (p.shieldCd <= 0) {
        p.shield += 1;
        p.shieldCd = 1.35;
        this.burst(p.x + p.w / 2, p.y + p.h / 2, "#8ec8d4", 6, "spark");
      }
    } else {
      p.shieldCd = 1.35;
    }
    p.ink = Math.min(p.maxInk, p.ink + kit.inkRate * dt);
    const prevAnim = p.anim;
    const walkSpd = Math.abs(p.vx);
    p.anim += dt * (walkSpd > 24 ? 7.5 + Math.min(6, walkSpd / 40) : 2.6);
    p.squash += (1 - p.squash) * Math.min(1, dt * 12);
    if (!p.grounded) {
      const want = p.vy < 0 ? 0.86 : 1.1;
      p.stretch += (want - p.stretch) * Math.min(1, dt * 10);
    } else {
      p.stretch += (1 - p.stretch) * Math.min(1, dt * 14);
    }
    if (p.grounded && walkSpd > 46 && Math.floor(p.anim) !== Math.floor(prevAnim) && Math.floor(p.anim) % 2 === 0) {
      this.burst(p.x + p.w * 0.5, p.y + p.h - 2, "#8a908c", 2, "dust");
    }
    const wasGround = p.grounded;
    const fall = p.vy;
    this.moveActor(p, dt, large, a.down);
    this.ejectFromHazards();
    this.markSafeGround();
    const wallL = this.blockedAt(p.x - 3, p.y + 6, 4, p.h - 12, large);
    const wallR = this.blockedAt(p.x + p.w - 1, p.y + 6, 4, p.h - 12, large);
    if (!p.grounded && (wallL || wallR)) {
      this.wallCoyote = 0.12;
      this.wallDir = wallL ? 1 : -1;
    } else this.wallCoyote = Math.max(0, this.wallCoyote - dt);
    for (const s of this.solidsNow(large, p)) {
      if (s.type === "conveyor" && p.grounded && aabb({ x: p.x, y: p.y + p.h - 8, w: p.w, h: 10 }, s)) {
        p.x += (s.phase ?? 1) * 110 * dt;
      }
      if (s.type === "bounce" && p.grounded && aabb({ x: p.x + 4, y: p.y + p.h - 8, w: p.w - 8, h: 10 }, s)) {
        p.vy = -560;
        p.grounded = false;
        p.squash = 0.78;
        this.audio.sfxJump();
        this.burst(p.x + p.w / 2, p.y + p.h, "#e8d48a", 5, "glyph");
      }
      if (s.type === "fan" && aabb(p, s)) {
        p.vy -= 2200 * dt;
        if (p.vy < -320) p.vy = -320;
        p.grounded = false;
      }
    }
    if (p.grounded && !wasGround) {
      if ((p.letter === "k" || p.letter === "b") && p.capital && p.special > 0) {
        this.playerWave(p.x + p.w / 2, p.y + p.h, p.letter === "b" ? 3 : 3);
      }
      if (fall > 280) {
        p.squash = 1.22;
        this.audio.sfxLand();
        this.burst(p.x + p.w / 2, p.y + p.h, "#8a908c", 4, "dust");
      } else {
        p.squash = 1.1;
      }
      if (this.save.words.includes("RISE") && !a.down) {
        const feet = { x: p.x + 4, y: p.y + p.h - 4, w: p.w - 8, h: 8 };
        if (this.walls.some((w) => w.kind === "plat" && aabb(feet, w))) {
          p.vy = -430;
          p.grounded = false;
          p.squash = 0.82;
          this.burst(p.x + p.w / 2, p.y + p.h, "#e8d48a", 6, "glyph");
        }
      }
    }
    for (const s of this.solidsNow(large, p)) {
      if (s.type === "crumble" && !s.broken && p.grounded && aabb({ x: p.x, y: p.y + p.h - 6, w: p.w, h: 8 }, s)) {
        s.phase = (s.phase ?? 0) + dt;
        if (s.phase > 0.38) {
          s.broken = true;
          this.burst(s.x + 24, s.y, "#8a7048", 8, "dust");
        }
      }
    }
    if (a.cycle && this.swapCd <= 0) this.cycleParty(a.cycle);
    else if (a.swap && this.swapCd <= 0) this.swapTo(a.swap);
    if (a.caseShift) this.tryCase();
    if (a.interact) this.intBuf = 0.22;
    this.intBuf -= dt;
    if (this.intBuf > 0 && this.tryInteract()) this.intBuf = 0;
    if (a.stem) this.scribe(false);
    else if (a.shelf) this.scribe(true);
    else if (a.word) this.scribe(a.down);
  }

  private moveActor(
    a: { x: number; y: number; w: number; h: number; vx: number; vy: number; grounded?: boolean },
    dt: number,
    large: boolean,
    drop = false,
  ) {
    const steps = Math.max(1, Math.ceil((Math.abs(a.vx) + Math.abs(a.vy)) * dt / 10));
    const sdt = dt / steps;
    a.grounded = false;
    for (let i = 0; i < steps; i++) {
      a.x += a.vx * sdt;
      this.sepAxis(a, "x", large);
      a.y += a.vy * sdt;
      this.sepAxis(a, "y", large, drop);
    }
    if (a.y < 0) {
      a.y = 0;
      if (a.vy < 0) a.vy = 0;
    }
    const e = a as Enemy;
    if (e.kind === "endmark" && e.phase >= 2) {
      if (e.vy != null && e.vy > 640) e.vy = 640;
      this.pinToFloor(a);
    }
  }

  private pinToFloor(a: { x: number; y: number; w: number; h: number; vx?: number; vy?: number; grounded?: boolean }) {
    const maxY = this.worldH - a.h - 2;
    if (a.y > maxY) {
      a.y = maxY;
      if (a.vy != null) a.vy = 0;
      a.grounded = true;
    }
    let top: number | null = null;
    const feet = a.y + a.h;
    for (const s of this.solidsNow(true, a)) {
      if (s.type !== "solid" && s.type !== "oneway" && s.type !== "crumble" && s.type !== "conveyor") continue;
      if (s.broken) continue;
      if (a.x + a.w <= s.x + 2 || a.x >= s.x + s.w - 2) continue;
      if (feet > s.y - 6 && a.y < s.y + s.h) {
        if (top == null || s.y < top) top = s.y;
      }
    }
    if (top != null && a.y + a.h > top) {
      a.y = top - a.h;
      if (a.vy != null) a.vy = 0;
      a.grounded = true;
    }
  }

  private rebuildGrid() {
    this.grid.rebuild(this.solids);
  }

  private wallSolids(): Solid[] {
    return this.walls.map((w) => ({
      x: w.x,
      y: w.y,
      w: w.w,
      h: w.h,
      type: (w.kind === "plat" ? "oneway" : "solid") as Solid["type"],
    }));
  }

  private solidsNow(
    large: boolean,
    around?: { x: number; y: number; w: number; h: number },
    kind: "walk" | "hazard" | "all" = "walk",
  ): Solid[] {
    const box = around ?? {
      x: this.player.x - 80,
      y: this.player.y - 80,
      w: this.player.w + 160,
      h: this.player.h + 160,
    };
    return this.grid.query(box, large, kind === "walk" ? this.wallSolids() : [], kind);
  }

  private sepAxis(
    a: { x: number; y: number; w: number; h: number; vx: number; vy: number; grounded?: boolean },
    axis: "x" | "y",
    large: boolean,
    drop = false,
  ) {
    for (const s of this.solidsNow(large, a)) {
      if (s.type === "spike") continue;
      if (!aabb(a, s)) continue;
      if (s.type === "oneway" || s.type === "crumble" || s.type === "bounce" || s.type === "conveyor") {
        if (axis !== "y" || a.vy < 0 || drop) continue;
        if (a.y + a.h - Math.max(8, a.vy * 0.02) > s.y + 10) continue;
      }
      if (axis === "y" && a.vy < 0 && s.type !== "oneway" && s.type !== "crumble") {
        const slack = 5;
        const fromL = a.x + a.w - s.x;
        const fromR = s.x + s.w - a.x;
        const fromBot = s.y + s.h - a.y;
        if (fromBot > 0 && fromBot <= slack) {
          if (fromL > 0 && fromL <= slack) {
            const nx = s.x - a.w;
            if (!this.blockedAt(nx, a.y, a.w, a.h, large)) {
              a.x = nx;
              if (!aabb(a, s)) continue;
            }
          }
          if (fromR > 0 && fromR <= slack) {
            const nx = s.x + s.w;
            if (!this.blockedAt(nx, a.y, a.w, a.h, large)) {
              a.x = nx;
              if (!aabb(a, s)) continue;
            }
          }
        }
      }
      if (axis === "x") {
        if (a.vx > 0) a.x = s.x - a.w;
        else if (a.vx < 0) a.x = s.x + s.w;
        else {
          const dl = a.x + a.w - s.x;
          const dr = s.x + s.w - a.x;
          if (dl < dr) a.x = s.x - a.w;
          else a.x = s.x + s.w;
        }
        a.vx = 0;
      } else {
        const fromTop = a.y + a.h - s.y;
        const fromBot = s.y + s.h - a.y;
        if (fromBot < fromTop && (a.vy < 0 || fromBot + 1 < fromTop)) {
          a.y = s.y + s.h + 0.5;
          if (a.vy < 0) a.vy = 0;
        } else {
          a.y = s.y - a.h;
          a.vy = 0;
          a.grounded = true;
        }
      }
    }
  }

  private blockedAt(x: number, y: number, w: number, h: number, large: boolean) {
    const box = { x, y, w, h };
    for (const s of this.solidsNow(large, box)) {
      if (s.type === "spike" || s.type === "oneway") continue;
      if (aabb(box, s)) return true;
    }
    return false;
  }

  private fireShot() {
    const p = this.player;
    const kit = KITS[p.letter] ?? KITS.c;
    const lv = Math.max(1, Math.min(4, p.shotLevel));
    const dmg = Math.max(1, Math.round((lv >= 4 ? 3 : lv >= 2 ? 2 : 1) * kit.shotMul));
    const L = p.letter;
    const spd =
      (270 + lv * 45) *
      (L === "s" ? 1.18 : L === "b" || L === "k" ? 0.82 : L === "r" ? 1.08 : 1);
    const r = 4 + lv * 0.8 + (L === "b" || L === "k" ? 2 : 0);
    const kind =
      L === "e"
        ? "frost"
        : L === "r"
          ? "ember"
          : L === "s"
            ? "wind"
            : L === "t"
              ? "nib"
              : lv >= 4
                ? "solar"
                : lv >= 3
                  ? "venom"
                  : lv >= 2
                    ? "fang"
                    : "crescent";
    const pierce =
      (L === "s" ? Math.max(1, lv >= 3 ? 2 : 1) : L === "e" ? 0 : lv >= 4 ? 2 : lv >= 3 ? 1 : 0) +
      (this.save.relics.includes("counter") ? 1 : 0);
    const n = L === "t" || L === "e" ? 1 : L === "r" && p.capital ? 2 : lv >= 4 ? 3 : lv >= 3 ? 2 : 1;
    const spreads = n === 1 ? [0] : n === 2 ? [-0.12, 0.12] : [-0.28, 0, 0.28];
    const mouthX = p.x + p.w / 2 + p.facing * (p.w * 0.55);
    const mouthY = p.y + p.h * 0.4;
    for (const spr of spreads) {
      this.bullets.push({
        x: mouthX,
        y: mouthY,
        vx: p.facing * spd,
        vy: spr * spd + (L === "r" ? 40 : 0),
        r,
        from: "player",
        dmg: L === "t" ? 1 : dmg,
        life: (0.85 + lv * 0.08) * kit.shotLife,
        kind,
        alive: true,
        pierce,
      });
    }
    this.audio.sfxShot();
    this.burst(mouthX, mouthY, kit.glow, 4, L === "r" ? "ember" : "spark");
  }

  private castSpecial(a: ReturnType<Input["poll"]>) {
    const p = this.player;
    const cap = p.capital;
    p.special = 0.28;
    const L = p.letter;
    if (L === "c") {
      const cage = cap && p.grounded && a.moveX === 0 && !a.down && !a.jumpHeld;
      if (cage) {
        this.walls.push({
          x: p.x + (p.facing > 0 ? p.w : -46),
          y: p.y - 10,
          w: 46,
          h: p.h + 20,
          life: 2.8,
          max: 2.8,
          kind: "wall",
        });
        p.specialCd = 1.4;
        this.audio.sfxWord();
        this.say("CAGE");
      } else {
        if (!p.grounded && this.airDash <= 0) {
          p.special = 0;
          return;
        }
        let dx = a.moveX !== 0 ? Math.sign(a.moveX) : 0;
        let dy = a.down ? 1 : a.jumpHeld ? -1 : 0;
        if (dx === 0 && dy === 0) dx = p.facing;
        const mag = Math.hypot(dx, dy) || 1;
        const spd = cap ? 680 : 640;
        this.dashVx = (dx / mag) * spd;
        this.dashVy = (dy / mag) * spd;
        if (dx !== 0) p.facing = dx > 0 ? 1 : -1;
        p.vx = this.dashVx;
        p.vy = this.dashVy;
        p.roll = cap ? 0.22 : 0.2;
        p.invuln = Math.max(p.invuln, 0.34);
        p.specialCd = cap ? 0.42 : 0.38;
        p.squash = 0.62;
        p.stretch = 1.18;
        p.jumpCut = true;
        p.jumpBuf = 0;
        if (!p.grounded) this.airDash = 0;
        this.trauma = Math.min(1, this.trauma + 0.18);
        this.hitstop = 0.045;
        this.audio.sfxJump();
        this.burst(p.x + p.w / 2, p.y + p.h / 2, "#5ee0c0", 12, "glyph");
        this.say("DASH");
      }
    } else if (L === "s") {
      this.bullets.push({
        x: p.x + p.w / 2,
        y: p.y + 8,
        vx: p.facing * 360,
        vy: cap ? -90 : 0,
        r: cap ? 10 : 7,
        from: "player",
        dmg: cap ? 3 : 2,
        life: cap ? 1.15 : 0.9,
        kind: "wind",
        alive: true,
        pierce: cap ? 3 : 1,
      });
      if (cap) {
        this.bullets.push({
          x: p.x + p.w / 2,
          y: p.y + 10,
          vx: p.facing * 320,
          vy: 100,
          r: 8,
          from: "player",
          dmg: 2,
          life: 0.9,
          kind: "wind",
          alive: true,
          pierce: 1,
        });
      }
      p.specialCd = cap ? 1.05 : 0.9;
      this.audio.sfxSlash();
      this.say(cap ? "SCYTHE" : "CUT");
    } else if (L === "b") {
      if (cap && !p.grounded) {
        p.vy = 640;
        p.special = 0.55;
        p.specialCd = 1.35;
        p.squash = 1.2;
        this.say("METEOR");
        this.audio.sfxLand();
        return;
      }
      this.walls.push({
        x: p.x - (cap ? 16 : 8),
        y: p.y + (cap ? 0 : 4),
        w: p.w + (cap ? 32 : 16),
        h: p.h - (cap ? 0 : 4),
        life: cap ? 2.6 : 1.8,
        max: cap ? 2.6 : 1.8,
        kind: "wall",
      });
      if (cap) this.playerWave(p.x + p.w / 2, p.y + p.h - 6, 2);
      p.specialCd = cap ? 1.9 : 1.6;
      this.audio.sfxLand();
      this.say(cap ? "BULWARK" : "BRACE");
    } else if (L === "e") {
      const rad = cap ? 86 : 56;
      const cx = p.x + p.w / 2;
      const cy = p.y + p.h / 2;
      this.burst(cx, cy, "#6ec8e8", cap ? 20 : 12, "glyph");
      for (const e of this.enemies) {
        if (!e.alive) continue;
        const d = Math.hypot(e.x + e.w / 2 - cx, e.y + e.h / 2 - cy);
        if (d < rad) {
          this.hitEnemy(e, cap ? 2 : 1, p.facing);
          e.stun = Math.max(e.stun, cap ? 1.4 : 0.7);
        }
      }
      p.ink = Math.min(p.maxInk, p.ink + (cap ? 16 : 10));
      if (cap && p.hp < p.maxHp) p.hp += 1;
      this.walls.push({
        x: p.x - (cap ? 18 : 6),
        y: p.y + p.h - 4,
        w: p.w + (cap ? 36 : 12),
        h: 10,
        life: cap ? 4.2 : 2.4,
        max: cap ? 4.2 : 2.4,
        kind: "plat",
      });
      p.specialCd = cap ? 2.3 : 1.5;
      this.audio.sfxWord();
      this.say(cap ? "WELL" : "PULSE");
    } else if (L === "r") {
      p.roll = cap ? 0.48 : 0.34;
      p.invuln = Math.max(p.invuln, p.roll);
      p.specialCd = cap ? 1.15 : 0.85;
      p.squash = 0.72;
      p.stretch = 0.9;
      this.audio.sfxJump();
      this.say(cap ? "INFERNO" : "FLARE");
    } else if (L === "k") {
      if (!p.grounded && !cap) {
        this.say("k needs the floor.");
        p.special = 0;
        return;
      }
      if (!p.grounded && cap) {
        p.vy = 560;
        p.specialCd = 1.3;
        p.special = 0.55;
        p.squash = 1.18;
        this.say("QUAKE");
        this.audio.sfxLand();
        return;
      }
      this.playerWave(p.x + p.w / 2, p.y + p.h - 4, cap ? 3 : 2);
      p.specialCd = cap ? 1.5 : 1.2;
      p.squash = 1.2;
      this.audio.sfxLand();
      this.say(cap ? "QUAKE" : "STOMP");
    } else if (L === "n") {
      let best: Enemy | null = null;
      let bestD = 200;
      for (const e of this.enemies) {
        if (!e.alive) continue;
        const dx = e.x + e.w / 2 - (p.x + p.w / 2);
        if (dx * p.facing < 0) continue;
        const d = Math.hypot(dx, e.y + e.h / 2 - (p.y + p.h / 2));
        if (d < bestD) {
          bestD = d;
          best = e;
        }
      }
      if (!best) {
        this.say("Nothing to bind.");
        p.special = 0;
        return;
      }
      best.stun = cap ? 1.8 : 1.1;
      this.hitEnemy(best, cap ? 3 : 2, p.facing);
      if (cap) {
        best.vx = -Math.sign(best.x - p.x) * 220;
        best.vy = -80;
      }
      this.burst(best.x + best.w / 2, best.y, "#c46ad4", 10, "glyph");
      p.specialCd = cap ? 2.2 : 1.8;
      this.audio.sfxSlash();
      this.say(cap ? "BIND" : "PIN");
    } else if (L === "t") {
      const w = cap ? 96 : 78;
      this.walls.push({
        x: p.x + (p.facing > 0 ? p.w * 0.2 : -w + p.w * 0.8),
        y: p.y + p.h - 4,
        w,
        h: 12,
        life: cap ? 6.5 : 5.2,
        max: cap ? 6.5 : 5.2,
        kind: "plat",
      });
      if (cap) {
        this.walls.push({
          x: p.x + (p.facing > 0 ? p.w + 8 : -18),
          y: p.y - 12,
          w: 16,
          h: p.h + 28,
          life: 5.5,
          max: 5.5,
          kind: "wall",
        });
      }
      p.specialCd = cap ? 1.6 : 1.2;
      this.audio.sfxWord();
      this.say(cap ? "SET" : "COMPOSE");
    }
  }

  private playerWave(x: number, y: number, dmg: number) {
    this.trauma = Math.min(1, this.trauma + 0.1);
    this.burst(x, y, "#c4b08a", 12, "dust");
    for (const dir of [-1, 1] as const) {
      this.bullets.push({
        x,
        y,
        vx: dir * 200,
        vy: 0,
        r: 14,
        from: "player",
        dmg,
        life: 0.7,
        kind: "wave",
        alive: true,
        pierce: 2,
      });
    }
  }

  private updateCombat(dt: number, a: ReturnType<Input["poll"]>) {
    const p = this.player;
    const kit = KITS[p.letter] ?? KITS.c;
    const cd = kit.shotCd - Math.min(3, p.shotLevel - 1) * 0.03;
    if ((a.attack || a.attackHeld) && p.shotCd <= 0 && p.roll <= 0) {
      p.attack = 0.16;
      p.shotCd = Math.max(0.18, cd);
      p.squash = 0.92;
      this.fireShot();
    }
    if (a.special && p.specialCd <= 0 && p.roll <= 0) {
      this.castSpecial(a);
    }
    for (const s of this.solids) {
      if (s.type === "spike" && aabb(p, s) && p.invuln <= 0) {
        // Standing on floor above teeth: ignore. Falling into pits still hurts.
        if (p.grounded && s.y + s.h <= p.y + p.h + 6) continue;
        // Retracting teeth only bite while extended.
        if (s.phase != null && !this.spikeHot(s)) continue;
        this.hurt(1, p.x + p.w / 2 < s.x + s.w / 2 ? -1 : 1, "hazard");
      }
      if (s.type === "sluice" && aabb(p, s)) {
        if (p.letter === "e") {
          p.vy = Math.min(p.vy, p.capital ? 40 : 90);
          p.grounded = true;
        } else if (p.invuln <= 0) {
          this.hurt(1, p.facing, "hazard");
          p.vy = Math.min(p.vy, -240);
        }
      }
      if (s.type === "laser" && aabb(p, s) && p.invuln <= 0 && this.laserHot(s)) {
        this.hurt(1, p.x + p.w / 2 < s.x + s.w / 2 ? -1 : 1, "hazard");
      }
    }
  }

  private laserHot(s: Solid) {
    const cycle = (this.time + (s.phase ?? 0)) % 1.5;
    return cycle < 0.5;
  }

  /** Retracting teeth: extended ~55% of a 1.8s cycle so the player can read the beat. */
  private spikeHot(s: Solid) {
    if (s.phase == null) return true;
    const cycle = (this.time + s.phase) % 1.8;
    return cycle < 1.0;
  }

  private hitEnemy(e: Enemy, dmg: number, dir: number) {
    if (e.hurt > 0) return;
    e.hp -= dmg;
    e.hurt = this.isBossKind(e.kind) ? 0.18 : 0.1;
    const boss = this.isBossKind(e.kind);
    if (!boss) e.stun = 0.95;
    e.flash = Math.max(e.flash, 0.18);
    e.vx += dir * (boss ? 36 : 160);
    if (!boss) e.vy = -36;
    if (!boss) e.aux = 0;
    this.audio.sfxHit();
    this.trauma = Math.min(1, this.trauma + 0.25);
    this.hitstop = 0.05;
    this.burst(e.x + e.w / 2, e.y + e.h / 2, "#e8ece8", 6, "spark");
    if (e.kind === "dummy") {
      e.hp = e.maxHp;
      return;
    }
    if (e.hp <= 0) {
      e.alive = false;
      this.player.ink = Math.min(this.player.maxInk, this.player.ink + (boss ? 12 : 4));
      this.burst(e.x + e.w / 2, e.y + e.h / 2, "#3d5a48", 16, "ink");
      this.audio.sfxDeath();
      if (e.kind === "triad") {
        this.enemies.push(this.spawnEnemy("one", e.x - 18, e.y));
        this.enemies.push(this.spawnEnemy("one", e.x + 10, e.y));
        this.enemies.push(this.spawnEnemy("one", e.x - 4, e.y - 12));
        this.say("The triad splits.");
      }
      if (e.kind === "endmark" && e.phase < 2) {
        const feet = e.y + e.h;
        e.alive = true;
        e.phase = 2;
        e.hp = Math.ceil(e.maxHp * 0.35);
        e.maxHp = e.hp;
        e.w = 48;
        e.h = 52;
        e.y = feet - e.h;
        const twin = this.spawnEnemy("endmark", e.x + 56, e.y);
        twin.phase = 2;
        twin.hp = e.hp;
        twin.maxHp = e.hp;
        twin.w = 48;
        twin.h = 52;
        twin.y = e.y;
        twin.x = e.x + 56;
        twin.name = "End-Mark Arc";
        this.enemies.push(twin);
        this.say("End-Mark splits. Finish both arcs.");
      }
      if (boss && e.kind !== "endmark") {
        this.markProgress();
        this.say(e.name + " falls. The gate opens.");
        this.objective = "Enter the exit gate.";
      }
      if (e.kind === "endmark" && !this.enemies.some((x) => x.kind === "endmark" && x.alive)) {
        this.markProgress();
        this.say("End-Mark falls. The last gate opens.");
        this.objective = "Enter the FINAL gate.";
      }
    }
  }

  private hurt(n: number, dir: number, kind: "contact" | "hazard" | "shot" = "contact") {
    const p = this.player;
    if (p.invuln > 0) return;
    const hazard = kind === "hazard";
    if (p.shield > 0) {
      p.shield -= 1;
      p.shieldFlash = 0.4;
      p.invuln = hazard ? 0.95 : 0.85;
      p.vx = dir * (hazard ? 120 : 40);
      if (hazard) p.vy = Math.min(p.vy, -180);
      p.shieldCd = 1.1;
      this.audio.sfxBlock();
      this.trauma = Math.min(1, this.trauma + 0.12);
      this.burst(p.x + p.w / 2, p.y + p.h / 2, "#8ec8d4", 10, "spark");
      if (this.save.relics.includes("counter") && kind !== "hazard") {
        const cx = p.x + p.w / 2;
        const cy = p.y + p.h * 0.4;
        this.bullets.push({
          x: cx,
          y: cy,
          vx: (dir === 0 ? p.facing : -dir) * 320,
          vy: -40,
          r: 6,
          from: "player",
          dmg: 2,
          life: 0.7,
          kind: "solar",
          alive: true,
          pierce: 1,
        });
        this.burst(cx, cy, "#e8d48a", 8, "glyph");
      }
      return;
    }
    p.hp -= this.hard ? n : n;
    p.invuln = hazard ? 1.15 : 1.05;
    p.hurtFlash = 0.4;
    p.vx = dir * (hazard ? 220 : 160);
    p.vy = hazard ? -220 : -140;
    p.shieldCd = 1.8;
    this.audio.sfxHurt();
    this.trauma = Math.min(1, this.trauma + (hazard ? 0.55 : 0.45));
    if (p.hp <= 0) {
      p.hp = 0;
      this.mode = "dead";
      this.audio.sfxDeath();
      this.emit();
    }
  }

  private updateEnemies(dt: number) {
    const p = this.player;
    const list = this.enemies;
    for (const e of list) {
      if (!e.alive) continue;
      e.t += dt;
      e.hurt = Math.max(0, e.hurt - dt);
      e.flash = Math.max(0, e.flash - dt);
      e.stun = Math.max(0, e.stun - dt);
      if (e.stun > 0 && !this.isBossKind(e.kind)) {
        e.vx *= Math.max(0, 1 - 8 * dt);
        if (!e.grounded) e.vy += 1800 * dt;
        this.moveActor(e, dt, false);
        continue;
      }
      e.stun = 0;
      e.aux += dt;
      if (!this.isBossKind(e.kind) && !this.inSight(e)) {
        if (!e.grounded) e.vy += 1800 * dt;
        e.vx *= 0.86;
        this.moveActor(e, dt, false);
        continue;
      }
      const large = false;
      if (e.kind === "zero") {
        e.y += Math.sin(e.t * 2) * 18 * dt;
        e.x += Math.sin(e.t * 0.6) * 30 * dt;
        e.facing = p.x > e.x ? 1 : -1;
        if (e.phase === 1) {
          this.pullToward(e, p, 160, 100, dt);
          if (e.aux > 0.55) {
            e.phase = 2;
            e.aux = 0;
            this.burst(e.x + e.w / 2, e.y + e.h / 2, "#e8d48a", 8, "ink");
          }
        } else if (e.phase === 2) {
          const cx = e.x + e.w / 2;
          const cy = e.y + e.h / 2;
          const dx = p.x + p.w / 2 - cx;
          const dy = p.y + p.h / 2 - cy;
          const d = Math.hypot(dx, dy) || 1;
          if (d < 150 && !this.hazardAt(p.x - (dx / d) * 90 * dt, p.y, p.w, p.h)) {
            p.x -= (dx / d) * 90 * dt;
          }
          if (e.aux > 0.35) {
            e.phase = 0;
            e.aux = 0;
            this.shoot(e, p.x < e.x ? -1 : 1, 0.2);
          }
        } else if (this.windFire(e, 1.7)) {
          if (Math.abs(p.x - e.x) < 170) {
            e.phase = 1;
            this.burst(e.x + e.w / 2, e.y + e.h / 2, "#7a8b96", 8, "ink");
          } else this.fanShot(e, p.x < e.x ? -1 : 1, 0.4, 2);
        }
      } else if (e.kind === "one") {
        if (!e.grounded) e.vy += 1800 * dt;
        if (e.phase === 1) {
          e.vx = e.facing * 250;
          this.moveActor(e, dt, large);
          if (e.aux > 0.34) {
            e.phase = 0;
            e.aux = 0;
          }
        } else {
          e.facing = p.x > e.x ? 1 : -1;
          e.vx = e.facing * 55;
          this.moveActor(e, dt, large);
          if (e.grounded && this.atLedge(e)) {
            e.facing = (e.facing * -1) as 1 | -1;
            e.vx = 0;
          }
          if (e.aux > 0.75 && Math.abs(p.x - e.x) < 120 && Math.abs(p.y - e.y) < 70) e.vx *= 0.2;
          if (e.aux > 1.05 && Math.abs(p.x - e.x) < 120 && Math.abs(p.y - e.y) < 70) {
            e.phase = 1;
            e.aux = 0;
            if (p.y + 18 < e.y) e.vy = -300;
            this.burst(e.x + e.w / 2, e.y + e.h, "#d45a4a", 5, "dust");
          }
        }
      } else if (e.kind === "two") {
        if (!e.grounded) e.vy += 1800 * dt;
        e.facing = p.x > e.x ? 1 : -1;
        e.vx = e.facing * 62;
        this.moveActor(e, dt, large);
        if (e.grounded && this.atLedge(e)) {
          e.facing = (e.facing * -1) as 1 | -1;
          e.vx = 0;
        }
        if (this.windFire(e, 1.55)) {
          if (Math.abs(p.x - e.x) < 56 && e.grounded) this.shockwave(e);
          else {
            this.mortar(e, e.facing, -0.9);
            this.mortar(e, e.facing * 0.5, -1.15);
            if (Math.abs(p.y - e.y) > 40) this.mortar(e, e.facing * 0.15, -1.35);
          }
        }
      } else if (e.kind === "four") {
        if (!e.grounded) e.vy += 1800 * dt;
        e.facing = p.x > e.x ? 1 : -1;
        e.vx = e.facing * 38;
        this.moveActor(e, dt, large);
        if (e.grounded && this.atLedge(e)) {
          e.facing = (e.facing * -1) as 1 | -1;
          e.vx = 0;
        }
        if (this.windFire(e, 1.9)) {
          this.stampLine(p.x + p.w / 2, p.y + p.h - 4, 3, 42);
        }
      } else if (e.kind === "five") {
        if (!e.grounded) e.vy += 1800 * dt;
        e.facing = p.x > e.x ? 1 : -1;
        if (e.phase === 1) {
          this.moveActor(e, dt, large);
          if (e.grounded) {
            this.shockwave(e);
            this.stampAt(e.x + e.w / 2, e.y + e.h - 2);
            e.phase = 0;
            e.aux = 0;
          }
        } else {
          e.vx = e.facing * 30;
          this.moveActor(e, dt, large);
          if (e.grounded && this.atLedge(e)) {
            e.facing = (e.facing * -1) as 1 | -1;
            e.vx = 0;
          }
          if (e.grounded && this.windFire(e, 2.15)) {
            e.phase = 1;
            e.vy = -360;
            e.grounded = false;
          }
        }
      } else if (e.kind === "three" || e.kind === "seven" || e.kind === "triad") {
        if (!e.grounded) e.vy += 1800 * dt;
        const spd = e.kind === "seven" ? 48 : 58;
        if (Math.abs(p.x - e.x) < 300) {
          e.facing = p.x > e.x ? 1 : -1;
          e.vx = e.facing * spd;
        } else {
          e.vx = e.facing * 40;
          if (Math.random() < 0.005) e.facing *= -1;
        }
        this.moveActor(e, dt, large);
        if (e.grounded && this.atLedge(e)) {
          e.facing = (e.facing * -1) as 1 | -1;
          e.vx = 0;
        }
        if ((e.kind === "three" || e.kind === "triad") && e.grounded && e.aux > 0.9 && Math.abs(p.x - e.x) < 220) {
          e.vy = -440;
          e.aux = 0;
          e.phase = 1;
        }
        if ((e.kind === "three" || e.kind === "triad") && e.phase === 1 && e.vy > -40 && e.vy < 80 && !e.grounded) {
          this.fanShot(e, e.facing, 0.7, 3);
          e.phase = 0;
        }
        if (e.kind === "seven" && this.windFire(e, 1.4)) {
          this.fanShot(e, e.facing, 0.9, 3);
          e.phase = 1;
        }
        if (e.kind === "seven" && e.phase === 1 && e.aux > 0.28) {
          this.fanShot(e, e.facing, 0.35, 2);
          e.phase = 0;
          e.aux = 0;
        }
      } else if (e.kind === "six") {
        if (Math.abs(p.x - e.x) < 52 && p.y > e.y + 8) {
          if (!e.grounded) e.vy += 2600 * dt;
          this.moveActor(e, dt, false);
          if (e.grounded) {
            this.shockwave(e);
            e.vy = -420;
            e.grounded = false;
          }
        } else {
          e.y += Math.sin(e.t * 2.2) * 22 * dt;
          e.x += Math.sin(e.t * 0.8) * 24 * dt;
          e.vy = 0;
        }
        e.facing = p.x > e.x ? 1 : -1;
        if (this.windFire(e, 1.55)) {
          this.mortar(e, 0, 0.45);
          this.mortar(e, 0.45, 0.22);
          this.mortar(e, -0.45, 0.22);
        }
      } else if (e.kind === "nine") {
        e.y += Math.sin(e.t * 3) * 16 * dt;
        e.facing = p.x > e.x ? 1 : -1;
        if (e.phase === 1) {
          if (e.aux > 0.42) {
            e.x = e.armor;
            e.y = Math.max(24, p.y - 64);
            this.burst(e.x + e.w / 2, e.y + e.h / 2, "#d45a4a", 10, "ink");
            this.fanShot(e, 0, 0.7, 3);
            e.phase = 0;
            e.aux = 0;
          }
        } else if (this.windFire(e, 2.15)) {
          const nx = Math.max(40, Math.min(this.worldW - 80, p.x + (Math.random() > 0.5 ? 96 : -96)));
          e.armor = nx;
          e.phase = 1;
          this.stampAt(nx + 16, p.y + p.h - 4);
          this.burst(nx, p.y - 60, "#d45a4a", 6, "ink");
        }
      } else if (e.kind === "eight") {
        e.x += Math.sin(e.t * 1.4) * 70 * dt;
        e.y += Math.cos(e.t * 2.8) * 40 * dt;
        e.facing = p.x > e.x ? 1 : -1;
        e.aux2 += dt;
        if (e.aux2 > 3 && e.hp < e.maxHp) {
          e.hp = Math.min(e.maxHp, e.hp + 1);
          e.aux2 = 0;
          this.burst(e.x + e.w / 2, e.y, "#5ee0c0", 8, "glyph");
        }
        if (this.windFire(e, 1.45)) {
          if (e.hp < e.maxHp * 0.5) this.ringShot(e, 6, 160, e.t);
          else if (Math.random() < 0.5) this.stampLine(p.x + p.w / 2, p.y + p.h - 4, 2, 50);
          else this.fanShot(e, e.facing, 0.45, 2);
        }
      } else if (e.kind === "dualis") {
        if (!e.grounded) e.vy += 1600 * dt;
        e.facing = p.x > e.x ? 1 : -1;
        if (e.phase === 0 && e.hp < e.maxHp * 0.62) {
          e.phase = 1;
          this.enemies.push(this.spawnEnemy("two", e.x - 50, e.y));
          this.say("Dualis splits.");
        }
        if (e.hp < e.maxHp * 0.32 && e.phase < 2) {
          e.phase = 2;
          this.say("Dualis doubles.");
        }
        e.vx = e.facing * (88 + e.phase * 28);
        this.moveActor(e, dt, false);
        if (e.aux > (e.phase >= 2 ? 0.52 : 0.85)) {
          e.aux = 0;
          e.aux2 = (e.aux2 + 1) % 5;
          if (e.aux2 === 0) {
            this.fanShot(e, e.facing, 0.45, e.phase >= 2 ? 3 : 2);
            if (e.phase >= 2) this.fanShot(e, -e.facing, 0.3, 2);
          } else if (e.aux2 === 1) {
            e.vy = -400;
            this.mortar(e, e.facing, -0.95);
            this.mortar(e, e.facing * 0.4, -1.15);
            if (e.phase >= 1) this.mortar(e, -e.facing * 0.3, -1.05);
          } else if (e.aux2 === 2) {
            e.vx = e.facing * 260;
            this.stampLine(p.x + p.w / 2, p.y + p.h - 4, e.phase >= 2 ? 3 : 2, 40);
          } else if (e.aux2 === 3) {
            this.ringShot(e, e.phase >= 2 ? 8 : 5, 190);
          } else {
            e.vy = -280;
            this.shockwave(e);
          }
        }
        if (e.grounded && Math.random() < 0.012) e.vy = -340;
      } else if (e.kind === "tetrarch") {
        if (!e.grounded) e.vy += 1800 * dt;
        e.facing = p.x > e.x ? 1 : -1;
        e.vx = e.facing * 28;
        this.moveActor(e, dt, true);
        if (e.hp < e.maxHp * 0.45 && e.phase < 1) {
          e.phase = 1;
          this.say("The Tetrarch opens all four gates.");
        }
        if (e.aux > (e.phase ? 0.75 : 1.05)) {
          e.aux = 0;
          e.aux2 = (e.aux2 + 1) % 6;
          if (e.aux2 === 0) this.ringShot(e, 4, 200);
          else if (e.aux2 === 1) {
            e.vy = -340;
            this.stampLine(p.x + p.w / 2, p.y + p.h - 4, 4, 46);
          } else if (e.aux2 === 2 && e.hp < e.maxHp * 0.6 && this.enemies.filter((x) => x.kind === "four" && x.alive).length < 2) {
            this.enemies.push(this.spawnEnemy("four", e.x - 80, e.y));
            this.enemies.push(this.spawnEnemy("four", e.x + 80, e.y));
            this.say("Four from four.");
          } else if (e.aux2 === 3) this.shockwave(e);
          else if (e.aux2 === 4) this.ringShot(e, e.phase ? 8 : 6, 170, e.t);
          else this.shoot(e, p.x < e.x ? -1 : 1, 0);
        }
      } else {
        this.aiSecond(e, dt, p);
      }
      if (aabb(e, p) && p.invuln <= 0 && p.roll <= 0) this.hurt(1, p.x < e.x ? -1 : 1);
    }
    let live = 0;
    for (let i = 0; i < list.length; i++) {
      if (list[i].alive) list[live++] = list[i];
    }
    list.length = live;
  }

  private aiSecond(e: Enemy, dt: number, p: Player) {
    if (e.kind === "nullring") {
      e.y += Math.sin(e.t * 1.6) * 20 * dt;
      e.facing = p.x > e.x ? 1 : -1;
      if (e.phase === 1) {
        const cx = e.x + e.w / 2;
        const cy = e.y + e.h / 2;
        this.pullToward(e, p, 170, 85, dt);
        for (const b of this.bullets) {
          if (!b.alive) continue;
          const bx = cx - b.x;
          const by = cy - b.y;
          const bd = Math.hypot(bx, by) || 1;
          if (bd < 170) {
            b.vx += (bx / bd) * 140 * dt;
            b.vy += (by / bd) * 140 * dt;
          }
        }
        e.aux2 += dt;
        if (e.aux2 > 0.85) {
          e.phase = 0;
          e.aux2 = 0;
        }
      } else if (e.aux > 2.1) {
        e.aux = 0;
        e.phase = 1;
        this.burst(e.x + e.w / 2, e.y + e.h / 2, "#7a8b96", 8, "ink");
      }
    } else if (e.kind === "mobius") {
      if (!e.grounded) e.vy += 900 * dt;
      e.vx = e.facing * 70;
      const oldVx = e.vx;
      this.moveActor(e, dt, false);
      if (e.vx === 0 && oldVx !== 0) {
        e.facing = (e.facing * -1) as 1 | -1;
        e.vy = -90;
        e.vx = e.facing * 70;
      }
      if (e.aux > 1.6) {
        e.aux = 0;
        this.shoot(e, e.facing, 0.15);
      }
    } else if (e.kind === "summoner") {
      if (!e.grounded) e.vy += 1600 * dt;
      e.facing = p.x > e.x ? 1 : -1;
      const dist = Math.abs(p.x - e.x);
      e.vx = dist < 220 ? -e.facing * 55 : dist > 360 ? e.facing * 40 : 0;
      this.moveActor(e, dt, false);
      if (e.aux > 2.8 && this.enemies.filter((x) => x.alive).length < 16) {
        e.aux = 0;
        this.enemies.push(this.spawnEnemy("one", e.x + e.facing * -20, e.y));
        this.burst(e.x, e.y, "#c46ad4", 8, "glyph");
      }
    } else if (e.kind === "gradient") {
      e.facing = p.x > e.x ? 1 : -1;
      if (!e.grounded) {
        e.vx += e.facing * 180 * dt;
        e.vy += 2100 * dt;
        if (e.vx > 260) e.vx = 260;
        if (e.vx < -260) e.vx = -260;
      } else {
        e.vx = e.facing * 95;
      }
      this.moveActor(e, dt, false);
      if (e.aux > 1.5) {
        e.aux = 0;
        this.shoot(e, e.facing, 0.2);
      }
    } else if (e.kind === "crossseal") {
      e.vx *= 0.8;
      if (!e.grounded) e.vy += 1400 * dt;
      this.moveActor(e, dt, false);
      if (e.aux > 0.95) {
        e.aux = 0;
        e.phase = (e.phase + 1) % 8;
        const a = (e.phase * Math.PI) / 4;
        this.bullets.push({
          x: e.x + e.w / 2,
          y: e.y + e.h / 2,
          vx: Math.cos(a) * 190,
          vy: Math.sin(a) * 190,
          r: 4,
          from: "enemy",
          dmg: 1,
          life: 1.6,
          kind: "shot",
          alive: true,
          pierce: 0,
        });
      }
    } else if (e.kind === "archivist") {
      if (!e.grounded) e.vy += 1700 * dt;
      e.facing = p.facing;
      e.vx = e.facing * 50;
      this.moveActor(e, dt, false);
      if (e.aux > 1.45) {
        e.aux = 0;
        this.shoot(e, p.facing, 0);
        this.shoot(e, p.facing, 0.2);
      }
    } else if (e.kind === "importer") {
      if (!e.grounded) e.vy += 1500 * dt;
      e.facing = p.x > e.x ? 1 : -1;
      if (e.hp < e.maxHp * 0.62 && e.phase < 1) {
        e.phase = 1;
        this.say("G opens a second port.");
      }
      if (e.hp < e.maxHp * 0.3 && e.phase < 2) {
        e.phase = 2;
        this.say("G files the room.");
      }
      e.vx = e.facing * (72 + e.phase * 22);
      this.moveActor(e, dt, true);
      if (e.aux > (e.phase === 2 ? 0.55 : 0.92)) {
        e.aux = 0;
        e.aux2 = (e.aux2 + 1) % 4;
        if (e.aux2 === 0) {
          this.shoot(e, e.facing, 0);
          this.shoot(e, e.facing, -0.28);
          this.shoot(e, e.facing, 0.28);
          if (e.phase >= 2) {
            this.shoot(e, e.facing, -0.55);
            this.shoot(e, e.facing, 0.55);
          }
        } else if (e.aux2 === 1 && this.enemies.filter((x) => x.alive).length < 14) {
          this.enemies.push(this.spawnEnemy(e.phase >= 1 ? "two" : "one", e.x - 40, e.y));
          if (e.phase >= 2) this.enemies.push(this.spawnEnemy("one", e.x + 40, e.y));
          this.say("G opens a port.");
        } else if (e.aux2 === 2) {
          e.vy = -340;
          e.vx = e.facing * 160;
          this.stampLine(p.x + p.w / 2, p.y + p.h - 4, e.phase >= 1 ? 3 : 2, 42);
        } else {
          if (e.phase >= 1) this.shockwave(e);
          else this.shoot(e, e.facing, 0.1);
        }
      }
    } else if (e.kind === "nullis") {
      e.facing = p.x > e.x ? 1 : -1;
      const fury = e.hp < e.maxHp * 0.4;
      if (e.phase === 1) {
        e.aux2 += dt;
        this.pullToward(e, p, 220, fury ? 150 : 110, dt);
        if (e.aux2 > (fury ? 0.85 : 1.1)) {
          e.phase = 0;
          e.aux2 = 0;
          this.stampAt(p.x + p.w / 2, p.y + p.h - 4);
          if (fury) this.shockwave(e);
        }
      } else {
        if (!e.grounded) e.vy += 1400 * dt;
        e.vx = e.facing * (60 + (fury ? 30 : 0));
        this.moveActor(e, dt, true);
        if (e.aux > (fury ? 0.7 : 1.05)) {
          e.aux = 0;
          e.aux2 = (e.aux2 + 1) % 4;
          if (e.aux2 === 0) this.ringShot(e, fury ? 8 : 4, 200);
          else if (e.aux2 === 1) {
            e.x = Math.max(40, Math.min(this.worldW - 80, p.x + (Math.random() > 0.5 ? 130 : -130)));
            this.burst(e.x + e.w / 2, e.y, "#7a8b96", 12, "ink");
            this.mortar(e, 0.3, -0.4);
            this.mortar(e, -0.3, -0.4);
            this.mortar(e, 0, 0.5);
          } else if (e.aux2 === 2) {
            e.phase = 1;
            this.burst(e.x + e.w / 2, e.y + e.h / 2, "#7a8b96", 10, "ink");
          } else if (fury && this.enemies.filter((x) => x.kind === "zero" && x.alive).length < 2) {
            this.enemies.push(this.spawnEnemy("zero", e.x - 36, e.y));
            this.say("A zero unfiles.");
          } else this.ringShot(e, 6, 180, e.t);
        }
      }
    } else if (e.kind === "endmark") {
      if (!e.grounded) e.vy += 1600 * dt;
      e.facing = p.x > e.x ? 1 : -1;
      if (e.hp < e.maxHp * 0.55 && e.phase < 1) {
        e.phase = 1;
        this.say("The period thickens.");
      }
      e.vx = e.facing * (e.phase >= 2 ? 124 : e.phase ? 96 : 78);
      this.moveActor(e, dt, true);
      if (e.aux > (e.phase >= 2 ? 0.5 : e.phase ? 0.72 : 0.95)) {
        e.aux = 0;
        e.aux2 = (e.aux2 + 1) % 4;
        if (e.aux2 === 0) {
          this.shoot(e, e.facing, 0);
          this.shoot(e, e.facing, -0.32);
          if (e.phase >= 1) this.shoot(e, e.facing, 0.32);
        } else if (e.aux2 === 1) {
          e.vy = -420;
          this.stampLine(p.x + p.w / 2, p.y + p.h - 4, e.phase >= 1 ? 3 : 2, 48);
        } else if (e.aux2 === 2) {
          if (e.phase >= 2) {
            this.pullToward(e, p, 200, 140, dt * 18);
            this.shoot(e, -e.facing, 0.15);
            this.shockwave(e);
          } else {
            this.mortar(e, e.facing, -0.9);
            this.mortar(e, -e.facing, -0.9);
          }
        } else this.ringShot(e, e.phase >= 2 ? 8 : 4, 185);
      }
      if (e.grounded && Math.random() < 0.014) e.vy = -360;
    } else if (e.kind === "plus" || e.kind === "summand") {
      if (!e.grounded) e.vy += 1600 * dt;
      e.facing = p.x > e.x ? 1 : -1;
      e.vx = e.facing * (e.kind === "summand" ? 72 : 40);
      this.moveActor(e, dt, e.kind === "summand");
      if (e.aux > (e.kind === "summand" ? 1.15 : 1.6)) {
        e.aux = 0;
        e.aux2 = (e.aux2 + 1) % (e.kind === "summand" ? 4 : 2);
        for (const o of this.enemies) {
          if (o.alive && o !== e && Math.hypot(o.x - e.x, o.y - e.y) < 150) o.hp = Math.min(o.maxHp, o.hp + (e.kind === "summand" ? 2 : 1));
        }
        this.burst(e.x + e.w / 2, e.y, "#e8d48a", 8, "glyph");
        if (e.kind === "summand") {
          if (e.aux2 === 1) this.stampAt(p.x + p.w / 2, p.y + p.h - 4);
          else if (e.aux2 === 2) this.ringShot(e, 6, 190);
          else if (e.aux2 === 3 && this.enemies.filter((x) => x.kind === "plus" && x.alive).length < 2) {
            this.enemies.push(this.spawnEnemy("plus", e.x - 40, e.y));
            this.say("Summand adds.");
          }
        }
      }
    } else if (e.kind === "minus" || e.kind === "difference") {
      if (!e.grounded) e.vy += 1600 * dt;
      e.facing = p.x > e.x ? 1 : -1;
      e.vx = e.facing * (e.kind === "difference" ? 96 : 55);
      this.moveActor(e, dt, e.kind === "difference");
      if (e.aux > (e.kind === "difference" ? 0.95 : 1.4)) {
        e.aux = 0;
        e.aux2 = (e.aux2 + 1) % (e.kind === "difference" ? 4 : 2);
        this.shoot(e, e.facing, 0);
        if (e.kind === "difference") {
          if (e.aux2 === 1) this.shockwave(e);
          else if (e.aux2 === 2) {
            e.vx = e.facing * 240;
            this.walls = this.walls.filter((w) => {
              if (Math.hypot(w.x - e.x, w.y - e.y) < 90) {
                this.burst(w.x + w.w / 2, w.y, "#d45a4a", 6, "ink");
                return false;
              }
              return true;
            });
          } else if (e.aux2 === 3) this.ringShot(e, 4, 210);
        }
      }
    } else if (e.kind === "times" || e.kind === "product") {
      if (!e.grounded) e.vy += 1500 * dt;
      e.facing = p.x > e.x ? 1 : -1;
      e.vx = e.facing * (e.kind === "product" ? 50 : 35);
      this.moveActor(e, dt, e.kind === "product");
      const cap = e.kind === "product" ? 16 : 14;
      if (e.aux > (e.kind === "product" ? 1.5 : 2.6) && this.enemies.filter((x) => x.alive).length < cap) {
        e.aux = 0;
        e.aux2 = (e.aux2 + 1) % 3;
        this.enemies.push(this.spawnEnemy("radix", e.x + 20, e.y));
        this.burst(e.x, e.y, "#c46ad4", 8, "glyph");
        if (e.kind === "product" && e.aux2 === 1) this.ringShot(e, 8, 175);
        if (e.kind === "product" && e.aux2 === 2) this.enemies.push(this.spawnEnemy("times", e.x - 30, e.y));
      }
    } else if (e.kind === "divide" || e.kind === "quotient") {
      e.vx *= 0.85;
      if (!e.grounded) e.vy += 1400 * dt;
      this.moveActor(e, dt, e.kind === "quotient");
      if (e.aux > (e.kind === "quotient" ? 0.55 : 0.7)) {
        e.aux = 0;
        e.aux2 = (e.aux2 + 1) % 3;
        this.shoot(e, 0, 1);
        this.shoot(e, 0, -1);
        if (e.kind === "quotient") {
          this.shoot(e, 1, 0);
          this.shoot(e, -1, 0);
          if (e.aux2 === 1) this.ringShot(e, 6, 200);
          if (e.aux2 === 2) {
            this.walls = this.walls.filter((w) => {
              if (Math.hypot(w.x - e.x, w.y - e.y) < 70) {
                this.burst(w.x, w.y, "#8ec8d4", 4, "ink");
                return false;
              }
              return true;
            });
            this.stampAt(p.x + p.w / 2, p.y + p.h - 4);
          }
        }
      }
    } else if (e.kind === "pi") {
      e.y += Math.sin(e.t * 2.2) * 18 * dt;
      e.facing = p.x > e.x ? 1 : -1;
      if (e.aux > 0.85) {
        e.aux = 0;
        const a = e.t * 2.2;
        this.bullets.push({
          x: e.x + e.w / 2,
          y: e.y + e.h / 2,
          vx: Math.cos(a) * 170,
          vy: Math.sin(a) * 170,
          r: 5,
          from: "enemy",
          dmg: 1,
          life: 1.8,
          kind: "shot",
          alive: true,
          pierce: 0,
        });
      }
    } else if (e.kind === "radix") {
      if (!e.grounded) e.vy += 900 * dt;
      e.vx = e.facing * 140;
      this.moveActor(e, dt, false);
      if (e.aux > 0.9) {
        e.aux = 0;
        e.facing = (e.facing * -1) as 1 | -1;
        e.vy = -220;
      }
    } else if (e.kind === "infinitum") {
      e.x += Math.sin(e.t * 1.6) * 90 * dt;
      e.y += Math.cos(e.t * 2.4) * 34 * dt;
      e.facing = p.x > e.x ? 1 : -1;
      if (e.hp < e.maxHp * 0.5 && e.phase < 1) {
        e.phase = 1;
        this.say("Infinitum will not close.");
      }
      if (e.aux > (e.phase ? 0.38 : 0.52)) {
        e.aux = 0;
        e.aux2 = (e.aux2 + 1) % 4;
        this.shoot(e, e.facing, 0.2);
        this.shoot(e, -e.facing, -0.2);
        if (e.aux2 === 1) this.ringShot(e, 6, 165, e.t);
        if (e.aux2 === 2) {
          this.pullToward(e, p, 200, 110, dt * 36);
          this.burst(e.x + e.w / 2, e.y, "#c46ad4", 8, "glyph");
          this.stampAt(p.x + p.w / 2, p.y + p.h - 4);
        }
        if (e.aux2 === 3 && e.phase) this.ringShot(e, 10, 150, e.t * 0.5);
      }
    } else if (e.kind === "remainder") {
      if (!e.grounded) e.vy += 1500 * dt;
      e.facing = p.x > e.x ? 1 : -1;
      e.vx = e.facing * (90 + e.phase * 24);
      this.moveActor(e, dt, true);
      if (e.hp < e.maxHp * 0.55 && e.phase < 1) {
        e.phase = 1;
        this.say("The remainder will not file.");
      }
      if (e.hp < e.maxHp * 0.28 && e.phase < 2) {
        e.phase = 2;
        this.say("Unfiled. Uncounted.");
      }
      if (e.aux > (e.phase >= 2 ? 0.48 : e.phase ? 0.62 : 0.88)) {
        e.aux = 0;
        e.aux2 = (e.aux2 + 1) % 5;
        if (e.aux2 === 0) this.shockwave(e);
        else if (e.aux2 === 1) this.stampLine(p.x + p.w / 2, p.y + p.h - 4, e.phase >= 1 ? 4 : 2, 44);
        else if (e.aux2 === 2) {
          this.mortar(e, e.facing, -0.8);
          this.mortar(e, -e.facing, -0.8);
          if (e.phase) this.mortar(e, 0, -1.1);
        } else if (e.aux2 === 3) this.ringShot(e, e.phase >= 2 ? 10 : 8, 195);
        else if (e.phase && this.enemies.filter((x) => x.alive).length < 12) {
          const spawn: EnemyKind[] = ["plus", "minus", "radix"];
          this.enemies.push(this.spawnEnemy(spawn[Math.floor(Math.random() * spawn.length)], e.x - 40, e.y));
        } else this.shoot(e, e.facing, 0.15);
      }
    } else {
      if (!e.grounded) e.vy += 1800 * dt;
      e.facing = p.x > e.x ? 1 : -1;
      e.vx = e.facing * 50;
      this.moveActor(e, dt, false);
    }
  }

  private windFire(e: Enemy, period: number): boolean {
    const wind = Math.min(0.36, period * 0.3);
    if (e.aux >= period) {
      e.aux = 0;
      return true;
    }
    if (e.aux >= period - wind) e.vx *= 0.32;
    return false;
  }

  private fanShot(e: Enemy, dir: number, spread: number, n: number) {
    if (n <= 1) {
      this.shoot(e, dir, 0);
      return;
    }
    for (let i = 0; i < n; i++) this.shoot(e, dir, (i / (n - 1) - 0.5) * spread);
  }

  private stampLine(x: number, y: number, n = 3, gap = 44) {
    const mid = Math.floor(n / 2);
    for (let i = 0; i < n; i++) this.stampAt(x + (i - mid) * gap, y);
  }

  private shoot(e: Enemy, dir: number, vy: number) {
    this.bullets.push({
      x: e.x + e.w / 2,
      y: e.y + e.h * 0.35,
      vx: dir === 0 ? 0 : dir * 220,
      vy: vy * 220,
      r: 5,
      from: "enemy",
      dmg: 1,
      life: 2.5,
      kind: "shot",
      alive: true,
      pierce: 0,
    });
  }

  private mortar(e: Enemy, dir: number, lift: number) {
    this.bullets.push({
      x: e.x + e.w / 2,
      y: e.y + 8,
      vx: dir * 140,
      vy: lift * 220,
      r: 6,
      from: "enemy",
      dmg: 1,
      life: 2.2,
      kind: "mortar",
      alive: true,
      pierce: 0,
    });
  }

  private ringShot(e: Enemy, n: number, spd = 200, phase = 0) {
    const cx = e.x + e.w / 2;
    const cy = e.y + e.h / 2;
    for (let i = 0; i < n; i++) {
      const a = phase + (i * Math.PI * 2) / n;
      this.bullets.push({
        x: cx,
        y: cy,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        r: 5,
        from: "enemy",
        dmg: 1,
        life: 2.1,
        kind: "shot",
        alive: true,
        pierce: 0,
      });
    }
  }

  private shockwave(e: Enemy) {
    this.trauma = Math.min(1, this.trauma + 0.12);
    this.burst(e.x + e.w / 2, e.y + e.h, "#d45a4a", 10, "dust");
    for (const dir of [-1, 1] as const) {
      this.bullets.push({
        x: e.x + e.w / 2,
        y: e.y + e.h - 8,
        vx: dir * 160,
        vy: 0,
        r: 12,
        from: "enemy",
        dmg: 1,
        life: 0.85,
        kind: "wave",
        alive: true,
        pierce: 0,
      });
    }
  }

  private stampAt(x: number, y: number) {
    this.bullets.push({
      x,
      y,
      vx: 0,
      vy: 0,
      r: 22,
      from: "enemy",
      dmg: 1,
      life: 1.05,
      kind: "stamp",
      alive: true,
      pierce: 0,
    });
  }

  private atLedge(e: Enemy) {
    const x = e.facing > 0 ? e.x + e.w + 2 : e.x - 10;
    return !this.blockedAt(x, e.y + e.h + 3, 8, 8, false);
  }

  private inSight(e: Enemy) {
    const pad = 64;
    return (
      e.x + e.w > this.camX - pad &&
      e.x < this.camX + VIEW_W + pad &&
      e.y + e.h > this.camY - pad &&
      e.y < this.camY + VIEW_H + pad
    );
  }

  private pullToward(e: Enemy, p: Player, radius: number, force: number, dt: number) {
    const cx = e.x + e.w / 2;
    const cy = e.y + e.h / 2;
    const dx = cx - (p.x + p.w / 2);
    const dy = cy - (p.y + p.h / 2);
    const d = Math.hypot(dx, dy) || 1;
    if (d >= radius) return;
    const nx = p.x + (dx / d) * force * dt;
    const ny = p.y + (dy / d) * (force * 0.55) * dt;
    const large = isLarge(p.letter, p.capital);
    if (this.blockedAt(nx, ny, p.w, p.h, large)) return;
    if (this.hazardAt(nx, ny, p.w, p.h)) return;
    p.x = nx;
    p.y = ny;
  }

  private hazardAt(x: number, y: number, w: number, h: number) {
    const box = { x, y, w, h };
    for (const s of this.solidsNow(true, box, "hazard")) {
      if (s.type === "sluice" && aabb(box, s)) return true;
      if (s.type === "laser" && aabb(box, s) && this.laserHot(s)) return true;
      if (s.type === "spike" && aabb(box, s) && this.spikeHot(s)) return true;
    }
    return false;
  }

  /** Nudge out of teeth/lasers so a fall doesn't pin the curve in the hazard AABB. */
  private ejectFromHazards() {
    const p = this.player;
    const large = isLarge(p.letter, p.capital);
    for (let pass = 0; pass < 4; pass++) {
      let hit: Solid | null = null;
      for (const s of this.solidsNow(large, p, "hazard")) {
        if (s.type !== "spike" && s.type !== "laser") continue;
        if (!aabb(p, s)) continue;
        if (s.type === "spike") {
          if (p.grounded && s.y + s.h <= p.y + p.h + 6) continue;
          if (s.phase != null && !this.spikeHot(s)) continue;
        }
        if (s.type === "laser" && !this.laserHot(s)) continue;
        hit = s;
        break;
      }
      if (!hit) return;
      const dir = p.x + p.w / 2 < hit.x + hit.w / 2 ? -1 : 1;
      const nx = p.x + dir * 8;
      const ny = p.y - 6;
      if (!this.blockedAt(nx, ny, p.w, p.h, large) && !this.hazardAt(nx, ny, p.w, p.h)) {
        p.x = nx;
        p.y = ny;
        p.vx = dir * 90;
        p.vy = Math.min(p.vy, -80);
      } else if (
        Number.isFinite(this.lastSafeX) &&
        this.lastSafeY < this.worldH - TILE &&
        !this.hazardAt(this.lastSafeX, this.lastSafeY, p.w, p.h)
      ) {
        p.x = this.lastSafeX;
        p.y = this.lastSafeY;
        p.vx = 0;
        p.vy = 0;
        return;
      } else {
        return;
      }
    }
  }

  private updateBullets(dt: number) {
    const p = this.player;
    const cap = this.lite ? 20 : 32;
    for (const b of this.bullets) {
      if (!b.alive) continue;
      b.life -= dt;
      if (b.kind === "mortar" || b.kind === "ember") b.vy += (b.kind === "ember" ? 420 : 980) * dt;
      if (b.kind !== "stamp") {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
      }
      if (b.kind === "wind") b.vx *= 0.999;
      if (b.life <= 0) b.alive = false;
      const box =
        b.kind === "wave"
          ? { x: b.x - 16, y: b.y - 6, w: 32, h: 14 }
          : { x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2 };
      if (b.from === "enemy") {
        const hot = b.kind !== "stamp" || b.life < 0.4;
        if (hot && aabb(box, p) && p.invuln <= 0 && p.roll <= 0) {
          if (b.kind !== "wave") b.alive = false;
          this.hurt(b.dmg, b.vx > 0 ? 1 : -1);
        }
        if (b.kind !== "stamp") {
          const large = p.letter === "b" || p.capital;
          for (const s of this.solidsNow(large, box)) {
            if (s.type === "spike") continue;
            if (b.kind === "wave" && (s.type === "oneway" || s.type === "crumble" || s.y >= b.y - 2)) continue;
            if (aabb(box, s)) {
              b.alive = false;
              if (b.kind === "mortar") this.burst(b.x, b.y, "#d45a4a", 6, "ember");
            }
          }
        }
      } else {
        for (const e of this.enemies) {
          if (e.alive && aabb(box, e)) {
            this.hitEnemy(e, b.dmg, b.vx > 0 ? 1 : -1);
            if (b.kind === "frost") e.stun = Math.max(e.stun, this.player.capital ? 1.05 : 0.55);
            if (b.kind === "ember") {
              this.burns.push({ x: e.x + 4, y: e.y + e.h - 10, w: e.w - 8, h: 10, life: 0.8 });
            }
            if (b.pierce > 0) b.pierce -= 1;
            else b.alive = false;
          }
        }
        for (const s of this.solidsNow(true, box, "all")) {
          if (s.type === "break" && !s.broken && (p.capital || p.letter === "b") && aabb(box, s)) {
            s.broken = true;
            const tx = Math.floor(s.x / TILE);
            const ty = Math.floor(s.y / TILE);
            this.broken.add(`${tx},${ty}`);
            this.burst(s.x + 20, s.y + 20, "#5ee0c0", 10, "spark");
            this.audio.sfxHit();
            b.alive = false;
          }
        }
      }
      for (const br of this.burns) {
        if (b.from === "enemy" && aabb(box, br)) b.alive = false;
      }
    }
    this.bullets = this.bullets.filter((b) => b.alive);
    if (this.bullets.length > cap) this.bullets.length = cap;
    if (this.burns.length > 10) this.burns.length = 10;
    for (const br of this.burns) {
      for (const e of this.enemies) {
        if (e.alive && aabb(e, br) && e.hurt <= 0) this.hitEnemy(e, 1, this.player.facing);
      }
    }
  }

  private portalLocked() {
    return this.enemies.some((e) => e.alive && this.isBossKind(e.kind));
  }

  private doorLocked(id: string): boolean {
    if (id === "stage1") return false;
    if (id === "stage3") return !this.save.stage1;
    if (id === "stage4") return !this.save.stage3;
    if (id === "stage2") return !this.save.stage4 && !this.save.stage2;
    if (id === "stage5") return !this.save.stage2;
    if (id === "continue") return this.save.progress < 5;
    if (id === "replay") return this.save.progress < 1;
    if (id === "studio") return false;
    const m = /^stage(\d+)$/.exec(id);
    if (m) return this.save.progress < Number(m[1]) - 1;
    return false;
  }

  private doorShutLine(id: string) {
    if (id === "stage3") return "The Press is still counted shut.";
    if (id === "stage4") return "The Coil is still counted shut.";
    if (id === "stage2") return "The Fort is still counted shut.";
    if (id === "stage5") return "The Ledger is still counted shut.";
    if (id === "continue") return "The rest of the book opens after you close the five chapters. Then this is the only door that keeps offering new ledgers through 60.";
    if (id === "replay") return "Last page only. It never opens a new ledger. New pages are through the Unbound Sentence.";
    return "Still counted shut.";
  }

  private doorPlaque(id: string): { title: string; sub: string } {
    if (id === "continue") {
      if (this.save.progress < 5) return { title: "THE REST OF THE BOOK", sub: "locked · finish the five closed chapters" };
      if (this.save.progress >= STAGE_COUNT) return { title: "THE REST OF THE BOOK", sub: "all 60 ledgers written" };
      const n = Math.min(STAGE_COUNT, this.save.progress + 1);
      return { title: "THE REST OF THE BOOK", sub: `only door that keeps changing · next ${n} / 60` };
    }
    if (id === "replay") {
      if (this.save.progress < 1) return { title: "LAST PAGE", sub: "does not open new ledgers" };
      const last = lastClearedId(this.save.progress);
      const name = last ? LEVELS[last]?.name ?? last : "";
      return { title: "LAST PAGE", sub: `same ledger again · ${name}` };
    }
    const chapters: Record<string, { title: string; sub: string }> = {
      stage1: { title: "I  EXCHANGE", sub: "one ledger · never changes" },
      stage2: { title: "II  FORT", sub: "one ledger · never changes" },
      stage3: { title: "III  PRESS", sub: "one ledger · never changes" },
      stage4: { title: "IV  COIL", sub: "one ledger · never changes" },
      stage5: { title: "V  LEDGER", sub: "one ledger · never changes" },
    };
    return chapters[id] ?? { title: "", sub: "" };
  }

  private scribe(down: boolean) {
    if (this.wordCd > 0) return;
    const p = this.player;
    const thick = this.save.words.includes("WALL") || p.capital || p.letter === "t";
    const cost = p.letter === "t" ? 4 : p.letter === "r" ? 8 : 6;
    if (p.ink < cost) {
      this.say("Ink dry.");
      return;
    }
    p.ink -= cost;
    this.wordCd = 0.38;
    this.audio.sfxWord();
    const life = thick ? 7.2 : 5.2;
    const maxN = thick ? 4 : 3;
    const capN = (this.save.words.includes("TIDE") ? maxN + 1 : maxN) + (p.letter === "t" ? 1 : 0);
    let c: Construct;
    if (down) {
      const w = thick ? 92 : 76;
      const air = !p.grounded;
      c = {
        x: air
          ? p.x + p.w / 2 - w / 2 + p.facing * 12
          : p.x + (p.facing > 0 ? p.w * 0.28 : -w + p.w * 0.72),
        y: p.y + p.h + (air ? 3 : -5),
        w,
        h: 12,
        life,
        max: life,
        kind: "plat",
      };
      this.say("SHELF");
    } else {
      const h = thick ? p.h + 48 : p.h + 34;
      const ww = thick ? 18 : 14;
      c = {
        x: p.x + (p.facing > 0 ? p.w + 8 : -ww - 8),
        y: p.y - 16,
        w: ww,
        h,
        life,
        max: life,
        kind: "wall",
      };
      this.say("STEM");
    }
    this.walls.push(c);
    if (this.save.words.includes("BURN")) {
      this.burns.push({ x: c.x - 6, y: c.y - 6, w: c.w + 12, h: c.h + 12, life: life * 0.9 });
    }
    while (this.walls.length > capN) this.walls.shift();
    this.burst(c.x + c.w / 2, c.y + c.h / 2, "#5ee0c0", 8, "glyph");
  }

  private enterPortal(u: Pickup) {
    if (this.sandbox) {
      this.say("The gate holds. Esc returns to the desk.");
      this.studioStop();
      return;
    }
    if (this.portalLocked()) {
      this.say("The gate is still counted shut.");
      return;
    }
    this.audio.sfxTransform();
    this.markProgress();
    if (u.id === "win" || this.stageIndex() === STAGE_COUNT || LEVELS[this.stage]?.exit === "win") {
      this.mode = "win";
      this.persist();
      this.emit();
      return;
    }
    this.loadLevel("hub");
  }

  private updatePickups() {
    const p = this.player;
    this.nearHint = "";
    for (const n of this.npcs) {
      if (aabb(p, padBox(n, 40, 22))) this.nearHint = "Talk";
    }
    for (const m of this.markers) {
      if (m.kind === "down" && aabb(p, { x: m.x - 40, y: m.y - 24, w: 120, h: 80 })) {
        this.nearHint = this.save.stage1 ? "Drop to the STACKS gate" : "Drop down — Dualis rings below";
      }
    }
    for (const u of this.pickups) {
      if (u.kind === "door" && aabb(p, padBox(u, 28, 16))) {
        if (this.doorLocked(u.id)) this.nearHint = this.doorShutLine(u.id);
        else if (u.id === "continue") {
          this.nearHint =
            this.save.progress >= STAGE_COUNT
              ? "All 60 written. Last Page only repeats."
              : "E  The Rest of the Book — the only door that keeps opening new ledgers until 60";
        } else if (u.id === "replay") {
          this.nearHint = "E  Last Page — same ledger again. Does not open a new one.";
        } else if (u.id === "studio") {
          this.nearHint = "E  Studio — write a ledger of your own";
        } else
          this.nearHint = "E  " + (u.label ?? "chapter") + " — one ledger. This door always opens the same page.";
      }
      if (u.kind === "portal" && aabb(p, padBox(u, 18, 12))) {
        this.nearHint = this.portalLocked() ? "Gate counted shut — drop the warden" : "E  enter  " + (u.label ?? "GATE");
      }
      if (u.kind === "case" && !u.taken && aabb(p, padBox(u, 10, 8))) {
        this.nearHint = this.save.hasCapital ? "Shift case" : "Case Font — need the Drop Cap";
      }
    }
    if (this.mode === "play" || this.mode === "hub") {
      for (const n of this.npcs) {
        if (aabb(p, padBox(n, 6, 4))) {
          this.openTalk(n);
          break;
        }
      }
    }
    for (const u of this.pickups) {
      if (u.taken) continue;
      const grab = u.kind === "door" || u.kind === "portal" || u.kind === "case" ? u : padBox(u, 14, 12);
      if (!aabb(p, grab)) continue;
      if (u.kind === "ink") {
        u.taken = true;
        p.ink = Math.min(p.maxInk, p.ink + 8);
        this.audio.sfxPickup();
        this.say("Ink.");
      } else if (u.kind === "heart") {
        u.taken = true;
        p.hp = Math.min(p.maxHp, p.hp + 2);
        this.audio.sfxPickup();
        this.say("Curve mends.");
      } else if (u.kind === "fang") {
        u.taken = true;
        if (!this.save.powerups.includes(u.id)) this.save.powerups.push(u.id);
        p.shotLevel = Math.min(4, p.shotLevel + 1);
        this.save.shotLevel = p.shotLevel;
        this.audio.sfxWord();
        this.say("Fang " + ["I", "II", "III", "IV"][p.shotLevel - 1]);
        this.persist();
      } else if (u.kind === "scale") {
        u.taken = true;
        if (!this.save.powerups.includes(u.id)) this.save.powerups.push(u.id);
        this.save.maxShield = Math.min(5, this.save.maxShield + 1);
        if (!this.save.relics.includes("copper")) this.save.relics.push("copper");
        this.syncVitals();
        p.shield = p.maxShield;
        this.audio.sfxWord();
        this.say("Scale plate thickens.");
        this.persist();
      } else if (u.kind === "secret") {
        u.taken = true;
        if (!this.save.powerups.includes(u.id)) this.save.powerups.push(u.id);
        p.ink = Math.min(p.maxInk, p.ink + 16);
        p.hp = Math.min(p.maxHp, p.hp + 1);
        this.audio.sfxWord();
        const secrets = this.save.powerups.filter((id) => id.startsWith("secret-")).length;
        if (secrets >= 3 && !this.save.relics.includes("spine")) {
          this.save.relics.push("spine");
          this.syncVitals();
          this.say("The spine of the book. One more curve to carry.");
        } else {
          this.say("A hidden cache. Ink and a spare curve.");
        }
        this.persist();
      } else if (u.kind === "relic") {
        u.taken = true;
        const rid = (u.id || u.label || "") as RelicId;
        if (rid === "spine" || rid === "copper" || rid === "counter" || rid === "dropCap") {
          if (!this.save.relics.includes(rid)) this.save.relics.push(rid);
          if (rid === "copper") this.save.maxShield = Math.min(6, this.save.maxShield + 1);
          if (rid === "dropCap") this.save.hasCapital = true;
          this.syncVitals();
          this.audio.sfxWord();
          this.say(
            rid === "spine"
              ? "The spine of the book."
              : rid === "counter"
                ? "The Counter. The ward writes back."
                : rid === "copper"
                  ? "Scale plate thickens."
                  : "A relic of the page.",
          );
        }
        this.persist();
      } else if (u.kind === "word" && u.label) {
        u.taken = true;
        const w = u.label as WordId;
        if (!this.save.words.includes(w)) this.save.words.push(w);
        this.audio.sfxWord();
        this.say(
          w === "WALL"
            ? "Scribe thickens."
            : w === "BURN"
              ? "Scribe burns."
              : w === "RISE"
                ? "Shelves lift."
                : w === "LOCK"
                  ? "Stems hold."
                  : w === "FOLD"
                    ? "Stems kick. Jump off a wall you wrote."
                    : w === "TIDE"
                      ? "Shelves drift with you."
                      : "Learned " + w,
        );
        this.persist();
      } else if (u.kind === "drop") {
        u.taken = true;
        this.gainDropCap();
      } else if (u.kind === "check") {
        if (this.lastCheck !== u.id) {
          this.lastCheck = u.id;
          this.checkX = u.x;
          this.checkY = u.y - 4;
          this.save.checkX = this.checkX;
          this.save.checkY = this.checkY;
          this.save.stage = this.stage;
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
          this.audio.sfxPickup();
          this.say("Checkpoint.");
          this.persist();
        }
      } else if (u.kind === "recruit" && u.id) {
        const n = this.npcs.find((npc) => npc.glyph === u.id || npc.id === "recruit-" + u.id);
        if (n) this.openTalk(n);
        else {
          u.taken = true;
          const L = u.id as LetterId;
          if (!this.save.party.includes(L)) this.save.party.push(L);
          if (!this.save.talked.includes(L)) this.save.talked.push(L);
          this.audio.sfxPickup();
          this.say(L + " joins the cell. " + ((KITS[L] ?? KITS.c).element) + ".");
          this.persist();
        }
      }
    }
  }

  private gainDropCap() {
    this.save.hasCapital = true;
    if (!this.save.relics.includes("dropCap")) this.save.relics.push("dropCap");
    this.player.capital = true;
    this.player.maxHp = 8;
    this.player.hp = 8;
    this.applySize();
    this.player.shield = this.player.maxShield;
    this.transformT = 2.1;
    this.mode = "transform";
    this.audio.sfxTransform();
    this.trauma = 0.7;
    this.checkX = this.player.x;
    this.checkY = this.player.y;
    this.persist();
    this.emit();
  }

  private tryCase() {
    if (!this.save.hasCapital) {
      this.say("The Drop Cap is still unread.");
      return;
    }
    this.player.capital = !this.player.capital;
    this.save.capital = this.player.capital;
    this.applySize();
    this.audio.sfxSwap();
    const g = this.player.letter;
    this.say(this.player.capital ? "CASE: " + g.toUpperCase() : "case: " + g);
    this.persist();
  }

  private tryInteract(): boolean {
    const p = this.player;
    for (const n of this.npcs) {
      if (aabb(p, padBox(n, 36, 20))) {
        this.openTalk(n);
        return true;
      }
    }
    for (const u of this.pickups) {
      if (u.kind === "door" && aabb(p, padBox(u, 28, 16))) {
        if (this.doorLocked(u.id)) {
          this.say(this.doorShutLine(u.id));
          return true;
        }
        if (u.id === "continue") {
          if (this.save.progress >= STAGE_COUNT) {
            this.say("All sixty ledgers are written. Last Page only repeats the same one.");
          } else this.loadLevel(nextStageId(this.save.progress));
        }
        else if (u.id === "replay") {
          const last = lastClearedId(this.save.progress);
          if (last) this.loadLevel(last);
        } else if (u.id === "studio") {
          this.enterStudio();
        } else this.loadLevel(u.id as LevelId);
        return true;
      }
      if (u.kind === "portal" && aabb(p, padBox(u, 20, 12))) {
        this.enterPortal(u);
        return true;
      }
      if (u.kind === "case" && aabb(p, padBox(u, 12, 8))) {
        this.tryCase();
        return true;
      }
    }
    return false;
  }

  private openTalk(n: Npc) {
    const who = loreIdFromGlyph(n.glyph);
    if (!this.save.talked.includes(who)) this.save.talked.push(who);
    if (n.id.startsWith("recruit-")) {
      const L = n.id.slice(8) as LetterId;
      if (!this.save.party.includes(L)) this.save.party.push(L);
      const rec = this.pickups.find((u) => u.kind === "recruit" && u.id === L);
      if (rec) rec.taken = true;
      this.say(L + " joins the cell. " + ((KITS[L] ?? KITS.c).element) + ".");
    }
    this.talkingNpc = n.id;
    this.dialogueQueue = n.lines.map((text) => ({ name: n.name, text, who: n.glyph }));
    this.persist();
    this.noteTasks();
    this.advanceDialogue();
  }

  private dismissNpc(id: string | null) {
    if (!id) return;
    const n = this.npcs.find((npc) => npc.id === id);
    if (n) this.burst(n.x + n.w / 2, n.y + n.h / 2, "#5ee0c0", 10, "glyph");
    this.npcs = this.npcs.filter((npc) => npc.id !== id);
    this.talkingNpc = null;
  }

  private advanceDialogue() {
    const next = this.dialogueQueue.shift();
    if (!next) {
      this.dialogue = null;
      this.dismissNpc(this.talkingNpc);
      this.mode = this.stage === "hub" ? "hub" : "play";
    } else {
      this.dialogue = next;
      this.mode = "dialogue";
    }
    this.emit();
  }

  private swapTo(slot: number) {
    const id = this.save.party[slot - 1];
    if (!id || id === this.player.letter) return;
    this.player.letter = id;
    this.player.capital = this.save.hasCapital && this.save.capital;
    this.player.airHop = id === "s" ? 1 : 0;
    this.applySize();
    this.swapCd = 0.35;
    this.player.invuln = Math.max(this.player.invuln, 0.2);
    this.audio.sfxSwap();
    const glow = (KITS[id] ?? KITS.c).glow;
    this.burst(this.player.x + this.player.w / 2, this.player.y, glow, 8, "glyph");
    this.save.letter = id;
    this.say((KITS[id] ?? KITS.c).element);
  }


  /** Walk the cell when the roster is larger than the number row. */
  private cycleParty(dir: number) {
    const party = this.save.party;
    if (party.length < 2) return;
    const cur = Math.max(0, party.indexOf(this.player.letter));
    const next = (cur + dir + party.length * 8) % party.length;
    this.swapTo(next + 1);
  }

  cycleWord() {
    if (this.save.words.length) this.selectedWord = (this.selectedWord + 1) % this.save.words.length;
    this.emit();
  }

  private followCam(dt: number) {
    const p = this.player;
    this.look += (p.facing * 42 - this.look) * (1 - Math.exp(-3.4 * dt));
    const tx = p.x + p.w / 2 - VIEW_W * 0.4 + this.look;
    const ty = p.y + p.h / 2 - VIEW_H * 0.56;
    this.camX += (tx - this.camX) * (1 - Math.exp(-5.2 * dt));
    this.camY += (ty - this.camY) * (1 - Math.exp(-4.4 * dt));
    this.camX = Math.max(0, Math.min(this.worldW - VIEW_W, this.camX));
    this.camY = Math.max(0, Math.min(Math.max(0, this.worldH - VIEW_H), this.camY));
  }

  private burst(x: number, y: number, color: string, n: number, kind: Particle["kind"]) {
    const cap = this.lite ? 40 : 80;
    if (this.particles.length > cap) return;
    const count = this.lite ? Math.max(1, Math.ceil(n * 0.4)) : n;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 180,
        vy: (Math.random() - 0.8) * 160,
        life: 0.35 + Math.random() * 0.35,
        max: 0.7,
        size: 2 + Math.random() * 3,
        color,
        kind,
      });
    }
  }

  private updateParticles(dt: number) {
    const cap = this.lite ? 40 : 80;
    let w = 0;
    const list = this.particles;
    for (let i = 0; i < list.length; i++) {
      const q = list[i];
      q.life -= dt;
      if (q.life <= 0) continue;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vy += 240 * dt;
      list[w++] = q;
    }
    list.length = w;
    if (list.length > cap) list.splice(0, list.length - cap);
  }

  private say(s: string) {
    this.toast = s;
    this.toastT = 2.2;
  }

  nextDialogue() {
    this.advanceDialogue();
  }

  advanceIntro() {
    if (this.mode !== "intro") return;
    if (!this.uiOnce(420)) return;
    this.audio.unlock();
    this.audio.sfxUi();
    this.introPage += 1;
    if (this.introPage > 3) this.loadLevel("hub");
    this.emit();
  }

  respawn() {
    this.player.hp = this.player.maxHp;
    this.player.shield = this.player.maxShield;
    this.player.x = this.checkX;
    this.player.y = this.checkY;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.invuln = 1;
    this.settleOnFloor();
    this.lastSafeX = this.player.x;
    this.lastSafeY = this.player.y;
    this.camX = this.player.x - VIEW_W * 0.35;
    this.camY = this.player.y - VIEW_H * 0.62;
    this.mode = this.stage === "hub" ? "hub" : "play";
    this.emit();
  }

  resume() {
    this.mode = this.prevMode === "pause" ? (this.stage === "hub" ? "hub" : "play") : this.prevMode;
    this.emit();
  }

  toggleMute() {
    if (!this.uiOnce(240)) return;
    this.audio.setMuted(!this.audio.muted);
    this.save.muted = this.audio.muted;
    this.persist();
    this.emit();
  }

  toggleHard() {
    if (!this.uiOnce(240)) return;
    this.hard = !this.hard;
    this.save.hard = this.hard;
    this.emit();
  }

  private uiOnce(ms = 320) {
    const n = performance.now();
    if (n - this.uiAt < ms) return false;
    this.uiAt = n;
    return true;
  }

  returnHub() {
    this.loadLevel("hub");
  }

  private currentTasks(): TaskSnap[] {
    const defs = LEVELS[this.stage]?.tasks ?? [];
    return defs
      .filter((t) => {
        if (typeof t.need === "number" && this.save.progress < t.need) return false;
        return true;
      })
      .map((t) => ({ id: t.id, text: t.text, done: this.isTaskDone(t.id) }));
  }

  private isTaskDone(id: string): boolean {
    const s = this.save;
    if (id.startsWith("recruit-")) return s.party.includes(id.slice(8) as LetterId);
    switch (id) {
      case "talk-e":
        return s.talked.includes("e");
      case "talk-t":
        return s.talked.includes("t");
      case "talk-m":
        return s.talked.includes("m");
      case "talk-u":
        return s.talked.includes("u");
      case "talk-p":
        return s.talked.includes("p");
      case "talk-n":
        return s.talked.includes("n");
      case "enter-lanes":
        return s.visited.includes("stage1");
      case "enter-gutter":
        return s.visited.includes("stage3");
      case "enter-coil":
        return s.visited.includes("stage4");
      case "enter-fort":
        return s.visited.includes("stage2");
      case "enter-ledger":
        return s.visited.includes("stage5");
      case "continue":
        return s.progress >= 6;
      case "word-wall":
        return s.words.includes("WALL");
      case "word-burn":
        return s.words.includes("BURN");
      case "word-rise":
        return s.words.includes("RISE");
      case "word-lock":
        return s.words.includes("LOCK");
      case "drop-cap":
        return s.hasCapital;
      case "dualis":
        return s.stage1;
      case "tetrarch":
      case "importer":
        return s.stage2;
      case "nullis":
        return s.stage5;
      case "cross-gutter":
        return this.stage === "stage3" && this.player.x > 140 * TILE;
      case "cross-lasers":
        return this.stage === "stage5" && this.player.x > 180 * TILE;
      case "gate-stacks":
        return s.stage1 && this.stage !== "stage1";
      case "gate-press":
        return s.stage3 && this.stage !== "stage3";
      case "gate-coil":
        return s.stage4 && this.stage !== "stage4";
      case "gate-chapter":
        return s.stage2 && this.stage !== "stage2";
      case "gate-ledger":
        return s.stage5 && this.stage !== "stage5";
      default: {
        if (id.startsWith("clear-")) {
          const n = Number(id.slice(6));
          return s.progress >= n && this.stage !== `stage${n}`;
        }
        if (id.startsWith("word-")) return s.words.includes(id.slice(5).toUpperCase() as WordId);
        return false;
      }
    }
  }

  private noteTasks() {
    const tasks = this.currentTasks();
    const newly = tasks.filter((t) => t.done && !this.lastDone.has(t.id));
    for (const t of newly) this.lastDone.add(t.id);
    if (newly.length && (this.mode === "play" || this.mode === "hub" || this.mode === "transform")) {
      this.say("✓  " + newly[0].text);
    }
  }

  private activeObjective(): string {
    if (this.nearHint) return this.nearHint;
    const tasks = this.currentTasks();
    const open = tasks.find((t) => !t.done);
    if (open) return open.text;
    return LEVELS[this.stage]?.objective ?? this.objective;
  }

  private goal(): { x: number; y: number; label: string } | null {
    const open = this.currentTasks().find((t) => !t.done);
    const id = open?.id;
    const npc = (g: string) => this.npcs.find((n) => n.glyph === g || n.id === g);
    const pk = (kind: Pickup["kind"], match?: string) =>
      this.pickups.find((u) => u.kind === kind && !u.taken && (!match || u.id === match || u.label === match));
    if (id === "talk-e") {
      const n = npc("e");
      if (n) return { x: n.x + n.w / 2, y: n.y, label: "e" };
    }
    if (id === "talk-t") {
      const n = npc("t");
      if (n) return { x: n.x + n.w / 2, y: n.y, label: "t" };
    }
    if (id === "talk-m") {
      const n = npc("m");
      if (n) return { x: n.x + n.w / 2, y: n.y, label: "m" };
    }
    if (id === "talk-u") {
      const n = npc("u");
      if (n) return { x: n.x + n.w / 2, y: n.y, label: "u" };
    }
    if (id === "talk-p") {
      const n = npc("p");
      if (n) return { x: n.x + n.w / 2, y: n.y, label: "p" };
    }
    if (id === "enter-lanes") {
      const d = this.pickups.find((u) => u.kind === "door" && u.id === "stage1");
      if (d) return { x: d.x + d.w / 2, y: d.y + 20, label: "EXCH." };
    }
    if (id === "enter-gutter") {
      const d = this.pickups.find((u) => u.kind === "door" && u.id === "stage3");
      if (d) return { x: d.x + d.w / 2, y: d.y + 20, label: "PRESS" };
    }
    if (id === "enter-coil") {
      const d = this.pickups.find((u) => u.kind === "door" && u.id === "stage4");
      if (d) return { x: d.x + d.w / 2, y: d.y + 20, label: "COIL" };
    }
    if (id === "enter-fort") {
      const d = this.pickups.find((u) => u.kind === "door" && u.id === "stage2");
      if (d) return { x: d.x + d.w / 2, y: d.y + 20, label: "FORT" };
    }
    if (id?.startsWith("recruit-")) {
      const r = pk("recruit", id.slice(8));
      if (r) return { x: r.x, y: r.y, label: id.slice(8) };
    }
    if (id === "word-wall") {
      const w = pk("word", "WALL");
      if (w) return { x: w.x, y: w.y, label: "WALL" };
    }
    if (id === "word-burn") {
      const w = pk("word", "BURN");
      if (w) return { x: w.x, y: w.y, label: "BURN" };
    }
    if (id === "word-rise") {
      const w = pk("word", "RISE");
      if (w) return { x: w.x, y: w.y, label: "RISE" };
    }
    if (id === "word-lock") {
      const w = pk("word", "LOCK");
      if (w) return { x: w.x, y: w.y, label: "LOCK" };
    }
    if (id === "word-fold") {
      const w = pk("word", "FOLD");
      if (w) return { x: w.x, y: w.y, label: "FOLD" };
    }
    if (id === "word-tide") {
      const w = pk("word", "TIDE");
      if (w) return { x: w.x, y: w.y, label: "TIDE" };
    }
    if (id === "drop-cap") {
      const d = pk("drop");
      if (d) return { x: d.x + 16, y: d.y, label: "DROP CAP" };
    }
    if (id === "dualis") {
      const b = this.enemies.find((e) => e.kind === "dualis" && e.alive);
      if (b) return { x: b.x + b.w / 2, y: b.y, label: "DUALIS" };
    }
    if (id === "tetrarch") {
      const b = this.enemies.find((e) => e.kind === "tetrarch" && e.alive);
      if (b) return { x: b.x + b.w / 2, y: b.y, label: "TETRARCH" };
    }
    if (id === "enter-ledger") {
      const d = this.pickups.find((u) => u.kind === "door" && u.id === "stage5");
      if (d) return { x: d.x + d.w / 2, y: d.y + 20, label: "LEDGER" };
    }
    if (id === "continue") {
      const d = this.pickups.find((u) => u.kind === "door" && u.id === "continue");
      if (d) return { x: d.x + d.w / 2, y: d.y + 20, label: "THE BOOK" };
    }
    if (id === "importer") {
      const b = this.enemies.find((e) => e.kind === "importer" && e.alive);
      if (b) return { x: b.x + b.w / 2, y: b.y, label: "G" };
    }
    if (id === "nullis") {
      const b = this.enemies.find((e) => e.kind === "nullis" && e.alive);
      if (b) return { x: b.x + b.w / 2, y: b.y, label: "NULLIS" };
    }
    if (id === "gate-stacks" || id === "gate-chapter" || id === "gate-press" || id === "gate-coil" || id === "gate-ledger" || (id && id.startsWith("clear-"))) {
      const g = this.pickups.find((u) => u.kind === "portal");
      if (g) return { x: g.x + g.w / 2, y: g.y + 20, label: g.label ?? "GATE" };
    }
    return null;
  }

  private emit() {
    const boss = this.enemies.find((e) => this.isBossKind(e.kind) && e.alive);
    this.ui({
      mode: this.mode,
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      ink: this.player.ink,
      maxInk: this.player.maxInk,
      letter: this.player.letter,
      capital: this.player.capital,
      party: this.save.party,
      words: this.save.words,
      selectedWord: this.selectedWord,
      objective: this.activeObjective(),
      tasks: this.currentTasks(),
      boss: boss ? { name: boss.name, hp: boss.hp, max: boss.maxHp } : null,
      toast: this.toast,
      dialogue: this.dialogue,
      stage: this.draft?.name ?? LEVELS[this.stage]?.name ?? "",
      muted: this.audio.muted,
      shake: this.save.shake,
      hard: this.hard,
      canContinue: this.save.progress > 0 || this.save.hasCapital || this.save.stage1 || this.save.party.length > 1,
      introPage: this.introPage,
      hasCapital: this.save.hasCapital,
      stage1: this.save.stage1,
      stage2: this.save.stage2,
      stage3: this.save.stage3,
      stage4: this.save.stage4,
      stage5: this.save.stage5,
      progress: this.save.progress,
      transforming: this.transformT,
      shield: this.player.shield,
      maxShield: this.player.maxShield,
      shotLevel: this.player.shotLevel,
      hint: this.nearHint,
      lore: collectedLore(this.save.talked),
      sandbox: this.sandbox,
    });
  }

  snapshot() {
    const alive = this.enemies.filter((e) => e.alive);
    return {
      stage: this.stage,
      name: LEVELS[this.stage]?.name ?? "",
      mode: this.mode,
      fps: Math.round(this.fpsEma * 10) / 10,
      frameMs: Math.round(this.frameMs * 10) / 10,
      drawMs: Math.round(this.drawMs * 10) / 10,
      frames: this.frames,
      solids: this.solids.length,
      grid: this.grid.count,
      enemies: alive.length,
      bullets: this.bullets.length,
      particles: this.particles.length,
      worldW: this.worldW,
      worldH: this.worldH,
      hidden: this.visHidden,
      sandbox: this.sandbox,
      studio: this.mode === "studio" || this.studioPlaying,
    };
  }

  debugEnter(id: string) {
    const level = (LEVELS[id] ? id : "hub") as LevelId;
    this.wake(true);
    this.mode = level === "hub" ? "hub" : "play";
    this.loadLevel(level);
    this.emit();
  }

  private exposeQa() {
    const self = this;
    (window as unknown as { __controlsTest: unknown }).__controlsTest = {
      getYaw: () => 0,
      getSpeed: () => self.player?.vx ?? 0,
      getX: () => self.player?.x ?? 0,
      getVx: () => self.player?.vx ?? 0,
      setKeys: (codes: string[]) => self.input.setKeys(codes),
      mode: () => self.mode,
    };
    (window as unknown as { __glyphbound: unknown }).__glyphbound = {
      engine: self,
      load: (id: string) => self.debugEnter(id),
      begin: () => self.begin(),
      snapshot: () => self.snapshot(),
      studio: {
        enter: (folio?: Folio) => self.enterStudio(folio),
        leave: () => self.leaveStudio(),
        stamp: (tx: number, ty: number, ch?: string) => self.studioStamp(tx, ty, ch),
        play: () => self.studioPlay(),
        stop: () => self.studioStop(),
        folio: () => self.studioFolio(),
        copy: (id: string) => self.studioCopyStage(id),
        catalog: CATALOG,
      },
      wake: () => self.wake(true),
      pump: (now?: number) => self.pump(now ?? performance.now()),
      get fps() {
        return self.fpsEma;
      },
      showFps: (on?: boolean) => {
        if (typeof on === "boolean") self.showFps = on;
        return self.showFps;
      },
    };
  }

  draw() {
    const ctx = this.ctx;
    const dprCap = this.lite ? 1.25 : 1.75;
    const dpr = Math.min(dprCap, window.devicePixelRatio || 1);
    const cw = this.canvas.clientWidth || VIEW_W;
    const ch = this.canvas.clientHeight || VIEW_H;
    const bw = Math.floor(cw * dpr);
    const bh = Math.floor(ch * dpr);
    if (this.bufW !== bw || this.bufH !== bh) {
      this.canvas.width = bw;
      this.canvas.height = bh;
      this.bufW = bw;
      this.bufH = bh;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const scale = Math.min(cw / VIEW_W, ch / VIEW_H);
    const ox = (cw - VIEW_W * scale) / 2;
    const oy = (ch - VIEW_H * scale) / 2;
    ctx.fillStyle = "#07080c";
    ctx.fillRect(0, 0, cw, ch);
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.rect(0, 0, VIEW_W, VIEW_H);
    ctx.clip();

    const sh = this.save.shake ? this.trauma * this.trauma : 0;
    const sx = sh ? (Math.random() * 2 - 1) * 10 * sh : 0;
    const sy = sh ? (Math.random() * 2 - 1) * 8 * sh : 0;
    const theme = this.themeOverride ?? LEVELS[this.stage]?.theme ?? "hub";
    const district = this.draft?.index ?? LEVELS[this.stage]?.index ?? 0;

    if (this.mode === "title" || this.mode === "intro") {
      drawParallax(ctx, this.titleC * 40, 0, this.time, "street", 0, 0, 1);
      this.drawTitleScene(ctx);
    } else {
      drawParallax(ctx, this.camX, this.camY, this.time, theme, sx, sy, district);
      ctx.save();
      ctx.translate(sx, sy);
      drawTiles(ctx, this.rows, this.camX, this.camY, this.time, theme, this.broken);
      if (this.mode === "studio") this.drawStudioGrid(ctx);
      this.drawHubChrome(ctx);
      drawMarkers(ctx, this.markers, this.camX, this.camY, this.time);
      const goal = this.goal();
      if (goal) drawBeacon(ctx, goal.x, goal.y, this.camX, this.camY, this.time, goal.label);
      for (const w of this.walls) this.drawConstruct(ctx, w);
      for (const b of this.burns) {
        ctx.fillStyle = "rgba(212,90,74,0.45)";
        ctx.fillRect(b.x - this.camX, b.y - this.camY, b.w, b.h);
      }
      const camX = this.camX;
      const camY = this.camY;
      const vis = (x: number, y: number, w: number, h: number) =>
        x + w > camX - 48 && x < camX + VIEW_W + 48 && y + h > camY - 48 && y < camY + VIEW_H + 48;
      for (const n of this.npcs) {
        if (!vis(n.x, n.y, n.w, n.h)) continue;
        drawNpcGlyph(ctx, n.glyph, n.x + n.w / 2 - camX, n.y + n.h / 2 - camY, this.time);
      }
      for (const u of this.pickups) {
        if (u.taken) continue;
        if (!vis(u.x, u.y, u.w, u.h)) continue;
        if (u.kind === "door" || u.kind === "portal") this.drawGate(ctx, u);
        else drawPickup(ctx, u.x + u.w / 2 - camX, u.y + u.h / 2 - camY, u.kind, u.label ?? "", this.time);
      }
      for (const e of this.enemies) {
        if (!e.alive || !vis(e.x, e.y, e.w, e.h)) continue;
        drawEnemy(ctx, e, camX, camY, this.time);
      }
      drawPlayer(ctx, this.player, camX, camY, this.time);
      for (const b of this.bullets) {
        if (!vis(b.x - 8, b.y - 8, 16, 16)) continue;
        drawShot(ctx, b, camX, camY);
      }
      for (const q of this.particles) {
        if (!vis(q.x, q.y, q.size, q.size)) continue;
        ctx.globalAlpha = q.life / q.max;
        ctx.fillStyle = q.color;
        ctx.fillRect(q.x - camX, q.y - camY, q.size, q.size);
        ctx.globalAlpha = 1;
      }
      drawWeatherFront(ctx, this.camX, this.camY, this.time, district);
      ctx.restore();
      if (!this.lite) drawGrade(ctx, district);
      if (this.mode === "play" || this.mode === "hub" || this.mode === "transform") {
        drawHudCanvas(ctx, this.player, this.nearHint, this.toast);
      }
      if (this.mode === "transform") {
        ctx.fillStyle = `rgba(94,224,192,${0.15 + this.transformT * 0.1})`;
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
        ctx.fillStyle = "#e8ece8";
        ctx.textAlign = "center";
        ctx.font = "600 42px 'Cormorant Garamond', serif";
        ctx.fillText("The stroke thickens.", VIEW_W / 2, VIEW_H / 2);
      }
    }
    if (this.showFps) this.drawFps(ctx);
    ctx.restore();
  }

  private drawStudioGrid(ctx: CanvasRenderingContext2D) {
    const x0 = Math.max(0, Math.floor(this.camX / TILE));
    const y0 = Math.max(0, Math.floor(this.camY / TILE));
    const x1 = Math.min((this.rows[0]?.length ?? 0) - 1, Math.ceil((this.camX + VIEW_W) / TILE));
    const y1 = Math.min(this.rows.length - 1, Math.ceil((this.camY + VIEW_H) / TILE));
    ctx.save();
    ctx.strokeStyle = "rgba(232,212,138,0.12)";
    ctx.lineWidth = 1;
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const x = tx * TILE - this.camX;
        const y = ty * TILE - this.camY;
        ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
      }
    }
    const hx = this.studioHover.tx;
    const hy = this.studioHover.ty;
    if (hx >= x0 && hx <= x1 && hy >= y0 && hy <= y1) {
      ctx.fillStyle = "rgba(94,224,192,0.22)";
      ctx.fillRect(hx * TILE - this.camX, hy * TILE - this.camY, TILE, TILE);
      ctx.fillStyle = "#9af8de";
      ctx.font = "700 18px 'Cormorant Garamond', serif";
      ctx.textAlign = "center";
      ctx.fillText(this.studioBrush, hx * TILE - this.camX + TILE / 2, hy * TILE - this.camY + 30);
    }
    ctx.restore();
  }

  private drawFps(ctx: CanvasRenderingContext2D) {
    const snap = this.snapshot();
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const dpr = Math.min(this.lite ? 1.25 : 1.75, window.devicePixelRatio || 1);
    ctx.scale(dpr, dpr);
    ctx.font = "600 11px ui-monospace, SFMono-Regular, Menlo, monospace";
    const line1 = `${snap.fps.toFixed(0)} fps  ${snap.frameMs.toFixed(1)}ms  draw ${snap.drawMs.toFixed(1)}ms`;
    const line2 = `${snap.stage}  solids ${snap.solids}  grid ${snap.grid}  mobs ${snap.enemies}  shot ${snap.bullets}`;
    const w = Math.max(ctx.measureText(line1).width, ctx.measureText(line2).width) + 16;
    const y = Math.max(8, (this.canvas.clientHeight || VIEW_H) - 44);
    ctx.fillStyle = "rgba(7,8,12,0.72)";
    ctx.fillRect(8, y, w, 36);
    ctx.fillStyle = snap.fps < 45 ? "#d45a4a" : snap.fps < 55 ? "#e8d48a" : "#9af8de";
    ctx.textAlign = "left";
    ctx.fillText(line1, 16, y + 14);
    ctx.fillStyle = "#c9b896";
    ctx.fillText(line2, 16, y + 28);
    ctx.restore();
  }

  private drawHubChrome(ctx: CanvasRenderingContext2D) {
    if (this.stage !== "hub") return;
    const wx = (tx: number) => tx * TILE - this.camX;
    const wy = (ty: number) => ty * TILE - this.camY;
    ctx.save();
    ctx.textAlign = "left";
    ctx.fillStyle = "#c9b896";
    ctx.font = "700 16px 'Cormorant Garamond', serif";
    ctx.fillText("CLOSED CHAPTERS", wx(16), wy(1) + 22);
    ctx.fillStyle = "#8a7a62";
    ctx.font = "600 10px 'Source Sans 3', sans-serif";
    ctx.fillText("five doors  ·  five ledgers  ·  they never change", wx(16), wy(1) + 38);

    ctx.fillStyle = "#e8d48a";
    ctx.font = "700 16px 'Cormorant Garamond', serif";
    ctx.fillText("THE UNBOUND SENTENCE", wx(68), wy(1) + 22);
    ctx.fillStyle = "#b08a4a";
    ctx.font = "600 10px 'Source Sans 3', sans-serif";
    ctx.fillText("the only door that keeps opening new ledgers", wx(68), wy(1) + 38);

    ctx.strokeStyle = "rgba(201,184,150,0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(wx(60) + 8, wy(1));
    ctx.lineTo(wx(62), wy(3));
    ctx.lineTo(wx(64) - 8, wy(1));
    ctx.stroke();
    ctx.fillStyle = "#c9b896";
    ctx.font = "600 9px 'Source Sans 3', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("WRITE →", wx(62), wy(2) + 8);

    const bound = this.pickups.find((u) => u.id === "continue");
    if (bound && this.save.progress >= 5) {
      const n = Math.min(STAGE_COUNT, this.save.progress + 1);
      ctx.textAlign = "center";
      for (let i = 0; i < 7; i++) {
        const pg = n + i;
        if (pg > STAGE_COUNT) break;
        ctx.globalAlpha = 0.55 - i * 0.07;
        ctx.fillStyle = "#e8d48a";
        ctx.font = `${11 + Math.max(0, 4 - i)}px 'Cormorant Garamond', serif`;
        ctx.fillText(String(pg), bound.x + bound.w / 2 - this.camX + 18 + i * 16, bound.y + 28 - this.camY + i * 3);
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  private drawConstruct(ctx: CanvasRenderingContext2D, w: Construct) {
    const x = w.x - this.camX;
    const y = w.y - this.camY;
    const a = Math.max(0.25, w.life / w.max);
    const hot = this.save.words.includes("BURN");
    ctx.save();
    ctx.globalAlpha = a;
    ctx.shadowColor = hot ? "#d45a4a" : "#5ee0c0";
    ctx.shadowBlur = 12;
    if (w.kind === "plat") {
      ctx.fillStyle = hot ? "#d45a4a" : "#5ee0c0";
      ctx.fillRect(x + 6, y, w.w - 12, 6);
      ctx.fillRect(x, y - 3, 8, 12);
      ctx.fillRect(x + w.w - 8, y - 3, 8, 12);
      ctx.globalAlpha = a * 0.35;
      ctx.fillRect(x + 8, y + 6, w.w - 16, 5);
    } else {
      ctx.fillStyle = hot ? "#d45a4a" : "#9af8de";
      ctx.fillRect(x + w.w / 2 - 4, y + 4, 8, w.h - 8);
      ctx.fillRect(x, y, w.w, 8);
      ctx.fillRect(x, y + w.h - 8, w.w, 8);
    }
    ctx.restore();
  }

  private drawGate(ctx: CanvasRenderingContext2D, u: Pickup) {
    const locked = u.kind === "portal" ? this.portalLocked() : this.doorLocked(u.id);
    const pulse = 0.18 + Math.sin(this.time * 3) * 0.08;
    const x = u.x - this.camX;
    const y = u.y - this.camY;
    if (u.kind === "portal") {
      const cx = x + u.w / 2;
      const cy = y + u.h * 0.55;
      ctx.save();
      ctx.strokeStyle = locked ? "#7a8b96" : "#5ee0c0";
      ctx.shadowColor = locked ? "transparent" : "#5ee0c0";
      ctx.shadowBlur = 16;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 22, 34, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = locked ? 0.15 : 0.22 + pulse;
      ctx.fillStyle = locked ? "#7a8b96" : "#5ee0c0";
      ctx.fill();
      ctx.globalAlpha = 1;
      if (!locked) {
        ctx.strokeStyle = "rgba(232,236,232,0.7)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(cx, cy, 10 + Math.sin(this.time * 4) * 3, this.time, this.time + 4);
        ctx.stroke();
      }
      ctx.fillStyle = "#e8ece8";
      ctx.font = "600 11px 'Source Sans 3', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(u.label ?? "GATE", cx, y - 6);
      ctx.restore();
      return;
    }
    ctx.fillStyle = locked ? "rgba(122,139,150,0.28)" : `rgba(94,224,192,${0.16 + pulse})`;
    if (u.id === "continue" && !locked) ctx.fillStyle = `rgba(232,212,138,${0.2 + pulse})`;
    if (u.id === "replay") ctx.fillStyle = locked ? "rgba(80,70,60,0.3)" : "rgba(140,120,90,0.22)";
    const chapter = /^stage[1-5]$/.test(u.id);
    if (u.id === "continue") {
      const cx = x + u.w / 2;
      const cy = y + u.h * 0.58;
      ctx.save();
      for (let i = 3; i >= 0; i--) {
        ctx.globalAlpha = locked ? 0.18 : 0.22 + pulse - i * 0.04;
        ctx.strokeStyle = locked ? "#7a8b96" : "#e8d48a";
        ctx.lineWidth = 2.4 - i * 0.3;
        ctx.beginPath();
        ctx.ellipse(cx + i * 10, cy, 28 - i * 5, 40 - i * 5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = locked ? 0.12 : 0.28 + pulse;
      ctx.fillStyle = locked ? "#7a8b96" : "#e8d48a";
      ctx.beginPath();
      ctx.ellipse(cx, cy, 18, 28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      if (!locked) {
        ctx.strokeStyle = "rgba(255,236,180,0.85)";
        ctx.lineWidth = 1.4;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(cx, cy, 8 + i * 7 + Math.sin(this.time * 3 + i) * 2, this.time, this.time + 2.4);
          ctx.stroke();
        }
      }
      ctx.restore();
    } else if (chapter) {
      ctx.fillStyle = locked ? "#2a2430" : "#3a3244";
      ctx.fillRect(x + 10, y + 18, u.w - 20, u.h - 18);
      ctx.fillStyle = locked ? "#5a4a40" : "#c9b896";
      ctx.fillRect(x + 10, y + 18, 8, u.h - 18);
      ctx.strokeStyle = locked ? "#7a8b96" : "#efe4c8";
      ctx.lineWidth = 1.6;
      ctx.strokeRect(x + 10, y + 18, u.w - 20, u.h - 18);
      ctx.fillStyle = locked ? "#7a8b96" : "#e8d48a";
      ctx.font = "700 16px 'Cormorant Garamond', serif";
      ctx.textAlign = "center";
      ctx.fillText(["I", "II", "III", "IV", "V"][Number(u.id.slice(5)) - 1] ?? "", x + u.w / 2 + 4, y + u.h * 0.62);
    } else {
      ctx.fillRect(x + 8, y + 16, u.w - 16, u.h - 16);
      ctx.strokeStyle = locked ? "#7a8b96" : "#8a7a62";
      ctx.lineWidth = 1.8;
      ctx.strokeRect(x + 8, y + 16, u.w - 16, u.h - 16);
      ctx.beginPath();
      ctx.moveTo(x + 14, y + 28);
      ctx.lineTo(x + u.w - 18, y + u.h - 8);
      ctx.stroke();
    }
    const plaque = this.doorPlaque(u.id);
    const title = plaque.title || u.label || "";
    ctx.fillStyle = u.id === "continue" ? "#e8d48a" : "#e8ece8";
    ctx.font = u.id === "continue" ? "700 13px 'Cormorant Garamond', serif" : "700 11px 'Source Sans 3', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(title, x + u.w / 2, y - (plaque.sub ? 22 : 10));
    if (plaque.sub) {
      ctx.fillStyle = u.id === "continue" ? "#e8d48a" : chapter ? "#c9b896" : "#8ec8d4";
      ctx.font = "600 9px 'Source Sans 3', sans-serif";
      ctx.fillText(plaque.sub, x + u.w / 2, y - 8);
    }
  }

  private drawTitleScene(ctx: CanvasRenderingContext2D) {
    const t = this.time;
    const w = VIEW_W;
    const h = VIEW_H;

    const gnd = ctx.createLinearGradient(0, h * 0.56, 0, h);
    gnd.addColorStop(0, "rgba(6,8,12,0)");
    gnd.addColorStop(0.22, "rgba(8,10,14,0.55)");
    gnd.addColorStop(1, "rgba(5,6,9,0.96)");
    ctx.fillStyle = gnd;
    ctx.fillRect(0, h * 0.54, w, h * 0.46);

    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = "#e8d48a";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.72);
    ctx.lineTo(w, h * 0.72);
    ctx.stroke();
    ctx.restore();

    const bolt = (Math.sin(t * 0.63) * Math.sin(t * 2.7) + Math.sin(t * 0.19)) * 0.5 + 0.5;
    if (bolt > 0.93) {
      ctx.fillStyle = `rgba(210,228,255,${(bolt - 0.93) * 3.2})`;
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.strokeStyle = "rgba(240,248,255,0.85)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      let lx = w * 0.62;
      let ly = 0;
      ctx.moveTo(lx, ly);
      for (let i = 0; i < 6; i++) {
        lx += (i % 2 ? -18 : 22) + Math.sin(t * 9 + i) * 8;
        ly += h * 0.08;
        ctx.lineTo(lx, ly);
      }
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = 0.55;
    const rainN = this.lite ? 18 : 42;
    ctx.strokeStyle = "rgba(180,200,214,0.45)";
    ctx.lineWidth = 1;
    for (let i = 0; i < rainN; i++) {
      const rx = ((i * 97 + t * 280) % (w + 40)) - 20;
      const ry = ((i * 53 + t * 420) % (h + 40)) - 20;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 4, ry + 16);
      ctx.stroke();
    }
    ctx.restore();

    const foe = (kind: Enemy["kind"], x: number, y: number, bw: number, bh: number, facing: 1 | -1): Enemy => ({
      kind,
      x,
      y,
      vx: facing * -12,
      vy: 0,
      w: bw,
      h: bh,
      hp: 1,
      maxHp: 1,
      facing,
      t: t * 0.6,
      hurt: 0,
      flash: 0,
      stun: 0,
      alive: true,
      grounded: true,
      phase: 0,
      aux: 0.35 + Math.sin(t * 2.2) * 0.12,
      aux2: 0,
      armor: 0,
      name: "",
    });

    ctx.save();
    ctx.globalAlpha = 0.55;
    drawEnemy(ctx, foe("zero", w * 0.7, h * 0.18, 90, 90, -1), 0, 0, t);
    ctx.restore();
    drawEnemy(ctx, foe("four", w * 0.5, h * 0.3, 170, 210, -1), 0, 0, t);

    const cx = w * 0.26;
    const cy = h * 0.58 + Math.sin(t * 1.6) * 4;
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "#5ee0c0";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 54, 64, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    for (let i = 3; i >= 1; i--) {
      ctx.save();
      ctx.globalAlpha = 0.1 * i;
      ctx.translate(cx - i * 14, cy);
      ctx.scale(2.8, 2.8);
      drawLetterForm(ctx, "c", true, 0, 0, 1, t - i * 0.08, 1, 0, 0, 0);
      ctx.restore();
    }
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(2.9, 2.9);
    drawLetterForm(ctx, "c", true, 0, 0, 1, t, 1, 0.08 + Math.sin(t * 3) * 0.04, 0, 0);
    ctx.restore();

    const top = ctx.createLinearGradient(0, 0, 0, h * 0.42);
    top.addColorStop(0, "rgba(7,8,12,0.92)");
    top.addColorStop(0.55, "rgba(7,8,12,0.55)");
    top.addColorStop(1, "rgba(7,8,12,0)");
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, w, h * 0.42);

    const bot = ctx.createLinearGradient(0, h * 0.5, 0, h);
    bot.addColorStop(0, "rgba(7,8,12,0)");
    bot.addColorStop(0.45, "rgba(7,8,12,0.55)");
    bot.addColorStop(1, "rgba(7,8,12,0.94)");
    ctx.fillStyle = bot;
    ctx.fillRect(0, h * 0.5, w, h * 0.5);
  }
}
