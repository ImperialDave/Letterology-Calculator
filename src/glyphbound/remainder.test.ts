import assert from "node:assert/strict";
import test from "node:test";
import { assembleStage } from "./assemble";
import { chunksFor } from "./chunks";
import { listLedgers, LEVELS } from "./levels";
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
