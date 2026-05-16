"use client";

import { useEffect, useState } from "react";

/**
 * CinematicPreloader — boots the brand like a film studio logo.
 * Holds a fixed dark frame for ~1.4s, fades out, then reveals the page.
 * Intentionally short so it doesn't annoy returning users.
 */
export function CinematicPreloader() {
  const [phase, setPhase] = useState<"in" | "hold" | "out" | "done">("in");

  useEffect(() => {
    // Don't show on subsequent visits within a session
    if (typeof window !== "undefined" && sessionStorage.getItem("vx-cine-played") === "1") {
      setPhase("done");
      return;
    }

    const t1 = setTimeout(() => setPhase("hold"), 100);
    const t2 = setTimeout(() => setPhase("out"), 1300);
    const t3 = setTimeout(() => {
      setPhase("done");
      try {
        sessionStorage.setItem("vx-cine-played", "1");
      } catch {}
    }, 1900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      aria-hidden
      className="cinematic-preloader"
      data-phase={phase}
    >
      <div className="cinematic-preloader__mark">
        <span className="cinematic-preloader__dot" />
        <span className="cinematic-preloader__name">VYPEXROCK</span>
      </div>
      <span className="cinematic-preloader__line" />
      <span className="cinematic-preloader__caption">institutional intelligence · loading market frame</span>
    </div>
  );
}
