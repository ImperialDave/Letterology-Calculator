import assert from "node:assert/strict";
import test from "node:test";
import {
  KILN_BASE_MAX,
  LATTICE_SLOTS,
  UPGRADES,
  defaultItems,
  defaultUpgrades,
  latticeUnlocked,
  nailCap,
} from "./data";
import { Sim, spawnPlayer } from "./sim";
import { World } from "./world";

function rig(money = 20_000_000) {
  const world = new World(1);
  const p = spawnPlayer(defaultUpgrades(), defaultItems(), money);
  const sim = new Sim(world, p, 0, true);
  sim.hellSeen = 3;
  sim.hellUnlocked = true;
  return sim;
}

test("lattice stays sealed until Heartfire", () => {
  assert.equal(latticeUnlocked(2), false);
  assert.equal(latticeUnlocked(3), true);
  assert.equal(nailCap(0), 0);
  assert.equal(nailCap(1), 1);
  assert.equal(nailCap(2), 2);
});

test("lattice T1 costs sit in the half-million band", () => {
  for (const slot of LATTICE_SLOTS) {
    assert.ok(UPGRADES[slot][1]!.cost >= 500_000);
    assert.ok(UPGRADES[slot][3]!.cost <= 15_000_000);
  }
  assert.equal(UPGRADES.cipher[3]!.cost, 15_000_000);
  assert.equal(UPGRADES.hull[KILN_BASE_MAX + 1]!.cost, 1_800_000);
});

test("kiln33 iron does not include lattice modules", () => {
  const sim = rig(0);
  sim.forgeKilnOffering();
  assert.equal(sim.player.upgrades.drill, 7);
  assert.equal(sim.player.upgrades.hull, 7);
  assert.equal(sim.player.upgrades.phase, 0);
  assert.equal(sim.player.upgrades.cipher, 0);
  assert.equal(sim.player.items.nullcharge, 0);
});

test("lattice shop sells Ghostedge and refuses Index without a seal", () => {
  const sim = rig();
  assert.equal(sim.buyUpgrade("phase", "lattice"), true);
  assert.equal(sim.player.upgrades.phase, 1);
  sim.player.upgrades.cipher = 2;
  assert.equal(sim.buyUpgrade("cipher", "lattice"), false);
  sim.sealsFound = 1;
  assert.equal(sim.buyUpgrade("cipher", "lattice"), true);
  assert.equal(sim.player.upgrades.cipher, 3);
});

test("chorus pays 85 and assay premium is exchange-only", () => {
  const sim = rig();
  sim.player.upgrades.resonator = 3;
  sim.player.y = 800;
  sim.player.cargo.push({ id: 11, name: "Ironshard", value: 1000 });
  const chorus = sim.chorusSell();
  assert.equal(chorus, 850);
  sim.player.cargo.push({ id: 11, name: "Ironshard", value: 1000 });
  sim.player.y = 80;
  const pad = sim.sellAll();
  assert.equal(pad, 1150);
});

test("a Well Seal is not for sale and sealing wins", () => {
  const sim = rig();
  sim.player.y = (12 - 0.55) * 32;
  sim.player.grounded = true;
  sim.player.cargo.push({ id: 36, name: "Well Seal", value: 800000, relic: true });
  assert.equal(sim.sellAll(), 0);
  assert.equal(sim.carryingSeal(), true);
  assert.equal(sim.presentSeal(), true);
  assert.equal(sim.won, true);
  assert.equal(sim.carryingSeal(), false);
  assert.ok(sim.player.money >= 2_000_000);
});

test("afteriron stays locked until the well is sealed", () => {
  const sim = rig();
  assert.equal(sim.buyUpgrade("corebit", "lattice"), false);
  sim.won = true;
  assert.equal(sim.buyUpgrade("corebit", "lattice"), true);
  assert.equal(sim.player.upgrades.corebit, 1);
});

test("kiln33 still skips afteriron", () => {
  const sim = rig(0);
  sim.forgeKilnOffering();
  assert.equal(sim.player.upgrades.corebit, 0);
  assert.equal(sim.player.upgrades.hook, 0);
  assert.equal(sim.won, false);
});

