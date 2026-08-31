import assert from "node:assert/strict";
import test from "node:test";
import { densityFloors, tally } from "./density";
import { LEVELS } from "./levels";
import { localFloorY } from "./levels-story";
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

test("Numberomicon wallpaper is toys, not bounce halls", () => {
  const count = (n: number, ch: string) =>
    [...LEVELS[`stage${n}`].rows.join("")].filter((c) => c === ch).length;
  assert.equal(count(1, "l") + count(1, "z") + count(1, "w") + count(1, "x"), 0, "Exchange stays toy-free");
  assert.ok(count(6, "l") >= 3, `foundry censers ${count(6, "l")}`);
  assert.ok(count(6, "T") <= 6, `foundry bounce ${count(6, "T")}`);
  assert.ok(count(7, "l") + count(7, "z") >= 4, "keystroke hang kit");
  assert.ok(count(8, "f") >= 2, "fourfold drop-caps");
  assert.ok(count(12, "j") >= 3, "scriptorium grates");
  for (const n of STORY) {
    assert.equal(count(n, "S"), 0, `stage${n} saw`);
  }
});

test("Unbound Sentence still starts at 16", () => {
  assert.equal(LEVELS.stage16.name, "Lower Ribs");
});

function floorHeights(rows: string[]) {
  const W = rows[0]?.length ?? 0;
  const set = new Set<number>();
  for (let x = 8; x < W - 8; x++) set.add(localFloorY(rows, x));
  return set;
}

test("Numberomicon floors are hills and valleys, not a runway", () => {
  for (const n of STORY) {
    const rows = LEVELS[`stage${n}`].rows;
    const heights = floorHeights(rows);
    assert.ok(heights.size >= 3, `stage${n} floor heights ${heights.size} ${[...heights].join(",")}`);
  }
});

test("foundry damage toys sit at more than one height", () => {
  const rows = LEVELS.stage6.rows;
  const ys = new Set<number>();
  for (let y = 0; y < rows.length; y++) {
    for (const ch of rows[y]) if (ch === "l") ys.add(y);
  }
  assert.ok(ys.size >= 2, `censer heights ${[...ys].join(",")}`);
});

test("Numberomicon ledgers meet late-book density", () => {
  const failed: string[] = [];
  for (const n of STORY) {
    const meta = LEVELS[`stage${n}`];
    const d = tally(meta.rows);
    const f = densityFloors(30, d.W);
    const bits: string[] = [];
    if (d.enemies < f.enemies) bits.push(`enemies ${d.enemies}<${f.enemies}`);
    if (d.hazards < f.hazards) bits.push(`hazards ${d.hazards}<${f.hazards}`);
    if (d.movers < f.movers) bits.push(`movers ${d.movers}<${f.movers}`);
    if (d.deco < f.deco) bits.push(`deco ${d.deco}<${f.deco}`);
    if (d.shelves < f.shelves) bits.push(`shelves ${d.shelves}<${f.shelves}`);
    if (bits.length) failed.push(`stage${n} W=${d.W} ${bits.join("; ")}`);
  }
  assert.equal(failed.join("\n"), "");
});
