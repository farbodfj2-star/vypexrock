"use client";

import { useEffect, useState } from "react";

/**
 * CinematicPreloader v2 — 1.2s film-studio open.
 * Auto-skips on subsequent visits in the same session.
 * Respects prefers-reduced-motion (renders nothing).
 */
export function CinematicPreloader() {
  const [phase, setPhase] = useState<"in" | "hold" | "out" | "done">("in");

  useEffect(() => {
    if (typeof window === "undefined") {
      setPhase("done");
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("done");
      return;
    }
    if (sessionStorage.getItem("vx-cine-played") === "1") {
      setPhase("done");
      return;
    }

    const t1 = setTimeout(() => setPhase("hold"), 80);
    const t2 = setTimeout(() => setPhase("out"), 1100);
    const t3 = setTimeout(() => {
      setPhase("done");
      try { sessionStorage.setItem("vx-cine-played", "1"); } catch {}
    }, 1700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div className="cinematic-preloader" data-phase={phase} aria-hidden>
      <div className="cinematic-preloader__mark">
        <span className="cinematic-preloader__dot" />
        <span className="cinematic-preloader__name">VYPEXROCK</span>
      </div>
      <span className="cinematic-preloader__line" />
      <span className="cinematic-preloader__caption">institutional intelligence</span>
    </div>
  );
}
