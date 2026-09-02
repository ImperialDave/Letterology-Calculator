import assert from "node:assert/strict";
import test from "node:test";
import { assembleStage } from "./assemble";
import { auditLevel } from "./audit";
import { CENTURY } from "./century-catalog";
import { FROZEN_CENTURY } from "./century";
import { densityFloors, tally } from "./density";
import { LEVELS } from "./levels";
import { REMAINDER_NAMES, REMAINDER_OBJECTIVES } from "./remainder-names";
import { isBoss } from "./recipe";
import { STAGE_COUNT } from "./types";
import { validateLevel } from "./validate-level";

const CODES = ["path", "spawn", "hang", "embed", "buried", "laser-floor", "saw-path", "rest-hazard", "pit", "pit-wide"];

test("second century is one hundred frozen ledgers 61-160", () => {
  assert.equal(CENTURY.length, 100);
  assert.equal(Object.keys(FROZEN_CENTURY).length, 100);
  assert.equal(STAGE_COUNT, 160);
  assert.equal(assembleStage(60).exit, "hub");
  assert.equal(assembleStage(160).exit, "win");
  assert.ok(assembleStage(160).rows.some((r) => r.includes("!")));
});

test("second century names are unique and match the catalog", () => {
  const names = new Set<string>();
  for (const spec of CENTURY) {
    assert.equal(assembleStage(spec.n).name, spec.name, `stage${spec.n}`);
    assert.equal(REMAINDER_NAMES[spec.n], spec.name);
    assert.equal(REMAINDER_OBJECTIVES[spec.n], spec.objective);
    assert.equal(names.has(spec.name), false, spec.name);
    names.add(spec.name);
  }
});

test("second century featured toy is on the map and sluice is never featured", () => {
  for (const spec of CENTURY) {
    assert.notEqual(spec.featured, "~", `stage${spec.n}`);
    const rows = FROZEN_CENTURY[spec.n].rows.join("");
    assert.ok(rows.includes(spec.featured), `stage${spec.n} missing ${spec.featured}`);
    assert.ok(rows.includes("@") && rows.includes("P") && rows.includes("%"));
  }
});

test("second century maps are unique and neighbors do not clone", () => {
  const seen = new Set<string>();
  for (let n = 61; n <= STAGE_COUNT; n++) {
    const key = assembleStage(n).rows.join("\n");
    assert.equal(seen.has(key), false, `clone at ${n}`);
    seen.add(key);
    if (n < STAGE_COUNT) {
      const next = assembleStage(n + 1).rows.join("\n");
      assert.notEqual(key, next, `${n} vs ${n + 1}`);
    }
  }
});

test("second century ledgers pass jump and fairness laws", () => {
  const failed: string[] = [];
  for (let n = 61; n <= STAGE_COUNT; n++) {
    const issues = validateLevel(assembleStage(n).rows).filter((i) => CODES.includes(i.code));
    if (issues.length) failed.push(`stage${n}: ${issues.map((i) => i.message).join("; ")}`);
  }
  assert.equal(failed.join("\n"), "");
});

test("second century bosses carry a warden; others do not", () => {
  for (let n = 61; n <= STAGE_COUNT; n++) {
    const rows = assembleStage(n).rows.join("");
    if (isBoss(n)) assert.equal(rows.includes("!"), true, `stage${n} boss`);
    else assert.equal(rows.includes("!"), false, `stage${n} extra warden`);
  }
});

test("second century housing and site audit clean", () => {
  const failed: string[] = [];
  for (let n = 61; n <= STAGE_COUNT; n++) {
    const meta = LEVELS[`stage${n}`];
    const fails = auditLevel(meta.rows, { id: meta.id }).filter((i) => i.severity === "fail");
    if (fails.length) failed.push(`stage${n}: ${fails.map((i) => i.code).join(",")}`);
  }
  assert.equal(failed.join("\n"), "");
});

test("second century meets density floors", () => {
  const failed: string[] = [];
  for (let n = 61; n <= STAGE_COUNT; n++) {
    const meta = LEVELS[`stage${n}`];
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
