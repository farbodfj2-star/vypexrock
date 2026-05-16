"use client";

interface SceneBreakProps {
  label: string;
}

/**
 * CinematicSceneBreak — a full-bleed pause between acts.
 * Breaks template rhythm. Negative space. Pure atmosphere.
 */
export function CinematicSceneBreak({ label }: SceneBreakProps) {
  return (
    <div className="cinematic-scene-break" aria-hidden>
      <span className="cinematic-scene-break__quote">{label}</span>
    </div>
  );
}
