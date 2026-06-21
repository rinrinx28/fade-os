"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface AnimatedNumberProps {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}

/** Số đếm mượt bằng GSAP khi giá trị đổi. */
export function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toLocaleString("vi-VN"),
  duration = 1,
  className,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(0);
  const fmt = useRef(format);
  fmt.current = format;

  useEffect(() => {
    const obj = { v: prev.current };
    const tween = gsap.to(obj, {
      v: value,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        if (ref.current) ref.current.textContent = fmt.current(obj.v);
      },
    });
    prev.current = value;
    return () => {
      tween.kill();
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {fmt.current(value)}
    </span>
  );
}
