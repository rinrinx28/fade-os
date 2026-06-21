"use client";

import { useMemo, useState } from "react";
import { startOfDay, subDays } from "date-fns";
import { Wallet, Receipt, Store, HandCoins, Trophy, Sparkles } from "lucide-react";
import { useTransactions } from "@/hooks/use-transactions";
import { useStaff } from "@/hooks/use-staff";
import { summarize, groupByDay, staffRanking, serviceRanking } from "@/lib/report";
import { shopRevenue, totalStaffShare, buildRateMap } from "@/lib/commission";
import { PageHeader } from "@/components/shared/page-header";
import { Reveal } from "@/components/shared/reveal";
import { StatCard } from "@/components/shared/stat-card";
import { Segmented } from "@/components/ui/segmented";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { BarChart } from "@/components/charts/bar-chart";
import { PaymentSplit } from "@/components/charts/split-bar";
import { RankList } from "@/components/charts/rank-list";
import { formatCompactVnd, formatCurrency } from "@/lib/format";

type Range = "7d" | "30d" | "90d";
const DAYS: Record<Range, number> = { "7d": 7, "30d": 30, "90d": 90 };

export default function ReportsPage() {
  const [range, setRange] = useState<Range>("7d");
  const from = useMemo(() => startOfDay(subDays(new Date(), DAYS[range] - 1)), [range]);
  const { data: txns, isLoading } = useTransactions({ from: from.toISOString(), limit: 1000 });
  const { data: staff } = useStaff();

  const stats = useMemo(() => summarize(txns ?? []), [txns]);
  const daily = useMemo(() => groupByDay(txns ?? [], from, new Date()), [txns, from]);
  const staffRank = useMemo(() => staffRanking(txns ?? [], staff ?? []), [txns, staff]);
  const serviceRank = useMemo(() => serviceRanking(txns ?? []).slice(0, 6), [txns]);
  const rateMap = useMemo(() => buildRateMap(staff ?? []), [staff]);
  const shopRev = useMemo(() => shopRevenue(txns ?? [], rateMap), [txns, rateMap]);
  const staffShare = useMemo(() => totalStaffShare(txns ?? [], rateMap), [txns, rateMap]);

  return (
    <div>
      <PageHeader
        title="Báo cáo"
        description="Phân tích doanh thu, dịch vụ và hiệu suất nhân viên."
        action={
          <Segmented
            value={range}
            onChange={setRange}
            options={[
              { value: "7d", label: "7 ngày" },
              { value: "30d", label: "30 ngày" },
              { value: "90d", label: "90 ngày" },
            ]}
          />
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="space-y-5">
          <Reveal className="grid grid-cols-2 gap-3 lg:grid-cols-4" stagger={0.05}>
            <StatCard label="Tổng doanh thu" value={formatCompactVnd(stats.revenue)} suffix="₫" icon={Wallet} accent="copper" />
            <StatCard label="Doanh thu tiệm" value={formatCompactVnd(shopRev)} suffix="₫" icon={Store} accent="success" hint="Phần tiệm giữ" />
            <StatCard label="Tiền chia thợ" value={formatCompactVnd(staffShare)} suffix="₫" icon={HandCoins} accent="info" />
            <StatCard label="Số hoá đơn" value={String(stats.count)} icon={Receipt} accent="neutral" />
          </Reveal>

          <div className="rounded-2xl border border-line bg-paper p-5 shadow-(--shadow-sm) sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-medium text-ink">Doanh thu theo ngày</h3>
              <span className="text-sm text-ink-muted">Tổng {formatCurrency(stats.revenue)}</span>
            </div>
            {daily.some((d) => d.total > 0) ? (
              <BarChart data={daily.map((d) => ({ label: d.label, value: d.total }))} height={200} />
            ) : (
              <p className="py-12 text-center text-sm text-ink-muted">Chưa có doanh thu trong khoảng này.</p>
            )}
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <section className="rounded-2xl border border-line bg-paper p-5 shadow-(--shadow-sm)">
              <h3 className="mb-4 font-display text-lg font-medium text-ink">Hình thức thanh toán</h3>
              {stats.revenue > 0 ? (
                <PaymentSplit cash={stats.cash} transfer={stats.transfer} />
              ) : (
                <EmptyState title="Chưa có dữ liệu" className="py-8" />
              )}
            </section>

            <section className="rounded-2xl border border-line bg-paper p-5 shadow-(--shadow-sm)">
              <h3 className="mb-4 inline-flex items-center gap-2 font-display text-lg font-medium text-ink">
                <Trophy className="size-4 text-copper" /> Thợ xuất sắc
              </h3>
              {staffRank.length > 0 ? (
                <RankList
                  items={staffRank.map((s) => ({
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
                <EmptyState title="Chưa có dữ liệu" className="py-8" />
              )}
            </section>

            <section className="rounded-2xl border border-line bg-paper p-5 shadow-(--shadow-sm)">
              <h3 className="mb-4 inline-flex items-center gap-2 font-display text-lg font-medium text-ink">
                <Sparkles className="size-4 text-copper" /> Dịch vụ bán chạy
              </h3>
              {serviceRank.length > 0 ? (
                <RankList
                  items={serviceRank.map((s) => ({
                    key: s.name,
                    label: s.name,
                    value: s.total,
                    valueLabel: formatCompactVnd(s.total),
                    sub: `${s.count} lần`,
                  }))}
                />
              ) : (
                <EmptyState title="Chưa có dữ liệu" className="py-8" />
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
