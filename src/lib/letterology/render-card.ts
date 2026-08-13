import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseIso } from "./calendar";
import { dayReadingOf } from "./day-reading";
import { portraitSvg } from "./share-card";
import { portraitOf, slugToName } from "./share";

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

export function parseCardFile(file: string): { slug: string; date?: string } | null {
  const trimmed = file.trim().toLowerCase();
  const jpg = trimmed.endsWith(".jpg") ? trimmed.slice(0, -4) : trimmed;
  const dated = jpg.match(/^([a-z0-9''’-]+)-(\d{4}-\d{2}-\d{2})$/);
  if (dated) return { slug: dated[1], date: dated[2] };
  if (!jpg || jpg.includes(".")) return null;
  return { slug: jpg };
}

export async function renderPortraitJpeg(file: string): Promise<Uint8Array | null> {
  const parsed = parseCardFile(file);
  if (!parsed) return null;
  const cached = cache.get(file.toLowerCase());
  if (cached) return cached;

  const name = slugToName(parsed.slug);
  const horoscope = portraitOf(name);
  if (!horoscope) return null;

  const civil = parseIso(parsed.date);
  const day = parsed.date ? dayReadingOf(horoscope, civil ?? undefined) : null;
  // Standing card uses the archetype myth, not the day's weather line.
  const svg = portraitSvg(horoscope, day && parsed.date ? day.headline : undefined);

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
