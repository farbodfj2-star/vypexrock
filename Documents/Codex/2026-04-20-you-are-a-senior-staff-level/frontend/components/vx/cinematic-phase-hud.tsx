"use client";

import { useEffect, useState } from "react";

/**
 * CinematicPhaseHUD — bottom-left corner element that shows
 * the current "scene" of the film. Updates as the user scrolls.
 * Auto-hides during the first 1.4s of the page (preloader).
 */
const SCENES = [
  { progress: 0.0, label: "PROLOGUE" },
  { progress: 0.08, label: "SILENCE" },
  { progress: 0.22, label: "LIQUIDITY" },
  { progress: 0.42, label: "ALIGNMENT" },
  { progress: 0.62, label: "DISCIPLINE" },
  { progress: 0.85, label: "INVITATION" },
];

export function CinematicPhaseHUD() {
  const [scene, setScene] = useState(SCENES[0]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const v = setTimeout(() => setVisible(true), 2000);
    let raf = 0;
    const onScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const p = window.scrollY / max;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        for (let i = SCENES.length - 1; i >= 0; i--) {
          if (p >= SCENES[i].progress) {
            setScene(SCENES[i]);
            break;
          }
        }
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(v);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      className="cinematic-phase-hud"
      style={{ opacity: visible ? 1 : 0 }}
      aria-hidden
    >
      <span className="cinematic-phase-hud__rec">
        <span className="cinematic-phase-hud__dot" />
        REC
      </span>
      <span className="cinematic-phase-hud__sep" />
      <span className="cinematic-phase-hud__label">{scene.label}</span>
    </div>
  );
}
