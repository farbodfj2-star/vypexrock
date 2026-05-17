"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

import {
  hasPlayedThisSession,
  isMuted,
  markPlayed,
  playOnFirstChance,
  playTick,
  playVypexBoot,
  setMuted,
} from "@/lib/audio/vypex-boot-sound";
import { cn } from "@/lib/utils";

/**
 * SoundBoot — handles the first-load Vypexrock boot sound and exposes a
 * floating mute toggle in the bottom-right corner.
 */
export function SoundBoot() {
  const [muted, setMutedState] = useState(false);
  const [played, setPlayed] = useState(false);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    setMutedState(isMuted());
    setPlayed(hasPlayedThisSession());
    if (!isMuted() && !hasPlayedThisSession()) {
      playOnFirstChance(0.5);
    }
  }, []);

  const toggleMute = () => {
    const next = !muted;
    setMutedState(next);
    setMuted(next);
    if (!next) {
      playTick();
    }
  };

  const replay = () => {
    if (muted) return;
    // Reset session flag so it can play again
    try { sessionStorage.removeItem("vx-boot-sound-played"); } catch {}
    playVypexBoot(0.5);
    markPlayed();
    setPlayed(true);
  };

  return (
    <div
      className="vx-sound-toggle"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? "Unmute Vypexrock sounds" : "Mute Vypexrock sounds"}
        className={cn("vx-sound-toggle__btn", !muted && "is-on")}
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
      {hover && !muted ? (
        <button type="button" onClick={replay} className="vx-sound-toggle__replay">
          Replay
        </button>
      ) : null}
    </div>
  );
}
