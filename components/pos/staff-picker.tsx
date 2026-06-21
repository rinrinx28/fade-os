"use client";

import { Check } from "lucide-react";
import { useStaff } from "@/hooks/use-staff";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface StaffPickerProps {
  value: string | null;
  onChange: (id: string | null) => void;
}

/** Chọn thợ phụ trách hoá đơn (cuộn ngang, chip avatar). */
export function StaffPicker({ value, onChange }: StaffPickerProps) {
  const { data: staff } = useStaff(true);
  const barbers = (staff ?? []).filter((s) => s.role !== "cashier");

  if (barbers.length === 0) {
    return <p className="text-xs text-ink-muted">Chưa có thợ. Thêm ở mục Nhân viên.</p>;
  }

  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {barbers.map((s) => {
        const active = value === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onChange(active ? null : s.id)}
            className={cn(
              "relative flex shrink-0 flex-col items-center gap-1.5 rounded-xl border px-3 py-2 transition-colors",
              active ? "border-copper bg-copper-soft" : "border-line bg-paper hover:border-line-strong",
            )}
          >
            <span className="relative">
              <Avatar name={s.name} color={s.color} size="md" />
              {active && (
                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-copper text-white">
                  <Check className="size-2.5" />
                </span>
              )}
            </span>
            <span className={cn("max-w-16 truncate text-xs font-medium", active ? "text-copper-deep" : "text-ink-soft")}>
              {s.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
