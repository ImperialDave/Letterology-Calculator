import assert from "node:assert/strict";
import test from "node:test";
import { grid, localFloorY, type Grid } from "./levels-story";
import { validateLevel } from "./validate-level";
import {
  armTeethAlongPath,
  carveSpine,
  composeSpine,
  flatSpine,
  hill,
  landformFromSeed,
  padEnds,
  putWalk,
  realizeLandform,
  valley,
} from "./sculpt";

test("hill and valley still path from spawn to gate", () => {
  const W = 40;
  const H = 16;
  const fy = 11;
  const g = grid(W, H, fy) as Grid;
  const spine = flatSpine(W, fy);
  padEnds(spine, fy, 6);
  hill(spine, 8, 10, 2, fy);
  valley(spine, 20, 8, 2, fy);
  carveSpine(g, spine);
  putWalk(g, spine, 2, "@");
  putWalk(g, spine, W - 4, "P");
  armTeethAlongPath(g, spine);
  const issues = validateLevel([...g]).filter((i) =>
    ["path", "buried", "hang", "spawn", "pit", "pit-wide"].includes(i.code),
  );
  assert.equal(issues.map((i) => i.message).join("; "), "");
  assert.ok(spine[12] < fy, "crest rises");
  assert.ok(spine[24] > fy, "valley drops");
});

test("composeSpine is not a flat runway", () => {
  const W = 80;
  const fy = 11;
  const spine = composeSpine(W, fy, 16, landformFromSeed(W, 42));
  const heights = new Set(spine.slice(8, W - 8));
  assert.ok(heights.size >= 3, `heights ${[...heights].join(",")}`);
});

test("bindSpine rides plants onto the local floor", () => {
  const W = 40;
  const H = 16;
  const fy = 11;
  const g = grid(W, H, fy) as Grid;
  const spine = composeSpine(W, fy, H, [{ t: "hill", at: 10, w: 12, h: 2 }]);
  realizeLandform(g, [{ t: "hill", at: 10, w: 12, h: 2 }]);
  g.put(16, fy - 1, "@");
  const y = localFloorY([...g], 16);
  assert.equal(g[y - 1]?.[16], "@");
  assert.ok((g.spine?.[16] ?? fy) <= fy);
});
