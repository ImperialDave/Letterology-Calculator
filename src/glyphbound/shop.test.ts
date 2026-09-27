import assert from "node:assert/strict";
import test from "node:test";
import {
  buy,
  drinkDraught,
  drinkVial,
  eatBlot,
  emptyLive,
  emptyPurse,
  isSummon,
  payout,
  swingPress,
} from "./shop";

test("a first close pays 14, a clean page pays more, a reread pays 5", () => {
  assert.equal(payout(true, "D"), 14);
  assert.equal(payout(true, "C+"), 14);
  assert.equal(payout(true, "B"), 16);
  assert.equal(payout(true, "B−"), 16);
  assert.equal(payout(true, "A"), 18);
  assert.equal(payout(true, "A−"), 18);
  assert.equal(payout(true, "A+"), 20);
  assert.equal(payout(false, "A+"), 5);
});

test("14 Letterbux buys a vial and does not buy a draught", () => {
  const purse = { ...emptyPurse(), bux: 14 };
  const vial = buy(purse, "heart", "easy");
  assert.equal(vial.ok, true);
  assert.equal(vial.purse.bux, 4);
  assert.equal(vial.purse.bag.heart, 1);
  const draught = buy(purse, "blot", "easy");
  assert.equal(draught.ok, false);
  assert.equal(draught.purse.bux, 14);
});

test("a full stack refuses the sale and keeps the purse", () => {
  const purse = { ...emptyPurse(), bux: 100, bag: { ...emptyPurse().bag, heart: 9, blot: 3 } };
  assert.equal(buy(purse, "heart", "hard").ok, false);
  assert.equal(buy(purse, "blot", "hard").purse.bux, 100);
});

test("a permanent is sold once", () => {
  const purse = { ...emptyPurse(), bux: 200 };
  const first = buy(purse, "gilt", "hard");
  assert.equal(first.ok, true);
  const second = buy(first.purse, "gilt", "hard");
  assert.equal(second.ok, false);
  assert.equal(second.purse.bux, first.purse.bux);
});

test("Easy cannot buy a spare wake", () => {
  const purse = { ...emptyPurse(), bux: 200 };
  const sold = buy(purse, "wake", "easy");
  assert.equal(sold.ok, false);
  assert.equal(sold.purse.bux, 200);
  assert.equal(buy(purse, "wake", "hard").ok, true);
});

test("one draught replaces another, and Press is spent on a whiff", () => {
  let purse = { ...emptyPurse(), bag: { ...emptyPurse().bag, blot: 1, anchor: 1, press: 1 } };
  const blot = drinkDraught(purse, emptyLive(), "blot");
  purse = blot.purse;
  assert.equal(blot.live.id, "blot");
  assert.equal(blot.live.blot, 5);
  const anchor = drinkDraught(purse, blot.live, "anchor");
  assert.equal(anchor.live.id, "anchor");
  assert.equal(anchor.live.blot, 0);
  const press = drinkDraught(anchor.purse, anchor.live, "press");
  assert.equal(press.live.press, true);
  assert.equal(press.live.id, null);
  assert.equal(swingPress(press.live).press, false);
  assert.equal(swingPress(swingPress(press.live)).press, false);
});

test("Blot eats five shots and then is gone", () => {
  let live = drinkDraught(
    { ...emptyPurse(), bag: { ...emptyPurse().bag, blot: 1 } },
    emptyLive(),
    "blot",
  ).live;
  for (let i = 0; i < 4; i++) {
    const ate = eatBlot(live);
    assert.equal(ate.eaten, true);
    live = ate.live;
    assert.equal(live.id, "blot");
  }
  const last = eatBlot(live);
  assert.equal(last.eaten, true);
  assert.equal(last.live.id, null);
  assert.equal(eatBlot(last.live).eaten, false);
});

test("Period answers summons and does not treat a warden as one", () => {
  assert.equal(isSummon("one"), true);
  assert.equal(isSummon("radix"), true);
  assert.equal(isSummon("plus"), true);
  assert.equal(isSummon("nullis"), false);
  assert.equal(isSummon("endmark"), false);
  assert.equal(isSummon("two"), false);
});

test("an empty vial does not drink", () => {
  assert.equal(drinkVial(emptyPurse(), "ink").ok, false);
});
