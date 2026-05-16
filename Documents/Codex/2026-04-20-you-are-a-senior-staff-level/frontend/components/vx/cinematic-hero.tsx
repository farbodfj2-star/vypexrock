"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import type { MarketTicker } from "@/types";

type CinematicHeroProps = {
  rows: MarketTicker[];
};

/**
 * Cinematic Hero — A movie opening, not a dashboard.
 *
 * Choreography (driven by intro-time AND scroll-progress):
 *   t = 0.00  total darkness, distant pulse breathing
 *   t = 0.20  ambient particles drift in, faint horizon glow
 *   t = 0.40  brand whisper — tiny mark only
 *   t = 0.55  title fades up letter-by-letter
 *   t = 0.75  subtitle, then chart materialises
 *   t = 0.95  CTAs and scroll hint
 *
 * Then scroll takes over and reveals the AI overlays.
 */
export function CinematicHero({ rows }: CinematicHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);
  const [intro, setIntro] = useState(0);
  const [mounted, setMounted] = useState(false);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const [, force] = useState(0);

  // Cinematic intro timeline — 4.5s film opening
  useEffect(() => {
    setMounted(true);
    const start = performance.now();
    const DURATION = 4500;
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - t, 2.2);
      setIntro(eased);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Scroll progress (only takes effect after intro completes)
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const total = rect.height + window.innerHeight;
      const scrolled = window.innerHeight - rect.top;
      const p = Math.max(0, Math.min(1, scrolled / total));
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setProgress(p));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Mouse parallax — adds expensive feel
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
      force((v) => (v + 1) % 1000);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // ─── CINEMATIC CHART ────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
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

    let frame = 0;
    let stopped = false;

    const candles = generateCinematicCandles(110);
    const pricesAll = candles.flatMap((c) => [c.high, c.low]);
    const minP = Math.min(...pricesAll);
    const maxP = Math.max(...pricesAll);
    const pad = (maxP - minP) * 0.18;
    const range = maxP - minP + 2 * pad;

    const tick = () => {
      if (stopped) return;
      frame++;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      // chart materialises only after intro reaches ~0.7
      const chartReveal = smoothstep(0.7, 1.0, intro) * (1 - smoothstep(0.85, 1, progress) * 0.5);
      if (chartReveal <= 0) return;

      const priceY = (price: number) => {
        const top = h * 0.18;
        const bottom = h * 0.82;
        return top + (bottom - top) * (1 - (price - minP + pad) / range);
      };

      // ── ATMOSPHERIC FOG (volumetric) ──────────────────
      const fog = ctx.createRadialGradient(w / 2, h * 0.55, 20, w / 2, h * 0.55, w * 0.7);
      fog.addColorStop(0, `rgba(56, 189, 248, ${0.07 * chartReveal})`);
      fog.addColorStop(0.4, `rgba(139, 92, 246, ${0.04 * chartReveal})`);
      fog.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, w, h);

      // ── PERSPECTIVE FLOOR GRID ─────────────────────────
      ctx.save();
      ctx.globalAlpha = 0.12 * chartReveal;
      ctx.strokeStyle = "rgba(125, 211, 252, 0.5)";
      ctx.lineWidth = 0.5;
      const horizonY = h * 0.86;
      for (let i = 0; i < 18; i++) {
        const y = horizonY + Math.pow(i, 1.4) * 4;
        if (y > h) break;
        ctx.globalAlpha = (0.18 - i * 0.009) * chartReveal;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      // perspective verticals
      for (let i = -10; i <= 10; i++) {
        const t = i / 10;
        ctx.globalAlpha = 0.07 * chartReveal;
        ctx.beginPath();
        ctx.moveTo(w / 2 + t * w * 0.04, horizonY);
        ctx.lineTo(w / 2 + t * w * 1.2, h);
        ctx.stroke();
      }
      ctx.restore();

      // ── LIQUIDITY ZONES — soft glowing bands ──────────
      const liqZones = [
        { y: priceY(minP + range * 0.78), color: "110, 231, 183", scrollGate: 0.05 },
        { y: priceY(minP + range * 0.32), color: "253, 164, 175", scrollGate: 0.12 },
      ];
      liqZones.forEach((z) => {
        const localReveal = chartReveal * smoothstep(z.scrollGate, z.scrollGate + 0.18, progress);
        if (localReveal <= 0) return;
        const pulse = 0.8 + 0.2 * Math.sin(frame * 0.02);
        ctx.save();
        ctx.globalAlpha = 0.18 * localReveal * pulse;
        const zg = ctx.createLinearGradient(0, z.y - 22, 0, z.y + 22);
        zg.addColorStop(0, "rgba(0,0,0,0)");
        zg.addColorStop(0.5, `rgba(${z.color}, 0.55)`);
        zg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = zg;
        ctx.fillRect(0, z.y - 22, w, 44);

        ctx.globalAlpha = 0.55 * localReveal;
        ctx.strokeStyle = `rgba(${z.color}, 0.7)`;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 6]);
        ctx.beginPath();
        ctx.moveTo(0, z.y);
        ctx.lineTo(w, z.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      });

      // ── CANDLES — sequenced reveal with depth fade ────
      const cw = (w / candles.length) * 0.55;
      const cs = w / candles.length;
      const candlesShown = Math.floor(candles.length * Math.min(1, chartReveal * 1.05));
      const cameraOffset = (mouseRef.current.x - 0.5) * 16;

      for (let i = 0; i < candlesShown; i++) {
        const c = candles[i];
        const x = i * cs + cs / 2 + cameraOffset * (i / candles.length);
        const isUp = c.close >= c.open;
        const oy = priceY(c.open);
        const cy = priceY(c.close);
        const hy = priceY(c.high);
        const ly = priceY(c.low);

        // distance fade — far candles are misty
        const distFade = i < candles.length * 0.18 ? Math.pow(i / (candles.length * 0.18), 1.4) : 1;
        const localOpacity = chartReveal * distFade;

        // wick
        ctx.save();
        ctx.globalAlpha = 0.65 * localOpacity;
        ctx.strokeStyle = isUp ? "rgba(110, 231, 183, 0.85)" : "rgba(252, 165, 165, 0.85)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, hy);
        ctx.lineTo(x, ly);
        ctx.stroke();

        // body — bloom intensifies at the right edge
        const edgeBoost = i > candles.length - 8 ? 1 + (i - (candles.length - 8)) * 0.18 : 1;
        ctx.shadowColor = isUp ? "rgba(16, 185, 129, 0.55)" : "rgba(244, 63, 94, 0.55)";
        ctx.shadowBlur = 14 * edgeBoost;
        ctx.fillStyle = isUp
          ? `rgba(16, 185, 129, ${0.92 * localOpacity})`
          : `rgba(239, 68, 68, ${0.92 * localOpacity})`;
        const bh = Math.max(1.5, Math.abs(cy - oy));
        ctx.fillRect(x - cw / 2, Math.min(oy, cy), cw, bh);
        ctx.restore();
      }

      // ── AI PATH PREDICTION — flowing future ──────────
      const pathReveal = chartReveal * smoothstep(0.18, 0.42, progress);
      if (pathReveal > 0 && candlesShown > 0) {
        const last = candles[Math.min(candlesShown - 1, candles.length - 1)];
        const startX = (candlesShown - 1) * cs + cs / 2;
        const startY = priceY(last.close);

        ctx.save();
        ctx.globalAlpha = pathReveal;
        ctx.strokeStyle = "rgba(125, 211, 252, 0.85)";
        ctx.lineWidth = 1.5;
        ctx.shadowColor = "rgba(56, 189, 248, 0.95)";
        ctx.shadowBlur = 22;
        ctx.setLineDash([3, 6]);
        ctx.lineDashOffset = -frame * 0.5;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        const steps = 40;
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const px = startX + (w - startX) * t * 0.95;
          const drift = Math.sin(t * Math.PI * 2 + frame * 0.01) * 24;
          const trend = -t * 70;
          ctx.lineTo(px, startY + drift + trend);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // pulsing target
        const tx = w * 0.93;
        const ty = startY - 70;
        const pulse = (Math.sin(frame * 0.05) + 1) / 2;
        ctx.save();
        ctx.globalAlpha = pathReveal;
        ctx.fillStyle = `rgba(125, 211, 252, ${0.4 + pulse * 0.4})`;
        ctx.beginPath();
        ctx.arc(tx, ty, 4 + pulse * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = "rgba(125, 211, 252, 1)";
        ctx.shadowBlur = 24;
        ctx.fillStyle = "rgba(186, 230, 253, 0.95)";
        ctx.beginPath();
        ctx.arc(tx, ty, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ── DUST PARTICLES (atmospheric) ───────────────────
      ctx.save();
      const particleCount = 32;
      for (let i = 0; i < particleCount; i++) {
        const seed = i * 47.3;
        const x = ((seed * 13 + frame * 0.3) % w);
        const y = (seed * 19 + Math.sin(frame * 0.005 + i) * 30) % h;
        const size = 0.5 + Math.sin(frame * 0.02 + i) * 0.4;
        const opacity = (Math.sin(frame * 0.01 + i * 1.3) + 1) / 2;
        ctx.fillStyle = `rgba(186, 230, 253, ${opacity * 0.4 * chartReveal})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      requestAnimationFrame(tick);
    };

    let raf = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [intro, progress]);

  // ─── INTRO + SCROLL CHOREOGRAPHY ────────────────────────────
  // intro drives the first 4.5s. scroll then takes the page deeper.
  // After intro is complete, scroll progress is the only driver.
  const introOnly = (a: number, b: number) => smoothstep(a, b, intro);

  const stage = {
    mark: introOnly(0.18, 0.38) * (1 - smoothstep(0.85, 1.0, progress)),
    title: introOnly(0.4, 0.72) * (1 - smoothstep(0.85, 1.0, progress)),
    subtitle: introOnly(0.62, 0.88) * (1 - smoothstep(0.6, 0.9, progress)),
    chart: introOnly(0.7, 1.0),
    cta: introOnly(0.85, 1.0) * (1 - smoothstep(0.5, 0.8, progress)),
    scrollHint: introOnly(0.92, 1.0) * (1 - smoothstep(0.0, 0.05, progress)),
    ai: smoothstep(0.05, 0.3, progress) * intro,
    signal: smoothstep(0.3, 0.55, progress) * intro,
  };

  // mouse parallax offsets
  const mx = (mouseRef.current.x - 0.5) * 30;
  const my = (mouseRef.current.y - 0.5) * 18;

  // dynamic title — switches mid-scroll for emotional impact
  const titleAccent = progress > 0.35 ? "is a frequency." : "speaks first.";

  return (
    <section
      ref={containerRef}
      className="cinematic-hero-stage relative w-full overflow-hidden"
      style={{ minHeight: "200vh" }}
    >
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
        {/* layer 0 — pitch black */}
        <div className="absolute inset-0 bg-black" aria-hidden />

        {/* layer 1 — deep nebula breathing */}
        <div
          className="cinematic-nebula pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            opacity: 0.35 + intro * 0.5 + stage.chart * 0.15,
            transform: `translate(${mx * 0.3}px, ${my * 0.3}px) scale(${1 + intro * 0.04})`,
          }}
        />

        {/* layer 2 — vignette */}
        <div className="cinematic-vignette pointer-events-none absolute inset-0" aria-hidden />

        {/* layer 3 — distant scanner sweep */}
        <div
          className="cinematic-scanner pointer-events-none absolute inset-0"
          aria-hidden
          style={{ opacity: 0.25 + intro * 0.3 + stage.ai * 0.25 }}
        />

        {/* layer 4 — film grain */}
        <div className="cinematic-grain pointer-events-none absolute inset-0" aria-hidden />

        {/* layer 5 — ambient orbs (parallax) */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div
            className="cinematic-orb-soft"
            style={{
              left: "12%",
              top: "18%",
              opacity: 0.3 + intro * 0.4,
              transform: `translate(${mx * 0.5}px, ${my * 0.4 + (progress - 0.5) * -60}px) scale(${0.85 + intro * 0.2})`,
            }}
          />
          <div
            className="cinematic-orb-soft cinematic-orb-violet"
            style={{
              right: "8%",
              top: "22%",
              opacity: 0.25 + intro * 0.35,
              transform: `translate(${-mx * 0.6}px, ${-my * 0.5 + (progress - 0.5) * 40}px) scale(${0.85 + intro * 0.2})`,
            }}
          />
          <div
            className="cinematic-orb-soft cinematic-orb-cyan"
            style={{
              left: "50%",
              bottom: "8%",
              opacity: 0.25 + stage.signal * 0.5,
              transform: `translate(calc(-50% + ${mx * 0.3}px), ${(progress - 0.5) * -30}px)`,
            }}
          />
        </div>

        {/* layer 6 — chart canvas (full bleed, no card) */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          style={{
            opacity: stage.chart,
            transform: `translate(${mx * 0.15}px, ${my * 0.1}px) scale(${0.9 + stage.chart * 0.1})`,
          }}
        />

        {/* layer 7 — lens flare drifting with progress */}
        <div
          className="cinematic-lens-flare pointer-events-none absolute"
          aria-hidden
          style={{
            left: `${20 + progress * 60}%`,
            top: `${25 + progress * 18}%`,
            opacity: stage.ai * 0.7,
            transform: `translate(${-mx * 0.4}px, ${-my * 0.3}px)`,
          }}
        />

        {/* layer 8 — AI HUD overlay */}
        <div
          className="cinematic-ai-overlay pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ opacity: stage.ai }}
          aria-hidden
        >
          <CinematicAIReadout progress={progress} mounted={mounted} />
        </div>

        {/* layer 9 — signal lock (final stage) */}
        <div
          className="pointer-events-none absolute right-[6%] top-[26%] hidden md:block"
          style={{
            opacity: stage.signal,
            transform: `translate(${-mx * 0.3}px, ${(1 - stage.signal) * 16 - my * 0.2}px)`,
            transition: "transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)",
          }}
          aria-hidden
        >
          <CinematicSignalLock progress={progress} />
        </div>

        {/* layer 10 — foreground content (the only "UI" allowed) */}
        <div className="relative z-10 mx-auto flex h-full max-w-[1400px] flex-col items-center justify-center px-6 text-center">
          <div
            className="cinematic-mark"
            style={{
              opacity: stage.mark,
              transform: `translateY(${(1 - stage.mark) * 14}px)`,
            }}
          >
            <span className="cinematic-mark-dot" />
            <span>Vypexrock — Institutional Intelligence</span>
          </div>

          <h1
            className="cinematic-title mt-8"
            style={{
              opacity: stage.title,
              letterSpacing: `${-0.045 + (1 - stage.title) * 0.012}em`,
              transform: `translateY(${(1 - stage.title) * 32}px) translate(${mx * 0.06}px, 0)`,
            }}
          >
            <span className="cinematic-title-line">The market</span>
            <span className="cinematic-title-line cinematic-title-line--accent">
              {titleAccent}
            </span>
            <span className="cinematic-title-line cinematic-title-line--quiet">We listen.</span>
          </h1>

          <p
            className="cinematic-sub mt-8 max-w-xl"
            style={{
              opacity: stage.subtitle,
              transform: `translateY(${(1 - stage.subtitle) * 14}px)`,
            }}
          >
            A cinematic terminal that interprets liquidity, structure, and momentum
            as a single, breathing organism.
          </p>

          <div
            className="mt-14 flex items-center gap-10"
            style={{ opacity: stage.cta, pointerEvents: stage.cta > 0.4 ? "auto" : "none" }}
          >
            <Link href="/terminal" className="cinematic-cta">
              <span>Enter terminal</span>
              <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                <path d="M1 5h13m0 0L10 1m4 4l-4 4" stroke="currentColor" strokeWidth="1" />
              </svg>
            </Link>
            <Link href="/chart-analyzer" className="cinematic-cta-quiet">
              Analyse a chart
            </Link>
          </div>

          <div
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
            style={{ opacity: stage.scrollHint }}
          >
            <div className="cinematic-scroll-hint">
              <span className="cinematic-scroll-line" />
              <span className="cinematic-scroll-label">Scroll to begin</span>
            </div>
          </div>
        </div>
      </div>

      <div aria-hidden style={{ height: "100vh" }} />
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
// AI READOUT — appears like a HUD in the air
// ─────────────────────────────────────────────────────────────────
function CinematicAIReadout({ progress, mounted }: { progress: number; mounted: boolean }) {
  const phrases = useMemo(
    () => [
      { p: 0.06, txt: "scanning liquidity..." },
      { p: 0.14, txt: "structure shift detected" },
      { p: 0.22, txt: "momentum aligning · 1H · 4H" },
      { p: 0.32, txt: "confidence rising" },
      { p: 0.42, txt: "signal locked" },
    ],
    [],
  );
  if (!mounted) return null;
  return (
    <div className="cinematic-readout">
      {phrases.map((ph, i) => {
        const local = Math.min(1, Math.max(0, (progress - ph.p) / 0.05));
        const fade = local < 1 ? local : Math.max(0, 1 - (progress - ph.p - 0.18) / 0.06);
        return (
          <span
            key={i}
            className="cinematic-readout-line"
            style={{
              opacity: Math.max(0, fade),
              transform: `translateY(${(1 - local) * 8}px)`,
            }}
          >
            <span className="cinematic-readout-pulse" />
            {ph.txt}
          </span>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SIGNAL LOCK — quiet HUD
// ─────────────────────────────────────────────────────────────────
function CinematicSignalLock({ progress }: { progress: number }) {
  const conf = Math.round(72 + Math.min(20, (progress - 0.3) * 80));
  return (
    <div className="cinematic-signal-lock">
      <div className="cinematic-signal-lock__label">SIGNAL LOCKED</div>
      <div className="cinematic-signal-lock__value">{conf}%</div>
      <div className="cinematic-signal-lock__bar">
        <span style={{ width: `${conf}%` }} />
      </div>
      <div className="cinematic-signal-lock__meta">
        <span>BTCUSDT</span>
        <span className="cinematic-signal-lock__dot" />
        <span>15m · 1H · 4H</span>
      </div>
    </div>
  );
}

// helpers
function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function generateCinematicCandles(count: number) {
  const out: { open: number; high: number; low: number; close: number }[] = [];
  let p = 47000;
  let trend = 0;
  for (let i = 0; i < count; i++) {
    trend += (Math.random() - 0.46) * 30;
    const drift = Math.sin(i / 9) * 220 + Math.cos(i / 21) * 80 + trend;
    const vol = 70 + Math.random() * 220;
    const open = p + drift * 0.04;
    const close = open + (Math.random() - 0.45) * vol;
    const high = Math.max(open, close) + Math.random() * vol * 0.6;
    const low = Math.min(open, close) - Math.random() * vol * 0.6;
    out.push({ open, high, low, close });
    p = close;
  }
  return out;
}
