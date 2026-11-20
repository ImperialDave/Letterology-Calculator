import assert from "node:assert/strict";
import test from "node:test";
import { initialOnline, parseWire, snapshot, step, type OnlineState } from "@/lib/gtc/online";

function draft(partial: Partial<OnlineState> = {}): OnlineState {
  return {
    ...initialOnline(),
    phase: "draft",
    themeLine: "are in a band",
    secret: "Waldo",
    ...partial,
  };
}

test("the host starts the round when they lock second", () => {
  const result = step(draft({ theyLocked: true }), { type: "LOCK" }, { isHost: true });
  assert.equal(result.state.roundLive, true);
  assert.equal(result.state.phase, "ask");
  assert.deepEqual(
    result.out.map((wire) => wire.t),
    ["lock", "begin"],
  );
  const again = step(result.state, { type: "BEGIN" }, { isHost: true });
  assert.equal(again.out.length, 0);
  assert.equal(again.state.phase, "ask");
  assert.equal(again.state.round, result.state.round);
});

test("the host starts the round when the other lock arrives", () => {
  const result = step(draft({ iLocked: true }), { type: "THEY_LOCK" }, { isHost: true });
  assert.equal(result.state.phase, "ask");
  assert.equal(result.out.length, 1);
  assert.equal(result.out[0]?.t, "begin");
  if (result.out[0]?.t === "begin") assert.equal(result.out[0].first, "host");
});

test("an even round starts on the guest's phone", () => {
  const result = step(draft({ round: 2, iLocked: true }), { type: "THEY_LOCK" }, { isHost: true });
  assert.equal(result.state.phase, "watch");
  assert.equal(result.out[0]?.t, "begin");
  if (result.out[0]?.t === "begin") assert.equal(result.out[0].first, "guest");
});

test("a guest lock never starts the round", () => {
  const locked = step(draft({ theyLocked: true }), { type: "LOCK" }, { isHost: false });
  assert.equal(locked.state.phase, "draft");
  assert.equal(locked.state.roundLive, false);
  assert.deepEqual(locked.out, [{ t: "lock" }]);
  const heard = step(draft({ iLocked: true }), { type: "THEY_LOCK" }, { isHost: false });
  assert.equal(heard.state.roundLive, false);
  assert.equal(heard.out.length, 0);
  assert.equal(heard.state.theyLocked, true);
});

test("a locked character can be changed until the round is live", () => {
  const opened = step(draft({ iLocked: true }), { type: "UNLOCK" }, { isHost: true });
  assert.equal(opened.state.iLocked, false);
  assert.equal(opened.state.secret, "Waldo");
  assert.deepEqual(opened.out, [{ t: "unlock" }]);
  const live = step(draft({ iLocked: true, roundLive: true, phase: "ask" }), { type: "UNLOCK" }, { isHost: true });
  assert.equal(live.state.iLocked, true);
  assert.equal(live.out.length, 0);
  const cleared = step(draft({ theyLocked: true }), { type: "THEY_UNLOCK" }, { isHost: true });
  assert.equal(cleared.state.theyLocked, false);
  const late = step(draft({ theyLocked: true, roundLive: true, phase: "watch" }), { type: "THEY_UNLOCK" }, { isHost: false });
  assert.equal(late.state.theyLocked, true);
});

test("an unlocked draft tells the other phone to drop the lock", () => {
  assert.equal(snapshot(draft({ iLocked: false, secret: "" }), true).some((wire) => wire.t === "unlock"), true);
  const locked = snapshot(draft({ iLocked: true }), true);
  assert.equal(locked.some((wire) => wire.t === "unlock"), false);
  assert.equal(locked.some((wire) => wire.t === "lock"), true);
  assert.deepEqual(parseWire({ t: "unlock" }), { t: "unlock" });
});

test("a typed theme stays local until it is committed", () => {
  const theme = { ...initialOnline(), phase: "theme" as const, themeLine: "cannot swim", themeFromThem: true };
  const typed = step(theme, { type: "SET_LINE", line: "custom heroes" }, { isHost: true });
  assert.equal(typed.out.length, 0);
  assert.equal(typed.state.themeLine, "custom heroes");
  assert.equal(typed.state.themeFromThem, false);
  const committed = step(typed.state, { type: "COMMIT_LINE" }, { isHost: false });
  assert.equal(committed.out.length, 1);
  assert.equal(committed.out[0]?.t, "theme");
  if (committed.out[0]?.t === "theme") assert.equal(committed.out[0].themeLine, "custom heroes");
  const blank = step({ ...typed.state, themeLine: "   " }, { type: "COMMIT_LINE" }, { isHost: true });
  assert.equal(blank.out.length, 0);
  const applied = step(theme, { type: "APPLY_THEME", themeId: "custom", themeLine: "wear capes" }, { isHost: true });
  assert.equal(applied.state.themeFromThem, true);
  assert.equal(applied.state.themeLine, "wear capes");
  const rolled = step(applied.state, { type: "ROLL" }, { isHost: true });
  assert.equal(rolled.state.themeFromThem, false);
  assert.equal(rolled.out[0]?.t, "theme");
});
