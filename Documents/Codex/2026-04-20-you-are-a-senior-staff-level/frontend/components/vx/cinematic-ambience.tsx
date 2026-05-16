"use client";

import { useEffect, useRef } from "react";

/**
 * CinematicAmbience — full-screen ambient layer that makes the
 * environment feel ALIVE even when nothing is happening.
 *
 * Idle behaviors:
 *   • slow drifting volumetric light rays
 *   • occasional data flicker (binary fragments, fading)
 *   • idle scan pulse
 *   • atmospheric particle drift (low-poly motes)
 *   • barely-there hologram interference lines
 *
 * All canvas-rendered, throttled, GPU-friendly.
 */
export function CinematicAmbience() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const setSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setSize();
    const ro = new ResizeObserver(setSize);
    ro.observe(canvas);

    // particle motes
    const motes = Array.from({ length: 36 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0001,
      vy: -Math.random() * 0.00015 - 0.00005,
      size: 0.4 + Math.random() * 1.2,
      phase: Math.random() * Math.PI * 2,
    }));

    // data flickers — short-lived hex/binary fragments
    type Flicker = {
      x: number;
      y: number;
      text: string;
      life: number;
      maxLife: number;
      hue: number;
    };
    const flickers: Flicker[] = [];
    const flickerWords = [
      "0x7F", "0x3A", "0xC4", "0x1F", "01", "10", "11", "00",
      "BTC", "ETH", "SOL", "XAU", "FX", "Δ", "∂", "Σ", "∇",
      "47.2k", "2890", "162.4", "+0.34%", "-0.12%",
    ];

    let frame = 0;
    let stop = false;

    const tick = () => {
      if (stop) return;
      frame++;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      // Velocity-aware fade — clear instead of dirty trails
      ctx.clearRect(0, 0, w, h);

      // ── Volumetric light rays (slow drift) ────────────
      const t = frame * 0.0006;
      for (let i = 0; i < 3; i++) {
        const x = w * (0.2 + i * 0.3 + Math.sin(t + i) * 0.05);
        const grad = ctx.createLinearGradient(x, 0, x + 240, h);
        grad.addColorStop(0, "rgba(125, 211, 252, 0)");
        grad.addColorStop(0.4, `rgba(125, 211, 252, ${0.018 + Math.sin(t * 1.2 + i) * 0.008})`);
        grad.addColorStop(1, "rgba(125, 211, 252, 0)");
        ctx.save();
        ctx.fillStyle = grad;
        ctx.fillRect(x, 0, 240, h);
        ctx.restore();
      }

      // ── Particle motes ────────────────────────────────
      ctx.save();
      for (const m of motes) {
        m.x += m.vx;
        m.y += m.vy;
        if (m.y < -0.05) m.y = 1.05;
        if (m.x < -0.05) m.x = 1.05;
        if (m.x > 1.05) m.x = -0.05;
        const sx = m.x * w;
        const sy = m.y * h;
        const alpha = (Math.sin(frame * 0.012 + m.phase) + 1) / 2;
        ctx.fillStyle = `rgba(186, 230, 253, ${0.18 + alpha * 0.22})`;
        ctx.beginPath();
        ctx.arc(sx, sy, m.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // ── Data flickers ────────────────────────────────
      if (Math.random() < 0.012 && flickers.length < 14) {
        flickers.push({
          x: Math.random() * w,
          y: Math.random() * h,
          text: flickerWords[Math.floor(Math.random() * flickerWords.length)],
          life: 0,
          maxLife: 60 + Math.random() * 60,
          hue: Math.random() < 0.7 ? 200 : 270,
        });
      }
      ctx.save();
      ctx.font = "10px ui-monospace, 'SF Mono', monospace";
      for (let i = flickers.length - 1; i >= 0; i--) {
        const f = flickers[i];
        f.life++;
        const t = f.life / f.maxLife;
        if (t >= 1) {
          flickers.splice(i, 1);
          continue;
        }
        const fade = t < 0.2 ? t / 0.2 : t > 0.8 ? (1 - t) / 0.2 : 1;
        ctx.fillStyle = `hsla(${f.hue}, 90%, 80%, ${fade * 0.32})`;
        ctx.shadowColor = `hsla(${f.hue}, 90%, 70%, ${fade * 0.6})`;
        ctx.shadowBlur = 6;
        ctx.fillText(f.text, f.x, f.y);
      }
      ctx.restore();

      // ── Hologram interference (rare horizontal line) ──
      if (Math.random() < 0.004) {
        const y = Math.random() * h;
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = "rgba(125, 211, 252, 0.12)";
        ctx.fillRect(0, y, w, 1 + Math.random() * 2);
        ctx.restore();
      }

      requestAnimationFrame(tick);
    };

    let raf = requestAnimationFrame(tick);
    return () => {
      stop = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="cine-ambience pointer-events-none fixed inset-0 z-[1]"
    />
  );
}
