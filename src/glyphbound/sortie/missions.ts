import { BEATS, progressOf } from "./beats";
import { COAST_PATH, GUTTER_PATH, PRESS_PATH, SLUG_PATH, SORTS_PATH } from "./landmarks";
import type { PathPoint } from "./path";
import type { EnemyKind, FormName, PickupKind, SortieState } from "./sim";
import type { BiomeId } from "./terrain";

export interface MissionDef {
  id: string;
  roman: string;
  name: string;
  blurb: string;
  biome: BiomeId;
  corridor: boolean;
  path: PathPoint[];
  medal: number;
  win: EnemyKind | "aces";
  next: string[];
}

export const MISSIONS: MissionDef[] = [
  {
    id: "coast",
    roman: "I",
    name: "Exchange Coast",
    blurb: "Sea, canyon, type-city, seven n-arches. Scale on the plaza.",
    biome: "coast",
    corridor: true,
    path: COAST_PATH,
    medal: 80,
    win: "mech",
    next: ["sorts", "ice"],
  },
  {
    id: "sorts",
    roman: "II",
    name: "The Sorts",
    blurb: "Shoot the type-metal. Brake the crushers. Seven rings warp.",
    biome: "sorts",
    corridor: true,
    path: SORTS_PATH,
    medal: 70,
    win: "mothership",
    next: ["slug"],
  },
  {
    id: "slug",
    roman: "III",
    name: "Slug Field",
    blurb: "Brake the slugs. Thread seven gold rings. Bomber in the bowl.",
    biome: "slug",
    corridor: true,
    path: SLUG_PATH,
    medal: 60,
    win: "bomber",
    next: ["gutter"],
  },
  {
    id: "gutter",
    roman: "IV",
    name: "Gutter Refinery",
    blurb: "Stay in the ink. Through the tanker. Belly, then core.",
    biome: "gutter",
    corridor: true,
    path: GUTTER_PATH,
    medal: 70,
    win: "mothership",
    next: ["press"],
  },
  {
    id: "ice",
    roman: "V",
    name: "Em-Quad Ice",
    blurb: "Hold the pad. The Serifs come in threes.",
    biome: "ice",
    corridor: false,
    path: [],
    medal: 50,
    win: "aces",
    next: ["gutter"],
  },
  {
    id: "press",
    roman: "VI",
    name: "The Press",
    blurb: "Crater road. Dualis splits when the bar breaks.",
    biome: "press",
    corridor: true,
    path: PRESS_PATH,
    medal: 90,
    win: "dualis",
    next: [],
  },
];

export function missionById(id: string) {
  return MISSIONS.find((m) => m.id === id) ?? MISSIONS[0];
}

export function unlockedIds(cleared: string[], proofs: string[], forks: string[] = []) {
  const open = new Set<string>(["coast"]);
  for (const id of cleared) {
    const m = missionById(id);
    if (id === "coast") {
      open.add(proofs.includes("coast") || forks.includes("coast") ? "ice" : "sorts");
    } else if (id === "sorts") {
      open.add(forks.includes("sorts") ? "ice" : "slug");
    } else {
      for (const n of m.next) open.add(n);
    }
  }
  return open;
}

export function scriptMissionWaves(s: SortieState) {
  const sheet = BEATS[s.missionId];
  if (!sheet) return false;
  for (const b of sheet) {
    if (s.wave >= b.id) continue;
    const p = progressOf(s, b.when);
    if (p < b.t) continue;
    s.wave = b.id;
    if (b.kind === "radio" || b.kind === "check") {
      s.radio = { who: b.who ?? "s", text: b.text ?? "", until: s.t + 3 };
      if (b.kind === "check") s.hull = Math.min(6 + s.golds, s.hull + 1);
    }
    if (b.kind === "spawn" && b.ships) {
      if (s.fork && b.ships.some((sh) => sh.kind === "mothership" || sh.kind === "mech")) continue;
      const formId = s.enemyId;
      const form = (b.ships[0]?.form ?? (b.ships.length > 1 ? "v" : "guide")) as FormName;
      for (let i = 0; i < b.ships.length; i++) {
        const sh = b.ships[i];
        const flyer = sh.kind === "fighter" || sh.kind === "cork" || sh.kind === "bomber" || sh.kind === "ace";
        spawn(s, sh.kind, s.x + sh.dx, s.y + sh.dy, s.z + sh.dz, sh.hp, {
          staged: flyer,
          form: sh.form ?? form,
          formId,
          slot: i,
          armed: sh.armed,
          lead: Math.max(52, -sh.dz),
          life: 6.5,
        });
        if (sh.kind === "mech" && !s.bossAt) s.bossAt = s.t;
      }
    }
    if (b.kind === "rings" && b.rings) {
      for (const r of b.rings) {
        s.rings.push({
          id: s.enemyId++,
          x: s.x + r.dx,
          y: s.y + r.dy,
          z: s.z + r.dz,
          taken: false,
        });
      }
    }
    if (b.kind === "pickup" && b.loot) {
      s.pickups.push({
        id: s.enemyId++,
        kind: b.loot.kind as PickupKind,
        x: s.x + b.loot.dx,
        y: s.y + b.loot.dy,
        z: s.z + b.loot.dz,
        taken: false,
      });
    }
  }
  return true;
}

function spawn(
  s: SortieState,
  kind: EnemyKind,
  x: number,
  y: number,
  z: number,
  hp?: number,
  extra?: { staged?: boolean; armed?: boolean; form?: FormName; formId?: number; slot?: number; lead?: number; life?: number },
) {
  const auto =
    kind === "dualis"
      ? 18
      : kind === "mothership"
        ? 24
        : kind === "mech"
          ? 24
          : kind === "ace"
            ? 6
            : kind === "bomber"
              ? 4
              : kind === "cork"
                ? 3
                : kind === "turret"
                  ? 3
                  : kind === "aster"
                    ? 1
                    : 2;
  const armed = extra?.armed ?? (kind !== "fighter" && kind !== "cork" && kind !== "aster");
  s.enemies.push({
    id: s.enemyId++,
    kind,
    x,
    y,
    z,
    vx: 0,
    vy: 0,
    vz: 0,
    hp: hp ?? auto,
    t: 0,
    alive: true,
    staged: extra?.staged ?? true,
    armed,
    form: extra?.form,
    formId: extra?.formId,
    slot: extra?.slot ?? 0,
    lead: extra?.lead,
    life: extra?.life,
  });
}
