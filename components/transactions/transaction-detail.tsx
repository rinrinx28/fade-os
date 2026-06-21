"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Banknote, CreditCard, Ban, ShieldCheck } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useVoidTransaction, useVerifyTransfer } from "@/hooks/use-transactions";
import { PAYMENT_LABELS } from "@/lib/constants";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { TransactionWithItems } from "@/lib/types/db";

export function TransactionDetail({
  txn,
  onClose,
}: {
  txn: TransactionWithItems | null;
  onClose: () => void;
}) {
  const voidTxn = useVoidTransaction();
  const verify = useVerifyTransfer();
  const [confirming, setConfirming] = useState(false);

  async function handleVoid() {
    if (!txn) return;
    try {
      await voidTxn.mutateAsync(txn.id);
      toast.success("Đã huỷ hoá đơn.");
      setConfirming(false);
      onClose();
    } catch {
      toast.error("Không thể huỷ hoá đơn.");
    }
  }

  async function toggleVerify(value: boolean) {
    if (!txn) return;
    try {
      await verify.mutateAsync({ id: txn.id, verified: value });
    } catch {
      toast.error("Không thể cập nhật.");
    }
  }

  return (
    <Modal
      open={!!txn}
      onClose={() => {
        setConfirming(false);
        onClose();
      }}
      title={txn?.code ?? "Hoá đơn"}
      description={txn ? formatDateTime(txn.created_at) : ""}
    >
      {txn && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {txn.status === "void" ? (
              <Badge tone="danger">Đã huỷ</Badge>
            ) : (
              <Badge tone="success" dot>
                Hoàn tất
              </Badge>
            )}
            <Badge tone={txn.payment_method === "cash" ? "copper" : "info"}>
              {txn.payment_method === "cash" ? (
                <Banknote className="size-3" />
              ) : (
                <CreditCard className="size-3" />
              )}
              {PAYMENT_LABELS[txn.payment_method]}
            </Badge>
            {txn.staff && (
              <span className="inline-flex items-center gap-1.5 text-sm text-ink-soft">
                <Avatar name={txn.staff.name} color={txn.staff.color} size="sm" />
                {txn.staff.name}
              </span>
            )}
          </div>

          {txn.customer_name && (
            <p className="text-sm text-ink-soft">
              Khách hàng: <span className="font-medium text-ink">{txn.customer_name}</span>
            </p>
          )}

          <ul className="divide-y divide-line rounded-xl border border-line">
            {txn.items.map((it) => (
              <li key={it.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="text-sm text-ink">
                  {it.name}
                  {it.qty > 1 && <span className="text-ink-muted"> × {it.qty}</span>}
                </span>
                <span className="text-sm font-medium text-ink tnum">{formatCurrency(it.price * it.qty)}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-1.5">
            {txn.discount > 0 && (
              <>
                <Row label="Tạm tính" value={formatCurrency(txn.subtotal)} muted />
                <Row label="Giảm giá" value={`− ${formatCurrency(txn.discount)}`} muted />
              </>
            )}
            <div className="flex items-center justify-between border-t border-line pt-2">
              <span className="text-sm font-medium text-ink-soft">Tổng cộng</span>
              <span className="font-display text-xl font-medium text-ink tnum">{formatCurrency(txn.total)}</span>
            </div>
          </div>

          {txn.payment_method === "cash" && txn.cash_received != null && (
            <div className="space-y-1.5 rounded-xl border border-line bg-paper-2/40 p-3">
              <Row label="Khách đưa" value={formatCurrency(txn.cash_received)} />
              <Row label="Tiền thối lại" value={formatCurrency(Math.max(0, txn.cash_received - txn.total))} />
            </div>
          )}

          {txn.payment_method === "transfer" && txn.status === "paid" && (
            <div className="rounded-xl border border-line bg-paper-2/40 px-4 py-3">
              <Switch
                checked={txn.transfer_verified}
                onChange={toggleVerify}
                label="Đã nhận chuyển khoản"
                description="Xác nhận đã kiểm tra tài khoản nhận tiền"
              />
            </div>
          )}

          {txn.status === "paid" && (
            <div className="border-t border-line pt-4">
              {confirming ? (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-danger-soft px-4 py-3">
                  <span className="text-sm font-medium text-danger">Xác nhận huỷ hoá đơn này?</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                      Không
                    </Button>
                    <Button variant="danger" size="sm" onClick={handleVoid} loading={voidTxn.isPending}>
                      Huỷ HĐ
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirming(true)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-danger hover:underline"
                >
                  <Ban className="size-4" /> Huỷ hoá đơn
                </button>
              )}
            </div>
          )}

          {txn.payment_method === "transfer" && txn.transfer_verified && txn.status === "paid" && (
            <p className="inline-flex items-center gap-1.5 text-xs text-success">
              <ShieldCheck className="size-3.5" /> Đã xác nhận nhận tiền chuyển khoản
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={muted ? "text-ink-muted" : "text-ink-soft"}>{label}</span>
      <span className={muted ? "text-ink-muted tnum" : "text-ink tnum"}>{value}</span>
    </div>
  );
}
