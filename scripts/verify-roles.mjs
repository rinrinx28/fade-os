// Kiểm chứng RLS theo vai trò: owner thấy tất cả, nhân viên chỉ thấy của mình
// và bị chặn khỏi quỹ. Tạo tài khoản test rồi dọn sạch.
// Dùng: node --env-file=.env.local scripts/verify-roles.mjs
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

const ownerId = await ensureUser("owner-test@fade.os");
const empId = await ensureUser("emp-test@fade.os");

await admin.from("fade_os_members").upsert(
  [
    { user_id: ownerId, email: "owner-test@fade.os", role: "owner", must_change_password: false },
    { user_id: empId, email: "emp-test@fade.os", role: "staff", must_change_password: false },
  ],
  { onConflict: "user_id" },
);

await admin.from("fade_os_staff").delete().in("user_id", [ownerId, empId]);
const { data: ownerStaff } = await admin.from("fade_os_staff").insert({ name: "Owner Test", role: "manager", commission_rate: 50, user_id: ownerId, active: true }).select().single();
const { data: empStaff } = await admin.from("fade_os_staff").insert({ name: "Emp Test", role: "barber", commission_rate: 50, user_id: empId, active: true }).select().single();

const { data: shift } = await admin.from("fade_os_shifts").insert({ opening_fund: 1000000, opened_by: "Owner Test" }).select().single();
await admin.from("fade_os_transactions").insert([
  { shift_id: shift.id, staff_id: ownerStaff.id, payment_method: "cash", subtotal: 100000, total: 100000 },
  { shift_id: shift.id, staff_id: empStaff.id, payment_method: "cash", subtotal: 100000, total: 100000 },
]);
await admin.from("fade_os_cash_movements").insert({ shift_id: shift.id, direction: "out", amount: 50000, reason: "test" });

const empC = createClient(url, anon);
await empC.auth.signInWithPassword({ email: "emp-test@fade.os", password: PW });
const empTxn = await empC.from("fade_os_transactions").select("id, staff_id");
const empCash = await empC.from("fade_os_cash_movements").select("id");

const ownerC = createClient(url, anon);
await ownerC.auth.signInWithPassword({ email: "owner-test@fade.os", password: PW });
const ownTxn = await ownerC.from("fade_os_transactions").select("id");
const ownCash = await ownerC.from("fade_os_cash_movements").select("id");

console.log(`[nhân viên] thấy hoá đơn = ${empTxn.data?.length ?? 0} (kỳ vọng 1 — chỉ của mình)`);
console.log(`[nhân viên] thấy quỹ chi   = ${empCash.data?.length ?? 0} (kỳ vọng 0 — bị chặn)`);
console.log(`[chủ tiệm]  thấy hoá đơn = ${ownTxn.data?.length ?? 0} (kỳ vọng ≥2 — tất cả)`);
console.log(`[chủ tiệm]  thấy quỹ chi   = ${ownCash.data?.length ?? 0} (kỳ vọng ≥1)`);

const pass =
  empTxn.data?.length === 1 &&
  (empCash.data?.length ?? 0) === 0 &&
  (ownTxn.data?.length ?? 0) >= 2 &&
  (ownCash.data?.length ?? 0) >= 1;

// dọn dẹp
await admin.from("fade_os_transactions").delete().eq("shift_id", shift.id);
await admin.from("fade_os_cash_movements").delete().eq("shift_id", shift.id);
await admin.from("fade_os_shifts").delete().eq("id", shift.id);
await admin.from("fade_os_staff").delete().in("user_id", [ownerId, empId]);
await admin.auth.admin.deleteUser(ownerId);
await admin.auth.admin.deleteUser(empId);

console.log(pass ? "\n✓ RLS THEO VAI TRÒ ĐÚNG (đã dọn dữ liệu test)" : "\n✗ KIỂM TRA THẤT BẠI");
process.exit(pass ? 0 : 1);
