# Credits

Models in the Wild steppe are used under Creative Commons Zero. Attribution is not required. It is recorded here anyway.

| Piece | Author | Source | License | What we changed |
|---|---|---|---|---|
| Grass, trees, rocks, flowers, bushes, cliff blocks, bridge, path, log, stump, mushrooms, tent, column | Kenney | https://kenney.nl/assets/nature-kit | CC0-1.0 | Copied a whitelist of glTF files out of the 2020 zip. Each mesh is scaled in meters relative to a 1.8 m traveler. Grass and flowers sway. The bridge decks the river ford. |
| Walls, door, roof, banner, lantern, chimney, fence, gate, cart, stall, bench, fountain, hedge | Kenney | https://kenney.nl/assets/fantasy-town-kit | CC0-1.0 | Fantasy Town Kit 2.0. Houses and the scriptorium are kitbashed. The yard props are single meshes, recolored, and given radii where you should not walk through them. |
| Barrel, chest, crate, signpost, workbench, campfire | Kenney | https://kenney.nl/assets/survival-kit | CC0-1.0 | Survival Kit 2.0, file `kenney_survival-kit.zip`. Scaled to meter heights. The signpost, the chest, and the cold shutter can be read with E. |
| Sable's body and her idle, walk, run, and jump | Kay Lousberg | https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0 | CC0-1.0 | `Mage.glb`. Scaled so the head is 1.8 m. Cloth stays the pack texture under the toon ramp. The Kenney block body is no longer used. |

Pinned download URLs live in `scripts/fetch-wild-assets.mjs`.

The serif and the stag are paintings made for this project. The scriptorium is a Kenney kitbash, and the First Spire is original stone, bronze, and gold geometry. Both are measured after they are assembled so the finished building, not each plank, is the thing sized against Sable. The glowing numeral on the stag is ours: it is parented above the stag and removed when the brand breaks. No second animal mesh.

Houses, the scriptorium, the spire, trees, standing stones, cliff blocks, the stag, and the dropped serif each have a round hitbox. Sable slides along them instead of passing through.
