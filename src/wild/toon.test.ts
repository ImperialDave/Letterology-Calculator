import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { authoredToon, stagCoat, toonGradient } from "./toon";

test("a texture is shown at full strength instead of a tint", () => {
  const map = new THREE.Texture();
  const source = new THREE.MeshStandardMaterial({ map, color: 0xc46a3a });
  const toon = authoredToon(source);
  assert.equal(toon.map, map);
  assert.ok(toon.color.r > 0.95 && toon.color.g > 0.95 && toon.color.b > 0.95);
});

test("a part with no texture keeps the color it was painted", () => {
  const source = new THREE.MeshStandardMaterial({ color: 0x886644 });
  const toon = authoredToon(source);
  assert.ok(Math.abs(toon.color.r - source.color.r) < 1e-4);
  assert.ok(Math.abs(toon.color.g - source.color.g) < 1e-4);
  assert.ok(Math.abs(toon.color.b - source.color.b) < 1e-4);
});

test("the stag coat runs from a dark hoof to a cream belly", () => {
  const coats = stagCoat([0.4, 0.02, 0.2]);
  assert.equal(coats[1], 0x241810);
  assert.equal(coats[0], 0xf0d8b0);
  assert.ok(coats[2] !== coats[0] && coats[2] !== coats[1]);
});

test("the toon shadow stays bright enough to keep a color", () => {
  const data = toonGradient().image.data as Uint8Array;
  assert.equal(data[0], 168);
  assert.equal(data[1], 214);
  assert.equal(data[2], 255);
});
