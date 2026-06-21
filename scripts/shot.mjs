// Chụp ảnh các màn hình chính để kiểm tra giao diện.
// Yêu cầu dev server đang chạy ở http://localhost:3000
// Dùng: node scripts/shot.mjs
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = "http://localhost:3000";
const OUT = "screenshots";
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();

async function shoot(name, path, { width = 1440, height = 900, login = true } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  if (login) {
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await page.fill('input[type="email"]', "thungan@fade.os");
    await page.fill('input[type="password"]', "fadeos2026");
    await page.click('button[type="submit"]');
    await page.waitForURL((u) => !u.pathname.includes("login"), { timeout: 15000 }).catch(() => {});
  }
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
  console.log(`✓ ${name}.png`);
  await ctx.close();
}

await shoot("01-login", "/login", { login: false });
await shoot("02-dashboard", "/");
await shoot("03-pos", "/pos");
await shoot("04-shifts", "/shifts");
await shoot("05-services", "/services");
await shoot("06-reports", "/reports");
await shoot("07-mobile-dashboard", "/", { width: 390, height: 844 });

await browser.close();
console.log("Xong. Ảnh nằm trong thư mục screenshots/");
