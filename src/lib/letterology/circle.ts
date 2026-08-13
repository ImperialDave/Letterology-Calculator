import type { Letter } from "./types";
import { ALPHABET } from "./types";

export type RelationKind = "ally" | "enemy";

export interface HouseBond {
  other: Letter;
  kind: RelationKind;
  copy: string;
}

const ALLIES: Record<Letter, [Letter, Letter, Letter]> = {
  A: ["D", "E", "J"],
  B: ["K", "N", "S"],
  C: ["F", "T", "X"],
  D: ["A", "I", "Q"],
  E: ["A", "J", "Y"],
  F: ["C", "W", "Y"],
  G: ["L", "N", "O"],
  H: ["K", "R", "V"],
  I: ["D", "Q", "S"],
  J: ["A", "E", "M"],
  K: ["B", "H", "N"],
  L: ["G", "O", "U"],
  M: ["J", "P", "U"],
  N: ["B", "G", "K"],
  O: ["G", "L", "W"],
  P: ["M", "U", "Z"],
  Q: ["D", "I", "Z"],
  R: ["H", "S", "V"],
  S: ["B", "I", "R"],
  T: ["C", "X", "Z"],
  U: ["L", "M", "P"],
  V: ["H", "R", "X"],
  W: ["F", "O", "Y"],
  X: ["C", "T", "V"],
  Y: ["E", "F", "W"],
  Z: ["P", "Q", "T"],
};

const ENEMIES: Record<Letter, [Letter, Letter, Letter]> = {
  A: ["B", "N", "P"],
  B: ["A", "C", "O"],
  C: ["B", "P", "U"],
  D: ["F", "L", "M"],
  E: ["K", "M", "R"],
  F: ["D", "P", "S"],
  G: ["Q", "T", "X"],
  H: ["N", "U", "Y"],
  I: ["L", "V", "W"],
  J: ["K", "Q", "W"],
  K: ["E", "J", "X"],
  L: ["D", "I", "Y"],
  M: ["D", "E", "Z"],
  N: ["A", "H", "T"],
  O: ["B", "T", "X"],
  P: ["A", "C", "F"],
  Q: ["G", "J", "W"],
  R: ["E", "U", "Z"],
  S: ["F", "V", "Y"],
  T: ["G", "N", "O"],
  U: ["C", "H", "R"],
  V: ["I", "S", "Z"],
  W: ["I", "J", "Q"],
  X: ["G", "K", "O"],
  Y: ["H", "L", "S"],
  Z: ["M", "R", "V"],
};

const ALLY_COPY: Record<string, string> = {
  "A-D":
    "The road is only a rumor until you have sat still long enough to hear your own name. The Hermit gives the Seeker a departure that is not a panic.",
  "A-E":
    "One leaves a borrowed self; the other leaves a borrowed map. Together they keep a life from confusing a familiar cage with a home.",
  "A-J":
    "Wanting becomes a journey only when a real cost is accepted and a return is imagined. The Hero is what the Seeker grows into if the crossing is finished.",
  "B-K":
    "The Caregiver builds the table the Orphan once stood outside. Kinship here is a craft: a spare chair, not a blood-myth.",
  "B-N":
    "Holding and healing are one climate. The hearth and the garden keep life edible — for others, and for the one who tends.",
  "B-S":
    "A home is a cloth of loyalties. The Weaver gives the Caregiver a weave that can breathe; the Caregiver gives the weave a place to be warm.",
  "C-F":
    "The holy no and the unowned mind. Rebellion that has not become a brand; freedom that can still refuse.",
  "C-T":
    "The spark and the crucible. The Rebel names the dead rule; the Alchemist agrees to let the dead form actually die.",
  "C-X":
    "Disruption as medicine. The Rebel strikes the match; the Trickster makes sure the rule was lying before anything burns.",
  "D-I":
    "Descent and the lamp. The Hermit goes down; the Sage will not let what is fetched become a private museum.",
  "D-Q":
    "Two doors into the same quiet: solitude, and union with what will not be herded by a clever sentence.",
  "E-J":
    "Distance and ordeal. The Explorer opens the miles; the Hero agrees to be changed by them and still come home.",
  "E-Y":
    "A wider world asks for a self that can turn. The Explorer and the Shapeshifter keep a life from fossilizing into one costume.",
  "F-W":
    "Beginner's mind and the Divine Child. Astonishment that has not signed a contract — the zero and the dawn in one breath.",
  "F-Y":
    "The open gate and the living hinge. Lightness that can still choose a form; a form that has not forgotten how to be light.",
  "G-L":
    "Making is Eros with hands. The Creator and the Lover refuse a life that only witnesses.",
  "G-N":
    "What is tended increases. The grove and the garden are one work seen from two sides of the same watering can.",
  "G-O":
    "Living work needs a rim that is not a wall. The grove grows inside a circle the Priestess knows how to keep.",
  "H-K":
    "A people is both spoken and fed. The Prophet's unwelcome word and the Orphan's made table — conscience with a place to sit.",
  "H-R":
    "The far word needs a true note. Prophet and Bard restore a tribe to the vow it had begun to live against.",
  "H-V":
    "Horizon and vocation. The Prophet names the weather coming; the Oracle gives that weather a face and a pulse.",
  "I-Q":
    "The lamp and the cloister. Insight that would rather be accurate than impressive, and a question that can be lived near.",
  "I-S":
    "The private pattern and the public braid. The Sage sees the cloth; the Weaver sits down at the loom.",
  "J-M":
    "The road and the kept edge. The Hero returns with medicine; the Warrior knows which fight was worthy of the dust.",
  "K-N":
    "Exile becomes a craft of feeding. Both remember what absence costs, and so they know how to make a place.",
  "L-O":
    "Chosen flame and sacred vessel. Eros that has a rim; mystery that still has a body.",
  "L-U":
    "Love that can hold two true things. The Lover's heat in the Peacemaker's bowl — warmth that does not require a smaller I.",
  "M-P":
    "The edge and the crown. Force that has agreed to serve a climate; order that can still fight for the land.",
  "M-U":
    "A clean fight and a bowl that can bear a quarrel. Peace, here, is not the absence of a spine.",
  "O-W":
    "The circle and the dawn. Holy space that has not agreed to be bored; wonder that has somewhere to arrive.",
  "P-U":
    "The climate-maker and the vessel. Rule that includes the ones who disagree, or it is only a hat.",
  "P-Z":
    "Sacred kingship and aligned will. The crown and the peak — power that can become ordinary again.",
  "Q-Z":
    "The unspeakable, then one practicable act. Union with the Real is not finished until it can wash a dish.",
  "R-S":
    "Song and cloth. A people remember themselves by a note they can enter and a joining they can live inside.",
  "R-V":
    "What is received in the sanctum must be sounded. The Oracle's picture; the Bard's pitch.",
  "T-X":
    "The furnace and the crossroads. Necessary fire, and the messenger who will not let the official story stay too clean.",
  "T-Z":
    "Dissolve, then aim. The Alchemist clears the false; the Magician makes the true usable.",
  "V-X":
    "Sight kept honest by the missing term. The Oracle's picture will not become a statue while the Trickster is in the room.",
  "W-Y":
    "Wonder and the hinge. Innocence that can change shape without becoming a lie about what it already knows.",
};

const ENEMY_COPY: Record<string, string> = {
  "A-B":
    "Departure and the hearth. Love looks like a reason to stay, and like a reason to grow. Neither is wrong; both become a lid if they win alone.",
  "A-N":
    "The appetite to become can starve what already needs feeding. The duty to tend can postpone the life that is trying to start.",
  "A-P":
    "The first gate and the crown. A beginning refuses an order that has begun to impersonate destiny. Order calls the beginning a child.",
  "B-C":
    "The hold and the match. Loyalty names ignition a betrayal; ignition names loyalty a lid. The living bond knows which day it is.",
  "B-O":
    "The personal hearth and the impersonal temple. Home can colonize the sacred; the sacred can treat a living room as a draft.",
  "C-P":
    "The holy no and the sacred yes of order. Dead law and live revolt. A culture needs both, and dies when either becomes a personality.",
  "C-U":
    "The spark and the bowl. The Rebel fears a peace that muzzles; the Peacemaker fears a fire with no vessel. Both fears have a point.",
  "D-F":
    "The well and the cliff. Depth despises lightness and calls it stupidity. The Fool will not be buried in a private museum and call it wisdom.",
  "D-L":
    "Withdrawal and union. The lantern hides; the flame wants a witness. Solitude can become contempt. Love can become a refusal to go down.",
  "D-M":
    "Descent and campaign. The Hermit will not be marched. The Warrior will not wait for a perfect silence that never arrives.",
  "E-K":
    "More world, and the need to belong. The Explorer's air can feel like abandonment. The Orphan's table can feel like a pretty cage.",
  "E-M":
    "Widening and the kept war. One motion has no enemy; the other is lost without one. Speed and space can both refuse to arrive.",
  "E-R":
    "The open road and the true note of home. Distance that will not be sung; a song that will not travel. Someone has to write.",
  "F-P":
    "Beginner's mind and the script of rule. The Fool will not be scheduled. The Ruler cannot govern weather and still sleep.",
  "F-S":
    "The unnumbered gate and the loom. Freedom that will not be woven; a cloth that wants a vow. Zero meets the braid and bristles.",
  "G-Q":
    "The green work and the unsayable. A made thing can flee the Real. The cloister can refuse to make anything and call the emptiness holy.",
  "G-T":
    "The grove and the furnace. Increase, and the death that lets the next form live. Make, or undo. The argument that grows a soul.",
  "G-X":
    "Tending and the joke at the margin. The Creator wants a season. The Trickster will not promise one. Both keep the work from becoming a factory.",
  "H-N":
    "The far meal and the present one. Horizon-gazing can neglect the person already hungry. Feeding can treat the future as a luxury.",
  "H-U":
    "The unwelcome word and the whole bowl. Vision can become a stick you use on the present. Peace can become a muzzle you call kindness.",
  "H-Y":
    "A far line, and a self that will not stay one shape. The Prophet needs a stable hearer. The Shapeshifter will not be a statue of the message.",
  "I-L":
    "Logos and Eros. The study and the chosen body. Understanding without heat; heat without a sentence. Each thinks the other is a child.",
  "I-V":
    "The inner lamp and the public sanctum. Insight hoarded, vocation displayed — the same seeing, two vanities, one unused village.",
  "I-W":
    "The exact mind and the open eye. Advice that has forgotten astonishment; wonder that will not think. Wisdom splits and both halves thin.",
  "J-K":
    "The road and the table. Going that will not write home; belonging that treats every journey as betrayal. The living answer writes, then goes.",
  "J-Q":
    "The miles and the cloister. A quest of dust versus a quest of the unspeakable. Each can despise the other's idea of a true crossing.",
  "J-W":
    "The ordeal and the Divine Child. A hero who cannot play; an innocent who will not pay a cost. Courage without wonder; wonder without a spine.",
  "K-X":
    "Made kinship and the refusal of the pattern. The spare chair versus the permanent exit. Belonging that closes; exile that becomes a brand.",
  "L-Y":
    "The chosen flame and the changing face. Fidelity can fossilize. The hinge can refuse to land. Love wants both heat and a living form.",
  "M-Z":
    "The daily edge and the peak. A war that cannot end; a will that cannot come down. Both forget that power must become ordinary again.",
  "N-T":
    "Feeding and the fire. The Healer will not torch what still lives. The Alchemist will not keep a corpse at the table and call it care.",
  "O-T":
    "Holy rim and crucible. The Priestess fears a fire with no rite. The Alchemist fears a rite with no death. Mystery needs heat and a bowl.",
  "O-X":
    "The temenos and the crossroads. A circle that polices mystery; a trick that will not let a room ripen. Threshold versus the joke that never builds.",
  "Q-W":
    "The cloister and the dawn. Mysticism that has forgotten first light; innocence that will not go into the dark. Both are unfinished prayers.",
  "R-U":
    "The true note and the smoothed room. The Bard will not paper a sharp grief. The Peacemaker fears a song that splits the table.",
  "R-Z":
    "Song and clean will. Art that will not be aimed; magic that treats people as an audience. Pitch versus the peak.",
  "S-V":
    "The loom of we and the sanctum of one seeing. Shared pattern versus a picture received in private. Both can colonize the other.",
  "S-Y":
    "The cloth and the hinge. A weave that cannot bear a new shape; a self that will not be a thread. Joining versus remaining uncaught.",
  "V-Z":
    "The picture and the forced rhyme of will. Vocation versus manifestation as domination. Sight that will not act; will that will not see.",
};

function pairKey(a: Letter, b: Letter): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

export function alliesOf(letter: Letter): [Letter, Letter, Letter] {
  return ALLIES[letter] ?? ALLIES.X;
}

export function enemiesOf(letter: Letter): [Letter, Letter, Letter] {
  return ENEMIES[letter] ?? ENEMIES.X;
}

export function bondCopy(a: Letter, b: Letter, kind: RelationKind): string {
  const key = pairKey(a, b);
  const table = kind === "ally" ? ALLY_COPY : ENEMY_COPY;
  return table[key] ?? "These houses stand in a living argument.";
}

export function bondsOf(letter: Letter): { allies: HouseBond[]; enemies: HouseBond[] } {
  return {
    allies: alliesOf(letter).map((other) => ({
      other,
      kind: "ally" as const,
      copy: bondCopy(letter, other, "ally"),
    })),
    enemies: enemiesOf(letter).map((other) => ({
      other,
      kind: "enemy" as const,
      copy: bondCopy(letter, other, "enemy"),
    })),
  };
}

export function relationTo(from: Letter, to: Letter): RelationKind | null {
  if (alliesOf(from).includes(to)) return "ally";
  if (enemiesOf(from).includes(to)) return "enemy";
  return null;
}

export function houseIndex(letter: Letter): number {
  const index = ALPHABET.indexOf(letter);
  return index >= 0 ? index : 0;
}

export function houseAngle(letter: Letter): number {
  return -Math.PI / 2 + houseIndex(letter) * ((Math.PI * 2) / 26);
}

export function isCircleLetter(value: string | undefined): value is Letter {
  return Boolean(value && ALPHABET.includes(value));
}
