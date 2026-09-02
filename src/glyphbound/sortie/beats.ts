import type { EnemyKind, FormName, PickupKind, SortieState } from "./sim";

export interface Beat {
  id: number;
  when: "rail" | "arena";
  t: number;
  kind: "spawn" | "radio" | "pickup" | "check" | "rings";
  who?: string;
  text?: string;
  ships?: { kind: EnemyKind; dx: number; dy: number; dz: number; hp?: number; form?: FormName; armed?: boolean }[];
  loot?: { kind: PickupKind; dx: number; dy: number; dz: number };
  rings?: { dx: number; dy: number; dz: number }[];
}

function rocks(dz: number, n = 8): Beat["ships"] {
  return Array.from({ length: n }, (_, i) => ({
    kind: "aster" as const,
    dx: ((i % 4) - 1.5) * 24 + (i % 3) * 5,
    dy: (i % 5) * 9 - 14,
    dz: dz - Math.floor(i / 4) * 30,
    hp: i % 6 === 0 ? 12 : 1,
  }));
}

function V(dz: number, spread = 16): Beat["ships"] {
  return [
    { kind: "fighter", dx: 0, dy: 4, dz, form: "v" },
    { kind: "fighter", dx: -spread, dy: 2, dz: dz + 14, form: "v" },
    { kind: "fighter", dx: spread, dy: 2, dz: dz + 14, form: "v" },
  ];
}

function Cross(dz: number): Beat["ships"] {
  return [
    { kind: "fighter", dx: -22, dy: 4, dz, form: "cross" },
    { kind: "fighter", dx: 22, dy: 4, dz: dz + 8, form: "cross" },
    { kind: "fighter", dx: -22, dy: 8, dz: dz + 16, form: "cross" },
    { kind: "fighter", dx: 22, dy: 8, dz: dz + 24, form: "cross" },
  ];
}

function Line(dz: number): Beat["ships"] {
  return [
    { kind: "fighter", dx: -18, dy: 2, dz, form: "line" },
    { kind: "fighter", dx: 0, dy: 5, dz: dz + 6, form: "line" },
    { kind: "fighter", dx: 18, dy: 2, dz: dz + 12, form: "line" },
  ];
}

function rockRing(dz: number, r = 26, n = 8): Beat["ships"] {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return {
      kind: "aster" as const,
      dx: Math.cos(a) * r,
      dy: Math.sin(a) * r * 0.65,
      dz,
      hp: 1,
    };
  });
}

export const BEATS: Record<string, Beat[]> = {
  coast: [
    { id: 1, when: "rail", t: 0.03, kind: "radio", who: "s", text: "Ink sea. Tap Space. Hold to charge." },
    { id: 2, when: "rail", t: 0.04, kind: "spawn", ships: [{ kind: "fighter", dx: 0, dy: 2, dz: -36, form: "guide" }] },
    { id: 3, when: "rail", t: 0.08, kind: "spawn", ships: V(-50, 18) },
    { id: 4, when: "rail", t: 0.12, kind: "radio", who: "b", text: "Canyon. Brake. Turrets on the teeth." },
    { id: 5, when: "rail", t: 0.14, kind: "spawn", ships: [{ kind: "turret", dx: 28, dy: -20, dz: -30 }, { kind: "turret", dx: -28, dy: -20, dz: -48 }] },
    { id: 6, when: "rail", t: 0.18, kind: "spawn", ships: [{ kind: "fighter", dx: -12, dy: 6, dz: -40, form: "guide" }, { kind: "fighter", dx: 12, dy: 6, dz: -40, form: "guide" }] },
    { id: 7, when: "rail", t: 0.22, kind: "pickup", loot: { kind: "silver", dx: 0, dy: 2, dz: -24 } },
    { id: 8, when: "rail", t: 0.28, kind: "radio", who: "s", text: "Type city. Between the blocks." },
    { id: 9, when: "rail", t: 0.3, kind: "spawn", ships: Cross(-44) },
    { id: 10, when: "rail", t: 0.34, kind: "spawn", ships: [{ kind: "mech", dx: -40, dy: -8, dz: -50, hp: 6 }, { kind: "mech", dx: 40, dy: -8, dz: -70, hp: 6 }] },
    { id: 11, when: "rail", t: 0.36, kind: "spawn", ships: [{ kind: "fighter", dx: -8, dy: 6, dz: -42, form: "guide" }, { kind: "fighter", dx: 18, dy: 8, dz: -55, form: "guide" }] },
    { id: 12, when: "rail", t: 0.38, kind: "spawn", ships: [{ kind: "fighter", dx: 0, dy: 10, dz: -36 }, { kind: "cork", dx: 30, dy: 12, dz: -55 }] },
    { id: 13, when: "rail", t: 0.42, kind: "pickup", loot: { kind: "stem", dx: -8, dy: 4, dz: -20 } },
    { id: 14, when: "rail", t: 0.48, kind: "check", who: "e", text: "Checkpoint. s is jumped — cut them." },
    { id: 15, when: "rail", t: 0.5, kind: "spawn", ships: Line(-34) },
    { id: 16, when: "rail", t: 0.55, kind: "radio", who: "s", text: "Seven n-arches. Follow the water." },
    { id: 17, when: "rail", t: 0.58, kind: "spawn", ships: [{ kind: "fighter", dx: 24, dy: 8, dz: -40, form: "guide" }, { kind: "fighter", dx: -24, dy: 8, dz: -52, form: "guide" }] },
    { id: 18, when: "rail", t: 0.64, kind: "pickup", loot: { kind: "gold", dx: 0, dy: 2, dz: -20 } },
    { id: 19, when: "rail", t: 0.68, kind: "spawn", ships: [{ kind: "bomber", dx: 0, dy: 18, dz: -48 }, { kind: "cork", dx: 32, dy: 10, dz: -36 }] },
    { id: 20, when: "rail", t: 0.74, kind: "radio", who: "b", text: "Dip the lintel if you want the gorge." },
    { id: 21, when: "rail", t: 0.8, kind: "spawn", ships: [{ kind: "bomber", dx: -16, dy: 14, dz: -40 }, { kind: "bomber", dx: 16, dy: 14, dz: -40 }] },
    { id: 22, when: "rail", t: 0.88, kind: "spawn", ships: V(-42, 20) },
    { id: 23, when: "arena", t: 0.4, kind: "radio", who: "s", text: "Scale on the plaza. Knees, then frill, then core." },
    { id: 24, when: "arena", t: 0.6, kind: "spawn", ships: [{ kind: "fighter", dx: -50, dy: 8, dz: -40 }, { kind: "fighter", dx: 50, dy: 8, dz: -40 }, { kind: "mech", dx: 0, dy: -20, dz: -160, hp: 24 }] },
  ],
  slug: [
    { id: 1, when: "rail", t: 0.06, kind: "radio", who: "b", text: "Slugs. Brake for the big ones." },
    { id: 2, when: "rail", t: 0.08, kind: "spawn", ships: [{ kind: "fighter", dx: -20, dy: 6, dz: -40 }, { kind: "cork", dx: 24, dy: 10, dz: -55 }] },
    { id: 3, when: "rail", t: 0.18, kind: "spawn", ships: V(-48) },
    { id: 4, when: "rail", t: 0.28, kind: "radio", who: "s", text: "Seven gold rings. Thread them." },
    { id: 5, when: "rail", t: 0.4, kind: "spawn", ships: [{ kind: "cork", dx: -30, dy: 12, dz: -36 }, { kind: "cork", dx: 30, dy: 12, dz: -50 }] },
    { id: 6, when: "rail", t: 0.52, kind: "pickup", loot: { kind: "gold", dx: 0, dy: 4, dz: -24 } },
    { id: 7, when: "rail", t: 0.62, kind: "spawn", ships: [{ kind: "bomber", dx: 0, dy: 20, dz: -44 }, { kind: "fighter", dx: -18, dy: 4, dz: -30 }] },
    { id: 8, when: "rail", t: 0.78, kind: "spawn", ships: V(-40, 22) },
    { id: 9, when: "arena", t: 0.5, kind: "spawn", ships: [{ kind: "bomber", dx: 0, dy: 24, dz: -120 }, { kind: "fighter", dx: -70, dy: 6, dz: -50 }, { kind: "fighter", dx: 70, dy: 6, dz: -50 }] },
    { id: 10, when: "arena", t: 0.7, kind: "radio", who: "s", text: "Bowl nest. Cut the bomber." },
  ],
  gutter: [
    { id: 1, when: "rail", t: 0.08, kind: "radio", who: "e", text: "Stay in the ink. Lights above bite." },
    { id: 2, when: "rail", t: 0.1, kind: "spawn", ships: [{ kind: "turret", dx: 40, dy: -12, dz: -36 }, { kind: "turret", dx: -40, dy: -12, dz: -50 }] },
    { id: 3, when: "rail", t: 0.22, kind: "spawn", ships: V(-44) },
    { id: 4, when: "rail", t: 0.36, kind: "radio", who: "s", text: "Tanker. Through the hold." },
    { id: 5, when: "rail", t: 0.48, kind: "pickup", loot: { kind: "bomb", dx: 0, dy: 2, dz: -18 } },
    { id: 6, when: "rail", t: 0.58, kind: "spawn", ships: [{ kind: "cork", dx: 28, dy: 10, dz: -40 }, { kind: "fighter", dx: -22, dy: 4, dz: -32 }] },
    { id: 7, when: "rail", t: 0.74, kind: "spawn", ships: V(-42, 20) },
    { id: 8, when: "arena", t: 0.5, kind: "spawn", ships: [{ kind: "mothership", dx: 0, dy: 0, dz: -120 }, { kind: "fighter", dx: -70, dy: 8, dz: -40 }, { kind: "fighter", dx: 70, dy: 8, dz: -40 }] },
    { id: 9, when: "arena", t: 0.7, kind: "radio", who: "e", text: "Belly first. Then the core." },
  ],
  ice: [
    { id: 1, when: "arena", t: 1.2, kind: "radio", who: "b", text: "Hold the pad. Green is ours." },
    { id: 2, when: "arena", t: 1.4, kind: "spawn", ships: V(-70, 28) },
    { id: 3, when: "arena", t: 8, kind: "spawn", ships: [{ kind: "fighter", dx: -80, dy: 6, dz: 40 }, { kind: "fighter", dx: 80, dy: 6, dz: 40 }, { kind: "fighter", dx: 0, dy: 8, dz: -90 }] },
    { id: 4, when: "arena", t: 16, kind: "pickup", loot: { kind: "repair", dx: 0, dy: 6, dz: 20 } },
    { id: 5, when: "arena", t: 22, kind: "radio", who: "s", text: "The Serifs. Three aces." },
    { id: 6, when: "arena", t: 22.4, kind: "spawn", ships: [{ kind: "ace", dx: -40, dy: 12, dz: -160 }, { kind: "ace", dx: 40, dy: 12, dz: -160 }, { kind: "ace", dx: 0, dy: 16, dz: -200 }] },
  ],
  press: [
    { id: 1, when: "rail", t: 0.08, kind: "radio", who: "b", text: "Crater road. Censers pay if you thread them." },
    { id: 2, when: "rail", t: 0.12, kind: "spawn", ships: [{ kind: "turret", dx: 30, dy: -8, dz: -36 }, { kind: "fighter", dx: 0, dy: 8, dz: -48 }] },
    { id: 3, when: "rail", t: 0.28, kind: "spawn", ships: V(-44) },
    { id: 4, when: "rail", t: 0.48, kind: "spawn", ships: [{ kind: "bomber", dx: 0, dy: 20, dz: -50 }, { kind: "cork", dx: 24, dy: 10, dz: -36 }] },
    { id: 5, when: "rail", t: 0.68, kind: "spawn", ships: V(-40, 18) },
    { id: 6, when: "arena", t: 0.6, kind: "spawn", ships: [{ kind: "dualis", dx: 0, dy: 20, dz: -180 }, { kind: "fighter", dx: -50, dy: 12, dz: -80 }, { kind: "bomber", dx: 50, dy: 22, dz: -80 }] },
    { id: 7, when: "arena", t: 0.8, kind: "radio", who: "s", text: "Dualis. Hit the bar until it splits." },
  ],
  sorts: [
    { id: 1, when: "rail", t: 0.03, kind: "radio", who: "s", text: "The Sorts. Shoot the small type. Brake the crushers." },
    { id: 2, when: "rail", t: 0.04, kind: "spawn", ships: rocks(-50, 10) },
    { id: 3, when: "rail", t: 0.08, kind: "radio", who: "e", text: "Three rings of sorts. The hole pays." },
    { id: 4, when: "rail", t: 0.09, kind: "spawn", ships: rockRing(-40, 24, 8) },
    { id: 5, when: "rail", t: 0.14, kind: "spawn", ships: rockRing(-42, 26, 8) },
    { id: 6, when: "rail", t: 0.19, kind: "spawn", ships: rockRing(-44, 22, 9) },
    { id: 7, when: "rail", t: 0.2, kind: "pickup", loot: { kind: "stem", dx: 0, dy: 0, dz: -44 } },
    { id: 8, when: "rail", t: 0.24, kind: "spawn", ships: V(-48, 20) },
    { id: 9, when: "rail", t: 0.3, kind: "radio", who: "b", text: "Big sort ahead. Go high or brake." },
    { id: 10, when: "rail", t: 0.32, kind: "spawn", ships: [{ kind: "aster", dx: 0, dy: 0, dz: -36, hp: 16 }, { kind: "aster", dx: -40, dy: 8, dz: -70, hp: 1 }, { kind: "aster", dx: 40, dy: -6, dz: -70, hp: 1 }] },
    { id: 11, when: "rail", t: 0.4, kind: "spawn", ships: rocks(-52, 12) },
    { id: 12, when: "rail", t: 0.5, kind: "check", who: "e", text: "Checkpoint. Seven rings if you want Ice." },
    { id: 13, when: "rail", t: 0.56, kind: "spawn", ships: V(-40, 18) },
    { id: 14, when: "rail", t: 0.62, kind: "rings", rings: [
      { dx: -18, dy: 0, dz: -36 },
      { dx: 18, dy: 4, dz: -90 },
      { dx: -16, dy: -2, dz: -144 },
      { dx: 20, dy: 6, dz: -198 },
      { dx: -14, dy: 2, dz: -252 },
      { dx: 16, dy: -4, dz: -306 },
      { dx: 0, dy: 0, dz: -360 },
    ] },
    { id: 15, when: "rail", t: 0.64, kind: "radio", who: "s", text: "Rings zigzag. All seven for the warp. Miss one and the quoin stays." },
    { id: 16, when: "rail", t: 0.78, kind: "spawn", ships: rocks(-48, 8) },
    { id: 17, when: "arena", t: 0.5, kind: "spawn", ships: [{ kind: "mothership", dx: 0, dy: 8, dz: -140 }, { kind: "fighter", dx: -60, dy: 10, dz: -50 }, { kind: "fighter", dx: 60, dy: 10, dz: -50 }] },
    { id: 18, when: "arena", t: 0.7, kind: "radio", who: "s", text: "The quoin. Four teeth, then the well. Don’t kiss the bit." },
  ],
};

export function progressOf(s: SortieState, when: "rail" | "arena") {
  if (when === "rail") return s.flight === "corridor" ? s.pathT : 2;
  if (s.flight !== "allrange") return -1;
  return s.t - (s.arenaT ?? s.t);
}
