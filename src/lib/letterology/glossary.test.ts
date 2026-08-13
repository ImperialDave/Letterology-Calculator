import assert from "node:assert/strict";
import test from "node:test";
import { GLOSSARY, gloss, entryOf } from "./glossary";

test("every coined term has a metaphor and a plain translation", () => {
  assert.ok(GLOSSARY.length >= 20);
  for (const item of GLOSSARY) {
    assert.ok(item.term.trim().length > 0, item.id);
    assert.ok(item.metaphor.trim().length > 0, item.id);
    assert.ok(item.plain.trim().length > 12, item.id);
    assert.notEqual(item.plain.toLowerCase(), item.metaphor.toLowerCase(), item.id);
    assert.ok(item.surfaces.length > 0, item.id);
  }
});

test("high-opacity terms stay short enough to sit under a heading", () => {
  for (const item of GLOSSARY.filter((entry) => entry.opacity === "high")) {
    assert.ok(item.plain.length <= 180, `${item.id} is ${item.plain.length} chars`);
  }
});

test("gloss() is the same string as the catalog", () => {
  const house = entryOf("house");
  assert.equal(gloss("house"), house.plain);
  assert.match(gloss("enemies"), /blind spot/i);
  assert.match(gloss("handle"), /username/i);
});
