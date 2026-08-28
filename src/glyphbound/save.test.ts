import assert from "node:assert/strict";
import test from "node:test";
import {
  SLOT_COUNT,
  activeSlot,
  clearSlot,
  defaultSave,
  isEmptySave,
  listSlots,
  loadSave,
  selectSlot,
  writeSave,
} from "./save";

function memoryStore() {
  const m = new Map<string, string>();
  const ls = {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => {
      m.set(k, String(v));
    },
    removeItem: (k: string) => {
      m.delete(k);
    },
    clear: () => m.clear(),
    key: (i: number) => [...m.keys()][i] ?? null,
    get length() {
      return m.size;
    },
  };
  Object.defineProperty(globalThis, "localStorage", { value: ls, configurable: true });
  return m;
}

test("legacy v3 save migrates into file I", () => {
  const m = memoryStore();
  const old = { ...defaultSave(), progress: 12, stage: "stage12", letter: "s", party: ["c", "s"] };
  m.set("glyphbound-save-v3", JSON.stringify(old));
  const slots = listSlots();
  assert.equal(slots.length, SLOT_COUNT);
  assert.equal(slots[0]?.empty, false);
  assert.equal(slots[0]?.progress, 12);
  assert.equal(loadSave().progress, 12);
  assert.equal(slots[1]?.empty, true);
});

test("two files stay independent", () => {
  memoryStore();
  const a = { ...defaultSave(), progress: 6, stage: "stage6", visited: ["hub"] };
  const b = { ...defaultSave(), progress: 40, stage: "stage40", letter: "b" as const, party: ["c", "b"], visited: ["hub"] };
  writeSave(a, 0);
  writeSave(b, 1);
  assert.equal(loadSave(0).progress, 6);
  assert.equal(loadSave(1).progress, 40);
  selectSlot(1);
  assert.equal(activeSlot(), 1);
  assert.equal(loadSave().progress, 40);
  clearSlot(1);
  assert.equal(isEmptySave(loadSave(1)), true);
  assert.equal(loadSave(0).progress, 6);
});

test("empty default is an empty file", () => {
  assert.equal(isEmptySave(defaultSave()), true);
  assert.equal(isEmptySave({ ...defaultSave(), visited: ["hub"] }), false);
});
