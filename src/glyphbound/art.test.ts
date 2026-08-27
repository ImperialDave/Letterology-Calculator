import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ART_MANIFEST } from "./art";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

test("every manifest art file exists on disk", () => {
  for (const e of ART_MANIFEST) {
    const p = join(root, "public/glyphbound", e.kind, `${e.name}.png`);
    assert.equal(existsSync(p), true, p);
  }
});
