import { padRows, type Folio } from "./folio";
import { OCTET } from "./roster";
import { defaultSave } from "./save";
import type { SaveData, ThemeId } from "./types";

export function sandboxSave(): SaveData {
  const s = defaultSave();
  s.hasCapital = true;
  s.capital = true;
  s.party = [...OCTET];
  s.words = ["WALL", "BURN", "RISE", "LOCK", "FOLD", "TIDE"];
  s.relics = ["dropCap", "spine", "copper", "counter"];
  s.shotLevel = 3;
  s.maxShield = 5;
  s.hp = 10;
  s.ink = 80;
  s.letter = "c";
  s.progress = 0;
  s.stage = "hub";
  s.visited = [];
  return s;
}

export function blankFolio(partial: Partial<Folio> = {}): Folio {
  const w = 80;
  const h = 12;
  const fy = 9;
  const rows = Array.from({ length: h }, (_, y) => {
    if (y === 0 || y === h - 1 || y === fy || y > fy) return "#".repeat(w);
    return "#" + ".".repeat(w - 2) + "#";
  });
  const put = (x: number, y: number, ch: string) => {
    rows[y] = rows[y].slice(0, x) + ch + rows[y].slice(x + 1);
  };
  put(2, fy - 1, "@");
  put(w - 5, fy - 1, "P");
  return {
    version: 1,
    id: "folio-" + Date.now().toString(36) + Math.floor(Math.random() * 36).toString(36),
    kind: "user",
    name: "Untitled ledger",
    theme: "street",
    rows,
    exit: "none",
    ...partial,
    rows: partial.rows ? padRows(partial.rows) : rows,
  };
}

export function cloneRows(rows: string[]): string[] {
  return rows.map((r) => r);
}

export function stampCell(rows: string[], tx: number, ty: number, ch: string): boolean {
  if (ty < 0 || ty >= rows.length) return false;
  const row = rows[ty];
  if (tx < 0 || tx >= row.length) return false;
  if (row[tx] === ch) return false;
  rows[ty] = row.slice(0, tx) + ch + row.slice(tx + 1);
  return true;
}

export function resizeRows(rows: string[], w: number, h: number, fill = "."): string[] {
  const width = Math.max(16, Math.min(256, Math.floor(w)));
  const height = Math.max(8, Math.min(24, Math.floor(h)));
  const next: string[] = [];
  for (let y = 0; y < height; y++) {
    let row = rows[y] ?? fill.repeat(width);
    if (row.length < width) row = row + fill.repeat(width - row.length);
    if (row.length > width) row = row.slice(0, width);
    if (y === 0 || y === height - 1) row = "#".repeat(width);
    else row = "#" + row.slice(1, -1) + "#";
    next.push(row);
  }
  return next;
}

export function folioTheme(theme: string): ThemeId {
  const t = theme as ThemeId;
  return (
    [
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
    ] as ThemeId[]
  ).includes(t)
    ? t
    : "street";
}
