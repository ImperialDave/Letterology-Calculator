#!/usr/bin/env node
/**
 * Enter Glyphbound Studio, stamp a tile, play, stop, leave.
 * Campaign progress must not change.
 */
import { chromium } from "playwright";
import { checkedUrl } from "./browser-guard.mjs";

const url = checkedUrl(process.argv[2] || "http://127.0.0.1:8080/glyphbound");

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
  const before = await page.evaluate(() => {
    const raw = localStorage.getItem("glyphbound-save-v3");
    const parsed = raw ? JSON.parse(raw) : {};
    return { progress: parsed.progress ?? 0, party: parsed.party ?? ["c"] };
  });
  await page.evaluate(() => window.__glyphbound.studio.enter());
  await page.waitForTimeout(200);
  const editing = await page.evaluate(() => {
    const gb = window.__glyphbound;
    gb.studio.stamp(6, 8, "1");
    gb.studio.stamp(10, 8, "^");
    const folio = gb.studio.folio();
    return { mode: gb.engine.mode, sandbox: gb.snapshot().sandbox, hasOne: folio.rows[8]?.includes("1") };
  });
  await page.evaluate(() => window.__glyphbound.studio.play());
  await page.waitForTimeout(300);
  const playing = await page.evaluate(() => {
    const s = window.__glyphbound.snapshot();
    return { mode: window.__glyphbound.engine.mode, sandbox: s.sandbox, frames: s.frames };
  });
  await page.evaluate(() => window.__glyphbound.studio.stop());
  await page.waitForTimeout(150);
  await page.evaluate(() => window.__glyphbound.studio.leave());
  await page.waitForTimeout(150);
  const after = await page.evaluate(() => {
    const raw = localStorage.getItem("glyphbound-save-v3");
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      mode: window.__glyphbound.engine.mode,
      progress: parsed.progress ?? 0,
      party: parsed.party ?? ["c"],
    };
  });
  const report = {
    ok:
      errors.length === 0 &&
      editing.mode === "studio" &&
      editing.sandbox &&
      editing.hasOne &&
      playing.mode === "play" &&
      playing.sandbox &&
      after.mode === "title" &&
      after.progress === before.progress,
    errors,
    before,
    editing,
    playing,
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
