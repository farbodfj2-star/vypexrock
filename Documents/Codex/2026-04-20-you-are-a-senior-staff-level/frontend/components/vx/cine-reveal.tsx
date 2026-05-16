"use client";

import {
  createElement,
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

type RevealAs = "div" | "section" | "article" | "header" | "footer";

type RevealProps = {
  children: ReactNode;
  className?: string;
  variant?: "up" | "fade" | "left" | "right";
  /** Threshold ratio (0..1). Default 0.15 */
  threshold?: number;
  /** ms delay */
  delay?: number;
  as?: RevealAs;
  style?: CSSProperties;
};

const VARIANT_CLASS: Record<NonNullable<RevealProps["variant"]>, string> = {
  up: "vx-cine-reveal",
  fade: "vx-cine-reveal-fade",
  left: "vx-cine-reveal-x",
  right: "vx-cine-reveal-x-r",
};

export function Reveal({
  children,
  className,
  variant = "up",
  threshold = 0.15,
  delay = 0,
  as = "div",
  style,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof window === "undefined") return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      node.classList.add("in");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            window.setTimeout(() => node.classList.add("in"), delay);
            io.disconnect();
          }
        });
      },
      { threshold, rootMargin: "0px 0px -8% 0px" }
    );

    io.observe(node);
    return () => io.disconnect();
  }, [delay, threshold]);

  return createElement(
    as,
    {
      ref,
      className: cn(VARIANT_CLASS[variant], className),
      style,
    },
    children
  );
}

// -------------------------------------------------------- Stagger reveal

type StaggerProps = {
  children: ReactNode;
  className?: string;
  threshold?: number;
};

export function Stagger({ children, className, threshold = 0.18 }: StaggerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.classList.add("in");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            node.classList.add("in");
            io.disconnect();
          }
        });
      },
      { threshold, rootMargin: "0px 0px -6% 0px" }
    );

    io.observe(node);
    return () => io.disconnect();
  }, [threshold]);

  return (
    <div ref={ref} className={cn("vx-cine-stagger", className)}>
      {children}
    </div>
  );
}

// -------------------------------------------------------- Kinetic words

type KineticProps = {
  text: string;
  className?: string;
  highlight?: string;
  /** Optional slice of words to apply gradient highlight to. Inclusive bounds. */
  highlightRange?: [number, number];
};

export function Kinetic({ text, className, highlightRange }: KineticProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.classList.add("in");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            node.classList.add("in");
            io.disconnect();
          }
        });
      },
      { threshold: 0.25 }
    );

    io.observe(node);
    return () => io.disconnect();
  }, []);

  const words = text.split(" ");
  return (
    <span ref={ref} className={cn("vx-cine-kinetic", className)}>
      {words.map((w, i) => {
        const isHl =
          highlightRange && i >= highlightRange[0] && i <= highlightRange[1];
        return (
          <span
            key={`${w}-${i}`}
            className={cn(
              "vx-cine-kinetic-word",
              isHl && "vx-cine-headline-grad"
            )}
          >
            {w}
          </span>
        );
      })}
    </span>
  );
}
