# Credits

Models in the Wild steppe are used under Creative Commons Zero. Attribution is not required. It is recorded here anyway.

| Piece | Author | Source | License | What we changed |
|---|---|---|---|---|
| Grass, trees, rocks, flowers, bushes, cliff blocks, bridge, path, log, stump, mushrooms, tent, column | Kenney | https://kenney.nl/assets/nature-kit | CC0-1.0 | Copied a whitelist of glTF files out of the 2020 zip. These meshes have no image; each part keeps its own color, so a trunk stays brown and a petal stays red. Each mesh is scaled in meters relative to a 1.8 m traveler. Grass and flowers sway. The bridge decks the river ford. |
| Walls, door, roof, banner, lantern, chimney, fence, gate, cart, stall, bench, fountain, hedge | Kenney | https://kenney.nl/assets/fantasy-town-kit | CC0-1.0 | Fantasy Town Kit 2.0. Houses and the scriptorium are kitbashed. Each mesh keeps the pack colormap at `Textures/colormap.png`. Radii stop Sable where she should not walk through. |
| Barrel, chest, crate, signpost, workbench, campfire | Kenney | https://kenney.nl/assets/survival-kit | CC0-1.0 | Survival Kit 2.0, file `kenney_survival-kit.zip`, including `Textures/colormap.png`. Scaled to meter heights. The signpost, the chest, and the cold shutter can be read with E. |
| Sable's body and her idle, walk, run, and jump | Kay Lousberg | https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0 | CC0-1.0 | `Mage.glb`. Scaled so the head is 1.8 m. Cloth stays the pack texture under the toon ramp. The Kenney block body is no longer used. |
| The stag | Quaternius | https://poly.pizza/m/tQdzbZ1Cmw | CC0-1.0 | `stag.glb`, scaled to about 1.7 m. Idle, walk, gallop, and a hit reaction come from the file. The gold numeral on the brow is ours and hides when the brand breaks. |
| Candles, torch, banner, tables, chair, shelf, bottles, coins, crates, barrel stack, pillar, gilt chest | Kay Lousberg | https://github.com/KayKit-Game-Assets/KayKit-Dungeon-Remastered-1.0 | CC0-1.0 | A handful of dungeon props, scaled into the steppe and run through the same toon ramp. |

Pinned download URLs live in `scripts/fetch-wild-assets.mjs`.

The serif is a painting made for this project. The scriptorium is a Kenney kitbash, and the First Spire is original stone, bronze, and gold geometry. Both are measured after they are assembled so the finished building, not each plank, is the thing sized against Sable.

Houses, the scriptorium, the spire, trees, standing stones, cliff blocks, the stag, and the dropped serif each have a round hitbox. Sable slides along them instead of passing through.
