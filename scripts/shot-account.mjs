import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const b = await chromium.launch();

// 1) Quên mật khẩu — bước nhập email
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await p.getByRole("button", { name: "Quên mật khẩu?" }).click();
  await p.waitForTimeout(500);
  await p.screenshot({ path: "screenshots/15-forgot-email.png" });
  console.log("✓ 15-forgot-email");
  // 2) Bước nhập mã 6 số
  await p.fill('input[type="email"]', "shot-owner@fade.os");
  await p.getByRole("button", { name: "Gửi mã khôi phục" }).click();
  await p.waitForTimeout(2000);
  await p.screenshot({ path: "screenshots/16-forgot-code.png" });
  console.log("✓ 16-forgot-code");
  await ctx.close();
}

// 3) Màn Hồ sơ (đăng nhập owner)
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await p.fill('input[type="email"]', "shot-owner@fade.os");
  await p.fill('input[type="password"]', "test12345");
  await p.click('button[type="submit"]');
  await p.waitForURL((u) => !u.pathname.includes("login"), { timeout: 15000 }).catch(() => {});
  await p.goto(`${BASE}/profile`, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: "screenshots/17-profile.png" });
  console.log("✓ 17-profile");
  await ctx.close();
}

await b.close();
