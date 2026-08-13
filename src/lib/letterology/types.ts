export type Letter = string;

export interface LetterTheme {
  letter: Letter;
  name: string;
  keywords: [string, string, string, string];
  essence: string;
  inner: string;
  outer: string;
  gift: string;
  challenge: string;
  invitation: string;
  complements: Letter[];
}

export interface NamePart {
  original: string;
  letters: string;
}

export interface LetterInventory {
  letter: Letter;
  count: number;
  weight: number;
  firstIndex: number;
  isVowel: boolean;
  isSignature: boolean;
  isInitial: boolean;
}

export interface TensionPair {
  a: Letter;
  b: Letter;
  title: string;
  copy: string;
}

export type Triad = [Letter, Letter, Letter];

export interface Archetype {
  triad: Triad;
  code: string;
  title: string;
  house: string;
  houseLetter: Letter;
  tradition: string;
  myth: string;
  summary: string;
  portrait: string;
  invitation: string;
}

export interface Horoscope {
  displayName: string;
  normalized: string;
  parts: NamePart[];
  signature: Letter;
  primary: LetterInventory;
  secondaries: LetterInventory[];
  inventory: LetterInventory[];
  vowels: LetterInventory[];
  consonants: LetterInventory[];
  tension: TensionPair | null;
  shadows: Letter[];
  gifts: Letter[];
  daily: Letter;
  period: Letter;
  triad: Triad;
  archetype: Archetype;
  kindred: Archetype[];
  statements: {
    primary: string;
    gifts: string;
    challenge: string;
    synthesis: string;
    daily: string;
    period: string;
    vowelNote: string;
    consonantNote: string;
  };
}

export const VOWEL_LETTERS = new Set<Letter>(["A", "E", "I", "O", "U"]);
export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
export const MAJOR_FIELDS = ["A", "C", "D", "E", "L", "P", "R", "S", "T"];
