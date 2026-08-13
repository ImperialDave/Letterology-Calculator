import assert from "node:assert/strict";
import test from "node:test";

function nameToSlug(name) {
  return name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}'’-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function slugToName(slug) {
  let raw = slug;
  try {
    raw = decodeURIComponent(slug);
  } catch {
    raw = slug;
  }
  return raw.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
}

test("round-trips ordinary names", () => {
  assert.equal(slugToName(nameToSlug("Ada Lovelace")), "Ada Lovelace");
});

test("strips junk from slugs", () => {
  assert.equal(nameToSlug("  Ada   Lovelace!! "), "Ada-Lovelace");
});

test("keeps apostrophes in a usable slug", () => {
  assert.equal(slugToName(nameToSlug("O'Brien")), "O'Brien");
});
