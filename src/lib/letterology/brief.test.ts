import assert from "node:assert/strict";
import test from "node:test";
import {
  BRIEF_FOOTER,
  CIRCUIT_CLOSE,
  EXAMPLE_HANDLE,
  NEVER_SAY,
  SAY_THIS,
  briefSlides,
} from "./brief";
import { FORBIDDEN_UI } from "./voice";
import { buildHoroscope } from "./engine";

function scan(label: string, body: string) {
  for (const banned of FORBIDDEN_UI) {
    assert.doesNotMatch(body, banned, `${label} still says ${banned}`);
  }
}

function isComplete(line: string) {
  return /[.?!]["”']?$/.test(line.trim());
}

test("the brief is fourteen slides of complete sentences", () => {
  const slides = briefSlides();
  assert.equal(slides.length, 14);
  for (const slide of slides) {
    assert.ok(slide.title.trim().length > 2, slide.id);
    assert.ok(slide.paragraphs.length >= 2, slide.id);
    for (const paragraph of slide.paragraphs) {
      assert.ok(isComplete(paragraph), `${slide.id}: ${paragraph}`);
    }
    for (const note of slide.notes) {
      assert.ok(isComplete(note), `${slide.id} note: ${note}`);
    }
    scan(slide.id, [...slide.paragraphs, ...slide.notes].join("\n"));
  }
  scan("never", NEVER_SAY.join("\n"));
  scan("say", SAY_THIS.join("\n"));
  assert.match(CIRCUIT_CLOSE, /decision is yours/i);
  assert.match(BRIEF_FOOTER, /letterology\.club/);
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
});

test("the brief never prints cult or hemisphere talk", () => {
  const body = briefSlides()
    .flatMap((slide) => [slide.title, ...slide.paragraphs, ...slide.notes])
    .join("\n");
  assert.doesNotMatch(body, /\bcult\b/i);
  assert.doesNotMatch(body, /left-brain|right-brain|hemisphere/i);
  assert.match(body, /Master/);
  assert.match(body, /Emissary/);
  assert.match(body, /Numerology/);
});

test("never-say and say-this are paired", () => {
  assert.equal(NEVER_SAY.length, SAY_THIS.length);
  assert.equal(NEVER_SAY.length, 6);
});
