import assert from "node:assert/strict";
import test from "node:test";
import { bootGalley, bootScale, bootUnbound, GALLEY, SCALE, poseGalley, poseScaleWalk, robotWorld, scaleWorld } from "./robots";
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

test("Unbound wedge is the kill part and the hole sits in the chase", () => {
  const live = bootUnbound();
  assert.equal(live.parts.wedge, 16);
  const world = robotWorld({ x: 0, z: 0, robot: live });
  assert.ok(world.wedge);
  assert.ok(world.handL);
  assert.ok(world.handR.x > 10, `stick reach ${world.handR.x}`);
});

test("Kite orbit stays aloft and lists when a wing dies", () => {
  const s = createSortie({ missionId: "ice", biome: "ice" });
  s.wave = 99;
  s.flight = "allrange";
  s.speed = 0;
  s.x = 0;
  s.y = 48;
  s.z = 0;
  spawnEnemy(s, "mech", 0, 48, -140, { setPiece: true });
  const e = s.enemies.find((n) => n.setPiece)!;
  assert.equal(e.robot?.id, "kite");
  for (let i = 0; i < 30; i++) {
    s.x = 0;
    s.z = 0;
    s.speed = 0;
    stepSortie(s, emptyInput(), 1 / 60);
  }
  assert.ok(e.y > 30, `kite height ${e.y}`);
  e.robot!.parts.wingL = 0;
  e.robot!.tele = 0;
  e.robot!.hold = 0;
  stepSortie(s, emptyInput(), 1 / 60);
  assert.ok(e.robot!.state === "list" || e.robot!.state === "fallen", e.robot!.state);
  assert.deepEqual(e.robot!.glow, ["keel"]);
});

test("a posed Galley fist leaves the bind pose", () => {
  const live = bootGalley();
  const bind = robotWorld({ x: 0, z: 0, robot: live });
  live.pose.shR.rx = -1.1;
  live.pose.elR.rx = 0.5;
  const swung = robotWorld({ x: 0, z: 0, robot: live });
  const d = Math.hypot((swung.palmR?.x ?? 0) - (bind.palmR?.x ?? 0), (swung.palmR?.y ?? 0) - (bind.palmR?.y ?? 0), (swung.palmR?.z ?? 0) - (bind.palmR?.z ?? 0));
  assert.ok(d > 4, `fist should swing ${d}`);
});

test("Press Dualis is the Galley, not the old bar-walker", () => {
  const s = createSortie({ missionId: "press", biome: "press" });
  spawnEnemy(s, "dualis", 0, 24, -180, { setPiece: true });
  const e = s.enemies.find((n) => n.setPiece)!;
  assert.equal(e.robot?.id, "galley");
  assert.equal(GALLEY.parts.some((p) => p.id === "palmL"), true);
});

test("sky Dualis is still the flying bar", () => {
  const s = createSortie();
  spawnEnemy(s, "dualis", 0, 70, -180, { setPiece: true });
  const e = s.enemies.find((n) => n.kind === "dualis");
  assert.equal(e?.robot, undefined);
});

test("Galley stomp marks the ankles", () => {
  const live = bootGalley();
  live.state = "stomp";
  const st = GALLEY.states.stomp;
  assert.ok(st.vulnerable.includes("ankleL"));
  assert.equal(GALLEY.states.hunt.vulnerable.includes("ankleL"), false);
  poseGalley(live, 1);
  assert.ok("palmL" in live.pose);
});

test("both Galley palms enter open; hatch death is the Fool", () => {
  const s = createSortie({ missionId: "press", biome: "press" });
  s.wave = 99;
  s.flight = "allrange";
  spawnEnemy(s, "dualis", 0, 24, -120, { setPiece: true });
  const e = s.enemies.find((n) => n.setPiece)!;
  assert.equal(e.robot?.id, "galley");
  e.robot!.parts.palmL = 0;
  e.robot!.parts.palmR = 0;
  e.robot!.tele = 0;
  e.robot!.hold = 0;
  stepSortie(s, emptyInput(), 1 / 60);
  assert.ok(e.robot!.state === "open" || e.robot!.state === "vacuum" || e.robot!.state === "shock" || e.robot!.state === "hatchBeam" || e.robot!.state === "hands", e.robot!.state);
  e.robot!.parts.hatch = 0;
  e.robot!.tele = 0;
  e.robot!.hold = 0;
  stepSortie(s, emptyInput(), 1 / 60);
  assert.equal(e.robot!.state, "core");
  assert.deepEqual(e.robot!.glow, ["core"]);
});

test("Sorts set-piece mothership is Unbound, not a flying well", () => {
  const s = createSortie({ missionId: "sorts", biome: "sorts" });
  spawnEnemy(s, "mothership", 0, 8, -140, { setPiece: true });
  const e = s.enemies.find((n) => n.setPiece)!;
  assert.equal(e.robot?.id, "unbound");
});

test("Gutter mothership is still a flying press", () => {
  const s = createSortie({ missionId: "gutter", biome: "gutter" });
  spawnEnemy(s, "mothership", 0, 8, -140, { setPiece: true });
  const e = s.enemies.find((n) => n.setPiece)!;
  assert.equal(e.robot, undefined);
});
