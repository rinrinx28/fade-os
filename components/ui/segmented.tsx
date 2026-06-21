"use client";

import { cn } from "@/lib/utils";

interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** Công tắc phân đoạn với chỉ báo trượt mượt. */
export function Segmented<T extends string>({ options, value, onChange, className }: SegmentedProps<T>) {
  const index = Math.max(0, options.findIndex((o) => o.value === value));

  return (
    <div
      className={cn(
        "relative grid rounded-xl border border-line bg-paper-2 p-1",
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
    >
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 rounded-lg bg-paper shadow-(--shadow-sm) transition-transform duration-(--dur-normal) ease-(--ease-out-expo)"
        style={{
          width: `calc((100% - 0.5rem) / ${options.length})`,
          transform: `translateX(${index * 100}%)`,
        }}
      />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "relative z-10 flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors duration-(--dur-fast)",
            o.value === value ? "text-copper-deep" : "text-ink-muted hover:text-ink",
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}
