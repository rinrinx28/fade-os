"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured, env } from "@/lib/env";
import { viAuthError } from "@/lib/auth-errors";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Logo } from "@/components/brand/logo";

type Stage = "idle" | "auth" | "gate";

const STAGE_LABEL: Record<Exclude<Stage, "idle">, string> = {
  auth: "Đang đăng nhập…",
  gate: "Đang kiểm tra quyền truy cập…",
};

export default function LoginPage() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);

  const loading = stage !== "idle";

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".lg-brand > *", { y: 24, opacity: 0, duration: 0.7, stagger: 0.08 })
        .from(".lg-arc", { scale: 0.7, opacity: 0, duration: 1.1, ease: "power2.out" }, 0.1)
        .from(".lg-form > *", { y: 18, opacity: 0, duration: 0.6, stagger: 0.07 }, 0.25);
    }, rootRef);
    return () => ctx.revert();
  }, []);

  function fail(message: string) {
    setError(message);
    // Rung nhẹ form để báo lỗi rõ ràng hơn toast.
    if (formRef.current) {
      gsap.fromTo(
        formRef.current,
        { x: -8 },
        { x: 0, duration: 0.5, ease: "elastic.out(1, 0.35)" },
      );
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isSupabaseConfigured) {
      fail("Chưa cấu hình Supabase. Kiểm tra file .env.local.");
      return;
    }

    const sb = getSupabaseBrowserClient();

    // Lớp 1 — Xác thực email/mật khẩu với Supabase Auth.
    setStage("auth");
    const { data: auth, error: authError } = await sb.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (authError) {
      setStage("idle");
      fail(viAuthError(authError.message));
      return;
    }

    // Lớp 2 — Cổng "bảo table": chỉ thành viên còn hiệu lực mới được vào tiệm.
    setStage("gate");
    const { data: member, error: gateError } = await sb
      .from("fade_os_members")
      .select("user_id, active")
      .eq("user_id", auth.user.id)
      .eq("active", true)
      .maybeSingle();

    if (gateError) {
      await sb.auth.signOut();
      setStage("idle");
      fail("Không kiểm tra được quyền truy cập. Vui lòng thử lại sau ít phút.");
      return;
    }
    if (!member?.active) {
      await sb.auth.signOut();
      setStage("idle");
      fail("Đăng nhập đúng, nhưng tài khoản chưa thuộc tiệm nào. Liên hệ chủ tiệm để được thêm vào.");
      return;
    }

    // Thành công — chuyển vào hệ thống (giữ stage để nút vẫn ở trạng thái loading).
    const next = new URLSearchParams(window.location.search).get("next") ?? "/";
    router.push(next);
    router.refresh();
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
            <Logo className="size-8" />
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
          <p className="text-sm text-ink-muted">
            © {new Date().getFullYear()} {env.shopName} · thiết kế bởi{" "}
            <a
              href="https://github.com/rinrinx28"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-copper-deep hover:underline"
            >
              Rinrinx28
            </a>
          </p>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center px-6 py-12">
        <form ref={formRef} onSubmit={handleSubmit} className="lg-form w-full max-w-sm" noValidate>
          <div className="mb-8 flex items-center gap-2.5 text-copper-deep lg:hidden">
            <Logo className="size-8" />
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="ban@tiem.com"
                required
                disabled={loading}
              />
            </Field>
            <Field label="Mật khẩu">
              <PasswordInput
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </Field>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2.5 rounded-xl border border-danger/20 bg-danger-soft px-3.5 py-3 text-sm text-danger"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" size="lg" loading={loading} className="mt-7 w-full">
            {stage === "idle" ? (
              <>
                Vào hệ thống
                <ArrowRight className="size-4" />
              </>
            ) : (
              STAGE_LABEL[stage]
            )}
          </Button>

          <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-ink-faint">
            <ShieldCheck className="size-3.5" />
            Chỉ thành viên của tiệm mới truy cập được.
          </p>

          <p className="mt-4 text-center text-sm text-ink-muted">
            Quên mật khẩu? Liên hệ <b className="text-ink-soft">chủ tiệm</b> để được cấp lại.
          </p>
        </form>
      </main>
    </div>
  );
}
