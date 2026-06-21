"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScissorsLineDashed } from "lucide-react";
import { navForRole } from "@/lib/nav";
import { useSession } from "@/components/providers/session";
import { cn } from "@/lib/utils";
import type { AccessRole } from "@/lib/types/db";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ role, onNavigate }: { role: AccessRole; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { shopName } = useSession();
  const items = navForRole(role);

  return (
    <div className="flex h-full flex-col bg-paper-2/40">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-2.5 px-6 py-5 text-copper-deep"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-copper to-copper-deep text-white shadow-(--shadow-copper)">
          <ScissorsLineDashed className="size-5" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="font-display text-lg font-semibold leading-tight tracking-tight text-ink">FADE OS</span>
          <span className="truncate text-xs text-ink-muted">{shopName}</span>
        </span>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-(--dur-fast)",
                active ? "bg-paper text-ink shadow-(--shadow-sm)" : "text-ink-soft hover:bg-paper/60 hover:text-ink",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-1 -translate-x-1 -translate-y-1/2 rounded-full bg-copper" />
              )}
              <Icon
                className={cn(
                  "size-[1.15rem] shrink-0 transition-colors",
                  active ? "text-copper-deep" : "text-ink-muted group-hover:text-ink-soft",
                )}
              />
              <span className="flex flex-col">
                <span className="text-[0.92rem] font-medium leading-tight">{item.label}</span>
                {active && <span className="text-[0.7rem] leading-tight text-ink-muted">{item.hint}</span>}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-4">
        <p className="text-[0.7rem] leading-relaxed text-ink-faint">
          Phiên bản 1.0 · Vận hành tiệm tóc thông minh
        </p>
      </div>
    </div>
  );
}
