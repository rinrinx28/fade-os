"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Check, Banknote, CreditCard } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PAYMENT_LABELS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import type { CheckoutSummary } from "./cart-panel";

export function CheckoutSuccess({
  summary,
  onClose,
}: {
  summary: CheckoutSummary | null;
  onClose: () => void;
}) {
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!summary) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ringRef.current,
        { scale: 0.3, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.8)", delay: 0.12 },
      );
    });
    return () => ctx.revert();
  }, [summary]);

  return (
    <Modal open={!!summary} onClose={onClose} size="sm">
      {summary && (
        <div className="flex flex-col items-center py-4 text-center">
          <div
            ref={ringRef}
            className="flex size-20 items-center justify-center rounded-full bg-success-soft text-success"
          >
            <Check className="size-10" strokeWidth={2.5} />
          </div>
          <h2 className="mt-5 font-display text-2xl font-medium text-ink">Thanh toán thành công</h2>
          <Badge tone="copper" className="mt-2">
            {summary.code}
          </Badge>

          <p className="mt-5 font-display text-4xl font-medium tracking-tight text-ink tnum">
            {formatCurrency(summary.total)}
          </p>

          <div className="mt-3 flex items-center gap-2 text-sm text-ink-muted">
            {summary.paymentMethod === "cash" ? (
              <Banknote className="size-4" />
            ) : (
              <CreditCard className="size-4" />
            )}
            {PAYMENT_LABELS[summary.paymentMethod]}
            {summary.customerName && <span>· {summary.customerName}</span>}
            <span>· {summary.count} dịch vụ</span>
          </div>

          {summary.change != null && (
            <div className="mt-5 w-full rounded-xl border border-line bg-paper-2/40 p-3.5 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-muted">Khách đưa</span>
                <span className="font-medium text-ink tnum">{formatCurrency(summary.cashReceived ?? 0)}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between border-t border-line pt-1.5">
                <span className="text-ink-soft">Tiền thối lại</span>
                <span className="font-display text-lg font-semibold text-success tnum">
                  {formatCurrency(summary.change)}
                </span>
              </div>
            </div>
          )}

          <Button onClick={onClose} size="lg" className="mt-6 w-full">
            Hoá đơn mới
          </Button>
        </div>
      )}
    </Modal>
  );
}
