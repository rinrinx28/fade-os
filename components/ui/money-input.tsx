"use client";

import { forwardRef } from "react";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MoneyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  id?: string;
}

/** Ô nhập tiền VND — hiển thị có dấu chấm phân cách, lưu giá trị số. */
export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  { value, onChange, placeholder = "0", className, autoFocus, id },
  ref,
) {
  return (
    <div className="relative">
      <input
        ref={ref}
        id={id}
        inputMode="numeric"
        autoFocus={autoFocus}
        value={value ? formatNumber(value) : ""}
        placeholder={placeholder}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          onChange(digits ? Number.parseInt(digits, 10) : 0);
        }}
        className={cn(
          "h-11 w-full rounded-xl border border-line bg-paper pl-3.5 pr-9 text-right text-[0.95rem] font-medium tabular-nums text-ink",
          "placeholder:font-normal placeholder:text-ink-faint",
          "transition-colors focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/15",
          className,
        )}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-muted">
        ₫
      </span>
    </div>
  );
});
