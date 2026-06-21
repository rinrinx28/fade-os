"use client";

import { createContext, useContext } from "react";
import type { AccessRole } from "@/lib/types/db";

export interface SessionInfo {
  role: AccessRole;
  email: string;
  shopId: string;
  shopName: string;
  /** id hồ sơ thợ gắn với tài khoản này (null nếu chưa gắn). */
  staffId: string | null;
  staffName: string | null;
  staffColor: string | null;
}

const SessionContext = createContext<SessionInfo | null>(null);

export function SessionProvider({ value, children }: { value: SessionInfo; children: React.ReactNode }) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionInfo {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession phải dùng bên trong SessionProvider");
  return ctx;
}

export function useIsOwner(): boolean {
  return useSession().role === "owner";
}
