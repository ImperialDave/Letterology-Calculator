import assert from "node:assert/strict";
import test from "node:test";
import { bootScale, SCALE, poseScaleWalk, scaleWorld } from "./robots";
import { fk } from "./rig";
import { createSortie, emptyInput, spawnEnemy, stepSortie } from "./sim";
import { partAlive } from "./brain";

test("Scale FK puts the pack behind the pelvis and feet below", () => {
  const live = bootScale();
  const world = fk(SCALE.joints, live.pose, { x: 0, y: 0, z: 0, yaw: 0 });
  assert.ok(world.pelvis.y > 20, `pelvis ${world.pelvis.y}`);
  assert.ok(world.footL.y < world.pelvis.y - 10, `foot ${world.footL.y}`);
  assert.ok(world.pack.z > 0, `pack behind at yaw 0, z ${world.pack.z}`);
  assert.ok(world.head.z < 0, `head forward ${world.head.z}`);
});

test("Scale walks toward the C-wing", () => {
  const s = createSortie({ corridor: false });
  s.wave = 99;
  s.flight = "allrange";
  s.speed = 0;
  s.x = 0;
  s.y = 40;
  s.z = 0;
  spawnEnemy(s, "mech", 0, 20, -160, { setPiece: true });
  const e = s.enemies.find((n) => n.kind === "mech" && n.setPiece);
  assert.ok(e?.robot);
  const d0 = Math.hypot(e!.x - s.x, e!.z - s.z);
  for (let i = 0; i < 90; i++) {
    s.x = 0;
    s.z = 0;
    s.speed = 0;
    stepSortie(s, emptyInput(), 1 / 60);
  }
  const d1 = Math.hypot(e!.x - 0, e!.z - 0);
  assert.ok(d1 < d0 - 4, `should close ${d1} from ${d0}`);
});

test("killing a Scale stem topples it and only the pack remains a mark", () => {
  const s = createSortie();
  s.wave = 99;
  spawnEnemy(s, "mech", 0, 20, -80, { setPiece: true });
  const e = s.enemies.find((n) => n.setPiece)!;
  assert.ok(e.robot);
  e.robot!.parts.legL = 0;
  e.robot!.state = "hunt";
  stepSortie(s, emptyInput(), 1 / 60);
  // force the standing next() by expiring hunt hold
  e.robot!.tele = 0;
  e.robot!.hold = 0;
  stepSortie(s, emptyInput(), 1 / 60);
  assert.ok(e.robot!.state === "topple" || e.robot!.state === "fallen", e.robot!.state);
  assert.deepEqual(e.robot!.glow, ["pack"]);
  assert.equal(partAlive(e.robot!, "legL"), false);
});

test("Scale pack is the kill part", () => {
  const live = bootScale();
  assert.equal(live.parts.pack, 14);
  const world = scaleWorld({ x: 0, z: 0, robot: live });
  assert.ok(world.pack);
  poseScaleWalk(live, 1);
  assert.ok("hipL" in live.pose);
});
