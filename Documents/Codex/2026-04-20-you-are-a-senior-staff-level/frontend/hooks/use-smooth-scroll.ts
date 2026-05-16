"use client";

import { useEffect } from "react";

/**
 * useSmoothScroll
 * --------------------------------------------------
 * Tiny, dependency-free smooth scroll engine.
 * Replaces native scroll snap with inertial, lerp-based
 * motion. The body stays at the real scroll position
 * (so layouts, querySelectors, and links work normally),
 * but a CSS variable `--cine-y` is updated each frame to
 * a *visually delayed* scroll value, which children can
 * use to translate themselves with weighted physics.
 *
 * Also exposes:
 *   --cine-velocity   (pixels/frame, signed)
 *   --cine-progress   (0–1 of total page)
 */
export function useSmoothScroll(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let target = window.scrollY;
    let current = target;
    let velocity = 0;
    let last = current;

    const root = document.documentElement;

    const onScroll = () => {
      target = window.scrollY;
    };

    const tick = () => {
      // critically damped lerp
      const next = current + (target - current) * 0.12;
      velocity = next - last;
      last = next;
      current = next;

      const max = Math.max(1, root.scrollHeight - window.innerHeight);
      root.style.setProperty("--cine-y", `${current.toFixed(2)}px`);
      root.style.setProperty("--cine-velocity", `${velocity.toFixed(2)}`);
      root.style.setProperty("--cine-progress", (current / max).toFixed(4));

      raf = requestAnimationFrame(tick);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      root.style.removeProperty("--cine-y");
      root.style.removeProperty("--cine-velocity");
      root.style.removeProperty("--cine-progress");
    };
  }, [enabled]);
}
