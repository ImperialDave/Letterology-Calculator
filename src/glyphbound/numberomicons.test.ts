import assert from "node:assert/strict";
import test from "node:test";
import { LEVELS } from "./levels";
import { OCTET, RECRUIT_LETTERS } from "./roster";
import { SECOND_BOOK } from "./types";
import { validateLevel } from "./validate-level";

const STORY = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15] as const;
const NAMES: Record<number, string> = {
  6: "Foundry Margin",
  7: "Keystroke Yard",
  8: "Fourfold Keep",
  9: "Ligature Canal",
  10: "Ampersand Dock",
  11: "Iris Bind",
  12: "Scriptorium",
  13: "Rule and Storm",
  14: "Operator Approach",
  15: "The Iconostasis",
};

test("octet is recruitable in the campaign", () => {
  assert.deepEqual(OCTET, ["c", "s", "b", "e", "r", "k", "n", "t"]);
  assert.ok(RECRUIT_LETTERS.includes("k"));
  assert.ok(RECRUIT_LETTERS.includes("n"));
  assert.ok(RECRUIT_LETTERS.includes("t"));
});

test("Numberomicon ledgers are hand-authored and reachable", () => {
  const codes = ["path", "spawn", "hang", "embed", "buried", "laser-floor", "saw-path", "rest-hazard", "pit", "pit-wide"];
  for (const n of STORY) {
    const meta = LEVELS[`stage${n}`];
    assert.ok(meta, `stage${n}`);
    assert.equal(meta.name, NAMES[n], `stage${n} name`);
    assert.equal(meta.index, n);
    assert.equal(meta.exit, "hub");
    const issues = validateLevel(meta.rows).filter((i) => codes.includes(i.code));
    assert.equal(issues.map((i) => i.message).join("; "), "", `stage${n}`);
  }
  assert.equal(SECOND_BOOK, 15);
});

test("recruits and numberomicons sit on the Second Book path", () => {
  const join = (n: number) => LEVELS[`stage${n}`].rows.join("");
  assert.ok(join(7).includes("k"));
  assert.ok(join(8).includes("!"));
  assert.ok(join(10).includes("n"));
  assert.ok(join(10).includes("O"));
  assert.ok(join(11).includes("!"));
  assert.ok(join(11).includes("B"));
  assert.ok(join(12).includes("t"));
  assert.ok(join(14).includes("I"));
  assert.ok(join(15).includes("!"));
});

test("Unbound Sentence still starts at 16", () => {
  assert.equal(LEVELS.stage16.name, "Lower Ribs");
});
