import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  suffix?: string;
  delta?: number | null;
  hint?: string;
  accent?: "copper" | "success" | "info" | "neutral";
}

const ACCENTS = {
  copper: "bg-copper-soft text-copper-deep",
  success: "bg-success-soft text-success",
  info: "bg-info-soft text-info",
  neutral: "bg-paper-2 text-ink-soft",
};

export function StatCard({ label, value, icon: Icon, suffix, delta, hint, accent = "copper" }: StatCardProps) {
  const hasDelta = typeof delta === "number" && Number.isFinite(delta);
  const up = (delta ?? 0) >= 0;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-line bg-paper p-5 shadow-(--shadow-sm) transition-shadow duration-(--dur-normal) hover:shadow-(--shadow-md)">
      <div className="flex items-start justify-between">
        <span className="text-[0.82rem] font-medium text-ink-muted">{label}</span>
        <span className={cn("flex size-9 items-center justify-center rounded-xl", ACCENTS[accent])}>
          <Icon className="size-[1.05rem]" />
        </span>
      </div>
      <div className="mt-3 flex items-end gap-1.5">
        <span className="font-display text-[1.9rem] font-medium leading-none tracking-tight text-ink tnum">
          {value}
        </span>
        {suffix && <span className="mb-0.5 text-sm text-ink-muted">{suffix}</span>}
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        {hasDelta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold",
              up ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
            )}
          >
            {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(delta!).toFixed(0)}%
          </span>
        )}
        {hint && <span className="text-xs text-ink-muted">{hint}</span>}
      </div>
    </div>
  );
}
