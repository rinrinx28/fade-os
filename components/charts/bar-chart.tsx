"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { formatCompactVnd, formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface BarDatum {
  label: string;
  weekday?: string;
  value: number;
}

export function BarChart({ data, height = 180 }: { data: BarDatum[]; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const labelEvery = data.length <= 14 ? 1 : Math.ceil(data.length / 8);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".bar-fill",
        { scaleY: 0 },
        { scaleY: 1, transformOrigin: "bottom", duration: 0.7, ease: "power3.out", stagger: 0.03 },
      );
    }, ref);
    return () => ctx.revert();
  }, [data]);

  return (
    <div ref={ref}>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          return (
            <div key={i} className="group relative flex h-full flex-1 flex-col justify-end">
              <span className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1 whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-[0.7rem] font-medium text-cream opacity-0 shadow-(--shadow-soft) transition-opacity group-hover:opacity-100">
                {formatCurrency(d.value)}
              </span>
              <div
                className="relative w-full overflow-hidden rounded-t-md bg-paper-2"
                style={{ height: `${Math.max(pct, d.value > 0 ? 3 : 1)}%` }}
              >
                <div className="bar-fill absolute inset-0 rounded-t-md bg-linear-to-t from-copper to-copper-bright transition-[filter] group-hover:brightness-110" />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5">
        {data.map((d, i) => (
          <span
            key={i}
            className={cn(
              "flex-1 text-center text-[0.62rem] leading-tight text-ink-muted",
              i % labelEvery === 0 || i === data.length - 1 ? "opacity-100" : "opacity-0",
            )}
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-4">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
          <span className="size-2.5 rounded-full" style={{ background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

export { formatCompactVnd };
