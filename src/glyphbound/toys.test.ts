import assert from "node:assert/strict";
import test from "node:test";
import { CATALOG } from "./catalog";
import { parseRows } from "./parse-map";
import { isMovingSolid, SolidGrid } from "./spatial";
import { TILE } from "./types";
import { padRows } from "./folio";
import { grateHot, gratePhase, shutterOpen, TELL, TOY_PERIOD, toyDrawFrame } from "./toys";

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

test("catalog exposes the ten type-foundry toys", () => {
  const chars = new Set(CATALOG.map((b) => b.ch));
  for (const ch of "lzxfjdw}{[") assert.ok(chars.has(ch), ch);
  assert.equal(CATALOG.find((b) => b.ch === "l")?.group, "hazard");
  assert.equal(CATALOG.find((b) => b.ch === "f")?.group, "mover");
  assert.equal(CATALOG.find((b) => b.ch === "{")?.group, "mover");
});

test("parse stamps ten toys off-hub", () => {
  const rows = padRows(blank(36, 10));
  set(rows, 2, 7, "@");
  set(rows, 6, 6, "l");
  set(rows, 8, 6, "z");
  set(rows, 10, 6, "x");
  set(rows, 12, 6, "f");
  set(rows, 14, 8, "j");
  set(rows, 16, 6, "d");
  set(rows, 18, 8, "w");
  set(rows, 20, 6, "}");
  set(rows, 21, 6, "}");
  set(rows, 22, 6, "}");
  set(rows, 24, 7, "{");
  set(rows, 26, 6, "[");
  set(rows, 32, 7, "P");
  const parsed = parseRows(rows, { id: "user-foundry", isHub: false, index: 12, bossKind: "dualis" });
  const types = new Set(parsed.solids.map((s) => s.type));
  for (const t of [
    "censer",
    "stamper",
    "guillotine",
    "dropcap",
    "grate",
    "rotor",
    "sinkink",
    "shutter",
    "carriage",
    "echo",
  ]) {
    assert.ok(types.has(t as (typeof parsed.solids)[number]["type"]), t);
  }
});

test("hub still reads [ { } as doors and d as a teacher", () => {
  const rows = padRows(blank());
  set(rows, 2, 7, "@");
  set(rows, 8, 7, "[");
  set(rows, 10, 7, "{");
  set(rows, 12, 7, "}");
  set(rows, 14, 7, "d");
  set(rows, 20, 7, "P");
  const parsed = parseRows(rows, { id: "hub", isHub: true, index: 0, bossKind: "dualis", progress: 0 });
  assert.ok(parsed.pickups.some((p) => p.kind === "door" && p.id === "stage1"));
  assert.ok(parsed.pickups.some((p) => p.kind === "door" && p.id === "stage3"));
  assert.ok(parsed.pickups.some((p) => p.kind === "door" && p.id === "stage4"));
  assert.equal(parsed.solids.some((s) => s.type === "echo" || s.type === "carriage" || s.type === "shutter" || s.type === "rotor"), false);
  assert.ok(parsed.npcs.some((n) => n.glyph === "d"));
});

test("grate hot window and shutter all-open are readable", () => {
  let hot = 0;
  let warn = 0;
  const step = 0.05;
  for (let t = 0; t < TOY_PERIOD.grate; t += step) {
    if (grateHot(t, 0)) hot += step;
    if (gratePhase(t, 0) === "warn") warn += step;
  }
  assert.ok(hot > 0.45 && hot < 0.7, `hot ${hot}`);
  assert.ok(warn >= TELL, `warn ${warn}`);
  let allOpen = 0;
  for (let t = 0; t < TOY_PERIOD.shutter; t += step) {
    if (shutterOpen(t, 0) && shutterOpen(t, 0.25) && shutterOpen(t, 0.5)) allOpen += step;
  }
  assert.ok(allOpen > 0.4 && allOpen < 0.7, `all-open ${allOpen}`);
});

test("toy draw frames follow the live pose, not a leftover loop", () => {
  assert.equal(toyDrawFrame("grate", 0.2, 0), 0);
  assert.equal(toyDrawFrame("grate", 0.9, 0), 1);
  assert.equal(toyDrawFrame("grate", 1.4, 0), 2);
  assert.equal(toyDrawFrame("stamper", 0.2, 0), 0);
  assert.equal(toyDrawFrame("stamper", 1.2, 0), 1);
  assert.equal(toyDrawFrame("guillotine", 0.2, 0), 0);
  assert.equal(toyDrawFrame("rotor", 0.1, 0), 0);
  assert.equal(toyDrawFrame("shutter", 0, 0), 0);
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
