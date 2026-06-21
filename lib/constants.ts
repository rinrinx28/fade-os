import type { PaymentMethod, StaffRole } from "@/lib/types/db";

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "Tiền mặt",
  transfer: "Chuyển khoản",
};

export const ROLE_LABELS: Record<StaffRole, string> = {
  barber: "Thợ cắt",
  cashier: "Thu ngân",
  manager: "Quản lý",
};

/** Nhóm dịch vụ gợi ý sẵn cho form. */
export const SERVICE_CATEGORIES = [
  "Cắt tóc",
  "Uốn",
  "Nhuộm",
  "Gội · Massage",
  "Combo",
  "Khác",
] as const;

/** Bảng màu accent gán cho thợ (avatar). */
export const STAFF_COLORS = [
  "#B45309", // copper
  "#0F766E", // teal
  "#7C3AED", // violet
  "#BE123C", // rose
  "#1D4ED8", // blue
  "#15803D", // green
  "#A16207", // gold
  "#9333EA", // purple
] as const;

export function pickStaffColor(index: number): string {
  return STAFF_COLORS[index % STAFF_COLORS.length];
}
