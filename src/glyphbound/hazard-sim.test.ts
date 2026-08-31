import assert from "node:assert/strict";
import test from "node:test";
import { HAZARD, MOVING, WALK_SKIP } from "./spatial";
import type { Solid, SolidType } from "./types";
import { TILE } from "./types";
import {
  dropcapPose,
  grateHot,
  stamperPose,
  shutterSlam,
  toyDrawFrame,
} from "./toys";
import { geyserIsHot, laserIsHot, solidIsHot, spikeExtend, spikeIsHot } from "./hazard-pose";

function solid(type: SolidType, extra: Partial<Solid> = {}): Solid {
  return { x: 0, y: 0, w: TILE, h: TILE, type, ...extra };
}

test("walk skip vs hazard vs moving contracts", () => {
  for (const t of ["sluice", "laser", "fan", "spike", "saw", "geyser", "censer", "stamper", "guillotine"] as SolidType[]) {
    assert.ok(WALK_SKIP.has(t), t);
  }
  assert.equal(WALK_SKIP.has("rotor"), false);
  assert.equal(WALK_SKIP.has("grate"), false);
  assert.ok(HAZARD.has("dropcap"));
  assert.ok(HAZARD.has("rotor"));
  assert.ok(HAZARD.has("grate"));
  assert.equal(HAZARD.has("sinkink"), false);
  assert.equal(HAZARD.has("echo"), false);
  assert.equal(HAZARD.has("bounce"), false);
  for (const t of ["lift", "saw", "censer", "stamper", "guillotine", "dropcap", "rotor", "shutter", "carriage"] as SolidType[]) {
    assert.ok(MOVING.has(t), t);
  }
  assert.equal(MOVING.has("grate"), false);
  assert.equal(MOVING.has("blink"), false);
  assert.equal(MOVING.has("sinkink"), false);
});

test("solidIsHot matches toy pose helpers including dropcap", () => {
  assert.equal(solidIsHot(solid("stamper"), 0.2), stamperPose(0.2, 0).hot);
  assert.equal(solidIsHot(solid("stamper"), 1.5), stamperPose(1.5, 0).hot);
  assert.equal(solidIsHot(solid("grate"), 1.4), grateHot(1.4, 0));
  assert.equal(solidIsHot(solid("shutter"), 0.2), shutterSlam(0.2, 0));
  assert.equal(solidIsHot(solid("censer"), 0), true);
  assert.equal(solidIsHot(solid("rotor"), 0), true);
  assert.equal(solidIsHot(solid("saw"), 0), true);
  const fall = 1.1;
  assert.equal(dropcapPose(fall, 0).hot, true);
  assert.equal(solidIsHot(solid("dropcap"), fall), true);
  assert.equal(solidIsHot(solid("dropcap"), 0.2), false);
  assert.equal(solidIsHot(solid("dropcap"), 2.0), false);
});

test("spike extend and hot share one clock", () => {
  assert.equal(spikeExtend(0, undefined), 1);
  assert.equal(spikeIsHot(0, undefined), true);
  const ph = 0;
  assert.ok(spikeExtend(0.1, ph) > 0.3 && spikeExtend(0.1, ph) < 0.7);
  assert.equal(spikeIsHot(0.1, ph), spikeExtend(0.1, ph) > 0.35);
  assert.equal(spikeIsHot(0.5, ph), true);
  assert.equal(spikeIsHot(1.4, ph), false);
  assert.ok(spikeExtend(1.4, ph) < 0.35);
});

test("laser and geyser duty cycles", () => {
  assert.equal(laserIsHot(0, 0), true);
  assert.equal(laserIsHot(0.6, 0), false);
  assert.equal(geyserIsHot(0.2, 0), true);
  assert.equal(geyserIsHot(1.0, 0), false);
});

test("stamper and rotor draw frames follow the live pose", () => {
  assert.equal(toyDrawFrame("stamper", 0.2, 0), 0);
  assert.equal(toyDrawFrame("stamper", 1.2, 0), 1);
  assert.equal(toyDrawFrame("stamper", 1.5, 0), 2);
  assert.equal(toyDrawFrame("stamper", 1.85, 0), 3);
  assert.equal(toyDrawFrame("stamper", 2.15, 0), 4);
  assert.equal(toyDrawFrame("rotor", 0.2, 0), 0);
  assert.equal(toyDrawFrame("censer", 0, 0), 0);
});
