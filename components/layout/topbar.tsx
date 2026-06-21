"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Menu, LogOut, ChevronDown, CalendarClock, CircleDot, Settings } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useCurrentShift } from "@/hooks/use-shift";
import { formatTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { cn, initials } from "@/lib/utils";

function pageTitle(pathname: string): string {
  if (pathname === "/profile" || pathname.startsWith("/profile/")) return "Hồ sơ";
  const match = NAV_ITEMS.filter((i) => i.href !== "/")
    .sort((a, b) => b.href.length - a.href.length)
    .find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));
  if (match) return match.label;
  return "Tổng quan";
}

function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);
  if (!now) return <span className="h-5 w-28" />;
  return (
    <span className="hidden text-right text-sm leading-tight text-ink-soft sm:block">
      <span className="font-display text-base font-medium text-ink tnum">{format(now, "HH:mm")}</span>
      <span className="ml-2 text-ink-muted">{format(now, "EEEE, dd/MM", { locale: vi })}</span>
    </span>
  );
}

function ShiftStatus() {
  const { data: shift } = useCurrentShift();
  if (shift) {
    return (
      <Link href="/shifts">
        <Badge tone="success" dot className="cursor-pointer">
          Đang mở ca · {formatTime(shift.opened_at)}
        </Badge>
      </Link>
    );
  }
  return (
    <Link href="/shifts">
      <Badge tone="warning" className="cursor-pointer">
        <CircleDot className="size-3" /> Chưa mở ca
      </Badge>
    </Link>
  );
}

function UserMenu({ email }: { email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signing, setSigning] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  async function signOut() {
    setSigning(true);
    await getSupabaseBrowserClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-line bg-paper py-1.5 pl-1.5 pr-2.5 transition-colors hover:border-line-strong"
      >
        <span className="flex size-7 items-center justify-center rounded-lg bg-linear-to-br from-copper to-copper-deep text-[0.7rem] font-semibold text-white">
          {initials(email)}
        </span>
        <ChevronDown className={cn("size-4 text-ink-muted transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 w-60 overflow-hidden rounded-2xl border border-line bg-paper shadow-(--shadow-lg)">
          <div className="border-b border-line px-4 py-3">
            <p className="text-xs text-ink-muted">Đăng nhập với</p>
            <p className="truncate text-sm font-medium text-ink">{email}</p>
          </div>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 border-b border-line px-4 py-3 text-sm font-medium text-ink-soft transition-colors hover:bg-paper-2 hover:text-ink"
          >
            <Settings className="size-4" />
            Hồ sơ & mật khẩu
          </Link>
          <button
            onClick={signOut}
            disabled={signing}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-medium text-danger transition-colors hover:bg-danger-soft/50 disabled:opacity-50"
          >
            <LogOut className="size-4" />
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}

export function Topbar({ email, onMenu }: { email: string; onMenu: () => void }) {
  const pathname = usePathname();
  return (
    <header className="glass sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line px-4 sm:px-6">
      <button
        onClick={onMenu}
        className="rounded-xl p-2 text-ink-soft transition-colors hover:bg-paper-2 lg:hidden"
        aria-label="Mở menu"
      >
        <Menu className="size-5" />
      </button>

      <div className="flex items-center gap-2">
        <CalendarClock className="hidden size-4 text-copper sm:block" />
        <h1 className="font-display text-xl font-medium tracking-tight text-ink">{pageTitle(pathname)}</h1>
      </div>

      <div className="ml-auto flex items-center gap-3 sm:gap-4">
        <ShiftStatus />
        <Clock />
        <UserMenu email={email} />
      </div>
    </header>
  );
}
