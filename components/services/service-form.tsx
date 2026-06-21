"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { Switch } from "@/components/ui/switch";
import { SERVICE_CATEGORIES } from "@/lib/constants";
import { useSaveService } from "@/hooks/use-services";
import type { Service } from "@/lib/types/db";

interface ServiceFormProps {
  open: boolean;
  onClose: () => void;
  service: Service | null;
}

const empty = {
  name: "",
  category: SERVICE_CATEGORIES[0] as string,
  price: 0,
  duration_min: 30,
  active: true,
  sort: 0,
};

export function ServiceForm({ open, onClose, service }: ServiceFormProps) {
  const save = useSaveService();
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (!open) return;
    setForm(
      service
        ? {
            name: service.name,
            category: service.category,
            price: service.price,
            duration_min: service.duration_min,
            active: service.active,
            sort: service.sort,
          }
        : empty,
    );
  }, [open, service]);

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên dịch vụ.");
      return;
    }
    try {
      await save.mutateAsync({ id: service?.id, ...form });
      toast.success(service ? "Đã cập nhật dịch vụ." : "Đã thêm dịch vụ mới.");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể lưu dịch vụ.");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={service ? "Sửa dịch vụ" : "Thêm dịch vụ"}
      description="Dịch vụ sẽ xuất hiện ở màn hình tính tiền."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={handleSubmit} loading={save.isPending}>
            {service ? "Lưu thay đổi" : "Thêm dịch vụ"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Tên dịch vụ" required>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="VD: Cắt nam cơ bản"
            autoFocus
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nhóm">
            <Select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              {SERVICE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Thời lượng (phút)">
            <Input
              type="number"
              min={5}
              step={5}
              value={form.duration_min}
              onChange={(e) => setForm((f) => ({ ...f, duration_min: Number(e.target.value) }))}
            />
          </Field>
        </div>
        <Field label="Giá" required>
          <MoneyInput value={form.price} onChange={(price) => setForm((f) => ({ ...f, price }))} />
        </Field>
        <div className="rounded-xl border border-line bg-paper-2/40 px-4 py-3">
          <Switch
            checked={form.active}
            onChange={(active) => setForm((f) => ({ ...f, active }))}
            label="Đang kinh doanh"
            description="Tắt để ẩn khỏi màn hình tính tiền"
          />
        </div>
      </div>
    </Modal>
  );
}
