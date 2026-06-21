"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sunset } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { ReconciliationRows, DifferenceBadge } from "./reconciliation";
import { useCloseShift } from "@/hooks/use-shift";
import type { ShiftReconciliation } from "@/lib/shift";
import type { Shift } from "@/lib/types/db";

interface CloseShiftDialogProps {
  open: boolean;
  onClose: () => void;
  shift: Shift;
  rec: ShiftReconciliation;
}

export function CloseShiftDialog({ open, onClose, shift, rec }: CloseShiftDialogProps) {
  const close = useCloseShift();
  const [counted, setCounted] = useState(0);
  const [closedBy, setClosedBy] = useState("");

  useEffect(() => {
    if (open) {
      setCounted(rec.expectedCash);
      setClosedBy(shift.opened_by ?? "");
    }
  }, [open, rec.expectedCash, shift.opened_by]);

  const difference = counted - rec.expectedCash;

  async function handleSubmit() {
    try {
      await close.mutateAsync({
        shiftId: shift.id,
        closingCounted: counted,
        closedBy: closedBy.trim() || null,
      });
      toast.success("Đã đóng ca. Tổng kết đã được lưu.");
      onClose();
    } catch {
      toast.error("Không thể đóng ca.");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Đóng ca cuối ngày"
      description="Đếm tiền mặt thực tế trong két và đối soát với hệ thống."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={handleSubmit} loading={close.isPending}>
            <Sunset className="size-4" /> Đóng ca
          </Button>
        </>
      }
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-paper-2/40 p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-muted">Hệ thống ghi nhận</p>
          <ReconciliationRows rec={rec} />
        </div>

        <div className="flex flex-col gap-4">
          <Field label="Tiền mặt đếm thực tế" required>
            <MoneyInput value={counted} onChange={setCounted} autoFocus />
          </Field>

          <div className="flex items-center justify-between rounded-xl border border-line bg-paper px-4 py-3">
            <span className="text-sm text-ink-soft">Chênh lệch</span>
            <DifferenceBadge difference={difference} />
          </div>

          <Field label="Người đóng ca">
            <Input value={closedBy} onChange={(e) => setClosedBy(e.target.value)} placeholder="Tên thu ngân" />
          </Field>

          <p className="text-xs leading-relaxed text-ink-muted">
            Doanh thu chuyển khoản{" "}
            <b className="text-ink-soft">{rec.transferSales.toLocaleString("vi-VN")} ₫</b> không nằm trong
            két tiền mặt nên không tính vào đối soát này.
          </p>
        </div>
      </div>
    </Modal>
  );
}
