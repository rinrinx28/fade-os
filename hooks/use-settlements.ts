"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { TABLE } from "@/lib/tables";
import { employeeShare } from "@/lib/commission";
import type { Settlement, Transaction } from "@/lib/types/db";

const sb = () => getSupabaseBrowserClient();

type UnsettledTxn = Pick<Transaction, "id" | "total" | "created_at" | "staff_id">;

/** Danh sách phiếu kết toán (owner: tất cả/theo thợ; staff: của mình qua RLS). */
export function useSettlements(staffId?: string) {
  return useQuery({
    queryKey: ["settlements", staffId ?? "all"],
    queryFn: async (): Promise<Settlement[]> => {
      let query = sb().from(TABLE.settlements).select("*").order("created_at", { ascending: false });
      if (staffId) query = query.eq("staff_id", staffId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Hoá đơn đã thanh toán nhưng CHƯA kết toán của 1 thợ trong khoảng thời gian. */
export function useUnsettledTxns(staffId: string | null, fromISO: string, toISO: string) {
  return useQuery({
    queryKey: ["unsettled", staffId, fromISO, toISO],
    enabled: !!staffId,
    queryFn: async (): Promise<UnsettledTxn[]> => {
      const { data, error } = await sb()
        .from(TABLE.transactions)
        .select("id, total, created_at, staff_id")
        .eq("staff_id", staffId!)
        .eq("status", "paid")
        .is("settlement_id", null)
        .gte("created_at", fromISO)
        .lte("created_at", toISO)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as UnsettledTxn[];
    },
  });
}

export interface CreateSettlementInput {
  staffId: string;
  periodStart: string;
  periodEnd: string;
  rate: number;
  gross: number;
  txnIds: string[];
  settledBy?: string | null;
  note?: string | null;
}

export function useCreateSettlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSettlementInput) => {
      const client = sb();
      const { data: settlement, error } = await client
        .from(TABLE.settlements)
        .insert({
          staff_id: input.staffId,
          period_start: input.periodStart,
          period_end: input.periodEnd,
          gross_revenue: input.gross,
          rate: input.rate,
          employee_amount: employeeShare(input.gross, input.rate),
          txn_count: input.txnIds.length,
          status: "paid",
          paid_at: new Date().toISOString(),
          settled_by: input.settledBy ?? null,
          note: input.note ?? null,
        })
        .select()
        .single();
      if (error) throw error;

      if (input.txnIds.length > 0) {
        const { error: upErr } = await client
          .from(TABLE.transactions)
          .update({ settlement_id: settlement.id })
          .in("id", input.txnIds);
        if (upErr) throw upErr;
      }
      return settlement;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settlements"] });
      qc.invalidateQueries({ queryKey: ["unsettled"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
