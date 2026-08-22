import {
  BASE_SLOTS,
  BUILDINGS,
  CONSUMABLES,
  FUEL_PRICE,
  HEAT_DPS,
  HELL_1,
  HELL_3,
  HULL_PRICE,
  RIGWORKS_MAX,
  SALVAGE_RATE,
  SPAWN_TX,
  STIPEND,
  SURFACE_Y,
  T,
  TILE,
  UPGRADES,
  WORLD_H,
  WORLD_W,
  artifactById,
  cargoValue,
  crumbColor,
  defaultItems,
  defaultUpgrades,
  hardness,
  hellLevel,
  isArtifact,
  isDiggable,
  isOre,
  isSolid,
  oreById,
  oreValueAtDepth,
  type CargoItem,
  type ConsumableId,
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
  const maxFuel = UPGRADES.tank[up.tank]!.value;
  const maxHull = UPGRADES.hull[up.hull]!.value;
  return {
    x: (SPAWN_TX + 0.5) * TILE,
    y: (SURFACE_Y - 0.55) * TILE,
    vx: 0,
    vy: 0,
    fuel: maxFuel,
    hull: maxHull,
    money,
    cargo: [],
    upgrades: { ...up },
    items: { ...items },
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

  constructor(world: World, player: Player, bestDepth = 0, hellUnlocked = false) {
    this.world = world;
    this.player = player;
    this.bestDepth = bestDepth;
    this.hellUnlocked = hellUnlocked || bestDepth >= HELL_1;
    if (this.hellUnlocked) this.hellSeen = hellLevel(bestDepth) || 1;
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
    this.player = spawnPlayer(up, items, money);
    this.player.fuel = this.maxFuel() * 0.35;
    this.player.hull = this.maxHull() * 0.55;
    this.dead = false;
    this.explodeT = 0;
    this.toastNow("Rig recovered at the pad. Fuel's low.");
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
      const val = oreValueAtDepth(def, this.depth());
      this.player.cargo.push({ id: def.id, name: def.name, value: val });
      this.float(cx, cy - 10, `$${val.toLocaleString()}`, def.glow);
      this.burst(cx, cy, 10, def.glow, 90);
      this.emit.push("collect");
    } else if (isArtifact(t)) {
      const a = artifactById(t);
      if (!a) return;
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
    if (t === T.CORE) return true;
    if (t === T.BEDROCK) {
      this.toastNow("Bedrock — needs a charge.");
      return true;
    }
    if (!isDiggable(t)) return true;

    const h = hardness(t, this.depth());
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
      this.player.digging = null;
      this.trauma = Math.min(1, this.trauma + 0.08);
    }
    return true;
  }

  blast(radius = 1): void {
    const item: ConsumableId = radius > 1 ? "hellcharge" : "dynamite";
    if (this.player.items[item] <= 0) {
      this.toastNow(radius > 1 ? "No hellcharges." : "No charges left.");
      return;
    }
    this.player.items[item] -= 1;
    const tx = this.tileX();
    const ty = this.tileY();
    this.trauma = Math.min(1, this.trauma + (radius > 1 ? 0.9 : 0.7));
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
          if (a) this.player.money += a.value;
        }
      }
    }
    this.burst(this.player.x, this.player.y, radius > 1 ? 48 : 36, radius > 1 ? "#ff6a3a" : "#e8c070", 180);
    this.hurt(radius > 1 ? 5 : 3.5, "blast");
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

  teleport(): void {
    if (this.player.items.teleporter <= 0) {
      this.toastNow("No recall beacon.");
      return;
    }
    this.player.items.teleporter -= 1;
    this.player.x = (SPAWN_TX + 0.5) * TILE;
    this.player.y = (SURFACE_Y - 0.55) * TILE;
    this.player.vx = 0;
    this.player.vy = 0;
    this.burst(this.player.x, this.player.y, 20, "#7ec8c4", 100);
    this.toastNow("Snapped to the pad.");
  }

  forgeKilnOffering(): void {
    const p = this.player;
    for (const slot of Object.keys(UPGRADES) as Slot[]) {
      p.upgrades[slot] = UPGRADES[slot].length - 1;
    }
    p.fuel = this.maxFuel();
    p.hull = this.maxHull();
    p.money = Math.max(p.money, 1_000_000);
    for (const id of Object.keys(CONSUMABLES) as ConsumableId[]) {
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

  sellAll(): number {
    const v = cargoValue(this.player.cargo);
    if (v <= 0) return 0;
    this.player.money += v;
    this.player.cargo = [];
    return v;
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
    const isBase = (BASE_SLOTS as readonly Slot[]).includes(slot);
    if (shop === "rigworks") {
      if (!isBase || i >= RIGWORKS_MAX) return false;
    } else if (shop === "kiln") {
      if (!this.hellUnlocked) return false;
      if (isBase && i < RIGWORKS_MAX) return false;
    } else {
      return false;
    }
    if (this.player.money < next.cost) return false;
    this.player.money -= next.cost;
    this.player.upgrades[slot] = i + 1;
    if (slot === "tank") this.player.fuel = this.maxFuel();
    if (slot === "hull") this.player.hull = this.maxHull();
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
    return isSolid(this.world.get(x, y));
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

    if (actions.dynamite) this.blast(1);
    if (actions.hellcharge) this.blast(2);
    if (actions.fuelCan) this.useFuelCan();
    if (actions.nanobots) this.useNanobots();
    if (actions.teleporter) this.teleport();
    if (actions.coolant) this.useCoolant();

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
    if (lava) this.hurt(dt * 14, "magma");
    if (hellLava) this.hurt(dt * 18, "magma");

    const d = this.depth();
    if (d > this.bestDepth) this.bestDepth = d;

    const layer = hellLevel(d);
    if (layer > 0 && this.coolantT <= 0) {
      this.hurt(dt * HEAT_DPS[layer], "heat");
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
        this.toastNow("Heartfire. The well's last room.");
        this.toastT = 3.4;
      }
    }

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
