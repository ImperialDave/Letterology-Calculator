import assert from "node:assert/strict";
import test from "node:test";
import { assembleRecipe, assembleStage } from "./assemble";
import { chunksFor } from "./chunks";
import { pickPattern } from "./patterns";
import { isBoss, verbsFor } from "./recipe";
import { beatenLedgers, listLedgers, LEVELS } from "./levels";
import { FROZEN_REMAINDER } from "./remainder-hand";
import { densityFloors, tally } from "./density";
import { REMAINDER_NAMES, REMAINDER_OBJECTIVES } from "./remainder-names";
import { validateLevel } from "./validate-level";
import { HAZARD_COOLDOWN, HAZARD_DAMAGE, STAGE_COUNT } from "./types";

test("remainder ledgers have unique names", () => {
  const names = new Set<string>();
  for (let n = 6; n <= STAGE_COUNT; n++) {
    const name = assembleStage(n).name;
    assert.equal(name, REMAINDER_NAMES[n], `stage${n}`);
    assert.equal(names.has(name), false, name);
    names.add(name);
  }
});

const SHOWPIECES = [6, 8, 12, 16, 18, 22, 24, 28, 31, 32, 33, 34, 36, 38, 42, 44, 48, 51, 54, 57, 59];
const BOSSES = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
const FEATURED: Record<number, string> = {
  6: "T",
  8: "-",
  10: "=",
  12: "T",
  15: "|",
  16: "|",
  18: "/",
  20: "|",
  22: "|",
  24: "/",
  25: "`",
  28: "`",
  31: "`",
  32: ")",
  33: "T",
  34: "g",
  35: "`",
  36: ")",
  38: "`",
  40: ")",
  42: "g",
  44: "|",
  45: "S",
  48: "S",
  50: ")",
  51: "$",
  54: "v",
  55: "S",
  57: "|",
  59: ")",
  60: "`",
};

test("keystone remainder stages are frozen and reachable", () => {
  for (const n of BOSSES) {
    const meta = FROZEN_REMAINDER[n];
    assert.ok(meta, `frozen ${n}`);
    const issues = validateLevel(meta.rows).filter((i) => i.code === "path" || i.code === "spawn" || i.code === "hang" || i.code === "embed");
    assert.equal(issues.join("; "), "", `stage${n}`);
    if (n === 60) assert.equal(meta.exit, "win");
    assert.ok(meta.rows.some((r) => r.includes("!")));
  }
});

test("showpiece remainder stages are frozen with their featured toy", () => {
  for (const n of [...SHOWPIECES, ...BOSSES]) {
    const meta = FROZEN_REMAINDER[n];
    assert.ok(meta, `frozen ${n}`);
    const glyph = FEATURED[n];
    if (glyph) assert.ok(meta.rows.some((r) => r.includes(glyph)), `stage${n} missing ${glyph}`);
    const codes = ["path", "spawn", "hang", "embed", "laser-floor", "saw-path", "rest-hazard", "pit", "pit-wide"];
    const issues = validateLevel(meta.rows).filter((i) => codes.includes(i.code));
    assert.equal(issues.map((i) => i.message).join("; "), "", `stage${n}`);
  }
});

test("remainder themes have teach mix combat rest chunks", () => {
  for (const theme of ["orbit", "glacier", "remainder"] as const) {
    for (const beat of ["land", "teach", "mix", "combat", "rest", "gate"] as const) {
      const list = chunksFor(beat, 40, theme);
      assert.ok(list.length > 0, `${theme} ${beat}`);
    }
  }
});

test("listLedgers covers hub through 60", () => {
  const list = listLedgers();
  assert.equal(list[0]?.id, "hub");
  assert.equal(list.length, STAGE_COUNT + 1);
  assert.equal(LEVELS.stage6.name, "Open Case");
  assert.equal(LEVELS.stage15.name, "Book Warden");
  assert.equal(LEVELS.stage31.name, "Gold Orrery");
  assert.equal(LEVELS.stage40.name, "Void Point");
});

test("assembled remainder ledgers pass jump and fairness laws", () => {
  const failed: string[] = [];
  const codes = ["path", "spawn", "hang", "embed", "laser-floor", "saw-path", "rest-hazard", "pit", "pit-wide"];
  for (let n = 6; n <= STAGE_COUNT; n++) {
    const meta = assembleStage(n);
    const issues = validateLevel(meta.rows).filter((i) => codes.includes(i.code));
    if (issues.length) failed.push(`stage${n}: ${issues.map((i) => i.message).join("; ")}`);
  }
  assert.equal(failed.join("\n"), "");
});

test("recipe featured verb stays on the unlock schedule", () => {
  for (const n of [8, 18, 28, 38, 48]) {
    const r = assembleRecipe(n);
    assert.ok(verbsFor(n).includes(r.featured), `${n} ${r.featured}`);
    assert.ok(r.beats.includes("gate"));
    if (!r.beats.includes("arena")) assert.ok(r.beats.includes("land"));
  }
});

test("two remainder ledgers do not clone the same map", () => {
  const a = assembleStage(31).rows.join("\n");
  const b = assembleStage(32).rows.join("\n");
  assert.notEqual(a, b);
});

test("adjacent remainder ledgers 6-60 do not clone a neighbor", () => {
  for (let n = 6; n < STAGE_COUNT; n++) {
    const a = assembleStage(n).rows.join("\n");
    const b = assembleStage(n + 1).rows.join("\n");
    assert.notEqual(a, b, `${n} vs ${n + 1}`);
  }
});

test("non-boss remainder stages have no warden mark", () => {
  for (let n = 6; n <= STAGE_COUNT; n++) {
    if (isBoss(n)) continue;
    const rows = assembleStage(n).rows.join("");
    assert.equal(rows.includes("!"), false, `stage${n}`);
  }
});

test("remainder 6-60 objectives name the room", () => {
  for (let n = 6; n <= STAGE_COUNT; n++) {
    assert.ok(REMAINDER_OBJECTIVES[n], `objective ${n}`);
    assert.notEqual(assembleStage(n).objective, "Cross this remainder. Reach the gate.", `stage${n}`);
    assert.notEqual(assembleStage(n).objective, "Cross the ledger. Reach the gate.", `stage${n}`);
  }
});

test("non-boss remainder 20-29 recipes rest between two combats", () => {
  for (let n = 20; n <= 29; n++) {
    if (isBoss(n)) continue;
    const r = assembleRecipe(n);
    const combats = r.beats.map((b, i) => (b === "combat" ? i : -1)).filter((i) => i >= 0);
    assert.ok(combats.length >= 2, `${n} combats ${r.beats.join(",")}`);
    const rest = r.beats.indexOf("rest");
    assert.ok(rest > combats[0] && rest < combats[combats.length - 1], `${n} rest between combats`);
  }
});

test("remainder 6-60 meet Glyphbound Doctrine density floors", () => {
  const failed: string[] = [];
  for (let n = 6; n <= STAGE_COUNT; n++) {
    const meta = assembleStage(n);
    const d = tally(meta.rows);
    const f = densityFloors(n, d.W);
    const bits: string[] = [];
    if (d.enemies < f.enemies) bits.push(`enemies ${d.enemies}<${f.enemies}`);
    if (d.hazards < f.hazards) bits.push(`hazards ${d.hazards}<${f.hazards}`);
    if (d.movers < f.movers) bits.push(`movers ${d.movers}<${f.movers}`);
    if (d.deco < f.deco) bits.push(`deco ${d.deco}<${f.deco}`);
    if (d.shelves < f.shelves) bits.push(`shelves ${d.shelves}<${f.shelves}`);
    if (d.pickups < f.pickups) bits.push(`pickups ${d.pickups}<${f.pickups}`);
    if (bits.length) failed.push(`stage${n} W=${d.W} ${bits.join("; ")}`);
  }
  assert.equal(failed.join("\n"), "");
});

test("hazard obstacles deal double damage", () => {
  assert.equal(HAZARD_DAMAGE, 2);
  assert.equal(HAZARD_COOLDOWN, 0.5);
});

test("pickPattern prefers the act's themed room", () => {
  const street = pickPattern("teach", "T", "-", () => 0, new Set(), "street");
  assert.equal(street?.id, "street-bounce");
  const fort = pickPattern("teach", "-", "T", () => 0, new Set(), "fort");
  assert.equal(fort?.id, "fort-crumble");
  const coil = pickPattern("teach", "/", "T", () => 0, new Set(), "coil");
  assert.equal(coil?.id, "coil-belt");
  const vault = pickPattern("teach", "|", "T", () => 0, new Set(), "vault");
  assert.equal(vault?.id, "vault-laser");
  const orbit = pickPattern("teach", "`", ")", () => 0, new Set(), "orbit");
  assert.equal(orbit?.id, "orbit-rings");
  const ice = pickPattern("teach", "`", ")", () => 0, new Set(), "glacier");
  assert.equal(ice?.id, "ice-rail-run");
  const script = pickPattern("teach", "g", "`", () => 0, new Set(), "remainder");
  assert.equal(script?.id, "script-trench");
});

test("beatenLedgers only lists closed pages", () => {
  assert.equal(beatenLedgers(0).length, 0);
  const closed = beatenLedgers(34);
  assert.equal(closed.length, 34);
  assert.equal(closed[0]?.id, "stage1");
  assert.equal(closed[33]?.id, "stage34");
  assert.equal(closed.some((l) => l.index === 35), false);
});
