-- ════════════════════════════════════════════════════════════════
-- Dữ liệu mẫu — chạy SAU 0001_init.sql để có sẵn thợ & bảng giá.
-- Tuỳ chọn; có thể bỏ qua nếu bạn tự nhập trong app.
-- ════════════════════════════════════════════════════════════════

insert into fade_os_staff (name, phone, role, commission_rate, color) values
  ('Tuấn Anh',  '0901111222', 'barber',  40, '#B45309'),
  ('Minh Khoa', '0903333444', 'barber',  40, '#0F766E'),
  ('Bảo Long',  '0905555666', 'barber',  35, '#7C3AED'),
  ('Hương',     '0907777888', 'cashier',  0, '#BE123C')
on conflict do nothing;

insert into fade_os_services (name, category, price, duration_min, sort) values
  ('Cắt nam cơ bản',         'Cắt tóc',       80000,  30, 1),
  ('Cắt + Gội + Tạo kiểu',   'Combo',         150000, 45, 2),
  ('Fade / Undercut',        'Cắt tóc',       120000, 40, 3),
  ('Cạo mặt · Cạo râu',      'Gội · Massage',  50000, 20, 4),
  ('Gội đầu thư giãn',       'Gội · Massage',  60000, 25, 5),
  ('Uốn Hàn Quốc',           'Uốn',           450000, 90, 6),
  ('Nhuộm thời trang',       'Nhuộm',         350000, 90, 7),
  ('Combo VIP (cắt+gội+cạo)','Combo',          220000, 60, 8)
on conflict do nothing;
