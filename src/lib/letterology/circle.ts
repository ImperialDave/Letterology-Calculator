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
    "The Seeker starts. The Hermit makes sure the start is a real decision, not a panic.",
  "A-E":
    "The Seeker leaves an old self. The Explorer leaves an old map. Together they stop confusing a familiar cage with a home.",
  "A-J":
    "Wanting becomes a journey only when you accept a real cost and plan to come back. The Hero is what the Seeker grows into if the crossing is finished.",
  "B-K":
    "The Caregiver builds the table the Orphan once stood outside. Kinship here is a craft: a spare chair, not blood.",
  "B-N":
    "Holding and healing are one job. Both keep people able to continue — including the one who tends.",
  "B-S":
    "The Weaver gives the Caregiver a weave that can breathe. The Caregiver gives the weave a place to be warm.",
  "C-F":
    "A clean no and an unowned mind. Rebellion that has not become a brand. Freedom that can still refuse.",
  "C-T":
    "The Rebel names the dead rule. The Alchemist agrees to let the dead form actually die.",
  "C-X":
    "The Rebel strikes the match. The Trickster checks that the rule was actually lying before anything burns.",
  "D-I":
    "The Hermit goes quiet. The Sage will not let what is found stay private forever.",
  "D-Q":
    "Two ways into the same quiet: solitude, and a question that will not be rushed.",
  "E-J":
    "The Explorer opens the miles. The Hero agrees to be changed by them and still come home.",
  "E-Y":
    "A wider world needs a self that can turn. Together they keep a life from freezing into one costume.",
  "F-W":
    "Beginner's mind and first light. A new start that still has eyes.",
  "F-Y":
    "Lightness that can still choose a form. A form that has not forgotten how to be light.",
  "G-L":
    "Making is love with hands. The Creator and the Lover refuse a life that only watches.",
  "G-N":
    "What is tended grows. The grove and the garden are the same work from two sides.",
  "G-O":
    "Living work needs a rim that is not a wall. The Priestess knows how to keep that circle.",
  "H-K":
    "A people is both spoken and fed. The Prophet's hard word and the Orphan's table — conscience with a place to sit.",
  "H-R":
    "The far word needs a true note. Prophet and Bard restore a group to the vow it had begun to live against.",
  "H-V":
    "The Prophet names what is coming. The Oracle gives that picture a next step.",
  "I-Q":
    "Insight that would rather be accurate than impressive, and a question you can live near.",
  "I-S":
    "The Sage sees the pattern. The Weaver sits down and joins it.",
  "J-M":
    "The Hero returns with something useful. The Warrior knows which fight was worth the dust.",
  "K-N":
    "Both remember what absence costs, so they know how to make a place.",
  "L-O":
    "Desire that has a rim. Mystery that still has a body.",
  "L-U":
    "The Lover's heat in the Peacemaker's bowl — warmth that does not require anyone to shrink.",
  "M-P":
    "Force that has agreed to serve. Order that can still fight for the land.",
  "M-U":
    "A clean fight and a bowl that can bear a quarrel. Peace is not the absence of a spine.",
  "O-W":
    "Holy space that has not agreed to be bored. Wonder that has somewhere to arrive.",
  "P-U":
    "Rule that includes the ones who disagree, or it is only a hat.",
  "P-Z":
    "The crown and the peak. Power that can become ordinary again.",
  "Q-Z":
    "The unspeakable, then one practical act. Union with the real is not finished until it can wash a dish.",
  "R-S":
    "A people remember themselves by a note they can enter and a joining they can live inside.",
  "R-V":
    "What is received in private must be said aloud. The Oracle's picture; the Bard's pitch.",
  "T-X":
    "Necessary fire, and the messenger who will not let the official story stay too clean.",
  "T-Z":
    "The Alchemist clears the false. The Magician makes the true usable.",
  "V-X":
    "The Oracle's picture will not become a statue while the Trickster is in the room.",
  "W-Y":
    "Innocence that can change shape without lying about what it already knows.",
};

const ENEMY_COPY: Record<string, string> = {
  "A-B":
    "Love looks like a reason to stay, and like a reason to grow. Neither is wrong. Both become a lid if they win alone.",
  "A-N":
    "The drive to become can starve what already needs feeding. The duty to tend can postpone the life that is trying to start.",
  "A-P":
    "A beginning refuses an order that has begun to impersonate destiny. Order calls the beginning a child.",
  "B-C":
    "Loyalty names change a betrayal. Change names loyalty a lid. The living bond knows which day it is.",
  "B-O":
    "Home can colonize the sacred. The sacred can treat a living room as a draft.",
  "C-P":
    "Dead law and live revolt. A culture needs both, and dies when either becomes a personality.",
  "C-U":
    "The Rebel fears a peace that muzzles. The Peacemaker fears a fire with no vessel. Both fears have a point.",
  "D-F":
    "Depth despises lightness and calls it stupidity. The Fool will not be buried in a private hoard and call it wisdom.",
  "D-L":
    "Solitude can become contempt. Love can become a refusal to go down.",
  "D-M":
    "The Hermit will not be marched. The Warrior will not wait for a perfect silence that never arrives.",
  "E-K":
    "The Explorer's air can feel like abandonment. The Orphan's table can feel like a pretty cage.",
  "E-M":
    "One motion has no enemy. The other is lost without one. Speed and space can both refuse to arrive.",
  "E-R":
    "Distance that will not be sung. A song that will not travel. Someone has to write.",
  "F-P":
    "The Fool will not be scheduled. The Ruler cannot govern mood and still sleep.",
  "F-S":
    "Freedom that will not be woven. A cloth that wants a vow.",
  "G-Q":
    "A made thing can flee the real. The cloister can refuse to make anything and call the emptiness holy.",
  "G-T":
    "Increase, and the death that lets the next form live. Make, or undo. The argument that grows a soul.",
  "G-X":
    "The Creator wants a season. The Trickster will not promise one. Both keep the work from becoming a factory.",
  "H-N":
    "Looking far can neglect the person already hungry. Feeding can treat the future as a luxury.",
  "H-U":
    "Vision can become a stick you use on the present. Peace can become a muzzle you call kindness.",
  "H-Y":
    "The Prophet needs a stable hearer. The Shapeshifter will not be a statue of the message.",
  "I-L":
    "Insight without heat. Heat without a sentence. Each thinks the other is a child.",
  "I-V":
    "Insight hoarded, vocation displayed — the same seeing, two vanities, one unused village.",
  "I-W":
    "Advice that has forgotten astonishment. Wonder that will not think. Wisdom splits and both halves thin.",
  "J-K":
    "Going that will not write home. Belonging that treats every journey as betrayal. The living answer writes, then goes.",
  "J-Q":
    "A quest of dust versus a quest of the unspeakable. Each can despise the other's idea of a true crossing.",
  "J-W":
    "A hero who cannot play. An innocent who will not pay a cost. Courage without wonder. Wonder without a spine.",
  "K-X":
    "Belonging that closes. Exile that becomes a brand.",
  "L-Y":
    "Fidelity can freeze. The hinge can refuse to land. Love wants both heat and a living form.",
  "M-Z":
    "A war that cannot end. A will that cannot come down. Both forget that power must become ordinary again.",
  "N-T":
    "The Healer will not torch what still lives. The Alchemist will not keep a corpse at the table and call it care.",
  "O-T":
    "The Priestess fears a fire with no rite. The Alchemist fears a rite with no death. Mystery needs heat and a bowl.",
  "O-X":
    "A circle that polices mystery. A trick that will not let a room ripen.",
  "Q-W":
    "Mysticism that has forgotten first light. Innocence that will not go into the dark.",
  "R-U":
    "The Bard will not paper a sharp grief. The Peacemaker fears a song that splits the table.",
  "R-Z":
    "Art that will not be aimed. Magic that treats people as an audience.",
  "S-V":
    "Shared pattern versus a picture received in private. Both can colonize the other.",
  "S-Y":
    "A weave that cannot bear a new shape. A self that will not be a thread.",
  "V-Z":
    "Sight that will not act. Will that will not see.",
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
  return table[key] ?? "These houses argue. Both have a point.";
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

