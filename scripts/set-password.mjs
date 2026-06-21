// Đặt lại mật khẩu cho bất kỳ tài khoản nào (dùng service role) — cứu cánh khi chủ quên mật khẩu.
// Dùng: node --env-file=.env.local scripts/set-password.mjs <email> <mật-khẩu-mới>
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2];
const password = process.argv[3];

if (!url || !serviceKey) {
  console.error("✗ Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!email || !password) {
  console.error("✗ Dùng: node --env-file=.env.local scripts/set-password.mjs <email> <mật-khẩu-mới>");
  process.exit(1);
}
if (password.length < 6) {
  console.error("✗ Mật khẩu tối thiểu 6 ký tự.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
const list = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
const user = list.data.users.find((u) => u.email === email);
if (!user) {
  console.error(`✗ Không tìm thấy tài khoản ${email}.`);
  process.exit(1);
}

const { error } = await admin.auth.admin.updateUserById(user.id, { password });
if (error) {
  console.error("✗ Lỗi:", error.message);
  process.exit(1);
}
console.log(`✓ Đã đặt lại mật khẩu cho ${email}.`);
