"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { startOfDay, subDays, isSameDay, parseISO } from "date-fns";
import {
  ScissorsLineDashed,
  Sunrise,
  Wallet,
  Users,
  CreditCard,
  Receipt,
  ArrowRight,
  Trophy,
  Banknote,
} from "lucide-react";
import { useCurrentShift, useShiftLedger } from "@/hooks/use-shift";
import { useTransactions } from "@/hooks/use-transactions";
import { useStaff } from "@/hooks/use-staff";
import { computeReconciliation } from "@/lib/shift";
import { summarize, groupByDay, staffRanking } from "@/lib/report";
import { shopRevenue, totalStaffShare, buildRateMap } from "@/lib/commission";
import { Reveal } from "@/components/shared/reveal";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { BarChart } from "@/components/charts/bar-chart";
import { RankList } from "@/components/charts/rank-list";
import { formatCurrency, formatCompactVnd, formatTime, formatSmartDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { data: shift } = useCurrentShift();
  const { data: ledger } = useShiftLedger(shift?.id ?? null);
  const { data: staff } = useStaff();

  const from7 = useMemo(() => startOfDay(subDays(new Date(), 6)), []);
  const { data: txns } = useTransactions({ from: from7.toISOString(), limit: 1000 });

  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const todayTxns = useMemo(
    () => (txns ?? []).filter((t) => isSameDay(parseISO(t.created_at), new Date())),
    [txns],
  );
  const today = useMemo(() => summarize(todayTxns), [todayTxns]);
  const daily = useMemo(() => groupByDay(txns ?? [], from7, new Date()), [txns, from7]);
  const topStaff = useMemo(() => staffRanking(todayTxns, staff ?? []).slice(0, 4), [todayTxns, staff]);

  const rateMap = useMemo(() => buildRateMap(staff ?? []), [staff]);
  const shopToday = useMemo(() => shopRevenue(todayTxns, rateMap), [todayTxns, rateMap]);
  const staffShareToday = useMemo(() => totalStaffShare(todayTxns, rateMap), [todayTxns, rateMap]);

  const expectedCash =
    shift && ledger
      ? computeReconciliation(shift.opening_fund, ledger.transactions, ledger.movements).expectedCash
      : null;

  const greeting = !now
    ? "Xin chào"
    : now.getHours() < 11
      ? "Chào buổi sáng"
      : now.getHours() < 14
        ? "Chào buổi trưa"
        : now.getHours() < 18
          ? "Chào buổi chiều"
          : "Chào buổi tối";

  const recent = (txns ?? []).slice(0, 6);

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-line bg-linear-to-br from-copper-tint via-paper to-paper p-6 shadow-(--shadow-sm) sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-copper/10 blur-2xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-copper-deep">{greeting} 👋</p>
            <h2 className="mt-1 font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
              Doanh thu hôm nay
            </h2>
            <p className="mt-2 font-display text-[2.75rem] font-medium leading-none tracking-tight text-ink sm:text-[3.5rem]">
              <AnimatedNumber value={today.revenue} format={formatCurrency} />
            </p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span className="text-ink-soft">
                Doanh thu tiệm <b className="text-ink tnum">{formatCurrency(shopToday)}</b>
              </span>
              <span className="text-ink-soft">
                Tiền chia thợ <b className="text-ink tnum">{formatCurrency(staffShareToday)}</b>
              </span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {shift ? (
                <Badge tone="success" dot>
                  Đang mở ca · {formatTime(shift.opened_at)}
                </Badge>
              ) : (
                <Badge tone="warning">Chưa mở ca</Badge>
              )}
              <Badge tone="neutral">{today.count} hoá đơn</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            {!shift && (
              <Link href="/shifts">
                <Button variant="secondary">
                  <Sunrise className="size-4" /> Mở ca
                </Button>
              </Link>
            )}
            <Link href="/pos">
              <Button>
                <ScissorsLineDashed className="size-4" /> Tính tiền
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <Reveal className="grid grid-cols-2 gap-3 lg:grid-cols-4" stagger={0.05}>
        <StatCard
          label="Tiền mặt trong két"
          value={expectedCash != null ? formatCompactVnd(expectedCash) : "—"}
          suffix={expectedCash != null ? "₫" : undefined}
          icon={Wallet}
          accent="copper"
          hint={shift ? "Quỹ dự kiến" : "Chưa mở ca"}
        />
        <StatCard label="Tiền mặt hôm nay" value={formatCompactVnd(today.cash)} suffix="₫" icon={Banknote} accent="success" />
        <StatCard label="Chuyển khoản" value={formatCompactVnd(today.transfer)} suffix="₫" icon={CreditCard} accent="info" />
        <StatCard label="Lượt khách" value={String(today.count)} icon={Users} accent="neutral" />
      </Reveal>

      {/* Chart + side */}
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-line bg-paper p-5 shadow-(--shadow-sm) sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-medium text-ink">Doanh thu 7 ngày</h3>
              <Link href="/reports" className="inline-flex items-center gap-1 text-sm font-medium text-copper-deep hover:underline">
                Báo cáo <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <BarChart data={daily.map((d) => ({ label: d.label, value: d.total }))} height={180} />
          </div>

          <div className="rounded-2xl border border-line bg-paper p-5 shadow-(--shadow-sm) sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg font-medium text-ink">Giao dịch gần đây</h3>
              <Link href="/transactions" className="text-sm font-medium text-copper-deep hover:underline">
                Tất cả
              </Link>
            </div>
            {recent.length > 0 ? (
              <ul className="divide-y divide-line">
                {recent.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 py-2.5">
                    <span
                      className={cn(
                        "flex size-8 items-center justify-center rounded-lg",
                        t.payment_method === "cash" ? "bg-copper-soft text-copper-deep" : "bg-info-soft text-info",
                      )}
                    >
                      {t.payment_method === "cash" ? <Banknote className="size-4" /> : <CreditCard className="size-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate text-sm font-medium text-ink", t.status === "void" && "line-through")}>
                        {t.code} {t.customer_name && <span className="text-ink-muted">· {t.customer_name}</span>}
                      </p>
                      <p className="text-xs text-ink-muted">{formatSmartDateTime(t.created_at)}</p>
                    </div>
                    <span className={cn("text-sm font-semibold text-ink tnum", t.status === "void" && "text-ink-faint line-through")}>
                      {formatCurrency(t.total)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-center text-sm text-ink-muted">Chưa có giao dịch hôm nay.</p>
            )}
          </div>
        </div>

        {/* Top thợ hôm nay */}
        <div className="rounded-2xl border border-line bg-paper p-5 shadow-(--shadow-sm) sm:p-6">
          <h3 className="mb-4 inline-flex items-center gap-2 font-display text-lg font-medium text-ink">
            <Trophy className="size-4 text-copper" /> Thợ nổi bật hôm nay
          </h3>
          {topStaff.length > 0 ? (
            <RankList
              items={topStaff.map((s) => ({
                key: s.id,
                label: s.name,
                value: s.total,
                valueLabel: formatCompactVnd(s.total),
                sub: `${s.count} HĐ`,
                color: s.color,
                avatar: true,
              }))}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-ink-muted">
              <Receipt className="size-6 text-ink-faint" />
              <p className="text-sm">Chưa có doanh số hôm nay.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
