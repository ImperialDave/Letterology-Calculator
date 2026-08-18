import { axisCopy, axisOf, type Axis } from "./axis";
import {
  diphthongsIn,
  elementMixOf,
  geminatesIn,
  hasFinalSigma,
  iotaSubscript,
  letterLineOf,
  roughBreath,
  walkLetters,
  type ElementMix,
  type LetterWalk,
} from "./book";
import { atticOf, type AtticDay } from "./calendar";
import { friendsOfSum, type CanonHit } from "./canon";
import { crossingOf, type Crossing } from "./crossing";
import { likenessOf, type Likeness } from "./cratylus";
import { epithetOf } from "./epithet";
import { familyEnglish } from "./family";
import { erisOf, horaOf, kinOf, type Hora } from "./horae";
import { hymnFaces, hymnOf } from "./hymn";
import { displayStoicheia, foldToStoicheia, isVowel, type Stoich } from "./letters";
import { isopsephy, sitSum, spellQuantity } from "./milesian";
import { motionOf, type MotionReading } from "./motion";
import { somaOffices, weighSoma } from "./soma";
import { tightnessOf, type TightReading } from "./tightness";

export type Road = {
  title: string;
  first: Hora;
  last: Hora;
  closed: boolean;
};

export type Stoicheion = {
  raw: string;
  letters: Stoich[];
  spelled: string;
  axis: Axis;
  axisCopy: string;
  road: Road;
  hymn: ReturnType<typeof hymnFaces>;
  hymnLine: string;
  office: Stoich | null;
  place: Stoich | null;
  officeHora: Hora | null;
  placeHora: Hora | null;
  somaCopy: string;
  kinInName: Stoich[];
  erisInName: Stoich[];
  sum: number;
  omphalos: Stoich;
  omphalosHora: Hora;
  sumSpell: string;
  synthesis: string;
  invitation: string;
  epithet: string;
  likeness: Likeness;
  motion: MotionReading;
  tightness: TightReading;
  crossing: Crossing;
  daimonLine: string;
  friends: CanonHit[];
  day: AtticDay;
  letterWalk: LetterWalk[];
  elementMix: ElementMix;
  diphthongs: ReturnType<typeof diphthongsIn>;
  geminates: ReturnType<typeof geminatesIn>;
  rough: boolean;
  iotaUnder: boolean;
  finalSigma: boolean;
  letterLine: string;
};

function hymnLine(hymn: ReturnType<typeof hymnFaces>): string {
  if (hymn.length === 0) {
    return "This name has no vowels, so there is nothing to sing. The work is all consonants — public and colliding. Do one public act before sunset. Do not invent an inner weather the letters did not write.";
  }
  const faces = hymn.map((item) => `${item.face}`).join(", then ");
  return `The vowels, in order: ${hymn.map((item) => item.letter).join(" · ")}. That is ${faces}. Sing in this order only — do not weigh the vowels as points. When a day asks for one of these faces, that step is on duty; the others wait.`;
}

function somaCopy(office: Stoich | null, place: Stoich | null): string {
  if (!office) {
    return "This name is almost all vowels, so the public work is thin. Borrow one public act from a collaborator or a room that already has body. Do not fake a heavy consonant you do not carry.";
  }
  const officeHora = horaOf(office);
  const kind = familyEnglish(office);
  if (!place) {
    return `The heaviest consonant is ${office} — ${kind} — so the public work is ${officeHora.noun}: ${officeHora.myth} One letter is doing all the public work.`;
  }
  const placeHora = horaOf(place);
  return `The heaviest consonant is ${office} — ${kind} — so the office is ${officeHora.noun}. ${officeHora.invitation} The next is the place of work: ${placeHora.realm} (${placeHora.noun}). Do the office in that place. Do not swap them.`;
}

export function roadOf(axis: Axis): Road {
  const first = horaOf(axis.proodos);
  const last = horaOf(axis.epistrophe);
  const title = axis.closed ? `${first.noun}, a closed road` : `${first.noun} toward ${last.noun}`;
  return { title, first, last, closed: axis.closed };
}

function kinAndEris(letters: Stoich[]): { kin: Stoich[]; eris: Stoich[] } {
  const set = new Set(letters);
  const kin: Stoich[] = [];
  const eris: Stoich[] = [];
  for (const letter of set) {
    if (kinOf(letter).some((item) => set.has(item))) kin.push(letter);
    if (erisOf(letter).some((item) => set.has(item))) eris.push(letter);
  }
  return { kin, eris };
}

function synthesize(input: {
  raw: string;
  road: Road;
  axis: Axis;
  hymn: ReturnType<typeof hymnFaces>;
  officeHora: Hora | null;
  placeHora: Hora | null;
  omphalosHora: Hora;
  sumSpell: string;
  mix: ElementMix;
  motionLine: string;
}): string {
  const start = input.axis.entersAsBreath ? "starts on a vowel" : "starts on a consonant";
  const end = input.axis.finishesAsBlow ? "ends on a consonant" : "ends on a vowel";
  const hymn =
    input.hymn.length === 0
      ? "There is no vowel sequence to sing."
      : `The vowels go ${input.hymn.map((item) => item.face).join(", then ")}.`;
  const work = input.officeHora
    ? input.placeHora
      ? `Public work: ${input.officeHora.noun} in the place of ${input.placeHora.noun}.`
      : `Public work belongs with ${input.officeHora.noun}.`
    : "Public work is thin — borrow one civic act.";
  const mouth =
    input.mix.tied.length > 1
      ? `The letters split between ${input.mix.tied.join(" and ")}.`
      : `Most of the letters are ${input.mix.lead}.`;
  const finish = input.road.closed
    ? "Finish what you start before you open a second door."
    : `Enter as ${input.road.first.noun}; leave as ${input.road.last.noun}.`;
  return `${input.raw.trim()} is the road of ${input.road.title}. The name ${start} and ${end}. ${hymn} ${work} ${mouth} The total is ${input.sumSpell}, which lands on ${input.omphalosHora.noun} — the hour of the sum, not a lucky digit. ${finish} ${input.motionLine}`;
}

function composeInvitation(input: {
  road: Road;
  officeHora: Hora | null;
  placeHora: Hora | null;
  motion: string;
  omphalosHora: Hora;
}): string {
  const enter = input.road.first.invitation;
  const work = input.officeHora
    ? input.placeHora
      ? `Do the office of ${input.officeHora.noun} in the place of ${input.placeHora.noun} — do not swap them.`
      : input.officeHora.invitation
    : "Borrow one public act; the name is light on consonants.";
  const finish = input.road.closed
    ? "The road returns to the same hour — finish what you start before sunset."
    : `Leave as ${input.road.last.noun}: ${input.road.last.invitation}`;
  return `${enter} ${work} ${finish}`;
}

export function readStoicheion(raw: string, when: Date = new Date()): Stoicheion | null {
  const letters = foldToStoicheia(raw);
  const axis = axisOf(letters);
  if (!axis) return null;
  const { office, place } = somaOffices(letters);
  const sum = isopsephy(letters);
  const omphalos = sitSum(sum);
  const omphalosHora = horaOf(omphalos);
  const hymn = hymnFaces(letters);
  const road = roadOf(axis);
  const officeHora = office ? horaOf(office) : null;
  const placeHora = place ? horaOf(place) : null;
  const inside = kinAndEris(letters);
  const weights = weighSoma(letters);
  const motion = motionOf(hymn.map((item) => item.planet));
  const likeness = likenessOf(weights, road.last);
  const tightness = tightnessOf({
    closed: road.closed,
    letters,
    weights,
    motion: motion.motion,
    hymn,
  });
  const crossing = crossingOf(raw);
  const epithet = epithetOf({
    first: road.first,
    last: road.last,
    axis,
    hymn,
    motion: motion.motion,
  });
  const friends = friendsOfSum(sum);
  const daimonLine = `Add the letter-values and the sum lands on ${omphalosHora.noun}. That is the hour of the total, not a soulmate. ${omphalosHora.gift} When it fails: ${omphalosHora.shadow} Do this: ${omphalosHora.invitation}`;
  const letterWalk = walkLetters(letters);
  const elementMix = elementMixOf(letters);
  const diphthongs = diphthongsIn(letters);
  const geminates = geminatesIn(letters);
  const rough = roughBreath(raw);
  const iotaUnder = iotaSubscript(raw);
  const finalSigma = hasFinalSigma(raw);
  const letterLine = letterLineOf({
    mix: elementMix,
    diphthongs,
    geminates,
    rough,
    iotaUnder,
    finalSigma,
  });
  return {
    raw: raw.trim(),
    letters,
    spelled: displayStoicheia(letters),
    axis,
    axisCopy: axisCopy(axis),
    road,
    hymn,
    hymnLine: hymnLine(hymn),
    office,
    place,
    officeHora,
    placeHora,
    somaCopy: somaCopy(office, place),
    kinInName: inside.kin,
    erisInName: inside.eris,
    sum,
    omphalos,
    omphalosHora,
    sumSpell: spellQuantity(sum),
    synthesis: synthesize({
      raw: raw.trim(),
      road,
      axis,
      hymn,
      officeHora,
      placeHora,
      omphalosHora,
      sumSpell: spellQuantity(sum),
      mix: elementMix,
      motionLine: motion.line,
    }),
    invitation: composeInvitation({
      road,
      officeHora,
      placeHora,
      motion: motion.line,
      omphalosHora,
    }),
    epithet,
    likeness,
    motion,
    tightness,
    crossing,
    daimonLine,
    friends,
    day: atticOf(when),
    letterWalk,
    elementMix,
    diphthongs,
    geminates,
    rough,
    iotaUnder,
    finalSigma,
    letterLine,
  };
}

export function vowelCount(letters: Stoich[]): number {
  return letters.filter((letter) => isVowel(letter)).length;
}

export function consonantWeights(letters: Stoich[]) {
  return weighSoma(letters);
}

export function hymnSequence(letters: Stoich[]): Stoich[] {
  return hymnOf(letters);
}
