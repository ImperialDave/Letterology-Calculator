import { livesFor, parseDifficulty } from "./difficulty";
import type { LetterId, SaveData, SlotInfo } from "./types";

const VERSION = 3;
const KEY = "glyphbound-save-v3";
const INDEX_KEY = "glyphbound-slots-v1";
export const SLOT_COUNT = 3;

interface SlotIndex {
  version: number;
  active: number;
  updated: number[];
}

export const defaultSave = (): SaveData => ({
  version: VERSION,
  hasCapital: false,
  capital: false,
  party: ["c"],
  relics: [],
  words: [],
  progress: 0,
  stage1: false,
  stage2: false,
  stage3: false,
  stage4: false,
  stage5: false,
  hard: false,
  difficulty: "easy",
  lives: -1,
  muted: false,
  shake: true,
  shakeAmt: 2,
  sfxVol: 1,
  musicVol: 1,
  reducedMotion: false,
  keys: {},
  hp: 6,
  ink: 18,
  stage: "hub",
  checkX: 0,
  checkY: 0,
  shotLevel: 1,
  maxShield: 3,
  powerups: [],
  talked: [],
  visited: [],
  letter: "c",
  sortieBest: 0,
  sortieCleared: [],
  sortieProofs: [],
  sortieForks: [],
});

export function isEmptySave(data: SaveData) {
  return (
    data.progress <= 0 &&
    !data.hasCapital &&
    !data.stage1 &&
    data.party.length <= 1 &&
    (data.visited?.length ?? 0) === 0 &&
    (data.talked?.length ?? 0) === 0
  );
}

function slotKey(i: number) {
  return `glyphbound-slot-${i}`;
}

function store() {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}

function readIndex(): SlotIndex {
  const ls = store();
  const fallback: SlotIndex = { version: 1, active: 0, updated: [0, 0, 0] };
  if (!ls) return fallback;
  try {
    const raw = ls.getItem(INDEX_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SlotIndex>;
      const active = Math.max(0, Math.min(SLOT_COUNT - 1, parsed.active ?? 0));
      const updated = Array.from({ length: SLOT_COUNT }, (_, i) => parsed.updated?.[i] ?? 0);
      return { version: 1, active, updated };
    }
  } catch {
    /* */
  }
  migrateLegacy(ls);
  try {
    const again = ls.getItem(INDEX_KEY);
    if (again) {
      const parsed = JSON.parse(again) as Partial<SlotIndex>;
      const active = Math.max(0, Math.min(SLOT_COUNT - 1, parsed.active ?? 0));
      const updated = Array.from({ length: SLOT_COUNT }, (_, i) => parsed.updated?.[i] ?? 0);
      return { version: 1, active, updated };
    }
  } catch {
    /* */
  }
  return fallback;
}

function writeIndex(idx: SlotIndex) {
  const ls = store();
  if (!ls) return;
  try {
    ls.setItem(INDEX_KEY, JSON.stringify(idx));
  } catch {
    /* */
  }
}

function migrateLegacy(ls: Storage) {
  try {
    if (ls.getItem(INDEX_KEY) || ls.getItem(slotKey(0))) return;
    const legacy = ls.getItem(KEY) ?? ls.getItem("glyphbound-save-v2") ?? ls.getItem("glyphbound-save-v1");
    const idx: SlotIndex = { version: 1, active: 0, updated: [0, 0, 0] };
    if (legacy) {
      ls.setItem(slotKey(0), legacy);
      idx.updated[0] = Date.now();
    }
    ls.setItem(INDEX_KEY, JSON.stringify(idx));
  } catch {
    /* */
  }
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export function prefersReducedMotion() {
  try {
    return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function parseSave(raw: string | null): SaveData {
  if (!raw) return defaultSave();
  try {
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    const base = defaultSave();
    const party = Array.isArray(parsed.party) && parsed.party.length ? parsed.party : base.party;
    const letter =
      parsed.letter && party.includes(parsed.letter) ? parsed.letter : party[0] ?? "c";
    const shakeAmt: 0 | 1 | 2 =
      parsed.shakeAmt === 0 || parsed.shakeAmt === 1 || parsed.shakeAmt === 2
        ? parsed.shakeAmt
        : parsed.shake === false
          ? 0
          : 2;
    const merged: SaveData = {
      ...base,
      ...parsed,
      version: VERSION,
      party,
      letter,
      sortieBest: Math.max(0, parsed.sortieBest ?? 0),
      sortieCleared: Array.isArray(parsed.sortieCleared) ? parsed.sortieCleared : [],
      sortieProofs: Array.isArray(parsed.sortieProofs) ? parsed.sortieProofs : [],
      sortieForks: Array.isArray(parsed.sortieForks) ? parsed.sortieForks : [],
      maxShield: Math.max(3, parsed.maxShield ?? 3),
      talked: parsed.talked ?? [],
      visited: parsed.visited ?? [],
      relics: parsed.relics ?? [],
      words: parsed.words ?? [],
      powerups: parsed.powerups ?? [],
      progress: Math.max(0, parsed.progress ?? 0),
      shakeAmt,
      shake: shakeAmt > 0,
      sfxVol: clamp01(parsed.sfxVol ?? 1),
      musicVol: clamp01(parsed.musicVol ?? 1),
      reducedMotion: parsed.reducedMotion ?? prefersReducedMotion(),
      keys: parsed.keys && typeof parsed.keys === "object" ? parsed.keys : {},
      difficulty: parseDifficulty(parsed.difficulty, parsed.hard),
      lives:
        "lives" in parsed && typeof parsed.lives === "number"
          ? parsed.lives
          : livesFor(parseDifficulty(parsed.difficulty, parsed.hard)),
      hard: parseDifficulty(parsed.difficulty, parsed.hard) !== "easy",
    };
    if (merged.progress < 1 && merged.stage1) merged.progress = Math.max(merged.progress, 1);
    if (merged.progress < 2 && merged.stage2) merged.progress = Math.max(merged.progress, 2);
    if (merged.progress < 3 && merged.stage3) merged.progress = Math.max(merged.progress, 3);
    if (merged.progress < 4 && merged.stage4) merged.progress = Math.max(merged.progress, 4);
    if (merged.progress < 5 && merged.stage5) merged.progress = Math.max(merged.progress, 5);
    return merged;
  } catch {
    return defaultSave();
  }
}

function infoFrom(index: number, data: SaveData | null, updated: number): SlotInfo {
  if (!data || isEmptySave(data)) {
    return { index, empty: true, progress: 0, stage: "hub", letter: "c", party: 0, updated: 0, difficulty: "easy" };
  }
  return {
    index,
    empty: false,
    progress: data.progress,
    stage: data.stage || "hub",
    letter: data.letter,
    party: data.party.length,
    updated,
    difficulty: data.difficulty ?? "easy",
  };
}

export function activeSlot() {
  return readIndex().active;
}

export function listSlots(): SlotInfo[] {
  const ls = store();
  const idx = readIndex();
  return Array.from({ length: SLOT_COUNT }, (_, i) => {
    const raw = ls?.getItem(slotKey(i)) ?? (i === 0 && !ls?.getItem(INDEX_KEY) ? ls?.getItem(KEY) : null);
    return infoFrom(i, raw ? parseSave(raw) : null, idx.updated[i] ?? 0);
  });
}

export function loadSave(slot?: number): SaveData {
  const ls = store();
  const idx = readIndex();
  const i = slot ?? idx.active;
  const raw = ls?.getItem(slotKey(i)) ?? (i === 0 ? ls?.getItem(KEY) : null);
  return parseSave(raw ?? null);
}

export function writeSave(data: SaveData, slot?: number) {
  const ls = store();
  if (!ls) return;
  const idx = readIndex();
  const i = slot ?? idx.active;
  const now = Date.now();
  idx.active = i;
  idx.updated[i] = now;
  try {
    const payload = JSON.stringify({ ...data, version: VERSION });
    ls.setItem(slotKey(i), payload);
    ls.setItem(KEY, payload);
    writeIndex(idx);
  } catch {
    /* private mode */
  }
}

export function selectSlot(slot: number) {
  const i = Math.max(0, Math.min(SLOT_COUNT - 1, slot | 0));
  const idx = readIndex();
  idx.active = i;
  writeIndex(idx);
  return loadSave(i);
}

export function clearSlot(slot: number) {
  const ls = store();
  const i = Math.max(0, Math.min(SLOT_COUNT - 1, slot | 0));
  const idx = readIndex();
  idx.updated[i] = 0;
  if (idx.active === i) idx.active = i;
  try {
    ls?.removeItem(slotKey(i));
    if (i === idx.active) {
      ls?.removeItem(KEY);
      ls?.removeItem("glyphbound-save-v2");
      ls?.removeItem("glyphbound-save-v1");
    }
    writeIndex(idx);
  } catch {
    /* */
  }
}

/** Wipe the active file only. Other slots stay. */
export function clearSave() {
  clearSlot(activeSlot());
}
