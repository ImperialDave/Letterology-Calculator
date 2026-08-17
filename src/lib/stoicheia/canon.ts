import { foldToStoicheia } from "./letters";
import { isopsephy } from "./milesian";

export type CanonEntry = {
  greek: string;
  english: string;
  source: string;
};

/** Famous names and words. Sums are computed by our Milesian table, never invented. */
export const CANON: CanonEntry[] = [
  { greek: "Ἰησοῦς", english: "Jesus", source: "Christian isopsephy; Ἰησοῦς = 888 in Milesian" },
  { greek: "Χριστός", english: "Christ", source: "Christian isopsephy of Χριστός" },
  { greek: "θεός", english: "god", source: "common Milesian total of θεός" },
  { greek: "ἀγάπη", english: "love", source: "Milesian of ἀγάπη" },
  { greek: "Αδάμ", english: "Adam", source: "Milesian of Αδάμ" },
  { greek: "Νείλος", english: "the Nile", source: "ancient isopsephy of Νείλος as a year-count" },
  { greek: "ἀμήν", english: "amen", source: "Milesian of ἀμήν" },
  { greek: "κόσμος", english: "cosmos", source: "Milesian of κόσμος" },
  { greek: "ἥλιος", english: "the sun", source: "Milesian of ἥλιος" },
  { greek: "σελήνη", english: "the moon", source: "Milesian of σελήνη" },
  { greek: "Απόλλων", english: "Apollo", source: "Milesian of Απόλλων" },
  { greek: "Αθηνά", english: "Athena", source: "Milesian of Αθηνά" },
  { greek: "Ζεύς", english: "Zeus", source: "Milesian of Ζεύς" },
  { greek: "Ἑρμῆς", english: "Hermes", source: "Milesian of Ἑρμῆς" },
  { greek: "Ἑκάτη", english: "Hekate", source: "Milesian of Ἑκάτη" },
  { greek: "Ἑστία", english: "Hestia", source: "Milesian of Ἑστία" },
  { greek: "Νέρον", english: "Nero", source: "the Nero isopsephy game in Greek graffiti" },
  { greek: "Μαρία", english: "Maria", source: "Milesian of Μαρία" },
  { greek: "Πέτρος", english: "Peter", source: "Milesian of Πέτρος" },
  { greek: "λόγος", english: "word / reason", source: "Milesian of λόγος" },
  { greek: "ψυχή", english: "soul", source: "Milesian of ψυχή" },
  { greek: "μοῖρα", english: "portion / fate", source: "Milesian of μοῖρα" },
  { greek: "νίκη", english: "victory", source: "Milesian of νίκη" },
  { greek: "εἰρήνη", english: "peace", source: "Milesian of εἰρήνη" },
  { greek: "θάνατος", english: "death", source: "Milesian of θάνατος" },
  { greek: "Διόνυσος", english: "Dionysos", source: "Milesian of Διόνυσος" },
  { greek: "Περσεφόνη", english: "Persephone", source: "Milesian of Περσεφόνη" },
  { greek: "Δημήτηρ", english: "Demeter", source: "Milesian of Δημήτηρ" },
  { greek: "Ἀφροδίτη", english: "Aphrodite", source: "Milesian of Ἀφροδίτη" },
  { greek: "Ἄρτεμις", english: "Artemis", source: "Milesian of Ἄρτεμις" },
  { greek: "Ποσειδῶν", english: "Poseidon", source: "Milesian of Ποσειδῶν" },
  { greek: "Ἥρα", english: "Hera", source: "Milesian of Ἥρα" },
  { greek: "Ἄρης", english: "Ares", source: "Milesian of Ἄρης" },
  { greek: "Ἥφαιστος", english: "Hephaistos", source: "Milesian of Ἥφαιστος" },
  { greek: "Τύχη", english: "Fortune", source: "Milesian of Τύχη" },
  { greek: "Θέμις", english: "Themis", source: "Milesian of Θέμις" },
  { greek: "Νέμεσις", english: "Nemesis", source: "Milesian of Νέμεσις" },
  { greek: "Ὕπνος", english: "Sleep", source: "Milesian of Ὕπνος" },
  { greek: "Νύξ", english: "Night", source: "Milesian of Νύξ" },
  { greek: "Ἑλένη", english: "Helen", source: "Milesian of Ἑλένη" },
];

export type CanonHit = CanonEntry & { sum: number };

export function sumOfCanon(entry: CanonEntry): number {
  return isopsephy(foldToStoicheia(entry.greek));
}

export function canonWithSums(): CanonHit[] {
  return CANON.map((entry) => ({ ...entry, sum: sumOfCanon(entry) })).filter((entry) => entry.sum > 0);
}

export function friendsOfSum(sum: number): CanonHit[] {
  return canonWithSums().filter((entry) => entry.sum === sum);
}
