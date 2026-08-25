import { GameEngine } from "./engine";
import { TILE } from "./types";
import type { Enemy, Player } from "./types";

type Eng = GameEngine & {
  player: Player;
  enemies: Enemy[];
  rows: string[];
  updateEnemies?: (dt: number) => void;
  maybeLeap?: (e: Enemy, p: Player) => void;
  burst?: (x: number, y: number, color: string, n: number, kind: string) => void;
  blockedAt?: (x: number, y: number, w: number, h: number, oneWay: boolean) => boolean;
};

function leapsGaps(kind: Enemy["kind"]) {
  return kind === "one" || kind === "two" || kind === "three" || kind === "four" || kind === "seven" || kind === "triad";
}

function atLedge(eng: Eng, e: Enemy) {
  const x = e.facing > 0 ? e.x + e.w + 2 : e.x - 10;
  if (typeof eng.blockedAt === "function") return !eng.blockedAt(x, e.y + e.h + 3, 8, 8, false);
  const tx = Math.floor(x / TILE);
  const ty = Math.floor((e.y + e.h + 3) / TILE);
  const ch = eng.rows[ty]?.[tx] ?? "#";
  return ch === "." || ch === "~" || ch === "^";
}

function maybeLeap(eng: Eng, e: Enemy, p: Player) {
  if (!e.grounded || !atLedge(eng, e)) return;
  const toward = (p.x > e.x ? 1 : -1) === e.facing;
  if (leapsGaps(e.kind) && toward && Math.abs(p.x - e.x) < 230 && Math.abs(p.y - e.y) < 110) {
    const lift = e.kind === "seven" ? -520 : e.kind === "four" ? -360 : e.kind === "two" ? -430 : -460;
    e.vy = lift;
    e.vx = e.facing * (e.kind === "seven" ? 180 : e.kind === "four" ? 120 : 150);
    e.grounded = false;
    return;
  }
  e.facing = (e.facing * -1) as 1 | -1;
  e.vx = 0;
}

function hopUp(eng: Eng, e: Enemy, p: Player, cool = 1.05) {
  if (!e.grounded || e.aux < cool) return;
  if (p.y + p.h >= e.y - 4) return;
  if (Math.abs(p.x - e.x) > 160 || Math.abs(p.y - e.y) > 170) return;
  if (!leapsGaps(e.kind)) return;
  const lift = e.kind === "seven" ? -540 : e.kind === "four" ? -380 : e.kind === "two" ? -460 : -480;
  e.vy = lift;
  e.vx = (p.x > e.x ? 1 : -1) * 88;
  e.grounded = false;
  e.aux = 0;
  eng.burst?.(e.x + e.w / 2, e.y + e.h, "#d45a4a", 4, "dust");
}

export function installJumps() {
  const proto = GameEngine.prototype as unknown as Eng;
  if (typeof proto.maybeLeap === "function") return;
  const orig = proto.updateEnemies;
  if (typeof orig !== "function") return;
  proto.updateEnemies = function (this: Eng, dt: number) {
    orig.call(this, dt);
    const p = this.player;
    if (!p) return;
    for (const e of this.enemies) {
      if (!e.alive || e.stun > 0) continue;
      if (!leapsGaps(e.kind)) continue;
      maybeLeap(this, e, p);
      const cool = e.kind === "seven" ? 0.88 : e.kind === "two" ? 0.95 : e.kind === "four" ? 1.35 : 1.2;
      hopUp(this, e, p, cool);
    }
  };
}
