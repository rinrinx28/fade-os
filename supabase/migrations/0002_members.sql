-- ════════════════════════════════════════════════════════════════
-- FADE OS — Tách auth: chỉ THÀNH VIÊN fade-os mới truy cập được.
-- Chạy SAU 0001_init.sql.
-- ════════════════════════════════════════════════════════════════

-- ── Bảng thành viên fade-os ────────────────────────────────────
-- Mỗi dòng = 1 tài khoản Supabase được phép dùng fade-os.
-- Người dùng app khác (cùng project Supabase) KHÔNG có dòng ở đây
-- nên không vào được và không đọc được dữ liệu fade-os.
create table if not exists fade_os_members (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  role       text not null default 'manager',
  created_at timestamptz not null default now()
);

alter table fade_os_members enable row level security;

-- Thành viên chỉ xem được chính dòng của mình (để app kiểm tra quyền).
-- Việc thêm/sửa thành viên chỉ làm qua service role (script), không mở cho client.
drop policy if exists fade_os_members_self on fade_os_members;
create policy fade_os_members_self on fade_os_members
  for select to authenticated using (user_id = auth.uid());

-- ── Hàm kiểm tra thành viên (security definer để né RLS đệ quy) ──
create or replace function fade_os_is_member()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from fade_os_members where user_id = auth.uid());
$$;

-- ── Siết RLS dữ liệu: thay "authenticated" → "là thành viên fade-os" ──
do $$
declare t text;
begin
  foreach t in array array[
    'fade_os_staff','fade_os_services','fade_os_shifts',
    'fade_os_transactions','fade_os_transaction_items','fade_os_cash_movements'
  ]
  loop
    execute format('drop policy if exists "fade_os_authenticated_all" on %I;', t);
    execute format('drop policy if exists "fade_os_member_all" on %I;', t);
    execute format(
      'create policy "fade_os_member_all" on %I
         for all to authenticated
         using (fade_os_is_member()) with check (fade_os_is_member());', t
    );
  end loop;
end $$;
