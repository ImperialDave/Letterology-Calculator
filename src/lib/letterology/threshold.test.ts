import assert from "node:assert/strict";
import test from "node:test";
import { FORBIDDEN_UI, VOICE } from "./voice";
import {
  SCALE_ITEMS,
  SECTION_LISTEN,
  THRESHOLD_ITEMS,
  THRESHOLD_SECTIONS,
  presentScaleDeck,
  scoreThresholdAxes,
  thresholdAnswersCsv,
  validateThresholdPayload,
} from "./threshold";

function filledPayload() {
  const written: Record<string, string> = {};
  const scales: Record<string, number> = {};
  const scenes: Record<string, string> = {};
  for (const item of THRESHOLD_ITEMS) {
    if (item.kind === "scale") scales[item.id] = 3;
    else if (item.kind === "scene") scenes[item.id] = "A short precise answer.";
    else written[item.id] = "A short honest answer.";
  }
  return {
    id: "11111111-1111-4111-8111-111111111111",
    handle: "lovelace",
    house: "Seeker",
    hours: "two evenings",
    written,
    scales,
    scenes,
  };
}

test("the threshold has thirty-seven items across six sections", () => {
  assert.equal(THRESHOLD_ITEMS.length, 37);
  assert.equal(THRESHOLD_ITEMS.filter((item) => item.kind === "scale").length, 12);
  assert.equal(THRESHOLD_ITEMS.filter((item) => item.kind === "scene").length, 2);
});

test("validateThresholdPayload requires a handle and allows incomplete answers", () => {
  const ok = filledPayload();
  assert.ok(validateThresholdPayload(ok));
  assert.equal(validateThresholdPayload({ ...ok, handle: "" }), null);
  assert.equal(validateThresholdPayload({ ...ok, scales: { ...ok.scales, q24: 0 } }), null);
  const incomplete = {
    ...ok,
    written: { q1: "only this" },
    scales: {},
    scenes: {},
  };
  const parsed = validateThresholdPayload(incomplete);
  assert.ok(parsed);
  assert.equal(parsed.written.q1, "only this");
  assert.equal(parsed.written.q2, "");
  assert.equal(Object.keys(parsed.scales).length, 0);
});

test("scale axes follow the membership cut, not a portrait grade", () => {
  const highCraft: Record<string, number> = Object.fromEntries(SCALE_ITEMS.map((item) => [item.id, 5]));
  const axes = scoreThresholdAxes(highCraft);
  assert.equal(axes.stay, 5);
  assert.equal(axes.hand, 5);
  assert.equal(axes.room, 5);
  assert.equal(axes.method, 5);
  assert.equal(axes.poorDiscretion, false);
  assert.equal(axes.ornamental, false);

  const leak = { ...highCraft, q27: 1, q31: 1 };
  assert.equal(scoreThresholdAxes(leak).poorDiscretion, true);

  const ornament = { ...highCraft, q24: 1, q32: 1, q33: 1 };
  assert.equal(scoreThresholdAxes(ornament).ornamental, true);
});

test("scale order shuffles by seed and stays the same seed", () => {
  const a = presentScaleDeck(7).map((item) => item.id).join(",");
  const b = presentScaleDeck(99).map((item) => item.id).join(",");
  const again = presentScaleDeck(7).map((item) => item.id).join(",");
  assert.equal(a, again);
  assert.notEqual(a, b);
  assert.equal(presentScaleDeck(7).length, SCALE_ITEMS.length);
});

test("threshold copy stays off the portrait and in club English", () => {
  const body = [
    VOICE.thresholdTitle,
    VOICE.thresholdLede,
    VOICE.thresholdThanks,
    VOICE.thresholdEmpty,
    ...Object.values(SECTION_LISTEN),
  ].join("\n");
  for (const banned of FORBIDDEN_UI) {
    assert.doesNotMatch(body, banned);
  }
  assert.doesNotMatch(body, /left-brain|dashboard|loyalty score|interrogation/i);
  assert.match(VOICE.thresholdLede, /membership screen/i);
  assert.match(VOICE.thresholdThanks, /not a grade and not a portrait/i);
  assert.equal(Object.keys(SECTION_LISTEN).length, THRESHOLD_SECTIONS.length);
});

test("long answers csv has one row per item", () => {
  const parsed = validateThresholdPayload(filledPayload());
  assert.ok(parsed);
  const csv = thresholdAnswersCsv([
    {
      ...parsed,
      createdAt: "2026-09-10T12:00:00.000Z",
      userId: null,
      axes: scoreThresholdAxes(parsed.scales),
      inventory: "threshold-v1",
    },
  ]);
  assert.match(csv, /^sitting,handle,item,kind,prompt,answer\n/);
  assert.equal(csv.trim().split("\n").length, THRESHOLD_ITEMS.length + 1);
});
