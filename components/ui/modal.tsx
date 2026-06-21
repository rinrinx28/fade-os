"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const SIZES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-xl",
  xl: "max-w-3xl",
};

export function Modal({ open, onClose, title, description, children, footer, size = "md" }: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const animateOut = useCallback(() => {
    const tl = gsap.timeline({ onComplete: () => setVisible(false) });
    tl.to(panelRef.current, { y: 12, scale: 0.98, opacity: 0, duration: 0.2, ease: "power2.in" }, 0);
    tl.to(backdropRef.current, { opacity: 0, duration: 0.22 }, 0);
  }, []);

  // Mở/đóng theo prop `open`
  useEffect(() => {
    if (open) setVisible(true);
    else if (visible) animateOut();
  }, [open, visible, animateOut]);

  // Animate vào khi đã render
  useEffect(() => {
    if (!visible || !open) return;
    const ctx = gsap.context(() => {
      gsap.set(backdropRef.current, { opacity: 0 });
      gsap.set(panelRef.current, { y: 16, scale: 0.96, opacity: 0 });
      gsap.to(backdropRef.current, { opacity: 1, duration: 0.28, ease: "power2.out" });
      gsap.to(panelRef.current, {
        y: 0,
        scale: 1,
        opacity: 1,
        duration: 0.42,
        ease: "back.out(1.5)",
        delay: 0.04,
      });
    });
    return () => ctx.revert();
  }, [visible, open]);

  // Khoá scroll + ESC
  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [visible, onClose]);

  if (!mounted || !visible) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-overlay backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10 m-3 flex max-h-[92dvh] w-full flex-col overflow-hidden",
          "rounded-t-3xl border border-line bg-paper shadow-(--shadow-lg) sm:rounded-3xl",
          SIZES[size],
        )}
      >
        {(title || description) && (
          <header className="flex items-start justify-between gap-4 border-b border-line px-6 pb-4 pt-5">
            <div>
              {title && <h2 className="font-display text-xl font-medium text-ink">{title}</h2>}
              {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="-mr-1.5 -mt-1 rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-paper-2 hover:text-ink"
              aria-label="Đóng"
            >
              <X className="size-5" />
            </button>
          </header>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <footer className="flex items-center justify-end gap-3 border-t border-line bg-paper-2/40 px-6 py-4">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
