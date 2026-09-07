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
  assert.match(DOCTRINE_CLOSE, /decision is yours|letters you already carry/i);
});

test("the doctrine names the refusals the site actually keeps", () => {
  const body = [...DOCTRINE_PREFACE, ...DOCTRINE.flatMap((section) => section.paragraphs)].join("\n");
  assert.match(body, /handle/i);
  assert.match(body, /Fool/);
  assert.match(body, /willingness|luck/i);
  assert.match(body, /twenty-six/i);
  assert.match(body, /Count|write amounts as letters/i);
  assert.match(body, /whole/);
  assert.match(body, /pieces/);
  assert.match(body, /come home|come back|return/i);
  assert.match(body, /Master/);
  assert.match(body, /Emissary/);
});

test("the circuit is named before the mechanics", () => {
  assert.equal(DOCTRINE[0]?.title, "The Master and the Emissary");
  assert.match(DOCTRINE_PREFACE.join(" "), /See the whole/);
  assert.match(DOCTRINE_CLOSE, /Come back/);
});
