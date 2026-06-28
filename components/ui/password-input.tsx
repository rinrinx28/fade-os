"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff, ArrowBigUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { inputBase } from "./field";

/**
 * Ô nhập mật khẩu với nút ẩn/hiện 👁 và cảnh báo Caps Lock.
 * Dùng chung cho login, đặt mật khẩu lần đầu và đổi mật khẩu.
 */
export const PasswordInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function PasswordInput({ className, onKeyUp, onKeyDown, onBlur, ...props }, ref) {
    const [visible, setVisible] = useState(false);
    const [capsOn, setCapsOn] = useState(false);

    function syncCaps(e: React.KeyboardEvent<HTMLInputElement>) {
      setCapsOn(e.getModifierState?.("CapsLock") ?? false);
    }

    return (
      <div className="relative">
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn(inputBase, "h-11 pr-11", capsOn && "pr-[4.75rem]", className)}
          onKeyUp={(e) => {
            syncCaps(e);
            onKeyUp?.(e);
          }}
          onKeyDown={(e) => {
            syncCaps(e);
            onKeyDown?.(e);
          }}
          onBlur={(e) => {
            setCapsOn(false);
            onBlur?.(e);
          }}
          {...props}
        />

        {capsOn && (
          <span
            className="pointer-events-none absolute right-10 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md bg-warning-soft text-warning"
            title="Caps Lock đang bật"
            aria-hidden
          >
            <ArrowBigUp className="size-3.5" />
          </span>
        )}

        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          aria-pressed={visible}
          tabIndex={-1}
          className={cn(
            "absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg",
            "text-ink-muted transition-colors duration-(--dur-fast)",
            "hover:bg-paper-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper/30",
          )}
        >
          {visible ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
        </button>
      </div>
    );
  },
);
