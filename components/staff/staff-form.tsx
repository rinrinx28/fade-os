"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Avatar } from "@/components/ui/avatar";
import { STAFF_COLORS } from "@/lib/constants";
import { useSaveStaff } from "@/hooks/use-staff";
import { createEmployee } from "@/app/actions/account";
import { cn } from "@/lib/utils";
import type { Staff } from "@/lib/types/db";

interface StaffFormProps {
  open: boolean;
  onClose: () => void;
  staff: Staff | null;
}

const empty = {
  name: "",
  phone: "",
  commission_rate: 50,
  color: STAFF_COLORS[0] as string,
  active: true,
  withAccount: true,
  email: "",
  password: "",
};

export function StaffForm({ open, onClose, staff }: StaffFormProps) {
  const save = useSaveStaff();
  const qc = useQueryClient();
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const isEdit = !!staff;

  useEffect(() => {
    if (!open) return;
    setForm(
      staff
        ? {
            ...empty,
            name: staff.name,
            phone: staff.phone ?? "",
            commission_rate: staff.commission_rate,
            color: staff.color ?? STAFF_COLORS[0],
            active: staff.active,
            withAccount: false,
          }
        : empty,
    );
  }, [open, staff]);

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên nhân viên.");
      return;
    }

    // Sửa nhân viên hiện có (không đụng tài khoản ở form này).
    if (isEdit) {
      try {
        await save.mutateAsync({
          id: staff.id,
          name: form.name,
          phone: form.phone.trim() || null,
          role: staff.role,
          commission_rate: form.commission_rate,
          color: form.color,
          active: staff.user_id ? staff.active : form.active,
        });
        toast.success("Đã cập nhật nhân viên.");
        onClose();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Không thể lưu.");
      }
      return;
    }

    // Tạo mới có tài khoản đăng nhập.
    if (form.withAccount) {
      if (!form.email.trim() || !form.password.trim()) {
        toast.error("Nhập email và mật khẩu tạm cho tài khoản.");
        return;
      }
      if (form.password.length < 6) {
        toast.error("Mật khẩu tạm tối thiểu 6 ký tự.");
        return;
      }
      setBusy(true);
      const res = await createEmployee({
        name: form.name,
        email: form.email.trim(),
        password: form.password,
        commissionRate: form.commission_rate,
        color: form.color,
        phone: form.phone.trim() || null,
      });
      setBusy(false);
      if (!res.ok) {
        toast.error(res.error ?? "Không thể tạo nhân viên.");
        return;
      }
      await qc.invalidateQueries({ queryKey: ["staff"] });
      await qc.invalidateQueries({ queryKey: ["members"] });
      toast.success("Đã tạo nhân viên + tài khoản. Nhân viên sẽ đổi mật khẩu lần đầu đăng nhập.");
      onClose();
      return;
    }

    // Tạo mới chỉ là hồ sơ thợ (không tài khoản).
    try {
      await save.mutateAsync({
        name: form.name,
        phone: form.phone.trim() || null,
        role: "barber",
        commission_rate: form.commission_rate,
        color: form.color,
        active: form.active,
      });
      toast.success("Đã thêm thợ (không tài khoản).");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể lưu.");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Sửa nhân viên" : "Thêm nhân viên"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={handleSubmit} loading={save.isPending || busy}>
            {isEdit ? "Lưu thay đổi" : "Thêm nhân viên"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={form.name || "?"} color={form.color} size="lg" />
          <div className="flex flex-wrap gap-2">
            {STAFF_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm((f) => ({ ...f, color: c }))}
                className={cn(
                  "size-7 rounded-full ring-2 ring-offset-2 ring-offset-paper transition-transform hover:scale-110",
                  form.color === c ? "ring-ink" : "ring-transparent",
                )}
                style={{ background: c }}
                aria-label={`Màu ${c}`}
              />
            ))}
          </div>
        </div>

        <Field label="Tên nhân viên" required>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="VD: Tuấn Anh"
            autoFocus
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Số điện thoại">
            <Input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="09xx xxx xxx"
              inputMode="tel"
            />
          </Field>
          <Field label="Tỷ lệ ăn chia (%)" hint="Phần thợ được nhận">
            <Input
              type="number"
              min={0}
              max={100}
              value={form.commission_rate}
              onChange={(e) => setForm((f) => ({ ...f, commission_rate: Number(e.target.value) }))}
            />
          </Field>
        </div>

        {!isEdit && (
          <div className="rounded-xl border border-line bg-paper-2/40 px-4 py-3">
            <Switch
              checked={form.withAccount}
              onChange={(withAccount) => setForm((f) => ({ ...f, withAccount }))}
              label="Cấp tài khoản đăng nhập"
              description="Nhân viên đăng nhập để xem doanh thu cá nhân & tự tính tiền"
            />
            {form.withAccount && (
              <div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
                <Field label="Email đăng nhập" required>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="nhanvien@tiem.com"
                  />
                </Field>
                <Field label="Mật khẩu tạm" required hint="NV sẽ đổi khi đăng nhập">
                  <Input
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Tối thiểu 6 ký tự"
                  />
                </Field>
              </div>
            )}
          </div>
        )}

        {(isEdit ? !staff.user_id : !form.withAccount) && (
          <div className="rounded-xl border border-line bg-paper-2/40 px-4 py-3">
            <Switch
              checked={form.active}
              onChange={(active) => setForm((f) => ({ ...f, active }))}
              label="Đang làm việc"
              description="Tắt để ẩn khỏi danh sách chọn thợ"
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
