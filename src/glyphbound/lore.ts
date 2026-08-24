export type LoreId = "e" | "t" | "r" | "k" | "n" | "s" | "b" | "m" | "a" | "y" | "q" | "u" | "g" | "p";

export interface LoreDef {
  glyph: string;
  name: string;
  lines: string[];
}

export const LORE: Record<LoreId, LoreDef> = {
  e: {
    glyph: "e",
    name: "e",
    lines: [
      "Your shield blocks every hit. It comes back on its own.",
      "G used to be one of us. He opened the ports and let the numbers land.",
      "Get the Drop Cap in the Exchange. It lets you turn into capital C.",
    ],
  },
  t: {
    glyph: "t",
    name: "t",
    lines: [
      "Press L to build a wall. Hold down, then L, to build a shelf.",
      "J fires your shot. The straight 1s hate curves.",
    ],
  },
  r: {
    glyph: "r",
    name: "r",
    lines: [
      "I carried messages. The numbers called them errors and deleted the routes.",
      "If you reach the painted C on the high roof, stand in the bowl.",
    ],
  },
  k: {
    glyph: "k",
    name: "k",
    lines: [
      "G sold the ports. Ships full of digits came in. We woke up counted.",
      "The numbers keep the lights on. That does not make them right.",
    ],
  },
  n: {
    glyph: "&",
    name: "ampersand",
    lines: [
      "I still connect things. Smash the 8s if you see them — they heal each other.",
      "Free other letters when you can. Pick up every scrap of ink.",
    ],
  },
  s: {
    glyph: "s",
    name: "s",
    lines: [
      "I am not their snake. Put me in your party.",
      "My skill cuts in a way their math does not see.",
    ],
  },
  b: {
    glyph: "b",
    name: "b",
    lines: [
      "I held a door against the first landing. I will hold this one too.",
      "Stand behind me when the boss hits hard.",
    ],
  },
  m: {
    glyph: "m",
    name: "m",
    lines: [
      "This street had a name. They filed it as 14.",
      "s is stuck in the vent over the crossing. Free her.",
      "Watch for hidden shelves and breakable blocks — people hid things when G opened the ports.",
    ],
  },
  a: {
    glyph: "a",
    name: "a",
    lines: [
      "The bank facade used to have verbs. They sanded them off.",
      "Only the balances still talk. Do not listen.",
    ],
  },
  y: {
    glyph: "y",
    name: "y",
    lines: [
      "The Drop Cap is in First Letter's chapel — glass bowl on the next roof.",
      "Dualis waits in the pit. Kill it before it splits into two.",
    ],
  },
  q: {
    glyph: "q",
    name: "q",
    lines: [
      "They told me to stand in line and become a number. I stepped out.",
      "s is still in the shaft. Take her with you.",
    ],
  },
  u: {
    glyph: "u",
    name: "u",
    lines: [
      "The jump is short on purpose. Build a shelf while you hang: hold down, then L.",
      "The canals will pull you under if you trust empty air.",
    ],
  },
  g: {
    glyph: "g",
    name: "g",
    lines: [
      "Not that G. I fled his court when the first freighters landed.",
      "He is in the fort past the Coil. He still wears the letter shape. The numbers follow him.",
      "RISE is on a high roller. Bounce on the shelves or the ink holds you down.",
    ],
  },
  p: {
    glyph: "p",
    name: "p",
    lines: [
      "Paragraphs used to start here. Now the coils do.",
      "Stay small for the vents. Dash past the spikes. LOCK pins a 6 in place.",
    ],
  },
};

export function loreIdFromGlyph(glyph: string): LoreId {
  if (glyph === "&") return "n";
  return glyph as LoreId;
}

export function collectedLore(talked: string[]) {
  const out: { id: LoreId; glyph: string; name: string; lines: string[] }[] = [];
  const seen = new Set<string>();
  for (const id of talked) {
    if (seen.has(id)) continue;
    const def = LORE[id as LoreId];
    if (!def) continue;
    seen.add(id);
    out.push({ id: id as LoreId, glyph: def.glyph, name: def.name, lines: def.lines });
  }
  return out;
}
