import assert from "node:assert/strict";
import test from "node:test";
import { normalizeHandle } from "./handle";

test("normalizeHandle keeps a readable slug", () => {
  assert.deepEqual(normalizeHandle("@Lovelace"), { handle: "lovelace", displayHandle: "@lovelace" });
  assert.deepEqual(normalizeHandle("Ada Lovelace"), { handle: "ada-lovelace", displayHandle: "Ada Lovelace" });
});

test("normalizeHandle rejects empty or symbol-only strings", () => {
  assert.equal(normalizeHandle("@@@"), null);
  assert.equal(normalizeHandle("   "), null);
});
