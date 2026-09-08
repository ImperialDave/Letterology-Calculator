import assert from "node:assert/strict";
import test from "node:test";
import { DOCTRINE, DOCTRINE_CLOSE, DOCTRINE_PREFACE } from "./doctrine";
import { STOICHEIA_DOCTRINE } from "../stoicheia/doctrine";

function isComplete(line: string) {
  return /[.?!]["”']?$/.test(line.trim());
}

test("the doctrine is a short argument in complete sentences", () => {
  assert.ok(DOCTRINE_PREFACE.length >= 2);
  assert.ok(DOCTRINE.length >= 6);
  assert.ok(DOCTRINE.length <= 9);
  assert.equal(DOCTRINE[0]?.title, "The Master and the Emissary");
  for (const section of DOCTRINE) {
    assert.ok(section.title.trim().length >= 4, section.kicker);
    assert.ok(section.paragraphs.length >= 2, section.title);
    for (const paragraph of section.paragraphs) {
      assert.ok(isComplete(paragraph), `${section.title}: ${paragraph}`);
    }
  }
  assert.match(DOCTRINE_CLOSE, /decision is yours/i);
});

test("the doctrine names the refusals the site actually keeps", () => {
  const body = [...DOCTRINE_PREFACE, ...DOCTRINE.flatMap((section) => section.paragraphs)].join("\n");
  assert.match(body, /username/i);
  assert.match(body, /Fool/);
  assert.match(body, /willingness|luck/i);
  assert.match(body, /twenty-six/i);
  assert.match(body, /Count|write amounts as letters/i);
  assert.match(body, /whole/);
  assert.match(body, /pieces/);
  assert.match(body, /come home|come back|return/i);
  assert.match(body, /Master/);
  assert.match(body, /Emissary/);
  assert.doesNotMatch(body, /\bcult\b/i);
  assert.doesNotMatch(body, /left-brain|right-brain|hemisphere/i);
});

test("the Greek warrant is three sections, not a second book", () => {
  assert.equal(STOICHEIA_DOCTRINE.length, 3);
  const body = STOICHEIA_DOCTRINE.flatMap((section) => section.paragraphs).join("\n");
  assert.match(body, /not a translation|cannot be mapped/i);
  assert.match(body, /sum is something the name can carry/i);
  assert.match(body, /Flip the tongue/i);
  for (const section of STOICHEIA_DOCTRINE) {
    for (const paragraph of section.paragraphs) {
      assert.ok(isComplete(paragraph), section.title);
    }
  }
});
