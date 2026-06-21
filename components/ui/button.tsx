"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type Size = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-copper text-white shadow-(--shadow-copper) hover:bg-copper-deep active:bg-copper-deep",
  secondary:
    "bg-paper text-ink border border-line-strong hover:border-copper hover:text-copper-deep",
  ghost: "text-ink-soft hover:bg-paper-2 hover:text-ink",
  danger: "bg-danger text-white hover:brightness-95",
  subtle: "bg-copper-soft text-copper-deep hover:bg-copper-tint",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5 rounded-lg",
  md: "h-11 px-5 text-[0.95rem] gap-2 rounded-xl",
  lg: "h-13 px-7 text-base gap-2.5 rounded-xl",
  icon: "h-11 w-11 rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium tracking-tight",
        "transition-[transform,background-color,border-color,color,box-shadow] duration-(--dur-fast)",
        "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
        "cursor-pointer select-none whitespace-nowrap",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
});
