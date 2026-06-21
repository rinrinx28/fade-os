"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { TABLE } from "@/lib/tables";
import type { PaymentMethod, TransactionWithItems } from "@/lib/types/db";

const sb = () => getSupabaseBrowserClient();

const SELECT_WITH_ITEMS =
  `*, items:${TABLE.transactionItems}(*), staff:${TABLE.staff}(id,name,color)`;

export interface NewTxnItem {
  service_id: string | null;
  staff_id: string | null;
  name: string;
  price: number;
  qty: number;
}

export interface CreateTransactionInput {
  shift_id: string | null;
  staff_id: string | null;
  customer_name: string | null;
  payment_method: PaymentMethod;
  transfer_verified: boolean;
  cash_received: number | null;
  subtotal: number;
  discount: number;
  total: number;
  note: string | null;
  items: NewTxnItem[];
}

interface TxnFilters {
  from?: string;
  to?: string;
  limit?: number;
}

export function useTransactions(filters: TxnFilters = {}) {
  const { from, to, limit = 100 } = filters;
  return useQuery({
    queryKey: ["transactions", { from, to, limit }],
    queryFn: async (): Promise<TransactionWithItems[]> => {
      let query = sb()
        .from(TABLE.transactions)
        .select(SELECT_WITH_ITEMS)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (from) query = query.gte("created_at", from);
      if (to) query = query.lte("created_at", to);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as TransactionWithItems[];
    },
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTransactionInput) => {
      const client = sb();
      const { data: txn, error } = await client
        .from(TABLE.transactions)
        .insert({
          shift_id: input.shift_id,
          staff_id: input.staff_id,
          customer_name: input.customer_name,
          payment_method: input.payment_method,
          transfer_verified: input.transfer_verified,
          cash_received: input.cash_received,
          subtotal: input.subtotal,
          discount: input.discount,
          total: input.total,
          note: input.note,
        })
        .select()
        .single();
      if (error) throw error;

      if (input.items.length > 0) {
        const rows = input.items.map((it) => ({ transaction_id: txn.id, ...it }));
        const { error: itemsError } = await client.from(TABLE.transactionItems).insert(rows);
        if (itemsError) throw itemsError;
      }
      return txn;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["shift"] });
    },
  });
}

export function useVoidTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb().from(TABLE.transactions).update({ status: "void" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["shift"] });
    },
  });
}

export function useVerifyTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; verified: boolean }) => {
      const { error } = await sb()
        .from(TABLE.transactions)
        .update({ transfer_verified: input.verified })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });
}
