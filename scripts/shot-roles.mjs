import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const b = await chromium.launch();

async function shoot(name, email, path, action) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await p.fill('input[type="email"]', email);
  await p.fill('input[type="password"]', "test12345");
  await p.click('button[type="submit"]');
  await p.waitForURL((u) => !u.pathname.includes("login"), { timeout: 15000 }).catch(() => {});
  await p.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1000);
  if (action) await action(p);
  await p.waitForTimeout(800);
  await p.screenshot({ path: `screenshots/${name}.png` });
  console.log("✓", name);
  await ctx.close();
}

await shoot("10-owner-staff", "owner2@fade.os", "/staff");
await shoot("11-owner-settlements", "owner2@fade.os", "/settlements", async (p) => {
  await p.getByRole("button", { name: /Khoa Demo/ }).first().click();
});
await shoot("12-owner-dashboard", "owner2@fade.os", "/");
await shoot("13-emp-pos", "nv2@fade.os", "/pos", async (p) => {
  await p.getByRole("button", { name: /Cắt nam cơ bản/ }).click();
});
await shoot("14-emp-me", "nv2@fade.os", "/me");
await b.close();
