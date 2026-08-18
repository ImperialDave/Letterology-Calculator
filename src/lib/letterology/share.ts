import { CLUB_NAME } from "./brand";
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
    .slice(0, MAX_SLUG)
    .toLowerCase();
}

export function slugToName(slug: string): string {
  let raw = slug;
  try {
    raw = decodeURIComponent(slug);
  } catch {
    raw = slug;
  }
  return raw
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\S+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));
}

export function portraitOf(name: string): Horoscope | null {
  const cleaned = name.trim();
  if (!cleaned) return null;
  return buildHoroscope(cleaned);
}

export function publicSiteOrigin(): string {
  const env = (import.meta as { env?: { PROD?: boolean; VITE_PUBLIC_HOSTNAME?: string } }).env ?? {};
  if (env.PROD) return "https://www.letterology.club";
  const fromEnv = String(env.VITE_PUBLIC_HOSTNAME ?? "")
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  if (fromEnv) return `https://${fromEnv}`;
  return "http://localhost:8080";
}

/** @deprecated use publicSiteOrigin */
export function serverOrigin(): string {
  return publicSiteOrigin();
}

export function portraitPath(name: string): string {
  const slug = nameToSlug(name);
  return `/p/${encodeURIComponent(slug)}`;
}

export function portraitUrl(name: string, origin = publicSiteOrigin()): string {
  return `${origin}${portraitPath(name)}`;
}

export function bondPath(a: string, b: string): string {
  return `/two?a=${encodeURIComponent(a.trim())}&b=${encodeURIComponent(b.trim())}`;
}

export function bondUrl(a: string, b: string, origin = publicSiteOrigin()): string {
  return `${origin}${bondPath(a, b)}`;
}

export function bondCardFile(a: string, b: string): string {
  return `bond-${nameToSlug(a)}_${nameToSlug(b)}.jpg`;
}

export function bondCardImageUrl(a: string, b: string, origin = publicSiteOrigin()): string {
  return `${origin}/og/${bondCardFile(a, b)}`;
}

export function cardImageUrl(name: string, origin = publicSiteOrigin(), date?: string): string {
  const slug = nameToSlug(name);
  if (date) return `${origin}/og/${slug}-${date}.jpg`;
  return `${origin}/og/${slug}.jpg`;
}

export const X_TITLE_MAX = 70;
export const X_DESC_MAX = 160;
const TCO = 23;

export function clip(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

/**
 * Caption + blank line + www URL for the clipboard.
 * Intent uses `text` + `url` separately so X does not double the link.
 * Budget is a free 280-character post after one t.co wrapper.
 */
export function composeXPost(
  caption: string,
  url: string,
): { caption: string; text: string; href: string } {
  const reserved = TCO + 2;
  let body = caption.replace(/\s+\n/g, "\n").trim();
  const budget = 280 - reserved;
  if (body.length > budget) body = `${body.slice(0, Math.max(0, budget - 1)).trimEnd()}…`;
  const text = `${body}\n\n${url}`;
  return {
    caption: body,
    text,
    href: `https://x.com/intent/post?text=${encodeURIComponent(body)}&url=${encodeURIComponent(url)}`,
  };
}

export function tweetText(h: Horoscope): string {
  const [house, manner, field] = h.triad;
  return `${h.displayName} is the ${h.archetype.house}\n${house} · ${manner} · ${field}`;
}

/** Short enough to paste into a free X compose and still look like a reading. */
export function tweetReading(h: Horoscope): string {
  const first = h.statements.synthesis.split(/(?<=\.)\s/)[0]?.trim() || h.archetype.myth;
  return `${tweetText(h)}\n${first}`;
}

export function tweetDay(headline: string, invitation: string): string {
  return `${headline.trim()}\n${invitation.trim()}`;
}

export function tweetBond(input: {
  a: string;
  b: string;
  title: string;
  grade: string;
  gradeLabel: string;
}): string {
  return `${input.a} & ${input.b}\n${input.title}\nGrade ${input.grade} · ${input.gradeLabel}`;
}

export function countPath(slug: string): string {
  return `/count/${encodeURIComponent(slug)}`;
}

export function tweetCount(seat: string, house: string, walk: string): string {
  const letters = walk.includes("·") ? walk : walk.split("").join(" · ");
  return `${seat} is the ${house}\n${letters || "the blank"}`;
}

export function bondTitle(a: string, b: string, title: string): string {
  return clip(`${a} & ${b} · ${title}`, X_TITLE_MAX);
}

export function bondDescription(title: string, plainly: string): string {
  return clip(`${title}. ${plainly}`, X_DESC_MAX);
}

export function xIntentUrl(h: Horoscope, origin = publicSiteOrigin()): string {
  const url = portraitUrl(h.displayName, origin);
  return composeXPost(tweetText(h), url).href;
}

export function readingWithUrl(reading: string, url: string): string {
  return composeXPost(reading, url).text;
}

export function portraitDescription(h: Horoscope): string {
  const [house, manner, field] = h.triad;
  return clip(
    `${house} is the role, ${manner} is how you work, ${field} is where. ${h.archetype.myth}`,
    X_DESC_MAX,
  );
}

export function portraitTitle(h: Horoscope): string {
  return clip(`${h.displayName} · ${h.archetype.title}`, X_TITLE_MAX);
}

export function pageCardMeta(input: {
  title: string;
  description: string;
  path: string;
  imagePath: string;
}): {
  title: string;
  meta: Array<Record<string, string>>;
} {
  const origin = publicSiteOrigin();
  const title = clip(input.title, X_TITLE_MAX);
  const description = clip(input.description, X_DESC_MAX);
  const url = `${origin}${input.path}`;
  const image = `${origin}${input.imagePath}`;
  return {
    title,
    meta: [
      { title },
      { name: "description", content: description },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
      { name: "twitter:image:alt", content: title },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: CLUB_NAME },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:image", content: image },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:image:alt", content: title },
    ],
  };
}
