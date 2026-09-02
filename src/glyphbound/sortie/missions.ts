import { BEATS, far, progressOf } from "./beats";
import { COAST_PATH, GUTTER_PATH, PRESS_PATH, SLUG_PATH, SORTS_PATH } from "./landmarks";
import type { PathPoint } from "./path";
import type { EnemyKind, FormName, PickupKind, SortieState } from "./sim";
import type { BiomeId } from "./terrain";

export interface MissionDef {
  id: string;
  roman: string;
  name: string;
  blurb: string;
  brief: string;
  debrief: string;
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
    brief:
      "Gale has the wind. The Coast is the first clause — sea, canyon, type-city. Seven n-arches complete a letter. Scale is Dualis’s first stamp, waiting on the plaza. Write this page before it is filed.",
    debrief: "The Coast holds. Dualis missed a clause. Sorts is the filing room. Ice is the stock he froze. The fork is yours.",
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
    brief:
      "Well: this is where Dualis sorts type. Small metal dies to a tap. Crushers do not. Three holes pay. Seven rings warp you off the page. Miss a ring and the quoin — his binding press — stays to lie to you.",
    debrief: "The Sorts are a remainder. Warp or quoin, the slug field still opens. Dualis has fewer drawers.",
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
    brief:
      "Brace: lead slugs. The big ones are type that has already been melted. Brake. Seven gold rings are letters Dualis has not spent. The bomber in the bowl is how he ships the rest.",
    debrief: "The slugs are remainder. The gutter is still wet. Dualis is running out of ink, not of will.",
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
    brief:
      "Well: the gutter is the Press’s overflow. Stay in the ink — the lights above bite. Through the tanker. The mothership is a press that has not yet closed. Belly, then core. Dualis can hear this page turning.",
    debrief: "The gutter is dry. One ledger left. Dualis is the last digit.",
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
    brief:
      "Brace: Dualis froze the unused stock. Hold the green pad — that ground is still a letter. The Serifs are his proofreaders. They come in threes. Do not let them file you.",
    debrief: "The Serifs are remainder. Unused letters thaw. The gutter still inks.",
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
    brief:
      "Gale: crater road, then Dualis. He is a bar that thinks it is a period. Hit it until it splits. The Dominion ends when the last digit falls. c — write the last sentence.",
    debrief: "The Press is clear. Dualis is a remainder. The sky is letters again. Willingness, not fate, turned the page.",
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
        const push = flyer || sh.kind === "aster" || sh.kind === "turret";
        spawn(s, sh.kind, s.x + sh.dx, s.y + sh.dy, s.z + (push ? far(sh.dz) : sh.dz), sh.hp, {
          staged: flyer,
          form: sh.form ?? form,
          formId,
          slot: i,
          armed: sh.armed,
          lead: Math.max(180, -sh.dz),
          life: 12,
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
