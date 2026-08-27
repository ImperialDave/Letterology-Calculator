import assert from "node:assert/strict";
import test from "node:test";
import {
  hostFromHref,
  isGameFirstHost,
  isGameFirstLocation,
  normalizeHost,
  X_FRAME_ANCESTORS,
} from "./play-host";

test("grok.me hosts are the X playable", () => {
  assert.equal(isGameFirstHost("cinderwell.grok.me"), true);
  assert.equal(isGameFirstHost("CINDERWELL.GROK.ME:443"), true);
  assert.equal(isGameFirstHost("grok.me"), true);
  assert.equal(isGameFirstHost("www.letterology.club"), false);
  assert.equal(isGameFirstHost("localhost:8080"), false);
});

test("club readings never steal the playable", () => {
  assert.equal(isGameFirstLocation("cinderwell.grok.me", {}), true);
  assert.equal(isGameFirstLocation("cinderwell.grok.me", { club: true }), false);
  assert.equal(isGameFirstLocation("cinderwell.grok.me", { n: "lovelace" }), false);
  assert.equal(isGameFirstLocation("www.letterology.club", {}), false);
});

test("forwarded hosts take the first value", () => {
  assert.equal(normalizeHost("cinderwell.grok.me, localhost"), "cinderwell.grok.me");
  assert.equal(hostFromHref("https://cinderwell.grok.me/glyphbound"), "cinderwell.grok.me");
});

test("X may frame the playable", () => {
  assert.match(X_FRAME_ANCESTORS, /x\.com/);
  assert.match(X_FRAME_ANCESTORS, /grok\.com/);
  assert.match(X_FRAME_ANCESTORS, /twitter\.com/);
});
