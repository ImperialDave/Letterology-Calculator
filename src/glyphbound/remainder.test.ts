import assert from "node:assert/strict";
import test from "node:test";
import { assembleRecipe, assembleStage } from "./assemble";
import { chunksFor } from "./chunks";
import { verbsFor } from "./recipe";
import { beatenLedgers, listLedgers, LEVELS } from "./levels";
import { FROZEN_REMAINDER } from "./remainder-hand";
import { REMAINDER_NAMES } from "./remainder-names";
import { validateLevel } from "./validate-level";
import { FIRST_BOOK, STAGE_COUNT } from "./types";

test("remainder ledgers have unique names", () => {
  const names = new Set<string>();
  for (let n = FIRST_BOOK; n <= STAGE_COUNT; n++) {
    const name = assembleStage(n).name;
    assert.equal(name, REMAINDER_NAMES[n], `stage${n}`);
    assert.equal(names.has(name), false, name);
    names.add(name);
  }
});

test("keystone remainder stages are frozen and reachable", () => {
  for (const n of [30, 35, 40, 45, 50, 55, 60]) {
    const meta = FROZEN_REMAINDER[n];
    assert.ok(meta, `frozen ${n}`);
    const issues = validateLevel(meta.rows).filter((i) => i.code === "path" || i.code === "spawn" || i.code === "hang" || i.code === "embed");
    assert.equal(issues.join("; "), "", `stage${n}`);
    if (n === 60) assert.equal(meta.exit, "win");
    assert.ok(meta.rows.some((r) => r.includes("!")));
  }
});

test("remainder themes have teach mix combat rest chunks", () => {
  for (const theme of ["orbit", "glacier", "remainder"] as const) {
    for (const beat of ["land", "teach", "mix", "combat", "rest", "gate"] as const) {
      const list = chunksFor(beat, 40, theme);
      assert.ok(list.length > 0, `${theme} ${beat}`);
    }
  }
});

test("listLedgers covers hub through 60", () => {
  const list = listLedgers();
  assert.equal(list[0]?.id, "hub");
  assert.equal(list.length, STAGE_COUNT + 1);
  assert.equal(LEVELS.stage31.name, "Gold Orrery");
  assert.equal(LEVELS.stage40.name, "Void Point");
});

test("assembled remainder ledgers pass jump and fairness laws", () => {
  const failed: string[] = [];
  const codes = ["path", "spawn", "hang", "embed", "laser-floor", "saw-path", "rest-hazard", "pit", "pit-wide"];
  for (let n = 6; n <= STAGE_COUNT; n++) {
    const meta = assembleStage(n);
    const issues = validateLevel(meta.rows).filter((i) => codes.includes(i.code));
    if (issues.length) failed.push(`stage${n}: ${issues.map((i) => i.message).join("; ")}`);
  }
  assert.equal(failed.join("\n"), "");
});

test("recipe featured verb stays on the unlock schedule", () => {
  for (const n of [8, 18, 28, 38, 48]) {
    const r = assembleRecipe(n);
    assert.ok(verbsFor(n).includes(r.featured), `${n} ${r.featured}`);
    assert.ok(r.beats.includes("gate"));
    if (!r.beats.includes("arena")) assert.ok(r.beats.includes("land"));
  }
});

test("two remainder ledgers do not clone the same map", () => {
  const a = assembleStage(31).rows.join("\n");
  const b = assembleStage(32).rows.join("\n");
  assert.notEqual(a, b);
});

test("beatenLedgers only lists closed pages", () => {
  assert.equal(beatenLedgers(0).length, 0);
  const closed = beatenLedgers(34);
  assert.equal(closed.length, 34);
  assert.equal(closed[0]?.id, "stage1");
  assert.equal(closed[33]?.id, "stage34");
  assert.equal(closed.some((l) => l.index === 35), false);
});
