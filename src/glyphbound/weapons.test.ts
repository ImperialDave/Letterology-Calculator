import assert from "node:assert/strict";
import test from "node:test";
import { KITS, PENTAD } from "./roster";
import { shotCostFor, WEAPONS, weaponFor } from "./weapons";
import type { LetterId } from "./types";

const ALL: LetterId[] = ["c", "s", "b", "e", "r", "k", "n", "t"];

test("each letter has a unique melee weapon", () => {
  const names = new Set<string>();
  for (const id of ALL) {
    const w = weaponFor(id);
    assert.ok(w.name.length > 1, id);
    assert.equal(names.has(w.name), false, w.name);
    names.add(w.name);
    assert.ok(w.reach >= 36);
    assert.ok(w.dmg >= 2);
    assert.ok(w.time >= 0.18 && w.time <= 0.5);
  }
});

test("fang shots spend a large ink burst and ink refills slowly", () => {
  for (const id of PENTAD) {
    assert.ok(shotCostFor(id) >= 11, id);
    assert.ok(KITS[id].inkRate <= 2.2, `${id} ${KITS[id].inkRate}`);
    assert.ok(shotCostFor(id) > KITS[id].inkRate * 4, id);
  }
});
