"use client";

import type { ReactNode } from "react";

import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: 0 | 1 | 2 | 3;
};

export function ScrollReveal({ children, className, delay = 0 }: ScrollRevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={cn(
        "vx-reveal",
        delay === 1 && "vx-reveal-delay-1",
        delay === 2 && "vx-reveal-delay-2",
        delay === 3 && "vx-reveal-delay-3",
        inView && "vx-in-view",
        className
      )}
    >
      {children}
    </div>
  );
}
