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

test("portrait image URLs look like pictures, not API calls", () => {
  const origin = "https://www.letterology.club";
  const slug = nameToSlug("Ada Lovelace");
  const image = `${origin}/og/${slug}.jpg`;
  const page = `${origin}/p/${slug}`;
  assert.equal(image, "https://www.letterology.club/og/ada-lovelace.jpg");
  assert.equal(page, "https://www.letterology.club/p/ada-lovelace");
  assert.doesNotMatch(image, /\?/);
});
