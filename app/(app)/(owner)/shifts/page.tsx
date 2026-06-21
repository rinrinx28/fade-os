"use client";

import { useMemo, useState } from "react";
import {
  Sunrise,
  Sunset,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  Banknote,
  CreditCard,
  CalendarClock,
  ChevronRight,
} from "lucide-react";
import { useCurrentShift, useShiftLedger, useShifts } from "@/hooks/use-shift";
import { computeReconciliation } from "@/lib/shift";
import { PageHeader } from "@/components/shared/page-header";
import { Reveal } from "@/components/shared/reveal";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { OpenShiftForm } from "@/components/shifts/open-shift-form";
import { CashMovementForm } from "@/components/shifts/cash-movement-form";
import { CloseShiftDialog } from "@/components/shifts/close-shift-dialog";
import { ShiftDetailModal } from "@/components/shifts/shift-detail-modal";
import { ReconciliationRows } from "@/components/shifts/reconciliation";
import { formatCurrency, formatTime, formatDate, formatSmartDateTime } from "@/lib/format";
import type { Shift } from "@/lib/types/db";

export default function ShiftsPage() {
  const { data: current, isLoading } = useCurrentShift();
  const { data: ledger } = useShiftLedger(current?.id ?? null);
  const { data: history } = useShifts(40);

  const [openForm, setOpenForm] = useState(false);
  const [moveForm, setMoveForm] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [detail, setDetail] = useState<Shift | null>(null);

  const rec = useMemo(() => {
    if (!current || !ledger) return null;
    return computeReconciliation(current.opening_fund, ledger.transactions, ledger.movements);
  }, [current, ledger]);

  const closedHistory = (history ?? []).filter((s) => s.status === "closed");

  return (
    <div>
      <PageHeader
        title="Ca làm việc & Quỹ"
        description="Mở ca đầu ngày, theo dõi quỹ tiền mặt và đối soát khi đóng ca."
        action={
          current ? (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setMoveForm(true)}>
                <Wallet className="size-4" /> Thu / Chi quỹ
              </Button>
              <Button onClick={() => setCloseOpen(true)}>
                <Sunset className="size-4" /> Đóng ca
              </Button>
            </div>
          ) : (
            <Button onClick={() => setOpenForm(true)}>
              <Sunrise className="size-4" /> Mở ca
            </Button>
          )
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : !current || !rec ? (
        <EmptyState
          icon={<Sunrise className="size-6" />}
          title="Chưa có ca nào đang mở"
          description="Mở ca đầu ngày và nhập quỹ tiền mặt ban đầu để bắt đầu nhận khách."
          action={
            <Button onClick={() => setOpenForm(true)} variant="subtle">
              <Sunrise className="size-4" /> Mở ca ngay
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.1fr_1.4fr]">
          {/* Quỹ tiền mặt dự kiến */}
          <div className="overflow-hidden rounded-3xl border border-line bg-linear-to-br from-copper-tint to-paper p-6 shadow-(--shadow-sm)">
            <div className="flex items-center justify-between">
              <Badge tone="success" dot>
                Đang mở · {formatTime(current.opened_at)}
              </Badge>
              <span className="text-xs text-ink-muted">{formatDate(current.opened_at)}</span>
            </div>
            <p className="mt-6 text-sm text-ink-soft">Tiền mặt dự kiến trong két</p>
            <p className="mt-1 font-display text-[2.6rem] font-medium leading-none tracking-tight text-ink">
              <AnimatedNumber value={rec.expectedCash} format={formatCurrency} />
            </p>
            <div className="mt-6 rounded-2xl border border-line bg-paper/70 p-4">
              <ReconciliationRows rec={rec} />
            </div>
            {current.opened_by && (
              <p className="mt-4 text-xs text-ink-muted">Thu ngân: {current.opened_by}</p>
            )}
          </div>

          {/* Thống kê + biến động quỹ */}
          <div className="space-y-5">
            <Reveal className="grid grid-cols-2 gap-3 sm:grid-cols-4" stagger={0.05}>
              <MiniStat icon={Receipt} label="Hoá đơn" value={String(rec.txnCount)} />
              <MiniStat icon={Banknote} label="Tiền mặt" value={formatCurrency(rec.cashSales)} />
              <MiniStat icon={CreditCard} label="Chuyển khoản" value={formatCurrency(rec.transferSales)} />
              <MiniStat icon={Wallet} label="Tổng doanh thu" value={formatCurrency(rec.totalSales)} accent />
            </Reveal>

            <div className="rounded-2xl border border-line bg-paper p-5 shadow-(--shadow-sm)">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-lg font-medium text-ink">Biến động quỹ</h3>
                <Button variant="ghost" size="sm" onClick={() => setMoveForm(true)}>
                  + Ghi nhận
                </Button>
              </div>
              {ledger && ledger.movements.length > 0 ? (
                <ul className="divide-y divide-line">
                  {ledger.movements.map((m) => (
                    <li key={m.id} className="flex items-center gap-3 py-2.5">
                      <span
                        className={`flex size-8 items-center justify-center rounded-lg ${
                          m.direction === "in" ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
                        }`}
                      >
                        {m.direction === "in" ? (
                          <ArrowDownLeft className="size-4" />
                        ) : (
                          <ArrowUpRight className="size-4" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-ink">{m.reason ?? (m.direction === "in" ? "Thu vào quỹ" : "Chi từ quỹ")}</p>
                        <p className="text-xs text-ink-muted">{formatTime(m.created_at)}</p>
                      </div>
                      <span
                        className={`text-sm font-semibold tabular-nums ${
                          m.direction === "in" ? "text-success" : "text-danger"
                        }`}
                      >
                        {m.direction === "in" ? "+" : "−"}
                        {formatCurrency(m.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-center text-sm text-ink-muted">
                  Chưa có khoản thu/chi quỹ nào trong ca này.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lịch sử ca */}
      {closedHistory.length > 0 && (
        <section className="mt-10">
          <h3 className="mb-3 font-display text-lg font-medium text-ink">Lịch sử ca đã đóng</h3>
          <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-(--shadow-sm)">
            {closedHistory.map((s) => (
              <button
                key={s.id}
                onClick={() => setDetail(s)}
                className="flex w-full items-center gap-4 border-b border-line px-5 py-3.5 text-left transition-colors last:border-0 hover:bg-paper-2/50"
              >
                <span className="flex size-9 items-center justify-center rounded-xl bg-paper-2 text-ink-soft">
                  <CalendarClock className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{formatSmartDateTime(s.opened_at)}</p>
                  <p className="text-xs text-ink-muted">
                    Quỹ đầu {formatCurrency(s.opening_fund)}
                    {s.closing_counted != null && ` · Đếm cuối ${formatCurrency(s.closing_counted)}`}
                  </p>
                </div>
                {s.closed_at && <span className="text-xs text-ink-muted">Đóng {formatTime(s.closed_at)}</span>}
                <ChevronRight className="size-4 text-ink-faint" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Modals */}
      <OpenShiftForm open={openForm} onClose={() => setOpenForm(false)} />
      {current && (
        <>
          <CashMovementForm open={moveForm} onClose={() => setMoveForm(false)} shiftId={current.id} />
          {rec && (
            <CloseShiftDialog
              open={closeOpen}
              onClose={() => setCloseOpen(false)}
              shift={current}
              rec={rec}
            />
          )}
        </>
      )}
      <ShiftDetailModal shift={detail} onClose={() => setDetail(null)} />
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-(--shadow-sm) ${
        accent ? "border-copper/20 bg-copper-soft" : "border-line bg-paper"
      }`}
    >
      <Icon className={`size-4 ${accent ? "text-copper-deep" : "text-ink-muted"}`} />
      <p className="mt-2 text-xs text-ink-muted">{label}</p>
      <p className={`mt-0.5 font-display text-base font-medium tabular-nums ${accent ? "text-copper-deep" : "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}
