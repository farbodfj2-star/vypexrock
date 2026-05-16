"use client";

/**
 * CinematicBootstrap — minimal v2.
 * Renders only the calm bottom-left phase HUD.
 * The hero owns its own scroll/mouse listeners.
 *
 * Removed (was causing visual noise / flicker):
 *   - post-fx (chromatic aberration, scanlines, distort)
 *   - ambience canvas (data flickers, rays, motes)
 *   - smooth-scroll engine (was making scroll feel laggy on touch devices)
 */
export function CinematicBootstrap() {
  return (
    <div
      className="cinematic-phase-hud"
      data-cine-phase-hud
      aria-hidden
    >
      <span className="cinematic-phase-hud__dot" />
      <span data-phase-label className="cinematic-phase-hud__label">PROLOGUE</span>
    </div>
  );
}
