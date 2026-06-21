"use client";

import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  description?: string;
}

export function Switch({ checked, onChange, label, description }: SwitchProps) {
  const toggle = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-(--dur-fast)",
        checked ? "bg-copper" : "bg-line-strong",
      )}
    >
      <span
        className={cn(
          "inline-block size-5 rounded-full bg-white shadow-(--shadow-sm) transition-transform duration-(--dur-fast) ease-(--ease-out-back)",
          checked ? "translate-x-[1.375rem]" : "translate-x-0.5",
        )}
      />
    </button>
  );

  if (!label) return toggle;

  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span className="flex flex-col">
        <span className="text-sm font-medium text-ink">{label}</span>
        {description && <span className="text-xs text-ink-muted">{description}</span>}
      </span>
      {toggle}
    </label>
  );
}
