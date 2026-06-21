/**
 * Kiểu dữ liệu phản chiếu schema Supabase (supabase/migrations/0001_init.sql).
 * Dùng `type` (không phải `interface`) để các Row thoả ràng buộc GenericSchema
 * của Supabase — interface không có index signature ngầm nên sẽ làm hỏng suy luận kiểu.
 */

export type PaymentMethod = "cash" | "transfer";
export type ShiftStatus = "open" | "closed";
export type TxnStatus = "paid" | "void";
export type StaffRole = "barber" | "cashier" | "manager";
export type CashDirection = "in" | "out";
/** Vai trò truy cập của tài khoản (khác với StaffRole là vai trò nghề). */
export type AccessRole = "owner" | "staff";
export type SettlementStatus = "pending" | "paid";

export type Shop = {
  id: string;
  name: string;
  created_at: string;
};

export type Staff = {
  id: string;
  shop_id: string;
  name: string;
  phone: string | null;
  role: StaffRole;
  commission_rate: number; // phần trăm thợ được nhận (ăn chia)
  color: string | null;
  active: boolean;
  user_id: string | null; // tài khoản đăng nhập gắn với thợ (nếu có)
  created_at: string;
};

export type Service = {
  id: string;
  shop_id: string;
  name: string;
  category: string;
  price: number;
  duration_min: number;
  active: boolean;
  sort: number;
  created_at: string;
};

export type Shift = {
  id: string;
  shop_id: string;
  opened_at: string;
  closed_at: string | null;
  opened_by: string | null;
  closed_by: string | null;
  opening_fund: number; // quỹ đầu ngày
  closing_counted: number | null; // tiền mặt đếm cuối ngày
  status: ShiftStatus;
  note: string | null;
  created_at: string;
};

export type Transaction = {
  id: string;
  shop_id: string;
  code: string | null;
  shift_id: string | null;
  staff_id: string | null;
  customer_name: string | null;
  payment_method: PaymentMethod;
  transfer_verified: boolean;
  cash_received: number | null;
  subtotal: number;
  discount: number;
  total: number;
  status: TxnStatus;
  settlement_id: string | null;
  note: string | null;
  created_at: string;
};

export type TransactionItem = {
  id: string;
  shop_id: string;
  transaction_id: string;
  service_id: string | null;
  staff_id: string | null;
  name: string;
  price: number;
  qty: number;
  created_at: string;
};

export type CashMovement = {
  id: string;
  shop_id: string;
  shift_id: string | null;
  direction: CashDirection;
  amount: number;
  reason: string | null;
  created_at: string;
};

export type Member = {
  id: string;
  user_id: string;
  shop_id: string;
  email: string | null;
  role: AccessRole;
  must_change_password: boolean;
  active: boolean;
  created_at: string;
};

export type Settlement = {
  id: string;
  shop_id: string;
  staff_id: string | null;
  period_start: string;
  period_end: string;
  gross_revenue: number;
  rate: number;
  employee_amount: number;
  txn_count: number;
  status: SettlementStatus;
  paid_at: string | null;
  settled_by: string | null;
  note: string | null;
  created_at: string;
};

/** Hoá đơn kèm chi tiết + thợ — dùng cho danh sách & báo cáo. */
export type TransactionWithItems = Transaction & {
  items: TransactionItem[];
  staff: Pick<Staff, "id" | "name" | "color"> | null;
};

type Insert<T, Optional extends keyof T> = Omit<T, Optional> & Partial<Pick<T, Optional>>;
type Update<T> = Partial<T>;

// shop_id được trigger tự gán khi user insert → optional ở Insert.
type GeneratedCols = "id" | "created_at" | "shop_id";

export type Database = {
  public: {
    Tables: {
      fade_os_shops: {
        Row: Shop;
        Insert: Insert<Shop, "id" | "created_at">;
        Update: Update<Shop>;
        Relationships: [];
      };
      fade_os_staff: {
        Row: Staff;
        Insert: Insert<Staff, GeneratedCols | "phone" | "role" | "commission_rate" | "color" | "active" | "user_id">;
        Update: Update<Staff>;
        Relationships: [];
      };
      fade_os_services: {
        Row: Service;
        Insert: Insert<Service, GeneratedCols | "category" | "duration_min" | "active" | "sort">;
        Update: Update<Service>;
        Relationships: [];
      };
      fade_os_shifts: {
        Row: Shift;
        Insert: Insert<Shift, GeneratedCols | "opened_at" | "closed_at" | "opened_by" | "closed_by" | "closing_counted" | "status" | "note">;
        Update: Update<Shift>;
        Relationships: [];
      };
      fade_os_transactions: {
        Row: Transaction;
        Insert: Insert<Transaction, GeneratedCols | "code" | "shift_id" | "staff_id" | "customer_name" | "transfer_verified" | "cash_received" | "discount" | "status" | "settlement_id" | "note">;
        Update: Update<Transaction>;
        Relationships: [];
      };
      fade_os_transaction_items: {
        Row: TransactionItem;
        Insert: Insert<TransactionItem, GeneratedCols | "service_id" | "staff_id" | "qty">;
        Update: Update<TransactionItem>;
        Relationships: [];
      };
      fade_os_cash_movements: {
        Row: CashMovement;
        Insert: Insert<CashMovement, GeneratedCols | "shift_id" | "reason">;
        Update: Update<CashMovement>;
        Relationships: [];
      };
      fade_os_members: {
        Row: Member;
        Insert: Insert<Member, "id" | "created_at" | "email" | "role" | "must_change_password" | "active">;
        Update: Update<Member>;
        Relationships: [];
      };
      fade_os_settlements: {
        Row: Settlement;
        Insert: Insert<Settlement, "id" | "created_at" | "shop_id" | "gross_revenue" | "rate" | "employee_amount" | "txn_count" | "status" | "paid_at" | "settled_by" | "note">;
        Update: Update<Settlement>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      fade_os_payment_method: PaymentMethod;
      fade_os_shift_status: ShiftStatus;
      fade_os_txn_status: TxnStatus;
      fade_os_staff_role: StaffRole;
      fade_os_cash_dir: CashDirection;
    };
    CompositeTypes: Record<string, never>;
  };
};
