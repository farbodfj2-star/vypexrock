"use client";

import { useEffect, useRef } from "react";

/**
 * CinematicPostFX — fixed full-screen overlay that adds
 * "post-processing" effects on top of the page:
 *   • chromatic aberration on the edges (responds to velocity)
 *   • lens breathing (subtle scale)
 *   • soft bloom haze
 *   • scanline shimmer
 *   • analog signal distortion (rare flicker)
 *
 * All layers are pointer-events: none and live in z-50 so they
 * sit above content but never block interaction.
 */
export function CinematicPostFX() {
  const ref = useRef<HTMLDivElement>(null);
  const aberrRef = useRef<HTMLDivElement>(null);
  const breatheRef = useRef<HTMLDivElement>(null);

  // velocity-driven chromatic aberration
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--cine-velocity") || "0");
      const intensity = Math.min(8, Math.abs(v) * 0.4);
      if (aberrRef.current) {
        aberrRef.current.style.setProperty("--ab-x", `${intensity.toFixed(2)}px`);
        aberrRef.current.style.opacity = String(Math.min(1, intensity / 3));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // lens breathing — extremely subtle scale at idle
  useEffect(() => {
    let raf = 0;
    let t0 = performance.now();
    const tick = (now: number) => {
      const t = (now - t0) / 1000;
      const breathe = 1 + Math.sin(t * 0.6) * 0.0035;
      if (breatheRef.current) {
        breatheRef.current.style.setProperty("--breathe", String(breathe));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={ref}
      className="cine-postfx pointer-events-none fixed inset-0 z-[60]"
      aria-hidden
    >
      {/* breathing wrapper applies a tiny scale to the layers below */}
      <div ref={breatheRef} className="cine-postfx__breathe absolute inset-0">
        {/* chromatic aberration — only visible during fast motion */}
        <div ref={aberrRef} className="cine-postfx__aberration absolute inset-0" />
        {/* soft bloom haze */}
        <div className="cine-postfx__bloom absolute inset-0" />
        {/* scanlines — extremely faint */}
        <div className="cine-postfx__scanlines absolute inset-0" />
        {/* edge vignette gets darker on faster scroll (focus pull feel) */}
        <div className="cine-postfx__vignette absolute inset-0" />
        {/* atmospheric haze (volumetric fog) */}
        <div className="cine-postfx__haze absolute inset-0" />
        {/* very rare signal distortion */}
        <div className="cine-postfx__distort absolute inset-0" />
      </div>
    </div>
  );
}
