import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  dailyAnswer,
  evaluate,
  hardViolation,
  lengthAlreadyShowing,
  maxGuesses,
  nextLengthSettings,
  shareText,
  shiftDate,
  solvedLine,
  type Session,
  type Settings,
} from "./engine";

describe("evaluate", () => {
  it("marks an exact match", () => {
    assert.deepEqual(evaluate("crane", "crane"), ["correct", "correct", "correct", "correct", "correct"]);
  });

  it("does not double-count letters", () => {
    assert.deepEqual(evaluate("lulls", "lucky"), ["correct", "correct", "absent", "absent", "absent"]);
  });

  it("handles a letter that is both placed and extra", () => {
    assert.deepEqual(evaluate("babes", "abbey"), ["present", "present", "correct", "correct", "absent"]);
  });

  it("uses the remaining pool after greens", () => {
    assert.deepEqual(evaluate("papal", "apple"), ["present", "present", "correct", "absent", "present"]);
  });
});

describe("hard mode", () => {
  it("requires a green letter to stay put", () => {
    assert.equal(hardViolation("crone", ["crane"], "crane"), "The third letter must be A");
  });

  it("requires a revealed letter to be reused", () => {
    assert.equal(hardViolation("braze", ["trace"], "crane"), "Guess must use C");
  });

  it("accepts a guess that honors the hints", () => {
    assert.equal(hardViolation("crane", ["trace"], "crane"), null);
  });
});

describe("daily", () => {
  it("is stable for a date and length", () => {
    const answers = ["about", "other", "their", "there", "which"];
    const a = dailyAnswer(answers, "2026-10-05", 5);
    const b = dailyAnswer(answers, "2026-10-05", 5);
    assert.equal(a, b);
    assert.ok(answers.includes(a));
  });

  it("changes with length", () => {
    const short = ["cat", "dog", "sun"];
    const long = ["planet", "silver", "garden"];
    assert.notEqual(dailyAnswer(short, "2026-10-05", 3).length, dailyAnswer(long, "2026-10-05", 6).length);
  });

  it("shifts across month boundaries", () => {
    assert.equal(shiftDate("2026-03-01", -1), "2026-02-28");
  });
});

describe("length switch", () => {
  const settings = (mode: "today" | "open", length: number): Settings => ({
    version: 1,
    mode,
    length,
    hard: false,
  });

  it("retries when the board length does not match the request", () => {
    const session: Session = {
      length: 5,
      kind: "table",
      answer: "crane",
      date: "2026-10-05",
      guesses: [],
      draft: "",
      status: "playing",
      recorded: false,
      elapsedMs: 0,
      runningSince: null,
      puzzleId: "daily:5:2026-10-05",
    };
    assert.equal(lengthAlreadyShowing(session, 8, "open"), false);
    assert.equal(lengthAlreadyShowing({ ...session, length: 8, answer: "anything" }, 8, "open"), true);
    assert.equal(lengthAlreadyShowing({ ...session, length: 8, answer: "crane" }, 8, "open"), false);
    assert.deepEqual(nextLengthSettings(session, settings("today", 5), 8), settings("open", 8));
    assert.equal(nextLengthSettings(session, settings("today", 5), 5), null);
  });

  it("keeps 5 as a length instead of forcing the word of the day", () => {
    const deal: Session = {
      length: 5,
      kind: "deal",
      answer: "crane",
      date: "2026-10-05",
      guesses: ["trace"],
      draft: "",
      status: "playing",
      recorded: false,
      elapsedMs: 1200,
      runningSince: null,
      puzzleId: "deal:5:2026-10-05:ab12",
    };
    assert.deepEqual(nextLengthSettings(deal, settings("open", 6), 5), settings("open", 5));
    assert.equal(nextLengthSettings(deal, settings("open", 5), 5), null);
    assert.deepEqual(nextLengthSettings({ ...deal, length: 8, answer: "crane" }, settings("open", 8), 8), settings("open", 8));
  });
});

describe("copy", () => {
  it("describes a win", () => {
    assert.equal(solvedLine(1), "Solved in one guess.");
    assert.equal(solvedLine(3), "Solved in three.");
    assert.equal(maxGuesses(8), 8);
    assert.equal(maxGuesses(4), 6);
  });

  it("builds a timed share card without a colored square grid", () => {
    const session: Session = {
      length: 5,
      kind: "table",
      answer: "crane",
      date: "2026-10-05",
      guesses: ["crane"],
      draft: "",
      status: "won",
      recorded: true,
      elapsedMs: 42000,
      runningSince: null,
      puzzleId: "daily:5:2026-10-05",
    };
    assert.equal(shareText(session, true), "Logostax · Word of the day\n0:42 · 1/6 · hard\n●●●●●");
  });
});
