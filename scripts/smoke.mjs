// Kiểm tra nhanh: anon key + đăng nhập + RLS hoạt động đúng như trên trình duyệt.
// Dùng: node --env-file=.env.local scripts/smoke.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const sb = createClient(url, anon);

// 1) Chưa đăng nhập → RLS chặn (trả về rỗng)
const anonRead = await sb.from("fade_os_services").select("*");
console.log(`[anon] services rows = ${anonRead.data?.length ?? 0} (kỳ vọng 0 do RLS)`);

// 2) Đăng nhập
const { error: signErr } = await sb.auth.signInWithPassword({
  email: "thungan@fade.os",
  password: "fadeos2026",
});
if (signErr) {
  console.error("✗ Đăng nhập thất bại:", signErr.message);
  process.exit(1);
}
console.log("[auth] đăng nhập OK");

// 3) Đã đăng nhập → đọc được dữ liệu
const authedServices = await sb.from("fade_os_services").select("*");
const authedStaff = await sb.from("fade_os_staff").select("*");
if (authedServices.error) {
  console.error("✗ Đọc services lỗi:", authedServices.error.message);
  process.exit(1);
}
console.log(`[authed] services = ${authedServices.data.length}, staff = ${authedStaff.data?.length ?? 0}`);
console.log(authedServices.data.length >= 8 ? "✓ Smoke test PASS" : "✗ Số dòng không đúng");
