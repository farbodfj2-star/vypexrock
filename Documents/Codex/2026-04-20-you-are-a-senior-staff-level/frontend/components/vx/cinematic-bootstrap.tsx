"use client";

import { useSmoothScroll } from "@/hooks/use-smooth-scroll";
import { CinematicAmbience } from "@/components/vx/cinematic-ambience";
import { CinematicPostFX } from "@/components/vx/cinematic-postfx";
import { CinematicPhaseHUD } from "@/components/vx/cinematic-phase-hud";

/**
 * CinematicBootstrap — wires the smooth-scroll engine and
 * post-fx layers into a page. Use ONCE at the top of any
 * cinematic route.
 */
export function CinematicBootstrap() {
  useSmoothScroll();
  return (
    <>
      <CinematicAmbience />
      <CinematicPostFX />
      <CinematicPhaseHUD />
    </>
  );
}
