import assert from "node:assert/strict";
import test from "node:test";
import { cloneLevel, deleteSelection, duplicateSelection, levelProblems, moveSelection, STEPPE, yawSelection } from "./level";
import { HERDER, HOUSES, SPIRE } from "./layout";

test("the checked-in steppe is a complete level", () => {
  assert.deepEqual(levelProblems(STEPPE), []);
  assert.equal(STEPPE.props.find((prop) => prop.id === "fountain")?.x, 6.5);
  assert.equal(SPIRE.x, 112);
  assert.equal(HOUSES[0].x, 11.5);
  assert.equal(HERDER.z, 12.84);
});

test("moving a prop snaps and does not change the live steppe", () => {
  const moved = moveSelection(cloneLevel(STEPPE), { kind: "prop", id: "fountain" }, 10.2, 14.4, 0.5);
  assert.equal(moved.props.find((prop) => prop.id === "fountain")?.x, 10);
  assert.equal(moved.props.find((prop) => prop.id === "fountain")?.z, 14.5);
  assert.equal(STEPPE.props.find((prop) => prop.id === "fountain")?.x, 6.5);
});

test("actors cannot be deleted, and a copy gets a new id", () => {
  const kept = deleteSelection(STEPPE, { kind: "actor", id: "spire" });
  assert.equal(kept.actors.spire.x, 112);
  const copied = duplicateSelection(STEPPE, { kind: "prop", id: "barrel" });
  assert.ok(copied);
  assert.notEqual(copied.level.props.filter((prop) => prop.file === "barrel").length, 1);
  assert.equal(levelProblems(copied.level).length, 0);
});

test("yaw edits the selected prop only", () => {
  const turned = yawSelection(cloneLevel(STEPPE), { kind: "prop", id: "cart" }, 1.2);
  assert.equal(turned.props.find((prop) => prop.id === "cart")?.yaw, 1.2);
  assert.equal(STEPPE.props.find((prop) => prop.id === "cart")?.yaw, 0.6);
});
