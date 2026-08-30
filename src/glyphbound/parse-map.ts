import { ENEMY_CHAR_LIST, ENEMY_CHARS } from "./catalog";
import { LORE, loreIdFromGlyph } from "./lore";
import { RECRUIT_LETTERS } from "./roster";
import {
  TILE,
  type EnemyKind,
  type LetterId,
  type Marker,
  type Npc,
  type Pickup,
  type RelicId,
  type Solid,
  type WordId,
} from "./types";

export interface ParseCtx {
  id: string;
  exit?: "hub" | "win";
  index?: number;
  isHub: boolean;
  party: LetterId[];
  words: WordId[];
  relics: RelicId[];
  hasCapital: boolean;
  powerups: string[];
  maxShield: number;
  shotLevel: number;
  talked: string[];
  bossKind: EnemyKind;
  progress: number;
}

export interface EnemySpawn {
  kind: EnemyKind;
  x: number;
  y: number;
}

export interface ParsedMap {
  solids: Solid[];
  enemySpawns: EnemySpawn[];
  pickups: Pickup[];
  npcs: Npc[];
  markers: Marker[];
  spawnX: number;
  spawnY: number;
  worldW: number;
  worldH: number;
}

const HUB_DOORS: Record<string, { id: string; label: string }> = {
  "[": { id: "stage1", label: "EXCHANGE" },
  "]": { id: "stage2", label: "FORT" },
  "{": { id: "stage3", label: "PRESS" },
  "}": { id: "stage4", label: "COIL" },
  "(": { id: "stage5", label: "LEDGER" },
  "7": { id: "stage7", label: "KEYSTROKE" },
  "8": { id: "stage8", label: "FOURFOLD" },
  A: { id: "stage10", label: "AMPERSAND" },
  B: { id: "stage12", label: "SCRIPTORIUM" },
  C: { id: "stage15", label: "ICONOSTASIS" },
};

const emptyCtx = (): ParseCtx => ({
  id: "hub",
  exit: "hub",
  index: 0,
  isHub: true,
  party: ["c"],
  words: [],
  relics: [],
  hasCapital: false,
  powerups: [],
  maxShield: 3,
  shotLevel: 1,
  talked: [],
  bossKind: "dualis",
  progress: 0,
});

export function parseRows(rows: string[], ctx: Partial<ParseCtx> = {}): ParsedMap {
  const c: ParseCtx = { ...emptyCtx(), ...ctx };
  const solids: Solid[] = [];
  const enemySpawns: EnemySpawn[] = [];
  const pickups: Pickup[] = [];
  const npcs: Npc[] = [];
  const markers: Marker[] = [];
  let spawnX = 80;
  let spawnY = 80;
  const H = rows.length;
  const W = rows[0]?.length ?? 0;

  const pushNpc = (ch: string, x: number, y: number) => {
    const who = loreIdFromGlyph(ch);
    const def = LORE[who];
    if (!def) return;
    if (c.talked.includes(who)) return;
    if (npcs.some((n) => n.id === who)) return;
    npcs.push({
      id: who,
      glyph: def.glyph,
      name: def.name,
      x: x + 4,
      y: y - 16,
      w: 36,
      h: 48,
      lines: def.lines,
    });
  };

  for (let ty = 0; ty < H; ty++) {
    for (let tx = 0; tx < (rows[ty]?.length ?? 0); tx++) {
      const ch = rows[ty][tx];
      const x = tx * TILE;
      const y = ty * TILE;
      if (ch === "#") solids.push({ x, y, w: TILE, h: TILE, type: "solid" });
      else if (ch === "=") solids.push({ x, y, w: TILE, h: 10, type: "oneway" });
      else if (ch === "v") solids.push({ x, y, w: TILE, h: TILE, type: "vent" });
      else if (ch === "*") solids.push({ x, y, w: TILE, h: TILE, type: "break" });
      else if (ch === "^") {
        const pulse = (tx * 17 + ty * 31) % 10 < 3;
        solids.push({
          x,
          y: y + 18,
          w: TILE,
          h: 22,
          type: "spike",
          phase: pulse ? tx * 0.41 + ty * 0.17 : undefined,
        });
      } else if (ch === "~") solids.push({ x, y: y + 18, w: TILE, h: 30, type: "sluice" });
      else if (ch === "-") solids.push({ x, y, w: TILE, h: 10, type: "crumble", phase: 0 });
      else if (ch === "|") solids.push({ x: x + 18, y, w: 12, h: TILE, type: "laser", phase: tx * 0.37 });
      else if (ch === "/") solids.push({ x, y: y + 28, w: TILE, h: 12, type: "conveyor", phase: 1 });
      else if (ch === "\\") solids.push({ x, y: y + 28, w: TILE, h: 12, type: "conveyor", phase: -1 });
      else if (ch === "T") solids.push({ x: x + 4, y: y + 28, w: TILE - 8, h: 12, type: "bounce" });
      else if (ch === "_") solids.push({ x, y: y + 34, w: TILE, h: 6, type: "oneway" });
      else if (ch === "&") solids.push({ x: x + 6, y: y + 12, w: TILE - 12, h: TILE - 12, type: "solid" });
      else if (ch === ":") solids.push({ x: x + 10, y, w: 28, h: TILE, type: "fan" });
      else if (ch === "`") {
        solids.push({
          x,
          y: y + 28,
          w: TILE,
          h: 12,
          type: "lift",
          homeX: x,
          homeY: y + 28,
          phase: tx * 0.47,
        });
      } else if (ch === ")") {
        solids.push({
          x,
          y: y + 28,
          w: TILE,
          h: 12,
          type: "blink",
          phase: tx * 0.53,
        });
      } else if (ch === "S") {
        solids.push({
          x,
          y: y + 12,
          w: TILE,
          h: 24,
          type: "saw",
          homeX: x,
          homeY: y + 12,
          phase: tx * 0.71,
        });
      } else if (ch === "g") {
        const left = tx > 0 ? rows[ty][tx - 1] : "#";
        const right = tx + 1 < (rows[ty]?.length ?? 0) ? rows[ty][tx + 1] : "#";
        const floorish =
          left === "#" ||
          left === "g" ||
          left === "*" ||
          right === "#" ||
          right === "g" ||
          right === "*";
        if (floorish) {
          solids.push({
            x: x + 8,
            y,
            w: TILE - 16,
            h: TILE,
            type: "geyser",
            phase: tx * 0.33,
          });
        } else {
          pushNpc("g", x, y);
        }
      } else if (ch === "@") {
        spawnX = x + 8;
        spawnY = y;
      } else if (ch === ">" || ch === "<" || ch === "V") {
        if (c.isHub && (ch === ">" || ch === "<")) {
          const cont = ch === ">";
          const w = cont ? 120 : 72;
          const h = cont ? 104 : 88;
          pickups.push({
            kind: "door",
            id: cont ? "continue" : "replay",
            x: x + (TILE - w) / 2,
            y: y + TILE - h,
            w,
            h,
            taken: false,
            label: cont ? "THE REST OF THE BOOK" : "LAST PAGE",
          });
        } else {
          markers.push({
            x,
            y,
            dir: ch === "<" ? -1 : 1,
            kind: ch === "V" ? "down" : "arrow",
          });
        }
      } else if (c.isHub && HUB_DOORS[ch]) {
        const d = HUB_DOORS[ch];
        pickups.push({
          kind: "door",
          id: d.id,
          x: x - 12,
          y: y + TILE - 96,
          w: 72,
          h: 96,
          taken: false,
          label: d.label,
        });
      } else if (ch === "!" || ENEMY_CHAR_LIST.includes(ch)) {
        enemySpawns.push({
          kind: ch === "!" ? c.bossKind : ENEMY_CHARS[ch],
          x,
          y,
        });
      } else if (!c.isHub && RECRUIT_LETTERS.includes(ch as LetterId)) {
        const rid = ch as LetterId;
        if (!c.party.includes(rid)) {
          const def = LORE[rid as keyof typeof LORE];
          if (def) {
            npcs.push({
              id: "recruit-" + rid,
              glyph: def.glyph,
              name: def.name,
              x: x + 4,
              y: y - 8,
              w: 28,
              h: 36,
              lines: def.lines,
            });
          }
          pickups.push({
            kind: "recruit",
            id: rid,
            x: x + 6,
            y: y,
            w: 24,
            h: 28,
            taken: false,
            label: ch,
          });
        }
      } else if (ch === "i" || ch === "h" || ch === "o") {
        const below = ty + 1 < H ? rows[ty + 1][tx] : "#";
        const onSolid = below === "#" || below === "=" || below === "*";
        if (!onSolid) pushNpc(ch, x, y);
        else if (ch === "i") {
          pickups.push({ kind: "ink", id: "i" + tx + ty, x: x + 12, y: y + 12, w: 16, h: 16, taken: false });
        } else if (ch === "h") {
          pickups.push({ kind: "heart", id: "h" + tx + ty, x: x + 12, y: y + 10, w: 16, h: 16, taken: false });
        } else {
          const pid = "scale-" + c.id + "-" + tx + "-" + ty;
          pickups.push({
            kind: "scale",
            id: pid,
            x: x + 8,
            y: y + 8,
            w: 28,
            h: 28,
            taken: c.powerups.includes(pid) || c.maxShield >= 5,
            label: "SCALE",
          });
        }
      } else if (/^[a-z]$/.test(ch)) {
        const leftStacks = c.isHub && "knt".includes(ch) && c.progress >= 5 && !c.party.includes(ch as LetterId);
        if (!leftStacks) pushNpc(ch, x, y);
      } else if (ch === "+") {
        const pid = "fang-" + c.id + "-" + tx + "-" + ty;
        pickups.push({
          kind: "fang",
          id: pid,
          x: x + 8,
          y: y + 8,
          w: 28,
          h: 28,
          taken: c.powerups.includes(pid) || c.shotLevel >= 4,
          label: "FANG",
        });
      } else if (ch === "W" || ch === "R" || ch === "X" || ch === "Z" || ch === "O" || ch === "I") {
        const word: Record<string, WordId> = {
          W: "WALL",
          R: "BURN",
          X: "RISE",
          Z: "LOCK",
          O: "FOLD",
          I: "TIDE",
        };
        const id = word[ch];
        pickups.push({
          kind: "word",
          id,
          x: x + 4,
          y: y + 8,
          w: 28,
          h: 20,
          taken: c.words.includes(id),
          label: id,
        });
      } else if (ch === "D") {
        pickups.push({
          kind: "drop",
          id: "dropCap",
          x: x + 4,
          y: y,
          w: 32,
          h: 36,
          taken: c.hasCapital,
          label: "DROP CAP",
        });
      } else if (ch === "F") {
        pickups.push({ kind: "case", id: "font" + tx, x: x, y: y, w: TILE, h: TILE, taken: false, label: "CASE" });
      } else if (ch === "$") {
        const pid = "secret-" + c.id + "-" + tx + "-" + ty;
        pickups.push({
          kind: "secret",
          id: pid,
          x: x + 8,
          y: y + 8,
          w: 24,
          h: 24,
          taken: c.powerups.includes(pid),
          label: "SECRET",
        });
      } else if (ch === "%") {
        pickups.push({
          kind: "check",
          id: "ck-" + c.id + "-" + tx + "-" + ty,
          x: x + 6,
          y: y - 8,
          w: 36,
          h: 44,
          taken: false,
          label: "CHECK",
        });
      } else if (ch === "P") {
        const n = c.index ?? 0;
        const labels: Record<string, string> = {
          stage1: "STACKS",
          stage2: "CHAPTER",
          stage3: "PRESS",
          stage4: "COIL",
          stage5: "LEDGER",
        };
        pickups.push({
          kind: "portal",
          id: c.exit === "win" ? "win" : "hub",
          x: x - 6,
          y: y + TILE - 88,
          w: 60,
          h: 88,
          taken: false,
          label: c.exit === "win" ? "FINAL" : labels[c.id] ?? (n ? `GATE ${n}` : "GATE"),
        });
      }
    }
  }

  return {
    solids,
    enemySpawns,
    pickups,
    npcs,
    markers,
    spawnX,
    spawnY,
    worldW: W * TILE,
    worldH: H * TILE,
  };
}
