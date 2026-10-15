import assert from "node:assert/strict";
import test from "node:test";
import { dayCardOf } from "./day-card";
import { dayReadingOf } from "./day-reading";
import { buildHoroscope } from "./engine";
import { luckOf } from "./luck";
import { WEATHER_COPY } from "./glossary";
import { buildCardSvg, parseCardFile } from "./render-card";
import { portraitPageMeta } from "./share";

const WHEN = { year: 2026, month: 9, day: 14 };

test("day card keeps the score, the weather word, and three short moves", () => {
  const horoscope = buildHoroscope("Ada Lovelace");
  assert.ok(horoscope);
  const card = dayCardOf(horoscope, WHEN);
  const luck = luckOf(horoscope, WHEN);
  assert.ok(card);
  assert.equal(card.score, luck.score);
  assert.equal(card.iso, "2026-10-14");
  assert.equal(card.dateLabel, "WED 14 OCT");
  assert.ok(Object.values(WEATHER_COPY).some((row) => row.label === card.weatherLabel));
  for (const line of [card.do, card.wait, card.ask]) {
    assert.ok(line.length > 0 && line.length <= 34, line);
    assert.equal(line.includes(";") || line.includes("…"), false, line);
  }
  assert.doesNotMatch(card.wait, /\b(you|have|not|or|the|a)$/i);
  assert.match(card.ask, /^a [A-Z]/);
  assert.doesNotMatch(card.ask, /finish|gift/i);
  assert.doesNotMatch(card.do, /^lean into/i);
  assert.doesNotMatch(card.wait, /^wait on/i);
});

test("dated card svg is the poster, not the essay or the identity portrait", () => {
  const horoscope = buildHoroscope("Ada Lovelace");
  assert.ok(horoscope);
  const card = dayCardOf(horoscope, WHEN);
  const day = dayReadingOf(horoscope, WHEN);
  const luck = luckOf(horoscope, WHEN);
  assert.ok(card && day);
  const dated = buildCardSvg("ada-lovelace-2026-10-14.jpg");
  const plain = buildCardSvg("ada-lovelace.jpg");
  assert.ok(dated && plain);
  assert.match(dated, new RegExp(card.weatherLabel));
  assert.match(dated, new RegExp(`>${card.roleLetter}<`));
  assert.match(dated, new RegExp(`>${card.dateLetter}<`));
  assert.match(dated, /Ada Lovelace/);
  assert.match(dated, new RegExp(card.verdict));
  assert.match(dated, new RegExp(`>${card.score}<`));
  assert.doesNotMatch(dated, /SITS THE HOUSE/);
  assert.match(plain, /SITS THE HOUSE/);
  assert.doesNotMatch(dated, /Lean into/);
  const job = day.dayJob.slice(0, 48);
  const why = luck.why.slice(0, 48);
  const climate = day.climateNote.slice(0, 48);
  assert.ok(job.length > 24 && why.length > 24 && climate.length > 24);
  assert.equal(dated.includes(job), false);
  assert.equal(dated.includes(why), false);
  assert.equal(dated.includes(climate), false);
});

test("card files keep a dated portrait apart from the undated one", () => {
  assert.deepEqual(parseCardFile("eric-2026-10-14.jpg"), {
    kind: "portrait",
    slug: "eric",
    date: "2026-10-14",
  });
  assert.deepEqual(parseCardFile("eric.jpg"), { kind: "portrait", slug: "eric" });
  assert.deepEqual(parseCardFile("day-2026-10-14.jpg"), { kind: "day", date: "2026-10-14" });
});

test("portrait head points at the dated card only when the date is real", () => {
  const dated = portraitPageMeta("Ada Lovelace", "2026-10-14");
  const plain = portraitPageMeta("Ada Lovelace");
  const junk = portraitPageMeta("Ada Lovelace", "nope");
  assert.ok(dated && plain && junk);
  const image = (meta: { meta: Array<Record<string, string>> }) =>
    meta.meta.find((item) => item.property === "og:image")?.content ?? "";
  const url = (meta: { meta: Array<Record<string, string>> }) =>
    meta.meta.find((item) => item.property === "og:url")?.content ?? "";
  assert.match(image(dated), /\/og\/ada-lovelace-2026-10-14\.jpg$/);
  assert.match(url(dated), /\/p\/ada-lovelace\?date=2026-10-14$/);
  assert.match(image(plain), /\/og\/ada-lovelace\.jpg$/);
  assert.doesNotMatch(url(plain), /date=/);
  assert.match(image(junk), /\/og\/ada-lovelace\.jpg$/);
  assert.ok((dated.title ?? "").length <= 70);
});
