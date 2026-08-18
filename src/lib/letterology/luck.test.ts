import assert from "node:assert/strict";
import test from "node:test";
import { buildHoroscope } from "./engine";
import { decide, luckOf } from "./luck";

test("luck reading is coherent for a handle", () => {
  const portrait = buildHoroscope("grok");
  assert.ok(portrait);
  const luck = luckOf(portrait, { year: 2026, month: 7, day: 18 });
  assert.ok(luck.score >= 0 && luck.score <= 100);
  assert.ok(luck.verdict.length > 3);
  assert.ok(luck.counsel.do.length > 8);
  assert.ok(luck.favorable.length >= 3);
  assert.ok(luck.contrary.length >= 3);
});

test("a decision can be timed", () => {
  const portrait = buildHoroscope("grok");
  assert.ok(portrait);
  const decision = decide(portrait, "ship the launch", { year: 2026, month: 7, day: 18 });
  assert.ok(decision);
  assert.equal(decision.actLetter, "S");
  assert.match(decision.headline, /Do it|move|Not this|Reframe/i);
});

test("digits in a handle become Count letters", () => {
  const portrait = buildHoroscope("33cc");
  assert.ok(portrait);
  assert.ok(portrait.inventory.some((item) => item.letter === "C"));
});
