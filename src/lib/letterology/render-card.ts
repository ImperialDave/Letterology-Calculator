import { readFileSync } from "node:fs";
import { join } from "node:path";
import { houseOf } from "./archetypes";
import { almanacOf, parseIso } from "./calendar";
import { alliesOf, enemiesOf } from "./circle";
import { compareNames } from "./compatibility";
import { countReadingOf, formatWalk, readingFromSlug } from "./count";
import { readStoicheion } from "../stoicheia/engine";
import { horaOf } from "../stoicheia/horae";
import { letterFromMark } from "../stoicheia/letters";
import { readXenia } from "../stoicheia/xenia";
import { dayReadingOf } from "./day-reading";
import { bondSvg, glyphSvg, portraitSvg } from "./share-card";
import { portraitOf, slugToName } from "./share";
import { themeOf } from "./lexicon";
import { ALPHABET } from "./types";

const cache = new Map<string, Uint8Array>();
const CACHE_CAP = 200;

function fontPath(): string | undefined {
  const candidates = [
    join(process.cwd(), "public/fonts/SourceSerif4-Regular.ttf"),
    join(process.cwd(), ".output/public/fonts/SourceSerif4-Regular.ttf"),
  ];
  for (const path of candidates) {
    try {
      readFileSync(path);
      return path;
    } catch {
      // try next
    }
  }
  return undefined;
}

async function pngToJpeg(png: Buffer): Promise<Uint8Array> {
  const sharp = (await import("sharp")).default;
  const jpeg = await sharp(png).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  return new Uint8Array(jpeg);
}

export type CardSpec =
  | { kind: "portrait"; slug: string; date?: string }
  | { kind: "house"; letter: string }
  | { kind: "circle"; letter: string }
  | { kind: "letter"; letter: string }
  | { kind: "day"; date: string }
  | { kind: "bond"; a: string; b: string }
  | { kind: "count"; digits?: string; slug?: string }
  | { kind: "stoicheia"; name: string }
  | { kind: "stoicheia-hora"; mark: string }
  | { kind: "stoicheia-xenia"; a: string; b: string };

export function parseCardFile(file: string): CardSpec | null {
  const trimmed = file.trim().toLowerCase();
  const jpg = trimmed.endsWith(".jpg") ? trimmed.slice(0, -4) : trimmed;
  const day = jpg.match(/^day-(\d{4}-\d{2}-\d{2})$/);
  if (day) return { kind: "day", date: day[1] };
  const glyph = jpg.match(/^(house|circle|letter)-([a-z])$/);
  if (glyph) {
    const letter = glyph[2].toUpperCase();
    if (!ALPHABET.includes(letter)) return null;
    return { kind: glyph[1] as "house" | "circle" | "letter", letter: letter };
  }
  const countDigits = jpg.match(/^count-(\d+(?:d\d+)?)$/);
  if (countDigits) return { kind: "count", digits: countDigits[1] };
  const stoicheia = jpg.match(/^stoicheia-name-(.+)$/);
  if (stoicheia) return { kind: "stoicheia", name: stoicheia[1].replace(/-/g, " ") };
  const horaCard = jpg.match(/^stoicheia-hora-([a-z]+)$/);
  if (horaCard) return { kind: "stoicheia-hora", mark: horaCard[1] };
  const xeniaCard = jpg.match(/^stoicheia-xenia-(.+)-(.+)$/);
  if (xeniaCard) return { kind: "stoicheia-xenia", a: xeniaCard[1].replace(/-/g, " "), b: xeniaCard[2].replace(/-/g, " ") };
  const countWalk = jpg.match(/^count-((?:w-)?[a-z]+)$/);
  if (countWalk) return { kind: "count", slug: countWalk[1] };
  const bond = jpg.match(/^bond-([^_]+)_([^_]+)$/);
  if (bond) return { kind: "bond", a: bond[1], b: bond[2] };
  const dated = jpg.match(/^([a-z0-9''’-]+)-(\d{4}-\d{2}-\d{2})$/);
  if (dated) return { kind: "portrait", slug: dated[1], date: dated[2] };
  if (!jpg || jpg.includes(".")) return null;
  return { kind: "portrait", slug: jpg };
}

export async function renderPortraitJpeg(file: string): Promise<Uint8Array | null> {
  const parsed = parseCardFile(file);
  if (!parsed) return null;
  const cached = cache.get(file.toLowerCase());
  if (cached) return cached;

  let svg: string | null = null;
  if (parsed.kind === "stoicheia-hora") {
    const letter = letterFromMark(parsed.mark);
    if (!letter) return null;
    const hora = horaOf(letter);
    svg = glyphSvg({
      letter: hora.letter,
      kicker: "ΣΤΟΙΧΕΙΑ · HOUR",
      title: hora.noun,
      line: hora.myth,
    });
  } else if (parsed.kind === "stoicheia-xenia") {
    const pair = readXenia(parsed.a, parsed.b);
    if (!pair) return null;
    svg = glyphSvg({
      letter: pair.a.axis.proodos,
      kicker: "ΣΤΟΙΧΕΙΑ · TWO NAMES",
      title: pair.title,
      line: pair.copy,
    });
  } else if (parsed.kind === "stoicheia") {
    const reading = readStoicheion(parsed.name);
    if (!reading) return null;
    svg = glyphSvg({
      letter: reading.axis.proodos,
      kicker: "ΣΤΟΙΧΕΙΑ",
      title: reading.road.title,
      line: reading.synthesis,
    });
  } else if (parsed.kind === "count") {
    const reading = parsed.slug
      ? readingFromSlug(parsed.slug)
      : countReadingOf((parsed.digits ?? "").replace("d", "."));
    if (!reading) return null;
    const house = houseOf(reading.seat);
    const walk = formatWalk(reading.walk) || "the blank";
    svg = glyphSvg({
      letter: reading.seat,
      kicker: "THE COUNT",
      title: house.house,
      line: `${walk}. ${house.myth}`,
    });
  } else if (parsed.kind === "bond") {
    const bond = compareNames(slugToName(parsed.a), slugToName(parsed.b));
    if (!bond) return null;
    svg = bondSvg({
      aLetter: bond.a.signature,
      bLetter: bond.b.signature,
      aName: bond.a.displayName,
      bName: bond.b.displayName,
      aHouse: bond.seats[0].aNoun,
      bHouse: bond.seats[0].bNoun,
      title: bond.title,
      affinity: bond.affinity,
      headline: bond.headline,
      line: bond.invitation,
    });
  } else if (parsed.kind === "portrait") {
    const name = slugToName(parsed.slug);
    const horoscope = portraitOf(name);
    if (!horoscope) return null;
    const civil = parseIso(parsed.date);
    const day = parsed.date ? dayReadingOf(horoscope, civil ?? undefined) : null;
    svg = portraitSvg(horoscope, day && parsed.date ? day.headline : undefined);
  } else if (parsed.kind === "house" || parsed.kind === "circle") {
    const house = houseOf(parsed.letter);
    const allies = alliesOf(parsed.letter).join(" · ");
    const enemies = enemiesOf(parsed.letter).join(" · ");
    svg = glyphSvg({
      letter: parsed.letter,
      kicker: parsed.kind === "circle" ? "CIRCLE OF HOUSES" : "HOUSE",
      title: house.house,
      line:
        parsed.kind === "circle"
          ? `Allies ${allies}. Enemies ${enemies}.`
          : house.myth,
    });
  } else if (parsed.kind === "letter") {
    const theme = themeOf(parsed.letter);
    svg = glyphSvg({
      letter: parsed.letter,
      kicker: "LETTER ATLAS",
      title: `${parsed.letter} — ${theme.name}`,
      line: theme.essence,
    });
  } else {
    const civil = parseIso(parsed.date);
    if (!civil) return null;
    const day = almanacOf(civil);
    const house = houseOf(day.dateLetter);
    svg = glyphSvg({
      letter: day.dateLetter,
      kicker: day.iso.toUpperCase(),
      title: house.house,
      line: house.myth,
    });
  }
  if (!svg) return null;

  const { Resvg } = await import("@resvg/resvg-js");
  const font = fontPath();
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
    font: font
      ? { fontFiles: [font], defaultFontFamily: "Noto Serif", loadSystemFonts: true }
      : { loadSystemFonts: true },
    background: "#efe6d6",
  });
  const jpeg = await pngToJpeg(Buffer.from(resvg.render().asPng()));

  if (cache.size >= CACHE_CAP) {
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }
  cache.set(file.toLowerCase(), jpeg);
  return jpeg;
}

export function jpegResponse(body: Uint8Array, method: string): Response {
  const headers = {
    "Content-Type": "image/jpeg",
    "Content-Length": String(body.byteLength),
    "Cache-Control": "public, max-age=86400",
  };
  if (method === "HEAD") return new Response(null, { status: 200, headers });
  const bytes = Uint8Array.from(body);
  return new Response(bytes, { status: 200, headers });
}
