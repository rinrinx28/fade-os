/**
 * Truy cập biến môi trường công khai một cách an toàn.
 * Không ném lỗi lúc import để build vẫn chạy khi chưa cấu hình key —
 * thay vào đó `isSupabaseConfigured` cho phép UI hiển thị hướng dẫn.
 */
const PLACEHOLDER_URL = "https://placeholder.supabase.co";

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  shopName: process.env.NEXT_PUBLIC_SHOP_NAME ?? "FADE OS",
} as const;

export const isSupabaseConfigured: boolean =
  env.supabaseUrl.length > 0 &&
  env.supabaseUrl !== PLACEHOLDER_URL &&
  env.supabaseAnonKey.length > 0 &&
  env.supabaseAnonKey !== "placeholder-anon-key";
