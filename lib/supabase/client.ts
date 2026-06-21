"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import type { Database } from "@/lib/types/db";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

/** Singleton Supabase client dùng trong client components. */
export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;
  browserClient = createBrowserClient<Database>(
    env.supabaseUrl || "https://placeholder.supabase.co",
    env.supabaseAnonKey || "placeholder-anon-key",
  );
  return browserClient;
}
