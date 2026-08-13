import { buildHoroscope } from "./engine";
import type { Horoscope } from "./types";

const MAX_SLUG = 80;

export function nameToSlug(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}'’-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, MAX_SLUG);
}

export function slugToName(slug: string): string {
  let raw = slug;
  try {
    raw = decodeURIComponent(slug);
  } catch {
    raw = slug;
  }
  return raw.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
}

export function portraitOf(name: string): Horoscope | null {
  const cleaned = name.trim();
  if (!cleaned) return null;
  return buildHoroscope(cleaned);
}

export function serverOrigin(): string {
  const fromEnv = String(import.meta.env.VITE_PUBLIC_HOSTNAME ?? "")
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  if (fromEnv) return `https://${fromEnv}`;
  if (import.meta.env.PROD) return "https://www.letterology.club";
  return "http://localhost:8080";
}

export function portraitPath(name: string): string {
  const slug = nameToSlug(name);
  return `/p/${encodeURIComponent(slug)}`;
}

export function portraitUrl(name: string, origin = serverOrigin()): string {
  return `${origin}${portraitPath(name)}`;
}

export function cardImageUrl(name: string, origin = serverOrigin()): string {
  return `${origin}/api/card?n=${encodeURIComponent(name.trim())}`;
}

export function tweetText(h: Horoscope): string {
  const [house, manner, field] = h.triad;
  return `${h.displayName} sits the ${h.archetype.house}\n${house} · ${manner} · ${field} — house, manner, field`;
}

export function xIntentUrl(h: Horoscope, origin = serverOrigin()): string {
  const url = new URL("https://x.com/intent/post");
  url.searchParams.set("text", tweetText(h));
  url.searchParams.set("url", portraitUrl(h.displayName, origin));
  return url.toString();
}

export function portraitDescription(h: Horoscope): string {
  const [house, manner, field] = h.triad;
  const myth = h.archetype.myth.replace(/\s+/g, " ").trim();
  return `${h.archetype.title}. ${house} sits the house, ${manner} is the manner, ${field} is the field. ${myth}`;
}

export function portraitTitle(h: Horoscope): string {
  return `${h.displayName} · ${h.archetype.title}`;
}
