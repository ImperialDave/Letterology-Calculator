import assert from "node:assert/strict";
import test from "node:test";
import {
  ARCADE_WAKES,
  CENTURY_START,
  DECADES,
  decadeLocked,
  decadePlaque,
  decadeTarget,
  enduranceBand,
  isWardenIndex,
  parseDecadeId,
  pickEnduranceStage,
  pickFromPool,
  rollDrop,
  shufflePool,
} from "./arcade";
import { STAGE_COUNT } from "./types";

test("ten decade doors cover 61–160", () => {
  assert.equal(DECADES.length, 10);
  assert.equal(DECADES[0]?.lo, 61);
  assert.equal(DECADES[0]?.hi, 70);
  assert.equal(DECADES[9]?.lo, 151);
  assert.equal(DECADES[9]?.hi, 160);
  assert.equal(parseDecadeId("decade-61"), 61);
  assert.equal(parseDecadeId("continue"), null);
});

test("decade 61–70 unlocks after The Remainder", () => {
  assert.equal(decadeLocked(59, 61), true);
  assert.equal(decadeLocked(60, 61), false);
  assert.equal(decadeLocked(69, 71), true);
  assert.equal(decadeLocked(70, 71), false);
  assert.equal(decadeTarget(60, 61, 70), 61);
  assert.equal(decadeTarget(65, 61, 70), 66);
  assert.equal(decadeTarget(80, 61, 70), 61);
});

test("shuffle pool never skips a lock", () => {
  assert.deepEqual(shufflePool(5), [6]);
  assert.deepEqual(shufflePool(10).slice(0, 3), [6, 7, 8]);
  assert.equal(shufflePool(10).at(-1), 11);
  assert.equal(shufflePool(60).at(-1), 61);
  assert.equal(shufflePool(STAGE_COUNT).at(-1), STAGE_COUNT);
  assert.deepEqual(shufflePool(40, true), []);
  assert.equal(shufflePool(60, true)[0], CENTURY_START);
  assert.equal(shufflePool(60, true).at(-1), 61);
});

test("shuffle pick stays in the pool", () => {
  const pool = shufflePool(20);
  for (let i = 0; i < 40; i++) {
    const n = pickFromPool(pool, 12, () => i / 40);
    assert.ok(pool.includes(n), String(n));
    assert.notEqual(n, 12);
  }
});

test("endurance bands deepen and bosses land every five", () => {
  assert.deepEqual(enduranceBand(0), [16, 40]);
  assert.deepEqual(enduranceBand(5), [41, 80]);
  assert.deepEqual(enduranceBand(10), [81, STAGE_COUNT]);
  assert.equal(isWardenIndex(20), true);
  assert.equal(isWardenIndex(21), false);
  assert.equal(isWardenIndex(160), true);
  const fifth = pickEnduranceStage(4, 0, () => 0);
  assert.equal(isWardenIndex(fifth), true);
  assert.ok(fifth >= 16 && fifth <= 40);
});

test("dummy never drops; boss can; campaign is ink/heart only", () => {
  assert.equal(rollDrop({ kind: "dummy", boss: false, arcade: true, rand: () => 0 }), null);
  const boss = rollDrop({ kind: "remainder", boss: true, arcade: true, rand: () => 0 });
  assert.ok(boss);
  const campaign = rollDrop({ kind: "one", boss: false, arcade: false, rand: () => 0 });
  assert.ok(campaign);
  assert.ok(campaign.kind === "ink" || campaign.kind === "heart");
  const miss = rollDrop({ kind: "one", boss: false, arcade: false, rand: () => 0.99 });
  assert.equal(miss, null);
});

test("wakes default to Hard's three", () => {
  assert.equal(ARCADE_WAKES, 3);
});

test("decade plaque uses the first page name", () => {
  assert.match(decadePlaque(61), /61–70/);
  assert.match(decadePlaque(61), /Press Forge/);
});
