import assert from "node:assert/strict";
import test from "node:test";
import { assembleStage } from "./assemble";
import { densityFloors, padEnemies, tally } from "./density";
import {
  cycleDifficulty,
  enemyMul,
  hpMul,
  livesFor,
  parseDifficulty,
  scaledHp,
} from "./difficulty";

test("parseDifficulty migrates Precision Grid and defaults to easy", () => {
  assert.equal(parseDifficulty(undefined, false), "easy");
  assert.equal(parseDifficulty(undefined, true), "hard");
  assert.equal(parseDifficulty("extreme", true), "extreme");
  assert.equal(parseDifficulty("easy"), "easy");
});

test("cycle walks easy hard extreme", () => {
  assert.equal(cycleDifficulty("easy"), "hard");
  assert.equal(cycleDifficulty("hard"), "extreme");
  assert.equal(cycleDifficulty("extreme"), "easy");
});

test("scaledHp matches Easy/Hard/Extreme table", () => {
  assert.equal(scaledHp(2, "easy", "one"), 2);
  assert.equal(scaledHp(2, "hard", "one"), 4);
  assert.equal(scaledHp(2, "extreme", "one"), 5);
  assert.equal(scaledHp(99, "extreme", "dummy"), 99);
  assert.equal(hpMul("hard"), 1.6);
  assert.equal(hpMul("extreme"), 2.25);
});

test("livesFor is unlimited on Easy", () => {
  assert.equal(livesFor("easy"), -1);
  assert.equal(livesFor("hard"), 3);
  assert.equal(livesFor("extreme"), 1);
});

test("padEnemies adds digits on Hard without extra hazards", () => {
  const rows = [
    "########################################",
    "#......................................#",
    "#......................................#",
    "#......................................#",
    "#......................................#",
    "#@.....1..............................P#",
    "########################################",
    "########################################",
  ];
  const easy = tally(rows);
  const hardRows = padEnemies(rows, 12, "hard");
  const hard = tally(hardRows);
  const need = Math.ceil(densityFloors(12, easy.W).enemies * enemyMul("hard"));
  assert.ok(hard.enemies >= need, `hard enemies ${hard.enemies} < ${need}`);
  assert.ok(hard.enemies > easy.enemies, "hard should add digits");
  assert.equal(hard.hazards, easy.hazards);
  assert.equal(hard.wardens, easy.wardens);
  const again = padEnemies(rows, 12, "easy");
  assert.equal(tally(again).enemies, easy.enemies);
});

test("Hard pad on an assembled remainder keeps Easy hazards", () => {
  const meta = assembleStage(12);
  const easy = tally(meta.rows);
  const hard = tally(padEnemies(meta.rows, 12, "hard"));
  assert.equal(hard.hazards, easy.hazards);
  assert.ok(hard.enemies >= easy.enemies);
});
