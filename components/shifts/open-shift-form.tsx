"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sunrise } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { useOpenShift } from "@/hooks/use-shift";

interface OpenShiftFormProps {
  open: boolean;
  onClose: () => void;
}

export function OpenShiftForm({ open, onClose }: OpenShiftFormProps) {
  const openShift = useOpenShift();
  const [openingFund, setOpeningFund] = useState(0);
  const [openedBy, setOpenedBy] = useState("");
  const [note, setNote] = useState("");

  async function handleSubmit() {
    try {
      await openShift.mutateAsync({
        openingFund,
        openedBy: openedBy.trim() || null,
        note: note.trim() || null,
      });
      toast.success("Đã mở ca. Chúc một ngày bán đắt khách!");
      setOpeningFund(0);
      setOpenedBy("");
      setNote("");
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      toast.error(msg.includes("single_open") ? "Đã có một ca đang mở." : msg || "Không thể mở ca.");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Mở ca đầu ngày"
      description="Nhập số tiền mặt có sẵn trong két để bắt đầu ca."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={handleSubmit} loading={openShift.isPending}>
            <Sunrise className="size-4" /> Mở ca
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Quỹ đầu ngày (tiền mặt trong két)" required>
          <MoneyInput value={openingFund} onChange={setOpeningFund} autoFocus />
        </Field>
        <Field label="Người mở ca" hint="Tuỳ chọn — tên thu ngân trực ca">
          <Input value={openedBy} onChange={(e) => setOpenedBy(e.target.value)} placeholder="VD: Hương" />
        </Field>
        <Field label="Ghi chú">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú đầu ca (nếu có)" />
        </Field>
      </div>
    </Modal>
  );
}
