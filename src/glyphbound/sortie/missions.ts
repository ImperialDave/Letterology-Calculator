import type { PathPoint } from "./path";
import type { EnemyKind, SortieState } from "./sim";
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

const COAST_PATH: PathPoint[] = [
  { x: 0, y: 40, z: 420 },
  { x: 0, y: 42, z: 300 },
  { x: -40, y: 44, z: 210 },
  { x: 10, y: 46, z: 120 },
  { x: 0, y: 48, z: 20 },
];

const SLUG_PATH: PathPoint[] = [
  { x: 0, y: 50, z: 400 },
  { x: 40, y: 70, z: 260 },
  { x: -30, y: 55, z: 140 },
  { x: 20, y: 48, z: 20 },
];

const GUTTER_PATH: PathPoint[] = [
  { x: 0, y: 36, z: 400 },
  { x: 30, y: 32, z: 260 },
  { x: -20, y: 38, z: 140 },
  { x: 0, y: 44, z: 10 },
];

const PRESS_PATH: PathPoint[] = [
  { x: 0, y: 50, z: 400 },
  { x: 0, y: 46, z: 240 },
  { x: 0, y: 58, z: 80 },
  { x: 0, y: 62, z: -40 },
];

export const MISSIONS: MissionDef[] = [
  {
    id: "coast",
    roman: "I",
    name: "Exchange Coast",
    blurb: "Canyon, streets, seven arches. Scale waits on the plaza.",
    biome: "coast",
    corridor: true,
    path: COAST_PATH,
    medal: 12,
    win: "mech",
    next: ["slug", "ice"],
  },
  {
    id: "slug",
    roman: "II",
    name: "Slug Field",
    blurb: "Type-slug rocks. Thread the gold rings. Lizards in the gaps.",
    biome: "slug",
    corridor: true,
    path: SLUG_PATH,
    medal: 14,
    win: "bomber",
    next: ["gutter"],
  },
  {
    id: "gutter",
    roman: "III",
    name: "Gutter Refinery",
    blurb: "Ink ocean and stacks. Cut the mothership belly.",
    biome: "gutter",
    corridor: true,
    path: GUTTER_PATH,
    medal: 14,
    win: "mothership",
    next: ["press"],
  },
  {
    id: "ice",
    roman: "IV",
    name: "Em-Quad Ice",
    blurb: "Hold the field. The Serifs come in threes.",
    biome: "ice",
    corridor: false,
    path: [],
    medal: 14,
    win: "aces",
    next: ["gutter"],
  },
  {
    id: "press",
    roman: "V",
    name: "The Press",
    blurb: "Crater. Dualis. The count ends here.",
    biome: "press",
    corridor: true,
    path: PRESS_PATH,
    medal: 16,
    win: "dualis",
    next: [],
  },
];

export function missionById(id: string) {
  return MISSIONS.find((m) => m.id === id) ?? MISSIONS[0];
}

export function unlockedIds(cleared: string[], proofs: string[]) {
  const open = new Set<string>(["coast"]);
  for (const id of cleared) {
    const m = missionById(id);
    if (id === "coast") {
      open.add(proofs.includes("coast") ? "ice" : "slug");
    } else {
      for (const n of m.next) open.add(n);
    }
  }
  return open;
}

export function scriptMissionWaves(s: SortieState) {
  const id = s.missionId;
  if (id === "sky") return false;
  if (id === "coast") {
    if (s.wave < 1 && s.t > 1.4) {
      s.wave = 1;
    }
    if (s.flight === "allrange" && s.wave < 2) {
      spawn(s, "fighter", -50, 48, -40);
      spawn(s, "fighter", 50, 48, -40);
      spawn(s, "mech", 0, 20, -160);
      s.wave = 2;
      s.radio = { who: "s", text: "Scale on the plaza. Knees, then frill.", until: s.t + 3.5 };
    }
    return true;
  }
  if (id === "slug") {
    if (s.wave < 1 && s.t > 2) {
      spawn(s, "fighter", -30, 60, -20);
      spawn(s, "cork", 40, 70, -80);
      s.wave = 1;
    }
    if (s.flight === "allrange" && s.wave < 2) {
      spawn(s, "fighter", -80, 50, -60);
      spawn(s, "fighter", 80, 50, -60);
      spawn(s, "bomber", 0, 90, -140);
      s.wave = 2;
    }
    return true;
  }
  if (id === "gutter") {
    if (s.flight === "allrange" && s.wave < 2) {
      spawn(s, "mothership", 0, 40, -120);
      spawn(s, "fighter", -70, 50, -40);
      spawn(s, "fighter", 70, 50, -40);
      s.wave = 2;
      s.radio = { who: "e", text: "Mothership over the ink. Belly first.", until: s.t + 3.5 };
    }
    return true;
  }
  if (id === "ice") {
    if (s.wave < 1 && s.t > 1.2) {
      spawn(s, "fighter", -60, 40, -40);
      spawn(s, "fighter", 60, 40, -40);
      spawn(s, "fighter", 0, 45, -90);
      s.wave = 1;
      s.radio = { who: "b", text: "Hold the field. Green is ours.", until: s.t + 3 };
    }
    if (s.wave < 2 && s.t > 22) {
      spawn(s, "ace", -40, 55, -160);
      spawn(s, "ace", 40, 55, -160);
      spawn(s, "ace", 0, 62, -200);
      s.wave = 2;
      s.radio = { who: "s", text: "The Serifs. Three aces.", until: s.t + 3.5 };
    }
    return true;
  }
  if (id === "press") {
    if (s.flight === "allrange" && s.wave < 2) {
      spawn(s, "fighter", -50, 60, -80);
      spawn(s, "bomber", 50, 80, -80);
      spawn(s, "dualis", 0, 70, -180);
      s.wave = 2;
      s.radio = { who: "s", text: "Dualis over the Press. Hit the bar.", until: s.t + 4 };
    }
    return true;
  }
  return false;
}

function spawn(s: SortieState, kind: EnemyKind, x: number, y: number, z: number) {
  const hp =
    kind === "dualis" ? 18 : kind === "mothership" ? 22 : kind === "mech" ? 16 : kind === "ace" ? 6 : kind === "bomber" ? 4 : 2;
  s.enemies.push({
    id: s.enemyId++,
    kind,
    x,
    y,
    z,
    vx: 0,
    vy: 0,
    vz: 0,
    hp,
    t: 0,
    alive: true,
  });
}
