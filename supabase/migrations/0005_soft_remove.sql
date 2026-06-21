-- ════════════════════════════════════════════════════════════════
-- FADE OS — Xoá mềm nhân viên (gỡ khỏi tiệm, giữ data, không ban account).
-- Chạy SAU 0004_roles_settlements.sql.
-- ════════════════════════════════════════════════════════════════

-- Cờ thành viên còn hiệu lực trong tiệm này. active=false = đã bị gỡ.
alter table fade_os_members add column if not exists active boolean not null default true;

-- Các hàm phân quyền chỉ tính thành viên CÒN HIỆU LỰC (active),
-- nhờ vậy nhân viên đã gỡ vừa không vào được app, vừa bị RLS chặn đọc dữ liệu.
create or replace function fade_os_is_owner()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from fade_os_members
    where user_id = auth.uid() and role = 'owner' and active
  );
$$;

create or replace function fade_os_is_member()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from fade_os_members
    where user_id = auth.uid() and active
  );
$$;

create or replace function fade_os_my_staff_id()
returns uuid language sql security definer stable set search_path = public as $$
  select s.id
  from fade_os_staff s
  where s.user_id = auth.uid()
    and exists (
      select 1 from fade_os_members m
      where m.user_id = auth.uid() and m.active
    )
  limit 1;
$$;
