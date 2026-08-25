import { GameEngine } from "./engine";
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

function land(eng: Eng, e: Enemy, p: Player) {
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
      eng.stampLine?.(cx, fy, 5, 42);
      eng.ringShot?.(e, 8, 190);
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
  eng.trauma = Math.min(1, (eng.trauma ?? 0) + 0.35);
}

function tick(eng: Eng, e: Enemy, p: Player, dt: number) {
  const s = state(e);
  s.jump = Math.max(0, s.jump - dt);
  const high = p.y + p.h < e.y - 18;
  const far = Math.abs(p.x - e.x) > 120;
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

export function installBosses() {
  const proto = GameEngine.prototype as unknown as Eng;
  if (typeof proto.tickBossArena === "function") return;
  const orig = proto.updateEnemies;
  if (typeof orig !== "function") return;
  proto.updateEnemies = function (this: Eng, dt: number) {
    orig.call(this, dt);
    const p = this.player;
    if (!p) return;
    for (const e of this.enemies) {
      if (!e.alive || !BOSS.has(e.kind)) continue;
      tick(this, e, p, dt);
    }
  };
}
