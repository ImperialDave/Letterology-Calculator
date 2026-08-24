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
} from "./draw";
import { AudioBus } from "./audio";
import { Input } from "./input";
import { LEVELS, type LevelId } from "./levels";
import { collectedLore, LORE, loreIdFromGlyph } from "./lore";
import { clearSave, defaultSave, loadSave, writeSave } from "./save";
import {
  STEP,
  TILE,
  VIEW_H,
  VIEW_W,
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
  type SaveData,
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
  if (letter === "s") return { w: 26, h: 34 };
  if (letter === "b") return { w: 36, h: 48 };
  if (capital) return { w: 40, h: 52 };
  return { w: 28, h: 36 };
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
  worldW = 1000;
  worldH = 600;
  ui: (s: UiSnap) => void;
  titleC = 0;
  hard = false;
  wordMenu = false;
  returnT = 0;
  intBuf = 0;
  nearHint = "";
  lastDone = new Set<string>();
  lastCheck = "";

  constructor(canvas: HTMLCanvasElement, ui: (s: UiSnap) => void) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    this.ctx = ctx;
    this.ui = ui;
    this.hard = this.save.hard;
    this.player = this.makePlayer();
  }

  start() {
    this.running = true;
    this.last = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      let dt = (now - this.last) / 1000;
      this.last = now;
      if (dt > 0.1) dt = 0.1;
      this.acc += dt;
      this.time += dt;
      if (this.hitstop > 0) this.hitstop -= dt;
      while (this.acc >= STEP) {
        this.acc -= STEP;
        if (this.hitstop <= 0) this.step(STEP);
      }
      this.audio.tickMusic(dt);
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
    this.emit();
    this.exposeQa();
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.input.detach();
  }

  private syncVitals() {
    const p = this.player;
    p.maxShield = this.save.maxShield + (p.letter === "c" && p.capital ? 1 : 0);
    if (p.shield > p.maxShield) p.shield = p.maxShield;
    p.shotLevel = this.save.shotLevel;
    p.maxInk = 40 + this.save.words.length * 8;
  }

  private makePlayer(): Player {
    const cap = this.save.capital && this.save.hasCapital;
    const sz = bodySize("c", cap);
    const maxShield = this.save.maxShield + (cap ? 1 : 0);
    return {
      x: 80,
      y: 80,
      vx: 0,
      vy: 0,
      w: sz.w,
      h: sz.h,
      letter: "c",
      capital: cap,
      facing: 1,
      hp: this.save.hp || 6,
      maxHp: cap || this.save.relics.includes("spine") ? 8 : 6,
      ink: this.save.ink > 0 ? this.save.ink : 18,
      maxInk: 40 + this.save.words.length * 8,
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
      shield: maxShield,
      maxShield,
      shieldCd: 3,
      shieldFlash: 0,
      shotLevel: this.save.shotLevel || 1,
      shotCd: 0,
    };
  }

  private applySize() {
    const p = this.player;
    const sz = bodySize(p.letter, p.letter === "c" && p.capital);
    const feet = p.y + p.h;
    const mid = p.x + p.w / 2;
    p.w = sz.w;
    p.h = sz.h;
    p.y = feet - p.h;
    p.x = mid - p.w / 2;
    this.syncVitals();
  }

  loadLevel(id: LevelId, atCheck = false) {
    const meta = LEVELS[id];
    this.stage = id;
    this.rows = meta.rows;
    this.objective = meta.objective;
    this.solids = [];
    this.enemies = [];
    this.bullets = [];
    this.pickups = [];
    this.npcs = [];
    this.markers = [];
    this.walls = [];
    this.burns = [];
    this.broken = new Set();
    this.worldW = this.rows[0].length * TILE;
    this.worldH = this.rows.length * TILE;
    let spawnX = 80;
    let spawnY = 80;
    for (let ty = 0; ty < this.rows.length; ty++) {
      for (let tx = 0; tx < this.rows[ty].length; tx++) {
        const ch = this.rows[ty][tx];
        const x = tx * TILE;
        const y = ty * TILE;
        if (ch === "#") this.solids.push({ x, y, w: TILE, h: TILE, type: "solid" });
        else if (ch === "=") this.solids.push({ x, y, w: TILE, h: 10, type: "oneway" });
        else if (ch === "v") this.solids.push({ x, y, w: TILE, h: TILE, type: "vent" });
        else if (ch === "*") this.solids.push({ x, y, w: TILE, h: TILE, type: "break" });
        else if (ch === "^") this.solids.push({ x, y: y + 18, w: TILE, h: 22, type: "spike" });
        else if (ch === "~") this.solids.push({ x, y: y + 18, w: TILE, h: 30, type: "sluice" });
        else if (ch === "-") this.solids.push({ x, y, w: TILE, h: 10, type: "crumble", phase: 0 });
        else if (ch === "@") {
          spawnX = x;
          spawnY = y;
        } else if (ch === ">" || ch === "<" || ch === "V") {
          this.markers.push({
            x,
            y,
            dir: ch === "<" ? -1 : 1,
            kind: ch === "V" ? "down" : "arrow",
          });
        } else if (
          ch === "1" ||
          ch === "0" ||
          ch === "2" ||
          ch === "3" ||
          ch === "4" ||
          ch === "5" ||
          ch === "6" ||
          ch === "7" ||
          ch === "8" ||
          ch === "!"
        ) {
          const map: Record<string, EnemyKind> = {
            "1": "one",
            "0": "zero",
            "2": "two",
            "3": "three",
            "4": "four",
            "5": "five",
            "6": "six",
            "7": "seven",
            "8": "eight",
            "!": id === "stage2" ? "importer" : "dualis",
          };
          this.enemies.push(this.spawnEnemy(map[ch], x, y));
        } else if (ch === "e" || ch === "t" || ch === "r" || ch === "k" || ch === "n" || ch === "m" || ch === "a" || ch === "y" || ch === "q" || ch === "u" || ch === "g" || ch === "p") {
          if (this.save.talked.includes(ch)) continue;
          const def = LORE[ch];
          this.npcs.push({
            id: ch,
            glyph: def.glyph,
            name: def.name,
            x: x + 4,
            y: y - 16,
            w: 36,
            h: 48,
            lines: def.lines,
          });
        } else if (ch === "s" || ch === "b") {
          if (!this.save.party.includes(ch)) {
            const def = LORE[ch];
            this.npcs.push({
              id: "recruit-" + ch,
              glyph: def.glyph,
              name: def.name,
              x: x + 4,
              y: y - 8,
              w: 28,
              h: 36,
              lines: def.lines,
            });
            this.pickups.push({
              kind: "recruit",
              id: ch,
              x: x + 6,
              y: y,
              w: 24,
              h: 28,
              taken: false,
              label: ch,
            });
          }
        } else if (ch === "i") {
          this.pickups.push({ kind: "ink", id: "i" + tx + ty, x: x + 12, y: y + 12, w: 16, h: 16, taken: false });
        } else if (ch === "h") {
          this.pickups.push({ kind: "heart", id: "h" + tx + ty, x: x + 12, y: y + 10, w: 16, h: 16, taken: false });
        } else if (ch === "+") {
          const pid = "fang-" + id + "-" + tx + "-" + ty;
          this.pickups.push({
            kind: "fang",
            id: pid,
            x: x + 8,
            y: y + 8,
            w: 28,
            h: 28,
            taken: this.save.powerups.includes(pid) || this.save.shotLevel >= 4,
            label: "FANG",
          });
        } else if (ch === "o") {
          const pid = "scale-" + id + "-" + tx + "-" + ty;
          this.pickups.push({
            kind: "scale",
            id: pid,
            x: x + 8,
            y: y + 8,
            w: 28,
            h: 28,
            taken: this.save.powerups.includes(pid) || this.save.maxShield >= 5,
            label: "SCALE",
          });
        } else if (ch === "W") {
          this.pickups.push({
            kind: "word",
            id: "WALL",
            x: x + 4,
            y: y + 8,
            w: 28,
            h: 20,
            taken: this.save.words.includes("WALL"),
            label: "WALL",
          });
        } else if (ch === "R") {
          this.pickups.push({
            kind: "word",
            id: "BURN",
            x: x + 4,
            y: y + 8,
            w: 28,
            h: 20,
            taken: this.save.words.includes("BURN"),
            label: "BURN",
          });
        } else if (ch === "X") {
          this.pickups.push({
            kind: "word",
            id: "RISE",
            x: x + 4,
            y: y + 8,
            w: 28,
            h: 20,
            taken: this.save.words.includes("RISE"),
            label: "RISE",
          });
        } else if (ch === "Z") {
          this.pickups.push({
            kind: "word",
            id: "LOCK",
            x: x + 4,
            y: y + 8,
            w: 28,
            h: 20,
            taken: this.save.words.includes("LOCK"),
            label: "LOCK",
          });
        } else if (ch === "D") {
          this.pickups.push({
            kind: "drop",
            id: "dropCap",
            x: x + 4,
            y: y,
            w: 32,
            h: 36,
            taken: this.save.hasCapital,
            label: "DROP CAP",
          });
        } else if (ch === "F") {
          this.pickups.push({ kind: "case", id: "font" + tx, x: x, y: y, w: TILE, h: TILE, taken: false, label: "CASE" });
        } else if (ch === "[") {
          this.pickups.push({ kind: "door", id: "stage1", x: x - 16, y: y - 40, w: 72, h: 96, taken: false, label: "EXCH." });
        } else if (ch === "]") {
          this.pickups.push({ kind: "door", id: "stage2", x: x - 16, y: y - 40, w: 72, h: 96, taken: false, label: "FORT" });
        } else if (ch === "{") {
          this.pickups.push({ kind: "door", id: "stage3", x: x - 16, y: y - 40, w: 72, h: 96, taken: false, label: "PRESS" });
        } else if (ch === "}") {
          this.pickups.push({ kind: "door", id: "stage4", x: x - 16, y: y - 40, w: 72, h: 96, taken: false, label: "COIL" });
        } else if (ch === "%") {
          this.pickups.push({
            kind: "check",
            id: "ck-" + id + "-" + tx + "-" + ty,
            x: x + 6,
            y: y - 8,
            w: 36,
            h: 44,
            taken: false,
            label: "CHECK",
          });
        } else if (ch === "P") {
          this.pickups.push({
            kind: "portal",
            id: LEVELS[id]?.exit === "win" ? "win" : "hub",
            x: x - 6,
            y: y - 40,
            w: 60,
            h: 88,
            taken: false,
            label: id === "stage2" ? "CHAPTER" : id === "stage3" ? "PRESS" : id === "stage4" ? "COIL" : "STACKS",
          });
        } else if (ch === "$") {
          const pid = "secret-" + id + "-" + tx + "-" + ty;
          const labels = ["MARGIN", "SERIF", "INKWELL", "COLD TYPE"] as const;
          const label = labels[(tx + ty) % labels.length];
          this.pickups.push({
            kind: "secret",
            id: pid,
            x: x + 10,
            y: y + 8,
            w: 28,
            h: 28,
            taken: this.save.powerups.includes(pid),
            label,
          });
        }
      }
    }
    this.spawnX = spawnX;
    this.spawnY = spawnY - 8;
    this.checkX = this.save.stage === id && this.save.checkX ? this.save.checkX : this.spawnX;
    this.checkY = this.save.stage === id && this.save.checkY ? this.save.checkY : this.spawnY;
    const p = this.player;
    p.x = atCheck ? this.checkX : this.spawnX;
    p.y = atCheck ? this.checkY : this.spawnY;
    p.vx = 0;
    p.vy = 0;
    p.invuln = 0.6;
    this.applySize();
    this.camX = p.x - VIEW_W * 0.35;
    this.camY = p.y - VIEW_H * 0.6;
    this.mode = id === "hub" ? "hub" : "play";
    this.save.stage = id;
    if (!this.save.visited.includes(id)) this.save.visited.push(id);
    this.lastDone = new Set(this.currentTasks().filter((t) => t.done).map((t) => t.id));
    if (id === "hub") this.say("L builds a wall. Hold down + L for a shelf.");
    this.persist();
    this.emit();
  }

  private spawnEnemy(kind: EnemyKind, x: number, y: number): Enemy {
    const sizes: Record<EnemyKind, { w: number; h: number; hp: number; name: string }> = {
      one: { w: 26, h: 44, hp: 3, name: "1" },
      dummy: { w: 26, h: 44, hp: 99, name: "Dummy" },
      zero: { w: 36, h: 36, hp: 4, name: "0" },
      two: { w: 38, h: 42, hp: 5, name: "2" },
      three: { w: 30, h: 40, hp: 4, name: "3" },
      four: { w: 40, h: 48, hp: 6, name: "4" },
      five: { w: 36, h: 44, hp: 6, name: "5" },
      six: { w: 34, h: 46, hp: 5, name: "6" },
      seven: { w: 28, h: 42, hp: 5, name: "7" },
      eight: { w: 38, h: 50, hp: 8, name: "8" },
      dualis: { w: 64, h: 72, hp: 28, name: "Dualis" },
      tetrarch: { w: 78, h: 88, hp: 40, name: "Tetrarch" },
      importer: { w: 72, h: 84, hp: 44, name: "G" },
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
      armor: kind === "eight" || kind === "importer" ? 1 : 0,
      name: s.name,
    };
  }

  begin() {
    this.audio.unlock();
    this.audio.sfxUi();
    if (this.save.stage1 || this.save.hasCapital) {
      this.loadLevel("hub");
    } else {
      this.mode = "intro";
      this.introPage = 0;
    }
    this.emit();
  }

  continueGame() {
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
    this.emit();
  }

  private persist() {
    const p = this.player;
    this.save.hp = p.hp;
    this.save.ink = p.ink;
    this.save.capital = p.capital;
    this.save.checkX = this.checkX;
    this.save.checkY = this.checkY;
    this.save.muted = this.audio.muted;
    this.save.hard = this.hard;
    this.save.shotLevel = p.shotLevel;
    writeSave(this.save);
  }

  step(dt: number) {
    const a = this.input.poll();
    if (this.mode === "title") {
      this.titleC += dt;
      return;
    }
    if (this.mode === "intro") {
      if (a.attack || a.jump || a.interact) {
        this.introPage += 1;
        this.audio.sfxUi();
        if (this.introPage > 2) this.loadLevel("hub");
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
      w.life -= dt;
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
          if (e.alive && aabb(e, w) && e.stun < 0.35) e.stun = 1.45;
        }
      }
    }
    if (this.wordCd > 0) this.wordCd -= dt;
    if (this.swapCd > 0) this.swapCd -= dt;
    this.followCam(dt);
    this.trauma = Math.max(0, this.trauma - dt * 1.8);
    if (this.player.y > this.worldH + 40) this.hurt(2, 0);
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
    const large = p.letter === "b" || (p.letter === "c" && p.capital);
    const spd = p.letter === "s" ? 240 : p.letter === "b" ? 158 : p.capital ? 200 : 218;
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
    if (!a.jumpHeld && !p.jumpCut && p.vy < 0) {
      p.vy *= 0.52;
      p.jumpCut = true;
    }
    p.vy += (p.vy < 0 ? gUp : gDown) * dt;
    if (p.vy > 860) p.vy = 860;
    if (p.grounded) p.coyote = 0.1;
    else p.coyote -= dt;
    if (a.jump) p.jumpBuf = 0.12;
    else p.jumpBuf -= dt;
    if (p.jumpBuf > 0 && p.coyote > 0) {
      p.vy = p.letter === "b" ? -455 : -522;
      p.grounded = false;
      p.coyote = 0;
      p.jumpBuf = 0;
      p.jumpCut = false;
      p.squash = 0.74;
      this.audio.sfxJump();
    }
    if (p.roll > 0) {
      p.roll -= dt;
      p.vx = p.facing * (p.capital ? 250 : 270);
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
    p.ink = Math.min(p.maxInk, p.ink + 5.5 * dt);
    p.anim += dt * (Math.abs(p.vx) > 20 ? 8 : 3);
    p.squash += (1 - p.squash) * Math.min(1, dt * 12);
    const wasGround = p.grounded;
    const fall = p.vy;
    this.moveActor(p, dt, large, a.down);
    if (p.grounded && !wasGround) {
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
    for (const s of this.solids) {
      if (s.type === "crumble" && !s.broken && p.grounded && aabb({ x: p.x, y: p.y + p.h - 6, w: p.w, h: 8 }, s)) {
        s.phase = (s.phase ?? 0) + dt;
        if (s.phase > 0.38) {
          s.broken = true;
          this.burst(s.x + 24, s.y, "#8a7048", 8, "dust");
        }
      }
    }
    if (a.swap && this.swapCd <= 0) this.swapTo(a.swap);
    if (a.caseShift) this.tryCase();
    if (a.interact) this.intBuf = 0.22;
    this.intBuf -= dt;
    if (this.intBuf > 0 && this.tryInteract()) this.intBuf = 0;
    if (a.word) this.scribe(a.down);
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
    if (this.worldH > 0 && a.y + a.h > this.worldH) {
      a.y = this.worldH - a.h;
      a.vy = 0;
      a.grounded = true;
    }
  }

  private solidsNow(large: boolean): Solid[] {
    const extra: Solid[] = this.walls.map((w) => ({
      x: w.x,
      y: w.y,
      w: w.w,
      h: w.h,
      type: (w.kind === "plat" ? "oneway" : "solid") as Solid["type"],
    }));
    return [...this.solids, ...extra].filter((s) => {
      if (s.type === "break" && s.broken) return false;
      if (s.type === "crumble" && s.broken) return false;
      if (s.type === "sluice") return false;
      if (s.type === "vent" && !large) return false;
      return true;
    });
  }

  private sepAxis(
    a: { x: number; y: number; w: number; h: number; vx: number; vy: number; grounded?: boolean },
    axis: "x" | "y",
    large: boolean,
    drop = false,
  ) {
    for (const s of this.solidsNow(large)) {
      if (s.type === "spike") continue;
      if (!aabb(a, s)) continue;
      if (s.type === "oneway" || s.type === "crumble") {
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
        if (a.vy < 0 && fromBot < fromTop) {
          a.y = s.y + s.h;
          a.vy = 0;
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
    for (const s of this.solidsNow(large)) {
      if (s.type === "spike" || s.type === "oneway") continue;
      if (aabb(box, s)) return true;
    }
    return false;
  }

  private fireShot() {
    const p = this.player;
    const lv = Math.max(1, Math.min(4, p.shotLevel));
    const dmg = lv >= 4 ? 3 : lv >= 2 ? 2 : 1;
    const spd = 270 + lv * 45;
    const r = 4 + lv * 0.8;
    const kind = lv >= 4 ? "solar" : lv >= 3 ? "venom" : lv >= 2 ? "fang" : "crescent";
    const pierce = lv >= 4 ? 2 : lv >= 3 ? 1 : 0;
    const n = lv >= 4 ? 3 : lv >= 3 ? 2 : 1;
    const spreads = n === 1 ? [0] : n === 2 ? [-0.16, 0.16] : [-0.28, 0, 0.28];
    const mouthX = p.x + p.w / 2 + p.facing * (p.w * 0.55);
    const mouthY = p.y + p.h * 0.4;
    for (const spr of spreads) {
      this.bullets.push({
        x: mouthX,
        y: mouthY,
        vx: p.facing * spd,
        vy: spr * spd,
        r,
        from: "player",
        dmg,
        life: 0.85 + lv * 0.08,
        kind,
        alive: true,
        pierce,
      });
    }
    this.audio.sfxShot();
    this.burst(mouthX, mouthY, lv >= 4 ? "#e8d48a" : "#5ee0c0", 4, "spark");
  }

  private updateCombat(dt: number, a: ReturnType<Input["poll"]>) {
    const p = this.player;
    const cd = p.letter === "b" ? 0.42 : 0.34 - Math.min(3, p.shotLevel - 1) * 0.04;
    if ((a.attack || a.attackHeld) && p.shotCd <= 0 && p.roll <= 0) {
      p.attack = 0.16;
      p.shotCd = cd;
      this.fireShot();
    }
    if (a.special && p.specialCd <= 0 && p.roll <= 0) {
      if (p.letter === "c" && !p.capital) {
        p.roll = 0.28;
        p.invuln = Math.max(p.invuln, 0.28);
        p.specialCd = 0.7;
        this.audio.sfxJump();
      } else if (p.letter === "c" && p.capital) {
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
      } else if (p.letter === "s") {
        this.bullets.push({
          x: p.x + p.w / 2,
          y: p.y + 8,
          vx: p.facing * 320,
          vy: 0,
          r: 7,
          from: "player",
          dmg: 2,
          life: 0.9,
          kind: "wind",
          alive: true,
          pierce: 1,
        });
        p.specialCd = 0.9;
        this.audio.sfxSlash();
      } else if (p.letter === "b") {
        this.walls.push({ x: p.x - 8, y: p.y + 4, w: p.w + 16, h: p.h - 4, life: 1.8, max: 1.8, kind: "wall" });
        p.specialCd = 1.6;
        this.audio.sfxLand();
      }
    }
    for (const s of this.solids) {
      if (s.type === "spike" && aabb(p, s) && p.invuln <= 0) this.hurt(1, p.x + p.w / 2 < s.x + s.w / 2 ? -1 : 1);
      if (s.type === "sluice" && aabb(p, s) && p.invuln <= 0) {
        this.hurt(1, p.facing);
        p.vy = Math.min(p.vy, -220);
      }
    }
  }

  private hitEnemy(e: Enemy, dmg: number, dir: number) {
    if (e.hurt > 0 && e.kind !== "dualis" && e.kind !== "tetrarch" && e.kind !== "importer") return;
    e.hp -= dmg;
    e.hurt = 0.1;
    const boss = e.kind === "dualis" || e.kind === "tetrarch" || e.kind === "importer";
    if (boss) {
      if (e.stun <= 0) e.stun = 0.3;
    } else {
      e.stun = 0.95;
    }
    e.flash = Math.max(e.flash, 0.18);
    e.vx += dir * (boss ? 50 : 160);
    e.vy = boss ? e.vy : -36;
    e.aux = 0;
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
      if (e.kind === "dualis") {
        this.save.stage1 = true;
        this.say("Dualis is down. The STACKS gate is open.");
        this.objective = "Enter the exit gate.";
        this.persist();
      }
      if (e.kind === "tetrarch" || e.kind === "importer") {
        this.save.stage2 = true;
        this.say(e.kind === "importer" ? "G is down. The last gate is open." : "Tetrarch is down. The last gate is open.");
        this.objective = "Enter the CHAPTER gate.";
        this.persist();
      }
    }
  }

  private hurt(n: number, dir: number) {
    const p = this.player;
    if (p.invuln > 0) return;
    if (p.shield > 0) {
      p.shield -= 1;
      p.shieldFlash = 0.4;
      p.invuln = 0.85;
      p.vx = dir * 40;
      p.shieldCd = 1.1;
      this.audio.sfxBlock();
      this.trauma = Math.min(1, this.trauma + 0.12);
      this.burst(p.x + p.w / 2, p.y + p.h / 2, "#8ec8d4", 10, "spark");
      return;
    }
    p.hp -= this.hard ? n : n;
    p.invuln = 1.05;
    p.hurtFlash = 0.4;
    p.vx = dir * 160;
    p.vy = -140;
    p.shieldCd = 1.8;
    this.audio.sfxHurt();
    this.trauma = Math.min(1, this.trauma + 0.45);
    if (p.hp <= 0) {
      p.hp = 0;
      this.mode = "dead";
      this.audio.sfxDeath();
      this.emit();
    }
  }

  private updateEnemies(dt: number) {
    const p = this.player;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.t += dt;
      e.hurt = Math.max(0, e.hurt - dt);
      e.flash = Math.max(0, e.flash - dt);
      e.stun = Math.max(0, e.stun - dt);
      if (e.stun > 0) {
        e.vx *= Math.max(0, 1 - 8 * dt);
        if (!e.grounded) e.vy += 1800 * dt;
        this.moveActor(e, dt, e.kind === "tetrarch" || e.kind === "importer");
        continue;
      }
      e.aux += dt;
      const large = false;
      if (e.kind === "zero") {
        e.y += Math.sin(e.t * 2) * 18 * dt;
        e.x += Math.sin(e.t * 0.6) * 30 * dt;
        e.facing = p.x > e.x ? 1 : -1;
        if (e.aux > 1.6) {
          e.aux = 0;
          this.shoot(e, p.x < e.x ? -1 : 1, 0.15);
        }
      } else if (e.kind === "one" || e.kind === "two" || e.kind === "four" || e.kind === "three") {
        if (!e.grounded) e.vy += 1800 * dt;
        if (Math.abs(p.x - e.x) < 280) {
          e.facing = p.x > e.x ? 1 : -1;
          e.vx = e.facing * (e.kind === "four" ? 40 : e.kind === "three" ? 55 : 70);
        } else {
          e.vx = e.facing * 40;
          if (Math.random() < 0.005) e.facing *= -1;
        }
        this.moveActor(e, dt, large);
        if (e.kind === "three" && e.grounded && e.aux > 0.9 && Math.abs(p.x - e.x) < 220) {
          e.vy = -420;
          e.aux = 0;
        }
        if (e.aux > (e.kind === "four" ? 1.8 : 1.3)) {
          e.aux = 0;
          if (e.kind === "four") {
            this.trauma += 0.08;
            if (aabb({ x: e.x - 10, y: e.y, w: e.w + 20, h: e.h + 8 }, p) && p.invuln <= 0) this.hurt(1, e.facing);
          } else if (e.kind !== "three") this.shoot(e, e.facing, 0);
        }
      } else if (e.kind === "five") {
        if (!e.grounded) e.vy += 1800 * dt;
        e.facing = p.x > e.x ? 1 : -1;
        e.vx = e.facing * 28;
        this.moveActor(e, dt, false);
        if (e.aux > 1.7) {
          e.aux = 0;
          const dirs = [
            [1, 0],
            [-1, 0],
            [0.7, -0.7],
            [-0.7, -0.7],
            [0, -1],
          ] as const;
          for (const [dx, dy] of dirs) {
            this.bullets.push({
              x: e.x + e.w / 2,
              y: e.y + e.h * 0.35,
              vx: dx * 200,
              vy: dy * 200,
              r: 5,
              from: "enemy",
              dmg: 1,
              life: 2.2,
              kind: "star",
              alive: true,
              pierce: 0,
            });
          }
        }
      } else if (e.kind === "seven") {
        if (!e.grounded) e.vy += 1800 * dt;
        e.facing = p.x > e.x ? 1 : -1;
        if (e.aux > 1.1 && Math.abs(p.x - e.x) < 260 && Math.abs(p.y - e.y) < 80) {
          e.vx = e.facing * 220;
          e.vy = -80;
          e.aux = 0;
        } else {
          e.vx = e.facing * 55;
        }
        this.moveActor(e, dt, false);
        if (e.aux2 > 1.4) {
          e.aux2 = 0;
          this.shoot(e, e.facing, -0.1);
        }
        e.aux2 += dt;
      } else if (e.kind === "six") {
        if (Math.abs(p.x - e.x) < 48 && p.y > e.y) {
          if (!e.grounded) e.vy += 2200 * dt;
          this.moveActor(e, dt, false);
        } else {
          e.y += Math.sin(e.t * 2.2) * 22 * dt;
          e.x += Math.sin(e.t * 0.8) * 24 * dt;
          e.vy = 0;
        }
        e.facing = p.x > e.x ? 1 : -1;
        if (e.aux > 1.5) {
          e.aux = 0;
          this.shoot(e, 0, 1);
        }
      } else if (e.kind === "eight") {
        e.x += Math.sin(e.t * 1.4) * 70 * dt;
        e.y += Math.cos(e.t * 2.8) * 40 * dt;
        e.facing = p.x > e.x ? 1 : -1;
        e.aux2 += dt;
        if (e.aux2 > 3 && e.hp < e.maxHp) {
          e.hp = Math.min(e.maxHp, e.hp + 1);
          e.aux2 = 0;
        }
        if (e.aux > 1.4) {
          e.aux = 0;
          this.shoot(e, e.facing, 0.2);
        }
      } else if (e.kind === "dualis") {
        if (!e.grounded) e.vy += 1600 * dt;
        e.facing = p.x > e.x ? 1 : -1;
        e.vx = e.facing * 90;
        if (e.phase === 0 && e.hp < e.maxHp * 0.6) {
          e.phase = 1;
          this.enemies.push(this.spawnEnemy("two", e.x - 50, e.y));
          this.say("Dualis splits into two.");
        }
        this.moveActor(e, dt, false);
        if (e.aux > 0.9) {
          e.aux = 0;
          this.shoot(e, e.facing, 0.1);
          this.shoot(e, e.facing, -0.2);
        }
        if (e.grounded && Math.random() < 0.01) e.vy = -360;
      } else if (e.kind === "tetrarch") {
        if (!e.grounded) e.vy += 1800 * dt;
        e.vx *= 0.9;
        this.moveActor(e, dt, true);
        if (e.aux > 1.1) {
          e.aux = 0;
          e.phase = (e.phase + 1) % 4;
          if (e.phase === 0) {
            this.shoot(e, -1, 0);
            this.shoot(e, 1, 0);
            this.shoot(e, 0, -1);
          } else if (e.phase === 1) {
            e.vy = -280;
          } else if (e.phase === 2 && e.hp < e.maxHp * 0.55 && !this.enemies.some((x) => x.kind === "four" && x.alive && x !== e)) {
            this.enemies.push(this.spawnEnemy("four", e.x - 80, e.y));
            this.enemies.push(this.spawnEnemy("four", e.x + 80, e.y));
          } else {
            this.shoot(e, p.x < e.x ? -1 : 1, 0);
          }
        }
      } else if (e.kind === "importer") {
        if (!e.grounded) e.vy += 1700 * dt;
        e.facing = p.x > e.x ? 1 : -1;
        e.vx = e.facing * 50;
        this.moveActor(e, dt, true);
        if (e.aux > 1.0) {
          e.aux = 0;
          e.phase = (e.phase + 1) % 5;
          if (e.phase === 0) {
            this.shoot(e, e.facing, 0);
            this.shoot(e, e.facing, -0.25);
            this.shoot(e, e.facing, 0.25);
          } else if (e.phase === 1) {
            e.vy = -320;
          } else if (e.phase === 2) {
            this.enemies.push(this.spawnEnemy("one", e.x - 40, e.y));
            this.enemies.push(this.spawnEnemy("five", e.x + 40, e.y));
            this.say("G opens a port.");
          } else if (e.phase === 3) {
            this.shoot(e, -1, 0);
            this.shoot(e, 1, 0);
            this.shoot(e, 0, -1);
          } else {
            e.vx = e.facing * 160;
          }
        }
      }
      if (aabb(e, p) && p.invuln <= 0 && p.roll <= 0) this.hurt(1, p.x < e.x ? -1 : 1);
    }
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

  private updateBullets(dt: number) {
    const p = this.player;
    for (const b of this.bullets) {
      if (!b.alive) continue;
      b.life -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.kind === "wind") b.vx *= 0.999;
      if (b.life <= 0) b.alive = false;
      const box = { x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2 };
      if (b.from === "enemy") {
        if (aabb(box, p) && p.invuln <= 0 && p.roll <= 0) {
          b.alive = false;
          this.hurt(b.dmg, b.vx > 0 ? 1 : -1);
        }
        const large = p.letter === "b" || p.capital;
        for (const s of this.solidsNow(large)) {
          if (s.type !== "spike" && aabb(box, s)) b.alive = false;
        }
      } else {
        for (const e of this.enemies) {
          if (e.alive && aabb(box, e)) {
            this.hitEnemy(e, b.dmg, b.vx > 0 ? 1 : -1);
            if (b.pierce > 0) b.pierce -= 1;
            else b.alive = false;
          }
        }
        for (const s of this.solids) {
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
    for (const br of this.burns) {
      for (const e of this.enemies) {
        if (e.alive && aabb(e, br) && e.hurt <= 0) this.hitEnemy(e, 1, this.player.facing);
      }
    }
  }

  private portalLocked() {
    if (this.stage === "stage1") return this.enemies.some((e) => e.kind === "dualis" && e.alive);
    if (this.stage === "stage2")
      return this.enemies.some((e) => (e.kind === "tetrarch" || e.kind === "importer") && e.alive);
    return false;
  }

  private scribe(down: boolean) {
    if (this.wordCd > 0) return;
    const p = this.player;
    const thick = this.save.words.includes("WALL") || (p.letter === "c" && p.capital);
    const cost = 6;
    if (p.ink < cost) {
      this.say("Out of ink.");
      return;
    }
    p.ink -= cost;
    this.wordCd = 0.38;
    this.audio.sfxWord();
    const life = thick ? 7.2 : 5.2;
    const maxN = thick ? 4 : 3;
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
    while (this.walls.length > maxN) this.walls.shift();
    this.burst(c.x + c.w / 2, c.y + c.h / 2, "#5ee0c0", 8, "glyph");
  }

  private enterPortal(u: Pickup) {
    if (this.portalLocked()) {
      this.say("The gate is still locked. Finish the fight first.");
      return;
    }
    this.audio.sfxTransform();
    if (this.stage === "stage3") this.save.stage3 = true;
    if (this.stage === "stage4") this.save.stage4 = true;
    if (u.id === "win" || this.stage === "stage2") {
      this.save.stage2 = true;
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
        this.nearHint = this.save.stage1 ? "Drop to the STACKS gate" : "Drop down — Dualis is below";
      }
    }
    for (const u of this.pickups) {
      if (u.kind === "door" && aabb(p, padBox(u, 28, 16))) {
        const locked =
          (u.id === "stage2" && !this.save.stage4 && !this.save.stage2) ||
          (u.id === "stage3" && !this.save.stage1) ||
          (u.id === "stage4" && !this.save.stage3);
        this.nearHint = locked
          ? u.id === "stage3"
            ? "Press still counted shut"
            : u.id === "stage4"
              ? "Coils still counted shut"
              : "Still counted shut"
          : "E  enter  " + (u.label ?? "");
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
        this.say("Health restored.");
      } else if (u.kind === "fang") {
        u.taken = true;
        if (!this.save.powerups.includes(u.id)) this.save.powerups.push(u.id);
        p.shotLevel = Math.min(4, p.shotLevel + 1);
        this.save.shotLevel = p.shotLevel;
        this.audio.sfxWord();
        this.say("Shot level " + p.shotLevel);
        this.persist();
      } else if (u.kind === "scale") {
        u.taken = true;
        if (!this.save.powerups.includes(u.id)) this.save.powerups.push(u.id);
        this.save.maxShield = Math.min(5, this.save.maxShield + 1);
        if (!this.save.relics.includes("copper")) this.save.relics.push("copper");
        this.syncVitals();
        p.shield = p.maxShield;
        this.audio.sfxWord();
        this.say("Shield plates up.");
        this.persist();
      } else if (u.kind === "secret") {
        u.taken = true;
        if (!this.save.powerups.includes(u.id)) this.save.powerups.push(u.id);
        const tag = u.label ?? "MARGIN";
        if (tag === "MARGIN") {
          p.maxHp = Math.min(12, p.maxHp + 1);
          p.hp = Math.min(p.maxHp, p.hp + 1);
          this.say("Secret: max health +1");
        } else if (tag === "SERIF") {
          p.shotLevel = Math.min(4, p.shotLevel + 1);
          this.save.shotLevel = p.shotLevel;
          this.say("Secret: stronger shot");
        } else if (tag === "INKWELL") {
          p.maxInk = Math.min(80, p.maxInk + 12);
          p.ink = Math.min(p.maxInk, p.ink + 12);
          this.say("Secret: more ink");
        } else {
          this.save.maxShield = Math.min(5, this.save.maxShield + 1);
          this.syncVitals();
          p.shield = p.maxShield;
          this.say("Secret: thicker shield");
        }
        this.audio.sfxWord();
        this.persist();
      } else if (u.kind === "word" && u.label) {
        u.taken = true;
        const w = u.label as WordId;
        if (!this.save.words.includes(w)) this.save.words.push(w);
        this.audio.sfxWord();
        this.say(
          w === "WALL"
            ? "You can scribe walls."
            : w === "BURN"
              ? "Your scribe burns blocks."
              : w === "RISE"
                ? "Shelves bounce you up."
                : w === "LOCK"
                  ? "You can pin enemies."
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
          this.say(L + " joins the party.");
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
    if (this.player.letter !== "c") {
      this.say("Only c can shift case.");
      return;
    }
    this.player.capital = !this.player.capital;
    this.applySize();
    this.audio.sfxSwap();
    this.say(this.player.capital ? "CASE: C" : "case: c");
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
        if (u.id === "stage1") this.loadLevel("stage1");
        else if (u.id === "stage3") {
          if (!this.save.stage1) this.say("Finish the Exchange first.");
          else this.loadLevel("stage3");
        } else if (u.id === "stage4") {
          if (!this.save.stage3) this.say("Finish the Press first.");
          else this.loadLevel("stage4");
        } else if (u.id === "stage2") {
          if (!this.save.stage4 && !this.save.stage2) this.say("Finish the Coil first.");
          else this.loadLevel("stage2");
        }
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
      this.say(L + " joins the cell.");
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
    if (id !== "c") this.player.capital = false;
    else this.player.capital = this.save.capital;
    this.applySize();
    this.swapCd = 0.35;
    this.player.invuln = Math.max(this.player.invuln, 0.2);
    this.audio.sfxSwap();
    this.burst(this.player.x + this.player.w / 2, this.player.y, "#5ee0c0", 8, "glyph");
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
    for (let i = 0; i < n; i++) {
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
    for (const q of this.particles) {
      q.life -= dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vy += 240 * dt;
    }
    if (this.particles.length > 180) this.particles.splice(0, this.particles.length - 180);
    this.particles = this.particles.filter((q) => q.life > 0);
  }

  private say(s: string) {
    this.toast = s;
    this.toastT = 2.2;
  }

  nextDialogue() {
    this.advanceDialogue();
  }

  advanceIntro() {
    this.audio.unlock();
    this.audio.sfxUi();
    this.introPage += 1;
    if (this.introPage > 2) this.loadLevel("hub");
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
    this.mode = this.stage === "hub" ? "hub" : "play";
    this.emit();
  }

  resume() {
    this.mode = this.prevMode === "pause" ? (this.stage === "hub" ? "hub" : "play") : this.prevMode;
    this.emit();
  }

  toggleMute() {
    this.audio.setMuted(!this.audio.muted);
    this.save.muted = this.audio.muted;
    this.persist();
    this.emit();
  }

  toggleHard() {
    this.hard = !this.hard;
    this.save.hard = this.hard;
    this.emit();
  }

  returnHub() {
    this.loadLevel("hub");
  }

  private currentTasks(): TaskSnap[] {
    const defs = LEVELS[this.stage]?.tasks ?? [];
    return defs
      .filter((t) => {
        if (t.need === "stage1" && !this.save.stage1) return false;
        if (t.need === "stage2" && !this.save.stage2) return false;
        if (t.need === "stage3" && !this.save.stage3) return false;
        if (t.need === "stage4" && !this.save.stage4) return false;
        return true;
      })
      .map((t) => ({ id: t.id, text: t.text, done: this.isTaskDone(t.id) }));
  }

  private isTaskDone(id: string): boolean {
    const s = this.save;
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
      case "enter-lanes":
        return s.visited.includes("stage1");
      case "enter-gutter":
        return s.visited.includes("stage3");
      case "enter-coil":
        return s.visited.includes("stage4");
      case "enter-fort":
        return s.visited.includes("stage2");
      case "recruit-s":
        return s.party.includes("s");
      case "recruit-b":
        return s.party.includes("b");
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
      case "cross-gutter":
        return this.stage === "stage3" && this.player.x > 140 * TILE;
      case "gate-stacks":
        return s.stage1 && this.stage !== "stage1";
      case "gate-press":
        return s.stage3 && this.stage !== "stage3";
      case "gate-coil":
        return s.stage4 && this.stage !== "stage4";
      case "gate-chapter":
        return this.mode === "win" || (s.stage2 && this.stage !== "stage2");
      default:
        return false;
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
    if (id === "recruit-s") {
      const r = pk("recruit", "s");
      if (r) return { x: r.x, y: r.y, label: "s" };
    }
    if (id === "recruit-b") {
      const r = pk("recruit", "b");
      if (r) return { x: r.x, y: r.y, label: "b" };
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
    if (id === "drop-cap") {
      const d = pk("drop");
      if (d) return { x: d.x + 16, y: d.y, label: "DROP CAP" };
    }
    if (id === "dualis") {
      const b = this.enemies.find((e) => e.kind === "dualis" && e.alive);
      if (b) return { x: b.x + b.w / 2, y: b.y, label: "DUALIS" };
    }
    if (id === "tetrarch" || id === "importer") {
      const b = this.enemies.find((e) => (e.kind === "tetrarch" || e.kind === "importer") && e.alive);
      if (b) return { x: b.x + b.w / 2, y: b.y, label: b.name.toUpperCase() };
    }
    if (id === "gate-stacks" || id === "gate-chapter" || id === "gate-press" || id === "gate-coil") {
      const g = this.pickups.find((u) => u.kind === "portal");
      if (g) return { x: g.x + g.w / 2, y: g.y + 20, label: g.label ?? "GATE" };
    }
    return null;
  }

  private emit() {
    const boss = this.enemies.find(
      (e) => (e.kind === "dualis" || e.kind === "tetrarch" || e.kind === "importer") && e.alive,
    );
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
      stage: LEVELS[this.stage]?.name ?? "",
      muted: this.audio.muted,
      shake: this.save.shake,
      hard: this.hard,
      canContinue: this.save.hasCapital || this.save.stage1 || this.save.party.length > 1,
      introPage: this.introPage,
      hasCapital: this.save.hasCapital,
      stage1: this.save.stage1,
      stage2: this.save.stage2,
      stage3: this.save.stage3,
      stage4: this.save.stage4,
      transforming: this.transformT,
      shield: this.player.shield,
      maxShield: this.player.maxShield,
      shotLevel: this.player.shotLevel,
      hint: this.nearHint,
      lore: collectedLore(this.save.talked),
    });
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
  }

  draw() {
    const ctx = this.ctx;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cw = this.canvas.clientWidth || VIEW_W;
    const ch = this.canvas.clientHeight || VIEW_H;
    if (this.canvas.width !== Math.floor(cw * dpr) || this.canvas.height !== Math.floor(ch * dpr)) {
      this.canvas.width = Math.floor(cw * dpr);
      this.canvas.height = Math.floor(ch * dpr);
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
    const sx = (Math.random() * 2 - 1) * 10 * sh;
    const sy = (Math.random() * 2 - 1) * 8 * sh;
    const theme = LEVELS[this.stage]?.theme ?? "hub";

    if (this.mode === "title" || this.mode === "intro") {
      drawParallax(ctx, this.titleC * 40, 0, this.time, "street", 0, 0);
      this.drawTitleScene(ctx);
    } else {
      drawParallax(ctx, this.camX, this.camY, this.time, theme, sx, sy);
      ctx.save();
      ctx.translate(sx, sy);
      drawTiles(ctx, this.rows, this.camX, this.camY, this.time, theme, this.broken);
      drawMarkers(ctx, this.markers, this.camX, this.camY, this.time);
      const goal = this.goal();
      if (goal) drawBeacon(ctx, goal.x, goal.y, this.camX, this.camY, this.time, goal.label);
      for (const w of this.walls) this.drawConstruct(ctx, w);
      for (const b of this.burns) {
        ctx.fillStyle = "rgba(212,90,74,0.45)";
        ctx.fillRect(b.x - this.camX, b.y - this.camY, b.w, b.h);
      }
      for (const n of this.npcs) {
        drawNpcGlyph(ctx, n.glyph, n.x + n.w / 2 - this.camX, n.y + n.h / 2 - this.camY, this.time);
      }
      for (const u of this.pickups) {
        if (u.taken) continue;
        if (u.kind === "door" || u.kind === "portal") this.drawGate(ctx, u);
        else drawPickup(ctx, u.x + u.w / 2 - this.camX, u.y + u.h / 2 - this.camY, u.kind, u.label ?? "", this.time);
      }
      for (const e of this.enemies) if (e.alive) drawEnemy(ctx, e, this.camX, this.camY, this.time);
      drawPlayer(ctx, this.player, this.camX, this.camY, this.time);
      for (const b of this.bullets) drawShot(ctx, b, this.camX, this.camY);
      for (const q of this.particles) {
        ctx.globalAlpha = q.life / q.max;
        ctx.fillStyle = q.color;
        ctx.fillRect(q.x - this.camX, q.y - this.camY, q.size, q.size);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
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
    const locked =
      u.kind === "portal"
        ? this.portalLocked()
        : (u.id === "stage2" && !this.save.stage4 && !this.save.stage2) ||
          (u.id === "stage3" && !this.save.stage1) ||
          (u.id === "stage4" && !this.save.stage3);
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
    ctx.fillRect(x, y, u.w, u.h + 20);
    ctx.strokeStyle = locked ? "#7a8b96" : "#5ee0c0";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, y + 2, u.w - 4, u.h + 16);
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 12);
    ctx.quadraticCurveTo(x + u.w / 2, y - 8, x + u.w - 8, y + 12);
    ctx.stroke();
    ctx.fillStyle = "#e8ece8";
    ctx.font = "600 11px 'Source Sans 3', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(u.label ?? "", x + u.w / 2, y - 10);
  }

  private drawTitleScene(ctx: CanvasRenderingContext2D) {
    drawLetterForm(ctx, "c", false, VIEW_W * 0.32, VIEW_H * 0.58, 1, this.time, 1, 0, 0, 0);
    ctx.save();
    ctx.globalAlpha = 0.9;
    drawEnemy(
      ctx,
      {
        kind: "four",
        x: VIEW_W * 0.62,
        y: VIEW_H * 0.48,
        vx: 0,
        vy: 0,
        w: 48,
        h: 56,
        hp: 1,
        maxHp: 1,
        facing: -1,
        t: this.time,
        hurt: 0,
        flash: 0,
        stun: 0,
        alive: true,
        grounded: true,
        phase: 0,
        aux: 0,
        aux2: 0,
        armor: 0,
        name: "",
      },
      0,
      0,
      this.time,
    );
    ctx.restore();
  }
}
