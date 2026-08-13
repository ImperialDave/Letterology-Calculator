import assert from "node:assert/strict";
import test from "node:test";
import { compareNames } from "./compatibility";
import {
  circularW1,
  hopDistance,
  jsSimilarity,
  pairGeometry,
  resonanceOf,
  sinkhornCost,
} from "./geometry";
import { buildHoroscope } from "./engine";

test("official allies sit one hop and high resonance", () => {
  assert.equal(hopDistance("L", "O"), 1);
  assert.ok(resonanceOf("L", "O") >= 84, String(resonanceOf("L", "O")));
});

test("official enemies sit a low resonance even if a long ally-path exists", () => {
  assert.ok(resonanceOf("A", "B") <= 40, String(resonanceOf("A", "B")));
  assert.ok(hopDistance("A", "B") >= 2);
});

test("a letter resonates perfectly with itself", () => {
  assert.equal(hopDistance("G", "G"), 0);
  assert.equal(resonanceOf("G", "G"), 100);
});

test("resonance is symmetric", () => {
  for (const [a, b] of [
    ["A", "J"],
    ["C", "P"],
    ["Z", "M"],
  ] as const) {
    assert.equal(resonanceOf(a, b), resonanceOf(b, a));
    assert.equal(hopDistance(a, b), hopDistance(b, a));
  }
});

test("identical masses have zero circular distance and JS = 1", () => {
  const p = [2, 0, 1, 0, 3, ...Array.from({ length: 21 }, () => 0)];
  assert.equal(circularW1(p, p), 0);
  assert.ok(jsSimilarity(p, p) > 0.99);
  assert.ok(sinkhornCost(p, p) < 0.08);
});

test("pair geometry is defined and in range", () => {
  const a = buildHoroscope("Ada Lovelace");
  const b = buildHoroscope("Octavia");
  assert.ok(a && b);
  const geo = pairGeometry(a, b);
  assert.equal(geo.hops.house, hopDistance(a.signature, b.signature));
  assert.ok(geo.transport >= 0 && geo.transport <= 100);
  assert.ok(geo.overlapJS >= 0 && geo.overlapJS <= 100);
  assert.ok(geo.circleFit >= 0 && geo.circleFit <= 100);
});

test("geometry splits affinities that the old four buckets would tie", () => {
  const pairs: [string, string][] = [
    ["@lovelace", "@octavia"],
    ["@lovelace", "@ada"],
    ["Zora", "Baldwin"],
    ["Mina", "Jonathan"],
    ["@ripley", "@ash"],
    ["Sam", "Frodo"],
    ["Ada", "Diana"],
    ["Nero", "Orpheus"],
  ];
  const affinities = pairs.map(([x, y]) => {
    const bond = compareNames(x, y);
    assert.ok(bond);
    return bond.affinity;
  });
  assert.ok(new Set(affinities).size >= 6, `affinities ${affinities.join(",")}`);
});
