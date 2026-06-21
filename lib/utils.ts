import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Gộp class Tailwind, xử lý xung đột. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Tạo mảng từ 0..n-1 — tiện cho skeleton/loop. */
export function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

/** Chữ cái viết tắt từ tên (tối đa 2 ký tự). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
