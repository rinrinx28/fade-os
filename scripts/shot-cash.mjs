import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.fill('input[type="email"]', "tester@fade.os");
await page.fill('input[type="password"]', "test12345");
await page.click('button[type="submit"]');
await page.waitForURL((u) => !u.pathname.includes("login"), { timeout: 15000 }).catch(() => {});

await page.goto(`${BASE}/pos`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await page.getByRole("button", { name: /Cắt nam cơ bản/ }).click();
await page.getByRole("button", { name: /Fade \/ Undercut/ }).click();
await page.waitForTimeout(400);
await page.getByRole("button", { name: /^500\.000$/ }).click();
await page.waitForTimeout(700);
await page.screenshot({ path: "screenshots/08-pos-cash.png" });
console.log("✓ 08-pos-cash.png");

await browser.close();
