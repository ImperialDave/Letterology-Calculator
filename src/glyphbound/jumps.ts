import { GameEngine } from "./engine";
import type { Enemy, Player } from "./types";
import { isWalker, tryLocomote, type MoveWorld } from "./enemy-move";

type Eng = GameEngine & {
  player: Player;
  enemies: Enemy[];
  updateEnemies?: (dt: number) => void;
  maybeLeap?: (e: Enemy, p: Player) => void;
  burst?: (x: number, y: number, color: string, n: number, kind: string) => void;
  blockedAt?: (x: number, y: number, w: number, h: number, oneWay: boolean) => boolean;
  hazardAt?: (x: number, y: number, w: number, h: number) => boolean;
};

function asWorld(eng: Eng): MoveWorld {
  return {
    blockedAt: (x, y, w, h, large) => (typeof eng.blockedAt === "function" ? eng.blockedAt(x, y, w, h, large) : false),
    hazardAt: (x, y, w, h) => (typeof eng.hazardAt === "function" ? eng.hazardAt(x, y, w, h) : false),
    burst: (x, y, color, n, kind) => eng.burst?.(x, y, color, n, kind),
  };
}

export function installJumps() {
  const proto = GameEngine.prototype as unknown as Eng;
  if (typeof proto.maybeLeap === "function") return;
  const orig = proto.updateEnemies;
  if (typeof orig !== "function") return;
  proto.maybeLeap = function (this: Eng, e: Enemy, p: Player) {
    tryLocomote(asWorld(this), e, p, 0);
  };
  proto.updateEnemies = function (this: Eng, dt: number) {
    orig.call(this, dt);
    const p = this.player;
    if (!p) return;
    const world = asWorld(this);
    for (const e of this.enemies) {
      if (!e.alive || e.stun > 0) continue;
      if (!isWalker(e.kind)) continue;
      tryLocomote(world, e, p, dt);
    }
  };
}
