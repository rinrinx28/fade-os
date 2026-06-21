// Xoá tài khoản đăng nhập (xoá auth user → tự cascade dòng fade_os_members).
// Dùng: node --env-file=.env.local scripts/delete-user.mjs <email>
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2];

if (!url || !serviceKey) {
  console.error("✗ Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!email) {
  console.error("✗ Cần email. Ví dụ: node --env-file=.env.local scripts/delete-user.mjs cu@tiem.com");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

const list = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
const user = list.data.users.find((u) => u.email === email);

if (!user) {
  console.log(`• Không tìm thấy tài khoản ${email}.`);
  process.exit(0);
}

const { error } = await admin.auth.admin.deleteUser(user.id);
if (error) {
  console.error("✗ Lỗi xoá:", error.message);
  process.exit(1);
}

console.log(`✓ Đã xoá tài khoản ${email} (và quyền thành viên fade-os kèm theo).`);
