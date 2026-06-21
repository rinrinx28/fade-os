# ✂️ FADE OS

Hệ thống quản lý tiệm cắt tóc: thu ngân (POS), ca làm việc, quỹ đầu/cuối ngày, dịch vụ, nhân viên và báo cáo doanh thu. Giao diện hiện đại, nhiều animation (GSAP), tông **Light Luxury** (kem ấm · đồng · serif).

> Next.js 16 · React 19 · Tailwind v4 · Supabase · GSAP · TanStack Query · Zustand

---

## ✨ Tính năng

| Màn hình | Mô tả |
|----------|------|
| **Tổng quan** (chủ) | Doanh thu hôm nay, **doanh thu tiệm / tiền chia thợ**, tiền mặt trong két, biểu đồ 7 ngày, thợ nổi bật |
| **Tính tiền (POS)** | Chọn dịch vụ, giảm giá, **khách đưa / tiền thối**, tiền mặt / chuyển khoản. Tự gán thợ = người đăng nhập |
| **Ca & Quỹ** (chủ) | Mở ca (quỹ đầu ngày) · thu/chi quỹ · đóng ca + **đối soát tiền mặt** · lịch sử ca |
| **Giao dịch** (chủ) | Lịch sử hoá đơn, lọc thời gian, xem chi tiết, huỷ HĐ, xác nhận chuyển khoản |
| **Kết toán** (chủ) | Chọn nhân viên + kỳ (tuần này/trước/tùy chọn) → trả công ăn chia, đánh dấu đã trả |
| **Dịch vụ** (chủ) | Bảng giá theo nhóm, thêm/sửa/xoá, bật/tắt kinh doanh |
| **Nhân viên** (chủ) | Tạo thợ + **cấp tài khoản**, tỷ lệ ăn chia, đặt lại mật khẩu, **gỡ khỏi tiệm / mời lại** |
| **Doanh thu của tôi** (nhân viên) | Doanh thu + hoa hồng cá nhân, chờ kết toán, đã nhận |
| **Báo cáo** (chủ) | Doanh thu theo ngày, hình thức thanh toán, xếp hạng thợ & dịch vụ |
| **Hồ sơ** (mọi người) | Tự đổi tên, SĐT, mật khẩu. Quên mật khẩu → chủ tiệm đặt lại giúp |

**Phân quyền:** **Chủ tiệm** thấy mọi màn; **nhân viên** chỉ thấy *Tính tiền* + *Doanh thu của tôi*, hoá đơn tự gán cho chính họ, không huỷ HĐ, chỉ thấy dữ liệu của mình (RLS).

**Gỡ nhân viên (xoá mềm):** chủ "Gỡ khỏi tiệm" → nhân viên mất quyền truy cập tiệm (cờ `members.active=false`) **nhưng giữ toàn bộ dữ liệu** (hoá đơn/kết toán) và **không bị ban tài khoản** → email đó vẫn có thể được mời vào tiệm khác. Mỗi email chỉ thuộc 1 tiệm tại một thời điểm. Chủ có thể "Mời lại" để khôi phục.

**Ăn chia:** mỗi thợ (kể cả chủ) nhận `tỷ lệ%` (mặc định 50%) trên doanh thu sau giảm giá; phần còn lại là **doanh thu tiệm**. Chủ kết toán/trả công cho nhân viên theo tuần hoặc tuỳ chọn.

**Thanh toán:** tiền mặt hoặc chuyển khoản — không tích hợp cổng; thu ngân tự kiểm tra và tick xác nhận thủ công.

---

## 🚀 Cài đặt

### 1. Biến môi trường
Sao chép `.env.example` → `.env.local` và điền key Supabase (Dashboard → Project Settings → API):

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...     # publishable key
SUPABASE_SERVICE_ROLE_KEY=...         # chỉ dùng cho script tạo user (không vào client)
SUPABASE_DB_URL=postgresql://...      # chỉ dùng cho script chạy migration
```

### 2. Tạo schema trong Supabase
Mở **SQL Editor** chạy lần lượt tất cả file trong `supabase/migrations/` theo thứ tự (`0001` → `0004`). (Tuỳ chọn: `supabase/seed.sql` để có sẵn thợ & bảng giá mẫu.)

Hoặc nếu đã có `SUPABASE_DB_URL` trong `.env.local`:

```bash
pnpm db:push    # tạo/cập nhật bảng + RLS (cả 4 migration)
pnpm db:seed    # dữ liệu mẫu (tuỳ chọn)
```

### 3. Tạo TIỆM + tài khoản CHỦ TIỆM (qua shell)

```bash
pnpm user:create email-cua-anh@gmail.com matkhau "Tên chủ tiệm" "Tên tiệm"
```

> Tạo một **tiệm mới** + tài khoản **owner** + hồ sơ thợ (chủ cũng là một thợ). Mỗi lệnh = 1 tiệm; muốn nhiều tiệm thì chạy nhiều lần với **email chủ khác nhau** (mỗi email chỉ thuộc 1 tiệm). Sau đó vào app → **Nhân viên** → "Thêm nhân viên".

### Quên mật khẩu (do chủ tiệm quản lý — không dùng email)

Không phụ thuộc email (Supabase chặn sửa template nếu chưa gắn SMTP riêng):
- **Nhân viên quên** → chủ vào app **Nhân viên** → "Đặt lại mật khẩu" → cấp mật khẩu tạm, nhân viên đổi khi đăng nhập.
- **Chủ quên** → chạy `pnpm pass:reset <email> <mật-khẩu-mới>`.

### 4. Chạy

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

**Đăng nhập:** chưa có tài khoản mặc định — tạo tài khoản của bạn ở bước 3 (`pnpm user:create email matkhau`) rồi dùng email/mật khẩu đó để vào.

---

## 🗄️ Kiến trúc dữ liệu

Database **dùng chung** với project khác → mọi bảng có tiền tố `fade_os_`:

```
fade_os_shops              TIỆM (mỗi dòng = 1 tiệm — multi-tenant)
fade_os_staff              nhân viên (thợ / thu ngân)        + shop_id
fade_os_services           dịch vụ + bảng giá                + shop_id
fade_os_shifts             ca làm việc + quỹ đầu/cuối ngày    + shop_id
fade_os_transactions       hoá đơn                           + shop_id
fade_os_transaction_items  chi tiết hoá đơn                  + shop_id
fade_os_cash_movements     thu/chi quỹ ngoài bán hàng        + shop_id
fade_os_members            (user_id, shop_id, role, active)  — thành viên từng tiệm
fade_os_settlements        phiếu kết toán trả công           + shop_id
```

**Multi-tenant (tách biệt tuyệt đối giữa các tiệm):** mọi bảng có `shop_id`. RLS giới hạn mọi truy cập trong **tiệm hiện tại** của user (`fade_os_current_shop()`), và **trigger tự gán `shop_id`** khi insert. → Chủ tiệm A **không bao giờ** thấy dữ liệu tiệm B; nhân viên chỉ thấy dữ liệu tiệm hiện tại của mình. **Dữ liệu không leak giữa các tiệm.**

**Mỗi email = 1 tiệm active:** unique index `fade_os_members(user_id) where active` chặn ở mức DB. Gỡ nhân viên khỏi tiệm = `members.active=false` (giữ data, không ban account) → email đó vào được tiệm khác; data cũ **ở lại tiệm cũ**, không đi theo người.

**Database dùng chung** với project khác → mọi bảng có tiền tố `fade_os_`. Supabase Auth dùng chung cả project; fade-os cô lập bằng tư cách thành viên + RLS theo `shop_id`.

**Đối soát quỹ:** `tiền mặt dự kiến = quỹ đầu ca + bán tiền mặt + thu thêm − chi`. Chuyển khoản không nằm trong két nên không tính vào đối soát.

---

## 📜 Scripts

| Lệnh | Tác dụng |
|------|----------|
| `pnpm dev` / `build` / `start` | Phát triển / build / chạy production |
| `pnpm db:push` | Tạo/cập nhật schema lên Supabase (cả 6 migration) |
| `pnpm db:seed` | Nạp dữ liệu mẫu |
| `pnpm user:create <email> <pass> "Tên chủ" "Tên tiệm"` | Tạo **TIỆM mới** + chủ tiệm + hồ sơ thợ |
| `pnpm user:delete <email>` | Xoá một tài khoản |
| `pnpm pass:reset <email> <pass>` | Đặt lại mật khẩu cho 1 tài khoản (cứu khi chủ quên) |
| `pnpm owner:delete <email> [--all]` | **Xoá chủ tiệm → xoá sạch dữ liệu ĐÚNG tiệm đó** (cascade, không đụng tiệm khác; `--all` xoá luôn account nhân viên) |
| `node scripts/shot.mjs` | Chụp ảnh các màn hình (cần `pnpm dev` + Playwright) |

---

## 📁 Cấu trúc

```
app/
  login/                 trang đăng nhập (GSAP intro)
  (app)/                 khu vực đã đăng nhập (sidebar + topbar)
    page.tsx             Tổng quan
    pos/ shifts/ transactions/ services/ staff/ reports/
components/
  ui/                    Button, Card, Modal, Field, Badge, Switch, Segmented…
  shared/                Reveal, AnimatedNumber, StatCard, PageHeader
  charts/                BarChart, RankList, PaymentSplit (SVG/CSS tự dựng)
  pos/ shifts/ staff/ services/ transactions/   thành phần theo tính năng
hooks/                   use-shift, use-staff, use-services, use-transactions
lib/                     supabase clients, format (VND), report, shift, tables, types
stores/                  cart (Zustand)
supabase/                migrations + seed
proxy.ts                 bảo vệ route (Next 16 middleware → proxy)
```

---

Made with ☕ + ✂️
