import assert from "node:assert/strict";
import test from "node:test";
import { buildHoroscope } from "./engine";
import { parseCardFile } from "./render-card";
import {
  composeXPost,
  nameToSlug,
  pageCardMeta,
  portraitTitle,
  tweetDay,
  tweetReading,
  tweetText,
} from "./share";

test("composeXPost keeps the www URL on its own line and fits 280", () => {
  const url = "https://www.letterology.club/p/ada-lovelace";
  const post = composeXPost("Ada Lovelace sits the House of the Seeker\nA · L · E", url);
  assert.ok(post.text.endsWith(url));
  assert.match(post.text, /\n\nhttps:\/\/www\.letterology\.club\//);
  const counted = post.text.slice(0, post.text.lastIndexOf("\n\n")).length + 2 + 23;
  assert.ok(counted <= 280);
  assert.ok(!post.href.includes(encodeURIComponent(url + "\n")));
  assert.match(post.href, /url=https%3A%2F%2Fwww\.letterology\.club/);
  assert.ok(!post.caption.includes("http"));
});

test("composeXPost clips a long caption instead of overflowing", () => {
  const url = "https://www.letterology.club/p/ada-lovelace";
  const post = composeXPost("x".repeat(400), url);
  const counted = post.caption.length + 2 + 23;
  assert.ok(counted <= 280);
  assert.ok(post.caption.endsWith("…"));
});

test("portrait tweet is two short lines", () => {
  const h = buildHoroscope("Ada Lovelace");
  assert.ok(h);
  const text = tweetText(h);
  assert.match(text, /Ada Lovelace sits the /);
  assert.match(text, /A · L · /);
  assert.ok(text.length < 120);
});

test("reading tweet stays a caption, not an essay", () => {
  const h = buildHoroscope("Ada Lovelace");
  assert.ok(h);
  const post = composeXPost(
    tweetReading(h),
    "https://www.letterology.club/p/ada-lovelace",
  );
  assert.ok(post.caption.length < 260);
  assert.ok(!post.caption.includes("Normalized:"));
});

test("day tweet is headline plus invitation", () => {
  const text = tweetDay("Homecoming in the House of the Seeker", "Take the first real step.");
  assert.equal(text, "Homecoming in the House of the Seeker\nTake the first real step.");
});

test("page cards ship the X large-image contract", () => {
  const card = pageCardMeta({
    title: "A — Aspiration",
    description: "A is the Seeker's letter. It starts things.",
    path: "/atlas?letter=A",
    imagePath: "/og/letter-a.jpg",
  });
  const by = Object.fromEntries(
    card.meta
      .filter((item) => item.name || item.property)
      .map((item) => [item.name || item.property, item.content]),
  );
  assert.equal(by["twitter:card"], "summary_large_image");
  assert.equal(by["og:image:type"], "image/jpeg");
  assert.equal(by["og:image:width"], "1200");
  assert.match(by["twitter:image"] ?? "", /\/og\/letter-a\.jpg$/);
  assert.doesNotMatch(by["twitter:image"] ?? "", /\?/);
  assert.ok((by["twitter:title"] ?? "").length <= 70);
});

test("portrait titles stay inside X's visible title budget", () => {
  const h = buildHoroscope("Ada Lovelace");
  assert.ok(h);
  assert.ok(portraitTitle(h).length <= 70);
});

test("card files parse as portraits, glyphs, and days", () => {
  assert.deepEqual(parseCardFile("ada-lovelace.jpg"), { kind: "portrait", slug: "ada-lovelace" });
  assert.deepEqual(parseCardFile("house-a.jpg"), { kind: "house", letter: "A" });
  assert.deepEqual(parseCardFile("letter-r.jpg"), { kind: "letter", letter: "R" });
  assert.deepEqual(parseCardFile("circle-b.jpg"), { kind: "circle", letter: "B" });
  assert.deepEqual(parseCardFile("day-2026-08-13.jpg"), { kind: "day", date: "2026-08-13" });
  assert.equal(parseCardFile("nope.png"), null);
});

test("slugs stay lowercase and file-like", () => {
  assert.equal(nameToSlug("Ada Lovelace"), "ada-lovelace");
});
