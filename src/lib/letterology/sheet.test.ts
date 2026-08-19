import assert from "node:assert/strict";
import test from "node:test";
import { buildHoroscope } from "./engine";
import {
  FIELD_VOICE,
  GREEK_STEPS,
  LATIN_STEPS,
  LUCK_BANDS,
  NEVER_SAY,
  greekHours,
  latinHouses,
  sheetPlainText,
  speakGreek,
  speakLatin,
} from "./sheet";
import { FORBIDDEN_UI } from "./voice";
import { readStoicheion } from "../stoicheia/engine";

function scan(label: string, body: string) {
  for (const banned of FORBIDDEN_UI) {
    assert.doesNotMatch(body, banned, `${label} still says ${banned}`);
  }
}

test("the field sheet has twenty-six houses and twenty-four hours", () => {
  assert.equal(latinHouses().length, 26);
  assert.equal(greekHours().length, 24);
  assert.equal(LATIN_STEPS.length, 5);
  assert.equal(GREEK_STEPS.length, 5);
  assert.equal(LUCK_BANDS[0]?.band, "open");
});

test("sheet copy obeys the voice law", () => {
  const body = [
    FIELD_VOICE.map((row) => row.line).join("\n"),
    LATIN_STEPS.map((row) => row.line).join("\n"),
    GREEK_STEPS.map((row) => row.line).join("\n"),
    NEVER_SAY.join("\n"),
    sheetPlainText("la"),
    sheetPlainText("el"),
  ].join("\n");
  scan("field sheet", body);
});

test("a Latin spoken card names the role and the path", () => {
  const h = buildHoroscope("@lovelace");
  assert.ok(h);
  const spoken = speakLatin(h);
  assert.match(spoken, /lovelace/i);
  assert.match(spoken, new RegExp(h.triad.join("")));
  assert.match(spoken, /Seeker|Caregiver|Rebel|Hermit|Explorer|Fool|Creator|Prophet|Sage|Hero|Orphan|Lover|Warrior|Healer|Priestess|Ruler|Mystic|Bard|Weaver|Alchemist|Peacemaker|Oracle|Innocent|Trickster|Shapeshifter|Magician/);
  scan("speak latin", spoken);
});

test("a Greek spoken card names first, last, and the charge", () => {
  const s = readStoicheion("Apollo");
  assert.ok(s);
  const spoken = speakGreek(s);
  assert.match(spoken, /Apollo|ΑΠΟΛΛΟ/i);
  assert.match(spoken, new RegExp(`${s.axis.proodos}.+${s.axis.epistrophe}`));
  scan("speak greek", spoken);
});

