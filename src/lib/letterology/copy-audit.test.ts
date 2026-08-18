import assert from "node:assert/strict";
import test from "node:test";
import { BOND_PLAIN, CALENDAR_PLAIN, GLOSSARY, METHOD_PLAIN, WEATHER_COPY } from "./glossary";
import { FORBIDDEN_UI, VOICE } from "./voice";
import { buildHoroscope } from "./engine";
import { tweetReading } from "./share";
import { countMeeting, countReadingOf } from "./count";
import { HOW_TO } from "../stoicheia/copy";
import { readStoicheion } from "../stoicheia/engine";

function scan(label: string, body: string) {
  for (const banned of FORBIDDEN_UI) {
    assert.doesNotMatch(body, banned, `${label} still says ${banned}`);
  }
}

test("door copy follows the voice law", () => {
  scan("VOICE", Object.values(VOICE).join("\n"));
  for (const [key, value] of Object.entries(VOICE)) {
    assert.ok(value.trim().length >= 6, key);
  }
  assert.match(VOICE.homeHero, /username/i);
  assert.match(VOICE.homeHero, /letter/i);
  assert.match(VOICE.footerLine, /luck is willingness|decision is yours/i);
  assert.match(VOICE.countConfessLabel, /regular number/i);
});

test("glossary plains do not speak house-verb", () => {
  for (const entry of GLOSSARY) {
    scan(`glossary ${entry.id}`, entry.plain);
    assert.ok(entry.plain.length > 12, entry.id);
  }
  scan("METHOD_PLAIN", METHOD_PLAIN);
  scan("CALENDAR_PLAIN", CALENDAR_PLAIN);
  scan("BOND_PLAIN", BOND_PLAIN);
  scan("WEATHER", Object.values(WEATHER_COPY).map((row) => row.gloss).join("\n"));
});

test("Latin method says the count out loud", () => {
  const apollo = buildHoroscope("Apollo");
  const ada = buildHoroscope("Ada");
  assert.ok(apollo && ada);
  scan("apollo method", apollo.statements.method);
  scan("ada method", ada.statements.method);
  assert.match(apollo.statements.method, /because|so |that means|that is why|first letter/i);
  assert.match(apollo.archetype.house, /Seeker|House/i);
  assert.ok(tweetReading(apollo).length < 260);
});

test("Greek letter line names the count", () => {
  const apollo = readStoicheion("Apollo");
  const greek = readStoicheion("Απόλλων");
  assert.ok(apollo && greek);
  scan("apollo greek", `${apollo.letterLine} ${apollo.synthesis} ${apollo.daimonLine}`);
  assert.match(apollo.letterLine, /because|so |that means|vowel/i);
  assert.match(apollo.road.title, /toward|closed/i);
  assert.notEqual(apollo.epithet, greek.epithet);
});

test("Count of 2026 never prints the digit on the reading", () => {
  const reading = countReadingOf("2026");
  assert.ok(reading);
  const line = countMeeting(reading.seat, "A");
  scan("count 2026", line);
  assert.doesNotMatch(line, /2026/);
  assert.match(line, /letter|walk|Fool|role|same|help/i);
});

test("HOW_TO stays ordinary English", () => {
  for (const item of HOW_TO) {
    scan(item.term, item.plain);
    assert.match(item.plain, /letter|name|vowel|total|guest|day|consonant|public|office/i);
  }
});
