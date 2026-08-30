import assert from "node:assert/strict";
import test from "node:test";
import {
  ART_HOLD,
  canHeatSmash,
  matchBf,
  matchDf,
  matchFf,
  matchQcf,
  matchUf,
  pushDir,
  relDir,
  skillHoldIsArt,
  skillHoldIsTap,
  type DirSample,
} from "./command";

test("relDir uses facing so forward is f", () => {
  assert.equal(relDir(1, 0, 1), "f");
  assert.equal(relDir(-1, 0, 1), "b");
  assert.equal(relDir(1, 0, -1), "b");
  assert.equal(relDir(0.5, 0.8, 1), "df");
  assert.equal(relDir(0, 0, 1), "n");
});

test("f,f matches two forward taps in the window", () => {
  const buf: DirSample[] = [];
  pushDir(buf, 0.1, "n");
  pushDir(buf, 0.16, "f");
  pushDir(buf, 0.22, "n");
  pushDir(buf, 0.3, "f");
  assert.equal(matchFf(buf, 0.32, 0.14), true);
});

test("single f is not f,f", () => {
  const buf: DirSample[] = [];
  pushDir(buf, 0.1, "f");
  assert.equal(matchFf(buf, 0.2, 0.14), false);
});

test("df is a down-forward command mid", () => {
  const buf: DirSample[] = [];
  pushDir(buf, 0.1, "d");
  pushDir(buf, 0.18, "df");
  assert.equal(matchDf(buf, 0.2, 0.14), true);
  const onlyF: DirSample[] = [];
  pushDir(onlyF, 0.1, "f");
  assert.equal(matchDf(onlyF, 0.2, 0.14), false);
});

test("uf is up-forward hopkick", () => {
  const buf: DirSample[] = [];
  pushDir(buf, 0.1, "u");
  pushDir(buf, 0.18, "uf");
  assert.equal(matchUf(buf, 0.2, 0.14), true);
});

test("qcf is down then forward", () => {
  const buf: DirSample[] = [];
  pushDir(buf, 0.1, "d");
  pushDir(buf, 0.18, "df");
  pushDir(buf, 0.26, "f");
  assert.equal(matchQcf(buf, 0.3, 0.14), true);
});

test("b,f is a throw command, not f,f", () => {
  const buf: DirSample[] = [];
  pushDir(buf, 0.1, "b");
  pushDir(buf, 0.2, "f");
  assert.equal(matchBf(buf, 0.25, 0.14), true);
  assert.equal(matchFf(buf, 0.25, 0.14), false);
});

test("Heat Smash needs f,f or a double tap, never a single run-strike", () => {
  assert.equal(canHeatSmash(false, false), false);
  assert.equal(canHeatSmash(true, false), true);
  assert.equal(canHeatSmash(false, true), true);
});

test("a 0.1s Skill press is a tap, not a Case Art", () => {
  assert.equal(skillHoldIsArt(0.1, 100), false);
  assert.equal(skillHoldIsTap(0.1), true);
  assert.equal(skillHoldIsArt(ART_HOLD, 100), true);
  assert.equal(skillHoldIsArt(ART_HOLD, 50), false);
});
