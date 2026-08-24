export type LetterId = "c" | "s" | "b";
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
  | "codex";

export type RelicId = "dropCap" | "spine" | "copper" | "counter";
export type WordId = "WALL" | "BURN" | "RISE" | "LOCK";
export type ThemeId = "hub" | "street" | "fort" | "canal" | "coil";
export type LevelId = "hub" | "stage1" | "stage2" | "stage3" | "stage4";

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
  | "dummy"
  | "dualis"
  | "tetrarch"
  | "importer";

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
  t: number;
  hurt: number;
  flash: number;
  stun: number;
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

export interface Solid {
  x: number;
  y: number;
  w: number;
  h: number;
  type: "solid" | "oneway" | "vent" | "break" | "spike" | "laser" | "sluice" | "crumble";
  broken?: boolean;
  phase?: number;
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
  attack: number;
  attackHit: boolean;
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
}

export interface TaskDef {
  id: string;
  text: string;
  need?: "stage1" | "stage2" | "stage3" | "stage4";
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
  stage1: boolean;
  stage2: boolean;
  stage3: boolean;
  stage4: boolean;
  hard: boolean;
  muted: boolean;
  shake: boolean;
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
  hard: boolean;
  canContinue: boolean;
  introPage: number;
  hasCapital: boolean;
  stage1: boolean;
  stage2: boolean;
  stage3: boolean;
  stage4: boolean;
  transforming: number;
  shield: number;
  maxShield: number;
  shotLevel: number;
  hint: string;
  lore: { id: string; glyph: string; name: string; lines: string[] }[];
}

export const VIEW_W = 640;
export const VIEW_H = 360;
export const TILE = 48;
export const STEP = 1 / 60;
