"use client";

/**
 * Two cinematic interaction primitives, hand-rolled, zero deps:
 *
 *   <MagneticButton />  - the cursor pulls the button towards it within
 *                         a soft radius. Releases with a spring on leave.
 *
 *   <Tilt3D />          - card tilts in 3D following the cursor.
 *                         Also publishes glow-cursor coords as CSS vars.
 *
 * Both are SSR-safe. Both respect prefers-reduced-motion.
 */

import Link from "next/link";
import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

// ----------------------------------------------------------- Magnetic

type MagneticButtonProps = {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  /** Magnet pull strength in pixels. Default 14. */
  strength?: number;
  /** "primary" | "ghost" | "none" */
  variant?: "primary" | "ghost" | "none";
  ariaLabel?: string;
};

export const MagneticButton = forwardRef<HTMLElement, MagneticButtonProps>(function MagneticButton(
  { children, className, href, onClick, type = "button", strength = 14, variant = "ghost", ariaLabel },
  forwardedRef
) {
  const localRef = useRef<HTMLElement | null>(null);
  const setRef = useCallback(
    (node: HTMLElement | null) => {
      localRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) (forwardedRef as { current: HTMLElement | null }).current = node;
    },
    [forwardedRef]
  );

  useEffect(() => {
    const node = localRef.current;
    if (!node) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(hover: none)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let tx = 0, ty = 0;
    let cx = 0, cy = 0;

    const tick = () => {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      node.style.setProperty("--vx-magnet-x", `${cx.toFixed(2)}px`);
      node.style.setProperty("--vx-magnet-y", `${cy.toFixed(2)}px`);
      if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };

    const onMove = (e: MouseEvent) => {
      const rect = node.getBoundingClientRect();
      const r = Math.max(rect.width, rect.height);
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const dist = Math.hypot(dx, dy);
      const pull = Math.max(0, 1 - dist / (r * 1.2));
      tx = (dx / r) * strength * pull;
      ty = (dy / r) * strength * pull;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onLeave = () => {
      tx = 0; ty = 0;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    node.addEventListener("mousemove", onMove);
    node.addEventListener("mouseleave", onLeave);
    return () => {
      node.removeEventListener("mousemove", onMove);
      node.removeEventListener("mouseleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [strength]);

  const cls = cn(
    "vx-cine-btn",
    variant === "primary" && "vx-cine-btn-primary",
    variant === "ghost" && "vx-cine-btn-ghost",
    className
  );

  if (href) {
    // Internal Next link for in-app routes; plain anchor for external/hash
    const isExternal = /^(https?:|mailto:|tel:|#)/i.test(href);
    if (isExternal) {
      return (
        <a
          ref={setRef as (n: HTMLAnchorElement | null) => void}
          href={href}
          className={cls}
          aria-label={ariaLabel}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={href.startsWith("http") ? "noreferrer noopener" : undefined}
        >
          {children}
        </a>
      );
    }
    return (
      <Link
        ref={setRef as (n: HTMLAnchorElement | null) => void}
        href={href}
        className={cls}
        aria-label={ariaLabel}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      ref={setRef as (n: HTMLButtonElement | null) => void}
      type={type}
      onClick={onClick}
      className={cls}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
});

// ----------------------------------------------------------- Tilt3D

type Tilt3DProps = {
  children: ReactNode;
  className?: string;
  /** Max rotation in degrees. Default 7. */
  max?: number;
  style?: CSSProperties;
};

export function Tilt3D({ children, className, max = 7, style }: Tilt3DProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(hover: none)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let tx = 0, ty = 0;
    let cx = 0, cy = 0;
    let gx = 50, gy = 50;
    let cgx = 50, cgy = 50;

    const tick = () => {
      cx += (tx - cx) * 0.14;
      cy += (ty - cy) * 0.14;
      cgx += (gx - cgx) * 0.18;
      cgy += (gy - cgy) * 0.18;
      node.style.setProperty("--tilt-x", `${cx.toFixed(2)}deg`);
      node.style.setProperty("--tilt-y", `${cy.toFixed(2)}deg`);
      node.style.setProperty("--gx", `${cgx.toFixed(1)}%`);
      node.style.setProperty("--gy", `${cgy.toFixed(1)}%`);
      if (
        Math.abs(tx - cx) > 0.05 ||
        Math.abs(ty - cy) > 0.05 ||
        Math.abs(gx - cgx) > 0.5 ||
        Math.abs(gy - cgy) > 0.5
      ) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };

    const onMove = (e: MouseEvent) => {
      const rect = node.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      tx = (py - 0.5) * -2 * max;
      ty = (px - 0.5) * 2 * max;
      gx = px * 100;
      gy = py * 100;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onLeave = () => {
      tx = 0; ty = 0;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    node.addEventListener("mousemove", onMove);
    node.addEventListener("mouseleave", onLeave);
    return () => {
      node.removeEventListener("mousemove", onMove);
      node.removeEventListener("mouseleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [max]);

  return (
    <div ref={ref} className={cn("vx-cine-tilt", className)} style={style}>
      {children}
    </div>
  );
}
