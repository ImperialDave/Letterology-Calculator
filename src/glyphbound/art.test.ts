import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
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

test("fx sheet cells have no magenta frame on the outer 2px", () => {
  const fxDir = join(root, "public/glyphbound/fx");
  const grids = Object.fromEntries(
    ART_MANIFEST.filter((e) => e.kind === "fx").map((e) => [e.name, { cols: e.cols ?? 2, rows: e.rows ?? 2 }]),
  );
  const py = `
from PIL import Image
from pathlib import Path
import json
root = Path(${JSON.stringify(fxDir)})
grids = json.loads(${JSON.stringify(JSON.stringify(grids))})
fail = []
for path in sorted(root.glob("*.png")):
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    g = grids.get(path.stem, {"cols": 2, "rows": 2})
    cols, rows = int(g["cols"]), int(g["rows"])
    cw, ch = w // cols, h // rows
    px = im.load()
    for r in range(rows):
        for c in range(cols):
            x0, y0 = c * cw, r * ch
            for y in (y0, y0 + 1, y0 + ch - 2, y0 + ch - 1):
                for x in range(x0, x0 + cw):
                    R, G, B, a = px[x, y]
                    if a > 40 and R > 160 and B > 80 and G < 90:
                        fail.append(path.name)
print(",".join(sorted(set(fail))))
`;
  const out = execFileSync("python3", ["-c", py], { encoding: "utf8" }).trim();
  assert.equal(out, "", out);
});

test("loopOffset repeats a strip at one width", () => {
  const w = 1280;
  const a = loopOffset(100, 0.28, w);
  const b = loopOffset(100 + w / 0.28, 0.28, w);
  assert.ok(Math.abs(a - b) < 0.001, `${a} vs ${b}`);
  assert.ok(loopOffset(0, 0.1, w) <= 0);
});
