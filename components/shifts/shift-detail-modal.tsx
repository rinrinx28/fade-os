"use client";

import { useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/states";
import { ReconciliationRows, DifferenceBadge } from "./reconciliation";
import { Badge } from "@/components/ui/badge";
import { useShiftLedger } from "@/hooks/use-shift";
import { computeReconciliation } from "@/lib/shift";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Shift } from "@/lib/types/db";

export function ShiftDetailModal({ shift, onClose }: { shift: Shift | null; onClose: () => void }) {
  const { data, isLoading } = useShiftLedger(shift?.id ?? null);

  const rec = useMemo(() => {
    if (!shift || !data) return null;
    return computeReconciliation(shift.opening_fund, data.transactions, data.movements);
  }, [shift, data]);

  const difference =
    shift?.closing_counted != null && rec ? shift.closing_counted - rec.expectedCash : null;

  return (
    <Modal
      open={!!shift}
      onClose={onClose}
      title={`Chi tiết ca · ${shift ? formatDateTime(shift.opened_at) : ""}`}
      size="lg"
    >
      {isLoading || !rec ? (
        <div className="flex justify-center py-10">
          <Spinner className="size-6" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={shift!.status === "open" ? "success" : "neutral"} dot={shift!.status === "open"}>
              {shift!.status === "open" ? "Đang mở" : "Đã đóng"}
            </Badge>
            <Badge tone="copper">{rec.txnCount} hoá đơn</Badge>
            <span className="text-sm text-ink-muted">
              Doanh thu {formatCurrency(rec.totalSales)}
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-paper-2/40 p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-muted">Đối soát quỹ</p>
              <ReconciliationRows rec={rec} />
            </div>
            <div className="space-y-3">
              <Stat label="Bán chuyển khoản" value={formatCurrency(rec.transferSales)} />
              {shift!.closing_counted != null && (
                <>
                  <Stat label="Tiền mặt đếm thực tế" value={formatCurrency(shift!.closing_counted)} />
                  {difference != null && (
                    <div className="flex items-center justify-between rounded-xl border border-line bg-paper px-4 py-3">
                      <span className="text-sm text-ink-soft">Chênh lệch</span>
                      <DifferenceBadge difference={difference} />
                    </div>
                  )}
                </>
              )}
              {shift!.opened_by && <Stat label="Mở ca" value={shift!.opened_by} />}
              {shift!.closed_by && <Stat label="Đóng ca" value={shift!.closed_by} />}
              {shift!.note && <Stat label="Ghi chú" value={shift!.note} />}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line/60 pb-2 last:border-0">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="text-sm font-medium text-ink">{value}</span>
    </div>
  );
}
