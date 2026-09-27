import assert from "node:assert/strict";
import test from "node:test";
import { betterMark, bookTotal, clearanceOf, letterFor, markFor, markLine, pointsFor, seatOf, tallyCensus } from "./grade";
import { standWalk } from "./validate-level";
import type { LedgerMark } from "./types";

test("clearance bands, with an empty sentence reading as full", () => {
  assert.equal(clearanceOf(0, 0), "full");
  assert.equal(clearanceOf(8, 8), "full");
  assert.equal(clearanceOf(7, 8), "high");
  assert.equal(clearanceOf(5, 8), "mid");
  assert.equal(clearanceOf(4, 8), "low");
});

test("the letter table floors a clear at D", () => {
  assert.equal(letterFor("full", 0), "A+");
  assert.equal(letterFor("full", 1), "A");
  assert.equal(letterFor("full", 2), "A−");
  assert.equal(letterFor("full", 3), "B+");
  assert.equal(letterFor("full", 9), "B+");
  assert.equal(letterFor("high", 0), "A−");
  assert.equal(letterFor("mid", 0), "B");
  assert.equal(letterFor("mid", 1), "B−");
  assert.equal(letterFor("low", 0), "C");
  assert.equal(letterFor("low", 3), "D");
});

test("points follow the worked page", () => {
  const base = { sentenceKilled: 8, marginKilled: 0, deaths: 0, hits: 0, difficulty: "easy" as const };
  assert.equal(pointsFor(base), 800);
  assert.equal(pointsFor({ ...base, marginKilled: 3 }), 920);
  assert.equal(pointsFor({ ...base, hits: 10 }), 760);
  assert.equal(pointsFor({ ...base, sentenceKilled: 5 }), 500);
  assert.equal(pointsFor({ ...base, deaths: 2 }), 650);
  assert.equal(pointsFor({ ...base, deaths: 2, difficulty: "extreme" }), 1300);
  assert.equal(pointsFor({ ...base, deaths: 2, difficulty: "hard" }), 975);
});

test("hit tax cannot erase a full clear", () => {
  const bruised = pointsFor({ sentenceKilled: 8, marginKilled: 0, deaths: 0, hits: 500, difficulty: "easy" });
  assert.equal(bruised, 600);
});

test("margin kills do not change the letter", () => {
  const bare = markFor({ sentenceKilled: 8, sentenceTotal: 8, marginKilled: 0, marginTotal: 3 }, 0, 0, "easy");
  const pocket = markFor({ sentenceKilled: 8, sentenceTotal: 8, marginKilled: 3, marginTotal: 3 }, 0, 0, "easy");
  assert.equal(bare.grade, "A+");
  assert.equal(pocket.grade, "A+");
  assert.equal(pocket.points, 920);
});

test("summons and dummies stay out of both counts", () => {
  const tally = tallyCensus([
    { census: true, kind: "one", seat: "sentence", alive: false },
    { census: true, kind: "dummy", seat: "sentence", alive: true },
    { census: false, kind: "one", seat: "sentence", alive: true },
    { census: true, kind: "one", seat: "margin", alive: true },
  ]);
  assert.deepEqual(tally, { sentenceKilled: 1, sentenceTotal: 1, marginKilled: 0, marginTotal: 1 });
});

test("equal points keep the better letter, and a lower score does not replace the book", () => {
  const plus: LedgerMark = {
    grade: "A+",
    points: 800,
    sentenceKilled: 8,
    sentenceTotal: 8,
    marginKilled: 0,
    marginTotal: 0,
    deaths: 0,
    hits: 0,
    difficulty: "easy",
  };
  const samePoints: LedgerMark = { ...plus, grade: "A" };
  const richer: LedgerMark = { ...plus, grade: "B", points: 1300, difficulty: "extreme" };
  assert.equal(betterMark(samePoints, plus).grade, "A+");
  assert.equal(betterMark(plus, samePoints).grade, "A+");
  assert.equal(betterMark(plus, richer).grade, "B");
  assert.equal(bookTotal({ stage1: richer, stage2: plus }), 2100);
});

test("the card line names the sentence, the margin, and the wakes", () => {
  assert.equal(
    markLine({ sentenceKilled: 7, sentenceTotal: 9, marginKilled: 2, deaths: 1 }),
    "7 of 9 on the sentence · 2 in the margin · 1 wake",
  );
  assert.match(markLine({ sentenceKilled: 1, sentenceTotal: 1, marginKilled: 0, deaths: 0 }), /no wakes/);
  assert.match(markLine({ sentenceKilled: 1, sentenceTotal: 1, marginKilled: 0, deaths: 2 }), /2 wakes/);
});

test("a pocket two tiles off the walk is margin, and a missing walk is all sentence", () => {
  const rows = ["#1......#", "#.......#", "#@....P.#", "#########"];
  const walk = standWalk(rows);
  assert.ok(walk);
  assert.equal(seatOf(1, 0, walk), "margin");
  assert.equal(seatOf(2, 2, walk), "sentence");
  assert.equal(seatOf(1, 0, null), "sentence");
  assert.equal(standWalk(["###", "#@#", "###"]), null);
});
