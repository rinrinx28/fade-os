"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldX, LogOut } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function NoAccess({ email }: { email: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    await getSupabaseBrowserClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-3xl border border-line bg-paper p-8 text-center shadow-(--shadow-lg)">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-danger-soft text-danger">
          <ShieldX className="size-8" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-medium text-ink">Không có quyền truy cập</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Tài khoản <b className="text-ink-soft">{email}</b> chưa được cấp quyền dùng FADE OS. Liên hệ
          chủ tiệm để được thêm vào hệ thống.
        </p>
        <Button onClick={signOut} loading={loading} variant="secondary" className="mt-6 w-full">
          <LogOut className="size-4" /> Đăng xuất
        </Button>
      </div>
    </div>
  );
}
