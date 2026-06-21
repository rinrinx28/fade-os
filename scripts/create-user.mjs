// Tạo TIỆM mới + tài khoản CHỦ TIỆM (owner) + hồ sơ thợ chủ.
// Dùng: node --env-file=.env.local scripts/create-user.mjs <email> <password> [tên-chủ] [tên-tiệm]
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2] ?? "owner@fade.os";
const password = process.argv[3] ?? "fadeos2026";
const ownerName = process.argv[4] ?? email.split("@")[0];
const shopName = process.argv[5] ?? "Tiệm của tôi";

if (!url || !serviceKey) {
  console.error("✗ Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

// 1) Tạo (hoặc tìm) tài khoản
let userId;
const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
if (error) {
  if (error.message?.toLowerCase().includes("already") || error.status === 422) {
    const list = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    userId = list.data.users.find((u) => u.email === email)?.id;
    if (!userId) {
      console.error("✗ Email đã tồn tại nhưng không tìm thấy user id.");
      process.exit(1);
    }
    console.log(`• Tài khoản ${email} đã tồn tại.`);
  } else {
    console.error("✗ Lỗi tạo user:", error.message);
    process.exit(1);
  }
} else {
  userId = data.user.id;
  console.log(`✓ Đã tạo tài khoản: ${email} (mật khẩu: ${password})`);
}

// 2) Mỗi email chỉ ở 1 tiệm active
const { data: activeM } = await admin
  .from("fade_os_members")
  .select("shop_id")
  .eq("user_id", userId)
  .eq("active", true)
  .maybeSingle();
if (activeM) {
  console.error("✗ Email này đang là thành viên của một tiệm. Gỡ khỏi tiệm đó trước khi tạo tiệm mới.");
  process.exit(1);
}

// 3) Tạo tiệm
const { data: shop, error: shopErr } = await admin.from("fade_os_shops").insert({ name: shopName }).select().single();
if (shopErr) {
  console.error("✗ Lỗi tạo tiệm:", shopErr.message);
  process.exit(1);
}

// 4) Gắn chủ tiệm + hồ sơ thợ chủ (kèm shop_id)
const { error: memberErr } = await admin.from("fade_os_members").insert({
  user_id: userId,
  shop_id: shop.id,
  email,
  role: "owner",
  active: true,
  must_change_password: false,
});
if (memberErr) {
  console.error("✗ Lỗi cấp quyền:", memberErr.message);
  process.exit(1);
}

const { error: staffErr } = await admin.from("fade_os_staff").insert({
  name: ownerName,
  shop_id: shop.id,
  role: "manager",
  commission_rate: 50,
  color: "#B45309",
  user_id: userId,
  active: true,
});
if (staffErr) {
  console.error("✗ Lỗi tạo hồ sơ thợ:", staffErr.message);
  process.exit(1);
}

console.log(`✓ Đã tạo tiệm "${shopName}" với chủ "${ownerName}".`);
console.log(`  Shop ID: ${shop.id}`);
