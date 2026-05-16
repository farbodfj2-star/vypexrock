"use client";

/**
 * Hand-rolled premium smooth-scroll provider.
 * - Uses requestAnimationFrame to lerp document.scrollingElement.scrollTop
 * - Falls back to native scroll on touch / reduced-motion
 * - Exposes `--vx-scroll-y` and `--vx-scroll-progress` CSS vars on <html>
 *
 * Purposefully zero deps. Behaves close to Lenis for desktop wheel events.
 */

import { useEffect } from "react";

const LERP = 0.085; // 0..1, higher = snappier
const MAX_DELTA = 200;

export function SmoothScrollProvider() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouch = matchMedia("(hover: none)").matches || "ontouchstart" in window;

    // Always update CSS vars based on native scroll (works in all cases)
    let rafScroll = 0;
    const updateVars = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      root.style.setProperty("--vx-scroll-y", `${y.toFixed(1)}px`);
      root.style.setProperty("--vx-scroll-progress", (y / max).toFixed(4));
      rafScroll = 0;
    };
    const onNativeScroll = () => {
      if (rafScroll) return;
      rafScroll = window.requestAnimationFrame(updateVars);
    };
    updateVars();
    window.addEventListener("scroll", onNativeScroll, { passive: true });
    window.addEventListener("resize", updateVars);

    // Skip JS-driven smoothing on reduced-motion / touch / no support
    if (reduce || isTouch) {
      return () => {
        window.removeEventListener("scroll", onNativeScroll);
        window.removeEventListener("resize", updateVars);
        if (rafScroll) cancelAnimationFrame(rafScroll);
      };
    }

    // Desktop: intercept wheel and lerp scroll position
    let target = window.scrollY;
    let current = window.scrollY;
    let raf = 0;
    let active = false;

    const tick = () => {
      const diff = target - current;
      if (Math.abs(diff) < 0.4) {
        current = target;
        active = false;
        raf = 0;
        return;
      }
      current += diff * LERP;
      window.scrollTo(0, current);
      raf = requestAnimationFrame(tick);
    };

    const onWheel = (e: WheelEvent) => {
      // Don't hijack pinch-zoom / horizontal / modal scrolls
      if (e.ctrlKey || e.metaKey || e.deltaMode !== 0) return;
      // Don't hijack inside elements that scroll themselves
      let node: HTMLElement | null = e.target as HTMLElement | null;
      while (node && node !== document.body) {
        const style = getComputedStyle(node);
        const oy = style.overflowY;
        if ((oy === "auto" || oy === "scroll") && node.scrollHeight > node.clientHeight) {
          return; // let native handle
        }
        node = node.parentElement;
      }
      e.preventDefault();
      const delta = Math.max(-MAX_DELTA, Math.min(MAX_DELTA, e.deltaY));
      target = Math.max(0, Math.min(target + delta, document.documentElement.scrollHeight - window.innerHeight));
      if (!active) {
        active = true;
        current = window.scrollY;
        raf = requestAnimationFrame(tick);
      }
    };

    // Re-sync target when user uses keyboard / scrollbar
    const syncTarget = () => {
      if (!active) target = window.scrollY;
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", syncTarget);
    window.addEventListener("scroll", syncTarget, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", syncTarget);
      window.removeEventListener("scroll", syncTarget);
      window.removeEventListener("scroll", onNativeScroll);
      window.removeEventListener("resize", updateVars);
      if (raf) cancelAnimationFrame(raf);
      if (rafScroll) cancelAnimationFrame(rafScroll);
    };
  }, []);

  return null;
}
