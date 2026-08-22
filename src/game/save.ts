import {
  CLAIM_NAMES,
  defaultItems,
  defaultUpgrades,
  depthMeters,
  HELL_1,
  SAVE_KEY,
  SAVE_VERSION,
  SLOT_COUNT,
  SLOTS_KEY,
  stratumName,
  SURFACE_Y,
  TILE,
  type CargoItem,
  type ConsumableId,
  type Nail,
  type UpgradesState,
} from "./data";
import { World } from "./world";

export interface SaveBlob {
  version: number;
  seed: number;
  grid: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fuel: number;
  hull: number;
  money: number;
  cargo: CargoItem[];
  upgrades: UpgradesState;
  items: Record<ConsumableId, number>;
  bestDepth: number;
  bestMoney: number;
  hellUnlocked: boolean;
  hellSeen: 0 | 1 | 2 | 3;
  coolantT: number;
  muted: boolean;
  shake: boolean;
  savedAt: number;
  nails?: Nail[];
  sealsFound?: number;
}

export interface SlotMeta {
  occupied: true;
  name: string;
  depth: number;
  money: number;
  stratum: string;
  savedAt: number;
  hellUnlocked: boolean;
  bestDepth: number;
}

export interface SlotsIndex {
  version: number;
  active: number | null;
  slots: Array<SlotMeta | null>;
}

const defaults = (): Omit<SaveBlob, "seed" | "grid" | "x" | "y"> => ({
  version: SAVE_VERSION,
  vx: 0,
  vy: 0,
  fuel: 18,
  hull: 24,
  money: 0,
  cargo: [],
  upgrades: defaultUpgrades(),
  items: defaultItems(),
  bestDepth: 0,
  bestMoney: 0,
  hellUnlocked: false,
  hellSeen: 0,
  coolantT: 0,
  muted: false,
  shake: true,
  savedAt: 0,
  nails: [],
  sealsFound: 0,
});

function slotKey(i: number): string {
  return `${SAVE_KEY}.${i}`;
}

function emptyIndex(): SlotsIndex {
  return { version: 1, active: null, slots: [null, null, null] };
}

function clampSlot(i: number): number {
  return Math.max(0, Math.min(SLOT_COUNT - 1, i | 0));
}

export function hydrateSave(parsed: Partial<SaveBlob>): SaveBlob | null {
  if (typeof parsed.seed !== "number" || typeof parsed.grid !== "string") return null;
  const d = defaults();
  const hellUnlocked =
    Boolean(parsed.hellUnlocked) || (typeof parsed.bestDepth === "number" && parsed.bestDepth >= HELL_1);
  const hellSeen = parsed.hellSeen === 1 || parsed.hellSeen === 2 || parsed.hellSeen === 3 ? parsed.hellSeen : hellUnlocked ? 1 : 0;
  return {
    ...d,
    ...parsed,
    version: SAVE_VERSION,
    seed: parsed.seed,
    grid: parsed.grid,
    x: typeof parsed.x === "number" ? parsed.x : 0,
    y: typeof parsed.y === "number" ? parsed.y : 0,
    upgrades: { ...d.upgrades, ...parsed.upgrades },
    items: { ...d.items, ...parsed.items },
    cargo: Array.isArray(parsed.cargo) ? parsed.cargo : [],
    hellUnlocked,
    hellSeen,
    coolantT: typeof parsed.coolantT === "number" ? parsed.coolantT : 0,
    savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : Date.now(),
    nails: Array.isArray(parsed.nails)
      ? parsed.nails.filter((n) => n && typeof n.x === "number" && typeof n.y === "number")
      : [],
    sealsFound: typeof parsed.sealsFound === "number" ? parsed.sealsFound : 0,
  };
}

export function metaFromBlob(blob: SaveBlob): SlotMeta {
  const tileY = Math.floor(blob.y / TILE);
  const depthTiles = Math.max(0, tileY - SURFACE_Y);
  return {
    occupied: true,
    name: "",
    depth: depthMeters(tileY),
    money: Math.floor(blob.money),
    stratum: stratumName(depthTiles),
    savedAt: blob.savedAt || Date.now(),
    hellUnlocked: blob.hellUnlocked,
    bestDepth: depthMeters(blob.bestDepth + SURFACE_Y),
  };
}

function persistStorage(): void {
  try {
    void navigator.storage?.persist?.();
  } catch {
    /* ignore */
  }
}

export function readIndex(): SlotsIndex {
  migrateLegacy();
  try {
    const raw = localStorage.getItem(SLOTS_KEY);
    if (!raw) return emptyIndex();
    const parsed = JSON.parse(raw) as Partial<SlotsIndex>;
    const slots: Array<SlotMeta | null> = [];
    for (let i = 0; i < SLOT_COUNT; i++) {
      const s = Array.isArray(parsed.slots) ? parsed.slots[i] : null;
      slots.push(s && s.occupied ? { ...s, name: CLAIM_NAMES[i]! } : null);
    }
    const active = typeof parsed.active === "number" ? clampSlot(parsed.active) : null;
    return {
      version: 1,
      active: active != null && slots[active] ? active : firstOccupiedIn(slots),
      slots,
    };
  } catch {
    return emptyIndex();
  }
}

function writeIndex(idx: SlotsIndex): void {
  try {
    localStorage.setItem(SLOTS_KEY, JSON.stringify(idx));
  } catch {
    /* quota / private mode */
  }
}

function firstOccupiedIn(slots: Array<SlotMeta | null>): number | null {
  for (let i = 0; i < slots.length; i++) if (slots[i]) return i;
  return null;
}

export function firstEmptySlot(idx = readIndex()): number | null {
  for (let i = 0; i < SLOT_COUNT; i++) if (!idx.slots[i]) return i;
  return null;
}

export function firstOccupiedSlot(idx = readIndex()): number | null {
  return firstOccupiedIn(idx.slots);
}

export function setActiveSlot(i: number | null): void {
  const idx = readIndex();
  idx.active = i == null ? null : clampSlot(i);
  writeIndex(idx);
}

let migrated = false;
export function migrateLegacy(): void {
  if (migrated) return;
  migrated = true;
  try {
    if (localStorage.getItem(SLOTS_KEY)) return;
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      writeIndex(emptyIndex());
      return;
    }
    const blob = hydrateSave(JSON.parse(raw) as Partial<SaveBlob>);
    const idx = emptyIndex();
    if (blob) {
      localStorage.setItem(slotKey(0), JSON.stringify(blob));
      idx.active = 0;
      idx.slots[0] = { ...metaFromBlob(blob), name: CLAIM_NAMES[0] };
    }
    writeIndex(idx);
  } catch {
    writeIndex(emptyIndex());
  }
}

export function loadSlot(i: number): SaveBlob | null {
  try {
    const raw = localStorage.getItem(slotKey(clampSlot(i)));
    if (!raw) return null;
    return hydrateSave(JSON.parse(raw) as Partial<SaveBlob>);
  } catch {
    return null;
  }
}

export function writeSlot(i: number, blob: SaveBlob): boolean {
  const slot = clampSlot(i);
  const full: SaveBlob = { ...blob, version: SAVE_VERSION, savedAt: Date.now() };
  try {
    const key = slotKey(slot);
    const prev = localStorage.getItem(key);
    if (prev) localStorage.setItem(`${key}.bak`, prev);
    localStorage.setItem(key, JSON.stringify(full));
    const idx = readIndex();
    idx.active = slot;
    idx.slots[slot] = { ...metaFromBlob(full), name: CLAIM_NAMES[slot]! };
    writeIndex(idx);
    persistStorage();
    return true;
  } catch {
    return false;
  }
}

export function clearSlot(i: number): void {
  const slot = clampSlot(i);
  try {
    localStorage.removeItem(slotKey(slot));
  } catch {
    /* ignore */
  }
  const idx = readIndex();
  idx.slots[slot] = null;
  if (idx.active === slot) idx.active = firstOccupiedIn(idx.slots);
  writeIndex(idx);
}

export function loadSave(): SaveBlob | null {
  const idx = readIndex();
  if (idx.active != null) {
    const s = loadSlot(idx.active);
    if (s) return s;
  }
  const occ = firstOccupiedIn(idx.slots);
  return occ == null ? null : loadSlot(occ);
}

export function writeSave(blob: SaveBlob): boolean {
  const idx = readIndex();
  const i = idx.active ?? firstEmptySlot(idx) ?? 0;
  return writeSlot(i, blob);
}

export const CLAIM_KIND = "cinderwell-claim";

export function encodeClaim(blob: SaveBlob): string {
  return JSON.stringify({ kind: CLAIM_KIND, ...blob, version: SAVE_VERSION, savedAt: Date.now() });
}

export function decodeClaim(text: string): SaveBlob | null {
  try {
    const parsed = JSON.parse(text) as Partial<SaveBlob> & { kind?: string };
    if (parsed && parsed.kind && parsed.kind !== CLAIM_KIND) return null;
    return hydrateSave(parsed);
  } catch {
    return null;
  }
}

export function clearSave(): void {
  for (let i = 0; i < SLOT_COUNT; i++) {
    try {
      localStorage.removeItem(slotKey(i));
    } catch {
      /* ignore */
    }
  }
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
  writeIndex(emptyIndex());
}

export function worldFromSave(save: SaveBlob): World {
  try {
    return new World(save.seed, World.decode(save.grid));
  } catch {
    return new World(save.seed);
  }
}

export function bestSavedDepth(idx = readIndex()): number {
  let best = 0;
  for (const s of idx.slots) if (s && s.bestDepth > best) best = s.bestDepth;
  return best;
}
