#!/usr/bin/env python3
"""Emit src/glyphbound/century-catalog.ts — 100 unique Second Century specs."""
from pathlib import Path

THEMES = ["fort", "canal", "coil", "vault", "abyss", "spire", "orbit", "glacier", "remainder", "street"]
FEATURED = ["z", "l", "x", "f", "d", "w", "j", "{", "[", "}", "S", "`", "g", ")", "|", "/", "T", "-", "=", "l"]
MIX_OF = {
    "z": ["l", "x", "f"],
    "l": ["z", "x", "T"],
    "x": ["l", "}", "|"],
    "f": ["z", "l", "`"],
    "d": ["}", "[", "x"],
    "w": ["j", "g", "T"],
    "j": ["w", "g", "-"],
    "{": ["`", ")", "["],
    "[": ["}", "d", "="],
    "}": ["x", "d", "["],
    "S": ["`", ")", "|"],
    "`": [")", "g", "T"],
    "g": ["w", "`", "j"],
    ")": ["`", "T", "S"],
    "|": ["/", "=", "x"],
    "/": ["T", "-", "|"],
    "T": ["-", "=", "/"],
    "-": ["T", "=", "`"],
    "=": ["|", "-", "T"],
}
CANAL_MIX = {"w": "j", "j": "w", "g": "w", "{": "g", "T": "w"}
SETPIECES = [
    "colonnade",
    "zipper",
    "terrace",
    "ice",
    "ribs",
    "torches",
    "dual-loft",
    "vent",
    "switchback",
    "court",
]
SILHOUETTES = [
    "hill-valley",
    "valley-hill",
    "twin-hills",
    "ridge-pass",
    "canal-bridge",
    "court-pass",
    "pit-chain",
    "loft-street",
    "saw-rail",
    "shutter-gallery",
    "echo-lofts",
    "carriage-canyon",
    "laser-nave",
    "geyser-row",
    "rotor-court",
    "ice-shelf",
    "rib-climb",
    "mixed-sentence",
    "pass-court-pass",
    "well-loft-well",
]

TOY_NOUN = {
    "z": "Press", "l": "Censer", "x": "Guillotine", "f": "Drop-Cap", "d": "Rotor",
    "w": "Basin", "j": "Grate", "{": "Carriage", "[": "Echo", "}": "Shutter",
    "S": "Saw", "`": "Lift", "g": "Geyser", ")": "Blink", "|": "Laser",
    "/": "Belt", "T": "Bounce", "-": "Crumble", "=": "Loft",
}
PLACE = {
    "fort": ["Forge", "Anvil", "Keep", "Yard", "Stone"],
    "canal": ["Dock", "Wharf", "Lip", "Lock", "Account"],
    "coil": ["Pass", "Slot", "Spring", "Yard", "Spark"],
    "vault": ["Archive", "Stacks", "Aisle", "Folio", "Glass"],
    "abyss": ["Column", "Rib", "Well", "Pit", "Eclipse"],
    "spire": ["Stair", "Climb", "Height", "Iris", "Aurora"],
    "orbit": ["Lattice", "Orrery", "Ring", "Garden", "Circumflex"],
    "glacier": ["Rail", "Rime", "Crevasse", "Hail", "Period"],
    "remainder": ["Script", "Trench", "Mark", "Sentence", "Type"],
    "street": ["Margin", "Walk", "Court", "Street", "Gate"],
}
WARDEN_TITLE = [
    "The Case", "The Imposing Stone", "Flood Warden", "The Wet Account", "Coil Warden",
    "The Wound Spring", "Ice Warden", "The Packed Period", "Orbit Warden", "The Teal Circumflex",
    "Script Warden", "The Unfiled Mark", "Abyss Warden", "The Last Rib", "Spire Warden",
    "The Written Height", "Vault Warden", "The Closed Folio", "The Plus Gate", "The Second Remainder",
]

VERBS_EN = {
    "z": "the stamper", "l": "the swinging censer", "x": "the guillotine",
    "f": "the falling drop-cap", "d": "the rotor court", "w": "the ink basin",
    "j": "the ember grate", "{": "the riding carriage", "[": "the echo plate",
    "}": "the shutter window", "S": "the hanging saw", "`": "the lift shaft",
    "g": "the floor geyser", ")": "the blink pad", "|": "the loft laser",
    "/": "the belt slope", "T": "the bounce pit", "-": "the crumble run",
    "=": "the loft street",
}

def stage_name(i: int, n: int, feat: str, theme: str, boss: bool) -> str:
    if boss:
        return WARDEN_TITLE[(n // 5) - 13]
    noun = TOY_NOUN[feat]
    place = PLACE[theme][i % 5]
    name = f"{noun} {place}"
    # keep unique if the pair collides
    if name in USED_NAMES:
        name = f"{noun} {place} {n}"
    USED_NAMES.add(name)
    return name


USED_NAMES: set[str] = set(WARDEN_TITLE)
EXISTING = {
    "Foundry Margin", "Keystroke Yard", "Fourfold Keep", "Ligature Canal", "Ampersand Dock",
    "Iris Bind", "Scriptorium", "Rule and Storm", "Operator Approach", "The Iconostasis",
    "Lower Ribs", "Column Street", "Rain Ships", "Petal Court", "The Spire", "Iris Spire",
    "Aurora Shaft", "Red Dock", "Machine Fort", "The Coil", "Static Mirror", "Ash Arch",
    "Count Ribs", "Quiet Spire", "The Period", "Gold Orrery", "Night Lattice", "White Margin",
    "Ember Script", "The Circumflex", "Hail Glass", "Storm Script", "Day Garden", "High Ice",
    "Void Point", "Teal Orrery", "Ink Garden", "Rime Lattice", "Aurora Spire", "Foundry Script",
    "Mirror Void", "Packed Ice", "Lightning Rule", "Gold Script", "Glass Vault", "Static Remainder",
    "Hail Lattice", "Garden Aurora", "Ribs of the Count", "Gold Remainder", "White Glass",
    "Lightning Orrery", "Ember Lattice", "Mirror Night", "The Remainder",
}
USED_NAMES.update(EXISTING)

PACKS = [
    "89A", "BCE", "Y75", "8A9", "B2C", "E7Y", "98B", "CA5", "7YE", "A8C",
    "B9E", "Y8A", "C75", "9BE", "A7C", "8YE", "B5A", "C9Y", "E87", "A9B",
]


def land_kind(feat: str) -> str:
    if feat in "lzf":
        return "hill"
    if feat in "wjg":
        return "valley"
    if feat in "x|}":
        return "pass"
    if feat == "{":
        return "bridge"
    if feat == "S":
        return "ridge"
    if feat in "T`)":
        return "valley"
    if feat in "/-=":
        return "hill"
    if feat == "|":
        return "pass"
    if feat in "d[":
        return "hill"
    return "hill"


def extra_kind(n: int, feat: str) -> str:
    opts = ["hill", "valley", "ridge", "pass"]
    k = opts[(n * 3) % 4]
    if k == land_kind(feat):
        k = opts[(n * 3 + 1) % 4]
    return k


def mix_for(n: int, feat: str, theme: str) -> str:
    if theme == "canal" and feat in CANAL_MIX:
        return CANAL_MIX[feat]
    opts = MIX_OF[feat]
    return opts[(n * 7) % len(opts)]


def land_op(kind: str, at: int, n: int) -> str:
    w = 10 + (n % 5)
    if kind == "hill":
        return f'{{ t: "hill", at: {at}, w: {w}, h: {1 + (n % 2)} }}'
    if kind == "valley":
        return f'{{ t: "valley", at: {at}, w: {w}, d: 2 }}'
    if kind == "ridge":
        return f'{{ t: "ridge", at: {at}, w: {w + 4} }}'
    if kind == "pass":
        return f'{{ t: "pass", at: {at}, w: {max(16, w + 6)} }}'
    if kind == "bridge":
        return f'{{ t: "bridge", at: {at}, w: {max(6, w - 2)}, ride: "{{" }}'
    return f'{{ t: "hill", at: {at}, w: {w}, h: 1 }}'


lines = [
    '/** Unique Second Century ledger specs. Stages 61–160. */',
    'import type { Verb } from "./recipe";',
    'import type { LandOp } from "./sculpt";',
    'import type { ThemeId } from "./types";',
    '',
    'export type CenturySetpiece =',
    '  | "colonnade"',
    '  | "zipper"',
    '  | "terrace"',
    '  | "ice"',
    '  | "ribs"',
    '  | "torches"',
    '  | "dual-loft"',
    '  | "vent"',
    '  | "switchback"',
    '  | "court";',
    '',
    'export type CenturySilhouette =',
    '  | "hill-valley"',
    '  | "valley-hill"',
    '  | "twin-hills"',
    '  | "ridge-pass"',
    '  | "canal-bridge"',
    '  | "court-pass"',
    '  | "pit-chain"',
    '  | "loft-street"',
    '  | "saw-rail"',
    '  | "shutter-gallery"',
    '  | "echo-lofts"',
    '  | "carriage-canyon"',
    '  | "laser-nave"',
    '  | "geyser-row"',
    '  | "rotor-court"',
    '  | "ice-shelf"',
    '  | "rib-climb"',
    '  | "mixed-sentence"',
    '  | "pass-court-pass"',
    '  | "well-loft-well";',
    '',
    'export interface CenturySpec {',
    '  n: number;',
    '  name: string;',
    '  objective: string;',
    '  theme: ThemeId;',
    '  featured: Verb;',
    '  mix: Verb;',
    '  silhouette: CenturySilhouette;',
    '  setpiece: CenturySetpiece;',
    '  w: number;',
    '  land: LandOp[];',
    '  teachX: number;',
    '  mixX: number;',
    '  extraX: number;',
    '  restX: number;',
    '  porchAX: number;',
    '  porchBX: number;',
    '  setX: number;',
    '  pocketX: number;',
    '  porchA: string;',
    '  porchB: string;',
    '  prize: "$" | "i";',
    '}',
    '',
    'export const CENTURY: CenturySpec[] = [',
]

for i in range(100):
    n = 61 + i
    theme = THEMES[i % 10]
    feat = FEATURED[i % 20]
    mix = mix_for(n, feat, theme)
    if mix == feat:
        mix = MIX_OF[feat][0]
    # canal may mix sluice as mix-only
    if theme == "canal" and feat not in ("w", "j", "g") and i % 3 == 0:
        mix = "~" if mix != "~" else mix
    if mix == "~" and feat == "~":
        mix = "w"
    sil = SILHOUETTES[i % 20]
    setpiece = SETPIECES[(i * 3) % 10]
    w = 104 + (n % 9) * 4
    teach_x = 14 + (n % 4)
    mix_x = 44 + ((n * 3) % 6)
    extra_x = 74 + ((n * 5) % 5)
    rest_x = 58 + (n % 3)
    porch_a = 30 + (n % 5)
    porch_b = 86 + (n % 4)
    set_x = 64 + ((n * 2) % 7)
    pocket_x = w - 22 - (n % 4)
    k1 = land_kind(feat)
    k2 = land_kind(mix) if mix != "~" else "valley"
    k3 = extra_kind(n, feat)
    # silhouette overrides third land and order
    if sil == "twin-hills":
        k1, k2, k3 = "hill", "hill", "valley"
    elif sil == "valley-hill":
        k1, k2 = "valley", "hill"
    elif sil == "ridge-pass":
        k1, k2, k3 = "ridge", "pass", "hill"
    elif sil == "canal-bridge":
        k2, k3 = "valley", "bridge"
    elif sil == "court-pass":
        k3 = "pass"
    land = [
        land_op(k1, teach_x - 2, n),
        land_op(k2, mix_x - 2, n + 1),
        land_op(k3, extra_x - 2, n + 2),
    ]
    feat_en = VERBS_EN.get(feat, "the featured toy")
    mix_en = VERBS_EN.get(mix, "a known verb") if mix != "~" else "the sluice (mix only)"
    boss = n % 5 == 0
    name = stage_name(i, n, feat, theme, boss)
    if boss:
        obj = f"Teach {feat_en}. Mix {mix_en}. Two packs, then the warden. Take the gate."
    else:
        obj = f"Teach {feat_en}. Mix {mix_en}. Rest between packs. Reach the gate."
    porchA = PACKS[i % 20]
    porchB = PACKS[(i * 7 + 3) % 20]
    if porchB == porchA:
        porchB = PACKS[(i + 1) % 20]
    if boss:
        porchB = "!" + porchB[:2]
    prize = "$" if n % 4 == 0 else "i"
    lines.append("  {")
    lines.append(f'    n: {n},')
    lines.append(f'    name: {name!r},')
    lines.append(f'    objective: {obj!r},')
    lines.append(f'    theme: {theme!r},')
    lines.append(f'    featured: {feat!r},')
    lines.append(f'    mix: {mix!r},')
    lines.append(f'    silhouette: {sil!r},')
    lines.append(f'    setpiece: {setpiece!r},')
    lines.append(f'    w: {w},')
    lines.append(f'    land: [{land[0]}, {land[1]}, {land[2]}],')
    lines.append(f'    teachX: {teach_x},')
    lines.append(f'    mixX: {mix_x},')
    lines.append(f'    extraX: {extra_x},')
    lines.append(f'    restX: {rest_x},')
    lines.append(f'    porchAX: {porch_a},')
    lines.append(f'    porchBX: {porch_b},')
    lines.append(f'    setX: {set_x},')
    lines.append(f'    pocketX: {pocket_x},')
    lines.append(f'    porchA: {porchA!r},')
    lines.append(f'    porchB: {porchB!r},')
    lines.append(f'    prize: {prize!r},')
    lines.append("  },")

lines.append("];")
lines.append("")
lines.append("export function centurySpec(n: number): CenturySpec | undefined {")
lines.append("  return CENTURY[n - 61];")
lines.append("}")
lines.append("")

out = Path("/home/ericdanielevans/projects/Letterology-Calculator-century/src/glyphbound/century-catalog.ts")
out.write_text("\n".join(lines) + "\n")
print(f"wrote {out} (100 specs)")
