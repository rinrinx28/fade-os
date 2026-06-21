-- ════════════════════════════════════════════════════════════════
-- FADE OS — Multi-tenant: nhiều TIỆM trong cùng database, tách biệt tuyệt đối.
-- Mỗi bảng có shop_id; RLS scope theo "tiệm hiện tại" của user.
-- Mỗi email chỉ ở 1 tiệm active tại một thời điểm.
-- Chạy SAU 0005_soft_remove.sql. (DB nên đang trống.)
-- ════════════════════════════════════════════════════════════════

-- ── Bảng tiệm ──────────────────────────────────────────────────
create table if not exists fade_os_shops (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);
alter table fade_os_shops enable row level security;

-- ── Thêm shop_id vào mọi bảng dữ liệu (cascade khi xoá tiệm) ────
alter table fade_os_staff             add column if not exists shop_id uuid references fade_os_shops(id) on delete cascade;
alter table fade_os_services          add column if not exists shop_id uuid references fade_os_shops(id) on delete cascade;
alter table fade_os_shifts            add column if not exists shop_id uuid references fade_os_shops(id) on delete cascade;
alter table fade_os_transactions      add column if not exists shop_id uuid references fade_os_shops(id) on delete cascade;
alter table fade_os_transaction_items add column if not exists shop_id uuid references fade_os_shops(id) on delete cascade;
alter table fade_os_cash_movements    add column if not exists shop_id uuid references fade_os_shops(id) on delete cascade;
alter table fade_os_settlements       add column if not exists shop_id uuid references fade_os_shops(id) on delete cascade;

-- ── members: 1 user có thể là thành viên nhiều tiệm (mỗi tiệm 1 dòng) ──
alter table fade_os_members add column if not exists shop_id uuid references fade_os_shops(id) on delete cascade;
alter table fade_os_members add column if not exists id uuid default gen_random_uuid();
update fade_os_members set id = gen_random_uuid() where id is null;
alter table fade_os_members drop constraint if exists fade_os_members_pkey;
alter table fade_os_members add primary key (id);
create unique index if not exists fade_os_members_user_shop on fade_os_members(user_id, shop_id);
-- Mỗi email chỉ có 1 membership ĐANG hiệu lực (1 email = 1 tiệm active).
create unique index if not exists fade_os_members_one_active on fade_os_members(user_id) where active;

-- ── Thợ: 1 user có thể có hồ sơ ở nhiều tiệm (không còn unique chỉ theo user) ──
drop index if exists fade_os_staff_user_uk;
create unique index if not exists fade_os_staff_user_shop_uk on fade_os_staff(user_id, shop_id) where user_id is not null;

-- ── Chỉ 1 ca mở MỖI TIỆM ───────────────────────────────────────
drop index if exists fade_os_shifts_single_open;
create unique index if not exists fade_os_shifts_single_open on fade_os_shifts (shop_id) where status = 'open';

-- ── Hàm hỗ trợ (scope theo tiệm hiện tại) ──────────────────────
create or replace function fade_os_current_shop()
returns uuid language sql security definer stable set search_path = public as $$
  select shop_id from fade_os_members where user_id = auth.uid() and active limit 1;
$$;

create or replace function fade_os_is_owner()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from fade_os_members where user_id = auth.uid() and active and role = 'owner');
$$;

create or replace function fade_os_is_member()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from fade_os_members where user_id = auth.uid() and active);
$$;

create or replace function fade_os_my_staff_id()
returns uuid language sql security definer stable set search_path = public as $$
  select s.id from fade_os_staff s
  where s.user_id = auth.uid() and s.shop_id = fade_os_current_shop()
  limit 1;
$$;

-- ── Trigger tự gán shop_id khi insert (cho thao tác của user) ───
create or replace function fade_os_set_shop_id()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.shop_id is null then
    new.shop_id := fade_os_current_shop();
  end if;
  return new;
end;
$$;

do $$ declare t text; begin
  foreach t in array array[
    'fade_os_staff','fade_os_services','fade_os_shifts',
    'fade_os_transactions','fade_os_transaction_items','fade_os_cash_movements','fade_os_settlements'
  ]
  loop
    execute format('drop trigger if exists trg_set_shop_id on %I;', t);
    execute format('create trigger trg_set_shop_id before insert on %I for each row execute function fade_os_set_shop_id();', t);
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════════
-- RLS: mọi truy cập bị giới hạn trong TIỆM HIỆN TẠI của user.
-- ════════════════════════════════════════════════════════════════

-- shops
drop policy if exists fade_os_shop_read  on fade_os_shops;
drop policy if exists fade_os_shop_owner on fade_os_shops;
create policy fade_os_shop_read on fade_os_shops for select to authenticated
  using (id = fade_os_current_shop());
create policy fade_os_shop_owner on fade_os_shops for all to authenticated
  using (id = fade_os_current_shop() and fade_os_is_owner())
  with check (id = fade_os_current_shop() and fade_os_is_owner());

-- services: chủ toàn quyền (tiệm mình); thành viên đọc (tiệm mình)
drop policy if exists fade_os_svc_owner on fade_os_services;
drop policy if exists fade_os_svc_read  on fade_os_services;
create policy fade_os_svc_owner on fade_os_services for all to authenticated
  using (shop_id = fade_os_current_shop() and fade_os_is_owner())
  with check (shop_id = fade_os_current_shop() and fade_os_is_owner());
create policy fade_os_svc_read on fade_os_services for select to authenticated
  using (shop_id = fade_os_current_shop() and fade_os_is_member());

-- staff: chủ toàn quyền (tiệm mình); thợ đọc hồ sơ của chính mình (tiệm hiện tại)
drop policy if exists fade_os_staff_owner on fade_os_staff;
drop policy if exists fade_os_staff_self  on fade_os_staff;
create policy fade_os_staff_owner on fade_os_staff for all to authenticated
  using (shop_id = fade_os_current_shop() and fade_os_is_owner())
  with check (shop_id = fade_os_current_shop() and fade_os_is_owner());
create policy fade_os_staff_self on fade_os_staff for select to authenticated
  using (user_id = auth.uid() and shop_id = fade_os_current_shop());

-- shifts: chủ toàn quyền; thành viên đọc (tiệm mình)
drop policy if exists fade_os_shift_owner on fade_os_shifts;
drop policy if exists fade_os_shift_read  on fade_os_shifts;
create policy fade_os_shift_owner on fade_os_shifts for all to authenticated
  using (shop_id = fade_os_current_shop() and fade_os_is_owner())
  with check (shop_id = fade_os_current_shop() and fade_os_is_owner());
create policy fade_os_shift_read on fade_os_shifts for select to authenticated
  using (shop_id = fade_os_current_shop() and fade_os_is_member());

-- cash_movements: chỉ chủ (tiệm mình)
drop policy if exists fade_os_cash_owner on fade_os_cash_movements;
create policy fade_os_cash_owner on fade_os_cash_movements for all to authenticated
  using (shop_id = fade_os_current_shop() and fade_os_is_owner())
  with check (shop_id = fade_os_current_shop() and fade_os_is_owner());

-- transactions: chủ toàn quyền; thợ đọc & tạo hoá đơn của chính mình
drop policy if exists fade_os_txn_owner     on fade_os_transactions;
drop policy if exists fade_os_txn_staff_sel on fade_os_transactions;
drop policy if exists fade_os_txn_staff_ins on fade_os_transactions;
create policy fade_os_txn_owner on fade_os_transactions for all to authenticated
  using (shop_id = fade_os_current_shop() and fade_os_is_owner())
  with check (shop_id = fade_os_current_shop() and fade_os_is_owner());
create policy fade_os_txn_staff_sel on fade_os_transactions for select to authenticated
  using (shop_id = fade_os_current_shop() and staff_id = fade_os_my_staff_id());
create policy fade_os_txn_staff_ins on fade_os_transactions for insert to authenticated
  with check (shop_id = fade_os_current_shop() and staff_id = fade_os_my_staff_id());

-- transaction_items: tương tự
drop policy if exists fade_os_item_owner     on fade_os_transaction_items;
drop policy if exists fade_os_item_staff_sel on fade_os_transaction_items;
drop policy if exists fade_os_item_staff_ins on fade_os_transaction_items;
create policy fade_os_item_owner on fade_os_transaction_items for all to authenticated
  using (shop_id = fade_os_current_shop() and fade_os_is_owner())
  with check (shop_id = fade_os_current_shop() and fade_os_is_owner());
create policy fade_os_item_staff_sel on fade_os_transaction_items for select to authenticated
  using (shop_id = fade_os_current_shop() and staff_id = fade_os_my_staff_id());
create policy fade_os_item_staff_ins on fade_os_transaction_items for insert to authenticated
  with check (shop_id = fade_os_current_shop() and staff_id = fade_os_my_staff_id());

-- settlements: chủ toàn quyền; thợ đọc phiếu của mình
drop policy if exists fade_os_settle_owner on fade_os_settlements;
drop policy if exists fade_os_settle_staff on fade_os_settlements;
create policy fade_os_settle_owner on fade_os_settlements for all to authenticated
  using (shop_id = fade_os_current_shop() and fade_os_is_owner())
  with check (shop_id = fade_os_current_shop() and fade_os_is_owner());
create policy fade_os_settle_staff on fade_os_settlements for select to authenticated
  using (shop_id = fade_os_current_shop() and staff_id = fade_os_my_staff_id());

-- members: tự đọc các membership của mình; chủ quản lý thành viên tiệm mình
drop policy if exists fade_os_members_self  on fade_os_members;
drop policy if exists fade_os_members_owner on fade_os_members;
create policy fade_os_members_self on fade_os_members for select to authenticated
  using (user_id = auth.uid());
create policy fade_os_members_owner on fade_os_members for all to authenticated
  using (shop_id = fade_os_current_shop() and fade_os_is_owner())
  with check (shop_id = fade_os_current_shop() and fade_os_is_owner());
