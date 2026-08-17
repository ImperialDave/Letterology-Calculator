import assert from "node:assert/strict";
import test from "node:test";
import { FORBIDDEN_UI, VOICE } from "./voice";

test("door copy does not speak house-tongue", () => {
  const body = Object.values(VOICE).join("\n");
  for (const banned of FORBIDDEN_UI) {
    assert.doesNotMatch(body, banned, String(banned));
  }
});

test("every door string is usable English", () => {
  for (const [key, value] of Object.entries(VOICE)) {
    assert.ok(value.trim().length >= 6, key);
    assert.doesNotMatch(value, /sits the|sit your|chiton|omphalos/i, key);
  }
});
