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

ASCII `rows` are the collision map. `TILE=48`. Do not infer collision from art. Parallax plates (`public/glyphbound/bg/`) are scenery only — never platforms, pits, or gates. Do not gate `P` on a letter or word the party does not have.

## Jump budget

- `c`/`s` clear **2 tiles** up, about **4 tiles** across with a run.
- `b` clears **1 tile** up.
- Pit **> 4** needs `T` `=` `_` `` ` `` `)` `g` or sluice. Pit **> 7** needs two assists.
- Spawn `@`, check `%`, gate `P`: floor within 2 tiles, never on `^` or `S`. Gate `P` stands on the walkway the player walks, with a clear pad and a jump-budget path from spawn — never in the basement slab, never behind a crate wall or 4-tile pit.

## RNG may / may not

| | May randomize | Must not |
|---|---|---|
| Mario | featured verb from the **unlock schedule**, mix partner, enemy from `ROLE_TIERS`, width 18–28 (Remainder beats 24–30) | skip teach; two combats with no rest (except Remainder 45–60 after a check); three *new* toys in one room |
| Persia | phase/offset, pit 2–4, crumble 3–6 | laser on walkway floor (`FY-1` or `FY`); `S` as the only floor cell; commit with no landing in view |
| Metroid | optional loft/`$`/vent pocket; landmark deco from the district | secret on the only path to `P`; landmark-free 80-tile hall |

Unlock schedule: 6–14 `T - =` · 15–24 `\| / T` · 25–34 `` ` ) g `` · 35–44 `S` + prior · 45–59 two prior verbs, never three new.

Foundry toys (off-hub only; hub `[ { }` stay doors, hub `d f j w x` stay teachers): `l` censer · `z` stamper · `x` guillotine · `f` drop-cap · `j` ember grate · `d` rotor · `w` sinkink · `}` shutter · `{` carriage · `[` echo plate.

Toy unlock: Fort `z` · Gutter `w` · Coil `x` · Ledger `}` · Foundry `l` · Fourfold `f` · Ligature `{` · Ampersand `[` · Iris `d` · Scriptorium `j`. Teach one, mix one known, never three new, never under `@ % P`, never the only path to `P`. Periods live in `src/glyphbound/toys.ts`.

District landmarks: street `"` · fort `'` · coil/orbit/vault/spire `;` · canal `,` · remainder/abyss `?` · glacier `_`.

## Sentence

`land → teach → mix → combat → rest → gate`

- **Teach:** one featured killer/mover, solid landings both sides, no extra *new* toy.
- **Mix:** featured + one known verb.
- **Combat (6–14):** one digit (two if width ≥ 22). Enemy is a moving block. Density may add more digits as moving blocks, not new toys.
- **Combat (15–19):** same sentence; two digits on wider rooms.
- **Combat (20–29):** **two packs** with rest between (same grammar as 30–60). Still never three *new* toys.
- **Combat (Remainder 30–60):** a **pack of 3–5** digits; **two packs** per stage with rest between. `!` only in arena/frozen bosses.
- **Rest:** `%` and `i`/`h`. No `S`/`^` underfoot.
- **Pocket:** loft that drops back to floor. Not required for BFS.

Tell before commit: laser visible off-phase; blink has a wait-spot on `#`; geyser replaces floor with `#` neighbors; saw hangs at `FY-2`.

## Basement

Rows below the main floor are **ground or lethal wells**, never a hallway. `grid()` packs `fy+1 … H-2` with `#`. `armTeeth` then:

- Under solid floor: keep the slab (`#`).
- Under a pit: teeth `^` at `fy+1` (canal may use `~`); deeper empty cells stay `#` or `^`.
- No walkable `.` run along `H-2` from spawn-x to gate-x.

Optional Metroid undercroft is a short pocket (≤6 tiles) with a vent from above — never a skip.

Hazard hits (spike, laser, saw, sluice) deal **2** (`HAZARD_DAMAGE`) on touch. **Shield soaks first** (2 points per hit, same as HP); leftover after the shield is gone goes to HP. Cooldown **0.5s** (`HAZARD_COOLDOWN`). Digit contact stays 1. Walking the floor still ignores teeth packed in the slab underneath.

## Remainder density (6–29)

Early Remainder ramps into the late-game floors. Teach still one featured verb. Extra digits are moving blocks, not new toys. Never plant a verb before its unlock band (`6–14` `T - =` · `15–24` `| / T` · `25–34` `` ` ) g `` · `S` from 35).

Floors for width `W` (see `src/glyphbound/density.ts`):

| Band | Enemies | Hazards | Movers | Landmarks | Loft tiles | Pickups |
|---|---|---|---|---|---|---|
| **6–14** | `max(4, W/18)` (boss `max(3, W/24)` plus `!`) | `max(6, W/14)` pits, hops, lasers off walkway | `max(4, W/20)` `T` `-` `=` only | `max(8, W/12)` | `max(16, W/6)` across **at least two** y-levels | `max(3, W/28)` |
| **15–24** | `max(6, W/14)` | `max(8, W/12)` + lasers off walkway; canal may mix sluice | `max(6, W/16)` add `\|` `/` | `max(10, W/10)` | `max(24, W/4)` | `max(3, W/26)` |
| **25–29** | `max(8, W/12)` | `max(10, W/10)` | `max(8, W/14)` add `` ` ) g `` | `max(12, W/8)` | `max(28, W/4)` | `max(4, W/24)` |

Author through themed patterns, `fillDensity`, `dressTerrain`, or a frozen painter. Generated 6–29 must still look designed — do not freeze every room.

`dressTerrain` may stamp extra loft streets, 2-tile hops, crumble, and district deco from the unlock band. It must not skip teach, must not plant three new toys, must not sit on `@ % P`, must not gate `P`. Hard/Extreme `padTerrain` adds more streets and teeth on a clone; Easy keeps the dressed baseline. Exchange is never dressed.

## Remainder density (30–60)

Late ledgers are **crowded rooms**, not empty halls. Teach still one featured verb; the rest of the stage repeats known verbs, enemy packs, traps, lofts, and district deco. Do not ship a 70-tile hall with one `1`.

Floors for width `W` (see `src/glyphbound/density.ts`):

| Kind | Minimum |
|---|---|
| Enemies (`0-9A-Y`) | `max(10, W/10)` non-boss; bosses `max(5, W/18)` plus `!` |
| Obstacles (spikes, lasers, saws, sluice) | `max(12, W/8)` — spikes in pits (`fy+1`) or 2-tile floor hops, never under `@ % P`. At most two of `^ | S ~` until n>45. `S` from 31 (one glimpse), uncapped mix from 46. |
| Movers (bounce, crumble, belts, lift, blink, geyser, fan) | `max(8, W/12)` — reuse known verbs; never three *new* toys in one room |
| Landmarks (`' ; " , ?`) | `max(12, W/8)` |
| Loft tiles (`= _ * &`) | `max(32, W/3)` across **at least two** y-levels |
| Ink / heart / extra | `max(4, W/24)` pickups |

Spikes live in toothed pits or as 2-tile jumps. Lasers off the walkway. Saws at `FY-2`. Two combat packs with rest between (gauntlet 45–60 may stack after a check). Author through denser patterns, `fillDensity`, or a frozen painter that already meets the floors.

## Authoring

Add a **pattern** in `src/glyphbound/patterns.ts` (ranges + painter), not a one-off 80-tile hallway. Name it after the verb. Run `npx tsx --test src/glyphbound/*.test.ts` and `npx vite build` before pushing.
