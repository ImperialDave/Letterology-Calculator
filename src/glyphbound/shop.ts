import type { Difficulty, GradeLetter } from "./types";

export type VialId = "heart" | "ink" | "well";
export type DraughtId = "blot" | "anchor" | "period" | "singular" | "press";
export type PermanentId = "gilt" | "wake" | "gall";
export type ItemId = VialId | DraughtId | PermanentId;
export type StockId = VialId | DraughtId;

export interface ItemDef {
  id: ItemId;
  name: string;
  price: number;
  blurb: string;
  kind: "vial" | "draught" | "permanent";
  cap: number;
  clock: number;
}

export const ITEMS: ItemDef[] = [
  { id: "heart", name: "Heart vial", price: 10, blurb: "Restore 3 health.", kind: "vial", cap: 9, clock: 0 },
  { id: "ink", name: "Ink vial", price: 10, blurb: "Restore 16 ink.", kind: "vial", cap: 9, clock: 0 },
  { id: "well", name: "Full well", price: 28, blurb: "Fill health and ink.", kind: "vial", cap: 9, clock: 0 },
  { id: "blot", name: "Blot", price: 24, blurb: "The next 5 enemy shots break.", kind: "draught", cap: 3, clock: 12 },
  { id: "anchor", name: "Anchor", price: 26, blurb: "Pull and knockback do not move you.", kind: "draught", cap: 3, clock: 14 },
  { id: "period", name: "Period", price: 30, blurb: "Summons die in one strike and cannot heal.", kind: "draught", cap: 3, clock: 12 },
  { id: "singular", name: "Singular", price: 36, blurb: "The warden cannot split, copy, or erase shelves.", kind: "draught", cap: 3, clock: 14 },
  { id: "press", name: "Press", price: 22, blurb: "The next strike stuns a close warden. A miss still spends it.", kind: "draught", cap: 3, clock: 0 },
  { id: "gilt", name: "Gilt fang", price: 48, blurb: "Fang costs less ink. The shot is not stronger.", kind: "permanent", cap: 1, clock: 0 },
  { id: "wake", name: "Spare wake", price: 64, blurb: "Hard keeps 4 wakes. Extreme keeps 2.", kind: "permanent", cap: 1, clock: 0 },
  { id: "gall", name: "Iron gall", price: 80, blurb: "+1 maximum health on every letter.", kind: "permanent", cap: 1, clock: 0 },
];

export const ITEM = Object.fromEntries(ITEMS.map((item) => [item.id, item])) as Record<ItemId, ItemDef>;

export interface Purse {
  bux: number;
  bag: Record<StockId, number>;
  owned: Record<PermanentId, boolean>;
  armedVial: VialId;
  armedDraught: DraughtId;
}

export interface LiveDraught {
  id: Exclude<DraughtId, "press"> | null;
  t: number;
  blot: number;
  press: boolean;
}

const STOCK: StockId[] = ["heart", "ink", "well", "blot", "anchor", "period", "singular", "press"];

export function emptyPurse(): Purse {
  return {
    bux: 0,
    bag: { heart: 0, ink: 0, well: 0, blot: 0, anchor: 0, period: 0, singular: 0, press: 0 },
    owned: { gilt: false, wake: false, gall: false },
    armedVial: "heart",
    armedDraught: "blot",
  };
}

export function emptyLive(): LiveDraught {
  return { id: null, t: 0, blot: 0, press: false };
}

/** First close pays 14, plus a small clean-page bonus. A reread pays 5. */
export function payout(first: boolean, grade: GradeLetter | null): number {
  if (!first) return 5;
  if (grade === "A+") return 20;
  if (grade === "A" || grade === "A−") return 18;
  if (grade?.startsWith("B")) return 16;
  return 14;
}

export function itemDef(id: string): ItemDef | null {
  return (ITEM as Record<string, ItemDef>)[id] ?? null;
}

export function buy(
  purse: Purse,
  id: ItemId,
  difficulty: Difficulty,
): { purse: Purse; ok: boolean; reason: string } {
  const def = ITEM[id];
  const next = clonePurse(purse);
  if (def.kind === "permanent" && next.owned[id as PermanentId]) {
    return { purse, ok: false, reason: "Already stamped." };
  }
  if (id === "wake" && difficulty === "easy") {
    return { purse, ok: false, reason: "Easy does not spend wakes." };
  }
  if (def.kind !== "permanent" && next.bag[id as StockId] >= def.cap) {
    return { purse, ok: false, reason: "The stack is full." };
  }
  if (next.bux < def.price) return { purse, ok: false, reason: "The purse is short." };
  next.bux -= def.price;
  if (def.kind === "permanent") next.owned[id as PermanentId] = true;
  else next.bag[id as StockId] += 1;
  return { purse: next, ok: true, reason: def.name };
}

export function drinkVial(purse: Purse, id: VialId): { purse: Purse; ok: boolean } {
  if ((purse.bag[id] ?? 0) <= 0) return { purse, ok: false };
  const next = clonePurse(purse);
  next.bag[id] -= 1;
  return { purse: next, ok: true };
}

/** One draught at a time. Press is a single swing and replaces a clock. */
export function drinkDraught(purse: Purse, live: LiveDraught, id: DraughtId): { purse: Purse; live: LiveDraught; ok: boolean } {
  if ((purse.bag[id] ?? 0) <= 0) return { purse, live, ok: false };
  const next = clonePurse(purse);
  next.bag[id] -= 1;
  if (id === "press") return { purse: next, live: { id: null, t: 0, blot: 0, press: true }, ok: true };
  return {
    purse: next,
    live: { id, t: ITEM[id].clock, blot: id === "blot" ? 5 : 0, press: false },
    ok: true,
  };
}

export function tickDraught(live: LiveDraught, dt: number): LiveDraught {
  if (!live.id || live.t <= 0) return live.id ? { ...live, id: null, t: 0, blot: 0 } : live;
  const t = live.t - dt;
  if (t > 0) return { ...live, t };
  return { ...live, id: null, t: 0, blot: 0 };
}

export function eatBlot(live: LiveDraught): { live: LiveDraught; eaten: boolean } {
  if (live.id !== "blot" || live.blot <= 0) return { live, eaten: false };
  const blot = live.blot - 1;
  if (blot <= 0) return { live: { ...live, id: null, t: 0, blot: 0 }, eaten: true };
  return { live: { ...live, blot }, eaten: true };
}

/** A swing spends Press whether or not a warden was close. */
export function swingPress(live: LiveDraught): LiveDraught {
  return live.press ? { ...live, press: false } : live;
}

export function isSummon(kind: string): boolean {
  return kind === "one" || kind === "radix" || kind === "plus";
}

export function giltCost(cost: number, owned: boolean): number {
  return owned ? Math.max(1, Math.round(cost * 0.7)) : cost;
}

function clonePurse(purse: Purse): Purse {
  return {
    bux: purse.bux,
    bag: { ...purse.bag },
    owned: { ...purse.owned },
    armedVial: purse.armedVial,
    armedDraught: purse.armedDraught,
  };
}

function isVial(id: string): id is VialId {
  return id === "heart" || id === "ink" || id === "well";
}

function isDraught(id: string): id is DraughtId {
  return id === "blot" || id === "anchor" || id === "period" || id === "singular" || id === "press";
}

export function readPurse(raw: {
  bux?: unknown;
  bag?: unknown;
  owned?: unknown;
  armedVial?: unknown;
  armedDraught?: unknown;
}): Purse {
  const base = emptyPurse();
  if (typeof raw.bux === "number" && Number.isFinite(raw.bux)) base.bux = Math.max(0, Math.round(raw.bux));
  if (raw.bag && typeof raw.bag === "object" && !Array.isArray(raw.bag)) {
    for (const id of STOCK) {
      const n = (raw.bag as Record<string, unknown>)[id];
      if (typeof n === "number" && Number.isFinite(n)) base.bag[id] = Math.max(0, Math.min(ITEM[id].cap, Math.round(n)));
    }
  }
  if (raw.owned && typeof raw.owned === "object" && !Array.isArray(raw.owned)) {
    const owned = raw.owned as Record<string, unknown>;
    base.owned.gilt = owned.gilt === true;
    base.owned.wake = owned.wake === true;
    base.owned.gall = owned.gall === true;
  }
  if (isVial(String(raw.armedVial))) base.armedVial = raw.armedVial as VialId;
  if (isDraught(String(raw.armedDraught))) base.armedDraught = raw.armedDraught as DraughtId;
  return base;
}
