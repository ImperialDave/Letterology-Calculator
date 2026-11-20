import assert from "node:assert/strict";
import test from "node:test";
import { initialOnline, snapshot, step } from "@/lib/gtc/online";
import {
  SEAT_MAX_AGE_MS,
  clearSeat,
  loadSeat,
  newPeerId,
  resetSeatBackendForTests,
  saveSeat,
  setSeatBackendForTests,
} from "@/lib/gtc/seat";
import { sdpFingerprint } from "@/lib/multiplayer/sdp";

function memory() {
  const box = new Map<string, string>();
  return {
    getItem: (key: string) => box.get(key) ?? null,
    setItem: (key: string, value: string) => {
      box.set(key, value);
    },
    removeItem: (key: string) => {
      box.delete(key);
    },
  };
}

test("a seat keeps the hidden character for the same room", () => {
  setSeatBackendForTests(memory());
  const peerId = newPeerId();
  const state = { ...initialOnline(), phase: "draft" as const, secret: "Waldo", theirName: "Bea" };
  saveSeat({ room: "ABCDE", name: "Ada", role: "host", peerId, state });
  const loaded = loadSeat("ABCDE");
  assert.ok(loaded);
  assert.equal(loaded.role, "host");
  assert.equal(loaded.peerId, peerId);
  assert.equal(loaded.state.secret, "Waldo");
  assert.equal(loaded.state.phase, "draft");
  assert.equal(loaded.mailCursor, 0);
  assert.equal(loadSeat("ZZZZZ"), null);
  assert.equal(loadSeat()?.state.secret, "Waldo");
  assert.equal(loadSeat("ABCDE")?.state.secret, "Waldo");
  clearSeat();
  assert.equal(loadSeat("ABCDE"), null);
  resetSeatBackendForTests();
});

test("a seat remembers how much room mail it has applied", () => {
  const store = memory();
  setSeatBackendForTests(store);
  const peerId = newPeerId();
  saveSeat({ room: "ABCDE", name: "Ada", role: "host", peerId, state: initialOnline(), mailCursor: 12.8 });
  assert.equal(loadSeat("ABCDE")?.mailCursor, 12);
  store.setItem(
    "gtc-seat",
    JSON.stringify({
      version: 1,
      room: "ABCDE",
      name: "Ada",
      role: "host",
      peerId,
      state: initialOnline(),
      savedAt: Date.now(),
    }),
  );
  assert.equal(loadSeat("ABCDE")?.mailCursor, null);
  resetSeatBackendForTests();
});

test("an old seat and a broken seat are dropped", () => {
  const store = memory();
  setSeatBackendForTests(store);
  const peerId = newPeerId();
  saveSeat({
    room: "ABCDE",
    name: "Ada",
    role: "guest",
    peerId,
    state: initialOnline(),
    savedAt: Date.now() - SEAT_MAX_AGE_MS - 1000,
  });
  assert.equal(loadSeat("ABCDE"), null);
  store.setItem("gtc-seat", "{");
  assert.equal(loadSeat("ABCDE"), null);
  assert.equal(store.getItem("gtc-seat"), null);
  resetSeatBackendForTests();
});

test("a resumed draft keeps its secret when the other phone repeats the theme", () => {
  let state = initialOnline();
  state = step(state, { type: "PEER", name: "Bea" }, { isHost: false }).state;
  state = step(
    state,
    { type: "REMOTE_START", themeId: state.themeId, themeLine: state.themeLine },
    { isHost: false },
  ).state;
  state = step(state, { type: "SET_SECRET", value: "Ada Lovelace" }, { isHost: false }).state;
  const again = step(
    state,
    { type: "REMOTE_START", themeId: state.themeId, themeLine: state.themeLine },
    { isHost: false },
  ).state;
  assert.equal(again.phase, "draft");
  assert.equal(again.secret, "Ada Lovelace");
});

test("a guest catch-up does not send the theme back", () => {
  const state = { ...initialOnline(), phase: "theme" as const, themeLine: "cannot swim" };
  assert.equal(snapshot(state, false).some((wire) => wire.t === "theme"), false);
  assert.equal(snapshot(state, true).some((wire) => wire.t === "theme"), true);
});

test("a live round ignores a replayed begin", () => {
  const state = { ...initialOnline(), phase: "ask" as const, roundLive: true, secret: "Hidden", iLocked: true };
  const next = step(state, { type: "REMOTE_BEGIN", firstIsMe: true, round: 1 }, { isHost: false }).state;
  assert.equal(next.phase, "ask");
  assert.equal(next.secret, "Hidden");
  assert.equal(next.roundLive, true);
});

test("sdp fingerprints compare the DTLS line only", () => {
  const sdp = "v=0\r\na=fingerprint:sha-256 AA:BB\r\na=setup:actpass\r\n";
  assert.equal(sdpFingerprint(sdp), "a=fingerprint:sha-256 AA:BB");
  assert.equal(sdpFingerprint("v=0\r\n"), null);
  assert.notEqual(sdpFingerprint(sdp), sdpFingerprint("a=fingerprint:sha-256 CC:DD\r\n"));
});
