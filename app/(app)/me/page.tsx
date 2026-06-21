"use client";

import { useMemo, useState } from "react";
import { startOfDay, startOfWeek, startOfMonth } from "date-fns";
import { Wallet, Receipt, HandCoins, Clock, TrendingUp } from "lucide-react";
import { useMyStaff } from "@/hooks/use-staff";
import { useTransactions } from "@/hooks/use-transactions";
import { useSettlements, useUnsettledTxns } from "@/hooks/use-settlements";
import { employeeShare } from "@/lib/commission";
import { PageHeader } from "@/components/shared/page-header";
import { Reveal } from "@/components/shared/reveal";
import { StatCard } from "@/components/shared/stat-card";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Segmented } from "@/components/ui/segmented";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { formatCurrency, formatCompactVnd, formatPercent, formatDate, formatSmartDateTime } from "@/lib/format";

type Range = "today" | "week" | "month";
const RANGE_FROM: Record<Range, () => Date> = {
  today: () => startOfDay(new Date()),
  week: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  month: () => startOfMonth(new Date()),
};
const EPOCH = new Date(2000, 0, 1).toISOString();

export default function MyRevenuePage() {
  const { data: me, isLoading } = useMyStaff();
  const [range, setRange] = useState<Range>("week");
  const from = useMemo(() => RANGE_FROM[range](), [range]);
  const nowISO = useMemo(() => new Date().toISOString(), []);

  const { data: txns } = useTransactions({ from: from.toISOString(), limit: 500 });
  const { data: unsettled } = useUnsettledTxns(me?.id ?? null, EPOCH, nowISO);
  const { data: settlements } = useSettlements(me?.id);

  const rate = me?.commission_rate ?? 0;

  const mine = useMemo(
    () => (txns ?? []).filter((t) => t.staff_id === me?.id && t.status === "paid"),
    [txns, me?.id],
  );
  const gross = mine.reduce((s, t) => s + Number(t.total), 0);
  const myShare = employeeShare(gross, rate);

  const pendingGross = (unsettled ?? []).reduce((s, t) => s + Number(t.total), 0);
  const pendingShare = employeeShare(pendingGross, rate);
  const totalReceived = (settlements ?? []).reduce((s, x) => s + Number(x.employee_amount), 0);

  if (isLoading) return <LoadingState />;
  if (!me) {
    return (
      <EmptyState
        icon={<Wallet className="size-6" />}
        title="Chưa có hồ sơ thợ"
        description="Tài khoản của bạn chưa được gắn với hồ sơ thợ. Liên hệ chủ tiệm."
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Doanh thu của tôi"
        description="Theo dõi doanh thu, hoa hồng và tiền đã nhận."
        action={
          <Segmented
            value={range}
            onChange={setRange}
            options={[
              { value: "today", label: "Hôm nay" },
              { value: "week", label: "Tuần này" },
              { value: "month", label: "Tháng này" },
            ]}
          />
        }
      />

      {/* Hero: phần được nhận trong kỳ */}
      <div className="mb-5 overflow-hidden rounded-3xl border border-line bg-linear-to-br from-copper-tint via-paper to-paper p-6 shadow-(--shadow-sm) sm:p-7">
        <div className="flex items-center gap-3">
          <Avatar name={me.name} color={me.color} size="lg" />
          <div>
            <p className="font-medium text-ink">{me.name}</p>
            <Badge tone="copper">Ăn chia {formatPercent(rate)}</Badge>
          </div>
        </div>
        <p className="mt-5 text-sm text-ink-soft">Phần bạn được nhận ({range === "today" ? "hôm nay" : range === "week" ? "tuần này" : "tháng này"})</p>
        <p className="mt-1 font-display text-[2.6rem] font-medium leading-none tracking-tight text-ink">
          <AnimatedNumber value={myShare} format={formatCurrency} />
        </p>
        <p className="mt-2 text-xs text-ink-muted">
          Trên doanh thu {formatCurrency(gross)} · {mine.length} hoá đơn
        </p>
      </div>

      <Reveal className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4" stagger={0.05}>
        <StatCard label="Doanh thu" value={formatCompactVnd(gross)} suffix="₫" icon={TrendingUp} accent="info" />
        <StatCard label="Hoá đơn" value={String(mine.length)} icon={Receipt} accent="neutral" />
        <StatCard label="Chờ kết toán" value={formatCompactVnd(pendingShare)} suffix="₫" icon={Clock} accent="copper" hint="Chủ sẽ trả" />
        <StatCard label="Đã nhận (tổng)" value={formatCompactVnd(totalReceived)} suffix="₫" icon={HandCoins} accent="success" />
      </Reveal>

      {/* Lịch sử kết toán */}
      <section className="rounded-2xl border border-line bg-paper p-5 shadow-(--shadow-sm) sm:p-6">
        <h3 className="mb-3 font-display text-lg font-medium text-ink">Lịch sử nhận tiền</h3>
        {(settlements?.length ?? 0) === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">Chưa có đợt kết toán nào.</p>
        ) : (
          <ul className="divide-y divide-line">
            {settlements!.map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-success-soft text-success">
                  <HandCoins className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">
                    {formatDate(s.period_start)} – {formatDate(s.period_end)}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {s.txn_count} hoá đơn · DT {formatCurrency(s.gross_revenue)} · {formatPercent(s.rate)}
                    {s.paid_at && ` · trả ${formatSmartDateTime(s.paid_at)}`}
                  </p>
                </div>
                <span className="font-display text-base font-medium text-success tnum">
                  {formatCurrency(s.employee_amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
