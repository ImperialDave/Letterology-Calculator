/** Persistent C-wing kits. Ranks live on the save. The sim only reads mods. */

export const KIT_MAX = 2;

export type KitId =
  | "ligature"
  | "quoin"
  | "case"
  | "inkwell"
  | "emquad"
  | "proof"
  | "serif"
  | "hairline"
  | "swash";

export type KitRanks = Partial<Record<KitId, number>>;

export interface KitDef {
  id: KitId;
  name: string;
  item: string;
  who: "c" | "s" | "e" | "b";
  mission: string;
  how: "clear" | "fork" | "find";
  ranks: [string, string];
}

export const KITS: KitDef[] = [
  {
    id: "ligature",
    name: "Ligature",
    item: "a tied pair of type",
    who: "s",
    mission: "coast",
    how: "clear",
    ranks: ["One extra hull pip.", "Two extra hull pips."],
  },
  {
    id: "quoin",
    name: "Quoin",
    item: "the wedge that locks a form",
    who: "e",
    mission: "sorts",
    how: "clear",
    ranks: ["Charge seats sooner.", "Lock starts while the ring is still thin."],
  },
  {
    id: "case",
    name: "The Case",
    item: "a drawer of spare em-dashes",
    who: "b",
    mission: "slug",
    how: "clear",
    ranks: ["Start with two dashes.", "Three dashes. The splash writes a wider letter."],
  },
  {
    id: "inkwell",
    name: "Ink Well",
    item: "overflow from the gutter",
    who: "e",
    mission: "gutter",
    how: "clear",
    ranks: ["Boost drinks slower and fills faster.", "The meter barely notices a long burn."],
  },
  {
    id: "emquad",
    name: "Em-Quad",
    item: "the unused space Dualis froze",
    who: "b",
    mission: "ice",
    how: "clear",
    ranks: ["Hits leave a longer blank.", "Barrel stays a beat longer."],
  },
  {
    id: "proof",
    name: "Stem Proof",
    item: "the last pull off the Press",
    who: "c",
    mission: "press",
    how: "clear",
    ranks: ["Lasers keep a little more page.", "Hyper stem from the hangar. Faster taps."],
  },
  {
    id: "serif",
    name: "Serif",
    item: "a finishing stroke from the n-arches",
    who: "s",
    mission: "coast",
    how: "fork",
    ranks: ["One extra hull pip. Break calls earlier.", "The inbound flash holds."],
  },
  {
    id: "hairline",
    name: "Hairline",
    item: "a thin sort from the warp",
    who: "e",
    mission: "sorts",
    how: "find",
    ranks: ["The gun recovers between taps.", "A true rapid. Heat forgets you."],
  },
  {
    id: "swash",
    name: "Swash",
    item: "a flourish off the frozen pad",
    who: "b",
    mission: "ice",
    how: "find",
    ranks: ["Somersault writes a fuller loop.", "The loop costs less meter."],
  },
];

export const KIT_BY_CLEAR: Record<string, KitId> = {
  coast: "ligature",
  sorts: "quoin",
  slug: "case",
  gutter: "inkwell",
  ice: "emquad",
  press: "proof",
};

export interface KitMods {
  hullAdd: number;
  bombsAdd: number;
  chargeLock: number;
  chargeSeek: number;
  boostRegen: number;
  boostDrainMul: number;
  invuln: number;
  barrelT: number;
  somersaultT: number;
  somersaultCost: number;
  laserLifeMul: number;
  rapidCd: number;
  bombR: number;
  startStem: 0 | 1 | 2;
  incomingT: number;
}

export function isKitId(id: string): id is KitId {
  return KITS.some((k) => k.id === id);
}

export function kitOf(id: string) {
  return KITS.find((k) => k.id === id);
}

export function rankOf(ranks: KitRanks, id: KitId) {
  const n = ranks[id] ?? 0;
  return Math.max(0, Math.min(KIT_MAX, Math.floor(n)));
}

export function romanRank(n: number) {
  if (n >= 2) return "II";
  if (n >= 1) return "I";
  return "";
}

export function emptyMods(): KitMods {
  return {
    hullAdd: 0,
    bombsAdd: 0,
    chargeLock: 0.7,
    chargeSeek: 0.15,
    boostRegen: 0.58,
    boostDrainMul: 1,
    invuln: 0.85,
    barrelT: 0.42,
    somersaultT: 0.55,
    somersaultCost: 0.22,
    laserLifeMul: 1,
    rapidCd: 0.08,
    bombR: 36,
    startStem: 1,
    incomingT: 0.35,
  };
}

export function kitMods(ranks: KitRanks = {}): KitMods {
  const m = emptyMods();
  const r = (id: KitId) => rankOf(ranks, id);
  if (r("ligature") >= 1) m.hullAdd += 1;
  if (r("ligature") >= 2) m.hullAdd += 1;
  if (r("serif") >= 1) m.hullAdd += 1;
  if (r("serif") >= 1) m.incomingT = 0.55;
  if (r("serif") >= 2) m.incomingT = 0.85;
  if (r("quoin") >= 1) m.chargeLock = 0.55;
  if (r("quoin") >= 2) {
    m.chargeLock = 0.45;
    m.chargeSeek = 0.1;
  }
  if (r("case") >= 1) m.bombsAdd += 1;
  if (r("case") >= 2) {
    m.bombsAdd += 1;
    m.bombR = 46;
  }
  if (r("inkwell") >= 1) {
    m.boostRegen = 0.82;
    m.boostDrainMul = 0.82;
  }
  if (r("inkwell") >= 2) {
    m.boostRegen = 1.05;
    m.boostDrainMul = 0.62;
  }
  if (r("emquad") >= 1) m.invuln = 1.12;
  if (r("emquad") >= 2) {
    m.invuln = 1.28;
    m.barrelT = 0.54;
  }
  if (r("proof") >= 1) m.laserLifeMul = 1.12;
  if (r("proof") >= 2) {
    m.startStem = 2;
    m.rapidCd = Math.min(m.rapidCd, 0.055);
  }
  if (r("hairline") >= 1) m.rapidCd = Math.min(m.rapidCd, 0.065);
  if (r("hairline") >= 2) m.rapidCd = Math.min(m.rapidCd, 0.05);
  if (r("swash") >= 1) m.somersaultT = 0.68;
  if (r("swash") >= 2) {
    m.somersaultT = 0.78;
    m.somersaultCost = 0.12;
  }
  m.hullAdd = Math.min(3, m.hullAdd);
  m.bombsAdd = Math.min(3, m.bombsAdd);
  return m;
}

export function sanitizeKits(raw: unknown): KitRanks {
  if (!raw || typeof raw !== "object") return {};
  const out: KitRanks = {};
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!isKitId(key)) continue;
    const n = Math.floor(Number(val));
    if (n >= 1) out[key] = Math.min(KIT_MAX, n);
  }
  return out;
}

export function collectRank(ranks: KitRanks, id: KitId): { ranks: KitRanks; prev: number; next: number; maxed: boolean } {
  const prev = rankOf(ranks, id);
  if (prev >= KIT_MAX) return { ranks: { ...ranks, [id]: KIT_MAX }, prev, next: KIT_MAX, maxed: true };
  const next = prev + 1;
  return { ranks: { ...ranks, [id]: next }, prev, next, maxed: false };
}

export function grantClear(missionId: string, fork: boolean, ranks: KitRanks): { ranks: KitRanks; gained: KitId[] } {
  const next: KitRanks = { ...ranks };
  const gained: KitId[] = [];
  const seat = (id: KitId, min = 1) => {
    const have = rankOf(next, id);
    if (have < min) {
      next[id] = min;
      gained.push(id);
    }
  };
  const main = KIT_BY_CLEAR[missionId];
  if (main) seat(main, 1);
  if (fork && missionId === "coast") seat("serif", 1);
  return { ranks: next, gained };
}

export function fittedKits(ranks: KitRanks) {
  return KITS.filter((k) => rankOf(ranks, k.id) > 0).map((k) => ({
    ...k,
    rank: rankOf(ranks, k.id),
    roman: romanRank(rankOf(ranks, k.id)),
  }));
}
