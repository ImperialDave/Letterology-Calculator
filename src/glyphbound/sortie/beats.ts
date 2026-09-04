import type { KitId } from "./kits";
import type { EnemyKind, FormName, PickupKind, SortieState } from "./sim";

export interface Beat {
  id: number;
  when: "rail" | "arena";
  t: number;
  kind: "spawn" | "radio" | "pickup" | "check" | "rings";
  who?: string;
  text?: string;
  ships?: {
    kind: EnemyKind;
    dx: number;
    dy: number;
    dz: number;
    hp?: number;
    form?: FormName;
    armed?: boolean;
    setPiece?: boolean;
    slot?: number;
  }[];
  loot?: { kind: PickupKind; kit?: KitId; dx: number; dy: number; dz: number };
  rings?: { dx: number; dy: number; dz: number }[];
}

export function far(dz: number) {
  return Math.min(dz, -200);
}

export const ROCK_RING_R = 32;
export const ROCK_GAP = 36;

export function rocks(dz: number, n = 8): Beat["ships"] {
  const z0 = far(dz);
  return Array.from({ length: n }, (_, i) => ({
    kind: "aster" as const,
    dx: ((i % 4) - 1.5) * ROCK_GAP + (i % 3) * 4,
    dy: (i % 5) * 9 - 14,
    dz: z0 - Math.floor(i / 4) * 36,
    hp: i % 6 === 0 ? 12 : 1,
  }));
}

function V(dz: number, spread = 11, armed = false): Beat["ships"] {
  const z = far(dz);
  return [
    { kind: "fighter", dx: 0, dy: 4, dz: z, form: "v", armed },
    { kind: "fighter", dx: -spread, dy: 2, dz: z + 14, form: "v", armed },
    { kind: "fighter", dx: spread, dy: 2, dz: z + 14, form: "v", armed },
  ];
}

function arrows(dz: number): Beat["ships"] {
  const z = far(dz);
  return [
    { kind: "fighter", dx: -6, dy: 2, dz: z, form: "hold", armed: false },
    { kind: "fighter", dx: 6, dy: 2, dz: z + 10, form: "hold", armed: false },
  ];
}

function clump(dz: number, n = 5): Beat["ships"] {
  const z0 = far(dz);
  return Array.from({ length: n }, (_, i) => ({
    kind: "aster" as const,
    dx: ((i % 3) - 1) * 10,
    dy: (i % 2) * 8 - 4,
    dz: z0 - Math.floor(i / 3) * 12,
    hp: 1,
  }));
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

export function rockRing(dz: number, r = ROCK_RING_R, n = 8): Beat["ships"] {
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
    { id: 1, when: "rail", t: 0.03, kind: "radio", who: "s", text: "Mouth of the page. Follow the water." },
    { id: 2, when: "rail", t: 0.04, kind: "spawn", ships: [{ kind: "fighter", dx: 0, dy: 2, dz: -36, form: "hold", armed: false }] },
    { id: 3, when: "rail", t: 0.09, kind: "spawn", ships: arrows(-48) },
    { id: 4, when: "rail", t: 0.14, kind: "radio", who: "b", text: "Canyon teeth." },
    { id: 5, when: "rail", t: 0.16, kind: "spawn", ships: [{ kind: "turret", dx: 20, dy: -20, dz: -30 }, { kind: "turret", dx: -20, dy: -20, dz: -48 }] },
    { id: 6, when: "rail", t: 0.22, kind: "pickup", loot: { kind: "silver", dx: 0, dy: 2, dz: -24 } },
    { id: 7, when: "rail", t: 0.26, kind: "spawn", ships: V(-50, 11, true) },
    { id: 8, when: "rail", t: 0.3, kind: "radio", who: "s", text: "n-street. Type-city. The street is the hole." },
    { id: 9, when: "rail", t: 0.32, kind: "spawn", ships: Cross(-44) },
    { id: 10, when: "rail", t: 0.36, kind: "spawn", ships: [{ kind: "mech", dx: -22, dy: -8, dz: -50, hp: 6 }, { kind: "mech", dx: 22, dy: -8, dz: -70, hp: 6 }] },
    { id: 11, when: "rail", t: 0.4, kind: "spawn", ships: [{ kind: "fighter", dx: -8, dy: 6, dz: -42, form: "guide" }, { kind: "fighter", dx: 12, dy: 8, dz: -55, form: "guide" }] },
    { id: 30, when: "rail", t: 0.33, kind: "spawn", ships: [{ kind: "turret", dx: 18, dy: -8, dz: -40 }, { kind: "turret", dx: -18, dy: -10, dz: -55 }, { kind: "fighter", dx: 0, dy: 8, dz: -36, form: "hold", armed: true }] },
    { id: 31, when: "rail", t: 0.44, kind: "spawn", ships: V(-46, 11, true) },
    { id: 32, when: "rail", t: 0.46, kind: "spawn", ships: [{ kind: "cork", dx: -14, dy: -6, dz: -40 }, { kind: "cork", dx: 14, dy: -4, dz: -52 }] },
    { id: 12, when: "rail", t: 0.42, kind: "pickup", loot: { kind: "stem", dx: -8, dy: 4, dz: -20 } },
    { id: 13, when: "rail", t: 0.48, kind: "check", who: "e", text: "I’m still here." },
    { id: 14, when: "rail", t: 0.5, kind: "spawn", ships: Line(-34) },
    { id: 15, when: "rail", t: 0.55, kind: "radio", who: "s", text: "Seven n. The counters are the hole." },
    { id: 16, when: "rail", t: 0.58, kind: "spawn", ships: [{ kind: "fighter", dx: 12, dy: 8, dz: -40, form: "guide" }, { kind: "fighter", dx: -12, dy: 8, dz: -52, form: "guide" }] },
    { id: 17, when: "rail", t: 0.64, kind: "pickup", loot: { kind: "gold", dx: 0, dy: 2, dz: -20 } },
    { id: 18, when: "rail", t: 0.68, kind: "spawn", ships: [{ kind: "bomber", dx: 0, dy: 18, dz: -48 }, { kind: "cork", dx: 14, dy: 10, dz: -36 }] },
    { id: 19, when: "rail", t: 0.72, kind: "spawn", ships: [{ kind: "fighter", dx: -16, dy: -10, dz: -40, form: "hold", armed: false }] },
    { id: 20, when: "rail", t: 0.76, kind: "radio", who: "b", text: "Lintel. I would dip." },
    { id: 21, when: "rail", t: 0.8, kind: "spawn", ships: [{ kind: "bomber", dx: -12, dy: 14, dz: -40 }, { kind: "bomber", dx: 12, dy: 14, dz: -40 }] },
    { id: 33, when: "rail", t: 0.82, kind: "spawn", ships: Line(-40) },
    { id: 34, when: "rail", t: 0.86, kind: "spawn", ships: [{ kind: "turret", dx: -20, dy: -12, dz: -36 }, { kind: "fighter", dx: 10, dy: 6, dz: -48, armed: true }] },
    { id: 22, when: "rail", t: 0.88, kind: "spawn", ships: V(-42, 11, true) },
    { id: 35, when: "rail", t: 0.92, kind: "spawn", ships: Cross(-40) },
    { id: 36, when: "arena", t: 0.2, kind: "spawn", ships: [{ kind: "fighter", dx: -40, dy: 6, dz: -80, armed: true }, { kind: "fighter", dx: 40, dy: 6, dz: -80, armed: true }] },
    { id: 23, when: "arena", t: 0.4, kind: "radio", who: "s", text: "Scale. Don’t kiss the stamp." },
    { id: 24, when: "arena", t: 0.6, kind: "spawn", ships: [{ kind: "fighter", dx: -50, dy: 8, dz: -40 }, { kind: "fighter", dx: 50, dy: 8, dz: -40 }, { kind: "mech", dx: 0, dy: -20, dz: -160, hp: 12, setPiece: true }] },
    { id: 101, when: "rail", t: 0.24, kind: "pickup", loot: { kind: "kit", kit: "ligature", dx: 16, dy: 6, dz: -28 } },
    { id: 102, when: "rail", t: 0.56, kind: "pickup", loot: { kind: "kit", kit: "serif", dx: -18, dy: -4, dz: -30 } },
  ],
  slug: [
    { id: 1, when: "rail", t: 0.06, kind: "radio", who: "b", text: "Lead slugs. The big ones are already melted. Brake." },
    { id: 25, when: "rail", t: 0.07, kind: "spawn", ships: [{ kind: "aster", dx: -10, dy: 2, dz: -40, hp: 1 }, { kind: "aster", dx: 12, dy: -4, dz: -55, hp: 1 }, { kind: "aster", dx: 0, dy: 8, dz: -70, hp: 8 }, { kind: "aster", dx: -16, dy: 6, dz: -90, hp: 1 }] },
    { id: 2, when: "rail", t: 0.08, kind: "spawn", ships: [{ kind: "fighter", dx: -12, dy: 6, dz: -40 }, { kind: "cork", dx: 14, dy: 10, dz: -55 }] },
    { id: 3, when: "rail", t: 0.18, kind: "spawn", ships: V(-48) },
    { id: 4, when: "rail", t: 0.28, kind: "radio", who: "s", text: "Gold rings. Dualis hasn’t spent those letters. Thread them." },
    { id: 5, when: "rail", t: 0.4, kind: "spawn", ships: [{ kind: "cork", dx: -14, dy: 12, dz: -36 }, { kind: "cork", dx: 14, dy: 12, dz: -50 }] },
    { id: 6, when: "rail", t: 0.52, kind: "pickup", loot: { kind: "gold", dx: 0, dy: 4, dz: -24 } },
    { id: 7, when: "rail", t: 0.62, kind: "spawn", ships: [{ kind: "bomber", dx: 0, dy: 20, dz: -44 }, { kind: "fighter", dx: -10, dy: 4, dz: -30 }] },
    { id: 8, when: "rail", t: 0.78, kind: "spawn", ships: V(-40, 11) },
    { id: 20, when: "rail", t: 0.22, kind: "spawn", ships: [{ kind: "cork", dx: -16, dy: 4, dz: -40 }, { kind: "cork", dx: 16, dy: 6, dz: -55 }, { kind: "fighter", dx: 0, dy: 2, dz: -30 }] },
    { id: 21, when: "rail", t: 0.34, kind: "spawn", ships: Line(-44) },
    { id: 22, when: "rail", t: 0.46, kind: "spawn", ships: V(-42, 11, true) },
    { id: 23, when: "rail", t: 0.7, kind: "spawn", ships: Cross(-40) },
    { id: 9, when: "arena", t: 0.5, kind: "spawn", ships: [{ kind: "bomber", dx: 0, dy: 24, dz: -120, setPiece: true }, { kind: "fighter", dx: -70, dy: 6, dz: -50 }, { kind: "fighter", dx: 70, dy: 6, dz: -50 }] },
    { id: 24, when: "arena", t: 0.9, kind: "spawn", ships: [{ kind: "fighter", dx: -50, dy: 8, dz: 40, armed: true }, { kind: "fighter", dx: 50, dy: 8, dz: 40, armed: true }, { kind: "cork", dx: 0, dy: 16, dz: -90 }] },
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
    { id: 20, when: "rail", t: 0.16, kind: "spawn", ships: Line(-40) },
    { id: 21, when: "rail", t: 0.3, kind: "spawn", ships: [{ kind: "turret", dx: 22, dy: -10, dz: -40 }, { kind: "turret", dx: -22, dy: -8, dz: -60 }, { kind: "cork", dx: 0, dy: 10, dz: -36 }] },
    { id: 22, when: "rail", t: 0.52, kind: "spawn", ships: V(-48, 11, true) },
    { id: 23, when: "rail", t: 0.66, kind: "spawn", ships: Cross(-42) },
    { id: 8, when: "arena", t: 0.5, kind: "spawn", ships: [{ kind: "mothership", dx: 0, dy: 0, dz: -120, setPiece: true }, { kind: "fighter", dx: -70, dy: 8, dz: -40 }, { kind: "fighter", dx: 70, dy: 8, dz: -40 }] },
    { id: 24, when: "arena", t: 1.1, kind: "spawn", ships: [{ kind: "bomber", dx: 40, dy: 18, dz: -80 }, { kind: "fighter", dx: -40, dy: 8, dz: 50, armed: true }] },
    { id: 9, when: "arena", t: 0.7, kind: "radio", who: "e", text: "Belly first. Then the core. Dualis is listening." },
    { id: 101, when: "rail", t: 0.4, kind: "pickup", loot: { kind: "kit", kit: "inkwell", dx: 16, dy: -6, dz: -24 } },
  ],
  ice: [
    { id: 1, when: "arena", t: 1.2, kind: "radio", who: "b", text: "Hold the green pad. That ground is still a letter." },
    { id: 2, when: "arena", t: 1.4, kind: "spawn", ships: V(-70, 28) },
    { id: 3, when: "arena", t: 8, kind: "spawn", ships: [{ kind: "fighter", dx: -80, dy: 6, dz: 40 }, { kind: "fighter", dx: 80, dy: 6, dz: 40 }, { kind: "fighter", dx: 0, dy: 8, dz: -90 }] },
    { id: 4, when: "arena", t: 16, kind: "pickup", loot: { kind: "repair", dx: 0, dy: 6, dz: 20 } },
    { id: 5, when: "arena", t: 7.6, kind: "radio", who: "s", text: "Serifs. His proofreaders. Three. Don’t let them file you." },
    { id: 6, when: "arena", t: 8, kind: "spawn", ships: [{ kind: "ace", dx: -40, dy: 12, dz: -160, setPiece: true }, { kind: "ace", dx: 40, dy: 12, dz: -160, setPiece: true }, { kind: "ace", dx: 0, dy: 16, dz: -200, setPiece: true }] },
    { id: 22, when: "arena", t: 6, kind: "spawn", ships: [{ kind: "fighter", dx: -60, dy: 10, dz: -40, armed: true }, { kind: "fighter", dx: 60, dy: 10, dz: -40, armed: true }] },
    { id: 23, when: "arena", t: 14, kind: "spawn", ships: V(-80, 28) },
    { id: 101, when: "arena", t: 10, kind: "pickup", loot: { kind: "kit", kit: "emquad", dx: 40, dy: 8, dz: -40 } },
    { id: 102, when: "arena", t: 18, kind: "pickup", loot: { kind: "kit", kit: "swash", dx: -50, dy: 12, dz: 30 } },
  ],
  press: [
    { id: 1, when: "rail", t: 0.08, kind: "radio", who: "b", text: "Crater road. Thread the censers if you want the pay." },
    { id: 2, when: "rail", t: 0.12, kind: "spawn", ships: [{ kind: "turret", dx: 18, dy: -8, dz: -36 }, { kind: "fighter", dx: 0, dy: 8, dz: -48 }] },
    { id: 3, when: "rail", t: 0.28, kind: "spawn", ships: V(-44) },
    { id: 4, when: "rail", t: 0.48, kind: "spawn", ships: [{ kind: "bomber", dx: 0, dy: 20, dz: -50 }, { kind: "cork", dx: 12, dy: 10, dz: -36 }] },
    { id: 5, when: "rail", t: 0.68, kind: "spawn", ships: V(-40, 11) },
    { id: 20, when: "rail", t: 0.2, kind: "spawn", ships: Line(-36) },
    { id: 21, when: "rail", t: 0.38, kind: "spawn", ships: Cross(-40) },
    { id: 22, when: "rail", t: 0.56, kind: "spawn", ships: [{ kind: "bomber", dx: -14, dy: 16, dz: -44 }, { kind: "bomber", dx: 14, dy: 16, dz: -44 }, { kind: "cork", dx: 0, dy: 8, dz: -28 }] },
    { id: 23, when: "rail", t: 0.8, kind: "spawn", ships: V(-42, 11, true) },
    { id: 6, when: "arena", t: 0.6, kind: "spawn", ships: [{ kind: "dualis", dx: 0, dy: 20, dz: -180, setPiece: true }, { kind: "fighter", dx: -50, dy: 12, dz: -80 }, { kind: "bomber", dx: 50, dy: 22, dz: -80 }] },
    { id: 24, when: "arena", t: 1.6, kind: "spawn", ships: [{ kind: "fighter", dx: -80, dy: 10, dz: 20, armed: true }, { kind: "fighter", dx: 80, dy: 10, dz: 20, armed: true }, { kind: "bomber", dx: 0, dy: 24, dz: -100 }] },
    { id: 7, when: "arena", t: 0.8, kind: "radio", who: "s", text: "That’s Dualis. A bar that thinks it’s a period. Hit it until it splits." },
    { id: 8, when: "arena", t: 1.2, kind: "radio", who: "!", text: "Submit the remainder. I will round you down." },
    { id: 101, when: "rail", t: 0.4, kind: "pickup", loot: { kind: "kit", kit: "proof", dx: 0, dy: 12, dz: -36 } },
  ],
  sorts: [
    { id: 1, when: "rail", t: 0.03, kind: "radio", who: "s", text: "His drawers. Small sorts die to a tap." },
    { id: 2, when: "rail", t: 0.04, kind: "spawn", ships: clump(-44, 6) },
    { id: 4, when: "rail", t: 0.09, kind: "spawn", ships: rockRing(-40, 32, 8) },
    { id: 25, when: "rail", t: 0.12, kind: "radio", who: "e", text: "The hole pays." },
    { id: 7, when: "rail", t: 0.16, kind: "pickup", loot: { kind: "stem", dx: 0, dy: 0, dz: -44 } },
    { id: 8, when: "rail", t: 0.2, kind: "spawn", ships: V(-48, 11) },
    { id: 9, when: "rail", t: 0.28, kind: "radio", who: "b", text: "Crushers. Wait, then the hole. I would brake." },
    { id: 10, when: "rail", t: 0.3, kind: "spawn", ships: [{ kind: "aster", dx: -22, dy: 0, dz: -36, hp: 12, form: "cross", slot: 0 }, { kind: "aster", dx: 22, dy: 0, dz: -36, hp: 12, form: "cross", slot: 1 }] },
    { id: 26, when: "rail", t: 0.38, kind: "spawn", ships: clump(-48, 5) },
    { id: 11, when: "rail", t: 0.46, kind: "spawn", ships: rocks(-52, 8) },
    { id: 12, when: "rail", t: 0.5, kind: "check", who: "e", text: "Still here. Seven rings if you want the frozen stock." },
    { id: 13, when: "rail", t: 0.56, kind: "spawn", ships: V(-40, 11, true) },
    { id: 15, when: "rail", t: 0.6, kind: "radio", who: "s", text: "Zigzag. All seven warp you off his page. Miss one and the quoin stays to lie." },
    { id: 16, when: "rail", t: 0.72, kind: "spawn", ships: rocks(-48, 8) },
    { id: 17, when: "arena", t: 0.5, kind: "spawn", ships: [{ kind: "mothership", dx: 0, dy: 8, dz: -140, setPiece: true }, { kind: "fighter", dx: -60, dy: 10, dz: -50 }, { kind: "fighter", dx: 60, dy: 10, dz: -50 }] },
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
