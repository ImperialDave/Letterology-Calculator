export type LetterId = "c" | "s" | "b" | "e" | "r" | "k" | "n" | "t";
export type Mode =
  | "title"
  | "intro"
  | "hub"
  | "play"
  | "pause"
  | "dead"
  | "win"
  | "transform"
  | "dialogue"
  | "codex"
  | "studio";

export type Difficulty = "easy" | "hard" | "extreme";

export type RelicId = "dropCap" | "spine" | "copper" | "counter";
export type WordId = "WALL" | "BURN" | "RISE" | "LOCK" | "FOLD" | "TIDE";
export type ThemeId =
  | "hub"
  | "street"
  | "fort"
  | "canal"
  | "coil"
  | "vault"
  | "abyss"
  | "spire"
  | "orbit"
  | "glacier"
  | "remainder";

export const THEME_IDS: ThemeId[] = [
  "hub",
  "street",
  "fort",
  "canal",
  "coil",
  "vault",
  "abyss",
  "spire",
  "orbit",
  "glacier",
  "remainder",
];

/** hub + stage1..stageN. N is STAGE_COUNT. */
export type LevelId = "hub" | `stage${number}`;

export const STAGE_COUNT = 60;
export const FIRST_BOOK = 30;
/** Last hand-authored Numberomicon ledger. Unbound Sentence starts at 16. */
export const SECOND_BOOK = 15;

export type EnemyKind =
  | "one"
  | "zero"
  | "two"
  | "three"
  | "four"
  | "five"
  | "six"
  | "seven"
  | "eight"
  | "nine"
  | "dummy"
  | "dualis"
  | "tetrarch"
  | "importer"
  | "nullis"
  | "triad"
  | "nullring"
  | "mobius"
  | "summoner"
  | "gradient"
  | "crossseal"
  | "archivist"
  | "iris"
  | "archivant"
  | "endmark"
  | "plus"
  | "minus"
  | "times"
  | "divide"
  | "pi"
  | "radix"
  | "summand"
  | "difference"
  | "product"
  | "quotient"
  | "infinitum"
  | "remainder";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  kind: "spark" | "ink" | "dust" | "ember" | "glyph";
  label?: string;
}

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  from: "player" | "enemy";
  dmg: number;
  life: number;
  kind: string;
  alive: boolean;
  pierce: number;
}

export interface Enemy {
  kind: EnemyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  facing: 1 | -1;
  /** Seconds left before chase may turn again. Stops facing flicker. */
  turnLock: number;
  t: number;
  hurt: number;
  flash: number;
  stun: number;
  /** Smash-style damage percent; grows knockback. */
  percent: number;
  alive: boolean;
  grounded: boolean;
  phase: number;
  aux: number;
  aux2: number;
  armor: number;
  name: string;
}

export interface Pickup {
  kind:
    | "ink"
    | "heart"
    | "word"
    | "relic"
    | "recruit"
    | "door"
    | "case"
    | "check"
    | "drop"
    | "fang"
    | "scale"
    | "portal"
    | "secret";
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  taken: boolean;
  label?: string;
}

export interface Construct {
  x: number;
  y: number;
  w: number;
  h: number;
  life: number;
  max: number;
  kind: "plat" | "wall";
}

export interface Npc {
  id: string;
  glyph: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  lines: string[];
}

export type SolidType =
  | "solid"
  | "oneway"
  | "vent"
  | "break"
  | "spike"
  | "laser"
  | "sluice"
  | "crumble"
  | "conveyor"
  | "bounce"
  | "fan"
  | "lift"
  | "blink"
  | "saw"
  | "geyser"
  | "censer"
  | "stamper"
  | "guillotine"
  | "dropcap"
  | "grate"
  | "rotor"
  | "sinkink"
  | "shutter"
  | "carriage"
  | "echo";

export interface Solid {
  x: number;
  y: number;
  w: number;
  h: number;
  type: SolidType;
  broken?: boolean;
  phase?: number;
  homeX?: number;
  homeY?: number;
}

export interface Marker {
  x: number;
  y: number;
  dir: 1 | -1 | 0;
  kind: "arrow" | "spark" | "down";
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  letter: LetterId;
  capital: boolean;
  facing: 1 | -1;
  hp: number;
  maxHp: number;
  ink: number;
  maxInk: number;
  coyote: number;
  jumpBuf: number;
  jumpCut: boolean;
  grounded: boolean;
  invuln: number;
  hazardCd: number;
  attack: number;
  attackHit: boolean;
  melee: number;
  meleeMax: number;
  meleeCharge: number;
  meleeMove: string;
  meleeHits: number;
  jabStep: number;
  jabQueue: boolean;
  jabWindow: number;
  smashKind: "" | "side" | "up" | "down";
  smashPower: number;
  flourish: number;
  flourishMax: number;
  flourishCd: number;
  flourishHits: number;
  special: number;
  specialCd: number;
  roll: number;
  squash: number;
  stretch: number;
  anim: number;
  hurtFlash: number;
  shield: number;
  maxShield: number;
  shieldCd: number;
  shieldFlash: number;
  shotLevel: number;
  shotCd: number;
  airHop: number;
  /** Jump-cancel window after an up-tilt hop. */
  upHop: number;
  /** Rising uair already used this airtime. */
  upBoost: boolean;
  /** Air dash attack already used this airtime. */
  airDashAtk: boolean;
  /** Shared ground/air dash attack cooldown. */
  dashCd: number;
  /** Lip hang: wall is on this side of the body. */
  ledgeHang: "" | "left" | "right";
  ledgeLock: number;
  heat: number;
  heatIdle: number;
  art: number;
  artMax: number;
  artHits: number;
  heatSmash: number;
  heatSmashMax: number;
  heatSmashHits: number;
  superKind: "" | "art" | "heat" | "finisher" | "special";
  stringStep: number;
  stringWindow: number;
  stringBranch: "staple" | "launch" | "low";
  skillHold: number;
  skillArmed: boolean;
  landLag: boolean;
  artArmor: boolean;
  superFlash: number;
}

export interface TaskDef {
  id: string;
  text: string;
  need?: number;
}

export interface TaskSnap {
  id: string;
  text: string;
  done: boolean;
}

export interface SaveData {
  version: number;
  hasCapital: boolean;
  capital: boolean;
  party: LetterId[];
  relics: RelicId[];
  words: WordId[];
  /** Highest stage index cleared (1..STAGE_COUNT). 0 = nothing cleared. */
  progress: number;
  stage1: boolean;
  stage2: boolean;
  stage3: boolean;
  stage4: boolean;
  stage5: boolean;
  /** Legacy Precision Grid flag. Migrates into `difficulty`. */
  hard: boolean;
  difficulty: Difficulty;
  /** Remaining wakes on Hard/Extreme. Ignored on Easy. */
  lives: number;
  muted: boolean;
  shake: boolean;
  /** 0 off · 1 low · 2 full. `shake` stays in sync (amt > 0). */
  shakeAmt: 0 | 1 | 2;
  sfxVol: number;
  musicVol: number;
  reducedMotion: boolean;
  keys: Partial<Record<string, string>>;
  hp: number;
  ink: number;
  stage: string;
  checkX: number;
  checkY: number;
  shotLevel: number;
  maxShield: number;
  powerups: string[];
  talked: string[];
  visited: string[];
  letter: LetterId;
}

export interface UiSnap {
  mode: Mode;
  hp: number;
  maxHp: number;
  ink: number;
  maxInk: number;
  letter: LetterId;
  capital: boolean;
  party: LetterId[];
  words: WordId[];
  selectedWord: number;
  objective: string;
  tasks: TaskSnap[];
  boss: { name: string; hp: number; max: number } | null;
  toast: string;
  dialogue: { name: string; text: string; who: string } | null;
  stage: string;
  muted: boolean;
  shake: boolean;
  shakeAmt: 0 | 1 | 2;
  sfxVol: number;
  musicVol: number;
  reducedMotion: boolean;
  keys: Partial<Record<string, string>>;
  difficulty: Difficulty;
  lives: number;
  livesMax: number;
  canContinue: boolean;
  introPage: number;
  hasCapital: boolean;
  stage1: boolean;
  stage2: boolean;
  stage3: boolean;
  stage4: boolean;
  stage5: boolean;
  progress: number;
  transforming: number;
  shield: number;
  maxShield: number;
  shotLevel: number;
  heat: number;
  hint: string;
  lore: { id: string; glyph: string; name: string; lines: string[] }[];
  sandbox: boolean;
  stageId: string;
  proof: boolean;
  god: boolean;
  replayOpen: boolean;
  slot: number;
  slots: SlotInfo[];
}

export interface SlotInfo {
  index: number;
  empty: boolean;
  progress: number;
  stage: string;
  letter: LetterId;
  party: number;
  updated: number;
  difficulty: Difficulty;
}

export const VIEW_W = 800;
export const VIEW_H = 360;
export const TILE = 48;
/** Spike, laser, saw, and sluice hits. Digit contact stays 1. */
export const HAZARD_DAMAGE = 2;
/** Seconds between hazard HP ticks so a pin does not melt the party. */
export const HAZARD_COOLDOWN = 0.5;
export const STEP = 1 / 60;
