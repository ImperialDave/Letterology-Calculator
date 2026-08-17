import { isVowel, type Stoich } from "./letters";

export type Planet = "moon" | "mercury" | "venus" | "sun" | "mars" | "jupiter" | "saturn";

export const CHOIR: Record<
  string,
  { planet: Planet; face: string; god: string; line: string }
> = {
  Α: {
    planet: "moon",
    face: "Selene",
    god: "Σελήνη",
    line: "Becoming, night-mind, the tide that does not ask permission. Α is the first dark after the fire is banked — not a sunrise. What starts here is allowed to be unfinished.",
  },
  Ε: {
    planet: "mercury",
    face: "Hermes",
    god: "Ἑρμῆς",
    line: "Crossing, speech, the theft of a meaning that was locked. Ε is the messenger and the thief: it carries a word across a boundary and will not pretend the boundary was not there.",
  },
  Η: {
    planet: "venus",
    face: "Aphrodite",
    god: "Ἀφροδίτη",
    line: "The long vowel of desire. Binding that is not yet a chain. Η holds two things close without owning them — if you let it. Stay long enough to see whether it is love or a net.",
  },
  Ι: {
    planet: "sun",
    face: "Helios",
    god: "Ἥλιος",
    line: "A single shaft. The piercing that makes a day visible. Ι does not warm the room; it shows what is in it. Tell the true thing, then leave room for the body that hears it.",
  },
  Ο: {
    planet: "mars",
    face: "Ares",
    god: "Ἄρης",
    line: "The closed circle of force. A mouth that has decided. Ο does not keep options open. Fight the thing that is actually on you, and put the rest down.",
  },
  Υ: {
    planet: "jupiter",
    face: "Zeus",
    god: "Ζεύς",
    line: "The high, the wet, the law that still weathers. Υ is Zeus as sky, not as a fist: a rule that can still welcome a stranger. Keep one promise to someone who cannot pay you back.",
  },
  Ω: {
    planet: "saturn",
    face: "Kronos",
    god: "Κρόνος",
    line: "The last harvest. Time that eats what it loved. Ω is an ending that does not need theatre. Name the one thing that is already over, and let it be over.",
  },
};

export function hymnOf(letters: Stoich[]): Stoich[] {
  return letters.filter((letter) => isVowel(letter));
}

export function hymnFaces(letters: Stoich[]) {
  return hymnOf(letters).map((letter) => ({
    letter,
    ...(CHOIR[letter] ?? CHOIR.Α),
  }));
}
