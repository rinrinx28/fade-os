import type { ShiftReconciliation } from "@/lib/shift";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

function Row({
  label,
  value,
  sign,
  strong,
}: {
  label: string;
  value: number;
  sign?: "plus" | "minus";
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={cn("text-sm", strong ? "font-medium text-ink" : "text-ink-soft")}>{label}</span>
      <span
        className={cn(
          "tabular-nums",
          strong ? "font-display text-lg font-medium text-ink" : "text-sm font-medium",
          sign === "plus" && "text-success",
          sign === "minus" && "text-danger",
          !sign && !strong && "text-ink",
        )}
      >
        {sign === "plus" ? "+" : sign === "minus" ? "−" : ""}
        {formatCurrency(Math.abs(value))}
      </span>
    </div>
  );
}

/** Bảng phân tích quỹ tiền mặt dự kiến của một ca. */
export function ReconciliationRows({ rec }: { rec: ShiftReconciliation }) {
  return (
    <div className="space-y-3">
      <Row label="Quỹ đầu ca" value={rec.openingFund} />
      <Row label="Bán tiền mặt" value={rec.cashSales} sign="plus" />
      {rec.cashIn > 0 && <Row label="Thu thêm vào quỹ" value={rec.cashIn} sign="plus" />}
      {rec.cashOut > 0 && <Row label="Chi từ quỹ" value={rec.cashOut} sign="minus" />}
      <div className="border-t border-line pt-3">
        <Row label="Tiền mặt dự kiến trong két" value={rec.expectedCash} strong />
      </div>
    </div>
  );
}

/** Hiển thị chênh lệch khi đối soát (đếm thực tế so với dự kiến). */
export function DifferenceBadge({ difference }: { difference: number }) {
  if (difference === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-success-soft px-3 py-1 text-sm font-semibold text-success">
        Khớp quỹ ✓
      </span>
    );
  }
  const surplus = difference > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold",
        surplus ? "bg-info-soft text-info" : "bg-danger-soft text-danger",
      )}
    >
      {surplus ? "Thừa" : "Thiếu"} {formatCurrency(Math.abs(difference))}
    </span>
  );
}
