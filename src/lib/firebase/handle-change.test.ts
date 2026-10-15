import assert from "node:assert/strict";
import test from "node:test";
import { planHandleChange, reservationOf } from "./handle-change";

const current = { handle: "ada-lovelace", displayHandle: "Ada Lovelace" };

test("planHandleChange distinguishes invalid, spelling, and a real rename", () => {
  assert.equal(planHandleChange(current, "@@@").kind, "invalid");
  assert.equal(planHandleChange(current, "Ada Lovelace").kind, "unchanged");
  assert.deepEqual(planHandleChange(current, "ada lovelace"), {
    kind: "spelling",
    displayHandle: "ada lovelace",
  });
  assert.deepEqual(planHandleChange(current, "@Ada"), {
    kind: "rename",
    handle: "ada",
    displayHandle: "@ada",
  });
});

test("a slug we already hold is adopted, not taken", () => {
  assert.equal(reservationOf(null, "me"), "create");
  assert.equal(reservationOf("me", "me"), "adopt");
  assert.equal(reservationOf("them", "me"), "taken");
});
