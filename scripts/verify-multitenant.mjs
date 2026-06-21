// Kiểm chứng multi-tenant: 2 tiệm tách biệt tuyệt đối (không leak),
// 1 email = 1 tiệm active, chuyển tiệm không mang data cũ, trigger tự gán shop_id.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const admin = createClient(url, service, { auth: { persistSession: false } });
const PW = "test12345";

async function ensureUser(email) {
  const { data, error } = await admin.auth.admin.createUser({ email, password: PW, email_confirm: true });
  if (error) {
    const list = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    return list.data.users.find((u) => u.email === email)?.id;
  }
  return data.user.id;
}
async function client(email) {
  const c = createClient(url, anon);
  await c.auth.signInWithPassword({ email, password: PW });
  return c;
}
async function readTxn(email) {
  const c = await client(email);
  const r = await c.from("fade_os_transactions").select("id, shop_id");
  return r.data ?? [];
}

async function makeShop(name, ownerEmail) {
  const ownerId = await ensureUser(ownerEmail);
  const { data: shop } = await admin.from("fade_os_shops").insert({ name }).select().single();
  await admin.from("fade_os_members").insert({ user_id: ownerId, shop_id: shop.id, email: ownerEmail, role: "owner", active: true });
  await admin.from("fade_os_staff").insert({ name: `Chủ ${name}`, shop_id: shop.id, user_id: ownerId, role: "manager", commission_rate: 50, active: true });
  return { ownerId, shopId: shop.id };
}

const A = await makeShop("Tiệm A", "ownerA@fade.os");
const B = await makeShop("Tiệm B", "ownerB@fade.os");

// Nhân viên A + ca + dịch vụ
const empAId = await ensureUser("empA@fade.os");
await admin.from("fade_os_members").insert({ user_id: empAId, shop_id: A.shopId, email: "empA@fade.os", role: "staff", active: true });
const { data: empAStaff } = await admin.from("fade_os_staff").insert({ name: "Emp A", shop_id: A.shopId, user_id: empAId, role: "barber", commission_rate: 50, active: true }).select().single();
const { data: shiftA } = await admin.from("fade_os_shifts").insert({ opening_fund: 0, shop_id: A.shopId }).select().single();

// TRIGGER TEST: empA tự tạo hoá đơn KHÔNG truyền shop_id → trigger tự gán = tiệm A
const cA = await client("empA@fade.os");
const ins = await cA.from("fade_os_transactions").insert({ shift_id: shiftA.id, staff_id: empAStaff.id, payment_method: "cash", subtotal: 100000, total: 100000 }).select("shop_id").single();
const triggerOk = !ins.error && ins.data?.shop_id === A.shopId;
console.log(`[trigger] hoá đơn empA tự gán shop_id = tiệm A: ${triggerOk ? "OK" : "✗ " + (ins.error?.message ?? ins.data?.shop_id)}`);

// Nhân viên B + ca + hoá đơn (admin)
const empBId = await ensureUser("empB@fade.os");
await admin.from("fade_os_members").insert({ user_id: empBId, shop_id: B.shopId, email: "empB@fade.os", role: "staff", active: true });
const { data: empBStaff } = await admin.from("fade_os_staff").insert({ name: "Emp B", shop_id: B.shopId, user_id: empBId, role: "barber", commission_rate: 50, active: true }).select().single();
const { data: shiftB } = await admin.from("fade_os_shifts").insert({ opening_fund: 0, shop_id: B.shopId }).select().single();
await admin.from("fade_os_transactions").insert({ shop_id: B.shopId, shift_id: shiftB.id, staff_id: empBStaff.id, payment_method: "cash", subtotal: 200000, total: 200000 });

// ISOLATION: chủ A chỉ thấy data A, chủ B chỉ thấy data B
const ownerA = await readTxn("ownerA@fade.os");
const ownerB = await readTxn("ownerB@fade.os");
const noLeak = ownerA.length === 1 && ownerA.every((t) => t.shop_id === A.shopId) && ownerB.length === 1 && ownerB.every((t) => t.shop_id === B.shopId);
console.log(`[isolation] chủ A thấy ${ownerA.length} HĐ (đều tiệm A), chủ B thấy ${ownerB.length} HĐ (đều tiệm B) → ${noLeak ? "KHÔNG LEAK" : "✗ LEAK"}`);

// 1 EMAIL 1 TIỆM: empA đang active ở A → thêm active ở B phải bị chặn
const dup = await admin.from("fade_os_members").insert({ user_id: empAId, shop_id: B.shopId, email: "empA@fade.os", role: "staff", active: true });
const oneShop = !!dup.error;
console.log(`[1 email 1 tiệm] thêm empA vào tiệm B khi đang ở A: ${oneShop ? "bị chặn ✓" : "✗ KHÔNG chặn"}`);

// CHUYỂN TIỆM: gỡ khỏi A → vào B → KHÔNG mang data cũ; data cũ ở lại tiệm A
await admin.from("fade_os_members").update({ active: false }).eq("user_id", empAId).eq("shop_id", A.shopId);
await admin.from("fade_os_staff").update({ active: false }).eq("id", empAStaff.id);
await admin.from("fade_os_members").insert({ user_id: empAId, shop_id: B.shopId, email: "empA@fade.os", role: "staff", active: true });
await admin.from("fade_os_staff").insert({ name: "Emp A tại B", shop_id: B.shopId, user_id: empAId, role: "barber", commission_rate: 50, active: true });
const empAInB = await readTxn("empA@fade.os");
const ownerAAfter = await readTxn("ownerA@fade.os");
const noCarry = empAInB.length === 0;
console.log(`[chuyển tiệm] empA (giờ ở B) thấy ${empAInB.length} HĐ (kỳ vọng 0 — không mang data cũ)`);
console.log(`[chuyển tiệm] chủ A vẫn thấy ${ownerAAfter.length} HĐ (kỳ vọng 1 — data cũ ở lại tiệm A)`);

const pass = triggerOk && noLeak && oneShop && noCarry && ownerAAfter.length === 1;

// dọn dẹp: xoá 2 tiệm (cascade) + tài khoản test
await admin.from("fade_os_shops").delete().in("id", [A.shopId, B.shopId]);
const list = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
for (const u of list.data.users) if (/@fade\.os$/.test(u.email ?? "")) await admin.auth.admin.deleteUser(u.id);

console.log(pass ? "\n✓ MULTI-TENANT ĐÚNG: tách biệt tuyệt đối, không leak (đã dọn test)" : "\n✗ KIỂM TRA THẤT BẠI");
process.exit(pass ? 0 : 1);
