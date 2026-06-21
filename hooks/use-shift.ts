"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { TABLE } from "@/lib/tables";
import type { CashMovement, Shift, Transaction } from "@/lib/types/db";

const sb = () => getSupabaseBrowserClient();

/** Ca đang mở (nếu có). */
export function useCurrentShift() {
  return useQuery({
    queryKey: ["shift", "current"],
    queryFn: async (): Promise<Shift | null> => {
      const { data, error } = await sb()
        .from(TABLE.shifts)
        .select("*")
        .eq("status", "open")
        .order("opened_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchInterval: 60_000,
  });
}

/** Lịch sử ca đã đóng + ca hiện tại. */
export function useShifts(limit = 30) {
  return useQuery({
    queryKey: ["shift", "list", limit],
    queryFn: async (): Promise<Shift[]> => {
      const { data, error } = await sb()
        .from(TABLE.shifts)
        .select("*")
        .order("opened_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Giao dịch + thu/chi của một ca — phục vụ đối soát. */
export function useShiftLedger(shiftId: string | null) {
  return useQuery({
    queryKey: ["shift", "ledger", shiftId],
    enabled: !!shiftId,
    queryFn: async () => {
      const client = sb();
      const [txns, moves] = await Promise.all([
        client
          .from(TABLE.transactions)
          .select("*")
          .eq("shift_id", shiftId!)
          .order("created_at", { ascending: false }),
        client
          .from(TABLE.cashMovements)
          .select("*")
          .eq("shift_id", shiftId!)
          .order("created_at", { ascending: false }),
      ]);
      if (txns.error) throw txns.error;
      if (moves.error) throw moves.error;
      return {
        transactions: (txns.data ?? []) as Transaction[],
        movements: (moves.data ?? []) as CashMovement[],
      };
    },
  });
}

export function useOpenShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { openingFund: number; openedBy?: string | null; note?: string | null }) => {
      const { data, error } = await sb()
        .from(TABLE.shifts)
        .insert({
          opening_fund: input.openingFund,
          opened_by: input.openedBy ?? null,
          note: input.note ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shift"] }),
  });
}

export function useCloseShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { shiftId: string; closingCounted: number; closedBy?: string | null; note?: string | null }) => {
      const { data, error } = await sb()
        .from(TABLE.shifts)
        .update({
          status: "closed",
          closed_at: new Date().toISOString(),
          closing_counted: input.closingCounted,
          closed_by: input.closedBy ?? null,
          note: input.note ?? null,
        })
        .eq("id", input.shiftId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shift"] }),
  });
}

export function useAddCashMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { shiftId: string; direction: "in" | "out"; amount: number; reason?: string }) => {
      const { error } = await sb().from(TABLE.cashMovements).insert({
        shift_id: input.shiftId,
        direction: input.direction,
        amount: input.amount,
        reason: input.reason ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shift"] }),
  });
}
