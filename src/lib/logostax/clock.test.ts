import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clockNow, formatClock, freezeClock, normalizeClock, resumeClock } from "./clock";

describe("clock", () => {
  it("formats minutes and seconds", () => {
    assert.equal(formatClock(0), "0:00");
    assert.equal(formatClock(61000), "1:01");
    assert.equal(formatClock(59900), "1:00");
  });

  it("freezes a running clock", () => {
    const frozen = freezeClock({ elapsedMs: 1000, runningSince: 5_000 }, 8_000);
    assert.deepEqual(frozen, { elapsedMs: 4000, runningSince: null });
    assert.equal(clockNow(frozen, 99_000), 4000);
  });

  it("drops an overnight gap but keeps a short refresh", () => {
    const kept = normalizeClock({ elapsedMs: 1000, runningSince: 0 }, true, 5_000);
    assert.equal(kept.elapsedMs, 6000);
    assert.equal(kept.runningSince, 5_000);
    const dropped = normalizeClock({ elapsedMs: 1000, runningSince: 0 }, true, 31 * 60 * 1000);
    assert.equal(dropped.elapsedMs, 1000);
    assert.equal(dropped.runningSince, 31 * 60 * 1000);
  });

  it("does not start until the puzzle has been touched", () => {
    assert.deepEqual(normalizeClock({ elapsedMs: 0, runningSince: null }, false, 50), {
      elapsedMs: 0,
      runningSince: null,
    });
    assert.equal(resumeClock({ elapsedMs: 2500, runningSince: null }, 10).runningSince, 10);
  });
});
