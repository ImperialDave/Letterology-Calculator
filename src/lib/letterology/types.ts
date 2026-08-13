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

export type MeetKind = "same" | "ally" | "enemy" | "none";

export type DayWeather =
  | "homecoming"
  | "kinship"
  | "crossing"
  | "friction"
  | "exile"
  | "hinge"
  | "ordinary";

export interface DayReading {
  iso: string;
  weather: DayWeather;
  person: {
    signature: Letter;
    manner: Letter;
    field: Letter;
    title: string;
    house: string;
    displayName: string;
  };
  day: {
    date: Letter;
    fortnight: Letter;
    weekday: Letter;
    weekdayRole: "house" | "ally" | "enemy";
    hinge: boolean;
    fortnightAge: "early" | "mid" | "late";
  };
  climate: { year: Letter; month: Letter };
  relations: {
    toDate: MeetKind;
    toWeekday: MeetKind;
    mannerToFortnight: MeetKind;
  };
  carried: { date: boolean; fortnight: boolean; weekday: boolean };
  headline: string;
  dayJob: string;
  meeting: string;
  manner: string;
  climateNote: string;
  invitation: string;
  fullText: string;
}

export interface Archetype {
  triad: Triad;
  code: string;
  title: string;
  house: string;
  houseLetter: Letter;
  tradition: string;
  myth: string;
  correspondence: string;
  doctrine: string;
  shadow: string;
  gold: string;
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
  allies: Letter[];
  enemies: Letter[];
  kinPresent: Letter[];
  kinAbsent: Letter[];
  crossPresent: Letter[];
  crossAbsent: Letter[];
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
    method: string;
    wheel: string;
    daily: string;
    period: string;
    vowelNote: string;
    consonantNote: string;
  };
}

export const VOWEL_LETTERS = new Set<Letter>(["A", "E", "I", "O", "U"]);
export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
export const MAJOR_FIELDS = ["A", "C", "D", "E", "L", "P", "R", "S", "T"];
