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
