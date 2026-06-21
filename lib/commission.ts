import { startOfWeek, endOfWeek, subWeeks } from "date-fns";
import type { Staff, TransactionWithItems } from "@/lib/types/db";

/** Phần thợ được nhận = làm tròn(gross × rate%). */
export function employeeShare(gross: number, rate: number): number {
  return Math.round((Number(gross) * Number(rate)) / 100);
}

export function buildRateMap(staff: Staff[]): Map<string, number> {
  return new Map(staff.map((s) => [s.id, s.commission_rate]));
}

const paid = (txns: TransactionWithItems[]) => txns.filter((t) => t.status === "paid");

/** Phần tiệm giữ = Σ(total − phần thợ) trên hoá đơn đã thanh toán. */
export function shopRevenue(txns: TransactionWithItems[], rateMap: Map<string, number>): number {
  return paid(txns).reduce((acc, t) => {
    const rate = t.staff_id ? rateMap.get(t.staff_id) ?? 0 : 0;
    return acc + (Number(t.total) - employeeShare(Number(t.total), rate));
  }, 0);
}

/** Tổng phần chia cho tất cả thợ = Σ(phần thợ). */
export function totalStaffShare(txns: TransactionWithItems[], rateMap: Map<string, number>): number {
  return paid(txns).reduce((acc, t) => {
    const rate = t.staff_id ? rateMap.get(t.staff_id) ?? 0 : 0;
    return acc + employeeShare(Number(t.total), rate);
  }, 0);
}

export interface Period {
  start: Date;
  end: Date;
}

/** Tuần này / tuần trước (T2–CN, theo giờ máy). */
export function weekPeriod(which: "this" | "last", ref: Date): Period {
  const base = which === "last" ? subWeeks(ref, 1) : ref;
  return {
    start: startOfWeek(base, { weekStartsOn: 1 }),
    end: endOfWeek(base, { weekStartsOn: 1 }),
  };
}
