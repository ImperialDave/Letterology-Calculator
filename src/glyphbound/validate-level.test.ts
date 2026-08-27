import assert from "node:assert/strict";
import test from "node:test";
import { assembleStage } from "./assemble";
import { blankFolio } from "./studio";
import { checkMap, validateLevel } from "./validate-level";
import { STAGE_COUNT } from "./types";
import { LEVELS } from "./levels";

test("blank folio has a path from spawn to gate", () => {
  const issues = checkMap(blankFolio({ id: "folio-blank" }));
  assert.deepEqual(issues, []);
});

test("a ten-tile empty pit fails the jump budget", () => {
  const f = blankFolio({ id: "folio-pit" });
  let fy = 0;
  let best = 0;
  for (let y = 1; y < f.rows.length - 1; y++) {
    const n = [...f.rows[y]].filter((c) => c === "#").length;
    if (n > best) {
      best = n;
      fy = y;
    }
  }
  const row = f.rows[fy].split("");
  for (let x = 8; x < 18; x++) row[x] = ".";
  f.rows[fy] = row.join("");
  const codes = validateLevel(f.rows).map((i) => i.code);
  assert.ok(codes.includes("pit") || codes.includes("pit-wide") || codes.includes("path"), codes.join(","));
});

test("spawn on spikes fails", () => {
  const f = blankFolio({ id: "folio-teeth" });
  let ax = 0;
  let ay = 0;
  for (let y = 0; y < f.rows.length; y++) {
    const x = f.rows[y].indexOf("@");
    if (x >= 0) {
      ax = x;
      ay = y;
      break;
    }
  }
  const row = f.rows[ay + 1].split("");
  row[ax] = "^";
  f.rows[ay + 1] = row.join("");
  assert.ok(validateLevel(f.rows).some((i) => i.code === "teeth"));
});

test("assembled remainder ledgers are reachable", () => {
  const failed: string[] = [];
  for (let n = 6; n <= STAGE_COUNT; n++) {
    const meta = assembleStage(n);
    const issues = validateLevel(meta.rows).filter((i) => i.code === "path" || i.code === "spawn" || i.code === "hang" || i.code === "embed");
    if (issues.length) failed.push(`stage${n}: ${issues.map((i) => i.message).join("; ")}`);
  }
  assert.equal(failed.join("\n"), "");
});

test("LEVELS stage30 is The Period with End-Mark and a gate", () => {
  assert.equal(LEVELS.stage30.name, "The Period");
  assert.ok(LEVELS.stage30.rows.some((r) => r.includes("!")));
  assert.ok(LEVELS.stage30.rows.some((r) => r.includes("P")));
  assert.ok(LEVELS.stage30.rows.some((r) => r.includes("@")));
});

test("LEVELS stage60 is The Remainder", () => {
  assert.equal(LEVELS.stage60.name, "The Remainder");
  assert.equal(LEVELS.stage60.exit, "win");
});
