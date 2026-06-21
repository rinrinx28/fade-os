"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  stagger?: number;
  y?: number;
  delay?: number;
  /** Khoá để re-chạy animation khi nội dung đổi (vd: chuyển tab). */
  trigger?: string | number;
}

/** Hiện dần các con trực tiếp với hiệu ứng so le. */
export function Reveal({
  children,
  className,
  stagger = 0.06,
  y = 14,
  delay = 0,
  trigger,
  ...props
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = Array.from(el.children);
    if (targets.length === 0) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, y },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger, delay, clearProps: "opacity,transform" },
      );
    }, el);
    return () => ctx.revert();
  }, [stagger, y, delay, trigger]);

  return (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  );
}
