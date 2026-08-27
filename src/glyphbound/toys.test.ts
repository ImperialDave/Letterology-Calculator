import assert from "node:assert/strict";
import test from "node:test";
import { CATALOG } from "./catalog";
import { parseRows } from "./parse-map";
import { isMovingSolid, SolidGrid } from "./spatial";
import { TILE } from "./types";
import { padRows } from "./folio";

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

test("catalog exposes lift blink saw geyser", () => {
  const chars = new Set(CATALOG.map((b) => b.ch));
  assert.ok(chars.has("`"));
  assert.ok(chars.has(")"));
  assert.ok(chars.has("S"));
  assert.ok(chars.has("g"));
  assert.equal(CATALOG.find((b) => b.ch === "`")?.group, "mover");
  assert.equal(CATALOG.find((b) => b.ch === "S")?.group, "hazard");
});

test("parse stamps lift blink saw and floor geyser", () => {
  const rows = padRows(blank());
  set(rows, 2, 7, "@");
  set(rows, 6, 7, "`");
  set(rows, 8, 7, ")");
  set(rows, 10, 7, "S");
  set(rows, 12, 8, "g");
  set(rows, 20, 7, "P");
  const parsed = parseRows(rows, { id: "user-toys", isHub: false, index: 12, bossKind: "dualis" });
  assert.ok(parsed.solids.some((s) => s.type === "lift" && s.homeY != null));
  assert.ok(parsed.solids.some((s) => s.type === "blink"));
  assert.ok(parsed.solids.some((s) => s.type === "saw" && s.homeX != null));
  assert.ok(parsed.solids.some((s) => s.type === "geyser"));
  assert.equal(parsed.worldW, 24 * TILE);
});

test("air g remains a lore npc", () => {
  const rows = padRows(blank());
  set(rows, 2, 7, "@");
  set(rows, 10, 7, "g");
  set(rows, 20, 7, "P");
  const parsed = parseRows(rows, { id: "user-g", isHub: false, index: 3, bossKind: "dualis" });
  assert.equal(parsed.solids.some((s) => s.type === "geyser"), false);
  assert.ok(parsed.npcs.some((n) => n.glyph === "g"));
});

test("saws stay out of the static walk grid", () => {
  const g = new SolidGrid(96);
  const saw = { x: 0, y: 0, w: 48, h: 24, type: "saw" as const, homeX: 0, homeY: 0 };
  const wall = { x: 96, y: 0, w: 48, h: 48, type: "solid" as const };
  assert.equal(isMovingSolid(saw), true);
  g.rebuild([wall]);
  const walk = g.query({ x: 0, y: 0, w: 40, h: 40 }, true, [saw], "walk");
  assert.equal(walk.some((s) => s.type === "saw"), false);
  const hurt = g.query({ x: 0, y: 0, w: 40, h: 40 }, true, [saw], "hazard");
  assert.equal(hurt.some((s) => s.type === "saw"), true);
});
