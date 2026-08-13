import assert from "node:assert/strict";
import test from "node:test";

function nameToSlug(name) {
  return name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}'’-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
    .toLowerCase();
}

function slugToName(slug) {
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

test("round-trips ordinary names", () => {
  assert.equal(slugToName(nameToSlug("Ada Lovelace")), "Ada Lovelace");
});

test("strips junk from slugs", () => {
  assert.equal(nameToSlug("  Ada   Lovelace!! "), "ada-lovelace");
});

test("keeps apostrophes in a usable slug", () => {
  assert.equal(nameToSlug("O'Brien"), "o'brien");
  assert.equal(slugToName("o'brien"), "O'brien");
});

function composeXPost(caption, url) {
  const tco = 23;
  let body = caption.replace(/\s+\n/g, "\n").trim();
  const budget = 280 - tco - 2;
  if (body.length > budget) body = `${body.slice(0, budget - 1).trimEnd()}…`;
  return {
    caption: body,
    text: `${body}\n\n${url}`,
    href: `https://x.com/intent/post?text=${encodeURIComponent(body)}&url=${encodeURIComponent(url)}`,
  };
}

test("X post always ends with the www URL and stays in budget", () => {
  const url = "https://www.letterology.club/p/ada-lovelace";
  const post = composeXPost("Ada Lovelace sits the House of the Seeker\nA · L · E", url);
  assert.ok(post.text.endsWith(url));
  assert.match(post.text, /\n\nhttps:\/\/www\.letterology\.club\//);
  const counted = post.text.slice(0, post.text.lastIndexOf("\n\n")).length + 2 + 23;
  assert.ok(counted <= 280);
  assert.match(post.href, /url=https%3A%2F%2Fwww\.letterology\.club/);
});
