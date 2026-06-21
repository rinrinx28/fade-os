"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

interface SetPasswordModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: (password: string) => void | Promise<void>;
}

/** Modal nhập mật khẩu tạm — dùng cho "Đặt lại mật khẩu" và "Mời lại". */
export function SetPasswordModal({
  open,
  onClose,
  title,
  description,
  confirmLabel = "Xác nhận",
  busy,
  onConfirm,
}: SetPasswordModalProps) {
  const [pw, setPw] = useState("");

  useEffect(() => {
    if (open) setPw("");
  }, [open]);

  async function submit() {
    if (pw.length < 6) {
      toast.error("Mật khẩu tạm tối thiểu 6 ký tự.");
      return;
    }
    await onConfirm(pw);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={submit} loading={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <Field label="Mật khẩu tạm" required hint="Nhân viên sẽ buộc đổi khi đăng nhập">
        <Input value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Tối thiểu 6 ký tự" autoFocus />
      </Field>
    </Modal>
  );
}
