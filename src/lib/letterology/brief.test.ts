import assert from "node:assert/strict";
import test from "node:test";
import {
  BRIEF_FOOTER,
  CIRCUIT_CLOSE,
  EXAMPLE_HANDLE,
  NEVER_SAY,
  SAY_THIS,
  briefSlides,
  toRoman,
} from "./brief";
import { FORBIDDEN_UI } from "./voice";
import { buildHoroscope } from "./engine";

function scan(label: string, body: string) {
  for (const banned of FORBIDDEN_UI) {
    assert.doesNotMatch(body, banned, `${label} still says ${banned}`);
  }
}

function teachingVoice(slides: ReturnType<typeof briefSlides>): string {
  return slides
    .flatMap((slide) => [
      slide.kicker,
      slide.title,
      slide.lede ?? "",
      ...slide.paragraphs,
      ...slide.notes,
      slide.left?.kicker ?? "",
      slide.left?.title ?? "",
      slide.left?.body ?? "",
      slide.right?.kicker ?? "",
      slide.right?.title ?? "",
      slide.right?.body ?? "",
      ...(slide.path ?? []).flatMap((mark) => [mark.label, mark.line]),
    ])
    .join("\n");
}

function stripNamedEnemy(body: string): string {
  return body.replace(/number-brained|number brain|Numerology/gi, "X");
}

function isComplete(line: string) {
  return /[.?!]["”']?$/.test(line.trim());
}

test("the brief is a real deck, not a stack of slogans", () => {
  const slides = briefSlides();
  assert.ok(slides.length >= 12);
  assert.equal(slides[0]?.layout, "hero");
  assert.ok(slides.some((slide) => slide.layout === "compare"));
  assert.ok(slides.some((slide) => slide.id === "brains"));
  for (const slide of slides) {
    assert.ok(slide.title.trim().length > 2, slide.id);
    assert.ok(slide.paragraphs.length >= 1, slide.id);
    for (const paragraph of slide.paragraphs) {
      assert.ok(isComplete(paragraph), `${slide.id}: ${paragraph}`);
    }
    for (const note of slide.notes) {
      assert.ok(isComplete(note), `${slide.id} note: ${note}`);
    }
    scan(slide.id, teachingVoice([slide]));
  }
  scan("never", NEVER_SAY.join("\n"));
  scan("say", SAY_THIS.join("\n"));
  assert.match(CIRCUIT_CLOSE, /decision is yours/i);
  assert.match(BRIEF_FOOTER, /letterology\.club/);
});

test("the brief does not speak in count-language", () => {
  const body = stripNamedEnemy(teachingVoice(briefSlides()));
  assert.doesNotMatch(body, /\bcounts?\b/i);
  assert.doesNotMatch(body, /\bcounting\b/i);
  assert.doesNotMatch(body, /\bdigit/i);
  assert.doesNotMatch(body, /\btally/i);
  assert.doesNotMatch(body, /\bscoreboard\b/i);
  assert.doesNotMatch(body, /\bscores?\b/i);
  assert.doesNotMatch(body, /\bsums?\b/i);
  assert.doesNotMatch(body, /\bheaviest\b/i);
  assert.doesNotMatch(body, /\bweight\b/i);
  assert.doesNotMatch(body, /\btwenty-six\b/i);
  assert.doesNotMatch(body, /\bthe count\b/i);
  assert.doesNotMatch(body, /\blucky number/i);
});

test("the brief can say what a Letter brain is, and what a number brain is", () => {
  const brains = briefSlides().find((slide) => slide.id === "brains");
  assert.ok(brains);
  assert.ok(brains.left);
  assert.ok(brains.right);
  assert.match(brains.left.body, /living thing|face|username/i);
  assert.match(brains.right.body, /filed|rank|drawer/i);
  assert.match(brains.paragraphs.join(" "), /Master/);
  assert.match(brains.paragraphs.join(" "), /Emissary/);
});

test("the worked example matches the live engine", () => {
  const reading = buildHoroscope(EXAMPLE_HANDLE);
  assert.ok(reading);
  const example = briefSlides().find((slide) => slide.id === "example");
  assert.ok(example);
  const body = example.paragraphs.join(" ");
  assert.match(body, new RegExp(reading.triad.join(".*")));
  assert.match(body, /Lover|Seeker|Rebel|Caregiver/i);
  assert.doesNotMatch(body, /cult/i);
  assert.equal(example.path?.length, 3);
});

test("the brief never prints cult or hemisphere talk", () => {
  const body = teachingVoice(briefSlides());
  assert.doesNotMatch(body, /\bcult\b/i);
  assert.doesNotMatch(body, /left-brain|right-brain|hemisphere/i);
});

test("never-say and say-this are paired", () => {
  assert.equal(NEVER_SAY.length, SAY_THIS.length);
  assert.equal(NEVER_SAY.length, 6);
});

test("quantities on the brief are Roman, except the club name", () => {
  assert.equal(toRoman(1), "I");
  assert.equal(toRoman(2), "II");
  assert.equal(toRoman(4), "IV");
  assert.equal(toRoman(15), "XV");
  assert.equal(toRoman(1000), "M");
  const body = teachingVoice(briefSlides()).replace(/CC33/g, "");
  assert.doesNotMatch(body, /\d/);
});
