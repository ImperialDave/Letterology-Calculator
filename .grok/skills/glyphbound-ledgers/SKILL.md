---
name: glyphbound-ledgers
description: >
  The Glyphbound Doctrine — laws for building and editing Glyphbound
  side-scroller ledgers: Mario teach-then-mix, Prince of Persia
  read-then-commit, Metroid optional pockets. Load whenever creating,
  assembling, validating, auditing, or enhancing Glyphbound levels, chunks,
  Remainder stages 6–60, Studio maps, or ASCII tilemaps.
  Also /glyphbound-ledgers, /glyphbound-doctrine, and /glyphbound-audit.
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

Unlock schedule: 6–14 `T - =` · 15–24 `\| / l z x` (bounce mix-only) · 25–34 `` ` ) g f { j `` · 35–44 `S` + hang toys · 45–59 two prior verbs, never three new. Wallpaper after teach is the unlocked *damage* toy, not a bounce hallway — and not a grate sidewalk. Leave fight porches.

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
- **Fight porch:** every digit stands on a **#** floor with **≥5 tiles** of clear walk (no `j w ^` underfoot, no hang toy at `fy-2`). Hazards are beats *between* packs, never a carpet on the porch. A 180-tile grate street is not density.
- **Rest:** `%` and `i`/`h`. No `S`/`^` underfoot.
- **Pocket:** loft that drops back to floor. Not required for BFS.

## Site — where each obstacle sits

`yf` is the local floor (`#` the player stands on). Walk is `yf-1`. Plant through `src/glyphbound/site.ts` `plantAt` — do not hang a floor toy or floor a hang toy. Never under `@ % P`. Never the only path to `P`. Fight porches stay `#`.

| Glyph | Row | Seat | Neighbors |
|---|---|---|---|
| `l` censer | `yf-2` | crest / hang | air at walk; air ±2 on the hang row (swing); `#` anvil at `yf` |
| `z` stamper | `yf-2` | hang over solid walk | air at `yf-1`; `#` anvil at `yf`; wait-spot `#` beside the ram or floor 2 below |
| `x` guillotine | `yf-2` | corridor / hang | air `x+1`,`x+2` on the hang row (blade); `#` mount at `x-1` |
| `S` saw | `yf-2` | hang over a gap or walk | air ±2 on the hang row (slide); never `yf-1` |
| `f` drop-cap | `yf-2` | hang, then falls 2 | air at `yf-1`; `#` at `yf` to land on |
| `d` rotor | `yf-2` | court (5+ flat) | air `x-1..x+1` at hang; air at `yf-3` and `yf-1` (vertical bar); `#` at `yf` |
| `j` grate | `yf` | 2-tile floor street | air above; `#` lips; never a 180 sidewalk; never a fight porch |
| `w` sinkink | `yf` | valley floor, 2 tiles | `#` lips both sides; air above |
| `~` sluice | `yf` | canal valley | like sinkink; mix-only |
| `}` shutter | `yf-1` | pass / door | three in a row so the all-open window exists; `#` at `yf` |
| `{` carriage | `yf-1` | bridge over a gap | gap of ≥3 at `yf`; `=` shelf at `yf-3` |
| `[` echo | `yf-1` or loft `yf-3` | pad | `#` under the plate, or `=` both sides on a loft |
| `\|` laser | `yf-3` and `yf-4` | loft / ceiling | never `yf` or `yf-1` |
| `^` spike | `yf+1` or 2-tile hop at `yf` | pit teeth, rare hop | never under `@ % P`; never a sidewalk of hops |
| `T` bounce | `yf-1` | pit assist | only over `.`/`^` gap; not a hallway |
| `-` crumble | `yf` | loft / short bridge | 3-tile run; `#` neighbors |
| `/` `\` belt | `yf` | slope | 2-tile run on a rise |
| `` ` `` lift | `yf-1` | valley / pit | gap or well; `#` wait-spot beside |
| `)` blink | `yf-1` | gap | `#` wait-spot beside |
| `g` geyser | `yf` | floor well | `#` neighbor (parse requires floorish) |
| `:` fan | `yf-1` | shaft | `#` at `yf`; air above |

Landform verbs pick the seat: hill → censer/stamper at the crest; valley → sink/grate/geyser on the floor; corridor → guillotine/shutter/laser in the gaps; bridge → carriage; court → rotor; pass → shutter window.

## Housing — if it moves, it has a home

Site is the **row**. Housing is the **container, mount, or recess** the motion needs. Retract into a socket. Pour into a basin. Hang from a beam. Slide on a rail. Rise in a shaft. Fire from an emitter. Do not leave a verb floating in air. `plantAt` / `houseAfter` in `src/glyphbound/site.ts` stamp these blocks. Never overwrite `@ % P` or a fight porch.

| Glyph | Motion | Housing |
|---|---|---|
| `^` | Teeth rise/fall | **Socket:** `#` directly below. Pit: `^` at `yf+1`, `#` at `yf+2`. Never replace walk-floor `#` with pulsing `^`. A 2-tile hop is a 2-tile **pit** (`.` at `yf`, teeth in the pit floor), not a sidewalk of floating nubs. |
| `~` `w` | Fluid | **Basin:** `#` lips both ends, `#` under the fluid. Valley only. Not a film on a sidewalk. |
| `l` | Swings on a chain | **Beam:** `=` or `#` at `yf-3` above the bowl. Anvil `#` at `yf`. |
| `z` | Ram slams down | **Press:** beam at `yf-3` + anvil at `yf`. Wait-spot beside. |
| `x` | Blade from a housing | **Jamb:** `#` at `x-1` on the hang row. Air `x+1..x+2`. |
| `S` | Slides ±2 tiles | **Rail:** `=` along the travel at hang y. |
| `f` | Falls 2, then floor | **Slot + landing:** beam/`=` at `yf-3`; `#` at `yf`. |
| `d` | H/V bar on a hub | **Axle:** plinth `&` or `#` at `yf` under the hub. Court air for the sweep. |
| `j` | Floor grate | **Inset:** `#` lips. Already. |
| `}` | Timed door | **Frame:** sill `#` at `yf`, lintel `=`/`#` at `yf-2`, three bars in the opening. |
| `{` | Rides ±3.5 tiles | **Track:** `=` for the full travel. Gap under. |
| `[` | Plate you step off | **Pad:** `#` under, or loft `=` both sides. |
| `\|` | Timed beam | **Emitter:** `#` at the top of the column. Never a naked line. Never `yf` / `yf-1`. |
| `T` | Spring | **Footing:** `#` under the pad or under the pit teeth. |
| `-` | Floor that fails | It **is** the floor. `#` neighbors. |
| `/` `\` | Belt | **Bed:** replaces `#` on a slope. |
| `` ` `` | Elevator | **Shaft:** `#` on at least one side; `#` wait-spot beside. |
| `)` | Phasing plat | **Socket:** `#` landings both ends of the gap. |
| `g` | Jet from the floor | **Vent inset:** `#` neighbors. |
| `:` | Updraft | **Shaft:** `#` walls, `#` at `yf`. |

Tell before commit: laser visible off-phase from its emitter; blink has a wait-spot on `#`; geyser is inset in `#`; saw rides a rail at `yf-2`; spikes retract into `#`.

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

Author through themed patterns, `fillDensity`, `dressTerrain`, or a frozen painter. Generated 6–29 must still look designed — do not freeze every room. Wallpaper calls `plantAt` so kit glyphs sit on the seat in **Site**.

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

## Audit — machine first, then the room

Grok does not eyeball 60 maps. Load this skill. Then:

1. **Machine.** `npx tsx src/glyphbound/audit-cli.ts` with a band (`hub`, `1-5`, `6-14`, `15-24`, `25-29`, `30-44`, `45-60`, `stage12`, or `all`). `--summary` is the rollup; omit it for snippets. Codes live in `src/glyphbound/audit.ts`. `validateLevel` is the path/fairness gate; the auditor adds **Housing**, **Site**, porch, reserved, Exchange. `fail` is a doctrine breach. `warn` is judgment.
2. **Player-sense.** For every `fail`, and for each featured toy on a flagged stage, read the ASCII snippet the CLI already prints. Internally: does Site + Housing hold. Externally: would a player see a press, a trough, a pit of teeth — or a glyph in the air. One sentence per finding: what the object is *in the room*.
3. **Bands.** `hub` · `1-5` · `6-14` · `15-24` · `25-29` · `30-44` · `45-60`. One band per pass. Workflow: `/glyphbound-audit` with `args.band`.
4. **Hands off.** Do not grow `STAGE_COUNT`. Do not rewrite Numberomicons by pasting ASCII. Exchange never foundry toys. Hub `[ { }` stay doors; hub `d f j w x` stay teachers. Fix through `plantAt` / `houseAfter` / the painter that owns the room. First Book: `levels-chapters.ts` / `levels-numberomicons.ts`. Remainder: patterns, density, remainder-hand.
5. **Verdict.** `fail` must fix. `warn` only if the player cannot read the commit. A legal room stays a legal room.

Trigger: `/glyphbound-audit`, "audit levels", "does this ledger make sense".

## Authoring

Add a **pattern** in `src/glyphbound/patterns.ts` (ranges + painter), not a one-off 80-tile hallway. Name it after the verb. Before a doctrine pass over existing rooms, run **Audit**. Run `npx tsx --test src/glyphbound/*.test.ts` and `npx vite build` before pushing.
