/**
 * Tên bảng dùng chung — có tiền tố fade_os_ vì database dùng chung
 * với các project khác. Dùng `TABLE.x` ở mọi nơi thay vì chuỗi cứng.
 */
export const TABLE = {
  shops: "fade_os_shops",
  staff: "fade_os_staff",
  services: "fade_os_services",
  shifts: "fade_os_shifts",
  transactions: "fade_os_transactions",
  transactionItems: "fade_os_transaction_items",
  cashMovements: "fade_os_cash_movements",
  members: "fade_os_members",
  settlements: "fade_os_settlements",
} as const;
