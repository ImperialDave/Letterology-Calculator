import assert from "node:assert/strict";
import test from "node:test";
import { axisOf } from "./axis";
import { hymnOf } from "./hymn";
import { HORAE } from "./horae";
import {
  BOOK,
  bookComplete,
  diphthongsIn,
  elementMixOf,
  geminatesIn,
  hasFinalSigma,
  iotaSubscript,
  roughBreath,
  walkLetters,
} from "./book";
import { foldToStoicheia, HORA_MARKS, letterFromMark, markOf, STOICHEIA } from "./letters";
import { portraitOf } from "./portrait";
import { isopsephy, sitSum, spellQuantity } from "./milesian";
import { readStoicheion } from "./engine";
import { dayOfStoicheion } from "./day";
import { familyOf, sameFamily } from "./family";
import { walkOf, spellDigits } from "../letterology/count";
import { readAgon } from "./agon";
import { friendsOfSum, CANON, sumOfCanon } from "./canon";
import { festivalOf } from "./festival";
import { readXenia } from "./xenia";

test("there are twenty-four stoicheia, not twenty-six", () => {
  assert.equal(STOICHEIA.length, 24);
  assert.equal(HORAE.length, 24);
});

test("Ἰησοῦς isopsephy is 888", () => {
  const letters = foldToStoicheia("Ἰησοῦς");
  assert.deepEqual(letters, ["Ι", "Η", "Σ", "Ο", "Υ", "Σ"]);
  assert.equal(isopsephy(letters), 888);
});

test("fold of Apollo starts Α and is not a Latin triad", () => {
  const letters = foldToStoicheia("Apollo");
  assert.equal(letters[0], "Α");
  assert.ok(letters.includes("Π"));
  const reading = readStoicheion("Apollo");
  assert.ok(reading);
  assert.equal(reading.axis.proodos, "Α");
  assert.equal(hymnOf(letters).join(""), "ΑΟΟ");
});

test("the hymn is sung in order, not by weight", () => {
  assert.deepEqual(hymnOf(foldToStoicheia("Αθηνά")), ["Α", "Η", "Α"]);
});

test("a closed rite begins and ends on the same stoicheion", () => {
  const axis = axisOf(foldToStoicheia("Άννα"));
  assert.ok(axis);
  assert.equal(axis.closed, true);
});

test("Milesian spelling is not the Latin Count", () => {
  assert.notEqual(spellQuantity(2026), "BFBF");
  assert.match(spellQuantity(2026), /[Α-Ωϛϟϡʹ]/);
  assert.equal(sitSum(888), sitSum(888));
});

test("xenia can see a crossed axis", () => {
  const pair = readXenia("Apollo", "Olympia");
  assert.ok(pair);
  assert.ok(["hearth", "road", "contest", "mystery", "exile", "symposium", "omen"].includes(pair.weather));
  assert.ok(pair.title.length > 8);
  assert.ok(pair.owe.length > 12);
});

test("Π is kin-related to Β and Φ", () => {
  assert.equal(familyOf("Π"), "unvoiced-stop");
  assert.ok(sameFamily("Π", "Β"));
  assert.ok(sameFamily("Π", "Φ"));
});

test("a name has a spoken road", () => {
  const reading = readStoicheion("Apollo");
  assert.ok(reading);
  assert.match(reading.road.title, /toward|closed road/);
  assert.match(reading.synthesis, /Apollo/);
});

test("888 does not fold to a single digit seat", () => {
  assert.notEqual(sitSum(888), sitSum(8));
});

test("day reading is deterministic", () => {
  const when = new Date("2026-08-14T21:00:00");
  const a = readStoicheion("Apollo", when);
  const b = readStoicheion("Apollo", when);
  assert.ok(a && b);
  const dayA = dayOfStoicheion(a, when);
  const dayB = dayOfStoicheion(b, when);
  assert.equal(dayA.headline, dayB.headline);
  assert.equal(dayA.weather, dayB.weather);
  assert.doesNotMatch(dayA.headline, /^Year /);
});

test("Latin walk of a year is not the Milesian spelling", () => {
  assert.notEqual(walkOf(2026n).chain.join(""), spellQuantity(2026));
  assert.notEqual(spellDigits("2026").join(""), spellQuantity(2026));
});

test("closed road: first equals last", () => {
  const reading = readStoicheion("Άννα");
  assert.ok(reading);
  assert.equal(reading.road.closed, true);
});

test("every hour has a published URL mark", () => {
  assert.equal(HORA_MARKS.length, 24);
  for (const letter of STOICHEIA) {
    const mark = markOf(letter);
    assert.equal(letterFromMark(mark), letter);
  }
});

test("xenia writes arrival, table, and leaving", () => {
  const pair = readXenia("Apollo", "Athena");
  assert.ok(pair);
  assert.ok(pair.arrival.length > 10);
  assert.ok(pair.table.length > 10);
  assert.ok(pair.leave.length > 10);
});

test("Apollo and Απόλλων are different roads and epithets", () => {
  const latin = readStoicheion("Apollo");
  const greek = readStoicheion("Απόλλων");
  assert.ok(latin && greek);
  assert.notEqual(latin.spelled, greek.spelled);
  assert.notEqual(latin.epithet, greek.epithet);
  assert.notEqual(latin.axis.epistrophe, greek.axis.epistrophe);
});

test("hymn motion: Athena circuits, Apollo climbs and hardens", () => {
  const athena = readStoicheion("Αθηνά");
  const apollo = readStoicheion("Apollo");
  assert.ok(athena && apollo);
  assert.equal(athena.motion.motion, "periodos");
  assert.equal(apollo.motion.motion, "ascent");
  assert.match(apollo.motion.line, /climb|force/i);
});

test("canon includes Ἰησοῦς at 888 and every entry has a source", () => {
  assert.ok(CANON.length >= 30);
  for (const entry of CANON) {
    assert.ok(entry.source.trim().length > 8, entry.greek);
    assert.ok(sumOfCanon(entry) > 0, entry.greek);
  }
  const hits = friendsOfSum(888);
  assert.ok(hits.some((entry) => entry.greek.includes("Ἰησοῦ") || entry.english === "Jesus"));
});

test("agon heavier total is the larger sum", () => {
  const contest = readAgon("Apollo", "A");
  assert.ok(contest);
  const prize = contest.prizes.find((row) => row.name === "Heavier total");
  assert.ok(prize);
  const heavier = contest.a.sum >= contest.b.sum ? "a" : "b";
  assert.equal(prize.holder, contest.a.sum === contest.b.sum ? "tie" : heavier);
});

test("Anthesterion is the dead at the table", () => {
  const fest = festivalOf("Anthesterion");
  assert.match(fest.line, /dead/i);
});

test("the letter book covers the twenty-four and no more", () => {
  assert.equal(bookComplete(), true);
  assert.equal(Object.keys(BOOK).length, 24);
  for (const letter of STOICHEIA) {
    const book = BOOK[letter];
    assert.ok(book, letter);
    assert.ok(book.mouth.length > 40, letter);
    assert.ok(book.cratylus.length > 40, letter);
    assert.ok(book.asFirst.length > 20, letter);
    assert.ok(book.asLast.length > 20, letter);
    assert.ok(book.asMedial.length > 20, letter);
    assert.equal(book.letter, letter);
  }
});

test("Π is earth, bare, a shut lip", () => {
  const book = BOOK.Π;
  assert.ok(book);
  assert.equal(book.element, "earth");
  assert.equal(book.breath, "bare");
  assert.equal(book.charge, "hold");
  assert.equal(book.place, "lips");
  assert.equal(book.valueBand, "tens");
  const portrait = portraitOf("Π");
  assert.equal(portrait.milesian, 80);
  assert.match(portrait.seriesLine, /Π Β Φ|lip series/);
});

test("walkLetters of Apollo: first Α, last Ο, doubled lambda", () => {
  const letters = foldToStoicheia("Apollo");
  assert.deepEqual(letters, ["Α", "Π", "Ο", "Λ", "Λ", "Ο"]);
  const walk = walkLetters(letters);
  assert.equal(walk[0]?.place, "first");
  assert.equal(walk[0]?.letter, "Α");
  assert.equal(walk[walk.length - 1]?.place, "last");
  assert.equal(walk[walk.length - 1]?.letter, "Ο");
  assert.equal(walk[3]?.place, "medial");
  const gems = geminatesIn(letters);
  assert.equal(gems.length, 1);
  assert.equal(gems[0]?.letter, "Λ");
  const mix = elementMixOf(letters);
  assert.equal(mix.air, 3);
  assert.equal(mix.earth, 1);
  assert.equal(mix.water, 2);
  assert.equal(mix.lead, "air");
});

test("diphthong AI is detected; rough breath is dasia only", () => {
  const ai = diphthongsIn(foldToStoicheia("Aither"));
  assert.ok(ai.some((row) => row.pair === "ΑΙ"));
  assert.equal(roughBreath("Ἑρμῆς"), true);
  assert.equal(roughBreath("Ἰησοῦς"), false);
  assert.equal(roughBreath("Apollo"), false);
  assert.equal(hasFinalSigma("Ἰησοῦς"), true);
  assert.equal(iotaSubscript("τῷ"), true);
  assert.equal(iotaSubscript("τω"), false);
});

test("a Stoicheion carries the letter walk", () => {
  const reading = readStoicheion("Apollo");
  assert.ok(reading);
  assert.equal(reading.letterWalk.length, 6);
  assert.equal(reading.elementMix.lead, "air");
  assert.equal(reading.geminates.length, 1);
  assert.match(reading.letterLine, /air/i);
  assert.match(reading.synthesis, /mostly air/);
});

test("likeness is deterministic", () => {
  const a = readStoicheion("Hestia");
  const b = readStoicheion("Hestia");
  assert.ok(a && b);
  assert.equal(a.likeness.score, b.likeness.score);
  assert.equal(a.tightness.state, b.tightness.state);
});
