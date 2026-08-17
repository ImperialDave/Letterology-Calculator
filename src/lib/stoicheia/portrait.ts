import { BOOK, bookOf, diphthongPartnersOf, type LetterBook } from "./book";
import { familyEnglish, familyOf, seriesOf, type LetterFamily } from "./family";
import { horaOf, type Hora } from "./horae";
import { CHOIR } from "./hymn";
import { STOICHEIA, stoichAt, stoichIndex, type Stoich } from "./letters";
import { milesianValue, spellQuantity } from "./milesian";

export type LetterPortrait = {
  book: LetterBook;
  hora: Hora;
  milesian: number;
  milesianSpell: string;
  family: LetterFamily;
  familyEnglish: string;
  series: Stoich[];
  seriesLine: string;
  prev: Stoich;
  next: Stoich;
  diphthongPartners: ReturnType<typeof diphthongPartnersOf>;
  choir: (typeof CHOIR)[string] | null;
  glance: string;
};

function seriesLineOf(letter: Stoich, series: Stoich[]): string {
  const book = bookOf(letter);
  if (book.breath === "bare" || book.breath === "middle" || book.breath === "aspirate") {
    const known =
      ["Π", "Β", "Φ"].every((item) => item === letter || series.includes(item))
        ? "Π Β Φ — lip series, bare / voiced / breathed"
        : ["Τ", "Δ", "Θ"].every((item) => item === letter || series.includes(item))
          ? "Τ Δ Θ — tooth series, bare / voiced / breathed"
          : ["Κ", "Γ", "Χ"].every((item) => item === letter || series.includes(item))
            ? "Κ Γ Χ — throat series, bare / voiced / breathed"
            : `${[letter, ...series].join(" · ")}`;
    return `${known}. This mark is the ${book.breath} member.`;
  }
  if (book.grammar === "vowel") {
    return `The seven vowels, sung Moon to Saturn: Α Ε Η Ι Ο Υ Ω. ${letter} is ${book.order === 1 ? "the first" : book.letter === "Ω" ? "the last" : "one"} of the choir.`;
  }
  if (series.length === 0) return book.grammarLine;
  return `Same family: ${[letter, ...series].join(" · ")}. ${book.grammarLine}`;
}

export function portraitOf(letter: Stoich): LetterPortrait {
  const book = bookOf(letter);
  const hora = horaOf(letter);
  const series = seriesOf(letter);
  const index = stoichIndex(letter);
  const choir = CHOIR[letter] ?? null;
  return {
    book,
    hora,
    milesian: milesianValue(letter),
    milesianSpell: spellQuantity(milesianValue(letter)),
    family: familyOf(letter),
    familyEnglish: familyEnglish(letter),
    series,
    seriesLine: seriesLineOf(letter, series),
    prev: stoichAt(index - 1),
    next: stoichAt(index + 1),
    diphthongPartners: diphthongPartnersOf(letter),
    choir,
    glance: `${book.spoken} — ${book.does}. ${book.elementLine}`,
  };
}

export function portraits(): LetterPortrait[] {
  return STOICHEIA.map((letter) => portraitOf(letter));
}

export function bookCount(): number {
  return Object.keys(BOOK).length;
}
