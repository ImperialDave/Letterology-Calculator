import assert from "node:assert/strict";
import test from "node:test";
import {
  BRAIN_ITEM_COUNT,
  DOMAIN_META,
  GUEST_NAME,
  ITEMS,
  decodeAnswers,
  encodeAnswers,
  itemLean,
  orderedItems,
  readBrain,
  tweetBrain,
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
}

function fill(choice: BrainChoice): BrainChoice[] {
  return Array.from({ length: BRAIN_ITEM_COUNT }, () => choice);
}

function pole(letter: boolean): BrainChoice[] {
  return orderedItems().map((item) => {
    if (letter) return item.reverse ? 4 : 0;
    return item.reverse ? 0 : 4;
  }) as BrainChoice[];
}

test("the quiz has twenty-five items covering five domains and both aspects", () => {
  assert.equal(ITEMS.length, BRAIN_ITEM_COUNT);
  assert.equal(orderedItems().length, BRAIN_ITEM_COUNT);
  const ids = new Set(ITEMS.map((item) => item.id));
  assert.equal(ids.size, BRAIN_ITEM_COUNT);
  for (const id of Object.keys(DOMAIN_META) as BrainDomainId[]) {
    const rows = ITEMS.filter((item) => item.domain === id);
    assert.equal(rows.length, 5, id);
    const [a, b] = DOMAIN_META[id].aspects;
    assert.ok(rows.some((item) => item.aspect === a), `${id} ${a}`);
    assert.ok(rows.some((item) => item.aspect === b), `${id} ${b}`);
  }
});

test("all-letter answers read as Letter-brained", () => {
  const reading = readBrain(pole(true));
  assert.ok(reading);
  assert.equal(reading.verdict, "letter");
  assert.match(reading.verdictName, /Letter-brained/);
  assert.ok(reading.lean >= 62);
  assert.equal(reading.name, GUEST_NAME);
  assert.ok(reading.guest);
});

test("all-number answers read as number-brained", () => {
  const items = orderedItems();
  const answers = pole(false);
  const reading = readBrain(answers, "Ada");
  assert.ok(reading);
  assert.equal(reading.verdict, "number");
  assert.equal(reading.name, "Ada");
  assert.ok(reading.lean <= 38);
  items.forEach((item, index) => {
    assert.ok(itemLean(item, answers[index]!) <= 25);
  });
});

test("a mixed set is circuit-kept", () => {
  const answers = fill(2);
  const reading = readBrain(answers, "@lovelace");
  assert.ok(reading);
  assert.equal(reading.verdict, "circuit");
  assert.equal(reading.name, "lovelace");
  assert.ok(reading.lean >= 40 && reading.lean <= 60);
});

test("answers round-trip through the URL token", () => {
  const answers = fill(0).map((_, i) => (i % 5) as BrainChoice);
  const token = encodeAnswers(answers);
  assert.equal(token.length, BRAIN_ITEM_COUNT);
  assert.deepEqual(decodeAnswers(token), answers);
  assert.equal(decodeAnswers("12"), null);
  assert.equal(decodeAnswers("x".repeat(BRAIN_ITEM_COUNT)), null);
  assert.equal(decodeAnswers("2".repeat(BRAIN_ITEM_COUNT)), null);
});

test("copy stays in club English", () => {
  const reading = readBrain(fill(1), "Ada");
  assert.ok(reading);
  const body = [
    ...ITEMS.flatMap((item) => [item.prompt, item.letter, item.number]),
    reading.title,
    reading.headline,
    reading.invitation,
    ...reading.domains.flatMap((row) => [row.gold, row.shadow, row.job]),
    tweetBrain(reading),
  ].join("\n");
  scan("brain", body);
  assert.ok(tweetBrain(reading).length < 260);
});

test("a brain card file parses", () => {
  const token = encodeAnswers(fill(2));
  assert.deepEqual(parseCardFile(`brain-${token}.jpg`), { kind: "brain", token });
});
