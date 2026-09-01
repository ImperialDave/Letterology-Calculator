import assert from "node:assert/strict";
import test from "node:test";
import { grid } from "./levels-story";
import { plantAt, seatAt, at, houseAfter } from "./site";
import { localFloorY } from "./levels-story";
import { validateLevel } from "./validate-level";

function room() {
  const g = grid(24, 12, 8);
  g.put(2, 7, "@");
  g.put(21, 7, "P");
  return g;
}

test("stamper hangs two above an anvil with a wait-spot", () => {
  const g = room();
  assert.equal(plantAt(g, 10, "z"), true);
  const yf = localFloorY(g, 10);
  assert.equal(at(g, 10, yf - 2), "z");
  assert.equal(at(g, 10, yf - 1), ".");
  assert.equal(at(g, 10, yf), "#");
  const issues = validateLevel([...g]).filter((i) => i.code === "wait-spot");
  assert.equal(issues.length, 0);
});

test("laser never sits on the walk", () => {
  const g = room();
  assert.equal(plantAt(g, 12, "|"), true);
  const yf = localFloorY(g, 12);
  assert.notEqual(at(g, 12, yf), "|");
  assert.notEqual(at(g, 12, yf - 1), "|");
  assert.equal(at(g, 12, yf - 3), "|");
});

test("grate is a floor street with lips, not a hang", () => {
  const g = room();
  assert.equal(plantAt(g, 10, "j"), true);
  const yf = localFloorY(g, 10);
  assert.equal(at(g, 10, yf), "j");
  assert.equal(at(g, 11, yf), "j");
  assert.notEqual(at(g, 10, yf - 2), "j");
});

test("shutter is a walk door of three bars", () => {
  const g = room();
  assert.equal(plantAt(g, 10, "}"), true);
  const yf = localFloorY(g, 10);
  assert.equal(at(g, 10, yf - 1), "}");
  assert.equal(at(g, 11, yf - 1), "}");
  assert.equal(at(g, 12, yf - 1), "}");
});

test("rotor needs a 3-wide hang court", () => {
  const g = room();
  assert.equal(plantAt(g, 12, "d"), true);
  const yf = localFloorY(g, 12);
  assert.equal(at(g, 12, yf - 2), "d");
  assert.equal(at(g, 11, yf - 2), ".");
  assert.equal(at(g, 13, yf - 2), ".");
  assert.equal(at(g, 12, yf - 1), ".");
});

test("guillotine needs two air tiles to the right", () => {
  const g = room();
  assert.equal(plantAt(g, 10, "x"), true);
  const yf = localFloorY(g, 10);
  assert.equal(at(g, 10, yf - 2), "x");
  assert.equal(at(g, 11, yf - 2), ".");
  assert.equal(at(g, 12, yf - 2), ".");
});

test("plant refuses spawn and gate columns", () => {
  const g = room();
  assert.equal(plantAt(g, 2, "z"), false);
  assert.equal(plantAt(g, 21, "j"), false);
});

test("stamper and censer hang from a beam", () => {
  const g = room();
  assert.equal(plantAt(g, 10, "z"), true);
  const yf = localFloorY(g, 10);
  assert.ok(at(g, 10, yf - 3) === "=" || at(g, 10, yf - 3) === "#");
  assert.equal(plantAt(g, 14, "l"), true);
  const y2 = localFloorY(g, 14);
  assert.ok(at(g, 14, y2 - 3) === "=" || at(g, 14, y2 - 3) === "#");
});

test("laser has an emitter above the column", () => {
  const g = room();
  assert.equal(plantAt(g, 12, "|"), true);
  const yf = localFloorY(g, 12);
  assert.equal(at(g, 12, yf - 5), "#");
});

test("spike hop is a pit with a socket, not teeth replacing the floor", () => {
  const g = room();
  assert.equal(plantAt(g, 10, "^"), true);
  assert.equal(at(g, 10, 8), ".");
  assert.equal(at(g, 10, 9), "^");
  assert.equal(at(g, 10, 10), "#");
});

test("sinkink sits in a basin with lips and a floor", () => {
  const g = room();
  assert.equal(plantAt(g, 10, "w"), true);
  const yf = localFloorY(g, 10);
  assert.equal(at(g, 10, yf), "w");
  assert.equal(at(g, 9, yf), "#");
  assert.equal(at(g, 12, yf), "#");
  assert.equal(at(g, 10, yf + 1), "#");
});

test("houseAfter sockets a naked spike without moving spawn", () => {
  const g = room();
  g.put(10, 8, "^");
  houseAfter(g);
  assert.equal(at(g, 2, 7), "@");
  assert.equal(at(g, 10, 8), ".");
  assert.equal(at(g, 10, 9), "^");
  assert.equal(at(g, 10, 10), "#");
});

test("houseAfter strips a bounce on solid walk", () => {
  const g = room();
  g.put(10, 7, "T");
  houseAfter(g);
  assert.notEqual(at(g, 10, 7), "T");
});

test("houseAfter puts an emitter above a loft laser", () => {
  const g = room();
  g.put(12, 5, "|");
  g.put(12, 6, "|");
  houseAfter(g);
  assert.equal(at(g, 12, 4), "#");
});

test("bounce only in a gap, carriage only over a gap", () => {
  const g = room();
  assert.equal(plantAt(g, 10, "T"), false);
  assert.equal(plantAt(g, 10, "{"), false);
  g.put(10, 8, "^");
  g.put(11, 8, "^");
  g.put(12, 8, "^");
  assert.equal(plantAt(g, 10, "T"), true);
  assert.ok(seatAt(g, 10) === "gap" || seatAt(g, 10) === "pit");
});
