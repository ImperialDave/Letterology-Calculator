---
name: glyphbound-ledgers
description: >
  The Glyphbound Doctrine — laws for building and editing Glyphbound
  side-scroller ledgers: Mario teach-then-mix, Prince of Persia
  read-then-commit, Metroid optional pockets. Load whenever creating,
  assembling, validating, or enhancing Glyphbound levels, chunks,
  Remainder stages 6–60, Studio maps, or ASCII tilemaps.
  Also /glyphbound-ledgers and /glyphbound-doctrine.
---

# Glyphbound Doctrine

ASCII `rows` are the collision map. `TILE=48`. Do not infer collision from art. Do not gate `P` on a letter or word the party does not have.

## Jump budget

- `c`/`s` clear **2 tiles** up, about **4 tiles** across with a run.
- `b` clears **1 tile** up.
- Pit **> 4** needs `T` `=` `_` `` ` `` `)` `g` or sluice. Pit **> 7** needs two assists.
- Spawn `@`, check `%`, gate `P`: floor within 2 tiles, never on `^` or `S`.

## RNG may / may not

| | May randomize | Must not |
|---|---|---|
| Mario | featured verb from the **unlock schedule**, mix partner, enemy from `ROLE_TIERS`, width 18–28 | skip teach; two combats with no rest (except late gauntlet); three toys in one room |
| Persia | phase/offset, pit 2–4, crumble 3–6 | laser on walkway floor (`FY-1` or `FY`); `S` as the only floor cell; commit with no landing in view |
| Metroid | optional loft/`$`/vent pocket; landmark deco from the district | secret on the only path to `P`; landmark-free 80-tile hall |

Unlock schedule: 6–14 `T - =` · 15–24 `\| / T` · 25–34 `` ` ) g `` · 35–44 `S` + prior · 45–59 two prior verbs, never three new.

District landmarks: fort `'` · coil/orbit/vault/spire `;` · canal `,` · remainder/abyss `?` · glacier `_`.

## Sentence

`land → teach → mix → combat → rest → gate`

- **Teach:** one featured killer/mover, solid landings both sides, no extra toy.
- **Mix:** featured + one known verb.
- **Combat:** one digit (two if width ≥ 22). Enemy is a moving block. `!` only in arena/frozen.
- **Rest:** `%` and `i`/`h`. No `S`/`^` underfoot.
- **Pocket:** loft that drops back to floor. Not required for BFS.

Tell before commit: laser visible off-phase; blink has a wait-spot on `#`; geyser replaces floor with `#` neighbors; saw hangs at `FY-2`.

## Authoring

Add a **pattern** in `src/glyphbound/patterns.ts` (ranges + painter), not a one-off 80-tile hallway. Name it after the verb. Run `npx tsx --test src/glyphbound/*.test.ts` and `npx vite build` before pushing.
