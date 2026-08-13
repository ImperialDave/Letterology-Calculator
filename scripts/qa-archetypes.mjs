import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

mkdirSync("/workspace/screenshots", { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const errors = [];

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on("pageerror", (err) => errors.push(String(err.message || err)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("http://127.0.0.1:8080/?name=Ada%20Lovelace", { waitUntil: "networkidle", timeout: 45000 });
  await page.getByText("Your archetype").first().waitFor({ timeout: 15000 });
  const code = (await page.locator("text=/^[A-Z]{3} · /").first().textContent()) ?? "";
  await page.screenshot({ path: "/workspace/screenshots/archetype-reading.png", fullPage: false });

  await page.getByRole("link", { name: "Kindred archetypes in this house" }).count();
  const kindredVisible = await page.getByText("Kindred archetypes in this house").isVisible();

  await page.goto("http://127.0.0.1:8080/archetypes?house=A&code=ALE", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "The Houses" }).waitFor();
  await page.waitForTimeout(400);
  await page.screenshot({ path: "/workspace/screenshots/houses-desktop.png" });

  await page.getByLabel("Look up a triad").fill("JKB");
  await page.getByRole("button", { name: "Open triad" }).click();
  await page.waitForTimeout(400);
  const jkb = await page.getByText("JKB", { exact: true }).first().isVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:8080/?name=Ada%20Lovelace", { waitUntil: "networkidle" });
  await page.getByText("Your archetype").first().waitFor();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  await page.screenshot({ path: "/workspace/screenshots/archetype-mobile.png" });

  console.log(JSON.stringify({ code, kindredVisible, jkb, overflow, errors }, null, 2));
  if (errors.length) process.exit(2);
  if (!kindredVisible || !jkb || overflow) process.exit(3);
} finally {
  await browser.close();
}
