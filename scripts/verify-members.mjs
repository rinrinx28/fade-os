// Chứng minh việc tách auth: người KHÔNG phải thành viên fade-os bị RLS chặn.
// Dùng: node --env-file=.env.local scripts/verify-members.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

const admin = createClient(url, service, { auth: { persistSession: false } });
const PROBE_EMAIL = "probe-noaccess@fade.os";
const PROBE_PASS = "probe-fadeos-0000";

// 1) Tạo 1 user KHÔNG có membership (giả lập user của app khác cùng project)
await admin.auth.admin.createUser({ email: PROBE_EMAIL, password: PROBE_PASS, email_confirm: true }).catch(() => {});

// 2) User không-thành-viên đăng nhập rồi thử đọc dữ liệu fade-os
const probe = createClient(url, anon);
const probeAuth = await probe.auth.signInWithPassword({ email: PROBE_EMAIL, password: PROBE_PASS });
const probeRead = await probe.from("fade_os_services").select("*");
const probeMember = await probe.from("fade_os_members").select("*").maybeSingle();
console.log(`[non-member] đăng nhập: ${probeAuth.error ? "lỗi" : "OK"}`);
console.log(`[non-member] đọc services = ${probeRead.data?.length ?? 0} dòng (kỳ vọng 0 — bị RLS chặn)`);
console.log(`[non-member] là thành viên? ${probeMember.data ? "CÓ" : "KHÔNG"}`);

// 3) Thành viên thật đăng nhập và đọc được
const member = createClient(url, anon);
await member.auth.signInWithPassword({ email: "thungan@fade.os", password: "fadeos2026" });
const memberRead = await member.from("fade_os_services").select("*");
console.log(`[member] đọc services = ${memberRead.data?.length ?? 0} dòng (kỳ vọng 8)`);

// 4) Dọn user probe
const list = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
const probeId = list.data.users.find((u) => u.email === PROBE_EMAIL)?.id;
if (probeId) await admin.auth.admin.deleteUser(probeId);

const pass = (probeRead.data?.length ?? 0) === 0 && (memberRead.data?.length ?? 0) >= 8;
console.log(pass ? "\n✓ TÁCH AUTH HOẠT ĐỘNG: non-member bị chặn, member vào được." : "\n✗ KIỂM TRA THẤT BẠI");
process.exit(pass ? 0 : 1);
