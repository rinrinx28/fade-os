-- ════════════════════════════════════════════════════════════════
-- FADE OS — Lưu số tiền khách đưa (để tính & lưu tiền thối).
-- Chạy SAU 0002_members.sql.
-- ════════════════════════════════════════════════════════════════

-- Số tiền mặt khách đưa khi thanh toán (chỉ áp dụng hoá đơn tiền mặt).
-- Tiền thối = cash_received − total (suy ra, không cần lưu).
alter table fade_os_transactions
  add column if not exists cash_received numeric(12,2);
