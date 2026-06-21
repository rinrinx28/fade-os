"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound, LogOut } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { clearMustChangePassword } from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { viAuthError } from "@/lib/auth-errors";

export function ForcePasswordChange({ email }: { email: string }) {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 6) {
      toast.error("Mật khẩu tối thiểu 6 ký tự.");
      return;
    }
    if (pw !== pw2) {
      toast.error("Mật khẩu nhập lại không khớp.");
      return;
    }
    setLoading(true);
    try {
      const sb = getSupabaseBrowserClient();
      const { error } = await sb.auth.updateUser({ password: pw });
      if (error) {
        toast.error(viAuthError(error.message));
        return;
      }
      const res = await clearMustChangePassword();
      if (!res.ok) {
        toast.error(res.error ?? "Không thể hoàn tất.");
        return;
      }
      toast.success("Đổi mật khẩu thành công. Chào mừng bạn!");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await getSupabaseBrowserClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-3xl border border-line bg-paper p-8 shadow-(--shadow-lg)">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-copper-soft text-copper-deep">
          <KeyRound className="size-7" />
        </div>
        <h1 className="mt-5 text-center font-display text-2xl font-medium text-ink">Đặt mật khẩu mới</h1>
        <p className="mt-2 text-center text-sm text-ink-muted">
          Lần đầu đăng nhập với <b className="text-ink-soft">{email}</b>. Vui lòng đổi sang mật khẩu riêng
          của bạn để tiếp tục.
        </p>

        <div className="mt-6 flex flex-col gap-4">
          <Field label="Mật khẩu mới" required hint="Phải khác mật khẩu tạm chủ tiệm cấp">
            <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Tối thiểu 6 ký tự" autoFocus />
          </Field>
          <Field label="Nhập lại mật khẩu" required>
            <Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="••••••••" />
          </Field>
        </div>

        <Button type="submit" size="lg" loading={loading} className="mt-6 w-full">
          Đổi mật khẩu & tiếp tục
        </Button>

        <button
          type="button"
          onClick={signOut}
          className="mx-auto mt-4 flex items-center gap-1.5 text-xs text-ink-muted transition-colors hover:text-danger"
        >
          <LogOut className="size-3.5" /> Đăng xuất
        </button>
      </form>
    </div>
  );
}
