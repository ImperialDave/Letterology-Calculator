import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

mkdirSync("/workspace/screenshots", { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const errors = [];
async function shot(page, path) {
  await page.screenshot({ path, fullPage: true });
}

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on("pageerror", (err) => errors.push(String(err.message || err)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle", timeout: 45000 });
  await page.getByLabel("The name you carry").fill("Ada Lovelace");
  await page.getByRole("button", { name: "Read the letters" }).click();
  await page.getByRole("heading", { name: "Ada Lovelace" }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(600);
  await shot(page, "/workspace/screenshots/reading-desktop.png");

  const primary = await page.locator("text=Primary theme").first().isVisible();
  const portrait = await page.locator("text=Portrait").first().isVisible();
  const map = await page.locator("text=Living map").first().isVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  await shot(page, "/workspace/screenshots/reading-mobile.png");

  await page.goto("http://127.0.0.1:8080/atlas?letter=L", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Letter Atlas" }).waitFor();
  await page.waitForTimeout(400);
  await shot(page, "/workspace/screenshots/atlas-mobile.png");

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("http://127.0.0.1:8080/atlas?letter=X", { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await shot(page, "/workspace/screenshots/atlas-desktop.png");

  console.log(JSON.stringify({ primary, portrait, map, overflow, errors }, null, 2));
  if (errors.length) process.exit(2);
  if (!primary || !portrait || !map) process.exit(3);
  if (overflow) process.exit(4);
} finally {
  await browser.close();
}
