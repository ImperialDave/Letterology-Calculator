import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { maxGuesses } from "./engine";
import {
  leaderLine,
  makeCode,
  missCost,
  parseCreate,
  parseGuess,
  pickDistinct,
  rankTable,
  roundCost,
  tableShare,
  type RoundCell,
} from "./tournament-score";

function cell(status: RoundCell["status"], guesses: number, elapsedMs = 0): RoundCell {
  return { status, guesses, elapsedMs };
}

describe("tournament scoring", () => {
  it("ranks fewer guesses first and breaks ties on the clock", () => {
    const rows = rankTable(
      [
        {
          userId: "a",
          name: "Ada",
          you: false,
          host: true,
          rounds: [cell("won", 4, 9000), cell("won", 3, 4000)],
        },
        {
          userId: "b",
          name: "Bo",
          you: true,
          host: false,
          rounds: [cell("won", 2, 12000), cell("won", 4, 1000)],
        },
        {
          userId: "c",
          name: "Cy",
          you: false,
          host: false,
          rounds: [cell("won", 2, 3000), cell("won", 4, 1000)],
        },
      ],
      5,
    );
    assert.equal(rows[0]?.name, "Cy");
    assert.equal(rows[0]?.rank, 1);
    assert.equal(rows[0]?.score, 6);
    assert.equal(rows[1]?.name, "Bo");
    assert.equal(rows[1]?.rank, 2);
    assert.equal(rows[2]?.name, "Ada");
    assert.equal(rows[2]?.score, 7);
  });

  it("counts a miss as one worse than using every guess", () => {
    assert.equal(missCost(5), maxGuesses(5) + 1);
    assert.equal(roundCost(cell("lost", 6), 5), 7);
    assert.equal(roundCost(cell("won", 6), 5), 6);
    assert.equal(roundCost(cell("playing", 2), 5), null);
    const rows = rankTable(
      [
        { userId: "a", name: "Ada", you: false, host: false, rounds: [cell("lost", 6), cell("won", 2)] },
        { userId: "b", name: "Bo", you: false, host: false, rounds: [cell("won", 6), cell("won", 2)] },
      ],
      5,
    );
    assert.equal(rows[0]?.name, "Bo");
    assert.equal(rows[0]?.score, 8);
    assert.equal(rows[1]?.score, 9);
  });

  it("keeps unfinished players below anyone who has finished", () => {
    const rows = rankTable(
      [
        { userId: "a", name: "Ada", you: false, host: false, rounds: [cell("won", 5), cell("playing", 1)] },
        { userId: "b", name: "Bo", you: true, host: true, rounds: [cell("won", 6), cell("lost", 6)] },
      ],
      5,
    );
    assert.equal(rows[0]?.name, "Bo");
    assert.equal(rows[0]?.finished, true);
    assert.equal(rows[1]?.rank, null);
    assert.equal(rows[1]?.finished, false);
  });

  it("shares a rank when score and time match", () => {
    const rows = rankTable(
      [
        { userId: "a", name: "Ada", you: false, host: false, rounds: [cell("won", 3, 1000)] },
        { userId: "b", name: "Bo", you: false, host: false, rounds: [cell("won", 3, 1000)] },
        { userId: "c", name: "Cy", you: false, host: false, rounds: [cell("won", 4, 1000)] },
      ],
      5,
    );
    assert.equal(rows[0]?.rank, 1);
    assert.equal(rows[1]?.rank, 1);
    assert.equal(rows[2]?.rank, 3);
    assert.match(leaderLine({ status: "done", standings: rows }) ?? "", /tie for the table/);
  });
});

describe("tournament codes and words", () => {
  it("draws distinct answers and unambiguous codes", () => {
    let n = 0;
    const seq = () => n++;
    const words = pickDistinct(["aa", "bb", "cc", "dd"], 3, (span) => seq() % span);
    assert.equal(new Set(words).size, 3);
    assert.equal(words.length, 3);
    const code = makeCode((span) => 0, 5);
    assert.equal(code, "AAAAA");
    assert.equal(makeCode((span) => span - 1).length, 5);
  });

  it("rejects a bad seat count and a short code", () => {
    assert.throws(() => parseCreate({ title: "  Friday   table ", seats: 1, rounds: 3, length: 5 }), /seats/);
    const created = parseCreate({ title: "  Friday   table ", seats: 7, rounds: 3, length: 5 });
    assert.equal(created.seats, 7);
    assert.equal(created.title, "Friday table");
    assert.throws(() => parseGuess({ code: "ab", round: 0, guess: "crane" }), /code/);
    assert.deepEqual(parseGuess({ code: "ab-12o", round: 1, guess: "Crane!" }), {
      code: "AB12O",
      round: 1,
      guess: "crane",
    });
  });

  it("writes a share line from the standing", () => {
    const [row] = rankTable(
      [{ userId: "a", name: "Ada", you: true, host: true, rounds: [cell("won", 2, 4000)] }],
      5,
    );
    assert.ok(row);
    assert.match(tableShare({ code: "BRIGHT", title: "Friday", players: [{ userId: "a", name: "Ada", you: true, host: true }] }, row), /BRIGHT/);
    assert.match(tableShare({ code: "BRIGHT", title: "Friday", players: [{ userId: "a", name: "Ada", you: true, host: true }] }, row), /1st of 1/);
  });
});
