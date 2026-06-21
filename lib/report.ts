import { eachDayOfInterval, format, isSameDay, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import type { Staff, TransactionWithItems } from "@/lib/types/db";

function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + Number(v || 0), 0);
}

const paidOnly = (txns: TransactionWithItems[]) => txns.filter((t) => t.status === "paid");

export interface Summary {
  revenue: number;
  count: number;
  cash: number;
  transfer: number;
  avg: number;
}

export function summarize(txns: TransactionWithItems[]): Summary {
  const paid = paidOnly(txns);
  const revenue = sum(paid.map((t) => t.total));
  const cash = sum(paid.filter((t) => t.payment_method === "cash").map((t) => t.total));
  return {
    revenue,
    count: paid.length,
    cash,
    transfer: revenue - cash,
    avg: paid.length ? revenue / paid.length : 0,
  };
}

export interface RevenuePoint {
  date: string;
  label: string;
  weekday: string;
  total: number;
  cash: number;
  transfer: number;
  count: number;
}

export function groupByDay(txns: TransactionWithItems[], from: Date, to: Date): RevenuePoint[] {
  const paid = paidOnly(txns);
  return eachDayOfInterval({ start: from, end: to }).map((d) => {
    const dayTxns = paid.filter((t) => isSameDay(parseISO(t.created_at), d));
    const cash = sum(dayTxns.filter((t) => t.payment_method === "cash").map((t) => t.total));
    const transfer = sum(dayTxns.filter((t) => t.payment_method === "transfer").map((t) => t.total));
    return {
      date: d.toISOString(),
      label: format(d, "dd/MM"),
      weekday: format(d, "EEEEEE", { locale: vi }),
      total: cash + transfer,
      cash,
      transfer,
      count: dayTxns.length,
    };
  });
}

export interface StaffRank {
  id: string;
  name: string;
  color: string | null;
  total: number;
  count: number;
}

export function staffRanking(txns: TransactionWithItems[], staff: Staff[]): StaffRank[] {
  const byId = new Map<string, { total: number; count: number }>();
  for (const t of paidOnly(txns)) {
    if (!t.staff_id) continue;
    const cur = byId.get(t.staff_id) ?? { total: 0, count: 0 };
    cur.total += Number(t.total);
    cur.count += 1;
    byId.set(t.staff_id, cur);
  }
  return staff
    .map((s) => ({ id: s.id, name: s.name, color: s.color, ...(byId.get(s.id) ?? { total: 0, count: 0 }) }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total);
}

export interface ServiceRank {
  name: string;
  total: number;
  count: number;
}

export function serviceRanking(txns: TransactionWithItems[]): ServiceRank[] {
  const map = new Map<string, { total: number; count: number }>();
  for (const t of paidOnly(txns)) {
    for (const it of t.items ?? []) {
      const cur = map.get(it.name) ?? { total: 0, count: 0 };
      cur.total += Number(it.price) * it.qty;
      cur.count += it.qty;
      map.set(it.name, cur);
    }
  }
  return [...map.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.total - a.total);
}
