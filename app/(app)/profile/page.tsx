"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, KeyRound } from "lucide-react";
import { useSession } from "@/components/providers/session";
import { useMyStaff } from "@/hooks/use-staff";
import { updateMyProfile } from "@/app/actions/account";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { viAuthError } from "@/lib/auth-errors";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/constants";
import { formatPercent } from "@/lib/format";

export default function ProfilePage() {
  const session = useSession();
  const { data: me } = useMyStaff();
  const router = useRouter();
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);

  useEffect(() => {
    if (me) {
      setName(me.name);
      setPhone(me.phone ?? "");
    }
  }, [me]);

  async function saveInfo() {
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên.");
      return;
    }
    setSavingInfo(true);
    const res = await updateMyProfile({ name, phone: phone.trim() || null });
    setSavingInfo(false);
    if (!res.ok) {
      toast.error(res.error ?? "Không thể cập nhật.");
      return;
    }
    await qc.invalidateQueries({ queryKey: ["staff"] });
    toast.success("Đã cập nhật hồ sơ.");
    router.refresh();
  }

  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  async function savePassword() {
    if (!curPw) {
      toast.error("Nhập mật khẩu hiện tại.");
      return;
    }
    if (newPw.length < 6) {
      toast.error("Mật khẩu mới tối thiểu 6 ký tự.");
      return;
    }
    if (newPw !== newPw2) {
      toast.error("Mật khẩu nhập lại không khớp.");
      return;
    }
    setSavingPw(true);
    try {
      const sb = getSupabaseBrowserClient();
      const { error: reauth } = await sb.auth.signInWithPassword({ email: session.email, password: curPw });
      if (reauth) {
        toast.error("Mật khẩu hiện tại không đúng.");
        return;
      }
      const { error } = await sb.auth.updateUser({ password: newPw });
      if (error) {
        toast.error(viAuthError(error.message));
        return;
      }
      toast.success("Đổi mật khẩu thành công.");
      setCurPw("");
      setNewPw("");
      setNewPw2("");
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <div>
      <PageHeader title="Hồ sơ" description="Cập nhật thông tin cá nhân và mật khẩu." />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Thông tin cá nhân */}
        <section className="rounded-2xl border border-line bg-paper p-5 shadow-(--shadow-sm) sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <Avatar name={name || session.email} color={me?.color} size="lg" />
            <div>
              <p className="font-medium text-ink">{name || "—"}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                <Badge tone={session.role === "owner" ? "copper" : "info"}>
                  {session.role === "owner" ? "Chủ tiệm" : "Nhân viên"}
                </Badge>
                {me && me.commission_rate > 0 && (
                  <span className="text-xs text-ink-muted">Ăn chia {formatPercent(me.commission_rate)}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Field label="Email đăng nhập" hint="Không thể đổi">
              <Input value={session.email} disabled />
            </Field>
            <Field label="Tên hiển thị" required>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên của bạn" />
            </Field>
            <Field label="Số điện thoại">
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09xx xxx xxx"
                inputMode="tel"
              />
            </Field>
            <Button onClick={saveInfo} loading={savingInfo} disabled={!me} className="self-start">
              <Save className="size-4" /> Lưu thông tin
            </Button>
          </div>
        </section>

        {/* Đổi mật khẩu */}
        <section className="rounded-2xl border border-line bg-paper p-5 shadow-(--shadow-sm) sm:p-6">
          <div className="mb-5 flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-copper-soft text-copper-deep">
              <KeyRound className="size-5" />
            </span>
            <div>
              <h3 className="font-display text-lg font-medium text-ink">Đổi mật khẩu</h3>
              <p className="text-xs text-ink-muted">Cần nhập đúng mật khẩu hiện tại để xác nhận.</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Field label="Mật khẩu hiện tại" required>
              <Input type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
            </Field>
            <Field label="Mật khẩu mới" required hint="Tối thiểu 6 ký tự, khác mật khẩu cũ">
              <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
            </Field>
            <Field label="Nhập lại mật khẩu mới" required>
              <Input type="password" value={newPw2} onChange={(e) => setNewPw2(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
            </Field>
            <Button onClick={savePassword} loading={savingPw} variant="secondary" className="self-start">
              <KeyRound className="size-4" /> Đổi mật khẩu
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
