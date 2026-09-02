import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { PAINTS, fillTex } from "../src/glyphbound/sortie/tex-paint";

const dir = join(dirname(fileURLToPath(import.meta.url)), "../public/glyphbound/sortie/tex");
mkdirSync(dir, { recursive: true });

const n = 64;
for (const [name, paint] of Object.entries(PAINTS)) {
  const buf = Buffer.from(fillTex(n, paint).buffer);
  const png = await sharp(buf, { raw: { width: n, height: n, channels: 4 } }).png().toBuffer();
  writeFileSync(join(dir, `${name}.png`), png);
  console.log(name, png.length);
}
