import type { SaveData } from "./types";

const KEY = "glyphbound-save-v3";
const VERSION = 3;

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
  muted: false,
  shake: true,
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
});

export function loadSave(): SaveData {
  try {
    const raw =
      localStorage.getItem(KEY) ??
      localStorage.getItem("glyphbound-save-v2") ??
      localStorage.getItem("glyphbound-save-v1");
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    const base = defaultSave();
    const merged: SaveData = {
      ...base,
      ...parsed,
      version: VERSION,
      maxShield: Math.max(3, parsed.maxShield ?? 3),
      talked: parsed.talked ?? [],
      visited: parsed.visited ?? [],
      progress: Math.max(0, parsed.progress ?? 0),
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

export function writeSave(data: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...data, version: VERSION }));
  } catch {
    /* private mode */
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem("glyphbound-save-v2");
    localStorage.removeItem("glyphbound-save-v1");
  } catch {
    /* */
  }
}
