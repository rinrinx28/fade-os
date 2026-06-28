"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound, LogOut, Check } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { clearMustChangePassword } from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { viAuthError } from "@/lib/auth-errors";

const MIN_LEN = 6;

export function ForcePasswordChange({ email }: { email: string }) {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);

  const tooShort = pw.length > 0 && pw.length < MIN_LEN;
  const mismatch = pw2.length > 0 && pw !== pw2;
  const matched = pw.length >= MIN_LEN && pw === pw2;
  const canSubmit = pw.length >= MIN_LEN && pw === pw2 && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < MIN_LEN) {
      toast.error(`Mật khẩu tối thiểu ${MIN_LEN} ký tự.`);
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
          <Field
            label="Mật khẩu mới"
            required
            error={tooShort ? `Tối thiểu ${MIN_LEN} ký tự.` : undefined}
            hint={tooShort ? undefined : "Phải khác mật khẩu tạm chủ tiệm cấp"}
          >
            <PasswordInput
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder={`Tối thiểu ${MIN_LEN} ký tự`}
              autoComplete="new-password"
              autoFocus
            />
          </Field>
          <Field
            label="Nhập lại mật khẩu"
            required
            error={mismatch ? "Mật khẩu nhập lại không khớp." : undefined}
          >
            <PasswordInput
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </Field>
        </div>

        {matched && (
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-success">
            <Check className="size-3.5" /> Mật khẩu khớp, sẵn sàng tiếp tục.
          </p>
        )}

        <Button type="submit" size="lg" loading={loading} disabled={!canSubmit} className="mt-6 w-full">
          Đổi mật khẩu &amp; tiếp tục
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
