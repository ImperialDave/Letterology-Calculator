export type LoreId =
  | "e"
  | "t"
  | "r"
  | "k"
  | "n"
  | "s"
  | "b"
  | "m"
  | "a"
  | "y"
  | "q"
  | "u"
  | "g"
  | "p"
  | "f"
  | "h"
  | "d"
  | "v"
  | "w"
  | "x"
  | "z"
  | "j"
  | "l"
  | "o"
  | "i"
  | "c";

export interface LoreDef {
  glyph: string;
  name: string;
  lines: string[];
}

/**
 * Clear English lore. Every line is spoken by a letter who lived through
 * the landing. G is the traitor who opened the ports. The Dominion is the
 * numbers. The deeper you go, the tighter the count becomes.
 *
 * Letterology note: willingness is not fate. The ledger can be rewritten
 * only by those who still choose to mark the page.
 */
export const LORE: Record<LoreId, LoreDef> = {
  e: {
    glyph: "e",
    name: "e",
    lines: [
      "Your shield blocks every hit. It comes back on its own. Do not forget that.",
      "G used to be one of us. He opened the ports and let the numbers land. He still wears a letter shape so the rest of us will hesitate.",
      "Get the Drop Cap in the Overcast Exchange. It lets you turn into capital C. Capital letters hit harder and can break certain walls.",
      "The first five districts are the First Book. After that the ledgers keep going — progressive stages that grow tighter the further you write.",
      "Talk to everyone in the Stacks. Each of us keeps a piece of the map the Dominion tried to erase.",
    ],
  },
  t: {
    glyph: "t",
    name: "t",
    lines: [
      "Press L to build a stem wall. Hold down, then L, or use the Shelf button on touch, to build a platform you can stand on.",
      "J is Strike. Tap for a jab combo. Hold a direction and tap for a tilt — or a dash attack if you are already running. Hold J with a direction to charge a smash. Hold J still for your flourish. In the air the same directions pick nair, fair, bair, uair, and a spike dair. Space always jumps. Down in air after the peak is a fast-fall.",
      "F fires Fang. It drinks ink fast. The straight 1s hate curves. The 0s float and spit from a distance.",
      "Ink refills slowly. Do not waste it on walls you do not need.",
      "Later stages starve your ink on purpose. Pick up every drop. A shelf at the wrong moment can cost you the fight.",
      "A nib, not a fang. When ink runs dry, write the floor. That is the only shot I trust.",
      "On mobile, the Stem and Shelf buttons are there so you do not have to fight the stick while you write.",
    ],
  },
  r: {
    glyph: "r",
    name: "r",
    lines: [
      "I carried messages between the districts. The numbers called them errors and deleted the routes. Now I wait here.",
      "If you reach the painted C on a high roof, stand in the bowl. That is a Case Font. You need the Drop Cap first.",
      "Messages used to move sideways across Calculara. Now they only move up the count — stage after stage, each one a tighter sentence.",
      "When a stage ends, the gate will not open while a warden still stands. Drop the warden. Then the page turns.",
    ],
  },
  k: {
    glyph: "k",
    name: "k",
    lines: [
      "G sold the ports. Ships full of digits came in overnight. We woke up counted, filed, and told to stand in lines.",
      "The numbers keep the lights on and the clocks running. That does not make them right. It only makes them hard to refuse.",
      "I will not teach from a desk while the count files the yard. Find me where the floor still holds.",
      "Watch for new shapes deeper in. The first landing was simple digits. The second landing wears symbols that think.",
      "Triads split. Null-Rings pull. Möbius coils climb. Summoners open ports. Gradients lean. Cross-Seals rotate. Archivists copy you. End-Mark is the last of them.",
      "Willingness is the only thing the Dominion cannot file. Keep choosing. That is the whole doctrine.",
    ],
  },
  n: {
    glyph: "&",
    name: "ampersand",
    lines: [
      "I still connect things. Smash the 8s if you see them — they heal each other when left alone.",
      "Free other letters when you can. Pick up every scrap of ink. The Dominion wants you empty.",
      "The Null Ledger waits past G's Fort. Nullis is not a number. It is the habit of counting everything down to nothing.",
      "Lasers pulse on a beat. Wait for the dark window, then cross. The 9s blink and rain ink from above.",
      "Deeper stages invent new roles: splitters, suction rings, wall-climbers, summoners. Learn each one before the next arrives.",
      "The 8s heal each other. Pin one and the heal never ticks. That is why I still connect things.",
      "The Continue gate in the hub opens the next unread ledger. The deeper you go, the more the page fights back.",
    ],
  },
  s: {
    glyph: "s",
    name: "s",
    lines: [
      "I am not their snake. Put me in your party. My skill cuts in a way their math does not see.",
      "I move fast. Use me for gaps and for getting behind slow tanks.",
      "Vents are narrow. Stay small. Capital C and b are too wide for some of the shafts deeper in.",
      "When a Cross-Seal starts to spin, switch to me and slip the gap. Timing is the only language they respect.",
    ],
  },
  b: {
    glyph: "b",
    name: "b",
    lines: [
      "I held a door against the first landing. I will hold this one too.",
      "Stand behind me when a boss hits hard. My brace skill puts a wall in front of us.",
      "G still looks like a letter on purpose. Do not hesitate. He chose the ports. We choose the page.",
      "In the progressive ledgers the wardens get heavier. Brace, shoot, rewrite. That is the order.",
    ],
  },
  m: {
    glyph: "m",
    name: "m",
    lines: [
      "This street had a name. They filed it as 14 and painted over the letters.",
      "s is stuck in a vent over the crossing in the Exchange. Free her. She is worth the risk.",
      "People hid things when G opened the ports — secret shelves, breakable blocks, ink caches. Look up and look behind.",
      "Secrets are not on the main path. That is the point. The Dominion only files what it can see from the road.",
    ],
  },
  a: {
    glyph: "a",
    name: "a",
    lines: [
      "The bank facade used to have verbs on it. They sanded them off and left only balances.",
      "Only the balances still talk. Do not listen to them. They will tell you that rounding down is mercy.",
      "Every progressive stage is another column in the same ledger. The numbers want the total. We want the sentence to keep going.",
    ],
  },
  y: {
    glyph: "y",
    name: "y",
    lines: [
      "The Drop Cap is in First Letter's chapel — a glass bowl on a high roof in the Exchange.",
      "Dualis waits in the pit under that district. Kill it before it splits into two. The STACKS gate opens only when it falls.",
      "Dualis is the first warden. It teaches you that the Dominion doubles what it cannot erase. Hit hard. Do not let the split breathe.",
    ],
  },
  q: {
    glyph: "q",
    name: "q",
    lines: [
      "They told me to stand in line and become a number. I stepped out. The line did not notice.",
      "s is still in the shaft. Take her with you. Two letters are harder to file than one.",
      "The hub remembers every stage you clear. The Continue gate always points at the next unread page.",
    ],
  },
  u: {
    glyph: "u",
    name: "u",
    lines: [
      "The jump across the canals is short on purpose. Build a shelf while you hang: hold down, then L, or tap Shelf.",
      "The water will pull you under if you trust empty air. Crumble platforms fall after you stand on them. Keep moving.",
      "In deeper canals the gaps grow and the ink gets scarce. Plan the shelf before you jump, not after.",
    ],
  },
  g: {
    glyph: "g",
    name: "g",
    lines: [
      "Not that G. I fled his court when the first freighters landed.",
      "He is in the fort past the Coil. He still wears the letter shape so the rest of us will hesitate before we shoot.",
      "RISE is on a high roller in the Gutter. Bounce on shelves or the ink holds you down. LOCK pins a 6 in place so you can pass.",
      "He calls himself the Importer. We call him the first betrayal. When you face him, do not wait for him to open another port.",
    ],
  },
  p: {
    glyph: "p",
    name: "p",
    lines: [
      "Paragraphs used to start here. Now the coils do.",
      "Stay small for the vents. Dash past the spikes. LOCK pins a 6 in place. The Coil Yard is where the Dominion tests whether you can still choose your own path.",
      "Lasers and vents together are a sentence with no pause. Learn the rhythm. The dark window is short on purpose.",
    ],
  },
  f: {
    glyph: "f",
    name: "f",
    lines: [
      "I used to mark footnotes. Now I mark exits. When a stage feels finished, look for a glowing gate. It will not open while the warden is still standing.",
      "The deeper ledgers invent new wardens. Dualis splits. G imports. Nullis erases. After them come symbols that were never meant to be numbers.",
      "End-Mark is the last of the second landing. It begins whole. When you crack it, the pieces chase you separately. Finish both arcs.",
      "Five closed chapters. Ten Numberomicons. Then the Unbound Sentence through sixty. Clear them and the final gate will open.",
    ],
  },
  h: {
    glyph: "h",
    name: "h",
    lines: [
      "Hearts mend the curve. Pick them up when you see them. The Dominion does not leave many.",
      "Your shield is a ward, not a wall. It blocks every hit and rebuilds on its own. Do not stand in spikes just because you have plates left.",
      "Scale pickups raise your maximum shield. Fang pickups raise your shot. Both are rare deeper in. Take them when the path offers them.",
    ],
  },
  d: {
    glyph: "d",
    name: "d",
    lines: [
      "I am the door that still remembers what a door was for. Most of the portals you see are counted shut until you clear the stage.",
      "The hub has milestone doors for the big districts. The Continue gate leads into the progressive ledgers — stages that grow tighter the further you go.",
      "Once you clear a stage, its number is written into your progress. The Continue gate always opens the next unread page. You can also replay what you have already finished.",
      "Sixty stages is not a wall. It is a long sentence. The Numberomicons are the middle clause. Keep writing.",
    ],
  },
  v: {
    glyph: "v",
    name: "v",
    lines: [
      "Vents are narrow on purpose. Capital C and the letter b are too wide for some of them. Switch to s or stay lowercase when you need to slip through.",
      "Some vents reverse. Watch the flow before you commit.",
      "Möbius Coils treat walls the way you treat floors. They climb. Hit them when they turn a corner and slow for a moment.",
    ],
  },
  w: {
    glyph: "w",
    name: "w",
    lines: [
      "WALL thickens your scribe stems. BURN makes them hurt numbers that touch them. RISE lets shelves bounce you. LOCK freezes enemies that lean on your stems.",
      "Learn the four words in order. The later stages assume you have them.",
      "Scribe is the one tool the Dominion cannot fully file. A stem is a refusal. A shelf is a place that was not on their map.",
    ],
  },
  x: {
    glyph: "x",
    name: "x",
    lines: [
      "Cross-Seals project four short laser arms and then rotate. The safe window is small. Treat them like a moving intersection, not a wall.",
      "Archivists do not shoot first. They copy your last moves and play them back as hostile echoes. Change your pattern or the echo will hit you with your own shot.",
      "Both of them appear in the middle progressive stages. Learn the tell. The arm flash and the copy glow are warnings, not decoration.",
    ],
  },
  z: {
    glyph: "z",
    name: "z",
    lines: [
      "I am the end of the old alphabet. The Dominion does not stop at Z. It invents new marks when the old digits are not enough.",
      "End-Mark is the last of the second landing. It begins as a whole shape. When you break it, it splits into arcs that chase you separately. Finish both.",
      "The Final Account is still End-Mark at thirty, after the Numberomicons. Everything before it is practice for that sentence.",
    ],
  },
  j: {
    glyph: "j",
    name: "j",
    lines: [
      "F fires Fang, your main shot. Upgrade it when you find the fang pickups. Higher levels pierce and spread. J is Strike now — never the same key.",
      "Do not dump all your ink into walls if a boss is about to appear. You will need the shot more than the shelf.",
      "Summoners stay back and open ports. Prioritize them. Every second they live is another digit on the field.",
    ],
  },
  l: {
    glyph: "l",
    name: "l",
    lines: [
      "Scribe is the one tool the Dominion cannot fully file. A stem is a refusal to be only a number. A shelf is a place to stand that was not on their map.",
      "Use them. The progressive stages are designed to starve your ink if you spend carelessly.",
      "Null-Rings open a short suction field. Projectiles and players both get pulled. Step out before the iris snaps shut, or shoot from outside the pull.",
    ],
  },
  o: {
    glyph: "o",
    name: "o",
    lines: [
      "Null-Rings open a short suction field. Projectiles and players both get pulled. Step out before the iris snaps shut, or shoot from outside the pull.",
      "Möbius Coils climb walls and leave a fading trail. Do not stand in the trail. Hit them when they turn a corner and slow for a moment.",
      "Gradients lean into slopes and accelerate downhill. Do not fight them on a drop. Climb above and shoot down.",
    ],
  },
  i: {
    glyph: "i",
    name: "i",
    lines: [
      "Ink is the only currency that still belongs to us. Pick up every drop. Later stages place regenerating ink behind lasers or behind a Summoner you have to clear first.",
      "Triad-Splitters break into three small 1s when they die. Kill the pieces or they will try to reform.",
      "The progressive book has sixty ledgers. The Numberomicons sit in the middle. Willingness, not fate, is what turns the page.",
    ],
  },
  c: {
    glyph: "c",
    name: "c",
    lines: [
      "You are the lowercase mark nobody counted. That is why you can still move.",
      "Capital C is not a different person. It is the same curve, closed and thickened. Use the Case Font when you have the Drop Cap.",
      "The work is not to become a number. The work is to keep writing until the count has to answer.",
      "Letterology is willingness, not fate. Every stage you clear is a sentence the Dominion did not authorize. Keep going.",
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
