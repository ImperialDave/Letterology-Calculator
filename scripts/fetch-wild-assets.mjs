import { createWriteStream, mkdirSync } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const exec = promisify(execFile);
const root = path.resolve(import.meta.dirname, "..");
const cache = path.join(root, ".cache/wild-zips");
const out = path.join(root, "public/wild/vendor");

const packs = [
  {
    id: "kenney-nature",
    url: "https://kenney.nl/media/pages/assets/nature-kit/37ac38a37b-1677698939/kenney_nature-kit.zip",
    license: "CC0-1.0",
    glbDir: "Models/GLTF format",
    files: ["grass.glb", "grass_large.glb", "tree_oak.glb", "tree_default.glb", "rock_largeA.glb", "rock_smallA.glb", "flower_yellowA.glb", "cliff_rock.glb", "cliff_large_rock.glb", "plant_bush.glb", "plant_bushLarge.glb"],
  },
  {
    id: "kenney-town",
    url: "https://kenney.nl/media/pages/assets/fantasy-town-kit/efe948d309-1754222374/kenney_fantasy-town-kit_2.0.zip",
    license: "CC0-1.0",
    glbDir: "Models/GLB format",
    files: ["wall.glb", "wall-door.glb", "roof-gable.glb", "roof-gable-top.glb", "banner-green.glb", "lantern.glb", "chimney.glb"],
  },
  {
    id: "kenney-characters",
    url: "https://kenney.nl/media/pages/assets/blocky-characters/8369c0cf30-1749547469/kenney_blocky-characters_20.zip",
    license: "CC0-1.0",
    glbDir: "Models/GLB format",
    files: ["character-a.glb"],
  },
];

mkdirSync(cache, { recursive: true });

for (const pack of packs) {
  if (pack.license !== "CC0-1.0") throw new Error(`refusing ${pack.id}: ${pack.license}`);
  const zip = path.join(cache, `${pack.id}.zip`);
  const res = await fetch(pack.url);
  if (!res.ok || !res.body) throw new Error(`${pack.id} download ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(zip));
  const dest = path.join(out, pack.id);
  mkdirSync(dest, { recursive: true });
  for (const file of pack.files) {
    await exec("unzip", ["-p", zip, `${pack.glbDir}/${file}`], {
      encoding: "buffer",
      maxBuffer: 20_000_000,
    }).then(async ({ stdout }) => {
      const { writeFile } = await import("node:fs/promises");
      await writeFile(path.join(dest, file), stdout);
    });
  }
  console.log(pack.id, pack.files.length);
}
