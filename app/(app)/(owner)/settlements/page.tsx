"use client";

import { useMemo, useState } from "react";
import { endOfDay, format as fmtDate } from "date-fns";
import { toast } from "sonner";
import { HandCoins, Users, Receipt, Wallet, CheckCircle2 } from "lucide-react";
import { useStaff } from "@/hooks/use-staff";
import { useMembers } from "@/hooks/use-members";
import { useUnsettledTxns, useSettlements, useCreateSettlement } from "@/hooks/use-settlements";
import { useSession } from "@/components/providers/session";
import { employeeShare, weekPeriod } from "@/lib/commission";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Field, Input } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState } from "@/components/ui/states";
import { formatCurrency, formatPercent, formatDate, formatSmartDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type PeriodKind = "this" | "last" | "custom";

export default function SettlementsPage() {
  const session = useSession();
  const { data: staff } = useStaff();
  const { data: members } = useMembers();
  const { data: history } = useSettlements();
  const create = useCreateSettlement();

  const ownerUserIds = useMemo(
    () => new Set((members ?? []).filter((m) => m.role === "owner").map((m) => m.user_id)),
    [members],
  );
  const employees = useMemo(
    () => (staff ?? []).filter((s) => !(s.user_id && ownerUserIds.has(s.user_id))),
    [staff, ownerUserIds],
  );
  const staffMap = useMemo(() => new Map((staff ?? []).map((s) => [s.id, s])), [staff]);

  const now = useMemo(() => new Date(), []);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodKind>("this");
  const [customStart, setCustomStart] = useState(fmtDate(weekPeriod("this", now).start, "yyyy-MM-dd"));
  const [customEnd, setCustomEnd] = useState(fmtDate(now, "yyyy-MM-dd"));

  const { start, end } = useMemo(
    () =>
      period === "custom"
        ? { start: new Date(`${customStart}T00:00:00`), end: endOfDay(new Date(`${customEnd}T00:00:00`)) }
        : weekPeriod(period, now),
    [period, customStart, customEnd, now],
  );
  const fromISO = useMemo(() => start.toISOString(), [start]);
  const toISO = useMemo(() => end.toISOString(), [end]);

  const { data: unsettled } = useUnsettledTxns(staffId, fromISO, toISO);
  const selected = employees.find((e) => e.id === staffId);
  const rate = selected?.commission_rate ?? 0;
  const gross = (unsettled ?? []).reduce((s, t) => s + Number(t.total), 0);
  const share = employeeShare(gross, rate);
  const count = unsettled?.length ?? 0;

  async function handleSettle() {
    if (!staffId || count === 0) {
      toast.error("Không có doanh thu chưa kết toán trong kỳ.");
      return;
    }
    try {
      await create.mutateAsync({
        staffId,
        periodStart: fromISO,
        periodEnd: toISO,
        rate,
        gross,
        txnIds: (unsettled ?? []).map((t) => t.id),
        settledBy: session.staffName ?? session.email,
      });
      toast.success(`Đã kết toán ${formatCurrency(share)} cho ${selected?.name}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể kết toán.");
    }
  }

  return (
    <div>
      <PageHeader title="Kết toán" description="Tính và trả công ăn chia cho nhân viên." />

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        {/* Tạo phiếu */}
        <div className="space-y-4 rounded-2xl border border-line bg-paper p-5 shadow-(--shadow-sm) sm:p-6">
          <div>
            <p className="mb-2 text-sm font-medium text-ink-soft">1. Chọn nhân viên</p>
            {employees.length === 0 ? (
              <p className="text-sm text-ink-muted">Chưa có nhân viên để kết toán.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {employees.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => setStaffId(e.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3 py-1.5 transition-colors",
                      staffId === e.id ? "border-copper bg-copper-soft" : "border-line bg-paper hover:border-line-strong",
                    )}
                  >
                    <Avatar name={e.name} color={e.color} size="sm" />
                    <span className={cn("text-sm font-medium", staffId === e.id ? "text-copper-deep" : "text-ink-soft")}>
                      {e.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-ink-soft">2. Chọn kỳ</p>
            <Segmented
              value={period}
              onChange={setPeriod}
              options={[
                { value: "this", label: "Tuần này" },
                { value: "last", label: "Tuần trước" },
                { value: "custom", label: "Tùy chọn" },
              ]}
            />
            {period === "custom" ? (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Field label="Từ ngày">
                  <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
                </Field>
                <Field label="Đến ngày">
                  <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                </Field>
              </div>
            ) : (
              <p className="mt-2 text-xs text-ink-muted">
                {formatDate(start)} – {formatDate(end)}
              </p>
            )}
          </div>

          {/* Preview */}
          <div className="rounded-2xl border border-line bg-paper-2/40 p-4">
            {!staffId ? (
              <p className="py-4 text-center text-sm text-ink-muted">Chọn nhân viên để xem số liệu.</p>
            ) : (
              <div className="space-y-2.5">
                <Row icon={<Receipt className="size-4" />} label="Hoá đơn chưa kết toán" value={String(count)} />
                <Row icon={<Wallet className="size-4" />} label="Doanh thu" value={formatCurrency(gross)} />
                <Row icon={<Users className="size-4" />} label={`Tỷ lệ ăn chia`} value={formatPercent(rate)} />
                <div className="flex items-center justify-between border-t border-line pt-2.5">
                  <span className="text-sm font-medium text-ink-soft">Thực trả nhân viên</span>
                  <span className="font-display text-xl font-medium text-copper-deep tnum">{formatCurrency(share)}</span>
                </div>
              </div>
            )}
          </div>

          <Button onClick={handleSettle} disabled={!staffId || count === 0} loading={create.isPending} size="lg" className="w-full">
            <CheckCircle2 className="size-4" /> Kết toán & đánh dấu đã trả
          </Button>
        </div>

        {/* Lịch sử */}
        <div className="rounded-2xl border border-line bg-paper p-5 shadow-(--shadow-sm) sm:p-6">
          <h3 className="mb-3 font-display text-lg font-medium text-ink">Lịch sử kết toán</h3>
          {(history?.length ?? 0) === 0 ? (
            <EmptyState icon={<HandCoins className="size-6" />} title="Chưa có phiếu kết toán" className="py-10" />
          ) : (
            <ul className="divide-y divide-line">
              {history!.map((s) => {
                const st = s.staff_id ? staffMap.get(s.staff_id) : undefined;
                return (
                  <li key={s.id} className="flex items-center gap-3 py-3">
                    <Avatar name={st?.name ?? "?"} color={st?.color} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{st?.name ?? "Nhân viên"}</p>
                      <p className="text-xs text-ink-muted">
                        {formatDate(s.period_start)} – {formatDate(s.period_end)} · {s.txn_count} HĐ
                        {s.paid_at && ` · ${formatSmartDateTime(s.paid_at)}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-base font-medium text-copper-deep tnum">
                        {formatCurrency(s.employee_amount)}
                      </p>
                      <Badge tone="success">Đã trả</Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="inline-flex items-center gap-2 text-sm text-ink-soft">
        <span className="text-ink-muted">{icon}</span>
        {label}
      </span>
      <span className="text-sm font-medium text-ink tnum">{value}</span>
    </div>
  );
}
