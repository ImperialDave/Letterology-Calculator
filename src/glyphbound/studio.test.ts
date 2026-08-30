import assert from "node:assert/strict";
import test from "node:test";
import { folioOk } from "./folio";
import { deleteFolio, loadShelf, saveFolio } from "./folios-save";
import { parseRows } from "./parse-map";
import { blankFolio, resizeRows, sandboxSave, stampCell } from "./studio";

test("blank folio has spawn, gate, and parses", () => {
  const f = blankFolio({ id: "folio-test" });
  assert.equal(folioOk(f), true);
  const parsed = parseRows(f.rows, { id: f.id, isHub: false, bossKind: "dualis" });
  assert.ok(parsed.spawnX > 0);
  assert.ok(parsed.pickups.some((p) => p.kind === "portal"));
});

test("stamp replaces a cell", () => {
  const rows = blankFolio().rows;
  const y = rows.length - 3;
  assert.equal(stampCell(rows, 4, y, "1"), true);
  assert.equal(rows[y][4], "1");
  assert.equal(stampCell(rows, 4, y, "1"), false);
});

test("resize keeps borders", () => {
  const rows = resizeRows(blankFolio().rows, 40, 10);
  assert.equal(rows.length, 10);
  assert.equal(rows[0].length, 40);
  assert.equal(rows[0], "#".repeat(40));
  assert.equal(rows[9][0], "#");
});

test("sandbox save does not look like a campaign clear", () => {
  const s = sandboxSave();
  assert.equal(s.progress, 0);
  assert.equal(s.party.length, 8);
  assert.equal(s.hasCapital, true);
});

test("shelf save and delete round-trip", () => {
  const f = blankFolio({ id: "folio-shelf", name: "Shelf test" });
  const wr = saveFolio(f);
  assert.equal(wr.ok, true);
  assert.ok(loadShelf().folios.some((x) => x.id === "folio-shelf"));
  deleteFolio("folio-shelf");
  assert.equal(loadShelf().folios.some((x) => x.id === "folio-shelf"), false);
});
