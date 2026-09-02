import assert from "node:assert/strict";
import test from "node:test";
import { assembleRecipe, assembleStage } from "./assemble";
import { chunksFor } from "./chunks";
import { pickPattern } from "./patterns";
import { isBoss, rng, verbsFor } from "./recipe";
import { beatenLedgers, listLedgers, LEVELS } from "./levels";
import { FROZEN_REMAINDER } from "./remainder-hand";
import { densityFloors, dressTerrain, padTerrain, tally } from "./density";
import { localFloorY } from "./levels-story";
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

const SHOWPIECES = [16, 18, 22, 24, 28, 31, 32, 33, 34, 36, 38, 42, 44, 48, 51, 54, 57, 59];
const BOSSES = [20, 25, 30, 35, 40, 45, 50, 55, 60];
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
    if (n === 60) assert.equal(meta.exit, "hub");
    assert.ok(meta.rows.some((r) => r.includes("!")));
  }
});

test("showpiece remainder stages are frozen with their featured toy", () => {
  for (const n of [...SHOWPIECES, ...BOSSES]) {
    const meta = FROZEN_REMAINDER[n];
    assert.ok(meta, `frozen ${n}`);
    const glyph = FEATURED[n];
    if (glyph) assert.ok(meta.rows.some((r) => r.includes(glyph)), `stage${n} missing ${glyph}`);
    const codes = ["path", "spawn", "hang", "embed", "buried", "laser-floor", "saw-path", "rest-hazard", "pit", "pit-wide"];
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
  assert.equal(LEVELS.stage6.name, "Foundry Margin");
  assert.equal(LEVELS.stage15.name, "The Iconostasis");
  assert.equal(LEVELS.stage31.name, "Gold Orrery");
  assert.equal(LEVELS.stage40.name, "Void Point");
});

test("assembled remainder ledgers pass jump and fairness laws", () => {
  const failed: string[] = [];
  const codes = ["path", "spawn", "hang", "embed", "buried", "laser-floor", "saw-path", "rest-hazard", "pit", "pit-wide"];
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

test("remainder ledgers carve hills and valleys", () => {
  const failed: string[] = [];
  for (let n = 16; n <= STAGE_COUNT; n += 3) {
    const rows = assembleStage(n).rows;
    const W = rows[0]?.length ?? 0;
    const heights = new Set<number>();
    for (let x = 8; x < W - 8; x++) heights.add(localFloorY(rows, x));
    if (heights.size < 2) failed.push(`stage${n} heights ${heights.size}`);
  }
  assert.equal(failed.join("; "), "");
});

test("First Book floors leave the runway", () => {
  for (const n of [1, 2, 3, 4, 5]) {
    const rows = LEVELS[`stage${n}`].rows;
    const W = rows[0]?.length ?? 0;
    const heights = new Set<number>();
    for (let x = 8; x < W - 8; x++) heights.add(localFloorY(rows, x));
    assert.ok(heights.size >= 2, `stage${n} heights ${heights.size} ${[...heights].join(",")}`);
  }
});

test("Exchange is never dressed", () => {
  const raw = LEVELS.stage1.rows.join("\n");
  const dressed = dressTerrain(LEVELS.stage1.rows, { n: 1, deco: '"', rand: rng(1) }).join("\n");
  assert.equal(dressed, raw);
});

test("Hard padTerrain adds loft streets on a clone", () => {
  const easy = dressTerrain(LEVELS.stage8.rows, { n: 8, deco: "'", rand: rng(8) });
  const hard = padTerrain(easy, 8, "hard");
  assert.ok(tally(hard).shelves >= tally(easy).shelves);
  const issues = validateLevel(hard).filter((i) =>
    ["path", "laser-floor", "saw-path", "rest-hazard", "buried"].includes(i.code),
  );
  assert.equal(issues.map((i) => i.message).join("; "), "");
});

test("dressed First Book and Numberomicon stages still path", () => {
  const failed: string[] = [];
  for (const n of [2, 3, 4, 5, 8, 12, 15]) {
    const meta = LEVELS[`stage${n}` as keyof typeof LEVELS];
    const rows = dressTerrain(meta.rows, { n, deco: "'", rand: rng(n * 13) });
    const issues = validateLevel(rows).filter((i) =>
      ["path", "saw-path", "rest-hazard", "buried", "teeth"].includes(i.code),
    );
    if (issues.length) failed.push(`stage${n}: ${issues.map((i) => i.message).join("; ")}`);
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

function countCh(rows: string[], ch: string) {
  let n = 0;
  for (const r of rows) for (const c of r) if (c === ch) n += 1;
  return n;
}

function stagesWith(ch: string, from = 1, to = STAGE_COUNT) {
  const out: number[] = [];
  for (let n = from; n <= to; n++) {
    const meta = LEVELS[`stage${n}`];
    if (meta && countCh(meta.rows, ch) > 0) out.push(n);
  }
  return out;
}

test("campaign density uses LEVELS, not assemble ghosts, for Numberomicons", () => {
  const failed: string[] = [];
  for (let n = 6; n <= 15; n++) {
    const meta = LEVELS[`stage${n}`];
    const d = tally(meta.rows);
    const f = densityFloors(n, d.W);
    const bits: string[] = [];
    if (d.hazards < f.hazards) bits.push(`hazards ${d.hazards}<${f.hazards}`);
    if (bits.length) failed.push(`stage${n} W=${d.W} ${bits.join("; ")}`);
  }
  assert.equal(failed.join("\n"), "");
});

test("featured remainder verb is never sluice", () => {
  for (let n = 16; n <= STAGE_COUNT; n++) {
    const r = assembleRecipe(n);
    assert.notEqual(r.featured, "~", `stage${n}`);
    assert.ok(verbsFor(n).includes(r.featured), `${n} ${r.featured}`);
  }
});

test("saws stay on the unlock ramp and do not flood", () => {
  for (let n = 1; n <= 30; n++) {
    assert.equal(countCh(LEVELS[`stage${n}`].rows, "S"), 0, `saw before 31 at ${n}`);
  }
  for (const n of [31, 32, 33, 34]) {
    const saws = countCh(LEVELS[`stage${n}`].rows, "S");
    assert.ok(saws <= 1, `glimpse ${n} has ${saws}`);
  }
  for (let n = 35; n <= STAGE_COUNT; n++) {
    const saws = countCh(LEVELS[`stage${n}`].rows, "S");
    const cap = n % 5 === 0 || n === STAGE_COUNT ? 4 : n >= 46 ? 6 : 4;
    assert.ok(saws <= cap + 2, `stage${n} saws ${saws} > ${cap}`);
  }
});

test("underused HP hazards return across the campaign", () => {
  const sluice = stagesWith("~");
  const vents = stagesWith("v");
  const left = stagesWith("\\");
  const lasers = stagesWith("|");
  const spikes = stagesWith("^");
  assert.ok(sluice.length >= 10, `sluice stages ${sluice.length} ${sluice.join(",")}`);
  assert.ok(vents.length >= 8, `vent stages ${vents.length} ${vents.join(",")}`);
  assert.ok(left.length >= 4, `left-belt stages ${left.length} ${left.join(",")}`);
  assert.ok(lasers.length >= 20, `laser stages ${lasers.length}`);
  assert.ok(spikes.length >= 20, `spike stages ${spikes.length}`);
  assert.ok(sluice.some((n) => n >= 34), "late remainder still carries ink");
  assert.ok(!sluice.includes(33) && !sluice.includes(36), "glacier stays dry");
});

test("First Book walk-on teeth became real pits", () => {
  for (const n of [1, 2, 3, 4, 5]) {
    const rows = LEVELS[`stage${n}`].rows;
    const teeth = countCh(rows, "^") + countCh(rows, "~");
    const lasers = countCh(rows, "|");
    assert.ok(teeth >= 2, `stage${n} teeth ${teeth}`);
    if (n !== 3) assert.ok(lasers >= 1, `stage${n} lasers ${lasers}`);
  }
});

