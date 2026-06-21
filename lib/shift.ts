import type { CashMovement, Transaction } from "@/lib/types/db";

export interface ShiftReconciliation {
  openingFund: number;
  cashSales: number;
  transferSales: number;
  cashIn: number;
  cashOut: number;
  /** Tiền mặt lý thuyết phải có trong két cuối ca. */
  expectedCash: number;
  totalSales: number;
  txnCount: number;
}

/**
 * Tính đối soát quỹ cho một ca.
 * expectedCash = quỹ đầu + bán tiền mặt + thu thêm − chi.
 * (Chuyển khoản không nằm trong két tiền mặt.)
 */
export function computeReconciliation(
  openingFund: number,
  transactions: ReadonlyArray<Pick<Transaction, "payment_method" | "total" | "status">>,
  movements: ReadonlyArray<Pick<CashMovement, "direction" | "amount">>,
): ShiftReconciliation {
  const paid = transactions.filter((t) => t.status === "paid");

  const cashSales = sum(paid.filter((t) => t.payment_method === "cash").map((t) => t.total));
  const transferSales = sum(paid.filter((t) => t.payment_method === "transfer").map((t) => t.total));
  const cashIn = sum(movements.filter((m) => m.direction === "in").map((m) => m.amount));
  const cashOut = sum(movements.filter((m) => m.direction === "out").map((m) => m.amount));

  return {
    openingFund,
    cashSales,
    transferSales,
    cashIn,
    cashOut,
    expectedCash: openingFund + cashSales + cashIn - cashOut,
    totalSales: cashSales + transferSales,
    txnCount: paid.length,
  };
}

function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + Number(v || 0), 0);
}
