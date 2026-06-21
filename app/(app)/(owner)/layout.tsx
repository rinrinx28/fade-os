import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { TABLE } from "@/lib/tables";

/** Bảo vệ các màn chỉ dành cho chủ tiệm. Nhân viên → đẩy về màn Tính tiền. */
export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from(TABLE.members)
    .select("role")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (member?.role !== "owner") redirect("/pos");

  return <>{children}</>;
}
