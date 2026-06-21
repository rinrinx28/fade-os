import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import type { Database } from "@/lib/types/db";

/** Supabase client cho Server Components / Route Handlers. */
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.supabaseUrl || "https://placeholder.supabase.co",
    env.supabaseAnonKey || "placeholder-anon-key",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll được gọi từ Server Component — bỏ qua, middleware sẽ làm mới session.
          }
        },
      },
    },
  );
}
