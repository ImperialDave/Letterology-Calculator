import { create } from "zustand";
import type { CargoItem, ConsumableId, ShopId, Slot, UpgradesState } from "./data";
import { defaultItems, defaultUpgrades } from "./data";
import type { SlotMeta } from "./save";
import { defaultSettings, type CabSettings } from "./settings";

export type Phase = "title" | "playing" | "shop" | "paused" | "dead" | "help" | "settings";
export type SaveMenu = "load" | "save" | "new" | null;

export interface HudSnap {
  phase: Phase;
  shop: ShopId | null;
  fuel: number;
  maxFuel: number;
  hull: number;
  maxHull: number;
  money: number;
  cargo: CargoItem[];
  cargoMax: number;
  depth: number;
  bestDepth: number;
  stratum: string;
  hellUnlocked: boolean;
  coolantT: number;
  upgrades: UpgradesState;
  items: Record<ConsumableId, number>;
  prompt: string | null;
  toast: string | null;
  nearby: ShopId | null;
  atSurface: boolean;
  muted: boolean;
  shake: boolean;
  hasSave: boolean;
  deathReason: string;
  salvage: number;
  cargoLost: number;
  reducedMotion: boolean;
  saveMenu: SaveMenu;
  slots: Array<SlotMeta | null>;
  activeSlot: number | null;
  settings: CabSettings;
  fullscreen: boolean;
  kilnFed: boolean;
}

const empty: HudSnap = {
  phase: "title",
  shop: null,
  fuel: 18,
  maxFuel: 18,
  hull: 24,
  maxHull: 24,
  money: 0,
  cargo: [],
  cargoMax: 8,
  depth: 0,
  bestDepth: 0,
  stratum: "Crust",
  hellUnlocked: false,
  coolantT: 0,
  upgrades: defaultUpgrades(),
  items: defaultItems(),
  prompt: null,
  toast: null,
  nearby: null,
  atSurface: true,
  muted: false,
  shake: true,
  hasSave: false,
  deathReason: "",
  salvage: 0,
  cargoLost: 0,
  reducedMotion: false,
  saveMenu: null,
  slots: [null, null, null],
  activeSlot: null,
  settings: defaultSettings(),
  fullscreen: false,
  kilnFed: false,
};

interface Store extends HudSnap {
  apply: (p: Partial<HudSnap>) => void;
}

export const useGameUI = create<Store>((set) => ({
  ...empty,
  apply: (p) => set(p),
}));

export type { Slot };
