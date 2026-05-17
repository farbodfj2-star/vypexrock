/**
 * Vypexrock boot sound — Web Audio synthesis, no asset needed.
 *
 * Layers:
 *   1. Deep sub-bass impact (Netflix-style DUN, 110 → 38 Hz exponential drop)
 *   2. Punchy mid "tonk" (380 → 180 Hz triangle with quick attack)
 *   3. Bright digital shimmer (1.1 kHz sine + delay/feedback for trader-confirm sparkle)
 *   4. Final ascending sparkle ping (signal-locked feel)
 *
 * Total length: ~1.6s
 *
 * Autoplay policy:
 *   - Modern browsers block AudioContext until first user gesture.
 *   - We try immediately. If suspended, we queue on first interaction.
 *   - Plays once per session via sessionStorage flag.
 *   - User can mute via localStorage 'vx-sound-muted'.
 */

const SESSION_KEY = "vx-boot-sound-played";
const MUTE_KEY = "vx-sound-muted";

let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (_ctx) return _ctx;
  const Ctor: typeof AudioContext | undefined =
    (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!Ctor) return null;
  _ctx = new Ctor();
  return _ctx;
}

export function isMuted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(MUTE_KEY) === "1";
}

export function setMuted(muted: boolean) {
  if (typeof window === "undefined") return;
  if (muted) localStorage.setItem(MUTE_KEY, "1");
  else localStorage.removeItem(MUTE_KEY);
}

export function hasPlayedThisSession(): boolean {
  if (typeof window === "undefined") return true;
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

export function markPlayed() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {}
}

/**
 * Play the boot sound now. Returns true if scheduled, false if blocked.
 */
export function playVypexBoot(volume = 0.55): boolean {
  if (typeof window === "undefined") return false;
  if (isMuted()) return false;

  const ctx = getCtx();
  if (!ctx) return false;

  if (ctx.state === "suspended") {
    // Try to resume; will only succeed inside a user gesture
    ctx.resume().catch(() => {});
    if (ctx.state === "suspended") return false;
  }

  schedule(ctx, volume);
  return true;
}

/**
 * Internal: schedule all the layers on the context.
 */
function schedule(ctx: AudioContext, volume: number) {
  const t0 = ctx.currentTime + 0.02;

  // ── Master ──
  const master = ctx.createGain();
  master.gain.value = volume;
  master.connect(ctx.destination);

  // Subtle low-pass softener so it never feels harsh
  const softener = ctx.createBiquadFilter();
  softener.type = "lowpass";
  softener.frequency.value = 9000;
  softener.Q.value = 0.4;
  softener.connect(master);

  // Reverb-ish via delay feedback (no convolver = lighter)
  const wet = ctx.createGain();
  wet.gain.value = 0.18;
  const delay = ctx.createDelay(0.6);
  delay.delayTime.value = 0.18;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.32;
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(wet);
  wet.connect(softener);

  // ── Layer 1: deep boom (the DUN) ──
  {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(120, t0);
    osc.frequency.exponentialRampToValueAtTime(38, t0 + 1.0);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(1.0, t0 + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 1.5);
    osc.connect(gain).connect(softener);
    osc.start(t0);
    osc.stop(t0 + 1.6);
  }

  // ── Layer 2: punch (mid tonk) ──
  {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(420, t0 + 0.04);
    osc.frequency.exponentialRampToValueAtTime(180, t0 + 0.55);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0 + 0.04);
    gain.gain.linearRampToValueAtTime(0.55, t0 + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.7);
    osc.connect(gain).connect(softener);
    osc.start(t0 + 0.04);
    osc.stop(t0 + 0.8);
  }

  // ── Layer 3: shimmer with delay (signal sparkle) ──
  {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1100, t0 + 0.09);
    osc.frequency.exponentialRampToValueAtTime(820, t0 + 0.6);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0 + 0.09);
    gain.gain.linearRampToValueAtTime(0.18, t0 + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.95);
    osc.connect(gain);
    gain.connect(softener);
    gain.connect(delay); // splash into reverb-y delay
    osc.start(t0 + 0.09);
    osc.stop(t0 + 1.0);
  }

  // ── Layer 4: ascending confirmation ping (the trader "lock" feel) ──
  {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1480, t0 + 0.55);
    osc.frequency.linearRampToValueAtTime(1980, t0 + 0.85);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0 + 0.55);
    gain.gain.linearRampToValueAtTime(0.16, t0 + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 1.1);
    osc.connect(gain).connect(softener);
    gain.connect(delay);
    osc.start(t0 + 0.55);
    osc.stop(t0 + 1.15);
  }

  // ── Layer 5: noise-burst transient at the very start ──
  {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filt = ctx.createBiquadFilter();
    filt.type = "highpass";
    filt.frequency.value = 4000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.16);
    noise.connect(filt).connect(gain).connect(softener);
    noise.start(t0);
  }

  // master fade so the tail dies cleanly
  master.gain.setValueAtTime(volume, t0);
  master.gain.exponentialRampToValueAtTime(0.001, t0 + 1.65);
}

/**
 * Play once on first opportunity:
 *   - Try immediately (works if browser already trusts the page)
 *   - Otherwise queue on first user interaction
 *   - Always set the session flag so we never play twice in the same tab
 */
export function playOnFirstChance(volume = 0.55) {
  if (typeof window === "undefined") return;
  if (hasPlayedThisSession()) return;
  if (isMuted()) {
    markPlayed();
    return;
  }
  // Honor reduced motion: skip the boot sound entirely
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    markPlayed();
    return;
  }

  const tryPlay = () => {
    const success = playVypexBoot(volume);
    if (success) {
      markPlayed();
      cleanup();
    }
  };

  const cleanup = () => {
    document.removeEventListener("click", tryPlay);
    document.removeEventListener("keydown", tryPlay);
    document.removeEventListener("touchstart", tryPlay);
    document.removeEventListener("scroll", tryPlay);
    document.removeEventListener("pointerdown", tryPlay);
  };

  // First attempt — most browsers will block this
  if (playVypexBoot(volume)) {
    markPlayed();
    return;
  }

  // Queue on first interaction
  document.addEventListener("click", tryPlay, { once: false, passive: true });
  document.addEventListener("keydown", tryPlay, { once: false, passive: true });
  document.addEventListener("touchstart", tryPlay, { once: false, passive: true });
  document.addEventListener("scroll", tryPlay, { once: false, passive: true });
  document.addEventListener("pointerdown", tryPlay, { once: false, passive: true });
}

/**
 * Quick "tick" UI sound — used for the mute toggle preview.
 */
export function playTick(volume = 0.3) {
  if (typeof window === "undefined") return;
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const t0 = ctx.currentTime + 0.01;

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(1320, t0);
  osc.frequency.exponentialRampToValueAtTime(1980, t0 + 0.18);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.22);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + 0.25);
}
