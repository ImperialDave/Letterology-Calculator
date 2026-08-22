import {
  APEX_SLOTS,
  BASE_SLOTS,
  BUILDINGS,
  CONSUMABLES,
  FUEL_PRICE,
  HEAT_DPS,
  HELL_1,
  HELL_3,
  HULL_PRICE,
  KILN_BASE_MAX,
  KILN_MODULE_SLOTS,
  LATTICE_SLOTS,
  RIGWORKS_MAX,
  SALVAGE_RATE,
  SPAWN_TX,
  STIPEND,
  SURFACE_Y,
  T,
  TILE,
  UPGRADES,
  WIN_BOUNTY,
  WORLD_H,
  WORLD_W,
  artifactById,
  cargoValue,
  crumbColor,
  defaultItems,
  defaultUpgrades,
  hardness,
  hellLevel,
  hookCharges,
  isArtifact,
  isDiggable,
  isLava,
  isOre,
  isRelic,
  isSolid,
  latticeUnlocked,
  nailCap,
  oreById,
  oreValueAtDepth,
  type CargoItem,
  type ConsumableId,
  type Nail,
  type ShopId,
  type Slot,
  type UpgradesState,
} from "./data";
import type { Actions } from "./input";
import { World } from "./world";

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  g: number;
}

export interface Floater {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fuel: number;
  hull: number;
  money: number;
  cargo: CargoItem[];
  upgrades: UpgradesState;
  items: Record<ConsumableId, number>;
  facing: number;
  drillDir: number;
  digging: { x: number; y: number; t: number } | null;
  grounded: boolean;
  thrusting: boolean;
  invuln: number;
  flash: number;
  moveIntentX: number;
  moveIntentY: number;
}

export function spawnPlayer(up: UpgradesState, items: Record<ConsumableId, number>, money: number): Player {
  const upgrades = { ...defaultUpgrades(), ...up };
  const kit = { ...defaultItems(), ...items };
  const maxFuel = UPGRADES.tank[upgrades.tank]!.value;
  const maxHull = UPGRADES.hull[upgrades.hull]!.value;
  return {
    x: (SPAWN_TX + 0.5) * TILE,
    y: (SURFACE_Y - 0.55) * TILE,
    vx: 0,
    vy: 0,
    fuel: maxFuel,
    hull: maxHull,
    money,
    cargo: [],
    upgrades,
    items: kit,
    facing: 1,
    drillDir: 2,
    digging: null,
    grounded: true,
    thrusting: false,
    invuln: 0,
    flash: 0,
    moveIntentX: 0,
    moveIntentY: 0,
  };
}

export class Sim {
  world: World;
  player: Player;
  particles: Particle[] = [];
  floaters: Floater[] = [];
  trauma = 0;
  bestDepth = 0;
  toast: string | null = null;
  toastT = 0;
  deathReason = "";
  salvage = 0;
  cargoLost = 0;
  dead = false;
  explodeT = 0;
  reducedMotion = false;
  drillSfx = 0;
  heatPulse = 0;
  emit: Array<"collect" | "damage" | "boom" | "warn"> = [];
  hellUnlocked = false;
  hellSeen: 0 | 1 | 2 | 3 = 0;
  coolantT = 0;
  nails: Nail[] = [];
  recallAt = 0;
  phaseSoftT = 0;
  phaseSoftCd = 0;
  phaseWalkT = 0;
  phaseDashCd = 0;
  resonatorCd = 0;
  chorusUsed = false;
  latticeHeld = false;
  indexUsed = false;
  indexMark: { x: number; y: number } | null = null;
  sealsFound = 0;
  won = false;
  wonCount = 0;
  hookLeft = 0;
  latticeHolds = 0;

  constructor(world: World, player: Player, bestDepth = 0, hellUnlocked = false) {
    this.world = world;
    this.player = player;
    this.bestDepth = bestDepth;
    this.hellUnlocked = hellUnlocked || bestDepth >= HELL_1;
    if (this.hellUnlocked) this.hellSeen = hellLevel(bestDepth) || 1;
    this.resetDescentToys();
  }

  resetDescentToys(): void {
    this.hookLeft = hookCharges(this.player.upgrades.hook);
    this.latticeHolds = 0;
    this.chorusUsed = false;
    this.indexUsed = false;
    this.indexMark = null;
  }

  carryingSeal(): boolean {
    return this.player.cargo.some((c) => isRelic(c));
  }

  pressMult(id: number): number {
    const press = this.player.upgrades.press;
    if (press <= 0) return 1;
    if (id === T.ORE_16 || id === T.ART_WELL) return 1.33;
    if (press >= 2 && hellLevel(this.depth()) >= 3) return 1.33;
    return 1;
  }

  maxFuel(): number {
    return UPGRADES.tank[this.player.upgrades.tank]!.value;
  }
  maxHull(): number {
    return UPGRADES.hull[this.player.upgrades.hull]!.value;
  }
  cargoMax(): number {
    return UPGRADES.cargo[this.player.upgrades.cargo]!.value;
  }
  drillPower(): number {
    return UPGRADES.drill[this.player.upgrades.drill]!.value;
  }
  engineSpeed(): number {
    return UPGRADES.engine[this.player.upgrades.engine]!.value;
  }
  resist(): number {
    return UPGRADES.radiator[this.player.upgrades.radiator]!.value;
  }
  veil(): number {
    return UPGRADES.veil[this.player.upgrades.veil]!.value;
  }
  lift(): number {
    return UPGRADES.lift[this.player.upgrades.lift]!.value;
  }
  scannerRange(): number {
    return UPGRADES.scanner[this.player.upgrades.scanner]!.value;
  }
  heatResist(): number {
    return Math.min(0.95, this.resist() + this.veil());
  }

  tileX(px = this.player.x): number {
    return Math.floor(px / TILE);
  }
  tileY(py = this.player.y): number {
    return Math.floor(py / TILE);
  }

  depth(): number {
    return Math.max(0, this.tileY() - SURFACE_Y);
  }

  atSurface(): boolean {
    return this.tileY() <= SURFACE_Y;
  }

  nearbyShop(): ShopId | null {
    if (!this.atSurface() || !this.player.grounded) return null;
    const tx = this.tileX();
    for (const b of BUILDINGS) {
      if (b.requiresHell && !this.hellUnlocked) continue;
      if (b.requiresHeartfire && !latticeUnlocked(this.hellSeen)) continue;
      if (tx >= b.x0 && tx <= b.x1) return b.id;
    }
    return null;
  }

  toastNow(msg: string): void {
    this.toast = msg;
    this.toastT = 2.4;
  }

  addParticle(p: Omit<Particle, "max"> & { max?: number }): void {
    if (this.particles.length > 280) this.particles.shift();
    this.particles.push({ ...p, max: p.max ?? p.life });
  }

  burst(x: number, y: number, n: number, color: string, speed = 80): void {
    const count = this.reducedMotion ? Math.min(3, Math.ceil(n * 0.2)) : n;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.3 + Math.random());
      this.addParticle({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 0.25 + Math.random() * 0.45,
        size: 1.5 + Math.random() * 2.5,
        color,
        g: 40,
      });
    }
  }

  float(x: number, y: number, text: string, color: string): void {
    this.floaters.push({ x, y, text, life: 1.1, color });
  }

  hurt(amount: number, reason: string): void {
    if (amount <= 0 || this.dead) return;
    if (this.player.invuln > 0) return;
    const heat = reason === "heat" || reason === "magma" || reason === "gas";
    const resist = reason === "fall" ? 0 : heat ? this.heatResist() : this.resist();
    const dmg = amount * (1 - resist);
    this.player.hull = Math.max(0, this.player.hull - dmg);
    if (reason !== "heat") {
      this.player.flash = 0.18;
      this.trauma = Math.min(1, this.trauma + Math.min(0.55, dmg / 28));
      if (dmg > 2 || reason === "fall") this.emit.push("damage");
    }
    if (this.player.hull <= 0) this.kill(reason === "heat" ? "heat" : reason);
  }

  kill(reason: string): void {
    if (this.dead) return;
    if (this.player.upgrades.hull >= 8) {
      const maxHolds = this.player.upgrades.wake >= 2 ? 2 : 1;
      if (this.latticeHolds < maxHolds) {
        this.latticeHolds += 1;
        this.player.hull = 1;
        this.player.invuln = 2;
        this.player.flash = 0.4;
        this.toastNow(this.latticeHolds > 1 ? "Second skin held." : "The lattice held.");
        this.toastT = 3.2;
        this.emit.push("warn");
        return;
      }
    }
    this.dead = true;
    this.explodeT = 0;
    this.deathReason = reason;
    this.cargoLost = cargoValue(this.player.cargo);
    this.salvage = Math.floor(this.player.money * SALVAGE_RATE);
    this.player.money = Math.max(0, this.player.money - this.salvage);
    this.player.cargo = [];
    this.burst(this.player.x, this.player.y, 48, "#e07a3d", 160);
    this.burst(this.player.x, this.player.y, 24, "#efe8dc", 90);
    this.trauma = 1;
  }

  recover(): void {
    const up = this.player.upgrades;
    const items = this.player.items;
    let money = this.player.money;
    if (money < 40) money = STIPEND;
    const nails = up.anchor >= 3 ? this.nails.slice() : [];
    const seals = this.sealsFound;
    this.player = spawnPlayer(up, items, money);
    this.player.fuel = this.maxFuel() * 0.35;
    this.player.hull = this.maxHull() * 0.55;
    this.dead = false;
    this.explodeT = 0;
    this.chorusUsed = false;
    this.latticeHeld = false;
    this.indexUsed = false;
    this.indexMark = null;
    this.sealsFound = seals;
    this.nails = nails;
    this.resetDescentToys();
    if (nails.length) {
      const n = nails[nails.length - 1]!;
      this.player.x = n.x;
      this.player.y = n.y;
      this.toastNow("Rig recovered on the last nail. Fuel's low.");
    } else {
      this.toastNow("Rig recovered at the pad. Fuel's low.");
    }
  }

  breakTile(tx: number, ty: number): void {
    const t = this.world.get(tx, ty);
    this.world.set(tx, ty, T.EMPTY);
    const cx = (tx + 0.5) * TILE;
    const cy = (ty + 0.5) * TILE;
    const earth = crumbColor(t);
    this.burst(cx, cy, 16, earth, 95);
    for (let i = 0; i < 7; i++) {
      this.addParticle({
        x: cx + (Math.random() - 0.5) * 18,
        y: cy + (Math.random() - 0.5) * 18,
        vx: (Math.random() - 0.5) * 70,
        vy: -40 - Math.random() * 70,
        life: 0.4 + Math.random() * 0.5,
        size: 2.5 + Math.random() * 4.5,
        color: earth,
        g: 220,
      });
    }

    if (isOre(t)) {
      const def = oreById(t);
      if (!def) return;
      if (this.player.cargo.length >= this.cargoMax()) {
        this.toastNow("Cargo full — the ore stays in the wall.");
        this.world.set(tx, ty, t);
        return;
      }
      const val = Math.round(oreValueAtDepth(def, this.depth()) * this.pressMult(def.id));
      this.player.cargo.push({ id: def.id, name: def.name, value: val });
      this.float(cx, cy - 10, `$${val.toLocaleString()}`, def.glow);
      this.burst(cx, cy, 10, def.glow, 90);
      this.emit.push("collect");
    } else if (isArtifact(t)) {
      const a = artifactById(t);
      if (!a) return;
      if (t === T.ART_WELL) {
        if (this.player.cargo.length >= this.cargoMax()) {
          this.toastNow("Cargo full — the Seal stays in the wall.");
          this.world.set(tx, ty, t);
          return;
        }
        const val = Math.round(a.value * this.pressMult(t));
        this.player.cargo.push({ id: a.id, name: a.name, value: val, relic: true });
        this.sealsFound += 1;
        this.float(cx, cy - 10, "WELL SEAL", a.color);
        this.burst(cx, cy, 18, a.color, 140);
        this.emit.push("collect");
        this.toastNow("The Seal is in the hopper. Bring it to the Lattice.");
        this.toastT = 4.2;
        return;
      }
      this.player.money += a.value;
      this.float(cx, cy - 10, `+$${a.value.toLocaleString()}`, a.color);
      this.burst(cx, cy, 14, a.color, 110);
      this.emit.push("collect");
    } else if (t === T.GAS) {
      this.hurt(7, "gas");
      this.burst(cx, cy, 16, "#9cbf4a", 100);
    } else if (t === T.LAVA) {
      this.hurt(16, "magma");
      this.burst(cx, cy, 20, "#e05a20", 120);
    } else if (t === T.HELL_LAVA) {
      this.hurt(22, "magma");
      this.burst(cx, cy, 22, "#ff8040", 140);
    } else if (t === T.HELLGATE) {
      this.burst(cx, cy, 14, "#c45c3a", 110);
    }
  }

  tryDig(tx: number, ty: number, dt: number): boolean {
    if (!this.world.inBounds(tx, ty)) return false;
    const t = this.world.get(tx, ty);
    if (!isSolid(t)) return false;
    const bit = this.player.upgrades.corebit;
    if (t === T.CORE && bit < 1) return true;
    if (t === T.BEDROCK && bit < 1) {
      this.toastNow("Bedrock — needs a charge.");
      return true;
    }
    if (!isDiggable(t, bit)) return true;

    let h = hardness(t, this.depth());
    if (t === T.CORE) h = bit >= 2 ? 3.2 : 8.5;
    else if (t === T.BEDROCK) h = bit >= 2 ? 4.2 : 7.2;
    if (this.player.upgrades.phase >= 1) {
      if (this.phaseSoftT <= 0 && this.phaseSoftCd <= 0 && h > this.drillPower() * 1.5) {
        this.phaseSoftT = 1.2;
        this.phaseSoftCd = 7;
        this.toastNow("Ghostedge.");
      }
      if (this.phaseSoftT > 0) h = Math.max(0.35, h * 0.25);
    }
    const rate = this.drillPower() / Math.max(0.35, h);
    const d = this.player.digging;
    if (!d || d.x !== tx || d.y !== ty) {
      this.player.digging = { x: tx, y: ty, t: 0 };
    }
    const dig = this.player.digging;
    if (!dig) return true;
    dig.t += dt * rate;
    this.player.fuel = Math.max(0, this.player.fuel - dt * 0.42);
    this.drillSfx += dt;

    if (h > this.drillPower() * 2.2) {
      this.hurt(dt * 3.2, "strain");
    }

    const cx = (tx + 0.5) * TILE;
    const cy = (ty + 0.5) * TILE;
    const earth = crumbColor(t);
    if (Math.random() < 0.55) {
      this.addParticle({
        x: cx + (Math.random() - 0.5) * 14,
        y: cy + (Math.random() - 0.5) * 14,
        vx: (Math.random() - 0.5) * 50,
        vy: -15 - Math.random() * 40,
        life: 0.28 + Math.random() * 0.2,
        size: 1.4 + Math.random() * 2.2,
        color: earth,
        g: 90,
      });
    }

    if (dig.t >= 1) {
      this.breakTile(tx, ty);
      if (this.player.upgrades.phase >= 2) {
        const dir = this.player.drillDir;
        const ox = dir === 1 ? 1 : dir === 3 ? -1 : 0;
        const oy = dir === 2 ? 1 : dir === 0 ? -1 : 0;
        const bx = tx + ox;
        const by = ty + oy;
        const behind = this.world.get(bx, by);
        if (isDiggable(behind, this.player.upgrades.corebit) && behind !== T.PAD) this.breakTile(bx, by);
      }
      this.player.digging = null;
      this.trauma = Math.min(1, this.trauma + 0.08);
    }
    return true;
  }

  blast(radius = 1): void {
    const item: ConsumableId = radius >= 3 ? "nullcharge" : radius > 1 ? "hellcharge" : "dynamite";
    if (this.player.items[item] <= 0) {
      this.toastNow(radius >= 3 ? "No nullcharges." : radius > 1 ? "No hellcharges." : "No charges left.");
      return;
    }
    this.player.items[item] -= 1;
    const tx = this.tileX();
    const ty = this.tileY();
    this.trauma = Math.min(1, this.trauma + (radius >= 3 ? 1 : radius > 1 ? 0.9 : 0.7));
    for (let y = ty - radius; y <= ty + radius; y++) {
      for (let x = tx - radius; x <= tx + radius; x++) {
        if (x === tx && y === ty) continue;
        const t = this.world.get(x, y);
        if (t === T.CORE || t === T.EMPTY) continue;
        if (t === T.LAVA) this.hurt(10, "magma");
        if (t === T.HELL_LAVA) this.hurt(14, "magma");
        if (t === T.GAS) this.hurt(5, "gas");
        this.world.set(x, y, T.EMPTY);
        if (isOre(t)) {
          const def = oreById(t);
          if (def && this.player.cargo.length < this.cargoMax()) {
            this.player.cargo.push({ id: def.id, name: def.name, value: oreValueAtDepth(def, this.depth()) });
          }
        } else if (isArtifact(t)) {
          const a = artifactById(t);
          if (a && t === T.ART_WELL && this.player.cargo.length < this.cargoMax()) {
            this.player.cargo.push({ id: a.id, name: a.name, value: Math.round(a.value * this.pressMult(t)), relic: true });
            this.sealsFound += 1;
            this.toastNow("The Seal is in the hopper. Bring it to the Lattice.");
          } else if (a) {
            this.player.money += a.value;
            if (t === T.ART_WELL) this.sealsFound += 1;
          }
        }
      }
    }
    this.burst(
      this.player.x,
      this.player.y,
      radius >= 3 ? 56 : radius > 1 ? 48 : 36,
      radius >= 3 ? "#c8d0dc" : radius > 1 ? "#ff6a3a" : "#e8c070",
      180,
    );
    this.hurt(radius >= 3 ? 6 : radius > 1 ? 5 : 3.5, "blast");
  }

  useFuelCan(): void {
    if (this.player.items.fuelCan <= 0) {
      this.toastNow("No spare cans.");
      return;
    }
    this.player.items.fuelCan -= 1;
    const add = this.maxFuel() * 0.4;
    this.player.fuel = Math.min(this.maxFuel(), this.player.fuel + add);
    this.toastNow("Spare can cracked.");
  }

  useNanobots(): void {
    if (this.player.items.nanobots <= 0) {
      this.toastNow("No patch kits.");
      return;
    }
    this.player.items.nanobots -= 1;
    this.player.hull = Math.min(this.maxHull(), this.player.hull + 45);
    this.toastNow("Hull patched.");
  }

  teleport(fromHook = false): void {
    const pad = { x: (SPAWN_TX + 0.5) * TILE, y: (SURFACE_Y - 0.55) * TILE };
    const dests = [pad, ...this.nails];
    let usedHook = false;
    if (fromHook) {
      if (this.hookLeft <= 0) {
        this.toastNow("No skyhook left this descent.");
        return;
      }
      this.hookLeft -= 1;
      usedHook = true;
    } else if (this.player.items.teleporter > 0) {
      this.player.items.teleporter -= 1;
    } else if (this.hookLeft > 0) {
      this.hookLeft -= 1;
      usedHook = true;
    } else {
      this.toastNow("No recall beacon.");
      return;
    }
    const i = this.recallAt % dests.length;
    this.recallAt = i + 1;
    const to = dests[i]!;
    this.player.x = to.x;
    this.player.y = to.y;
    this.player.vx = 0;
    this.player.vy = 0;
    if (this.player.upgrades.wake >= 1) this.player.invuln = Math.max(this.player.invuln, this.player.upgrades.wake >= 2 ? 2.5 : 1.5);
    this.burst(this.player.x, this.player.y, 20, usedHook ? "#c8d0dc" : "#7ec8c4", 100);
    const where = i === 0 ? "the pad" : `nail ${i}`;
    this.toastNow(usedHook ? `Skyhook to ${where}.` : `Snapped to ${where}.`);
  }

  plantNail(): void {
    const cap = nailCap(this.player.upgrades.anchor);
    if (cap <= 0) {
      this.toastNow("No spike fitted.");
      return;
    }
    if (this.atSurface()) {
      this.toastNow("Nails bite the well, not the pad.");
      return;
    }
    const nail = { x: this.player.x, y: this.player.y };
    this.nails.push(nail);
    while (this.nails.length > cap) this.nails.shift();
    this.toastNow(this.nails.length > 1 ? `Nail ${this.nails.length} driven.` : "Spike driven.");
  }

  pingVeins(announce = true): void {
    const r = this.player.upgrades.cipher >= 2 ? 14 : 8;
    const tx = this.tileX();
    const ty = this.tileY();
    let n = 0;
    for (let y = ty - r; y <= ty + r; y++) {
      for (let x = tx - r; x <= tx + r; x++) {
        const t = this.world.get(x, y);
        if (!isOre(t) && !isArtifact(t)) continue;
        const o = isOre(t) ? oreById(t) : artifactById(t);
        if (!o) continue;
        n += 1;
        const label = `${o.name} $${o.value.toLocaleString()}`;
        this.float((x + 0.5) * TILE, (y + 0.5) * TILE - 8, label, o.color);
      }
    }
    if (!announce) return;
    if (n === 0) this.toastNow("The bell hears only rock.");
    else this.toastNow(`Vein bell — ${n} ping${n === 1 ? "" : "s"}.`);
  }

  markIndex(): void {
    if (this.player.upgrades.cipher < 3 || this.indexUsed) return;
    this.indexUsed = true;
    let best: { x: number; y: number; d: number } | null = null;
    const px = this.tileX();
    const py = this.tileY();
    const h = this.world.h;
    const w = this.world.w;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const t = this.world.get(x, y);
        if (t !== T.ORE_16 && t !== T.ART_WELL) continue;
        const d = Math.abs(x - px) + Math.abs(y - py);
        if (!best || d < best.d) best = { x, y, d };
      }
    }
    if (!best) {
      this.toastNow("The Index finds nothing. The well is quiet.");
      return;
    }
    this.indexMark = { x: best.x, y: best.y };
    const t = this.world.get(best.x, best.y);
    this.toastNow(t === T.ART_WELL ? "Index: a Well Seal." : "Index: a Wellheart.");
    this.toastT = 4;
  }

  chorusSell(): number {
    if (this.player.upgrades.resonator < 3) {
      this.toastNow("No Chorus fitted.");
      return 0;
    }
    if (this.chorusUsed) {
      this.toastNow("The Chorus already sang this descent.");
      return 0;
    }
    if (this.atSurface()) {
      this.toastNow("On the pad, use the Exchange.");
      return 0;
    }
    const v = cargoValue(this.player.cargo.filter((c) => !isRelic(c)));
    if (v <= 0) {
      this.toastNow(this.carryingSeal() ? "The Chorus will not sing the Seal." : "Hold is empty.");
      return 0;
    }
    const paid = Math.round(v * 0.85);
    this.player.money += paid;
    this.player.cargo = this.player.cargo.filter((c) => isRelic(c));
    this.chorusUsed = true;
    this.toastNow(`Chorus sold the haul for $${paid.toLocaleString()} (85%).`);
    this.toastT = 3.4;
    return paid;
  }

  presentSeal(): boolean {
    if (!this.atSurface()) {
      this.toastNow("The Lattice is on the pad.");
      return false;
    }
    const i = this.player.cargo.findIndex((c) => isRelic(c));
    if (i < 0) {
      this.toastNow("No Seal in the hopper.");
      return false;
    }
    this.player.cargo.splice(i, 1);
    this.player.money += WIN_BOUNTY;
    this.won = true;
    this.wonCount += 1;
    this.burst(this.player.x, this.player.y, 48, "#ffe8a8", 200);
    this.burst(this.player.x, this.player.y, 28, "#9aa4b2", 140);
    this.trauma = Math.min(1, this.trauma + 0.4);
    this.toastNow("The well is sealed. CC33 files the claim.");
    this.toastT = 5;
    return true;
  }

  forgeKilnOffering(): void {
    const p = this.player;
    for (const slot of BASE_SLOTS) {
      p.upgrades[slot] = Math.min(KILN_BASE_MAX, UPGRADES[slot].length - 1);
    }
    for (const slot of KILN_MODULE_SLOTS) {
      p.upgrades[slot] = UPGRADES[slot].length - 1;
    }
    p.fuel = this.maxFuel();
    p.hull = this.maxHull();
    p.money = Math.max(p.money, 1_000_000);
    for (const id of ["dynamite", "fuelCan", "nanobots", "teleporter", "hellcharge", "coolant"] as ConsumableId[]) {
      p.items[id] = Math.max(p.items[id], 9);
    }
    this.hellUnlocked = true;
    this.hellSeen = 3;
    this.bestDepth = Math.max(this.bestDepth, HELL_3);
    this.burst(p.x, p.y, 40, "#ff6a3a", 170);
    this.burst(p.x, p.y, 22, "#ffe8a8", 110);
    this.trauma = Math.min(1, this.trauma + 0.65);
    this.toastNow("Kiln 33 answers. Heartbit fitted. The well is open.");
  }

  sellAll(rate = 1): number {
    const keep = this.player.cargo.filter((c) => isRelic(c));
    const sell = this.player.cargo.filter((c) => !isRelic(c));
    const v = cargoValue(sell);
    if (v <= 0) {
      if (keep.length) this.toastNow("The Seal is not for sale. Take it to the Lattice.");
      return 0;
    }
    const assayed = this.player.upgrades.resonator >= 2 && rate >= 1 ? 1.15 : 1;
    const paid = Math.round(v * rate * assayed);
    this.player.money += paid;
    this.player.cargo = keep;
    return paid;
  }

  useCoolant(): void {
    if (this.player.items.coolant <= 0) {
      this.toastNow("No coolant shots.");
      return;
    }
    this.player.items.coolant -= 1;
    this.coolantT = 12;
    this.toastNow("Coolant flooding the cab.");
  }

  buyUpgrade(slot: Slot, shop: ShopId = "rigworks"): boolean {
    const i = this.player.upgrades[slot];
    const next = UPGRADES[slot][i + 1];
    if (!next) return false;
    const isBase = (BASE_SLOTS as readonly string[]).includes(slot);
    const isLattice = (LATTICE_SLOTS as readonly string[]).includes(slot);
    if (shop === "rigworks") {
      if (!isBase || i >= RIGWORKS_MAX) return false;
    } else if (shop === "kiln") {
      if (!this.hellUnlocked) return false;
      if (isBase && (i < RIGWORKS_MAX || i >= KILN_BASE_MAX)) return false;
      if (!isBase && !(KILN_MODULE_SLOTS as readonly string[]).includes(slot)) return false;
    } else if (shop === "lattice") {
      if (!latticeUnlocked(this.hellSeen)) return false;
      const isApex = (APEX_SLOTS as readonly string[]).includes(slot);
      if (slot === "hull") {
        if (i !== KILN_BASE_MAX) return false;
      } else if (isApex) {
        if (!this.won) {
          this.toastNow("Afteriron waits on a sealed well.");
          return false;
        }
      } else if (!isLattice) return false;
      if (slot === "cipher" && i === 2 && this.sealsFound < 1) {
        this.toastNow("The Index wants a Well Seal's memory. Find one in Heartfire first.");
        return false;
      }
    } else {
      return false;
    }
    if (this.player.money < next.cost) return false;
    this.player.money -= next.cost;
    this.player.upgrades[slot] = i + 1;
    if (slot === "tank") this.player.fuel = this.maxFuel();
    if (slot === "hull") this.player.hull = this.maxHull();
    if (slot === "hook") this.hookLeft = hookCharges(this.player.upgrades.hook);
    return true;
  }

  fillFuel(): boolean {
    const need = this.maxFuel() - this.player.fuel;
    if (need <= 0.05) return false;
    const cost = Math.ceil(need * FUEL_PRICE);
    const can = Math.min(cost, this.player.money);
    if (can <= 0) return false;
    const units = can / FUEL_PRICE;
    this.player.money -= can;
    this.player.fuel = Math.min(this.maxFuel(), this.player.fuel + units);
    return true;
  }

  repairHull(): boolean {
    const need = this.maxHull() - this.player.hull;
    if (need <= 0.05) return false;
    const cost = Math.ceil(need * HULL_PRICE);
    const can = Math.min(cost, this.player.money);
    if (can <= 0) return false;
    const hp = can / HULL_PRICE;
    this.player.money -= can;
    this.player.hull = Math.min(this.maxHull(), this.player.hull + hp);
    return true;
  }

  buyItem(id: ConsumableId, shop: ShopId = "depot"): boolean {
    const c = CONSUMABLES[id];
    if (c.shop !== shop) return false;
    if (this.player.money < c.cost) return false;
    this.player.money -= c.cost;
    this.player.items[id] += 1;
    return true;
  }

  solidAt(x: number, y: number): boolean {
    const t = this.world.get(x, y);
    if (!isSolid(t)) return false;
    if (
      this.phaseWalkT > 0 &&
      t !== T.CORE &&
      t !== T.BEDROCK &&
      t !== T.PAD &&
      !isLava(t)
    ) {
      return false;
    }
    return true;
  }

  collideAxis(dt: number, axis: "x" | "y"): void {
    const p = this.player;
    const hw = 11;
    const hh = 12;
    const nx = p.x + (axis === "x" ? p.vx * dt : 0);
    const ny = p.y + (axis === "y" ? p.vy * dt : 0);
    const left = nx - hw;
    const right = nx + hw;
    const top = ny - hh;
    const bot = ny + hh;
    const x0 = Math.floor(left / TILE);
    const x1 = Math.floor(right / TILE);
    const y0 = Math.floor(top / TILE);
    const y1 = Math.floor(bot / TILE);

    let hit: { x: number; y: number } | null = null;
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (!this.solidAt(tx, ty)) continue;
        const ts = tx * TILE;
        const tt = ty * TILE;
        const overlapX = Math.min(right, ts + TILE) - Math.max(left, ts);
        const overlapY = Math.min(bot, tt + TILE) - Math.max(top, tt);
        if (overlapX > 0 && overlapY > 0) {
          if (!hit) hit = { x: tx, y: ty };
          else {
            const pcx = p.x;
            const pcy = p.y;
            const d0 = Math.hypot((hit.x + 0.5) * TILE - pcx, (hit.y + 0.5) * TILE - pcy);
            const d1 = Math.hypot((tx + 0.5) * TILE - pcx, (ty + 0.5) * TILE - pcy);
            if (d1 < d0) hit = { x: tx, y: ty };
          }
        }
      }
    }

    if (!hit) {
      if (axis === "x") p.x = nx;
      else p.y = ny;
      return;
    }

    if (axis === "x") {
      if (p.vx > 0) p.x = hit.x * TILE - hw - 0.01;
      else if (p.vx < 0) p.x = hit.x * TILE + TILE + hw + 0.01;
      else p.x = nx;
      const digging = Math.abs(p.vx) > 12 || Math.abs(p.moveIntentX) > 0.3;
      if (digging) this.tryDig(hit.x, hit.y, dt);
      p.vx = 0;
    } else {
      if (p.vy > 0) {
        p.y = hit.y * TILE - hh - 0.01;
        if (p.vy > 240) this.hurt((p.vy - 240) / 38, "fall");
        p.grounded = true;
        const digging = p.moveIntentY > 0.3;
        if (digging) this.tryDig(hit.x, hit.y, dt);
      } else if (p.vy < 0) {
        p.y = hit.y * TILE + TILE + hh + 0.01;
        const digging = p.moveIntentY < -0.3;
        if (digging) this.tryDig(hit.x, hit.y, dt);
      }
      p.vy = 0;
    }
  }

  step(dt: number, actions: Actions): void {
    const p = this.player;
    p.moveIntentX = actions.moveX;
    p.moveIntentY = actions.moveY;

    if (this.dead) {
      this.explodeT += dt;
      this.tickFx(dt);
      return;
    }

    if (this.toastT > 0) {
      this.toastT -= dt;
      if (this.toastT <= 0) this.toast = null;
    }

    p.invuln = Math.max(0, p.invuln - dt);
    p.flash = Math.max(0, p.flash - dt);
    this.heatPulse += dt;
    this.coolantT = Math.max(0, this.coolantT - dt);
    this.phaseSoftT = Math.max(0, this.phaseSoftT - dt);
    this.phaseSoftCd = Math.max(0, this.phaseSoftCd - dt);
    this.phaseWalkT = Math.max(0, this.phaseWalkT - dt);
    this.phaseDashCd = Math.max(0, this.phaseDashCd - dt);
    this.resonatorCd = Math.max(0, this.resonatorCd - dt);

    if (actions.dynamite) this.blast(1);
    if (actions.hellcharge) this.blast(2);
    if (actions.nullcharge) this.blast(3);
    if (actions.fuelCan) this.useFuelCan();
    if (actions.nanobots) this.useNanobots();
    if (actions.teleporter) this.teleport(false);
    if (actions.hook) this.teleport(true);
    if (actions.coolant) this.useCoolant();
    if (actions.plantNail) this.plantNail();
    if (actions.chorus) this.chorusSell();
    if (actions.veinBell) this.pingVeins();

    const speed = this.engineSpeed();
    p.grounded = false;
    p.thrusting = false;

    if (actions.moveX !== 0) p.facing = actions.moveX > 0 ? 1 : -1;
    if (Math.abs(actions.moveX) >= Math.abs(actions.moveY) && actions.moveX !== 0) p.drillDir = actions.moveX > 0 ? 1 : 3;
    else if (actions.moveY > 0) p.drillDir = 2;
    else if (actions.moveY < 0) p.drillDir = 0;
    else if (actions.drill && !this.atSurface()) p.drillDir = 2;

    const idleDrill = actions.drill && actions.moveX === 0 && actions.moveY === 0 && !this.atSurface();
    if (idleDrill) p.moveIntentY = 1;

    const onPad = this.atSurface();
    const fuelOk = p.fuel > 0;

    // horizontal
    const targetVx = actions.moveX * speed * (fuelOk || onPad ? 1 : 0.15);
    p.vx += (targetVx - p.vx) * Math.min(1, dt * 8);

    // vertical: gravity + thrust
    const grav = 520;
    const lift = this.lift();
    if (actions.moveY < -0.2 && fuelOk) {
      p.vy += -(980 + lift * 420) * dt;
      p.thrusting = true;
      p.fuel = Math.max(0, p.fuel - dt * 0.38 * (1 - lift));
    } else {
      p.vy += grav * dt;
      if (actions.moveY > 0.2 || idleDrill) p.vy += 240 * dt;
    }

    const hell = hellLevel(this.depth());
    const fuelMul = 1 + hell * 0.12;
    if (!onPad && (Math.abs(actions.moveX) > 0.2 || p.thrusting || p.digging)) {
      p.fuel = Math.max(0, p.fuel - dt * 0.22 * fuelMul);
    }

    p.vy = Math.max(-360, Math.min(420, p.vy));
    p.vx = Math.max(-speed * 1.15, Math.min(speed * 1.15, p.vx));

    this.collideAxis(dt, "x");
    this.collideAxis(dt, "y");

    if (this.player.upgrades.phase >= 3 && this.phaseWalkT <= 0 && this.phaseDashCd <= 0 && actions.drill && p.fuel > 12) {
      const dir = p.drillDir;
      const ox = dir === 1 ? 1 : dir === 3 ? -1 : 0;
      const oy = dir === 2 ? 1 : dir === 0 ? -1 : 0;
      const face = this.world.get(this.tileX() + ox, this.tileY() + oy);
      if (isSolid(face) && face !== T.CORE && face !== T.BEDROCK && face !== T.PAD && !isLava(face)) {
        this.phaseWalkT = 0.35;
        this.phaseDashCd = 10;
        p.fuel = Math.max(0, p.fuel - 12);
        p.flash = 0.22;
        this.toastNow("Null interval.");
      }
    }

    if (actions.drill) {
      const dir = p.drillDir;
      const ox = dir === 1 ? 1 : dir === 3 ? -1 : 0;
      const oy = dir === 2 ? 1 : dir === 0 ? -1 : 0;
      const tx = this.tileX() + ox;
      const ty = this.tileY() + oy;
      if (this.world.get(tx, ty) !== T.PAD) this.tryDig(tx, ty, dt);
    }

    // stay in world
    p.x = Math.max(TILE + 12, Math.min((WORLD_W - 1) * TILE - 12, p.x));
    p.y = Math.max(8, Math.min((WORLD_H - 1) * TILE - 12, p.y));

    if (!p.digging) {
      /* idle */
    } else {
      const t = this.world.get(p.digging.x, p.digging.y);
      if (!isSolid(t)) p.digging = null;
    }

    // gas adjacency
    const tx = this.tileX();
    const ty = this.tileY();
    let gas = false;
    let lava = false;
    let hellLava = false;
    for (let y = ty - 1; y <= ty + 1; y++) {
      for (let x = tx - 1; x <= tx + 1; x++) {
        const t = this.world.get(x, y);
        if (t === T.GAS) gas = true;
        if (t === T.LAVA) lava = true;
        if (t === T.HELL_LAVA) hellLava = true;
      }
    }
    if (gas) this.hurt(dt * 7.5, "gas");
    const siphon = p.upgrades.siphon;
    if (lava) {
      if (siphon >= 1) {
        p.fuel = Math.min(this.maxFuel(), p.fuel + dt * 5.5);
        this.hurt(dt * 14 * 0.55, "magma");
      } else this.hurt(dt * 14, "magma");
    }
    if (hellLava) {
      if (siphon >= 1) {
        p.fuel = Math.min(this.maxFuel(), p.fuel + dt * 7);
        this.hurt(dt * 18 * 0.5, "magma");
      } else this.hurt(dt * 18, "magma");
    }

    const d = this.depth();
    if (d > this.bestDepth) this.bestDepth = d;

    const layer = hellLevel(d);
    if (layer > 0 && this.coolantT <= 0) {
      if (siphon >= 2) p.fuel = Math.min(this.maxFuel(), p.fuel + dt * HEAT_DPS[layer] * 0.4);
      if (siphon >= 3 && layer === 3) {
        p.fuel = Math.min(this.maxFuel(), p.fuel + dt * HEAT_DPS[3] * 0.55);
        this.hurt(dt * HEAT_DPS[3] * 0.22, "heat");
      } else {
        this.hurt(dt * HEAT_DPS[layer], "heat");
      }
    }
    if (layer > this.hellSeen) {
      this.hellSeen = layer;
      if (layer === 1) {
        this.hellUnlocked = true;
        this.toastNow("Emberward breached. The Kiln has unsealed on the pad.");
        this.toastT = 4.2;
      } else if (layer === 2) {
        this.toastNow("Brimdeep. Heat climbs. The veins pay for it.");
        this.toastT = 3.4;
      } else {
        this.toastNow("Heartfire. The Lattice unseals on the pad.");
        this.toastT = 4.2;
      }
    }

    if (p.upgrades.resonator >= 1 && this.resonatorCd <= 0) {
      this.resonatorCd = 7;
      this.pingVeins(false);
    }
    if (p.upgrades.cipher >= 3 && !this.indexUsed && layer >= 3) this.markIndex();

    if (p.fuel <= 0 && !onPad) {
      this.kill("fuel");
    }

    if (p.thrusting && Math.random() < 0.5) {
      this.addParticle({
        x: p.x,
        y: p.y + 12,
        vx: (Math.random() - 0.5) * 30,
        vy: 40 + Math.random() * 40,
        life: 0.28,
        size: 2,
        color: "#e8a070",
        g: -10,
      });
    }

    this.tickFx(dt);
  }

  tickFx(dt: number): void {
    this.trauma = Math.max(0, this.trauma - dt * 1.8);
    for (const q of this.particles) {
      q.life -= dt;
      q.vy += q.g * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
    }
    this.particles = this.particles.filter((q) => q.life > 0);
    for (const f of this.floaters) {
      f.life -= dt;
      f.y -= 28 * dt;
    }
    this.floaters = this.floaters.filter((f) => f.life > 0);
  }
}

export function newRun(seed: number): { world: World; player: Player } {
  const world = new World(seed);
  const player = spawnPlayer(defaultUpgrades(), defaultItems(), 0);
  return { world, player };
}
