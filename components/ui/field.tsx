"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const inputBase =
  "w-full rounded-xl border border-line bg-paper px-3.5 text-[0.95rem] text-ink " +
  "placeholder:text-ink-faint transition-colors duration-(--dur-fast) " +
  "focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/15 " +
  "disabled:opacity-50";

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Field({ label, hint, error, required, children, className }: FieldProps) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <span className="text-[0.8rem] font-medium text-ink-soft">
          {label}
          {required && <span className="text-copper"> *</span>}
        </span>
      )}
      {children}
      {error ? (
        <span className="text-xs text-danger">{error}</span>
      ) : hint ? (
        <span className="text-xs text-ink-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(inputBase, "h-11", className)} {...props} />;
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(inputBase, "min-h-20 py-2.5", className)} {...props} />;
});

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select ref={ref} className={cn(inputBase, "h-11 cursor-pointer pr-9", className)} {...props}>
      {children}
    </select>
  );
});
