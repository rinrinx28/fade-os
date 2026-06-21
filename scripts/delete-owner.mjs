// Xoá CHỦ TIỆM → xoá sạch dữ liệu của ĐÚNG tiệm đó (cascade theo shop_id),
// KHÔNG đụng tiệm khác. Mặc định giữ tài khoản nhân viên; --all xoá luôn.
// Dùng: node --env-file=.env.local scripts/delete-owner.mjs <email-chu-tiem> [--all]
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2];
const purgeAll = process.argv.includes("--all");

if (!url || !serviceKey) {
  console.error("✗ Thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!email) {
  console.error("✗ Cần email chủ tiệm. VD: node --env-file=.env.local scripts/delete-owner.mjs chu@tiem.com");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

const list = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
const owner = list.data.users.find((u) => u.email === email);
if (!owner) {
  console.error(`✗ Không tìm thấy tài khoản ${email}.`);
  process.exit(1);
}

const { data: ownerMember } = await admin
  .from("fade_os_members")
  .select("shop_id, role")
  .eq("user_id", owner.id)
  .eq("active", true)
  .maybeSingle();
if (ownerMember?.role !== "owner") {
  console.error(`✗ ${email} không phải chủ tiệm đang hoạt động. Huỷ.`);
  process.exit(1);
}
const shopId = ownerMember.shop_id;

// Thu thập nhân viên của tiệm này (trước khi cascade)
const { data: shopMembers } = await admin.from("fade_os_members").select("user_id, role").eq("shop_id", shopId);
const employeeIds = (shopMembers ?? []).filter((m) => m.role !== "owner").map((m) => m.user_id);

// Xoá tiệm → cascade toàn bộ dữ liệu (thợ, dịch vụ, ca, hoá đơn, kết toán, thành viên)
const { error: delErr } = await admin.from("fade_os_shops").delete().eq("id", shopId);
if (delErr) {
  console.error("✗ Lỗi xoá tiệm:", delErr.message);
  process.exit(1);
}
console.log("✓ Đã xoá tiệm + toàn bộ dữ liệu liên quan (cascade). Tiệm khác không bị ảnh hưởng.");

// Xoá tài khoản chủ
await admin.auth.admin.deleteUser(owner.id);
console.log(`✓ Đã xoá tài khoản chủ tiệm ${email}.`);

if (purgeAll) {
  for (const id of employeeIds) await admin.auth.admin.deleteUser(id);
  console.log(`✓ (--all) Đã xoá ${employeeIds.length} tài khoản nhân viên.`);
} else {
  console.log(`• Giữ lại ${employeeIds.length} tài khoản nhân viên (có thể vào tiệm khác). Dùng --all để xoá luôn.`);
}
