import {
  LayoutDashboard,
  ScissorsLineDashed,
  Receipt,
  CalendarClock,
  Sparkles,
  Users,
  BarChart3,
  Wallet,
  HandCoins,
  type LucideIcon,
} from "lucide-react";
import type { AccessRole } from "@/lib/types/db";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  hint: string;
  roles: AccessRole[];
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Tổng quan", icon: LayoutDashboard, hint: "Doanh thu & quỹ hôm nay", roles: ["owner"] },
  { href: "/pos", label: "Tính tiền", icon: ScissorsLineDashed, hint: "Tạo hoá đơn cho khách", roles: ["owner", "staff"] },
  { href: "/me", label: "Doanh thu của tôi", icon: Wallet, hint: "Doanh thu & hoa hồng cá nhân", roles: ["staff"] },
  { href: "/shifts", label: "Ca & Quỹ", icon: CalendarClock, hint: "Mở/đóng ca, đối soát", roles: ["owner"] },
  { href: "/transactions", label: "Giao dịch", icon: Receipt, hint: "Lịch sử hoá đơn", roles: ["owner"] },
  { href: "/settlements", label: "Kết toán", icon: HandCoins, hint: "Trả công cho nhân viên", roles: ["owner"] },
  { href: "/services", label: "Dịch vụ", icon: Sparkles, hint: "Bảng giá dịch vụ", roles: ["owner"] },
  { href: "/staff", label: "Nhân viên", icon: Users, hint: "Quản lý thợ & tài khoản", roles: ["owner"] },
  { href: "/reports", label: "Báo cáo", icon: BarChart3, hint: "Thống kê theo thời gian", roles: ["owner"] },
];

export function navForRole(role: AccessRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
