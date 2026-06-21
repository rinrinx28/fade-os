"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { TABLE } from "@/lib/tables";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

async function getUser() {
  const sb = await getSupabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return { sb, user };
}

async function isOwner(): Promise<boolean> {
  const { sb, user } = await getUser();
  if (!user) return false;
  const { data } = await sb
    .from(TABLE.members)
    .select("role")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();
  return data?.role === "owner";
}

/** Tiệm đang hoạt động của một user (membership active). */
async function activeShopOf(userId: string): Promise<string | null> {
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from(TABLE.members)
    .select("shop_id")
    .eq("user_id", userId)
    .eq("active", true)
    .maybeSingle();
  return data?.shop_id ?? null;
}

/** Người dùng tự cập nhật tên + SĐT của hồ sơ thợ gắn với mình (chỉ 2 cột này). */
export async function updateMyProfile(input: { name: string; phone: string | null }): Promise<ActionResult> {
  try {
    const { user } = await getUser();
    if (!user) return { ok: false, error: "Chưa đăng nhập." };
    if (!input.name.trim()) return { ok: false, error: "Tên không được để trống." };
    const shopId = await activeShopOf(user.id);
    if (!shopId) return { ok: false, error: "Không xác định được tiệm." };
    const admin = getSupabaseAdminClient();
    const { error } = await admin
      .from(TABLE.staff)
      .update({ name: input.name.trim(), phone: input.phone })
      .eq("user_id", user.id)
      .eq("shop_id", shopId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Lỗi không xác định." };
  }
}

/** Nhân viên tự xoá cờ ép-đổi-mật-khẩu sau khi đã đổi xong. */
export async function clearMustChangePassword(): Promise<ActionResult> {
  try {
    const { user } = await getUser();
    if (!user) return { ok: false, error: "Chưa đăng nhập." };
    const admin = getSupabaseAdminClient();
    const { error } = await admin
      .from(TABLE.members)
      .update({ must_change_password: false })
      .eq("user_id", user.id)
      .eq("active", true);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Lỗi không xác định." };
  }
}

export interface CreateEmployeeInput {
  name: string;
  email: string;
  password: string;
  commissionRate: number;
  color: string;
  phone?: string | null;
}

/**
 * Chủ tiệm tạo tài khoản nhân viên + hồ sơ thợ, ép đổi mật khẩu lần đầu.
 * Nếu email đã tồn tại nhưng CHƯA là thành viên còn hiệu lực của tiệm → gắn vào tiệm
 * (mỗi email chỉ thuộc 1 tiệm: đang là thành viên active thì từ chối).
 */
export async function createEmployee(input: CreateEmployeeInput): Promise<ActionResult> {
  try {
    if (!(await isOwner())) return { ok: false, error: "Không có quyền." };
    const { user: owner } = await getUser();
    const shopId = owner ? await activeShopOf(owner.id) : null;
    if (!shopId) return { ok: false, error: "Không xác định được tiệm của bạn." };
    const admin = getSupabaseAdminClient();

    let userId: string;
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
    });

    if (createErr) {
      if (!createErr.message?.toLowerCase().includes("already")) {
        return { ok: false, error: createErr.message };
      }
      const list = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const existing = list.data.users.find((u) => u.email === input.email);
      if (!existing) return { ok: false, error: "Email đã tồn tại nhưng không tìm thấy." };
      userId = existing.id;
      await admin.auth.admin.updateUserById(userId, { password: input.password });
    } else {
      userId = created.user.id;
    }

    // Mỗi email chỉ ở 1 tiệm active.
    const { data: anyActive } = await admin
      .from(TABLE.members)
      .select("shop_id")
      .eq("user_id", userId)
      .eq("active", true)
      .maybeSingle();
    if (anyActive) return { ok: false, error: "Email này đang là thành viên của một tiệm khác." };

    const { error: memberErr } = await admin
      .from(TABLE.members)
      .upsert(
        { user_id: userId, shop_id: shopId, email: input.email, role: "staff", must_change_password: true, active: true },
        { onConflict: "user_id,shop_id" },
      );
    if (memberErr) return { ok: false, error: memberErr.message };

    // Tái dùng hồ sơ thợ của user TRONG TIỆM NÀY nếu có; nếu chưa thì tạo mới.
    const { data: existingStaff } = await admin
      .from(TABLE.staff)
      .select("id")
      .eq("user_id", userId)
      .eq("shop_id", shopId)
      .maybeSingle();
    const payload = {
      name: input.name.trim(),
      commission_rate: input.commissionRate,
      color: input.color,
      phone: input.phone ?? null,
      active: true,
    };
    const { error: staffErr } = existingStaff
      ? await admin.from(TABLE.staff).update(payload).eq("id", existingStaff.id)
      : await admin.from(TABLE.staff).insert({ ...payload, role: "barber", user_id: userId, shop_id: shopId });
    if (staffErr) return { ok: false, error: staffErr.message };

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Lỗi không xác định." };
  }
}

/**
 * Gỡ nhân viên khỏi tiệm (xoá mềm): membership tiệm này active=false + ẩn hồ sơ thợ,
 * GIỮ toàn bộ dữ liệu. KHÔNG ban tài khoản — họ vẫn có thể được mời vào tiệm khác.
 */
export async function removeEmployeeFromShop(input: { userId: string; staffId: string }): Promise<ActionResult> {
  try {
    if (!(await isOwner())) return { ok: false, error: "Không có quyền." };
    const { user: owner } = await getUser();
    const shopId = owner ? await activeShopOf(owner.id) : null;
    if (!shopId) return { ok: false, error: "Không xác định được tiệm." };
    const admin = getSupabaseAdminClient();
    const { error: mErr } = await admin
      .from(TABLE.members)
      .update({ active: false })
      .eq("user_id", input.userId)
      .eq("shop_id", shopId);
    if (mErr) return { ok: false, error: mErr.message };
    const { error: sErr } = await admin.from(TABLE.staff).update({ active: false }).eq("id", input.staffId);
    if (sErr) return { ok: false, error: sErr.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Lỗi không xác định." };
  }
}

/** Mời lại nhân viên đã gỡ vào tiệm này (nếu họ chưa ở tiệm khác). */
export async function reinviteEmployee(input: { userId: string; staffId: string; password: string }): Promise<ActionResult> {
  try {
    if (!(await isOwner())) return { ok: false, error: "Không có quyền." };
    const { user: owner } = await getUser();
    const shopId = owner ? await activeShopOf(owner.id) : null;
    if (!shopId) return { ok: false, error: "Không xác định được tiệm." };
    const admin = getSupabaseAdminClient();

    const { data: anyActive } = await admin
      .from(TABLE.members)
      .select("shop_id")
      .eq("user_id", input.userId)
      .eq("active", true)
      .maybeSingle();
    if (anyActive) return { ok: false, error: "Nhân viên này đang ở một tiệm khác." };

    const { error: pErr } = await admin.auth.admin.updateUserById(input.userId, { password: input.password });
    if (pErr) return { ok: false, error: pErr.message };
    const { error: mErr } = await admin
      .from(TABLE.members)
      .update({ active: true, must_change_password: true })
      .eq("user_id", input.userId)
      .eq("shop_id", shopId);
    if (mErr) return { ok: false, error: mErr.message };
    const { error: sErr } = await admin.from(TABLE.staff).update({ active: true }).eq("id", input.staffId);
    if (sErr) return { ok: false, error: sErr.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Lỗi không xác định." };
  }
}

/** Chủ đặt lại mật khẩu tạm cho nhân viên + ép đổi lần kế tiếp. */
export async function resetEmployeePassword(input: { userId: string; password: string }): Promise<ActionResult> {
  try {
    if (!(await isOwner())) return { ok: false, error: "Không có quyền." };
    const { user: owner } = await getUser();
    const shopId = owner ? await activeShopOf(owner.id) : null;
    if (!shopId) return { ok: false, error: "Không xác định được tiệm." };
    const admin = getSupabaseAdminClient();
    const { error } = await admin.auth.admin.updateUserById(input.userId, { password: input.password });
    if (error) return { ok: false, error: error.message };
    const { error: memberErr } = await admin
      .from(TABLE.members)
      .update({ must_change_password: true })
      .eq("user_id", input.userId)
      .eq("shop_id", shopId);
    if (memberErr) return { ok: false, error: memberErr.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Lỗi không xác định." };
  }
}
