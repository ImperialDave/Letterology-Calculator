import assert from "node:assert/strict";
import test from "node:test";
import { gaitPlanted, meleePhase, poseOf, tickGait } from "./pose";

test("tickGait is the only locomotion clock", () => {
  let g = 0;
  g = tickGait(g, 180, true, 1 / 60);
  assert.ok(g > 0.1 && g < 0.3, `run step ${g}`);
  const idle = tickGait(0, 0, true, 1);
  const air = tickGait(0, 0, false, 1);
  assert.ok(idle > 1.5 && idle < 3, `idle ${idle}`);
  assert.ok(air > idle, `air ${air} idle ${idle}`);
});

test("gaitPlanted fires once per foot", () => {
  let g = 0;
  let plants = 0;
  const dt = 1 / 60;
  for (let i = 0; i < 180; i++) {
    const next = tickGait(g, 160, true, dt);
    if (gaitPlanted(g, next)) plants += 1;
    g = next;
  }
  assert.ok(plants >= 6 && plants <= 20, `plants ${plants}`);
});

test("poseOf jump stretches, land squashes, melee winds then snaps", () => {
  const jump = poseOf({ vx: 80, vy: -220, grounded: false, squash: 0.82, stretch: 1.08, gait: 1 });
  assert.equal(jump.state, "jump");
  assert.ok(jump.sy < 1, `jump sy ${jump.sy}`);
  const fall = poseOf({ vx: 40, vy: 180, grounded: false, squash: 1.1, gait: 1 });
  assert.equal(fall.state, "fall");
  const wind = poseOf({ grounded: true, melee: 0.1, gait: 0 });
  assert.ok(wind.wind > 0.4, `wind ${wind.wind}`);
  assert.ok(wind.snap < 0.2, `snap during wind ${wind.snap}`);
  const snap = poseOf({ grounded: true, melee: 0.4, gait: 0 });
  assert.ok(snap.snap > 0.4, `snap ${snap.snap}`);
  const hurt = poseOf({ grounded: true, hurt: 0.3, recoil: 1, gait: 0 });
  assert.equal(hurt.state, "hurt");
  assert.ok(Math.abs(hurt.lean) > 0.05, `recoil lean ${hurt.lean}`);
});

test("meleePhase is 0–1 from remaining time", () => {
  assert.equal(meleePhase(0.5, 1), 0.5);
  assert.equal(meleePhase(0, 0), 0);
  assert.ok(Math.abs(meleePhase(0, 1, 0.1, 0.4) - 0.75) < 1e-6);
});

test("contact alternates on a grounded run", () => {
  const a = poseOf({ vx: 160, grounded: true, gait: Math.PI / 2 });
  const b = poseOf({ vx: 160, grounded: true, gait: Math.PI * 1.5 });
  assert.ok(a.contact > 0.9);
  assert.ok(b.contact > 0.9);
  const mid = poseOf({ vx: 160, grounded: true, gait: 0 });
  assert.ok(mid.contact < 0.2);
});
