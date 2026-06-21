// Kiểm chứng xoá mềm: gỡ nhân viên → bị chặn đọc dữ liệu nhưng DATA vẫn còn;
// mời lại → khôi phục truy cập. Tạo dữ liệu test rồi dọn sạch.
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
const empReadOwn = async () => {
  const c = createClient(url, anon);
  await c.auth.signInWithPassword({ email: "emp-test@fade.os", password: PW });
  const txn = await c.from("fade_os_transactions").select("id");
  const svc = await c.from("fade_os_services").select("id");
  return { txns: txn.data?.length ?? 0, services: svc.data?.length ?? 0 };
};

const ownerId = await ensureUser("owner-test@fade.os");
const empId = await ensureUser("emp-test@fade.os");
await admin.from("fade_os_members").upsert(
  [
    { user_id: ownerId, email: "owner-test@fade.os", role: "owner", active: true },
    { user_id: empId, email: "emp-test@fade.os", role: "staff", active: true },
  ],
  { onConflict: "user_id" },
);
await admin.from("fade_os_staff").delete().in("user_id", [ownerId, empId]);
const { data: empStaff } = await admin.from("fade_os_staff").insert({ name: "Emp Test", role: "barber", commission_rate: 50, user_id: empId, active: true }).select().single();
await admin.from("fade_os_services").insert({ name: "DV test", price: 100000 });
const { data: shift } = await admin.from("fade_os_shifts").insert({ opening_fund: 0 }).select().single();
await admin.from("fade_os_transactions").insert({ shift_id: shift.id, staff_id: empStaff.id, payment_method: "cash", subtotal: 100000, total: 100000 });

const before = await empReadOwn();
console.log(`[trước khi gỡ]  NV đọc: ${before.txns} hoá đơn, ${before.services} dịch vụ (kỳ vọng 1 & ≥1)`);

// GỠ KHỎI TIỆM (xoá mềm)
await admin.from("fade_os_members").update({ active: false }).eq("user_id", empId);
await admin.from("fade_os_staff").update({ active: false }).eq("id", empStaff.id);

const afterRemove = await empReadOwn();
const { count: dataStillThere } = await admin.from("fade_os_transactions").select("id", { count: "exact", head: true }).eq("staff_id", empStaff.id);
const empCanSignIn = !(await createClient(url, anon).auth.signInWithPassword({ email: "emp-test@fade.os", password: PW })).error;
console.log(`[sau khi gỡ]    NV đọc: ${afterRemove.txns} hoá đơn, ${afterRemove.services} dịch vụ (kỳ vọng 0 & 0 — bị chặn)`);
console.log(`[sau khi gỡ]    Dữ liệu NV còn trên hệ thống: ${dataStillThere} hoá đơn (kỳ vọng 1 — vẫn giữ)`);
console.log(`[sau khi gỡ]    NV vẫn đăng nhập được (account không bị ban): ${empCanSignIn ? "có" : "không"} (kỳ vọng có)`);

// MỜI LẠI
await admin.from("fade_os_members").update({ active: true }).eq("user_id", empId);
await admin.from("fade_os_staff").update({ active: true }).eq("id", empStaff.id);
const afterReinvite = await empReadOwn();
console.log(`[sau mời lại]   NV đọc: ${afterReinvite.txns} hoá đơn (kỳ vọng 1 — khôi phục)`);

const pass =
  before.txns === 1 && afterRemove.txns === 0 && afterRemove.services === 0 &&
  dataStillThere === 1 && empCanSignIn && afterReinvite.txns === 1;

// dọn dẹp
await admin.from("fade_os_transactions").delete().eq("shift_id", shift.id);
await admin.from("fade_os_shifts").delete().eq("id", shift.id);
await admin.from("fade_os_staff").delete().in("user_id", [ownerId, empId]);
await admin.from("fade_os_services").delete().eq("name", "DV test");
await admin.auth.admin.deleteUser(ownerId);
await admin.auth.admin.deleteUser(empId);

console.log(pass ? "\n✓ XOÁ MỀM HOẠT ĐỘNG ĐÚNG (đã dọn dữ liệu test)" : "\n✗ KIỂM TRA THẤT BẠI");
process.exit(pass ? 0 : 1);
