export const TILE = 32;
export const WORLD_W = 72;
export const WORLD_H = 660;
export const SURFACE_Y = 12;
export const FIXED_DT = 1 / 60;
export const SAVE_KEY = "cinderwell.save.v1";
export const SLOTS_KEY = "cinderwell.slots.v1";
export const SAVE_VERSION = 4;
export const SLOT_COUNT = 3;
export const CLAIM_NAMES = ["Claim I", "Claim II", "Claim III"] as const;

/** Tile depths below the pad. 1 tile ≈ 2.4 m */
export const HELL_1 = 348;
export const HELL_2 = 445;
export const HELL_3 = 545;
export const GATE_THICK = 3;

export const T = {
  EMPTY: 0,
  DIRT: 1,
  PACKED: 2,
  HARD: 3,
  STONE: 4,
  BASALT: 5,
  BEDROCK: 6,
  PAD: 7,
  CORE: 8,
  GAS: 9,
  LAVA: 10,
  ORE_1: 11,
  ORE_2: 12,
  ORE_3: 13,
  ORE_4: 14,
  ORE_5: 15,
  ORE_6: 16,
  ORE_7: 17,
  ORE_8: 18,
  ORE_9: 19,
  ORE_10: 20,
  ART_FOSSIL: 21,
  ART_CACHE: 22,
  ART_BEACON: 23,
  ORE_11: 24,
  ORE_12: 25,
  ORE_13: 26,
  ORE_14: 27,
  ORE_15: 28,
  ORE_16: 29,
  CINDER: 30,
  BRIMROCK: 31,
  HEARTFIRE: 32,
  HELLGATE: 33,
  HELL_LAVA: 34,
  ART_CROWN: 35,
  ART_WELL: 36,
} as const;

export type TileId = (typeof T)[keyof typeof T];

export type OreId =
  | typeof T.ORE_1
  | typeof T.ORE_2
  | typeof T.ORE_3
  | typeof T.ORE_4
  | typeof T.ORE_5
  | typeof T.ORE_6
  | typeof T.ORE_7
  | typeof T.ORE_8
  | typeof T.ORE_9
  | typeof T.ORE_10
  | typeof T.ORE_11
  | typeof T.ORE_12
  | typeof T.ORE_13
  | typeof T.ORE_14
  | typeof T.ORE_15
  | typeof T.ORE_16;

export type ArtifactId =
  | typeof T.ART_FOSSIL
  | typeof T.ART_CACHE
  | typeof T.ART_BEACON
  | typeof T.ART_CROWN
  | typeof T.ART_WELL;

export interface OreDef {
  id: OreId;
  name: string;
  value: number;
  color: string;
  glow: string;
  minDepth: number;
  rarity: number;
}

export const ORES: OreDef[] = [
  { id: T.ORE_1, name: "Ironshard", value: 18, color: "#c8d4ea", glow: "#f2f7ff", minDepth: 0, rarity: 0.085 },
  { id: T.ORE_2, name: "Copperlode", value: 52, color: "#ff7a28", glow: "#ffd08a", minDepth: 12, rarity: 0.07 },
  { id: T.ORE_3, name: "Emberite", value: 125, color: "#ff3a14", glow: "#ff9a58", minDepth: 35, rarity: 0.055 },
  { id: T.ORE_4, name: "Viridian", value: 290, color: "#14e078", glow: "#8affc8", minDepth: 70, rarity: 0.042 },
  { id: T.ORE_5, name: "Azurevein", value: 680, color: "#1a8cff", glow: "#8ae0ff", minDepth: 110, rarity: 0.032 },
  { id: T.ORE_6, name: "Opaline", value: 1500, color: "#ff64dc", glow: "#9cfff0", minDepth: 155, rarity: 0.024 },
  { id: T.ORE_7, name: "Crimsonite", value: 3400, color: "#ff2058", glow: "#ff90b4", minDepth: 210, rarity: 0.018 },
  { id: T.ORE_8, name: "Starsteel", value: 8200, color: "#3ce8ff", glow: "#e8ffff", minDepth: 265, rarity: 0.013 },
  { id: T.ORE_9, name: "Heartstone", value: 19000, color: "#ff5c38", glow: "#ffd090", minDepth: 318, rarity: 0.01 },
  { id: T.ORE_10, name: "Voidpearl", value: 48000, color: "#b050ff", glow: "#f0d8ff", minDepth: HELL_1 + 2, rarity: 0.016 },
  { id: T.ORE_11, name: "Cinderheart", value: 88000, color: "#ff4810", glow: "#ffc060", minDepth: HELL_1 + 8, rarity: 0.02 },
  { id: T.ORE_12, name: "Brimglass", value: 145000, color: "#ffd018", glow: "#ffff98", minDepth: HELL_1 + 40, rarity: 0.014 },
  { id: T.ORE_13, name: "Ashgold", value: 240000, color: "#ffc428", glow: "#fff4b0", minDepth: HELL_2 + 4, rarity: 0.018 },
  { id: T.ORE_14, name: "Embercrown", value: 400000, color: "#ff5a18", glow: "#ffe0a0", minDepth: HELL_2 + 36, rarity: 0.012 },
  { id: T.ORE_15, name: "Infernal Core", value: 680000, color: "#ff280c", glow: "#ffe8c0", minDepth: HELL_3 + 4, rarity: 0.014 },
  { id: T.ORE_16, name: "Wellheart", value: 1250000, color: "#ffe8a8", glow: "#ffffff", minDepth: HELL_3 + 40, rarity: 0.006 },
];

export const ARTIFACTS: { id: ArtifactId; name: string; value: number; minDepth: number; rarity: number; color: string }[] = [
  { id: T.ART_FOSSIL, name: "Fossil Gear", value: 850, minDepth: 90, rarity: 0.004, color: "#f0d080" },
  { id: T.ART_CACHE, name: "Sealed Cache", value: 3200, minDepth: 190, rarity: 0.0022, color: "#ffd24a" },
  { id: T.ART_BEACON, name: "Old Beacon", value: 9000, minDepth: 300, rarity: 0.0012, color: "#40f0e8" },
  { id: T.ART_CROWN, name: "Ash Crown", value: 220000, minDepth: HELL_2 + 10, rarity: 0.0028, color: "#ffb040" },
  { id: T.ART_WELL, name: "Well Seal", value: 800000, minDepth: HELL_3 + 20, rarity: 0.0016, color: "#ffe8c0" },
];

export type BaseSlot = "drill" | "hull" | "engine" | "tank" | "cargo" | "radiator";
export type KilnSlot = "scanner" | "lift" | "veil";
export type LatticeSlot = "phase" | "siphon" | "resonator" | "anchor" | "cipher";
export type Slot = BaseSlot | KilnSlot | LatticeSlot;

export const BASE_SLOTS: BaseSlot[] = ["drill", "hull", "engine", "tank", "cargo", "radiator"];
export const KILN_MODULE_SLOTS: KilnSlot[] = ["scanner", "lift", "veil"];
export const LATTICE_SLOTS: LatticeSlot[] = ["phase", "siphon", "resonator", "anchor", "cipher"];
/** Last upgrade index sold at Rigworks (0-based). Tiers after this are Kiln-only. */
export const RIGWORKS_MAX = 5;
/** Last base-slot index the Kiln will sell (Heartbit / Molten Aegis). */
export const KILN_BASE_MAX = 7;

export interface UpgradeTier {
  name: string;
  cost: number;
  value: number;
}

export const UPGRADES: Record<Slot, UpgradeTier[]> = {
  drill: [
    { name: "Worn Bit", cost: 0, value: 1 },
    { name: "Carbide Cone", cost: 380, value: 1.7 },
    { name: "Helix Carbide", cost: 1400, value: 2.6 },
    { name: "Diamondedge", cost: 5200, value: 3.8 },
    { name: "Plasma Lance", cost: 18000, value: 5.6 },
    { name: "Singularity Bit", cost: 62000, value: 8.2 },
    { name: "Helllance", cost: 145000, value: 11.4 },
    { name: "Heartbit", cost: 390000, value: 15.2 },
  ],
  hull: [
    { name: "Tin Skin", cost: 0, value: 24 },
    { name: "Riveted Steel", cost: 420, value: 40 },
    { name: "Titanium Cage", cost: 1600, value: 64 },
    { name: "Composite Shell", cost: 5800, value: 96 },
    { name: "Aegis Plate", cost: 20000, value: 140 },
    { name: "Phase Shield", cost: 68000, value: 200 },
    { name: "Cinderplate", cost: 155000, value: 280 },
    { name: "Molten Aegis", cost: 410000, value: 380 },
    { name: "Lattice Skin", cost: 1800000, value: 420 },
  ],
  engine: [
    { name: "Single Piston", cost: 0, value: 118 },
    { name: "Twin Stroke", cost: 360, value: 150 },
    { name: "Turbofan", cost: 1300, value: 188 },
    { name: "Maglev Drive", cost: 4800, value: 232 },
    { name: "Ion Thruster", cost: 16000, value: 286 },
    { name: "Void Pulse", cost: 54000, value: 350 },
    { name: "Sootwing", cost: 125000, value: 420 },
    { name: "Ashjet", cost: 350000, value: 510 },
  ],
  tank: [
    { name: "Jerrycan", cost: 0, value: 18 },
    { name: "Saddle Tank", cost: 320, value: 28 },
    { name: "Drum Cell", cost: 1100, value: 44 },
    { name: "Cryo Reservoir", cost: 4000, value: 66 },
    { name: "Compression Cell", cost: 14000, value: 96 },
    { name: "Fusion Flask", cost: 48000, value: 140 },
    { name: "Brimcell", cost: 115000, value: 195 },
    { name: "Infernal Flask", cost: 330000, value: 270 },
  ],
  cargo: [
    { name: "Crate", cost: 0, value: 8 },
    { name: "Lockbox", cost: 280, value: 14 },
    { name: "Hold", cost: 980, value: 22 },
    { name: "Hauler Bay", cost: 3400, value: 34 },
    { name: "Vault", cost: 12000, value: 50 },
    { name: "Bottomless Hopper", cost: 40000, value: 80 },
    { name: "Abyssal Hold", cost: 105000, value: 115 },
    { name: "Soul Hopper", cost: 290000, value: 160 },
  ],
  radiator: [
    { name: "Cooling Fins", cost: 0, value: 0 },
    { name: "Dual Fans", cost: 760, value: 0.16 },
    { name: "Coolant Loop", cost: 2400, value: 0.32 },
    { name: "Cryo Coil", cost: 8200, value: 0.48 },
    { name: "Heat Pump", cost: 26000, value: 0.66 },
    { name: "Entropy Sink", cost: 82000, value: 0.84 },
    { name: "Ashveil Coil", cost: 185000, value: 0.9 },
    { name: "Null Sink", cost: 430000, value: 0.95 },
  ],
  scanner: [
    { name: "Naked Eye", cost: 0, value: 7 },
    { name: "Ping Dish", cost: 14000, value: 12 },
    { name: "Vein Scope", cost: 52000, value: 17 },
    { name: "Ash Sonar", cost: 155000, value: 24 },
  ],
  lift: [
    { name: "Dead Weight", cost: 0, value: 0 },
    { name: "Coil Winch", cost: 16000, value: 0.2 },
    { name: "Mag Spool", cost: 58000, value: 0.34 },
    { name: "Void Lift", cost: 170000, value: 0.5 },
  ],
  veil: [
    { name: "Open Cab", cost: 0, value: 0 },
    { name: "Soot Veil", cost: 18000, value: 0.16 },
    { name: "Ash Shroud", cost: 64000, value: 0.28 },
    { name: "Null Cloak", cost: 190000, value: 0.42 },
  ],
  phase: [
    { name: "Steel Face", cost: 0, value: 0 },
    { name: "Ghostedge", cost: 720000, value: 1 },
    { name: "Two-stroke", cost: 3400000, value: 2 },
    { name: "Null Interval", cost: 12000000, value: 3 },
  ],
  siphon: [
    { name: "Sealed Tank", cost: 0, value: 0 },
    { name: "Magma Tap", cost: 550000, value: 1 },
    { name: "Brim Siphon", cost: 2800000, value: 2 },
    { name: "Heartwell", cost: 9500000, value: 3 },
  ],
  resonator: [
    { name: "Deaf Cab", cost: 0, value: 0 },
    { name: "Vein Bell", cost: 680000, value: 1 },
    { name: "Assay Pulse", cost: 3100000, value: 2 },
    { name: "Chorus", cost: 11000000, value: 3 },
  ],
  anchor: [
    { name: "No Spike", cost: 0, value: 0 },
    { name: "Spike", cost: 500000, value: 1 },
    { name: "Midwell Nail", cost: 2200000, value: 2 },
    { name: "Twin Nail", cost: 8000000, value: 3 },
  ],
  cipher: [
    { name: "Plain Lamp", cost: 0, value: 0 },
    { name: "Pigment Lamp", cost: 900000, value: 1 },
    { name: "CC33 Cipher", cost: 4500000, value: 2 },
    { name: "Well Index", cost: 15000000, value: 3 },
  ],
};

export const SLOT_LABEL: Record<Slot, string> = {
  drill: "Drill",
  hull: "Hull",
  engine: "Engine",
  tank: "Fuel Tank",
  cargo: "Cargo Bay",
  radiator: "Radiator",
  scanner: "Scanner",
  lift: "Lift Coil",
  veil: "Ash Veil",
  phase: "Phase Bit",
  siphon: "Welltap",
  resonator: "Resonator",
  anchor: "Anchor",
  cipher: "Letterlock",
};

export const SLOT_BLURB: Record<Slot, string> = {
  drill: "Cuts faster through packed ground.",
  hull: "Takes more punishment before the rig folds.",
  engine: "Climb and cruise speed.",
  tank: "How long you can stay below.",
  cargo: "Ore you can haul in one descent.",
  radiator: "Bleeds heat from gas and magma.",
  scanner: "Paints nearby veins through the rock.",
  lift: "Burns less fuel climbing out of the well.",
  veil: "Shrugs off the Emberward's ambient heat.",
  phase: "Cuts hardness the Kiln cannot. Later, walks the dirt.",
  siphon: "Turns magma and well-heat into fuel.",
  resonator: "Hears veins through rock. The Chorus sells from below.",
  anchor: "Nails a recall in the well so the pad is not the only home.",
  cipher: "CC33's lamp. Finds what the well is hiding.",
};

export const CONSUMABLES = {
  dynamite: { name: "Charge", cost: 340, desc: "Blasts a 3×3 pocket. Space.", shop: "depot" as const },
  fuelCan: { name: "Spare Can", cost: 160, desc: "Refills 40% of the tank. F.", shop: "depot" as const },
  nanobots: { name: "Patch Kit", cost: 260, desc: "Repairs 45 hull. R.", shop: "depot" as const },
  teleporter: { name: "Recall Beacon", cost: 880, desc: "Snap back to the pad. T.", shop: "depot" as const },
  hellcharge: { name: "Hellcharge", cost: 2400, desc: "Blasts a 5×5 pocket. X.", shop: "kiln" as const },
  coolant: { name: "Coolant Shot", cost: 1100, desc: "12s of heat immunity. C.", shop: "kiln" as const },
  nullcharge: { name: "Nullcharge", cost: 85000, desc: "Blasts a 7×7 pocket. V.", shop: "lattice" as const },
} as const;

export type ConsumableId = keyof typeof CONSUMABLES;

export const FUEL_PRICE = 2.2;
export const HULL_PRICE = 5.5;
export const SALVAGE_RATE = 0.12;
export const STIPEND = 90;

export const BUILDINGS = [
  { id: "exchange" as const, name: "Exchange", x0: 14, x1: 22, blurb: "Sell ore", requiresHell: false, requiresHeartfire: false },
  { id: "rigworks" as const, name: "Rigworks", x0: 32, x1: 41, blurb: "Upgrades", requiresHell: false, requiresHeartfire: false },
  { id: "depot" as const, name: "Depot", x0: 50, x1: 59, blurb: "Fuel & repair", requiresHell: false, requiresHeartfire: false },
  { id: "kiln" as const, name: "Kiln", x0: 2, x1: 9, blurb: "Hell iron", requiresHell: true, requiresHeartfire: false },
  { id: "lattice" as const, name: "Lattice", x0: 62, x1: 70, blurb: "Club iron", requiresHell: true, requiresHeartfire: true },
];

export type ShopId = (typeof BUILDINGS)[number]["id"];

export const SPAWN_TX = 26;

export const HEAT_DPS = [0, 3.6, 6.4, 9.8] as const;

export function isSolid(t: number): boolean {
  return t !== T.EMPTY;
}

export function isDiggable(t: number): boolean {
  return t !== T.EMPTY && t !== T.CORE && t !== T.BEDROCK;
}

export function isOre(t: number): t is OreId {
  return (t >= T.ORE_1 && t <= T.ORE_10) || (t >= T.ORE_11 && t <= T.ORE_16);
}

export function isArtifact(t: number): t is ArtifactId {
  return t === T.ART_FOSSIL || t === T.ART_CACHE || t === T.ART_BEACON || t === T.ART_CROWN || t === T.ART_WELL;
}

export function isLava(t: number): boolean {
  return t === T.LAVA || t === T.HELL_LAVA;
}

export function crumbColor(t: number): string {
  if (isOre(t)) return oreById(t)?.color ?? "#8a6a4a";
  if (isArtifact(t)) return artifactById(t)?.color ?? "#c4b49a";
  switch (t) {
    case T.DIRT:
      return "#7a5840";
    case T.PACKED:
      return "#5a4030";
    case T.HARD:
      return "#4a382c";
    case T.STONE:
      return "#4a4640";
    case T.BASALT:
    case T.BEDROCK:
      return "#2c2824";
    case T.PAD:
      return "#6a6258";
    case T.CINDER:
      return "#6a3018";
    case T.BRIMROCK:
      return "#5a2014";
    case T.HEARTFIRE:
    case T.CORE:
      return "#8a2810";
    case T.HELLGATE:
      return "#3a1810";
    case T.GAS:
      return "#9cbf4a";
    case T.LAVA:
      return "#e05a20";
    case T.HELL_LAVA:
      return "#ff8040";
    default:
      return "#6b5344";
  }
}

export function hardness(t: number, depth: number): number {
  if (t === T.GAS || t === T.LAVA || t === T.HELL_LAVA) return 0.45;
  if (isOre(t) || isArtifact(t)) return 1.15 + depth * 0.004;
  switch (t) {
    case T.DIRT:
      return 0.7;
    case T.PAD:
      return 0.55;
    case T.PACKED:
      return 1.35;
    case T.HARD:
      return 2.2;
    case T.STONE:
      return 3.4;
    case T.BASALT:
      return 5.1;
    case T.CINDER:
      return 6.4;
    case T.BRIMROCK:
      return 7.7;
    case T.HEARTFIRE:
      return 9.2;
    case T.HELLGATE:
      return 11.5;
    case T.BEDROCK:
      return 99;
    default:
      return 1;
  }
}

export function dirtForDepth(d: number): number {
  if (d < 28) return T.DIRT;
  if (d < 70) return T.PACKED;
  if (d < 130) return T.HARD;
  if (d < 220) return T.STONE;
  if (d < HELL_1 - GATE_THICK) return T.BASALT;
  if (d < HELL_1) return T.HELLGATE;
  if (d < HELL_2 - GATE_THICK) return T.CINDER;
  if (d < HELL_2) return T.HELLGATE;
  if (d < HELL_3 - GATE_THICK) return T.BRIMROCK;
  if (d < HELL_3) return T.HELLGATE;
  return T.HEARTFIRE;
}

export function hellLevel(d: number): 0 | 1 | 2 | 3 {
  if (d >= HELL_3) return 3;
  if (d >= HELL_2) return 2;
  if (d >= HELL_1) return 1;
  return 0;
}

export function stratumName(d: number): string {
  if (d >= HELL_3) return "Heartfire";
  if (d >= HELL_2) return "Brimdeep";
  if (d >= HELL_1) return "Emberward";
  if (d >= 220) return "Mantle";
  if (d >= 130) return "Deep crust";
  if (d >= 70) return "Hardpan";
  if (d >= 28) return "Packed silt";
  return "Crust";
}

export function oreById(id: number): OreDef | undefined {
  return ORES.find((o) => o.id === id);
}

export function artifactById(id: number) {
  return ARTIFACTS.find((a) => a.id === id);
}

export function oreValueAtDepth(def: OreDef, depth: number): number {
  const extra = Math.max(0, depth - def.minDepth);
  return Math.round(def.value * (1 + extra * 0.0045));
}

export function depthMeters(tileY: number): number {
  return Math.max(0, Math.floor((tileY - SURFACE_Y) * 2.4));
}

export type UpgradesState = Record<Slot, number>;

export function defaultUpgrades(): UpgradesState {
  return {
    drill: 0,
    hull: 0,
    engine: 0,
    tank: 0,
    cargo: 0,
    radiator: 0,
    scanner: 0,
    lift: 0,
    veil: 0,
    phase: 0,
    siphon: 0,
    resonator: 0,
    anchor: 0,
    cipher: 0,
  };
}

export function defaultItems(): Record<ConsumableId, number> {
  return { dynamite: 2, fuelCan: 0, nanobots: 0, teleporter: 0, hellcharge: 0, coolant: 0, nullcharge: 0 };
}

export interface CargoItem {
  id: OreId;
  name: string;
  value: number;
}

export function cargoValue(cargo: CargoItem[]): number {
  return cargo.reduce((s, c) => s + c.value, 0);
}

export function visibleBuildings(hellUnlocked: boolean, heartfire = false) {
  return BUILDINGS.filter((b) => {
    if (b.requiresHeartfire && !heartfire) return false;
    if (b.requiresHell && !hellUnlocked) return false;
    return true;
  });
}

export function latticeUnlocked(hellSeen: number): boolean {
  return hellSeen >= 3;
}

export function nailCap(anchor: number): number {
  if (anchor >= 2) return 2;
  if (anchor >= 1) return 1;
  return 0;
}

export type Nail = { x: number; y: number };
