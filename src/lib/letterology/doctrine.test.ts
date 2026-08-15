import assert from "node:assert/strict";
import test from "node:test";
import { DOCTRINE, DOCTRINE_CLOSE, DOCTRINE_PREFACE } from "./doctrine";

test("the doctrine is an argument, not a stub", () => {
  assert.ok(DOCTRINE_PREFACE.length >= 2);
  assert.ok(DOCTRINE.length >= 10);
  for (const section of DOCTRINE) {
    assert.ok(section.title.trim().length >= 4, section.kicker);
    assert.ok(section.paragraphs.length >= 2, section.title);
    for (const paragraph of section.paragraphs) {
      assert.ok(paragraph.length > 80, section.title);
    }
  }
  assert.match(DOCTRINE_CLOSE, /portrait, not a prediction/i);
});

test("the doctrine names the refusals the site actually keeps", () => {
  const body = [...DOCTRINE_PREFACE, ...DOCTRINE.flatMap((section) => section.paragraphs)].join("\n");
  assert.match(body, /handle/i);
  assert.match(body, /Fool/);
  assert.match(body, /not a prediction/i);
  assert.match(body, /twenty-six/i);
  assert.match(body, /Count|numbers are unacceptable/i);
});
