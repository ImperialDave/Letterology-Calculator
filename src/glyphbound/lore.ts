export type LoreId = "e" | "t" | "r" | "k" | "n" | "s" | "b" | "m" | "a" | "y" | "q" | "u" | "g" | "p";

export interface LoreDef {
  glyph: string;
  name: string;
  lines: string[];
}

export const LORE: Record<LoreId, LoreDef> = {
  e: {
    glyph: "e",
    name: "e, the Pawned Eye",
    lines: [
      "Ink is rationed. Meaning is not.",
      "Your ward drinks every bite. It grows back fast.",
      "The Drop Cap waits in the Exchange. Walk the street until the floor gives out.",
    ],
  },
  t: {
    glyph: "t",
    name: "t, the Crossbar",
    lines: [
      "L scribes a wall. Hold down, then L, for a shelf — the jump is short on purpose.",
      "J spat crescents. The 1s only understand a straight line.",
    ],
  },
  r: {
    glyph: "r",
    name: "r, the Courier",
    lines: [
      "I was carrying a page. They called it undefined.",
      "If you find the chapel, stand in the bowl of the painted C.",
    ],
  },
  k: {
    glyph: "k",
    name: "k, Kerned",
    lines: [
      "Spacing is peace. Rebellion is bad kerning.",
      "The Dominion keeps the lights on. Can your words do that?",
    ],
  },
  n: {
    glyph: "&",
    name: "Ampersand",
    lines: [
      "I bind what still relates. Smash the 8-coils if you see them.",
      "Free vowels. Collect manuscript scraps. Write anyway.",
    ],
  },
  s: {
    glyph: "s",
    name: "s, Sibilant",
    lines: ["I am not their snake.", "Put me in the cell. I cut what calculation cannot see."],
  },
  b: {
    glyph: "b",
    name: "b, Bulwark",
    lines: ["I held a warehouse door. I will not hold it for them.", "Stand behind the bowls."],
  },
  m: {
    glyph: "m",
    name: "m, the Remainder",
    lines: [
      "I balanced tills until the tills learned to count me.",
      "This street used to have a name. They listed it as 14. The 1s walk it like they own the decimal point.",
      "s is in the vent over the crossing. Don't let the drizzle wash your ink.",
    ],
  },
  a: {
    glyph: "a",
    name: "a, the Article",
    lines: [
      "A bank is a sentence that starts with owe.",
      "They sanded the verbs off the facade. Only the balances still speak.",
    ],
  },
  y: {
    glyph: "y",
    name: "y, the Descender",
    lines: [
      "The Drop Cap hung in First Letter's chapel — that glass bowl on the next roof.",
      "Dualis rings the closing bell in the pit. Don't let it split.",
    ],
  },
  q: {
    glyph: "q",
    name: "q, the Queue",
    lines: [
      "Stand in line. Be a number. I stepped out.",
      "s still hisses in the shaft. Take her. The Exchange hates a leftover sound.",
    ],
  },
  u: {
    glyph: "u",
    name: "u, the Understroke",
    lines: [
      "The jump is a comma. The shelf is the rest of the sentence.",
      "Hold down, then scribe, while you hang. The gutters drink anyone who trusts air.",
    ],
  },
  g: {
    glyph: "g",
    name: "g, the Gutter",
    lines: [
      "I used to catch fallen type. Now I catch drowned 3s.",
      "RISE lives on a roller. Bounce, or the ink keeps you.",
    ],
  },
  p: {
    glyph: "p",
    name: "p, the Pilcrow",
    lines: [
      "Paragraphs used to start here. Now the coils do.",
      "Stay small for the vents. Dash the teeth. LOCK pins a 6 to its own loop.",
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
