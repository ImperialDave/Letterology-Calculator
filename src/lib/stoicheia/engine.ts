import { axisCopy, axisOf, type Axis } from "./axis";
import { atticOf, type AtticDay } from "./calendar";
import { horaOf, type Hora } from "./horae";
import { hymnFaces, hymnOf } from "./hymn";
import { displayStoicheia, foldToStoicheia, isVowel, type Stoich } from "./letters";
import { isopsephy, sitSum, spellQuantity } from "./milesian";
import { somaOffices, weighSoma } from "./soma";

export type Stoicheion = {
  raw: string;
  letters: Stoich[];
  spelled: string;
  axis: Axis;
  axisCopy: string;
  hymn: ReturnType<typeof hymnFaces>;
  hymnLine: string;
  office: Stoich | null;
  place: Stoich | null;
  officeHora: Hora | null;
  placeHora: Hora | null;
  somaCopy: string;
  sum: number;
  omphalos: Stoich;
  omphalosHora: Hora;
  sumSpell: string;
  day: AtticDay;
};

function hymnLine(hymn: ReturnType<typeof hymnFaces>): string {
  if (hymn.length === 0) {
    return "This name has no vowels. The choir is silent. The work is all collision.";
  }
  const faces = hymn.map((item) => `${item.letter} (${item.face})`).join(" · ");
  return `The hymn is sung ${faces}. Breath in that order — not by weight.`;
}

function somaCopy(office: Stoich | null, place: Stoich | null): string {
  if (!office) {
    return "This name is almost all breath. The soma is thin. The city will have to lend it a body.";
  }
  const officeHora = horaOf(office);
  if (!place) {
    return `The office is ${officeHora.noun} (${officeHora.greek}). One consonant does all the civic work.`;
  }
  const placeHora = horaOf(place);
  return `The office is ${officeHora.noun}. The place of work is ${placeHora.realm} (${placeHora.noun}).`;
}

export function readStoicheion(raw: string, when: Date = new Date()): Stoicheion | null {
  const letters = foldToStoicheia(raw);
  const axis = axisOf(letters);
  if (!axis) return null;
  const { office, place } = somaOffices(letters);
  const sum = isopsephy(letters);
  const omphalos = sitSum(sum);
  const hymn = hymnFaces(letters);
  return {
    raw: raw.trim(),
    letters,
    spelled: displayStoicheia(letters),
    axis,
    axisCopy: axisCopy(axis),
    hymn,
    hymnLine: hymnLine(hymn),
    office,
    place,
    officeHora: office ? horaOf(office) : null,
    placeHora: place ? horaOf(place) : null,
    somaCopy: somaCopy(office, place),
    sum,
    omphalos,
    omphalosHora: horaOf(omphalos),
    sumSpell: spellQuantity(sum),
    day: atticOf(when),
  };
}

export function vowelCount(letters: Stoich[]): number {
  return letters.filter((letter) => isVowel(letter)).length;
}

export function consonantWeights(letters: Stoich[]) {
  return weighSoma(letters);
}
