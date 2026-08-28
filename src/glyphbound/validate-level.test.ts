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

test("laser on the walkway fails", () => {
  const f = blankFolio({ id: "folio-laser" });
  let fy = 0;
  let best = 0;
  for (let y = 1; y < f.rows.length - 1; y++) {
    const n = [...f.rows[y]].filter((c) => c === "#").length;
    if (n > best) {
      best = n;
      fy = y;
    }
  }
  const row = f.rows[fy - 1].split("");
  const x = f.rows[fy - 1].indexOf("@");
  row[x + 4] = "|";
  f.rows[fy - 1] = row.join("");
  assert.ok(validateLevel(f.rows).some((i) => i.code === "laser-floor"));
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
    const issues = validateLevel(meta.rows).filter((i) =>
      ["path", "spawn", "hang", "embed", "buried", "laser-floor", "saw-path", "rest-hazard", "pit", "pit-wide"].includes(i.code),
    );
    if (issues.length) failed.push(`stage${n}: ${issues.map((i) => i.message).join("; ")}`);
  }
  assert.equal(failed.join("\n"), "");
});

test("every campaign gate is reachable from spawn", () => {
  const failed: string[] = [];
  for (let n = 1; n <= STAGE_COUNT; n++) {
    const issues = validateLevel(LEVELS[`stage${n}`].rows).filter((i) => i.code === "path" || i.code === "buried" || i.code === "hang");
    if (issues.length) failed.push(`stage${n}: ${issues.map((i) => i.message).join("; ")}`);
  }
  assert.equal(failed.join("\n"), "");
});

test("assembled ledgers have no undercroft skip hallway", () => {
  const failed: string[] = [];
  for (let n = 1; n <= STAGE_COUNT; n++) {
    const rows = LEVELS[`stage${n}`].rows;
    const crawl = rows[rows.length - 2] ?? "";
    let run = 0;
    let best = 0;
    for (const ch of crawl) {
      if (ch === ".") {
        run += 1;
        if (run > best) best = run;
      } else run = 0;
    }
    if (best >= 8) failed.push(`stage${n} crawl run ${best}`);
  }
  const hub = LEVELS.hub.rows[LEVELS.hub.rows.length - 2] ?? "";
  const hubDots = [...hub].filter((c) => c === ".").length;
  if (hubDots >= 8) failed.push(`hub crawl dots ${hubDots}`);
  assert.equal(failed.join("\n"), "");
});

test("campaign gates stand on the walkway, not in the basement", () => {
  const failed: string[] = [];
  for (let n = 1; n <= STAGE_COUNT; n++) {
    const rows = LEVELS[`stage${n}`].rows;
    let sy = -1;
    let gy = -1;
    for (let y = 0; y < rows.length; y++) {
      if (sy < 0 && rows[y].includes("@")) sy = y;
      if (gy < 0 && rows[y].includes("P")) gy = y;
    }
    if (sy < 0 || gy < 0) failed.push(`stage${n} missing @ or P`);
    else if (gy > sy + 1) failed.push(`stage${n} gate y=${gy} below spawn y=${sy}`);
    if (validateLevel(rows).some((i) => i.code === "buried")) failed.push(`stage${n} buried`);
  }
  assert.equal(failed.join("\n"), "");
});

test("a gate in the basement fails buried", () => {
  const f = blankFolio({ id: "folio-buried" });
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
  const old = f.rows[ay].indexOf("P");
  if (old >= 0) {
    const row = f.rows[ay].split("");
    row[old] = ".";
    f.rows[ay] = row.join("");
  }
  const by = Math.min(f.rows.length - 2, ay + 3);
  const row = f.rows[by].split("");
  row[Math.min(row.length - 2, ax + 8)] = "P";
  f.rows[by] = row.join("");
  assert.ok(validateLevel(f.rows).some((i) => i.code === "buried"));
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
