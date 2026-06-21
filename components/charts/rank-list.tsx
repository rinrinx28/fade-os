"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Avatar } from "@/components/ui/avatar";

export interface RankItem {
  key: string;
  label: string;
  sub?: string;
  value: number;
  valueLabel: string;
  color?: string | null;
  avatar?: boolean;
}

export function RankList({ items }: { items: RankItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const max = Math.max(1, ...items.map((i) => i.value));

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".rank-fill",
        { scaleX: 0 },
        { scaleX: 1, transformOrigin: "left", duration: 0.8, ease: "power3.out", stagger: 0.06 },
      );
    }, ref);
    return () => ctx.revert();
  }, [items]);

  return (
    <div ref={ref} className="space-y-3.5">
      {items.map((it, idx) => (
        <div key={it.key} className="flex items-center gap-3">
          {it.avatar ? (
            <Avatar name={it.label} color={it.color} size="sm" />
          ) : (
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-paper-2 text-xs font-semibold text-ink-soft">
              {idx + 1}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium text-ink">{it.label}</span>
              <span className="shrink-0 text-sm font-semibold text-ink tnum">{it.valueLabel}</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-2">
                <div
                  className="rank-fill h-full rounded-full"
                  style={{
                    width: `${(it.value / max) * 100}%`,
                    background: it.color ?? "var(--copper)",
                  }}
                />
              </div>
              {it.sub && <span className="shrink-0 text-xs text-ink-muted">{it.sub}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
