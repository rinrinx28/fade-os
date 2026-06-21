"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { Segmented } from "@/components/ui/segmented";
import { useAddCashMovement } from "@/hooks/use-shift";

interface CashMovementFormProps {
  open: boolean;
  onClose: () => void;
  shiftId: string;
}

export function CashMovementForm({ open, onClose, shiftId }: CashMovementFormProps) {
  const add = useAddCashMovement();
  const [direction, setDirection] = useState<"in" | "out">("out");
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");

  async function handleSubmit() {
    if (amount <= 0) {
      toast.error("Nhập số tiền lớn hơn 0.");
      return;
    }
    try {
      await add.mutateAsync({ shiftId, direction, amount, reason: reason.trim() || undefined });
      toast.success(direction === "in" ? "Đã ghi nhận thu vào quỹ." : "Đã ghi nhận chi từ quỹ.");
      setAmount(0);
      setReason("");
      onClose();
    } catch {
      toast.error("Không thể ghi nhận.");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Thu / Chi quỹ"
      description="Ghi nhận tiền ra vào két ngoài bán hàng (mua đồ, ứng lương…)."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={handleSubmit} loading={add.isPending}>
            Ghi nhận
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Segmented
          value={direction}
          onChange={setDirection}
          options={[
            { value: "out", label: "Chi ra", icon: <ArrowUpRight className="size-4" /> },
            { value: "in", label: "Thu vào", icon: <ArrowDownLeft className="size-4" /> },
          ]}
        />
        <Field label="Số tiền" required>
          <MoneyInput value={amount} onChange={setAmount} autoFocus />
        </Field>
        <Field label="Lý do">
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={direction === "in" ? "VD: Khách trả nợ" : "VD: Mua nước, gel…"}
          />
        </Field>
      </div>
    </Modal>
  );
}
