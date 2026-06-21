"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { PageTransition } from "./page-transition";
import { cn } from "@/lib/utils";
import type { AccessRole } from "@/lib/types/db";

export function AppShell({
  userEmail,
  role,
  children,
}: {
  userEmail: string;
  role: AccessRole;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative min-h-dvh">
      {/* Sidebar cố định (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[16.5rem] border-r border-line lg:block">
        <Sidebar role={role} />
      </aside>

      {/* Drawer (mobile) */}
      <div className={cn("fixed inset-0 z-40 lg:hidden", mobileOpen ? "pointer-events-auto" : "pointer-events-none")}>
        <div
          className={cn(
            "absolute inset-0 bg-overlay backdrop-blur-[2px] transition-opacity duration-300",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 w-72 border-r border-line bg-paper shadow-(--shadow-lg) transition-transform duration-300 ease-(--ease-out-expo)",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <Sidebar role={role} onNavigate={() => setMobileOpen(false)} />
        </aside>
      </div>

      {/* Nội dung */}
      <div className="flex min-h-dvh flex-col lg:pl-[16.5rem]">
        <Topbar email={userEmail} onMenu={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
}
