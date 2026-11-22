import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { summarizeField } from "./field";
import { bestStreak, currentStreak, personalStats } from "./history";
import type { HistoryEntry } from "./history";

function entry(partial: Partial<HistoryEntry> & Pick<HistoryEntry, "date" | "status">): HistoryEntry {
  return {
    puzzleId: partial.puzzleId ?? partial.date,
    answer: partial.answer ?? "crane",
    length: partial.length ?? 5,
    kind: partial.kind ?? "table",
    date: partial.date,
    status: partial.status,
    guesses: partial.guesses ?? 3,
    elapsedMs: partial.elapsedMs ?? 10_000,
    hard: false,
    at: partial.at ?? 0,
    synced: false,
  };
}

describe("field", () => {
  it("ranks a solver against other finishes of the same word", () => {
    const report = summarizeField(
      [
        { bestMs: 20_000, bestGuesses: 4 },
        { bestMs: 40_000, bestGuesses: 5 },
        { bestMs: 12_000, bestGuesses: 2 },
      ],
      { elapsedMs: 20_000, guesses: 4, won: true },
    );
    assert.equal(report.solved, 3);
    assert.equal(report.yourRank, 2);
    assert.equal(report.fastestMs, 12_000);
    assert.equal(report.medianMs, 20_000);
    assert.equal(report.fasterThanPct, 50);
  });

  it("treats a lone solve as first on the word", () => {
    const report = summarizeField([{ bestMs: 9000, bestGuesses: 1 }], { elapsedMs: 9000, guesses: 1, won: true });
    assert.equal(report.yourRank, 1);
    assert.equal(report.fasterThanPct, null);
    assert.equal(report.players, 1);
  });

  it("does not rank a miss", () => {
    const report = summarizeField(
      [{ bestMs: 9000, bestGuesses: 2 }, { bestMs: null, bestGuesses: null }],
      { elapsedMs: 30_000, guesses: 6, won: false },
    );
    assert.equal(report.players, 2);
    assert.equal(report.solved, 1);
    assert.equal(report.yourRank, null);
  });
});

describe("personal history", () => {
  it("keeps a word-of-the-day streak and per-length best times", () => {
    const entries = [
      entry({ date: "2026-10-05", status: "won", elapsedMs: 15_000, guesses: 4, at: 3 }),
      entry({ date: "2026-10-04", status: "won", elapsedMs: 40_000, guesses: 5, at: 2 }),
      entry({ date: "2026-10-03", status: "lost", elapsedMs: 50_000, guesses: 6, at: 1 }),
      entry({ date: "2026-10-05", status: "won", length: 7, kind: "deal", elapsedMs: 8_000, guesses: 2, puzzleId: "deal", answer: "theatre", at: 4 }),
    ];
    assert.equal(currentStreak(entries, "2026-10-05"), 2);
    assert.equal(bestStreak(entries), 2);
    const stats = personalStats(entries, "2026-10-05");
    assert.equal(stats.played, 4);
    assert.equal(stats.solved, 3);
    assert.equal(stats.bestMs, 8_000);
    assert.equal(stats.byLength.find((row) => row.length === 7)?.bestMs, 8_000);
  });

  it("holds the streak through an unplayed today", () => {
    const entries = [entry({ date: "2026-10-04", status: "won" })];
    assert.equal(currentStreak(entries, "2026-10-05"), 1);
    assert.equal(currentStreak(entries, "2026-10-06"), 0);
  });
});
