"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Minus,
  Plus,
  Trash2,
  ScissorsLineDashed,
  Banknote,
  CreditCard,
  CircleAlert,
  Tag,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCart, cartSubtotal, suggestCashAmounts } from "@/stores/cart";
import { useCreateTransaction } from "@/hooks/use-transactions";
import { useSession } from "@/components/providers/session";
import { StaffPicker } from "./staff-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";
import { Avatar } from "@/components/ui/avatar";
import { formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Shift } from "@/lib/types/db";

export interface CheckoutSummary {
  code: string;
  total: number;
  paymentMethod: "cash" | "transfer";
  customerName: string | null;
  count: number;
  cashReceived: number | null;
  change: number | null;
}

interface CartPanelProps {
  shift: Shift | null;
  onSuccess: (summary: CheckoutSummary) => void;
  onClose?: () => void;
}

export function CartPanel({ shift, onSuccess, onClose }: CartPanelProps) {
  const cart = useCart();
  const create = useCreateTransaction();
  const session = useSession();
  const isOwner = session.role === "owner";
  const [showDiscount, setShowDiscount] = useState(false);

  // Mặc định gắn thợ = chính người đang đăng nhập.
  // Nhân viên bị khoá vào chính mình; chủ có thể đổi sang thợ khác.
  const staffId = isOwner ? cart.staffId : session.staffId;
  useEffect(() => {
    if (!isOwner) return;
    if (!cart.staffId && session.staffId) cart.setStaff(session.staffId);
  }, [isOwner, cart.staffId, session.staffId, cart]);

  const subtotal = cartSubtotal(cart.lines);
  const total = Math.max(0, subtotal - cart.discount);
  const itemCount = cart.lines.reduce((n, l) => n + l.qty, 0);
  const canCheckout = !!shift && cart.lines.length > 0 && !create.isPending;

  const isCash = cart.paymentMethod === "cash";
  const hasReceived = isCash && cart.cashReceived > 0;
  const change = hasReceived ? Math.max(0, cart.cashReceived - total) : 0;
  const suggestions = suggestCashAmounts(total);

  async function checkout() {
    if (!shift) {
      toast.error("Cần mở ca trước khi tính tiền.");
      return;
    }
    if (cart.lines.length === 0) return;

    try {
      const txn = await create.mutateAsync({
        shift_id: shift.id,
        staff_id: staffId,
        customer_name: cart.customerName.trim() || null,
        payment_method: cart.paymentMethod,
        transfer_verified: cart.paymentMethod === "transfer" ? cart.transferVerified : false,
        cash_received: hasReceived ? cart.cashReceived : null,
        subtotal,
        discount: cart.discount,
        total,
        note: cart.note.trim() || null,
        items: cart.lines.map((l) => ({
          service_id: l.serviceId,
          staff_id: staffId,
          name: l.name,
          price: l.price,
          qty: l.qty,
        })),
      });
      onSuccess({
        code: txn.code ?? "—",
        total,
        paymentMethod: cart.paymentMethod,
        customerName: cart.customerName.trim() || null,
        count: itemCount,
        cashReceived: hasReceived ? cart.cashReceived : null,
        change: hasReceived ? change : null,
      });
      cart.clear();
      setShowDiscount(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể tạo hoá đơn.");
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-medium text-ink">Hoá đơn</h2>
          {itemCount > 0 && (
            <span className="rounded-full bg-copper-soft px-2 py-0.5 text-xs font-semibold text-copper-deep">
              {itemCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {cart.lines.length > 0 && (
            <button onClick={() => cart.clear()} className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-paper-2 hover:text-danger">
              <Trash2 className="size-4" />
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-paper-2 lg:hidden">
              <X className="size-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {!shift &&
          (isOwner ? (
            <Link
              href="/shifts"
              className="flex items-center gap-2.5 rounded-xl border border-warning/30 bg-warning-soft px-3.5 py-3 text-sm text-[oklch(42%_0.1_70)]"
            >
              <CircleAlert className="size-4 shrink-0" />
              <span>Chưa mở ca. <b className="underline">Mở ca</b> để bắt đầu tính tiền.</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2.5 rounded-xl border border-warning/30 bg-warning-soft px-3.5 py-3 text-sm text-[oklch(42%_0.1_70)]">
              <CircleAlert className="size-4 shrink-0" />
              <span>Chưa có ca mở. Vui lòng chờ chủ tiệm mở ca để bắt đầu tính tiền.</span>
            </div>
          ))}

        <div>
          <p className="mb-2 text-xs font-medium text-ink-soft">Thợ phụ trách</p>
          {isOwner ? (
            <StaffPicker value={cart.staffId} onChange={cart.setStaff} />
          ) : (
            <div className="flex items-center gap-2.5 rounded-xl border border-line bg-paper-2/40 px-3 py-2">
              <Avatar name={session.staffName ?? session.email} color={session.staffColor} size="md" />
              <span className="text-sm font-medium text-ink">{session.staffName ?? "Bạn"}</span>
              <span className="ml-auto text-xs text-ink-muted">Thợ phụ trách</span>
            </div>
          )}
        </div>

        <Input
          value={cart.customerName}
          onChange={(e) => cart.setCustomerName(e.target.value)}
          placeholder="Tên khách (tuỳ chọn)"
        />

        {cart.lines.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-ink-muted">
            <ScissorsLineDashed className="size-7 text-ink-faint" />
            <p className="text-sm">Chọn dịch vụ để thêm vào hoá đơn</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {cart.lines.map((l) => (
              <li key={l.serviceId} className="rounded-xl border border-line bg-paper-2/40 p-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-ink">{l.name}</span>
                  <button
                    onClick={() => cart.removeLine(l.serviceId)}
                    className="text-ink-faint transition-colors hover:text-danger"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Stepper
                      onClick={() => cart.setQty(l.serviceId, l.qty - 1)}
                      icon={<Minus className="size-3.5" />}
                    />
                    <span className="w-7 text-center text-sm font-semibold tabular-nums text-ink">{l.qty}</span>
                    <Stepper
                      onClick={() => cart.setQty(l.serviceId, l.qty + 1)}
                      icon={<Plus className="size-3.5" />}
                    />
                  </div>
                  <span className="text-sm font-semibold text-ink tnum">{formatCurrency(l.price * l.qty)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}

        {cart.lines.length > 0 && (
          <div>
            {showDiscount ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-ink-soft">Giảm giá</span>
                <div className="flex-1">
                  <MoneyInput value={cart.discount} onChange={cart.setDiscount} />
                </div>
                <button
                  onClick={() => {
                    cart.setDiscount(0);
                    setShowDiscount(false);
                  }}
                  className="text-ink-faint hover:text-danger"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDiscount(true)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-copper-deep hover:underline"
              >
                <Tag className="size-3.5" /> Thêm giảm giá
              </button>
            )}
          </div>
        )}
      </div>

      {/* Thanh toán */}
      <div className="space-y-3 border-t border-line px-5 py-4">
        <Segmented
          value={cart.paymentMethod}
          onChange={cart.setPaymentMethod}
          options={[
            { value: "cash", label: "Tiền mặt", icon: <Banknote className="size-4" /> },
            { value: "transfer", label: "Chuyển khoản", icon: <CreditCard className="size-4" /> },
          ]}
        />

        {cart.paymentMethod === "transfer" && (
          <div className="rounded-xl border border-line bg-paper-2/40 px-3.5 py-2.5">
            <Switch
              checked={cart.transferVerified}
              onChange={cart.setTransferVerified}
              label="Đã nhận chuyển khoản"
              description="Tick khi đã kiểm tra tài khoản"
            />
          </div>
        )}

        {isCash && cart.lines.length > 0 && (
          <div className="space-y-2.5 rounded-xl border border-line bg-paper-2/40 p-3">
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => cart.setCashReceived(amt)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-xs font-medium tabular-nums transition-colors",
                    cart.cashReceived === amt
                      ? "border-copper bg-copper-soft text-copper-deep"
                      : "border-line bg-paper text-ink-soft hover:border-copper/40",
                  )}
                >
                  {amt === total ? "Đủ tiền" : formatNumber(amt)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-sm text-ink-soft">Khách đưa</span>
              <div className="flex-1">
                <MoneyInput value={cart.cashReceived} onChange={cart.setCashReceived} />
              </div>
            </div>
            {hasReceived && (
              <div className="flex items-center justify-between border-t border-line pt-2.5">
                <span className="text-sm text-ink-soft">
                  {cart.cashReceived >= total ? "Tiền thối lại" : "Còn thiếu"}
                </span>
                <span
                  className={cn(
                    "font-display text-lg font-medium tnum",
                    cart.cashReceived >= total ? "text-success" : "text-danger",
                  )}
                >
                  {cart.cashReceived >= total
                    ? formatCurrency(change)
                    : formatCurrency(total - cart.cashReceived)}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          {cart.discount > 0 && (
            <>
              <Line label="Tạm tính" value={formatCurrency(subtotal)} muted />
              <Line label="Giảm giá" value={`− ${formatCurrency(cart.discount)}`} muted />
            </>
          )}
          <div className="flex items-end justify-between">
            <span className="text-sm font-medium text-ink-soft">Tổng cộng</span>
            <span className="font-display text-2xl font-medium text-ink tnum">{formatCurrency(total)}</span>
          </div>
        </div>

        <Button onClick={checkout} disabled={!canCheckout} loading={create.isPending} size="lg" className="w-full">
          Thanh toán {total > 0 && `· ${formatCurrency(total)}`}
        </Button>
      </div>
    </div>
  );
}

function Stepper({ onClick, icon }: { onClick: () => void; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex size-7 items-center justify-center rounded-lg border border-line bg-paper text-ink-soft transition-colors hover:border-copper hover:text-copper-deep active:scale-90"
    >
      {icon}
    </button>
  );
}

function Line({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={cn(muted ? "text-ink-muted" : "text-ink-soft")}>{label}</span>
      <span className={cn("tabular-nums", muted ? "text-ink-muted" : "text-ink")}>{value}</span>
    </div>
  );
}
