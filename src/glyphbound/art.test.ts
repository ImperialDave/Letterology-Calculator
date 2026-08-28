import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ART_MANIFEST, loopOffset } from "./art";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

test("every manifest art file exists on disk", () => {
  for (const e of ART_MANIFEST) {
    const p = join(root, "public/glyphbound", e.kind, `${e.name}.png`);
    assert.equal(existsSync(p), true, p);
  }
});

test("loopOffset repeats a strip at one width", () => {
  const w = 1280;
  const a = loopOffset(100, 0.28, w);
  const b = loopOffset(100 + w / 0.28, 0.28, w);
  assert.ok(Math.abs(a - b) < 0.001, `${a} vs ${b}`);
  assert.ok(loopOffset(0, 0.1, w) <= 0);
});
