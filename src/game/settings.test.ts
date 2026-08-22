import assert from "node:assert/strict";
import test from "node:test";
import { deadzonePx, defaultSettings, hydrateSettings } from "./settings";

test("hydrate fills new knobs over a partial save", () => {
  const s = hydrateSettings({ muted: true, volume: 0.2 });
  assert.equal(s.muted, true);
  assert.equal(s.volume, 0.2);
  assert.equal(s.deadzone, defaultSettings().deadzone);
  assert.equal(s.compass, defaultSettings().compass);
  assert.equal(s.version, 1);
});

test("volume clamps and junk deadzone falls back", () => {
  const s = hydrateSettings({ volume: 4, deadzone: "ludicrous" });
  assert.equal(s.volume, 1);
  assert.equal(s.deadzone, defaultSettings().deadzone);
});

test("aim slack maps to pixel deadzones", () => {
  assert.ok(deadzonePx({ deadzone: "tight" }) < deadzonePx({ deadzone: "normal" }));
  assert.ok(deadzonePx({ deadzone: "normal" }) < deadzonePx({ deadzone: "wide" }));
});
