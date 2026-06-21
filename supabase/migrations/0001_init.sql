-- ════════════════════════════════════════════════════════════════
-- FADE OS — Schema quản lý tiệm cắt tóc (database dùng chung)
-- Mọi đối tượng đều có tiền tố fade_os_ để tránh trùng với project khác.
-- Chạy trong: Supabase Dashboard → SQL Editor → New query → Run
-- ════════════════════════════════════════════════════════════════

-- ── Dọn dẹp các bảng KHÔNG tiền tố từng tạo trước đó (tolerant) ──
do $$ begin
  drop table if exists transaction_items cascade;
  drop table if exists transactions cascade;
  drop table if exists cash_movements cascade;
  drop table if exists shifts cascade;
  drop table if exists services cascade;
  drop table if exists staff cascade;
  drop sequence if exists txn_code_seq;
exception when others then null; end $$;
-- Chỉ xoá enum không tiền tố nếu KHÔNG còn ai dùng (nếu bị dùng sẽ bỏ qua).
do $$ begin drop type if exists payment_method; exception when others then null; end $$;
do $$ begin drop type if exists shift_status;   exception when others then null; end $$;
do $$ begin drop type if exists txn_status;     exception when others then null; end $$;
do $$ begin drop type if exists staff_role;     exception when others then null; end $$;
do $$ begin drop type if exists cash_dir;       exception when others then null; end $$;

-- ── Enums ──────────────────────────────────────────────────────
do $$ begin
  create type fade_os_payment_method as enum ('cash', 'transfer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type fade_os_shift_status as enum ('open', 'closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type fade_os_txn_status as enum ('paid', 'void');
exception when duplicate_object then null; end $$;

do $$ begin
  create type fade_os_staff_role as enum ('barber', 'cashier', 'manager');
exception when duplicate_object then null; end $$;

do $$ begin
  create type fade_os_cash_dir as enum ('in', 'out');
exception when duplicate_object then null; end $$;

-- ── Sequence cho mã hoá đơn (HD-00001) ─────────────────────────
create sequence if not exists fade_os_txn_code_seq start 1;

-- ── Nhân viên (thợ / thu ngân) ─────────────────────────────────
create table if not exists fade_os_staff (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  phone           text,
  role            fade_os_staff_role not null default 'barber',
  commission_rate numeric(5,2) not null default 0,
  color           text,
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

-- ── Dịch vụ ────────────────────────────────────────────────────
create table if not exists fade_os_services (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  category     text not null default 'Khác',
  price        numeric(12,2) not null default 0,
  duration_min int not null default 30,
  active       boolean not null default true,
  sort         int not null default 0,
  created_at   timestamptz not null default now()
);

-- ── Ca làm việc (kèm quỹ đầu/cuối ngày) ────────────────────────
create table if not exists fade_os_shifts (
  id              uuid primary key default gen_random_uuid(),
  opened_at       timestamptz not null default now(),
  closed_at       timestamptz,
  opened_by       text,
  closed_by       text,
  opening_fund    numeric(12,2) not null default 0,  -- quỹ đầu ngày
  closing_counted numeric(12,2),                      -- tiền mặt đếm thực tế cuối ngày
  status          fade_os_shift_status not null default 'open',
  note            text,
  created_at      timestamptz not null default now()
);

-- Chỉ cho phép tối đa 1 ca đang mở tại một thời điểm.
create unique index if not exists fade_os_shifts_single_open
  on fade_os_shifts ((status))
  where status = 'open';

-- ── Hoá đơn ────────────────────────────────────────────────────
create table if not exists fade_os_transactions (
  id                uuid primary key default gen_random_uuid(),
  code              text not null default ('HD-' || lpad(nextval('fade_os_txn_code_seq')::text, 5, '0')),
  shift_id          uuid references fade_os_shifts(id) on delete set null,
  staff_id          uuid references fade_os_staff(id) on delete set null,
  customer_name     text,
  payment_method    fade_os_payment_method not null default 'cash',
  transfer_verified boolean not null default false,
  subtotal          numeric(12,2) not null default 0,
  discount          numeric(12,2) not null default 0,
  total             numeric(12,2) not null default 0,
  status            fade_os_txn_status not null default 'paid',
  note              text,
  created_at        timestamptz not null default now()
);

create index if not exists fade_os_transactions_shift_idx   on fade_os_transactions (shift_id);
create index if not exists fade_os_transactions_created_idx on fade_os_transactions (created_at desc);
create index if not exists fade_os_transactions_staff_idx   on fade_os_transactions (staff_id);

-- ── Chi tiết hoá đơn ───────────────────────────────────────────
create table if not exists fade_os_transaction_items (
  id             uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references fade_os_transactions(id) on delete cascade,
  service_id     uuid references fade_os_services(id) on delete set null,
  staff_id       uuid references fade_os_staff(id) on delete set null,
  name           text not null,
  price          numeric(12,2) not null default 0,
  qty            int not null default 1,
  created_at     timestamptz not null default now()
);

create index if not exists fade_os_txn_items_txn_idx on fade_os_transaction_items (transaction_id);

-- ── Thu/chi quỹ phát sinh (ngoài bán hàng) ─────────────────────
create table if not exists fade_os_cash_movements (
  id         uuid primary key default gen_random_uuid(),
  shift_id   uuid references fade_os_shifts(id) on delete set null,
  direction  fade_os_cash_dir not null,
  amount     numeric(12,2) not null,
  reason     text,
  created_at timestamptz not null default now()
);

create index if not exists fade_os_cash_movements_shift_idx on fade_os_cash_movements (shift_id);

-- ── Row Level Security ─────────────────────────────────────────
-- Mô hình 1 tài khoản chung: mọi user đã đăng nhập (authenticated)
-- được toàn quyền; khách (anon) không truy cập được.
alter table fade_os_staff             enable row level security;
alter table fade_os_services          enable row level security;
alter table fade_os_shifts            enable row level security;
alter table fade_os_transactions      enable row level security;
alter table fade_os_transaction_items enable row level security;
alter table fade_os_cash_movements    enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'fade_os_staff','fade_os_services','fade_os_shifts',
    'fade_os_transactions','fade_os_transaction_items','fade_os_cash_movements'
  ]
  loop
    execute format('drop policy if exists "fade_os_authenticated_all" on %I;', t);
    execute format(
      'create policy "fade_os_authenticated_all" on %I
         for all to authenticated using (true) with check (true);', t
    );
  end loop;
end $$;

-- ── Realtime (tuỳ chọn — cho dashboard cập nhật trực tiếp) ──────
do $$ begin
  alter publication supabase_realtime add table fade_os_transactions;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table fade_os_shifts;
exception when duplicate_object then null; end $$;
