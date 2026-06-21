"use client";

import { Banknote, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/format";

export function PaymentSplit({ cash, transfer }: { cash: number; transfer: number }) {
  const total = cash + transfer;
  const cashPct = total > 0 ? (cash / total) * 100 : 0;
  const transferPct = total > 0 ? 100 - cashPct : 0;

  return (
    <div className="space-y-4">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-paper-2">
        <div
          className="h-full bg-copper transition-[width] duration-700 ease-(--ease-out-expo)"
          style={{ width: `${cashPct}%` }}
        />
        <div
          className="h-full bg-info transition-[width] duration-700 ease-(--ease-out-expo)"
          style={{ width: `${transferPct}%` }}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Leg icon={<Banknote className="size-4" />} tone="copper" label="Tiền mặt" value={cash} pct={cashPct} />
        <Leg icon={<CreditCard className="size-4" />} tone="info" label="Chuyển khoản" value={transfer} pct={transferPct} />
      </div>
    </div>
  );
}

function Leg({
  icon,
  tone,
  label,
  value,
  pct,
}: {
  icon: React.ReactNode;
  tone: "copper" | "info";
  label: string;
  value: number;
  pct: number;
}) {
  return (
    <div className="rounded-xl border border-line bg-paper-2/40 p-3">
      <div className="flex items-center gap-1.5">
        <span className={tone === "copper" ? "text-copper-deep" : "text-info"}>{icon}</span>
        <span className="text-xs text-ink-muted">{label}</span>
        <span className="ml-auto text-xs font-semibold text-ink-soft">{pct.toFixed(0)}%</span>
      </div>
      <p className="mt-1.5 font-display text-base font-medium text-ink tnum">{formatCurrency(value)}</p>
    </div>
  );
}
