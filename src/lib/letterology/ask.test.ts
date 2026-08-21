import assert from "node:assert/strict";
import test from "node:test";
import { ask, classifyMood, stripScaffold } from "./ask";
import { FORBIDDEN_UI } from "./voice";

const DAY = { year: 2026, month: 8, day: 21 };

function scan(label: string, body: string) {
  for (const banned of FORBIDDEN_UI) {
    assert.doesNotMatch(body, banned, `${label} still says ${banned}`);
  }
}

test("scaffold falls away so the matter is letterized", () => {
  assert.equal(stripScaffold("Should I quit my job?"), "quit my job");
  assert.equal(stripScaffold("How do I start"), "start");
  assert.equal(classifyMood("Should I quit?"), "should");
  assert.equal(classifyMood("Will I get the offer"), "will");
  assert.equal(classifyMood("stay or go"), "fork");
  assert.equal(classifyMood("When should I launch"), "when");
});

test("an ask names the handle, the matter, and a verdict", () => {
  const reading = ask("lovelace", "Should I quit my job?", DAY);
  assert.ok(reading);
  assert.equal(reading.handle, "lovelace");
  assert.equal(reading.matter, "quit my job");
  assert.equal(reading.queryLetter, "Q");
  assert.equal(reading.mood, "should");
  assert.match(reading.verdict, /^(yea|lean|hold|nay)$/);
  assert.ok(reading.answer.length > 8);
  assert.match(reading.why, /lovelace/i);
  assert.match(reading.why, /Q/);
  scan("ask", `${reading.answer} ${reading.why} ${reading.charge}`);
});

test("a fork picks one side", () => {
  const reading = ask("grok", "Should I stay or should I go?", DAY);
  assert.ok(reading);
  assert.equal(reading.mood, "fork");
  assert.ok(reading.fork);
  assert.match(reading.answer, /not/i);
  assert.ok(reading.fork.a.score !== undefined);
  scan("fork", reading.answer);
});

test("empty or unletterable questions fail closed", () => {
  assert.equal(ask("lovelace", "", DAY), null);
  assert.equal(ask("lovelace", "???", DAY), null);
  assert.equal(ask("", "Should I stay", DAY), null);
});

test("the score is polarized and the court is named", () => {
  const reading = ask("Ada", "Will I ship the launch?", DAY);
  assert.ok(reading);
  assert.ok(reading.score >= 0 && reading.score <= 100);
  assert.ok(reading.luckScore >= 0);
  assert.match(reading.why, /today is/i);
  assert.match(reading.charge, /Do this|Wait on|Reframe/i);
});
