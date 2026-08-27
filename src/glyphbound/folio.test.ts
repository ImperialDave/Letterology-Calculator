import assert from "node:assert/strict";
import test from "node:test";
import { ALLOWED_CHARS, CATALOG, ENEMY_CHARS } from "./catalog";
import { folioFromMeta, folioOk, padRows, validateFolio, type Folio } from "./folio";
import { LEVELS } from "./levels";
import { parseRows } from "./parse-map";
import { TILE } from "./types";

function blank(w = 24, h = 10): string[] {
  const rows = Array.from({ length: h }, () => ".".repeat(w));
  rows[0] = "#".repeat(w);
  rows[h - 1] = "#".repeat(w);
  rows[h - 2] = "#".repeat(w);
  return rows.map((r, y) => (y === 0 || y === h - 1 ? "#".repeat(w) : "#" + r.slice(1, -1) + "#"));
}

function set(rows: string[], x: number, y: number, ch: string) {
  rows[y] = rows[y].slice(0, x) + ch + rows[y].slice(x + ch.length);
}

test("catalog covers every enemy char and erase", () => {
  assert.ok(ALLOWED_CHARS.has("."));
  assert.ok(ALLOWED_CHARS.has("#"));
  assert.ok(ALLOWED_CHARS.has("!"));
  for (const ch of Object.keys(ENEMY_CHARS)) assert.ok(ALLOWED_CHARS.has(ch), ch);
  assert.ok(CATALOG.some((b) => b.group === "terrain"));
  assert.ok(CATALOG.some((b) => b.group === "enemy"));
});

test("hub folio is valid and parse matches tile size", () => {
  const folio = folioFromMeta(LEVELS.hub);
  const issues = validateFolio(folio);
  assert.deepEqual(issues, []);
  const parsed = parseRows(LEVELS.hub.rows, { id: "hub", isHub: true, index: 0, bossKind: "dualis" });
  assert.equal(parsed.worldW, LEVELS.hub.rows[0].length * TILE);
  assert.equal(parsed.worldH, LEVELS.hub.rows.length * TILE);
  assert.ok(parsed.solids.length > 100);
  assert.ok(parsed.pickups.some((p) => p.id === "continue"));
  assert.ok(parsed.spawnX > 0);
  assert.ok(LEVELS.hub.rows[0].length <= 56, "hub should fit in a short hall");
  const doors = parsed.pickups.filter((p) => p.kind === "door" && /^stage[1-5]$/.test(p.id)).sort((a, b) => a.x - b.x);
  assert.deepEqual(
    doors.map((d) => d.id),
    ["stage1", "stage3", "stage4", "stage2", "stage5"],
  );
});

test("stage1 has spawn, recruit, and dualis from !", () => {
  const parsed = parseRows(LEVELS.stage1.rows, {
    id: "stage1",
    isHub: false,
    index: 1,
    bossKind: "dualis",
    party: ["c"],
  });
  assert.ok(parsed.enemySpawns.some((e) => e.kind === "dualis"));
  assert.ok(parsed.pickups.some((p) => p.kind === "recruit" && p.id === "s"));
  assert.ok(parsed.pickups.some((p) => p.kind === "portal"));
  assert.equal(folioOk(folioFromMeta(LEVELS.stage1)), true);
});

test("stage30 End-Mark spawns from !", () => {
  const parsed = parseRows(LEVELS.stage30.rows, {
    id: "stage30",
    isHub: false,
    index: 30,
    bossKind: "endmark",
    exit: "hub",
  });
  assert.ok(parsed.enemySpawns.some((e) => e.kind === "endmark"));
  assert.equal(folioOk(folioFromMeta(LEVELS.stage30)), true);
});

test("unknown char fails validation", () => {
  const rows = padRows(blank());
  set(rows, 2, 7, "@");
  set(rows, 20, 7, "P");
  set(rows, 10, 7, "`");
  const folio: Folio = {
    version: 1,
    id: "user-bad",
    kind: "user",
    name: "bad",
    theme: "street",
    rows,
  };
  const issues = validateFolio(folio);
  assert.ok(issues.some((i) => i.code === "char"));
});

test("user folio without spawn or gate fails", () => {
  const rows = padRows(blank());
  const folio: Folio = {
    version: 1,
    id: "user-empty",
    kind: "user",
    name: "empty",
    theme: "street",
    rows,
  };
  const codes = validateFolio(folio).map((i) => i.code);
  assert.ok(codes.includes("spawn"));
  assert.ok(codes.includes("gate"));
});

test("chunk without spawn is allowed", () => {
  const rows = padRows(blank());
  const folio: Folio = {
    version: 1,
    id: "chunk-a",
    kind: "chunk",
    name: "land",
    theme: "street",
    rows,
  };
  assert.equal(folioOk(folio), true);
});

test("parse fixture stamps solids, spike, enemy, spawn", () => {
  const rows = padRows(blank());
  set(rows, 2, 7, "@");
  set(rows, 8, 7, "1");
  set(rows, 10, 8, "^");
  set(rows, 20, 7, "P");
  const parsed = parseRows(rows, { id: "user-1", isHub: false, index: 0, bossKind: "dualis" });
  assert.ok(parsed.solids.some((s) => s.type === "spike"));
  assert.equal(parsed.enemySpawns[0]?.kind, "one");
  assert.ok(parsed.pickups.some((p) => p.kind === "portal"));
});
