import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/db";

/**
 * Supabase client với service_role — CHỈ dùng phía server (server actions).
 * Bỏ qua RLS, có quyền admin (tạo user…). Tuyệt đối không import vào client.
 */
export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY (server).");
  }
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
