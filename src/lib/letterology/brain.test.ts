import assert from "node:assert/strict";
import test from "node:test";
import {
  ASPECT_NAME,
  BRAIN_GRADES,
  BRAIN_ITEM_COUNT,
  DOMAIN_META,
  GRADE_CAPTION,
  GRADE_LEGEND,
  GUEST_NAME,
  ITEMS,
  LOOKING_PER_DOMAIN,
  TRAIT_PER_ASPECT,
  answersFromDeck,
  decodeAnswers,
  displayPoles,
  encodeAnswers,
  gradeOf,
  markOf,
  plusLean,
  presentDeck,
  readBrain,
  toCanonical,
  tweetBrain,
  verdictOf,
  verdictOfGrade,
  type BrainAspectId,
  type BrainChoice,
  type BrainDomainId,
} from "./brain";
import { parseCardFile } from "./render-card";
import { FORBIDDEN_UI } from "./voice";

function scan(label: string, body: string) {
  for (const banned of FORBIDDEN_UI) {
    assert.doesNotMatch(body, banned, `${label} still says ${banned}`);
  }
  assert.doesNotMatch(body, /\bcult\b/i, label);
  assert.doesNotMatch(body, /left-brain|right-brain|hemisphere/i, label);
  assert.doesNotMatch(body, /\b(openness|conscientiousness|extraversion|agreeableness|neuroticism|ocean|mbti|myers|briggs|big five)\b/i, label);
}

function fill(choice: BrainChoice): BrainChoice[] {
  return Array.from({ length: BRAIN_ITEM_COUNT }, () => choice);
}

function lookingToward(letter: boolean): BrainChoice[] {
  return ITEMS.map((item) => {
    if (item.kind !== "looking") return 2;
    return letter ? 0 : 4;
  }) as BrainChoice[];
}

function highAspect(id: BrainAspectId, rest = 2 as BrainChoice): BrainChoice[] {
  return ITEMS.map((item) => {
    if (item.kind === "looking") return 2;
    if (item.aspect === id) return 0;
    return rest;
  }) as BrainChoice[];
}

test("the inventory has fifty items: four per aspect and two looking items per seat", () => {
  assert.equal(ITEMS.length, BRAIN_ITEM_COUNT);
  const ids = new Set(ITEMS.map((item) => item.id));
  assert.equal(ids.size, BRAIN_ITEM_COUNT);
  for (const id of Object.keys(DOMAIN_META) as BrainDomainId[]) {
    const rows = ITEMS.filter((item) => item.domain === id);
    assert.equal(rows.length, TRAIT_PER_ASPECT * 2 + LOOKING_PER_DOMAIN, id);
    const [a, b] = DOMAIN_META[id].aspects;
    assert.equal(ITEMS.filter((item) => item.kind === "trait" && item.aspect === a).length, TRAIT_PER_ASPECT);
    assert.equal(ITEMS.filter((item) => item.kind === "trait" && item.aspect === b).length, TRAIT_PER_ASPECT);
    assert.equal(ITEMS.filter((item) => item.kind === "looking" && item.domain === id).length, LOOKING_PER_DOMAIN);
  }
  assert.equal(ITEMS.filter((item) => item.kind === "looking").length, 10);
  assert.equal(ITEMS.filter((item) => item.kind === "trait").length, 40);
});

test("all Letter-looking answers read as Letter-brained with an A+", () => {
  const reading = readBrain(lookingToward(true));
  assert.ok(reading);
  assert.equal(reading.verdict, "letter");
  assert.equal(reading.grade, "A+");
  assert.match(reading.gradeCaption, /perfect Letter brain/i);
  assert.equal(reading.name, GUEST_NAME);
  assert.ok(reading.guest);
});

test("all number-looking answers read as number-brained with an F", () => {
  const reading = readBrain(lookingToward(false), "Ada");
  assert.ok(reading);
  assert.equal(reading.verdict, "number");
  assert.equal(reading.grade, "F");
  assert.match(reading.gradeCaption, /led by numbers/i);
  assert.equal(reading.name, "Ada");
});

test("a mixed looking set is circuit-kept", () => {
  const reading = readBrain(fill(2), "@lovelace");
  assert.ok(reading);
  assert.equal(reading.verdict, "circuit");
  assert.equal(reading.name, "lovelace");
  assert.equal(verdictOfGrade(reading.grade), "circuit");
});

test("a high Wonder profile does not drag every seat with it", () => {
  const reading = readBrain(highAspect("wonder"), "Ada");
  assert.ok(reading);
  const wonder = reading.aspects.find((row) => row.id === "wonder");
  const file = reading.aspects.find((row) => row.id === "file");
  const warmth = reading.aspects.find((row) => row.id === "warmth");
  assert.ok(wonder && file && warmth);
  assert.equal(wonder.mark, "strong");
  assert.equal(file.mark, "mixed");
  assert.equal(warmth.mark, "mixed");
  assert.match(reading.title, /Wonder/);
  assert.match(reading.pattern, /Wonder leads/);
  assert.equal(reading.verdict, "circuit");
});

test("an even profile does not pretend one aspect is the whole type", () => {
  const reading = readBrain(fill(2), "Ada");
  assert.ok(reading);
  assert.equal(reading.title, "Circuit-kept");
  assert.match(reading.pattern, /close together/);
});

test("Crossing and The File can disagree in the same person", () => {
  const answers = ITEMS.map((item) => {
    if (item.kind === "looking") return 2;
    if (item.aspect === "crossing") return 0;
    if (item.aspect === "file") return 4;
    return 2;
  }) as BrainChoice[];
  const reading = readBrain(answers, "Ada");
  assert.ok(reading);
  const keeping = reading.domains.find((row) => row.id === "keeping");
  assert.ok(keeping);
  assert.equal(keeping.combo, "HL");
  assert.equal(keeping.louder, "crossing");
  assert.match(keeping.gold, /cross/i);
});

test("grades run from A+ to F and match the three verdicts", () => {
  assert.deepEqual(BRAIN_GRADES, ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"]);
  assert.equal(gradeOf(100), "A+");
  assert.equal(gradeOf(0), "F");
  assert.equal(markOf(80), "strong");
  assert.equal(markOf(50), "mixed");
  assert.equal(markOf(10), "quiet");
  for (let lean = 0; lean <= 100; lean++) {
    assert.equal(verdictOf(lean), verdictOfGrade(gradeOf(lean)), String(lean));
  }
  for (const grade of BRAIN_GRADES) {
    assert.match(GRADE_CAPTION[grade], /Letter brain|Letter-brained|circuit|number brain|Number-brained|Led by numbers/i);
  }
  assert.match(GRADE_LEGEND, /A\+ is a perfect Letter brain/);
  assert.match(GRADE_LEGEND, /led by numbers/);
});

test("each session shuffles order and puts half the plus poles on the right", () => {
  const a = presentDeck(7);
  const b = presentDeck(99);
  assert.equal(a.length, BRAIN_ITEM_COUNT);
  assert.equal(b.length, BRAIN_ITEM_COUNT);
  const orderA = a.map((row) => row.item.id).join("");
  const orderB = b.map((row) => row.item.id).join("");
  assert.notEqual(orderA, orderB);
  assert.deepEqual(
    a.map((row) => row.item.id).sort(),
    ITEMS.map((item) => item.id).sort(),
  );
  const flips = a.filter((row) => row.flip).length;
  assert.equal(flips, 25);
  const leftIsPlus = a.filter((row) => !row.flip).length;
  assert.equal(leftIsPlus, 25);
  const same = presentDeck(7);
  assert.deepEqual(
    same.map((row) => [row.item.id, row.flip]),
    a.map((row) => [row.item.id, row.flip]),
  );
});

test("displayed answers convert back to canonical plus-on-zero", () => {
  assert.equal(toCanonical(0, false), 0);
  assert.equal(toCanonical(4, false), 4);
  assert.equal(toCanonical(0, true), 4);
  assert.equal(toCanonical(4, true), 0);
  assert.equal(toCanonical(2, true), 2);
  const deck = presentDeck(33);
  const displayed = deck.map((row) => (row.flip ? 0 : 4)) as BrainChoice[];
  const canonical = answersFromDeck(deck, displayed);
  canonical.forEach((choice) => assert.equal(choice, 4));
  const reading = readBrain(canonical);
  assert.ok(reading);
  assert.equal(reading.grade, "F");
});

test("poles describe two working styles instead of a nice answer and a bad one", () => {
  const body = ITEMS.flatMap((item) => [item.plus, item.minus]).join("\n");
  assert.doesNotMatch(
    body,
    /clerk|spreadsheet|probably wrong|performance of being|condemn|swallow it as fate|right bin|crown me|follower count|the person is probably/i,
  );
});

test("answers round-trip through the URL token", () => {
  const answers = fill(0).map((_, i) => (i % 5) as BrainChoice);
  const token = encodeAnswers(answers);
  assert.equal(token.length, BRAIN_ITEM_COUNT);
  assert.deepEqual(decodeAnswers(token), answers);
  assert.equal(decodeAnswers("12"), null);
  assert.equal(decodeAnswers("c".repeat(25)), null);
  assert.equal(decodeAnswers("x".repeat(BRAIN_ITEM_COUNT)), null);
});

test("copy stays in club English", () => {
  const reading = readBrain(fill(1), "Ada");
  assert.ok(reading);
  const body = [
    ...ITEMS.flatMap((item) => [item.prompt, item.plus, item.minus]),
    reading.title,
    reading.headline,
    reading.pattern,
    reading.invitation,
    ...reading.domains.flatMap((row) => [row.gold, row.shadow, row.job, row.markName]),
    ...reading.aspects.flatMap((row) => [row.name, row.job, row.markName]),
    ...Object.values(ASPECT_NAME),
    tweetBrain(reading),
    GRADE_LEGEND,
    ...BRAIN_GRADES.map((grade) => GRADE_CAPTION[grade]),
  ].join("\n");
  scan("brain", body);
  assert.ok(tweetBrain(reading).length < 260);
  assert.doesNotMatch(tweetBrain(reading), /\d/);
  assert.doesNotMatch(GRADE_LEGEND, /\d/);
  assert.equal(plusLean(0), 100);
  assert.equal(plusLean(4), 0);
  const poles = displayPoles(ITEMS[0]!, true);
  assert.equal(poles.left, ITEMS[0]!.minus);
});

test("a brain card file parses", () => {
  const token = encodeAnswers(fill(2));
  assert.deepEqual(parseCardFile(`brain-${token}.jpg`), { kind: "brain", token });
});
