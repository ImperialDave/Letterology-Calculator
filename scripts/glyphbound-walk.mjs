#!/usr/bin/env node
/**
 * Walk an assembled remainder ledger. Spawn must stay grounded and the gate
 * must sit to the right of the player.
 */
import { chromium } from "playwright";
import { checkedUrl } from "./browser-guard.mjs";

const url = checkedUrl(process.argv[2] || "http://127.0.0.1:8080/glyphbound");
const stage = process.argv[3] || "stage29";

const browser = await chromium.launch({
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
  ],
});

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err?.message || err)));
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForFunction(() => Boolean(window.__glyphbound), { timeout: 20000 });
  await page.evaluate((id) => {
    window.__glyphbound.wake();
    window.__glyphbound.load(id);
  }, stage);
  await page.waitForTimeout(400);
  const before = await page.evaluate(() => {
    const p = window.__glyphbound.engine.player;
    const s = window.__glyphbound.snapshot();
    const gate = window.__glyphbound.engine.pickups?.find?.((u) => u.kind === "portal");
    return {
      x: p.x,
      y: p.y,
      grounded: p.grounded,
      gateX: gate?.x ?? 0,
      solids: s.solids,
      enemies: s.enemies,
    };
  });
  await page.evaluate(() => window.__controlsTest.setKeys(["KeyD"]));
  await page.waitForTimeout(1200);
  const after = await page.evaluate(() => {
    const p = window.__glyphbound.engine.player;
    return { x: p.x, y: p.y, grounded: p.grounded, mode: window.__glyphbound.engine.mode };
  });
  const report = {
    ok:
      errors.length === 0 &&
      after.grounded &&
      after.x > before.x + 40 &&
      after.y < before.y + 80 &&
      before.gateX > before.x &&
      after.mode === "play",
    errors,
    stage,
    before,
    after,
  };
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 2);
} catch (err) {
  console.error(JSON.stringify({ ok: false, error: String(err?.message || err) }, null, 2));
  process.exit(1);
} finally {
  await browser.close();
}
