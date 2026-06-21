-- ════════════════════════════════════════════════════════════════
-- FADE OS — Phân quyền chủ/nhân viên + ăn chia + kết toán.
-- Chạy SAU 0003_cash_received.sql.
-- ════════════════════════════════════════════════════════════════

-- ── Vai trò + ép đổi mật khẩu lần đầu ──────────────────────────
alter table fade_os_members alter column role set default 'staff';
alter table fade_os_members
  add column if not exists must_change_password boolean not null default false;

-- ── Liên kết tài khoản ↔ hồ sơ thợ ─────────────────────────────
alter table fade_os_staff
  add column if not exists user_id uuid references auth.users(id) on delete set null;
create unique index if not exists fade_os_staff_user_uk
  on fade_os_staff(user_id) where user_id is not null;

-- ── Bảng kết toán (phiếu trả công nhân viên) ───────────────────
create table if not exists fade_os_settlements (
  id              uuid primary key default gen_random_uuid(),
  staff_id        uuid references fade_os_staff(id) on delete set null,
  period_start    timestamptz not null,
  period_end      timestamptz not null,
  gross_revenue   numeric(12,2) not null default 0,  -- doanh thu thợ trong kỳ (sau giảm giá)
  rate            numeric(5,2)  not null default 50,  -- % tại thời điểm kết toán
  employee_amount numeric(12,2) not null default 0,  -- tiền thợ thực nhận
  txn_count       int           not null default 0,
  status          text          not null default 'paid', -- pending | paid
  paid_at         timestamptz,
  settled_by      text,
  note            text,
  created_at      timestamptz not null default now()
);
create index if not exists fade_os_settlements_staff_idx on fade_os_settlements(staff_id);

-- Đánh dấu hoá đơn đã thuộc về 1 phiếu kết toán (chống tính trùng).
alter table fade_os_transactions
  add column if not exists settlement_id uuid references fade_os_settlements(id) on delete set null;
create index if not exists fade_os_transactions_settlement_idx
  on fade_os_transactions(settlement_id);

-- ── Hàm hỗ trợ phân quyền ──────────────────────────────────────
create or replace function fade_os_is_owner()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from fade_os_members where user_id = auth.uid() and role = 'owner');
$$;

create or replace function fade_os_my_staff_id()
returns uuid language sql security definer stable set search_path = public as $$
  select id from fade_os_staff where user_id = auth.uid() limit 1;
$$;

-- ── RLS: thay chính sách "thành viên = full" bằng theo vai trò ──
do $$ declare t text; begin
  foreach t in array array[
    'fade_os_staff','fade_os_services','fade_os_shifts',
    'fade_os_transactions','fade_os_transaction_items','fade_os_cash_movements'
  ]
  loop execute format('drop policy if exists "fade_os_member_all" on %I;', t); end loop;
end $$;

-- services: chủ toàn quyền; mọi thành viên đọc (để hiện ở POS)
drop policy if exists fade_os_svc_owner on fade_os_services;
drop policy if exists fade_os_svc_read  on fade_os_services;
create policy fade_os_svc_owner on fade_os_services for all to authenticated
  using (fade_os_is_owner()) with check (fade_os_is_owner());
create policy fade_os_svc_read on fade_os_services for select to authenticated
  using (fade_os_is_member());

-- staff: chủ toàn quyền; nhân viên đọc hồ sơ của chính mình
drop policy if exists fade_os_staff_owner on fade_os_staff;
drop policy if exists fade_os_staff_self  on fade_os_staff;
create policy fade_os_staff_owner on fade_os_staff for all to authenticated
  using (fade_os_is_owner()) with check (fade_os_is_owner());
create policy fade_os_staff_self on fade_os_staff for select to authenticated
  using (user_id = auth.uid());

-- shifts: chủ toàn quyền; nhân viên đọc (để biết ca đang mở)
drop policy if exists fade_os_shift_owner on fade_os_shifts;
drop policy if exists fade_os_shift_read  on fade_os_shifts;
create policy fade_os_shift_owner on fade_os_shifts for all to authenticated
  using (fade_os_is_owner()) with check (fade_os_is_owner());
create policy fade_os_shift_read on fade_os_shifts for select to authenticated
  using (fade_os_is_member());

-- cash_movements: chỉ chủ
drop policy if exists fade_os_cash_owner on fade_os_cash_movements;
create policy fade_os_cash_owner on fade_os_cash_movements for all to authenticated
  using (fade_os_is_owner()) with check (fade_os_is_owner());

-- transactions: chủ toàn quyền; nhân viên chỉ đọc & tạo hoá đơn của chính mình
drop policy if exists fade_os_txn_owner     on fade_os_transactions;
drop policy if exists fade_os_txn_staff_sel on fade_os_transactions;
drop policy if exists fade_os_txn_staff_ins on fade_os_transactions;
create policy fade_os_txn_owner on fade_os_transactions for all to authenticated
  using (fade_os_is_owner()) with check (fade_os_is_owner());
create policy fade_os_txn_staff_sel on fade_os_transactions for select to authenticated
  using (staff_id = fade_os_my_staff_id());
create policy fade_os_txn_staff_ins on fade_os_transactions for insert to authenticated
  with check (staff_id = fade_os_my_staff_id());

-- transaction_items: tương tự
drop policy if exists fade_os_item_owner     on fade_os_transaction_items;
drop policy if exists fade_os_item_staff_sel on fade_os_transaction_items;
drop policy if exists fade_os_item_staff_ins on fade_os_transaction_items;
create policy fade_os_item_owner on fade_os_transaction_items for all to authenticated
  using (fade_os_is_owner()) with check (fade_os_is_owner());
create policy fade_os_item_staff_sel on fade_os_transaction_items for select to authenticated
  using (staff_id = fade_os_my_staff_id());
create policy fade_os_item_staff_ins on fade_os_transaction_items for insert to authenticated
  with check (staff_id = fade_os_my_staff_id());

-- members: chủ toàn quyền (quản lý nhân viên); giữ chính sách tự đọc của 0002
drop policy if exists fade_os_members_owner on fade_os_members;
create policy fade_os_members_owner on fade_os_members for all to authenticated
  using (fade_os_is_owner()) with check (fade_os_is_owner());

-- settlements: chủ toàn quyền; nhân viên đọc phiếu của mình
alter table fade_os_settlements enable row level security;
drop policy if exists fade_os_settle_owner on fade_os_settlements;
drop policy if exists fade_os_settle_staff on fade_os_settlements;
create policy fade_os_settle_owner on fade_os_settlements for all to authenticated
  using (fade_os_is_owner()) with check (fade_os_is_owner());
create policy fade_os_settle_staff on fade_os_settlements for select to authenticated
  using (staff_id = fade_os_my_staff_id());
