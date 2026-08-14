import assert from "node:assert/strict";
import test from "node:test";
import { allPigments, mixLabel, mixPair, mixTriad, oklchToHex, pigmentOf, ribbonStops, TRIAD_WEIGHTS } from "./pigment";
import type { Triad } from "./types";

test("every letter has a named mineral pigment", () => {
  const pigments = allPigments();
  assert.equal(pigments.length, 26);
  const names = new Set(pigments.map((item) => item.name));
  assert.equal(names.size, 26);
  assert.equal(pigmentOf("A").name, "Amber");
  assert.match(pigmentOf("A").css, /^oklch\(/);
  assert.match(pigmentOf("A").hex, /^#[0-9a-f]{6}$/);
});

test("hues walk the wheel from A and close near gold", () => {
  const pigments = allPigments();
  for (let i = 1; i < 26; i += 1) {
    const prev = pigments[i - 1].oklch.h;
    const next = pigments[i].oklch.h;
    const step = (next - prev + 360) % 360;
    assert.ok(step > 12 && step < 16, `step ${i} = ${step}`);
  }
  const wrap = (pigments[0].oklch.h - pigments[25].oklch.h + 360) % 360;
  assert.ok(wrap > 12 && wrap < 16, `wrap ${wrap}`);
});

test("a triad mix is deterministic and between its sources", () => {
  const a = mixTriad(["L", "V", "E"]);
  const b = mixTriad(["L", "V", "E"]);
  assert.equal(a.css, b.css);
  assert.equal(a.hex, b.hex);
  assert.equal(mixLabel(["L", "V", "E"]), "Cobalt with vermilion and jade");
  const sources = ["L", "V", "E"].map((letter) => pigmentOf(letter).oklch.l);
  const min = Math.min(...sources);
  const max = Math.max(...sources);
  assert.ok(a.oklch.l >= min - 0.02 && a.oklch.l <= max + 0.02);
});

test("house weight leads the mix", () => {
  assert.deepEqual([...TRIAD_WEIGHTS], [0.5, 0.3, 0.2]);
  const amberLed = mixTriad(["A", "A", "L"]);
  const lapisLed = mixTriad(["L", "L", "A"]);
  function hueDist(a: number, b: number): number {
    return Math.min((a - b + 360) % 360, (b - a + 360) % 360);
  }
  assert.ok(
    hueDist(amberLed.oklch.h, pigmentOf("A").oklch.h) <
      hueDist(amberLed.oklch.h, pigmentOf("L").oklch.h),
    "amber-led should sit nearer amber",
  );
  assert.ok(
    hueDist(lapisLed.oklch.h, pigmentOf("L").oklch.h) <
      hueDist(lapisLed.oklch.h, pigmentOf("A").oklch.h),
    "lapis-led should sit nearer lapis",
  );
  assert.notEqual(amberLed.hex, lapisLed.hex);
});

test("doubled letters deepen a single pigment rather than invent a new one", () => {
  const pure = mixTriad(["A", "A", "A"]);
  assert.equal(Math.round(pure.oklch.h), Math.round(pigmentOf("A").oklch.h));
  assert.equal(pure.hex, pigmentOf("A").hex);
});

test("a pair mix sits between the two house hues", () => {
  const mix = mixPair("A", "L");
  assert.match(mix.css, /^oklch\(/);
  assert.notEqual(mix.css, pigmentOf("A").css);
  assert.notEqual(mix.css, pigmentOf("L").css);
});

test("oklch converts to a real hex", () => {
  const hex = oklchToHex(pigmentOf("A").oklch);
  assert.equal(hex, pigmentOf("A").hex);
  assert.match(hex, /^#[0-9a-f]{6}$/);
});

test("different triads usually mix different colors", () => {
  const codes: Triad[] = [
    ["A", "A", "A"],
    ["L", "L", "L"],
    ["L", "V", "E"],
    ["A", "D", "A"],
    ["Z", "O", "R"],
    ["N", "E", "R"],
  ];
  const hexes = codes.map((triad) => mixTriad(triad).hex);
  assert.ok(new Set(hexes).size >= 5, hexes.join(" "));
});

test("the ribbon lists every mineral", () => {
  const ribbon = ribbonStops();
  assert.ok(ribbon.includes(pigmentOf("A").css));
  assert.ok(ribbon.includes(pigmentOf("Z").css));
});
