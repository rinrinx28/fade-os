"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { toast } from "sonner";
import { ArrowRight, ScissorsLineDashed } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured, env } from "@/lib/env";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export default function LoginPage() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".lg-brand > *", { y: 24, opacity: 0, duration: 0.7, stagger: 0.08 })
        .from(".lg-arc", { scale: 0.7, opacity: 0, duration: 1.1, ease: "power2.out" }, 0.1)
        .from(".lg-form > *", { y: 18, opacity: 0, duration: 0.6, stagger: 0.07 }, 0.25);
    }, rootRef);
    return () => ctx.revert();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error("Chưa cấu hình Supabase. Kiểm tra file .env.local.");
      return;
    }
    setLoading(true);
    try {
      const sb = getSupabaseBrowserClient();
      const { data: auth, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message.includes("Invalid") ? "Email hoặc mật khẩu không đúng." : error.message);
        return;
      }

      // Cổng kiểm tra: chỉ thành viên còn hiệu lực mới được vào.
      const { data: member } = await sb
        .from("fade_os_members")
        .select("user_id, active")
        .eq("user_id", auth.user.id)
        .eq("active", true)
        .maybeSingle();
      if (!member || !member.active) {
        await sb.auth.signOut();
        toast.error("Tài khoản này không có quyền truy cập tiệm.");
        return;
      }

      const next = new URLSearchParams(window.location.search).get("next") ?? "/";
      router.push(next);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={rootRef} className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-[oklch(95.8%_0.018_70)] lg:block">
        <div className="lg-arc pointer-events-none absolute -right-40 top-1/2 size-[42rem] -translate-y-1/2 rounded-full border border-copper/20" />
        <div className="lg-arc pointer-events-none absolute -right-24 top-1/2 size-[30rem] -translate-y-1/2 rounded-full border border-copper/25" />
        <div className="lg-arc pointer-events-none absolute -right-8 top-1/2 size-[18rem] -translate-y-1/2 rounded-full bg-linear-to-br from-copper to-copper-deep opacity-90 blur-[1px]" />

        <div className="lg-brand relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-2.5 text-copper-deep">
            <ScissorsLineDashed className="size-6" />
            <span className="font-display text-lg font-semibold tracking-tight">FADE OS</span>
          </div>
          <div className="max-w-md">
            <h1 className="font-display text-5xl font-medium leading-[1.05] tracking-tight text-ink">
              Vận hành tiệm tóc, <span className="text-gradient-copper">gọn trong một màn hình.</span>
            </h1>
            <p className="mt-5 text-[1.05rem] leading-relaxed text-ink-soft">
              Mở ca, tính tiền, đối soát quỹ và theo dõi doanh thu — mọi thứ ở một nơi,
              mượt mà và rõ ràng.
            </p>
          </div>
          <p className="text-sm text-ink-muted">© {new Date().getFullYear()} {env.shopName}</p>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center px-6 py-12">
        <form onSubmit={handleSubmit} className="lg-form w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 text-copper-deep lg:hidden">
            <ScissorsLineDashed className="size-6" />
            <span className="font-display text-lg font-semibold tracking-tight">FADE OS</span>
          </div>
          <h2 className="font-display text-3xl font-medium tracking-tight text-ink">Đăng nhập</h2>
          <p className="mt-1.5 text-sm text-ink-muted">Chào mừng trở lại. Mở ca và bắt đầu ngày mới.</p>

          <div className="mt-8 flex flex-col gap-4">
            <Field label="Email">
              <Input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ban@tiem.com"
                required
              />
            </Field>
            <Field label="Mật khẩu">
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </Field>
          </div>

          <Button type="submit" size="lg" loading={loading} className="mt-7 w-full">
            Vào hệ thống
            <ArrowRight className="size-4" />
          </Button>

          <p className="mt-6 text-center text-sm text-ink-muted">
            Quên mật khẩu? Liên hệ <b className="text-ink-soft">chủ tiệm</b> để được cấp lại.
          </p>
        </form>
      </main>
    </div>
  );
}
