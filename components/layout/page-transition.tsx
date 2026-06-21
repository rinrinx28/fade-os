"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";

/** Hiệu ứng chuyển trang nhẹ mỗi khi đổi route. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", clearProps: "transform" },
      );
    }, el);
    return () => ctx.revert();
  }, [pathname]);

  return (
    <div ref={ref} key={pathname}>
      {children}
    </div>
  );
}
