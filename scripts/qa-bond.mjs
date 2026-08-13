import { chromium } from "playwright";

const shots = "/workspace/screenshots";

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 1600 } });
page.on("pageerror", (err) => console.error("PAGEERROR", err.message));
page.on("console", (msg) => {
  if (msg.type() === "error") console.error("CONSOLE", msg.text());
});

await page.goto("http://127.0.0.1:8080/bond?a=@lovelace&b=@octavia", { waitUntil: "networkidle" });
await page.waitForTimeout(400);
await page.screenshot({ path: `${shots}/bond-result-full.png`, fullPage: true });

await page.setViewportSize({ width: 390, height: 844 });
await page.goto("http://127.0.0.1:8080/bond", { waitUntil: "networkidle" });
await page.waitForTimeout(300);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
console.log("mobile landing overflow", overflow);
await page.screenshot({ path: `${shots}/bond-mobile-landing.png`, fullPage: true });

await page.goto("http://127.0.0.1:8080/bond?a=@lovelace&b=@octavia", { waitUntil: "networkidle" });
await page.waitForTimeout(400);
const overflow2 = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
console.log("mobile result overflow", overflow2);
await page.screenshot({ path: `${shots}/bond-mobile-result.png`, fullPage: true });

await page.setViewportSize({ width: 1280, height: 900 });
await page.goto("http://127.0.0.1:8080/?name=lovelace", { waitUntil: "networkidle" });
await page.waitForTimeout(300);
const compare = page.getByRole("link", { name: /compare this handle/i });
console.log("compare cta", await compare.count());
await compare.first().click();
await page.waitForURL(/\/bond/);
console.log("landed", page.url());

await browser.close();
