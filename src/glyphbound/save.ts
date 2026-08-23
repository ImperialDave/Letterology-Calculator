import type { SaveData } from "./types";

const KEY = "glyphbound-save-v2";
const VERSION = 2;

export const defaultSave = (): SaveData => ({
  version: VERSION,
  hasCapital: false,
  capital: false,
  party: ["c"],
  relics: [],
  words: [],
  stage1: false,
  stage2: false,
  stage3: false,
  stage4: false,
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
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem("glyphbound-save-v1");
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      ...defaultSave(),
      ...parsed,
      version: VERSION,
      maxShield: Math.max(3, parsed.maxShield ?? 3),
      talked: parsed.talked ?? [],
      visited: parsed.visited ?? [],
    };
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
    localStorage.removeItem("glyphbound-save-v1");
  } catch {
    /* */
  }
}
