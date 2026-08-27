#!/usr/bin/env node
/**
 * Sample Glyphbound FPS on hub, a long ledger, and End-Mark (stage 30).
 * Needs the app on :8080 (or argv URL). Writes JSON + PNGs under screenshots/.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { chromium } from "playwright";
import { checkedUrl, checkedOutputPath } from "./browser-guard.mjs";

const url = checkedUrl(process.argv[2] || "http://127.0.0.1:8080/glyphbound");
const outJson = checkedOutputPath(
  process.argv[3] || resolve("screenshots/glyphbound-profile.json"),
  [resolve("screenshots"), "/workspace/screenshots", resolve(".")],
);
const sampleMs = Number(process.env.GB_PROFILE_MS || 3000);
const shotRoot = dirname(outJson);

mkdirSync(shotRoot, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding",
  ],
});

const SCENES = [
  { id: "hub", label: "hub" },
  { id: "stage29", label: "ledger-29" },
  { id: "stage30", label: "end-mark" },
];

async function waitFrames(page, prev, timeout = 4000) {
  try {
    await page.waitForFunction(
      (before) => (window.__glyphbound?.snapshot?.()?.frames ?? 0) > before,
      prev,
      { timeout },
    );
    return true;
  } catch {
    return false;
  }
}

async function sample(page, scene) {
  const shot = checkedOutputPath(resolve(shotRoot, `glyphbound-${scene.label}.png`), [
    resolve("screenshots"),
    "/workspace/screenshots",
    resolve("."),
  ]);
  const before = await page.evaluate(() => window.__glyphbound?.snapshot?.()?.frames ?? 0);
  await page.evaluate((stage) => {
    const gb = window.__glyphbound;
    if (!gb) throw new Error("no __glyphbound");
    gb.showFps(true);
    gb.wake();
    gb.load(stage);
  }, scene.id);
  let moving = await waitFrames(page, before);
  if (!moving) {
    await page.evaluate(async () => {
      const gb = window.__glyphbound;
      gb?.wake();
      const t0 = performance.now();
      while (performance.now() - t0 < 400) {
        gb?.pump(performance.now());
        await new Promise((r) => setTimeout(r, 16));
      }
    });
    moving = await waitFrames(page, before, 1500);
  }
  await page.waitForSelector('[data-ui="fps"]', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(300);
  const start = Date.now();
  const rows = [];
  while (Date.now() - start < sampleMs) {
    const snap = await page.evaluate(() => window.__glyphbound?.snapshot?.() ?? null);
    if (snap) rows.push(snap);
    await page.waitForTimeout(100);
  }
  await page.screenshot({ path: shot, fullPage: false });
  const fps = rows.map((r) => r.fps).filter((n) => Number.isFinite(n));
  const draw = rows.map((r) => r.drawMs).filter((n) => Number.isFinite(n));
  const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const last = rows.at(-1) ?? {};
  const first = rows[0] ?? {};
  return {
    id: scene.id,
    label: scene.label,
    name: last.name ?? "",
    samples: rows.length,
    fpsAvg: Math.round(mean(fps) * 10) / 10,
    fpsMin: fps.length ? Math.round(Math.min(...fps) * 10) / 10 : 0,
    drawMsAvg: Math.round(mean(draw) * 10) / 10,
    drawMsMax: draw.length ? Math.round(Math.max(...draw) * 10) / 10 : 0,
    framesFirst: first.frames ?? 0,
    framesLast: last.frames ?? 0,
    framesMoved: moving && (last.frames ?? 0) > (first.frames ?? 0),
    hidden: last.hidden ?? null,
    solids: last.solids ?? 0,
    grid: last.grid ?? 0,
    enemies: last.enemies ?? 0,
    worldW: last.worldW ?? 0,
    screenshot: shot,
  };
}

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err?.message || err)));
  await page.addInitScript(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
  });
  const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.bringToFront();
  await page.waitForFunction(() => Boolean(window.__glyphbound), { timeout: 20000 });
  const session = await page.context().newCDPSession(page);
  await session.send("Page.setWebLifecycleState", { state: "active" }).catch(() => {});
  await session.send("Emulation.setFocusEmulationEnabled", { enabled: true }).catch(() => {});
  await page.evaluate(() => window.__glyphbound?.wake?.());
  const scenes = [];
  for (const scene of SCENES) {
    scenes.push(await sample(page, scene));
  }
  const report = {
    ok: errors.length === 0 && scenes.every((s) => s.framesLast > s.framesFirst),
    url,
    status: resp?.status() ?? 0,
    errors,
    scenes,
    at: new Date().toISOString(),
  };
  writeFileSync(outJson, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok && report.status < 400 ? 0 : 2);
} catch (err) {
  console.error(JSON.stringify({ ok: false, url, error: String(err?.message || err) }, null, 2));
  process.exit(1);
} finally {
  await browser.close();
}
