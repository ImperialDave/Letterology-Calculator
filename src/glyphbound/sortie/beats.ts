import type { KitId } from "./kits";
import type { EnemyKind, FormName, PickupKind, SortieState } from "./sim";

export interface Beat {
  id: number;
  when: "rail" | "arena";
  t: number;
  kind: "spawn" | "radio" | "pickup" | "check" | "rings";
  who?: string;
  text?: string;
  ships?: { kind: EnemyKind; dx: number; dy: number; dz: number; hp?: number; form?: FormName; armed?: boolean }[];
  loot?: { kind: PickupKind; kit?: KitId; dx: number; dy: number; dz: number };
  rings?: { dx: number; dy: number; dz: number }[];
}

export function far(dz: number) {
  return Math.min(dz, -200);
}

function rocks(dz: number, n = 8): Beat["ships"] {
  const z0 = far(dz);
  return Array.from({ length: n }, (_, i) => ({
    kind: "aster" as const,
    dx: ((i % 4) - 1.5) * 12 + (i % 3) * 4,
    dy: (i % 5) * 9 - 14,
    dz: z0 - Math.floor(i / 4) * 36,
    hp: i % 6 === 0 ? 12 : 1,
  }));
}

function V(dz: number, spread = 11): Beat["ships"] {
  const z = far(dz);
  return [
    { kind: "fighter", dx: 0, dy: 4, dz: z, form: "v" },
    { kind: "fighter", dx: -spread, dy: 2, dz: z + 14, form: "v" },
    { kind: "fighter", dx: spread, dy: 2, dz: z + 14, form: "v" },
  ];
}

function Cross(dz: number): Beat["ships"] {
  const z = far(dz);
  return [
    { kind: "fighter", dx: -12, dy: 4, dz: z, form: "cross" },
    { kind: "fighter", dx: 12, dy: 4, dz: z + 8, form: "cross" },
    { kind: "fighter", dx: -12, dy: 8, dz: z + 16, form: "cross" },
    { kind: "fighter", dx: 12, dy: 8, dz: z + 24, form: "cross" },
  ];
}

function Line(dz: number): Beat["ships"] {
  const z = far(dz);
  return [
    { kind: "fighter", dx: -10, dy: 2, dz: z, form: "line" },
    { kind: "fighter", dx: 0, dy: 5, dz: z + 6, form: "line" },
    { kind: "fighter", dx: 10, dy: 2, dz: z + 12, form: "line" },
  ];
}

function rockRing(dz: number, r = 26, n = 8): Beat["ships"] {
  const z = far(dz);
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return {
      kind: "aster" as const,
      dx: Math.cos(a) * r,
      dy: Math.sin(a) * r * 0.65,
      dz: z,
      hp: 1,
    };
  });
}

export const BEATS: Record<string, Beat[]> = {
  coast: [
    { id: 1, when: "rail", t: 0.03, kind: "radio", who: "s", text: "Sea’s a page, c. Tap Space. Hold if you want the bolt." },
    { id: 2, when: "rail", t: 0.04, kind: "spawn", ships: [{ kind: "fighter", dx: 0, dy: 2, dz: -36, form: "guide" }] },
    { id: 3, when: "rail", t: 0.08, kind: "spawn", ships: V(-50, 11) },
    { id: 4, when: "rail", t: 0.12, kind: "radio", who: "b", text: "Canyon teeth. Brake. Turrets sit on the bite." },
    { id: 5, when: "rail", t: 0.14, kind: "spawn", ships: [{ kind: "turret", dx: 20, dy: -20, dz: -30 }, { kind: "turret", dx: -20, dy: -20, dz: -48 }] },
    { id: 6, when: "rail", t: 0.18, kind: "spawn", ships: [{ kind: "fighter", dx: -8, dy: 6, dz: -40, form: "guide" }, { kind: "fighter", dx: 8, dy: 6, dz: -40, form: "guide" }] },
    { id: 7, when: "rail", t: 0.22, kind: "pickup", loot: { kind: "silver", dx: 0, dy: 2, dz: -24 } },
    { id: 8, when: "rail", t: 0.28, kind: "radio", who: "s", text: "Type-city. The street is the hole. Not the roofs." },
    { id: 9, when: "rail", t: 0.3, kind: "spawn", ships: Cross(-44) },
    { id: 10, when: "rail", t: 0.34, kind: "spawn", ships: [{ kind: "mech", dx: -22, dy: -8, dz: -50, hp: 6 }, { kind: "mech", dx: 22, dy: -8, dz: -70, hp: 6 }] },
    { id: 11, when: "rail", t: 0.36, kind: "spawn", ships: [{ kind: "fighter", dx: -8, dy: 6, dz: -42, form: "guide" }, { kind: "fighter", dx: 12, dy: 8, dz: -55, form: "guide" }] },
    { id: 12, when: "rail", t: 0.38, kind: "spawn", ships: [{ kind: "fighter", dx: 0, dy: 10, dz: -36 }, { kind: "cork", dx: 14, dy: 12, dz: -55 }] },
    { id: 13, when: "rail", t: 0.42, kind: "pickup", loot: { kind: "stem", dx: -8, dy: 4, dz: -20 } },
    { id: 14, when: "rail", t: 0.48, kind: "check", who: "e", text: "I’m still here. Silver if you’re thin. Cut the jumped ones." },
    { id: 15, when: "rail", t: 0.5, kind: "spawn", ships: Line(-34) },
    { id: 16, when: "rail", t: 0.55, kind: "radio", who: "s", text: "Seven n. Follow the water, not the wall." },
    { id: 17, when: "rail", t: 0.58, kind: "spawn", ships: [{ kind: "fighter", dx: 12, dy: 8, dz: -40, form: "guide" }, { kind: "fighter", dx: -12, dy: 8, dz: -52, form: "guide" }] },
    { id: 18, when: "rail", t: 0.64, kind: "pickup", loot: { kind: "gold", dx: 0, dy: 2, dz: -20 } },
    { id: 19, when: "rail", t: 0.68, kind: "spawn", ships: [{ kind: "bomber", dx: 0, dy: 18, dz: -48 }, { kind: "cork", dx: 14, dy: 10, dz: -36 }] },
    { id: 20, when: "rail", t: 0.74, kind: "radio", who: "b", text: "Lintel. Dip if you want the gorge. I would." },
    { id: 21, when: "rail", t: 0.8, kind: "spawn", ships: [{ kind: "bomber", dx: -12, dy: 14, dz: -40 }, { kind: "bomber", dx: 12, dy: 14, dz: -40 }] },
    { id: 22, when: "rail", t: 0.88, kind: "spawn", ships: V(-42, 11) },
    { id: 23, when: "arena", t: 0.4, kind: "radio", who: "s", text: "Scale. Knees, frill, core. Don’t kiss the stamp." },
    { id: 24, when: "arena", t: 0.6, kind: "spawn", ships: [{ kind: "fighter", dx: -50, dy: 8, dz: -40 }, { kind: "fighter", dx: 50, dy: 8, dz: -40 }, { kind: "mech", dx: 0, dy: -20, dz: -160, hp: 24 }] },
    { id: 101, when: "rail", t: 0.26, kind: "pickup", loot: { kind: "kit", kit: "ligature", dx: 16, dy: 6, dz: -28 } },
    { id: 102, when: "rail", t: 0.56, kind: "pickup", loot: { kind: "kit", kit: "serif", dx: -18, dy: -4, dz: -30 } },
  ],
  slug: [
    { id: 1, when: "rail", t: 0.06, kind: "radio", who: "b", text: "Lead slugs. The big ones are already melted. Brake." },
    { id: 2, when: "rail", t: 0.08, kind: "spawn", ships: [{ kind: "fighter", dx: -12, dy: 6, dz: -40 }, { kind: "cork", dx: 14, dy: 10, dz: -55 }] },
    { id: 3, when: "rail", t: 0.18, kind: "spawn", ships: V(-48) },
    { id: 4, when: "rail", t: 0.28, kind: "radio", who: "s", text: "Gold rings. Dualis hasn’t spent those letters. Thread them." },
    { id: 5, when: "rail", t: 0.4, kind: "spawn", ships: [{ kind: "cork", dx: -14, dy: 12, dz: -36 }, { kind: "cork", dx: 14, dy: 12, dz: -50 }] },
    { id: 6, when: "rail", t: 0.52, kind: "pickup", loot: { kind: "gold", dx: 0, dy: 4, dz: -24 } },
    { id: 7, when: "rail", t: 0.62, kind: "spawn", ships: [{ kind: "bomber", dx: 0, dy: 20, dz: -44 }, { kind: "fighter", dx: -10, dy: 4, dz: -30 }] },
    { id: 8, when: "rail", t: 0.78, kind: "spawn", ships: V(-40, 11) },
    { id: 9, when: "arena", t: 0.5, kind: "spawn", ships: [{ kind: "bomber", dx: 0, dy: 24, dz: -120 }, { kind: "fighter", dx: -70, dy: 6, dz: -50 }, { kind: "fighter", dx: 70, dy: 6, dz: -50 }] },
    { id: 10, when: "arena", t: 0.7, kind: "radio", who: "s", text: "Bowl nest. That’s how he ships the rest. Cut the bomber." },
    { id: 101, when: "rail", t: 0.3, kind: "pickup", loot: { kind: "kit", kit: "case", dx: -16, dy: 8, dz: -28 } },
  ],
  gutter: [
    { id: 1, when: "rail", t: 0.08, kind: "radio", who: "e", text: "Stay in the ink. The lights above bite. I can hear the Press." },
    { id: 2, when: "rail", t: 0.1, kind: "spawn", ships: [{ kind: "turret", dx: 20, dy: -12, dz: -36 }, { kind: "turret", dx: -20, dy: -12, dz: -50 }] },
    { id: 3, when: "rail", t: 0.22, kind: "spawn", ships: V(-44) },
    { id: 4, when: "rail", t: 0.36, kind: "radio", who: "s", text: "Tanker. Through the hold. Don’t admire the hull." },
    { id: 5, when: "rail", t: 0.48, kind: "pickup", loot: { kind: "bomb", dx: 0, dy: 2, dz: -18 } },
    { id: 6, when: "rail", t: 0.58, kind: "spawn", ships: [{ kind: "cork", dx: 14, dy: 10, dz: -40 }, { kind: "fighter", dx: -12, dy: 4, dz: -32 }] },
    { id: 7, when: "rail", t: 0.74, kind: "spawn", ships: V(-42, 11) },
    { id: 8, when: "arena", t: 0.5, kind: "spawn", ships: [{ kind: "mothership", dx: 0, dy: 0, dz: -120 }, { kind: "fighter", dx: -70, dy: 8, dz: -40 }, { kind: "fighter", dx: 70, dy: 8, dz: -40 }] },
    { id: 9, when: "arena", t: 0.7, kind: "radio", who: "e", text: "Belly first. Then the core. Dualis is listening." },
    { id: 101, when: "rail", t: 0.4, kind: "pickup", loot: { kind: "kit", kit: "inkwell", dx: 16, dy: -6, dz: -24 } },
  ],
  ice: [
    { id: 1, when: "arena", t: 1.2, kind: "radio", who: "b", text: "Hold the green pad. That ground is still a letter." },
    { id: 2, when: "arena", t: 1.4, kind: "spawn", ships: V(-70, 28) },
    { id: 3, when: "arena", t: 8, kind: "spawn", ships: [{ kind: "fighter", dx: -80, dy: 6, dz: 40 }, { kind: "fighter", dx: 80, dy: 6, dz: 40 }, { kind: "fighter", dx: 0, dy: 8, dz: -90 }] },
    { id: 4, when: "arena", t: 16, kind: "pickup", loot: { kind: "repair", dx: 0, dy: 6, dz: 20 } },
    { id: 5, when: "arena", t: 22, kind: "radio", who: "s", text: "Serifs. His proofreaders. Three. Don’t let them file you." },
    { id: 6, when: "arena", t: 22.4, kind: "spawn", ships: [{ kind: "ace", dx: -40, dy: 12, dz: -160 }, { kind: "ace", dx: 40, dy: 12, dz: -160 }, { kind: "ace", dx: 0, dy: 16, dz: -200 }] },
    { id: 101, when: "arena", t: 10, kind: "pickup", loot: { kind: "kit", kit: "emquad", dx: 40, dy: 8, dz: -40 } },
    { id: 102, when: "arena", t: 18, kind: "pickup", loot: { kind: "kit", kit: "swash", dx: -50, dy: 12, dz: 30 } },
  ],
  press: [
    { id: 1, when: "rail", t: 0.08, kind: "radio", who: "b", text: "Crater road. Thread the censers if you want the pay." },
    { id: 2, when: "rail", t: 0.12, kind: "spawn", ships: [{ kind: "turret", dx: 18, dy: -8, dz: -36 }, { kind: "fighter", dx: 0, dy: 8, dz: -48 }] },
    { id: 3, when: "rail", t: 0.28, kind: "spawn", ships: V(-44) },
    { id: 4, when: "rail", t: 0.48, kind: "spawn", ships: [{ kind: "bomber", dx: 0, dy: 20, dz: -50 }, { kind: "cork", dx: 12, dy: 10, dz: -36 }] },
    { id: 5, when: "rail", t: 0.68, kind: "spawn", ships: V(-40, 11) },
    { id: 6, when: "arena", t: 0.6, kind: "spawn", ships: [{ kind: "dualis", dx: 0, dy: 20, dz: -180 }, { kind: "fighter", dx: -50, dy: 12, dz: -80 }, { kind: "bomber", dx: 50, dy: 22, dz: -80 }] },
    { id: 7, when: "arena", t: 0.8, kind: "radio", who: "s", text: "That’s Dualis. A bar that thinks it’s a period. Hit it until it splits." },
    { id: 8, when: "arena", t: 1.2, kind: "radio", who: "!", text: "Submit the remainder. I will round you down." },
    { id: 101, when: "rail", t: 0.4, kind: "pickup", loot: { kind: "kit", kit: "proof", dx: 0, dy: 12, dz: -36 } },
  ],
  sorts: [
    { id: 1, when: "rail", t: 0.03, kind: "radio", who: "s", text: "His drawers. Shoot the small type. Brake the crushers." },
    { id: 2, when: "rail", t: 0.04, kind: "spawn", ships: rocks(-50, 10) },
    { id: 3, when: "rail", t: 0.08, kind: "radio", who: "e", text: "Three rings. The hole pays. I’m with you." },
    { id: 4, when: "rail", t: 0.09, kind: "spawn", ships: rockRing(-40, 16, 8) },
    { id: 5, when: "rail", t: 0.14, kind: "spawn", ships: rockRing(-42, 17, 8) },
    { id: 6, when: "rail", t: 0.19, kind: "spawn", ships: rockRing(-44, 15, 9) },
    { id: 7, when: "rail", t: 0.2, kind: "pickup", loot: { kind: "stem", dx: 0, dy: 0, dz: -44 } },
    { id: 8, when: "rail", t: 0.24, kind: "spawn", ships: V(-48, 11) },
    { id: 9, when: "rail", t: 0.3, kind: "radio", who: "b", text: "Big sort. Go high or brake. I would brake." },
    { id: 10, when: "rail", t: 0.32, kind: "spawn", ships: [{ kind: "aster", dx: 0, dy: 0, dz: -36, hp: 16 }, { kind: "aster", dx: -16, dy: 8, dz: -70, hp: 1 }, { kind: "aster", dx: 16, dy: -6, dz: -70, hp: 1 }] },
    { id: 11, when: "rail", t: 0.4, kind: "spawn", ships: rocks(-52, 12) },
    { id: 12, when: "rail", t: 0.5, kind: "check", who: "e", text: "Still here. Seven rings if you want the frozen stock." },
    { id: 13, when: "rail", t: 0.56, kind: "spawn", ships: V(-40, 11) },
    { id: 14, when: "rail", t: 0.62, kind: "rings", rings: [
      { dx: -10, dy: 0, dz: -180 },
      { dx: 10, dy: 4, dz: -250 },
      { dx: -10, dy: -2, dz: -320 },
      { dx: 12, dy: 6, dz: -390 },
      { dx: -10, dy: 2, dz: -460 },
      { dx: 10, dy: -4, dz: -530 },
      { dx: 0, dy: 0, dz: -600 },
    ] },
    { id: 15, when: "rail", t: 0.64, kind: "radio", who: "s", text: "Zigzag. All seven warp you off his page. Miss one and the quoin stays to lie." },
    { id: 16, when: "rail", t: 0.78, kind: "spawn", ships: rocks(-48, 8) },
    { id: 17, when: "arena", t: 0.5, kind: "spawn", ships: [{ kind: "mothership", dx: 0, dy: 8, dz: -140 }, { kind: "fighter", dx: -60, dy: 10, dz: -50 }, { kind: "fighter", dx: 60, dy: 10, dz: -50 }] },
    { id: 18, when: "arena", t: 0.7, kind: "radio", who: "s", text: "The quoin. Four teeth, then the well. Don’t kiss the bit." },
    { id: 101, when: "rail", t: 0.21, kind: "pickup", loot: { kind: "kit", kit: "quoin", dx: 14, dy: 8, dz: -30 } },
    { id: 102, when: "rail", t: 0.63, kind: "pickup", loot: { kind: "kit", kit: "hairline", dx: 18, dy: 10, dz: -80 } },
  ],
};

export function progressOf(s: SortieState, when: "rail" | "arena") {
  if (when === "rail") return s.flight === "corridor" ? s.pathT : 2;
  if (s.flight !== "allrange") return -1;
  return s.t - (s.arenaT ?? s.t);
}
