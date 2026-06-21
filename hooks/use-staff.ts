"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { TABLE } from "@/lib/tables";
import type { Staff, StaffRole } from "@/lib/types/db";

const sb = () => getSupabaseBrowserClient();

export interface StaffInput {
  id?: string;
  name: string;
  phone: string | null;
  role: StaffRole;
  commission_rate: number;
  color: string | null;
  active: boolean;
}

export function useStaff(activeOnly = false) {
  return useQuery({
    queryKey: ["staff", { activeOnly }],
    queryFn: async (): Promise<Staff[]> => {
      let query = sb().from(TABLE.staff).select("*").order("created_at", { ascending: true });
      if (activeOnly) query = query.eq("active", true);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Hồ sơ thợ gắn với tài khoản đang đăng nhập (cho màn Doanh thu cá nhân). */
export function useMyStaff() {
  return useQuery({
    queryKey: ["staff", "me"],
    queryFn: async (): Promise<Staff | null> => {
      const {
        data: { user },
      } = await sb().auth.getUser();
      if (!user) return null;
      const { data, error } = await sb().from(TABLE.staff).select("*").eq("user_id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: StaffInput) => {
      const payload = {
        name: input.name.trim(),
        phone: input.phone,
        role: input.role,
        commission_rate: input.commission_rate,
        color: input.color,
        active: input.active,
      };
      if (input.id) {
        const { error } = await sb().from(TABLE.staff).update(payload).eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await sb().from(TABLE.staff).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb().from(TABLE.staff).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
}
