"use client";

import { useMemo, useState } from "react";
import { startOfDay, subDays } from "date-fns";
import { Receipt, Banknote, CreditCard, ChevronRight } from "lucide-react";
import { useTransactions } from "@/hooks/use-transactions";
import { summarize } from "@/lib/report";
import { PageHeader } from "@/components/shared/page-header";
import { Reveal } from "@/components/shared/reveal";
import { Segmented } from "@/components/ui/segmented";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { TransactionDetail } from "@/components/transactions/transaction-detail";
import { formatCurrency, formatSmartDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TransactionWithItems } from "@/lib/types/db";

type Range = "today" | "7d" | "30d";

const RANGE_FROM: Record<Range, () => string> = {
  today: () => startOfDay(new Date()).toISOString(),
  "7d": () => startOfDay(subDays(new Date(), 6)).toISOString(),
  "30d": () => startOfDay(subDays(new Date(), 29)).toISOString(),
};

export default function TransactionsPage() {
  const [range, setRange] = useState<Range>("today");
  const from = useMemo(() => RANGE_FROM[range](), [range]);
  const { data: txns, isLoading } = useTransactions({ from, limit: 300 });
  const [selected, setSelected] = useState<TransactionWithItems | null>(null);

  const stats = useMemo(() => summarize(txns ?? []), [txns]);

  return (
    <div>
      <PageHeader
        title="Giao dịch"
        description="Lịch sử hoá đơn và trạng thái thanh toán."
        action={
          <Segmented
            value={range}
            onChange={setRange}
            options={[
              { value: "today", label: "Hôm nay" },
              { value: "7d", label: "7 ngày" },
              { value: "30d", label: "30 ngày" },
            ]}
          />
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <SummaryTile label="Doanh thu" value={formatCurrency(stats.revenue)} accent />
        <SummaryTile label="Số hoá đơn" value={String(stats.count)} />
        <SummaryTile label="Trung bình/HĐ" value={formatCurrency(stats.avg)} />
      </div>

      {isLoading ? (
        <LoadingState />
      ) : (txns?.length ?? 0) === 0 ? (
        <EmptyState
          icon={<Receipt className="size-6" />}
          title="Chưa có giao dịch"
          description="Các hoá đơn từ màn hình Tính tiền sẽ hiển thị ở đây."
        />
      ) : (
        <Reveal className="overflow-hidden rounded-2xl border border-line bg-paper shadow-(--shadow-sm)" stagger={0.02}>
          {txns!.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelected(t)}
              className="flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition-colors last:border-0 hover:bg-paper-2/50 sm:px-5"
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl",
                  t.payment_method === "cash" ? "bg-copper-soft text-copper-deep" : "bg-info-soft text-info",
                )}
              >
                {t.payment_method === "cash" ? <Banknote className="size-4" /> : <CreditCard className="size-4" />}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm font-medium text-ink", t.status === "void" && "text-ink-faint line-through")}>
                    {t.code}
                  </span>
                  {t.status === "void" && <Badge tone="danger">Huỷ</Badge>}
                  {t.payment_method === "transfer" && !t.transfer_verified && t.status === "paid" && (
                    <Badge tone="warning">Chờ xác nhận</Badge>
                  )}
                </div>
                <p className="truncate text-xs text-ink-muted">
                  {formatSmartDateTime(t.created_at)}
                  {t.customer_name && ` · ${t.customer_name}`}
                  {` · ${t.items?.length ?? 0} dịch vụ`}
                </p>
              </div>

              {t.staff && <Avatar name={t.staff.name} color={t.staff.color} size="sm" />}

              <span
                className={cn(
                  "shrink-0 font-display text-base font-medium tnum",
                  t.status === "void" ? "text-ink-faint line-through" : "text-ink",
                )}
              >
                {formatCurrency(t.total)}
              </span>
              <ChevronRight className="size-4 shrink-0 text-ink-faint" />
            </button>
          ))}
        </Reveal>
      )}

      <TransactionDetail txn={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function SummaryTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 shadow-(--shadow-sm)",
        accent ? "border-copper/20 bg-copper-soft" : "border-line bg-paper",
      )}
    >
      <p className="text-xs text-ink-muted">{label}</p>
      <p className={cn("mt-1 font-display text-xl font-medium tnum", accent ? "text-copper-deep" : "text-ink")}>
        {value}
      </p>
    </div>
  );
}
