import {
  BASE_SLOTS,
  BUILDINGS,
  FIXED_DT,
  SPAWN_TX,
  SURFACE_Y,
  TILE,
  ORES,
  ARTIFACTS,
  UPGRADES,
  depthMeters,
  isSolid,
  oreValueAtDepth,
  stratumName,
  type ConsumableId,
  type ShopId,
  type Slot,
} from "./data";
import { AudioBus } from "./audio";
import { Input, aimFromDelta, slideOrigin, STICK_THROW, type Cardinal } from "./input";
import { Renderer } from "./render";
import {
  bestSavedDepth,
  firstEmptySlot,
  firstOccupiedSlot,
  loadSlot,
  readIndex,
  writeSlot,
  clearSlot,
  worldFromSave,
  encodeClaim,
  decodeClaim,
  type SlotsIndex,
} from "./save";
import { Sim, newRun, spawnPlayer } from "./sim";
import { useGameUI, type Phase, type SaveMenu } from "./store";
import { World } from "./world";
import {
  deadzonePx,
  loadSettings,
  saveSettings,
  type CabSettings,
} from "./settings";

export class Game {
  canvas: HTMLCanvasElement;
  input = new Input();
  audio = new AudioBus();
  renderer: Renderer;
  sim: Sim;
  phase: Phase = "title";
  shop: ShopId | null = null;
  raf = 0;
  acc = 0;
  last = 0;
  alive = false;
  hudAcc = 0;
  saveAcc = 0;
  drillCue = 0;
  reduced = false;
  activeSlot: number | null = null;
  settings: CabSettings = loadSettings();
  settingsReturn: Phase = "title";
  kilnFed = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    const seed = (Math.random() * 1e9) | 0;
    const { world, player } = newRun(seed);
    this.sim = new Sim(world, player);
    const idx = readIndex();
    this.activeSlot = idx.active;
    useGameUI.getState().apply({
      hasSave: idx.slots.some(Boolean),
      bestDepth: bestSavedDepth(idx),
      slots: idx.slots,
      activeSlot: idx.active,
      saveMenu: null,
    });
    this.reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    this.settings = loadSettings();
    this.applyCab();
    this.input.attach(canvas);
    this.bindAudioUnlock();
    this.wireControlsTest();
    document.addEventListener("fullscreenchange", () => this.pushHud());
  }

  private bindAudioUnlock(): void {
    const u = () => this.audio.unlock();
    window.addEventListener("pointerdown", u, { once: true });
    window.addEventListener("keydown", u, { once: true });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        this.audio.resume();
        this.save();
      } else {
        this.save();
        if (this.settings.pauseOnBlur && this.phase === "playing") this.setPhase("paused");
      }
    });
  }

  start(): void {
    this.alive = true;
    this.last = performance.now();
    const loop = (now: number) => {
      if (!this.alive) return;
      const raw = Math.min(0.1, (now - this.last) / 1000);
      this.last = now;
      this.tick(raw);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
    this.pushHud(true);
  }

  destroy(): void {
    this.alive = false;
    cancelAnimationFrame(this.raf);
    this.input.detach();
    this.save();
  }

  rigClientPos(): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const z = this.renderer.zoom;
    return {
      x: rect.left + (this.sim.player.x - this.renderer.camX) * z,
      y: rect.top + (this.sim.player.y - this.renderer.camY) * z,
    };
  }

  steerFromPointer(clientX: number, clientY: number, locked: Cardinal | null) {
    const planted = this.input.dragOrigin;
    if (!planted) return { x: 0, y: 0, lock: null as Cardinal | null };
    const slid = slideOrigin(planted, { x: clientX, y: clientY }, STICK_THROW);
    this.input.dragOrigin = slid.origin;
    const dy = this.settings.invertY ? -slid.dy : slid.dy;
    return aimFromDelta(slid.dx, dy, locked, deadzonePx(this.settings));
  }

  applyCab(): void {
    this.audio.setMuted(this.settings.muted);
    this.audio.setVolume(this.settings.volume);
    this.renderer.reduced = !this.settings.shake;
    this.sim.reducedMotion = !this.settings.grit;
    const zoomChanged = this.renderer.zoom !== this.settings.zoom;
    this.renderer.zoom = this.settings.zoom;
    if (zoomChanged) this.renderer.snapFollow(this.sim);
  }

  patchSettings(partial: Partial<CabSettings>): void {
    this.settings = { ...this.settings, ...partial, version: 1 };
    saveSettings(this.settings);
    this.applyCab();
    this.pushHud(true);
  }

  openSettings(): void {
    this.settingsReturn = this.phase === "playing" ? "paused" : this.phase;
    if (this.settingsReturn === "settings") this.settingsReturn = "title";
    this.setPhase("settings");
  }

  closeSettings(): void {
    const back = this.settingsReturn === "settings" ? "title" : this.settingsReturn;
    this.setPhase(back);
  }

  toggleFullscreen(): void {
    const root = document.documentElement;
    if (document.fullscreenElement) {
      void document.exitFullscreen?.();
      return;
    }
    void root.requestFullscreen?.().catch(() => {
      /* browser may refuse */
    });
  }

  feedKiln(): void {
    this.kilnFed = true;
    this.sim.forgeKilnOffering();
    this.audio.boom();
    this.audio.buy();
    this.pushHud(true);
    if (this.phase !== "title" && this.phase !== "help" && this.phase !== "settings") this.save();
  }

  private tick(dt: number): void {
    const actions = this.input.poll();
    if (this.input.takeCheat()) this.feedKiln();

    if (this.phase === "title" || this.phase === "help" || this.phase === "settings") {
      this.renderer.resize();
      this.renderer.camX = SPAWN_TX * TILE - this.renderer.viewW / 2;
      this.renderer.camY = SURFACE_Y * TILE - this.renderer.viewH * 0.7;
      this.sim.tickFx(dt);
      this.renderer.draw(this.sim, dt);
      if (actions.pause && useGameUI.getState().saveMenu) this.closeSaveMenu();
      else if (actions.pause && this.phase === "settings") this.closeSettings();
      else if (actions.pause && this.phase === "help") this.setPhase("title");
      return;
    }

    if (useGameUI.getState().saveMenu) {
      if (actions.pause) this.closeSaveMenu();
      this.renderer.draw(this.sim, dt);
      return;
    }

    if (actions.pause) {
      if (this.phase === "playing") this.setPhase("paused");
      else if (this.phase === "paused" || this.phase === "shop") {
        this.setPhase("playing");
        this.shop = null;
      }
    }

    if (this.phase === "playing") {
      if (actions.interact) {
        const n = this.sim.nearbyShop();
        if (n) this.openShop(n);
      }
      this.acc += dt;
      let steps = 0;
      while (this.acc >= FIXED_DT && steps < 5) {
        this.sim.step(FIXED_DT, actions);
        this.acc -= FIXED_DT;
        steps++;
        actions.interact = false;
        actions.dynamite = false;
        actions.hellcharge = false;
        actions.fuelCan = false;
        actions.nanobots = false;
        actions.teleporter = false;
        actions.coolant = false;
      }
      for (const e of this.sim.emit) {
        if (e === "collect") this.audio.collect();
        else if (e === "damage") this.audio.damage();
        else if (e === "boom") this.audio.boom();
        else if (e === "warn") this.audio.warn();
      }
      this.sim.emit = [];
      if (this.sim.dead && this.phase === "playing") {
        this.audio.explode();
        this.setPhase("dead");
      } else if (this.sim.player.digging && this.sim.drillSfx > 0.08) {
        this.sim.drillSfx = 0;
        this.audio.drill(0.6);
      } else if (this.sim.player.thrusting) {
        this.drillCue += dt;
        if (this.drillCue > 0.12) {
          this.drillCue = 0;
          this.audio.thrust();
        }
      }
    } else {
      this.sim.tickFx(dt);
    }

    this.renderer.draw(this.sim, dt);
    this.hudAcc += dt;
    this.saveAcc += dt;
    if (this.hudAcc > 0.08) {
      this.hudAcc = 0;
      this.pushHud();
    }
    if (this.saveAcc > 4 && this.phase === "playing") {
      this.saveAcc = 0;
      this.save();
    }
  }

  setPhase(phase: Phase): void {
    if (phase === "title" && this.phase !== "title" && this.phase !== "help" && this.phase !== "settings") {
      this.save();
    }
    this.phase = phase;
    if (phase === "title") this.closeSaveMenu();
    this.pushHud(true);
  }

  openSaveMenu(mode: Exclude<SaveMenu, null>): void {
    this.pushSlots({ saveMenu: mode });
  }

  closeSaveMenu(): void {
    if (useGameUI.getState().saveMenu) this.pushSlots({ saveMenu: null });
  }

  openShop(id: ShopId): void {
    if (!this.sim.atSurface()) return;
    if (id === "kiln" && !this.sim.hellUnlocked) {
      this.sim.toastNow("The Kiln is sealed. Breach the Emberward first.");
      return;
    }
    this.shop = id;
    this.phase = "shop";
    this.audio.ui();
    this.pushHud(true);
  }

  closeShop(): void {
    this.shop = null;
    this.phase = "playing";
    this.pushHud(true);
  }

  descend(fresh: boolean, slot?: number): void {
    this.audio.unlock();
    if (fresh) {
      let i = slot;
      if (i == null) i = firstEmptySlot() ?? undefined;
      if (i == null) {
        this.openSaveMenu("new");
        return;
      }
      const seed = (Math.random() * 1e9) | 0;
      const { world, player } = newRun(seed);
      this.sim = new Sim(world, player, 0);
      this.activeSlot = i;
      this.applyRun();
      this.save();
      return;
    }
    const i = slot ?? this.activeSlot ?? firstOccupiedSlot();
    if (i == null) {
      this.descend(true);
      return;
    }
    const saved = loadSlot(i);
    if (!saved) {
      this.descend(true, i);
      return;
    }
    const world = worldFromSave(saved);
    const player = spawnPlayer(saved.upgrades, saved.items, saved.money);
    player.x = saved.x;
    player.y = saved.y;
    player.vx = saved.vx;
    player.vy = saved.vy;
    player.fuel = saved.fuel;
    player.hull = saved.hull;
    player.cargo = saved.cargo;
    this.sim = new Sim(world, player, saved.bestDepth, saved.hellUnlocked);
    this.sim.hellSeen = saved.hellSeen;
    this.sim.coolantT = saved.coolantT;
    const tx = Math.floor(player.x / TILE);
    const ty = Math.floor(player.y / TILE);
    if (isSolid(world.get(tx, ty))) {
      player.x = (SPAWN_TX + 0.5) * TILE;
      player.y = (SURFACE_Y - 0.55) * TILE;
    }
    this.audio.setMuted(this.settings.muted);
    this.activeSlot = i;
    this.applyRun();
  }

  private applyRun(): void {
    this.applyCab();
    this.phase = "playing";
    this.shop = null;
    this.closeSaveMenu();
    if (this.kilnFed) this.sim.forgeKilnOffering();
    else this.sim.toastNow("Drag to drill. Sell at the Exchange. Don't run dry.");
    this.pushHud(true);
  }

  saveToSlot(i: number): void {
    if (this.phase === "title" || this.phase === "help") return;
    this.activeSlot = i;
    if (this.save()) this.sim.toastNow("Claim saved in this browser.");
    else this.sim.toastNow("Could not save. Storage is blocked or full.");
    this.closeSaveMenu();
    this.pushHud(true);
  }

  loadFromSlot(i: number): void {
    this.descend(false, i);
  }

  newInSlot(i: number): void {
    this.descend(true, i);
  }

  eraseSlot(i: number): void {
    clearSlot(i);
    if (this.activeSlot === i && (this.phase === "title" || this.phase === "help")) this.activeSlot = firstOccupiedSlot();
    this.pushSlots({ saveMenu: useGameUI.getState().saveMenu });
  }

  saveNow(): void {
    if (this.phase === "title" || this.phase === "help") {
      this.openSaveMenu("load");
      return;
    }
    if (this.activeSlot == null) {
      this.openSaveMenu("save");
      return;
    }
    if (this.save()) this.sim.toastNow("Claim saved in this browser.");
    else this.sim.toastNow("Could not save. Storage is blocked or full.");
    this.pushHud(true);
  }

  captureBlob() {
    const p = this.sim.player;
    return {
      version: 3,
      seed: this.sim.world.seed,
      grid: this.sim.world.encode(),
      x: p.x,
      y: p.y,
      vx: p.vx,
      vy: p.vy,
      fuel: p.fuel,
      hull: p.hull,
      money: p.money,
      cargo: p.cargo,
      upgrades: p.upgrades,
      items: p.items,
      bestDepth: this.sim.bestDepth,
      bestMoney: p.money,
      hellUnlocked: this.sim.hellUnlocked,
      hellSeen: this.sim.hellSeen,
      coolantT: this.sim.coolantT,
      muted: this.audio.muted,
      shake: this.settings.shake,
      savedAt: Date.now(),
    };
  }

  exportClaim(): void {
    const live = this.phase !== "title" && this.phase !== "help";
    const blob = live ? this.captureBlob() : this.activeSlot != null ? loadSlot(this.activeSlot) : null;
    if (!blob) {
      this.openSaveMenu("load");
      this.sim.toastNow("No claim to copy yet. Start a descent first.");
      return;
    }
    try {
      const file = encodeClaim(blob);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([file], { type: "application/json" }));
      a.download = `cinderwell-claim.json`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(a.href), 1500);
      this.sim.toastNow("Claim file downloaded. Keep it with you.");
      this.pushHud(true);
    } catch {
      this.sim.toastNow("Could not write a file from this browser.");
    }
  }

  importClaimText(text: string): boolean {
    const blob = decodeClaim(text);
    if (!blob) {
      this.sim.toastNow("That file is not a Cinderwell claim.");
      this.pushHud(true);
      return false;
    }
    const i = this.activeSlot ?? firstEmptySlot() ?? 0;
    if (!writeSlot(i, blob)) {
      this.sim.toastNow("Could not save. Storage is blocked or full.");
      this.pushHud(true);
      return false;
    }
    this.loadFromSlot(i);
    this.sim.toastNow("Claim loaded from file into this browser.");
    this.pushHud(true);
    return true;
  }

  resurface(): void {
    this.sim.recover();
    this.audio.ui();
    this.phase = "playing";
    this.save();
    this.pushHud(true);
  }

  sellAll(): void {
    const v = this.sim.sellAll();
    if (v > 0) {
      this.audio.sell();
      this.sim.toastNow(`Sold haul for $${v.toLocaleString()}`);
    }
    this.pushHud(true);
    this.save();
  }

  buyUpgrade(slot: Slot): void {
    const shop = this.shop ?? "rigworks";
    if (this.sim.buyUpgrade(slot, shop)) {
      this.audio.buy();
      const u = this.sim.player.upgrades[slot];
      this.sim.toastNow(`Fitted ${UPGRADES[slot][u]!.name}`);
    }
    this.pushHud(true);
    this.save();
  }

  fillFuel(): void {
    if (this.sim.fillFuel()) this.audio.buy();
    this.pushHud(true);
    this.save();
  }

  repairHull(): void {
    if (this.sim.repairHull()) this.audio.buy();
    this.pushHud(true);
    this.save();
  }

  buyItem(id: ConsumableId): void {
    if (this.sim.buyItem(id, this.shop ?? "depot")) this.audio.buy();
    this.pushHud(true);
    this.save();
  }

  setMuted(m: boolean): void {
    this.patchSettings({ muted: m });
    this.save();
  }

  setShake(s: boolean): void {
    this.patchSettings({ shake: s });
    this.save();
  }

  save(): boolean {
    if (this.phase === "title" || this.phase === "help") return false;
    if (this.activeSlot == null) return false;
    const ok = writeSlot(this.activeSlot, this.captureBlob());
    this.pushSlots();
    return ok;
  }

  newWorld(): void {
    const money = this.sim.player.money;
    const up = this.sim.player.upgrades;
    const items = this.sim.player.items;
    const best = this.sim.bestDepth;
    const seed = (Math.random() * 1e9) | 0;
    const world = new World(seed);
    const player = spawnPlayer(up, items, money);
    this.sim = new Sim(world, player, best, this.sim.hellUnlocked);
    this.applyCab();
    this.sim.toastNow("New claim staked. Same rig.");
    this.phase = "playing";
    this.shop = null;
    this.save();
    this.pushHud(true);
  }

  private prompt(): string | null {
    if (this.phase !== "playing") return null;
    const n = this.sim.nearbyShop();
    if (n) {
      const b = BUILDINGS.find((x) => x.id === n);
      return `${b?.name ?? n} — E to open`;
    }
    return this.sim.toast;
  }

  private pushHud(force = false): void {
    const p = this.sim.player;
    const nearby = this.sim.nearbyShop();
    useGameUI.getState().apply({
      phase: this.phase,
      shop: this.shop,
      fuel: p.fuel,
      maxFuel: this.sim.maxFuel(),
      hull: p.hull,
      maxHull: this.sim.maxHull(),
      money: p.money,
      cargo: p.cargo,
      cargoMax: this.sim.cargoMax(),
      depth: depthMeters(this.sim.tileY()),
      bestDepth: depthMeters(this.sim.bestDepth + SURFACE_Y),
      stratum: stratumName(this.sim.depth()),
      hellUnlocked: this.sim.hellUnlocked,
      coolantT: this.sim.coolantT,
      upgrades: p.upgrades,
      items: p.items,
      prompt: this.prompt(),
      toast: this.sim.toast,
      nearby,
      atSurface: this.sim.atSurface(),
      muted: this.audio.muted,
      shake: this.settings.shake,
      deathReason: this.sim.deathReason,
      salvage: this.sim.salvage,
      cargoLost: this.sim.cargoLost,
      reducedMotion: !this.settings.grit,
      hasSave: force ? readIndex().slots.some(Boolean) : useGameUI.getState().hasSave,
      saveMenu: useGameUI.getState().saveMenu,
      slots: useGameUI.getState().slots,
      activeSlot: this.activeSlot,
      settings: this.settings,
      fullscreen: typeof document !== "undefined" && Boolean(document.fullscreenElement),
      kilnFed: this.kilnFed,
    });
  }

  private pushSlots(extra: Partial<{ saveMenu: SaveMenu }> = {}): void {
    const idx: SlotsIndex = readIndex();
    useGameUI.getState().apply({
      slots: idx.slots,
      activeSlot: this.activeSlot,
      hasSave: idx.slots.some(Boolean),
      bestDepth: Math.max(bestSavedDepth(idx), depthMeters(this.sim.bestDepth + SURFACE_Y)),
      saveMenu: extra.saveMenu !== undefined ? extra.saveMenu : useGameUI.getState().saveMenu,
    });
  }

  private wireControlsTest(): void {
    const self = this;
    (window as unknown as { __controlsTest: unknown }).__controlsTest = {
      getX: () => self.sim.player.x,
      getY: () => self.sim.player.y,
      getSpeed: () => Math.hypot(self.sim.player.vx, self.sim.player.vy),
      getFacing: () => self.sim.player.facing,
      getYaw: () => (self.sim.player.facing > 0 ? 0 : Math.PI),
      setKeys: (codes: string[]) => self.input.setQa(codes),
      clearKeys: () => self.input.clearQa(),
      setTouch: (x: number, y: number) => {
        self.input.touch.moveX = x;
        self.input.touch.moveY = y;
      },
      setDrill: (on: boolean) => {
        self.input.touch.drill = on;
      },
      rigClientPos: () => self.rigClientPos(),
      startDrag: (x: number, y: number) => {
        self.input.dragOrigin = { x, y };
        self.input.touchLock = null;
      },
      dragTo: (clientX: number, clientY: number) => {
        const dir = self.steerFromPointer(clientX, clientY, self.input.touchLock);
        self.input.touchLock = dir.lock;
        self.input.touch.moveX = dir.x;
        self.input.touch.moveY = dir.y;
        self.input.touch.drill = dir.lock != null;
        return dir;
      },
      endDrag: () => {
        self.input.dragOrigin = null;
        self.input.touchLock = null;
        self.input.touch.moveX = 0;
        self.input.touch.moveY = 0;
        self.input.touch.drill = false;
      },
      aim: (clientX: number, clientY: number) => {
        if (!self.input.dragOrigin) self.input.dragOrigin = { x: clientX, y: clientY };
        const dir = self.steerFromPointer(clientX, clientY, self.input.touchLock);
        self.input.touchLock = dir.lock;
        self.input.touch.moveX = dir.x;
        self.input.touch.moveY = dir.y;
        self.input.touch.drill = dir.lock != null;
        return dir;
      },
      getDrillDir: () => self.sim.player.drillDir,
      start: () => {
        if (self.phase === "title") self.descend(true);
      },
      getPhase: () => self.phase,
      feedKiln: () => self.feedKiln(),
      getUpgrades: () => ({ ...self.sim.player.upgrades }),
      getMoney: () => self.sim.player.money,
      getHellUnlocked: () => self.sim.hellUnlocked,
      getSettings: () => self.settings,
      getZoom: () => self.renderer.zoom,
      getViewW: () => self.renderer.viewW,
      patchSettings: (p: Partial<CabSettings>) => self.patchSettings(p),
      warpHell: (layer = 1) => {
        const p = self.sim.player;
        for (const slot of BASE_SLOTS) {
          if (p.upgrades[slot] < 5) p.upgrades[slot] = 5;
        }
        p.hull = self.sim.maxHull();
        p.fuel = self.sim.maxFuel();
        p.money = Math.max(p.money, 420000);
        const d = layer <= 1 ? 352 : layer === 2 ? 450 : 550;
        const tx = Math.floor(p.x / TILE);
        const ty = SURFACE_Y + d;
        for (let y = ty - 2; y <= ty + 2; y++) {
          for (let x = tx - 2; x <= tx + 2; x++) self.sim.world.set(x, y, 0);
        }
        p.y = ty * TILE;
        p.x = (tx + 0.5) * TILE;
        self.sim.hellUnlocked = true;
        self.sim.hellSeen = layer <= 1 ? 1 : layer === 2 ? 2 : 3;
        self.sim.bestDepth = Math.max(self.sim.bestDepth, d);
        self.sim.toastNow(layer <= 1 ? "Emberward. The Kiln has unsealed on the pad." : "Hell layer.");
        self.pushHud(true);
      },
      getStratum: () => stratumName(self.sim.depth()),
      openShop: (id: ShopId) => self.openShop(id),
      oreValue: (id: number, depth: number) => {
        const def = ORES.find((o) => o.id === id);
        return def ? oreValueAtDepth(def, depth) : 0;
      },
      warpPad: (shop?: ShopId) => {
        const b = shop ? BUILDINGS.find((x) => x.id === shop) : undefined;
        const tx = b ? Math.floor((b.x0 + b.x1) / 2) : SPAWN_TX;
        const p = self.sim.player;
        p.x = (tx + 0.5) * TILE;
        p.y = (SURFACE_Y - 0.55) * TILE;
        p.vx = 0;
        p.vy = 0;
        p.grounded = true;
        self.pushHud(true);
      },
      plantVein: () => {
        const p = self.sim.player;
        const tx = Math.floor(p.x / TILE);
        const ty = Math.floor(p.y / TILE);
        const ids = [...ORES.map((o) => o.id), ...ARTIFACTS.map((a) => a.id)];
        for (let y = ty - 2; y <= ty + 3; y++) {
          for (let x = tx - 1; x <= tx + 1; x++) self.sim.world.set(x, y, 0);
        }
        ids.forEach((id, i) => {
          const x = tx + 2 + (i % 7);
          const y = ty - 1 + Math.floor(i / 7);
          self.sim.world.set(x, y, id);
        });
      },
      saveNow: () => self.saveNow(),
      saveTo: (i: number) => self.saveToSlot(i),
      loadSlot: (i: number) => self.loadFromSlot(i),
      listSlots: () => readIndex(),
      getActiveSlot: () => self.activeSlot,
      openClaims: (mode: "load" | "save" | "new" = "load") => self.openSaveMenu(mode),
      toTitle: () => self.setPhase("title"),
    };
  }
}

let instance: Game | null = null;
export function getGame(): Game | null {
  return instance;
}
export function setGame(g: Game | null): void {
  instance = g;
}
