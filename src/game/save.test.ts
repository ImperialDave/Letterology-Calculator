import assert from "node:assert/strict";
import test from "node:test";
import { decodeClaim, encodeClaim, hydrateSave, type SaveBlob } from "./save";
import { defaultItems, defaultUpgrades } from "./data";

function sample(): SaveBlob {
  return {
    version: 3,
    seed: 42,
    grid: "x",
    x: 10,
    y: 20,
    vx: 0,
    vy: 0,
    fuel: 18,
    hull: 24,
    money: 90,
    cargo: [],
    upgrades: defaultUpgrades(),
    items: defaultItems(),
    bestDepth: 12,
    bestMoney: 90,
    hellUnlocked: false,
    hellSeen: 0,
    coolantT: 0,
    muted: false,
    shake: true,
    savedAt: 1,
  };
}

test("claim files round-trip through JSON", () => {
  const raw = encodeClaim(sample());
  const back = decodeClaim(raw);
  assert.ok(back);
  assert.equal(back.seed, 42);
  assert.equal(back.money, 90);
  assert.equal(back.grid, "x");
});

test("junk and foreign files are refused", () => {
  assert.equal(decodeClaim("nope"), null);
  assert.equal(decodeClaim(JSON.stringify({ kind: "other-game", seed: 1, grid: "x" })), null);
  assert.ok(hydrateSave({ seed: 1, grid: "ok" }));
});
