import assert from "node:assert/strict";
import test from "node:test";
import {
  carryForVerb,
  flipTongue,
  getLiveTongue,
  lettersPath,
  noteHandle,
  notePair,
  parseTongue,
  readPath,
  setLiveTongue,
  twoPath,
} from "./tongue";

test("tongue parse only treats el as Greek", () => {
  assert.equal(parseTongue("el"), "el");
  assert.equal(parseTongue("la"), "la");
  assert.equal(parseTongue(undefined), "la");
});

test("read and two paths carry the handle and the tongue", () => {
  assert.equal(readPath("Apollo"), "/?n=Apollo");
  assert.equal(readPath("Apollo", "el"), "/?n=Apollo&tongue=el");
  assert.match(twoPath("Ada", "Octavia", "el"), /tongue=el/);
  assert.equal(lettersPath("th", "el"), "/letters/th?tongue=el");
});

test("leaving Greek writes tongue=la, not a blank", () => {
  const next = flipTongue({
    pathname: "/",
    search: { n: "Apollo", tongue: "el" },
    next: "la",
  });
  assert.equal(next.search.tongue, "la");
});

test("flip keeps the handle on the door", () => {
  const next = flipTongue({
    pathname: "/",
    search: { n: "Apollo" },
    next: "el",
  });
  assert.equal(next.to, "/");
  assert.equal(next.search.n, "Apollo");
  assert.equal(next.search.tongue, "el");
});

test("flip turns a shared portrait into a Greek reading", () => {
  const next = flipTongue({
    pathname: "/p/ada-lovelace",
    search: {},
    params: { slug: "ada-lovelace" },
    next: "el",
  });
  assert.equal(next.to, "/");
  assert.match(next.search.n ?? "", /ada lovelace/i);
  assert.equal(next.search.tongue, "el");
});

test("flip keeps a pair on Two and drops the stadium when leaving Greek", () => {
  const greek = flipTongue({
    pathname: "/two",
    search: { a: "Ada", b: "Octavia", mode: "agon" },
    next: "el",
  });
  assert.equal(greek.to, "/two");
  assert.equal(greek.search.mode, "agon");
  const latin = flipTongue({
    pathname: "/two",
    search: { a: "Ada", b: "Octavia", mode: "agon" },
    next: "la",
  });
  assert.equal(latin.search.mode, undefined);
  assert.equal(latin.search.a, "Ada");
});

test("flip keeps a letter mark and a count walk", () => {
  const letter = flipTongue({
    pathname: "/letters/th",
    search: {},
    params: { mark: "th" },
    next: "el",
  });
  assert.equal(letter.to, "/letters/$mark");
  assert.equal(letter.params?.mark, "th");
  const walk = flipTongue({
    pathname: "/count/byx",
    search: {},
    params: { walk: "byx" },
    next: "el",
  });
  assert.equal(walk.to, "/count/$walk");
  assert.equal(walk.params?.walk, "byx");
});

test("flip Why lands on the matching warrant", () => {
  const next = flipTongue({ pathname: "/why", search: {}, next: "el" });
  assert.equal(next.to, "/why");
  assert.equal(next.hash, "greek");
});

test("live tongue updates before the URL does", () => {
  setLiveTongue("el");
  assert.equal(getLiveTongue(), "el");
  setLiveTongue("la");
  assert.equal(getLiveTongue(), "la");
});

test("drafts ride along when the URL is empty", () => {
  noteHandle("Apollo");
  notePair("Ada", "Octavia");
  const read = flipTongue({ pathname: "/", search: {}, next: "el" });
  assert.equal(read.search.n, "Apollo");
  const pair = flipTongue({ pathname: "/two", search: {}, next: "el" });
  assert.equal(pair.search.a, "Ada");
  assert.equal(pair.search.b, "Octavia");
  const carried = carryForVerb("two", {}, "el");
  assert.equal(carried.a, "Ada");
  assert.equal(carried.tongue, "el");
});
