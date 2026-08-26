import { GameEngine } from "./engine";
import { VIEW_W } from "./types";
import type { Enemy, Player } from "./types";

const BOSS = new Set([
  "dualis",
  "tetrarch",
  "importer",
  "nullis",
  "endmark",
  "summand",
  "difference",
  "product",
  "quotient",
  "infinitum",
  "remainder",
]);

type Eng = GameEngine & {
  player: Player;
  enemies: Enemy[];
  walls: { x: number; y: number; w: number; h: number }[];
  trauma: number;
  camX: number;
  camY: number;
  updateEnemies?: (dt: number) => void;
  tickBossArena?: (e: Enemy, p: Player, dt: number) => void;
  shockwave: (e: Enemy) => void;
  stampAt: (x: number, y: number) => void;
  stampLine: (x: number, y: number, n?: number, gap?: number) => void;
  ringShot: (e: Enemy, n: number, spd: number, off?: number) => void;
  mortar: (e: Enemy, dir: number, lift: number) => void;
  fanShot: (e: Enemy, dir: number, spread: number, n: number) => void;
  shoot: (e: Enemy, dir: number, vy: number) => void;
  pullToward: (e: Enemy, p: Player, radius: number, force: number, dt: number) => void;
  spawnEnemy: (kind: Enemy["kind"], x: number, y: number) => Enemy;
  burst: (x: number, y: number, color: string, n: number, kind: string) => void;
  say: (t: string) => void;
};

const mem = new WeakMap<Enemy, { air: boolean; jump: number }>();

function state(e: Enemy) {
  let s = mem.get(e);
  if (!s) {
    s = { air: false, jump: 0 };
    mem.set(e, s);
  }
  return s;
}

function isShard(e: Enemy) {
  return (e.kind === "endmark" && e.phase >= 2) || (typeof e.name === "string" && /Arc/.test(e.name));
}

function near(eng: Eng, e: Enemy, p: Player) {
  const pad = 200;
  if (typeof eng.camX === "number") {
    return e.x + e.w > eng.camX - pad && e.x < eng.camX + VIEW_W + pad;
  }
  return Math.abs(e.x - p.x) < VIEW_W + pad;
}

function land(eng: Eng, e: Enemy, p: Player) {
  if (!near(eng, e, p)) return;
  eng.shockwave?.(e);
  eng.stampAt?.(e.x + e.w / 2, e.y + e.h - 2);
  const cx = p.x + p.w / 2;
  const fy = p.y + p.h - 4;
  switch (e.kind) {
    case "dualis":
      eng.stampLine?.(cx, fy, 3, 46);
      eng.mortar?.(e, 0.55, -1.05);
      eng.mortar?.(e, -0.55, -1.05);
      break;
    case "tetrarch":
      eng.stampLine?.(cx, fy, 4, 48);
      eng.ringShot?.(e, 4, 210);
      break;
    case "importer":
      eng.fanShot?.(e, e.facing, 0.55, 4);
      if (eng.enemies.filter((x) => x.alive).length < 14) {
        eng.enemies.push(eng.spawnEnemy("one", e.x - 36, e.y));
      }
      break;
    case "nullis":
      eng.ringShot?.(e, 8, 200);
      eng.pullToward?.(e, p, 240, 180, 0.2);
      break;
    case "endmark":
      eng.stampAt?.(cx - 84, fy);
      eng.stampAt?.(cx + 84, fy);
      eng.ringShot?.(e, 4, 140);
      break;
    case "summand":
      e.hp = Math.min(e.maxHp, e.hp + 3);
      eng.ringShot?.(e, 6, 185);
      break;
    case "difference":
      eng.walls = (eng.walls ?? []).filter((w) => Math.hypot(w.x - e.x, w.y - e.y) >= 110);
      e.vx = e.facing * 280;
      break;
    case "product":
      eng.ringShot?.(e, 8, 175);
      if (eng.enemies.filter((x) => x.kind === "radix" && x.alive).length < 4) {
        eng.enemies.push(eng.spawnEnemy("radix", e.x + 24, e.y));
        eng.enemies.push(eng.spawnEnemy("radix", e.x - 24, e.y));
      }
      break;
    case "quotient":
      eng.shoot?.(e, 1, 0);
      eng.shoot?.(e, -1, 0);
      eng.shoot?.(e, 0, 1);
      eng.shoot?.(e, 0, -1);
      eng.stampAt?.(cx, fy);
      break;
    case "infinitum":
      eng.ringShot?.(e, 10, 160, e.t);
      eng.pullToward?.(e, p, 260, 160, 0.25);
      break;
    case "remainder":
      eng.stampLine?.(cx, fy, 5, 40);
      eng.mortar?.(e, 0.7, -1.1);
      eng.mortar?.(e, -0.7, -1.1);
      eng.mortar?.(e, 0, -1.25);
      break;
    default:
      eng.stampLine?.(cx, fy, 3, 44);
      break;
  }
  eng.trauma = Math.min(1, (eng.trauma ?? 0) + 0.22);
}

function aiShard(eng: Eng, e: Enemy, p: Player, dt: number) {
  e.t += dt;
  e.aux += dt;
  e.x += Math.sin(e.t * 1.6) * 46 * dt;
  e.y += Math.cos(e.t * 2.2) * 22 * dt;
  e.facing = p.x > e.x ? 1 : -1;
  if (!e.grounded) e.vy += 900 * dt;
  e.vx *= 0.92;
  if (e.aux > 1.55) {
    e.aux = 0;
    eng.shoot?.(e, e.facing, 0.12);
  }
}

function tick(eng: Eng, e: Enemy, p: Player, dt: number) {
  if (isShard(e)) {
    if (near(eng, e, p)) aiShard(eng, e, p, dt);
    return;
  }
  if (!near(eng, e, p)) return;
  const s = state(e);
  s.jump = Math.max(0, s.jump - dt);
  const high = p.y + p.h < e.y - 18;
  const dist = Math.abs(p.x - e.x);
  const far = dist > 120 && dist < VIEW_W;
  if (e.grounded && s.jump <= 0 && (high || far)) {
    e.vy = e.kind === "endmark" || e.kind === "remainder" ? -720 : -620;
    e.vx = (p.x > e.x ? 1 : -1) * (far ? 160 : 90);
    e.grounded = false;
    s.air = true;
    s.jump = e.hp < e.maxHp * 0.4 ? 1.05 : 1.55;
    eng.burst?.(e.x + e.w / 2, e.y + e.h, "#e8d48a", 8, "dust");
  }
  if (s.air && e.grounded) {
    s.air = false;
    land(eng, e, p);
  }
  if (!e.grounded) s.air = true;
}

function patchReadableHits(proto: Eng) {
  const p = proto as Eng & {
    stampAt?: (x: number, y: number) => void;
    stampLine?: (x: number, y: number, n?: number, gap?: number) => void;
    ringShot?: (e: Enemy, n: number, spd: number, off?: number) => void;
    bullets?: { kind: string; life: number; r: number }[];
    _gbReadable?: boolean;
  };
  if (p._gbReadable) return;
  p._gbReadable = true;
  const stamp = p.stampAt;
  if (typeof stamp === "function") {
    p.stampAt = function (this: Eng & { bullets: { kind: string; life: number; r: number }[] }, x: number, y: number) {
      stamp.call(this, x, y);
      const b = this.bullets?.[this.bullets.length - 1];
      if (b && b.kind === "stamp") {
        b.life = Math.max(b.life, 1.35);
        b.r = Math.min(b.r, 18);
      }
    };
  }
  const line = p.stampLine;
  if (typeof line === "function") {
    p.stampLine = function (this: Eng, x: number, y: number, n = 3, gap = 44) {
      line.call(this, x, y, Math.min(n, 3), Math.max(gap, 64));
    };
  }
  const ring = p.ringShot;
  if (typeof ring === "function") {
    p.ringShot = function (this: Eng, e: Enemy, n: number, spd: number, off?: number) {
      ring.call(this, e, Math.min(n, 6), Math.min(spd, 155), off);
    };
  }
}

function patchShardHits(proto: Eng & { hitEnemy?: (e: Enemy, dmg: number, dir: number) => void; _gbHit?: boolean }) {
  const hit = proto.hitEnemy;
  if (typeof hit !== "function" || proto._gbHit) return;
  proto._gbHit = true;
  proto.hitEnemy = function (this: Eng, e: Enemy, dmg: number, dir: number) {
    if (e && isShard(e)) e.hurt = 0;
    return hit.call(this, e, dmg, dir);
  };
}

export function installBosses() {
  const proto = GameEngine.prototype as unknown as Eng & {
    updateEnemies?: ((dt: number) => void) & { _gbBoss?: boolean };
    hitEnemy?: (e: Enemy, dmg: number, dir: number) => void;
    _gbHit?: boolean;
  };
  patchReadableHits(proto);
  patchShardHits(proto);
  const orig = proto.updateEnemies;
  if (typeof orig !== "function" || orig._gbBoss) return;
  const wrapped = function (this: Eng, dt: number) {
    const p = this.player;
    const live = typeof this.tickBossArena !== "function";
    if (p) {
      for (const e of this.enemies) {
        if (!e.alive || !BOSS.has(e.kind)) continue;
        if (isShard(e) || !near(this, e, p)) e.aux = 0;
      }
    }
    const trauma0 = this.trauma;
    orig.call(this, dt);
    const anyNear = p && this.enemies.some((e) => e.alive && BOSS.has(e.kind) && !isShard(e) && near(this, e, p));
    if (!anyNear && this.trauma > trauma0) this.trauma = trauma0;
    if (p) {
      for (const e of this.enemies) {
        if (!e.alive || !BOSS.has(e.kind)) continue;
        if (isShard(e)) {
          if (live && near(this, e, p)) aiShard(this, e, p, dt);
          continue;
        }
        if (live) tick(this, e, p, dt);
      }
    }
  };
  wrapped._gbBoss = true;
  proto.updateEnemies = wrapped;
}
