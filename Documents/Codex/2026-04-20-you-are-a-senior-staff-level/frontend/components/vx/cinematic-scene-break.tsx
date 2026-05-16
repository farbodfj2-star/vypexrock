"use client";

interface SceneBreakProps {
  label?: string;
}

/**
 * CinematicSceneBreak — calm vertical line between acts.
 * Pure decorative. Pointer-events none.
 */
export function CinematicSceneBreak({ label }: SceneBreakProps) {
  return (
    <div className="cinematic-scene-break" aria-hidden>
      <span className="cinematic-scene-break__line" />
      {label ? <span className="cinematic-scene-break__quote">{label}</span> : null}
    </div>
  );
}
