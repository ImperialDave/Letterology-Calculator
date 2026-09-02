import assert from "node:assert/strict";
import test from "node:test";
import { auditCampaign, auditLevel, parseAuditTarget } from "./audit";
import { grid } from "./levels-story";
import { houseAfter, plantAt } from "./site";
import { STAGE_COUNT } from "./types";

function room() {
  const g = grid(24, 12, 8);
  g.put(2, 7, "@");
  g.put(21, 7, "P");
  return g;
}

test("auditor flags a spike with nowhere to retract", () => {
  const g = room();
  g.put(10, 6, "^");
  const codes = auditLevel([...g]).map((i) => i.code);
  assert.ok(codes.includes("housing-socket"), codes.join(","));
});

test("auditor flags teeth that replaced the walk floor", () => {
  const g = room();
  g.put(10, 8, "^");
  const codes = auditLevel([...g]).map((i) => i.code);
  assert.ok(codes.includes("housing-float-spike"), codes.join(","));
});

test("auditor flags water with no basin", () => {
  const g = room();
  g.put(10, 8, "w");
  g.put(11, 8, "w");
  g.put(10, 9, ".");
  g.put(11, 9, ".");
  const codes = auditLevel([...g]).map((i) => i.code);
  assert.ok(codes.includes("housing-basin"), codes.join(","));
});

test("auditor flags sidewalk ink with no basin lips", () => {
  const g = room();
  g.put(10, 7, "w");
  g.put(11, 7, "w");
  const codes = auditLevel([...g]).map((i) => i.code);
  assert.ok(codes.includes("housing-basin-lip"), codes.join(","));
});

test("plantAt spike and sinkink audit clean", () => {
  const g = room();
  assert.equal(plantAt(g, 10, "^"), true);
  assert.equal(plantAt(g, 14, "w"), true);
  const codes = auditLevel([...g]).filter((i) => i.code.startsWith("housing-"));
  assert.deepEqual(codes, []);
});

test("plantAt hang toys audit with a beam and anvil", () => {
  const g = room();
  assert.equal(plantAt(g, 10, "z"), true);
  assert.equal(plantAt(g, 16, "l"), true);
  houseAfter(g);
  const codes = auditLevel([...g])
    .filter((i) => i.severity === "fail")
    .map((i) => i.code);
  assert.equal(
    codes.filter((c) => c === "housing-beam" || c === "housing-socket" || c === "housing-basin").join(","),
    "",
  );
});

test("hub is in the campaign and Exchange is stage1", () => {
  assert.deepEqual(parseAuditTarget("hub"), ["hub"]);
  assert.deepEqual(parseAuditTarget("1-5"), ["stage1", "stage2", "stage3", "stage4", "stage5"]);
  const all = auditCampaign("hub");
  assert.equal(all.length, 1);
  assert.equal(all[0].id, "hub");
});

test("campaign audit covers hub plus every stage", () => {
  const reports = auditCampaign("all");
  assert.equal(reports.length, STAGE_COUNT + 1);
  assert.equal(reports[0].id, "hub");
  assert.equal(reports[STAGE_COUNT].id, `stage${STAGE_COUNT}`);
});

test("auditor flags dirt lidding a spike", () => {
  const g = room();
  g.put(10, 8, "#");
  g.put(10, 9, "^");
  const codes = auditLevel([...g]).map((i) => i.code);
  assert.ok(codes.includes("reveal-lid"), codes.join(","));
});

test("Remainder 16-29 has no dirt-lidded teeth", () => {
  const buried: string[] = [];
  for (const r of auditCampaign("16-29")) {
    const lids = r.issues.filter((i) => i.code === "reveal-lid" && i.severity === "fail");
    if (lids.length) buried.push(`${r.id} x${lids.length}`);
  }
  assert.equal(buried.join("; "), "");
});
