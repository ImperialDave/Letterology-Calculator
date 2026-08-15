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
    line: "Becoming, night-mind, the tide that does not ask permission.",
  },
  Ε: {
    planet: "mercury",
    face: "Hermes",
    god: "Ἑρμῆς",
    line: "Crossing, speech, the theft of a meaning that was locked.",
  },
  Η: {
    planet: "venus",
    face: "Aphrodite",
    god: "Ἀφροδίτη",
    line: "The long vowel of desire. Binding that is not yet a chain.",
  },
  Ι: {
    planet: "sun",
    face: "Helios",
    god: "Ἥλιος",
    line: "A single shaft. The piercing that makes a day visible.",
  },
  Ο: {
    planet: "mars",
    face: "Ares",
    god: "Ἄρης",
    line: "The closed circle of force. A mouth that has decided.",
  },
  Υ: {
    planet: "jupiter",
    face: "Zeus",
    god: "Ζεύς",
    line: "The high, the wet, the law that still weathers.",
  },
  Ω: {
    planet: "saturn",
    face: "Kronos",
    god: "Κρόνος",
    line: "The last harvest. Time that eats what it loved.",
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
