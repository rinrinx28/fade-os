"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useCurrentShift } from "@/hooks/use-shift";
import { useCart, cartSubtotal } from "@/stores/cart";
import { ServiceCatalog } from "@/components/pos/service-catalog";
import { CartPanel, type CheckoutSummary } from "@/components/pos/cart-panel";
import { CheckoutSuccess } from "@/components/pos/checkout-success";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Service } from "@/lib/types/db";

export default function PosPage() {
  const { data: shift } = useCurrentShift();
  const addService = useCart((s) => s.addService);
  const lines = useCart((s) => s.lines);
  const discount = useCart((s) => s.discount);

  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [mobileCart, setMobileCart] = useState(false);

  const subtotal = cartSubtotal(lines);
  const total = Math.max(0, subtotal - discount);
  const itemCount = lines.reduce((n, l) => n + l.qty, 0);

  function handlePick(s: Service) {
    addService(s);
  }

  function handleSuccess(s: CheckoutSummary) {
    setMobileCart(false);
    setSummary(s);
  }

  return (
    <div className="pb-20 lg:pb-0">
      <div className="grid gap-5 lg:grid-cols-[1fr_22rem] xl:grid-cols-[1fr_24rem]">
        <div className="min-w-0">
          <ServiceCatalog onPick={handlePick} />
        </div>

        {/* Giỏ hàng — desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-21 h-[calc(100dvh-7rem)] overflow-hidden rounded-2xl border border-line bg-paper shadow-(--shadow-sm)">
            <CartPanel shift={shift ?? null} onSuccess={handleSuccess} />
          </div>
        </aside>
      </div>

      {/* Thanh nổi — mobile */}
      <div className="glass fixed inset-x-0 bottom-0 z-30 border-t border-line p-3 lg:hidden">
        <button
          onClick={() => setMobileCart(true)}
          className="flex w-full items-center justify-between rounded-xl bg-ink px-4 py-3 text-cream"
        >
          <span className="inline-flex items-center gap-2 text-sm font-medium">
            <ShoppingBag className="size-4" />
            {itemCount > 0 ? `${itemCount} dịch vụ` : "Giỏ trống"}
          </span>
          <span className="font-display text-base font-medium tnum">
            {formatCurrency(total)} · Xem giỏ
          </span>
        </button>
      </div>

      {/* Giỏ hàng — mobile sheet */}
      <div className={cn("fixed inset-0 z-40 lg:hidden", mobileCart ? "pointer-events-auto" : "pointer-events-none")}>
        <div
          className={cn(
            "absolute inset-0 bg-overlay backdrop-blur-[2px] transition-opacity duration-300",
            mobileCart ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMobileCart(false)}
        />
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 h-[88dvh] overflow-hidden rounded-t-3xl border border-line bg-paper shadow-(--shadow-float) transition-transform duration-300 ease-(--ease-out-expo)",
            mobileCart ? "translate-y-0" : "translate-y-full",
          )}
        >
          <CartPanel shift={shift ?? null} onSuccess={handleSuccess} onClose={() => setMobileCart(false)} />
        </div>
      </div>

      <CheckoutSuccess summary={summary} onClose={() => setSummary(null)} />
    </div>
  );
}
