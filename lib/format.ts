import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { vi } from "date-fns/locale";

const VND = new Intl.NumberFormat("vi-VN", {
  style: "decimal",
  maximumFractionDigits: 0,
});

/** 1250000 → "1.250.000 ₫" */
export function formatCurrency(value: number | null | undefined): string {
  return `${VND.format(Math.round(value ?? 0))} ₫`;
}

/** 1250000 → "1.250.000" (không kèm ký hiệu) */
export function formatNumber(value: number | null | undefined): string {
  return VND.format(Math.round(value ?? 0));
}

/** 8700000 → "8,7Tr" · 1250000 → "1,25Tr" · 12000 → "12N" — cho thẻ thống kê gọn. */
export function formatCompactVnd(value: number | null | undefined): string {
  const n = Math.round(value ?? 0);
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${trim(n / 1_000_000_000)}Tỷ`;
  if (abs >= 1_000_000) return `${trim(n / 1_000_000)}Tr`;
  if (abs >= 1_000) return `${trim(n / 1_000)}N`;
  return VND.format(n);
}

function trim(n: number): string {
  return n
    .toFixed(2)
    .replace(/\.?0+$/, "")
    .replace(".", ",");
}

export function formatTime(date: string | Date): string {
  return format(new Date(date), "HH:mm", { locale: vi });
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy", { locale: vi });
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "HH:mm · dd/MM/yyyy", { locale: vi });
}

/** "Hôm nay 14:32" / "Hôm qua 09:10" / "18/06 14:32" */
export function formatSmartDateTime(date: string | Date): string {
  const d = new Date(date);
  if (isToday(d)) return `Hôm nay ${formatTime(d)}`;
  if (isYesterday(d)) return `Hôm qua ${formatTime(d)}`;
  return format(d, "dd/MM HH:mm", { locale: vi });
}

export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { locale: vi, addSuffix: true });
}

export function formatPercent(value: number | null | undefined): string {
  return `${(value ?? 0).toFixed(0)}%`;
}
