"use client";

import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { TABLE } from "@/lib/tables";
import type { Member } from "@/lib/types/db";

/** Danh sách tài khoản (owner đọc được tất cả qua RLS). */
export function useMembers() {
  return useQuery({
    queryKey: ["members"],
    queryFn: async (): Promise<Member[]> => {
      const { data, error } = await getSupabaseBrowserClient().from(TABLE.members).select("*");
      if (error) throw error;
      return data ?? [];
    },
  });
}
