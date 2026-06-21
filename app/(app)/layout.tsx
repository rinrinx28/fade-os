import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { NoAccess } from "@/components/layout/no-access";
import { ForcePasswordChange } from "@/components/auth/force-password-change";
import { SessionProvider, type SessionInfo } from "@/components/providers/session";
import { TABLE } from "@/lib/tables";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Membership ĐANG hiệu lực (tiệm hiện tại).
  const { data: member } = await supabase
    .from(TABLE.members)
    .select("role, must_change_password, shop_id")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (!member) return <NoAccess email={user.email ?? ""} />;
  if (member.must_change_password) return <ForcePasswordChange email={user.email ?? ""} />;

  const [{ data: shop }, { data: staff }] = await Promise.all([
    supabase.from(TABLE.shops).select("name").eq("id", member.shop_id).maybeSingle(),
    supabase.from(TABLE.staff).select("id, name, color").eq("user_id", user.id).eq("shop_id", member.shop_id).maybeSingle(),
  ]);

  const session: SessionInfo = {
    role: member.role,
    email: user.email ?? "",
    shopId: member.shop_id,
    shopName: shop?.name ?? "Tiệm",
    staffId: staff?.id ?? null,
    staffName: staff?.name ?? null,
    staffColor: staff?.color ?? null,
  };

  return (
    <SessionProvider value={session}>
      <AppShell userEmail={user.email ?? "Nhân viên"} role={member.role}>
        {children}
      </AppShell>
    </SessionProvider>
  );
}
