"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { TABLE } from "@/lib/tables";
import type { Service } from "@/lib/types/db";

const sb = () => getSupabaseBrowserClient();

export interface ServiceInput {
  id?: string;
  name: string;
  category: string;
  price: number;
  duration_min: number;
  active: boolean;
  sort: number;
}

export function useServices(activeOnly = false) {
  return useQuery({
    queryKey: ["services", { activeOnly }],
    queryFn: async (): Promise<Service[]> => {
      let query = sb()
        .from(TABLE.services)
        .select("*")
        .order("sort", { ascending: true })
        .order("created_at", { ascending: true });
      if (activeOnly) query = query.eq("active", true);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ServiceInput) => {
      const payload = {
        name: input.name.trim(),
        category: input.category,
        price: input.price,
        duration_min: input.duration_min,
        active: input.active,
        sort: input.sort,
      };
      if (input.id) {
        const { error } = await sb().from(TABLE.services).update(payload).eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await sb().from(TABLE.services).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services"] }),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb().from(TABLE.services).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services"] }),
  });
}
