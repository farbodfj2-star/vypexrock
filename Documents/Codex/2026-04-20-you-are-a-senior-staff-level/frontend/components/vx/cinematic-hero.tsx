"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { MarketTicker } from "@/types";

type CinematicHeroProps = {
  rows: MarketTicker[];
};

/**
 * Cinematic Hero v2 — directed opening, dark graphite theme.
 *
 * Engineering rules:
 *   • All motion driven by CSS variables on a single rAF loop.
 *   • Zero React re-renders during scroll/mouse motion.
 *   • Only React state for one-time stage transitions (intro phases).
 *   • Layers: ambient, vignette, horizon, chart-canvas, mark, title, sub, cta.
 *   • Strict z-order; decorative layers pointer-events: none.
 */

const INTRO_MS = 4500; // shorter, less obnoxious
const PHASE_LABELS = [
  "PROLOGUE",
  "SILENCE",
  "LIQUIDITY",
  "ALIGNMENT",
  "DISCIPLINE",
  "INVITATION",
];

export function CinematicHero({ rows: _rows }: CinematicHeroProps) {
  const stageRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  // single state for "intro complete?" — flips once, no per-frame render
  const [introDone, setIntroDone] = useState(false);

  // ─── INTRO TIMELINE: drives --intro CSS var, reveals .is-in classes ───
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    // Honor reduced motion: jump straight to final state
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      stage.style.setProperty("--intro", "1");
      [markRef, titleRef, subRef, ctaRef, hintRef].forEach((r) => r.current?.classList.add("is-in"));
      setIntroDone(true);
      return;
    }

    // Skip if already played in this session
    if (sessionStorage.getItem("vx-intro-played") === "1") {
      stage.style.setProperty("--intro", "1");
      [markRef, titleRef, subRef, ctaRef, hintRef].forEach((r) => r.current?.classList.add("is-in"));
      setIntroDone(true);
      return;
    }

    const start = performance.now();
    let raf = 0;

    // Reveals scheduled in seconds-into-intro
    const reveals: Array<{ at: number; ref: React.RefObject<HTMLElement>; done: boolean }> = [
      { at: 0.6, ref: markRef as any, done: false },
      { at: 1.2, ref: titleRef as any, done: false },
      { at: 2.6, ref: subRef as any, done: false },
      { at: 3.4, ref: ctaRef as any, done: false },
      { at: 3.9, ref: hintRef as any, done: false },
    ];

    const step = (now: number) => {
      const elapsed = (now - start) / 1000;
      const t = Math.min(1, elapsed / (INTRO_MS / 1000));
      // ease-out
      const eased = 1 - Math.pow(1 - t, 1.6);
      stage.style.setProperty("--intro", eased.toFixed(4));

      reveals.forEach((r) => {
        if (!r.done && elapsed >= r.at && r.ref.current) {
          r.ref.current.classList.add("is-in");
          r.done = true;
        }
      });

      if (t < 1) {
        raf = requestAnimationFrame(step);
      } else {
        try { sessionStorage.setItem("vx-intro-played", "1"); } catch {}
        setIntroDone(true);
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ─── MOUSE PARALLAX: writes --mx, --my to stage ───
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;

    const onMove = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth) - 0.5;
      targetY = (e.clientY / window.innerHeight) - 0.5;
    };

    const tick = () => {
      // lerp for inertia
      curX += (targetX - curX) * 0.06;
      curY += (targetY - curY) * 0.06;
      stage.style.setProperty("--mx", curX.toFixed(4));
      stage.style.setProperty("--my", curY.toFixed(4));
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  // ─── SCROLL PROGRESS: writes --hero-progress ───
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let raf = 0;

    const onScroll = () => {
      const rect = stage.getBoundingClientRect();
      const total = rect.height + window.innerHeight;
      const scrolled = window.innerHeight - rect.top;
      const p = Math.max(0, Math.min(1, scrolled / total));
      stage.style.setProperty("--hero-progress", p.toFixed(4));

      // staged HUD reveals tied to scroll progress (pure DOM toggle, not React state)
      if (readoutRef.current) {
        readoutRef.current.classList.toggle("is-in", p > 0.05);
      }
      if (lockRef.current) {
        lockRef.current.style.opacity = p > 0.25 ? "1" : "0";
        lockRef.current.style.transform = `translate3d(0, ${p > 0.25 ? "0" : "16px"}, 0)`;
        // update the confidence number directly without re-render
        const valEl = lockRef.current.querySelector<HTMLElement>("[data-conf]");
        if (valEl) {
          const conf = Math.round(72 + Math.min(20, (p - 0.25) * 70));
          valEl.textContent = conf + "%";
          const bar = lockRef.current.querySelector<HTMLElement>("[data-conf-bar]");
          if (bar) bar.style.width = conf + "%";
        }
      }
    };

    const handler = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(onScroll);
    };

    onScroll();
    window.addEventListener("scroll", handler, { passive: true });
    return () => {
      window.removeEventListener("scroll", handler);
      cancelAnimationFrame(raf);
    };
  }, []);

  // ─── CHART CANVAS: stable, debounced resize, single rAF loop ───
  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // generate candles ONCE — never regenerate, never jump
    const candles = generateCandles(120, 47000);
    const prices = candles.flatMap((c) => [c.high, c.low]);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const pad = (maxP - minP) * 0.18;
    const range = maxP - minP + 2 * pad;

    let frame = 0;
    let stopped = false;

    const tick = () => {
      if (stopped) return;
      frame++;

      const intro = parseFloat(stage.style.getPropertyValue("--intro") || "0");
      const heroP = parseFloat(stage.style.getPropertyValue("--hero-progress") || "0");
      const reveal = smoothstep(0.4, 1.0, intro) * (1 - smoothstep(0.85, 1.0, heroP) * 0.5);

      ctx.clearRect(0, 0, w, h);
      if (reveal <= 0.01) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const priceY = (price: number) => {
        const top = h * 0.18;
        const bottom = h * 0.82;
        return top + (bottom - top) * (1 - (price - minP + pad) / range);
      };

      // ── soft ambient glow under chart ──
      const fog = ctx.createRadialGradient(w / 2, h * 0.55, 20, w / 2, h * 0.55, w * 0.6);
      fog.addColorStop(0, `rgba(125, 211, 252, ${0.05 * reveal})`);
      fog.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, w, h);

      // ── perspective floor grid (very faint) ──
      ctx.save();
      ctx.strokeStyle = "rgba(125, 211, 252, 0.16)";
      ctx.lineWidth = 0.5;
      const horizonY = h * 0.86;
      for (let i = 0; i < 14; i++) {
        const y = horizonY + Math.pow(i, 1.4) * 4;
        if (y > h) break;
        ctx.globalAlpha = (0.12 - i * 0.008) * reveal;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.restore();

      // ── liquidity zones (gated by scroll) ──
      const liqGate = smoothstep(0.05, 0.25, heroP);
      if (liqGate > 0.01) {
        const zones = [
          { y: priceY(minP + range * 0.78), color: "110, 231, 183" },
          { y: priceY(minP + range * 0.32), color: "253, 164, 175" },
        ];
        zones.forEach((z) => {
          ctx.save();
          ctx.globalAlpha = 0.18 * reveal * liqGate;
          const zg = ctx.createLinearGradient(0, z.y - 20, 0, z.y + 20);
          zg.addColorStop(0, "rgba(0,0,0,0)");
          zg.addColorStop(0.5, `rgba(${z.color}, 0.5)`);
          zg.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = zg;
          ctx.fillRect(0, z.y - 20, w, 40);
          ctx.globalAlpha = 0.5 * reveal * liqGate;
          ctx.strokeStyle = `rgba(${z.color}, 0.65)`;
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 6]);
          ctx.beginPath();
          ctx.moveTo(0, z.y);
          ctx.lineTo(w, z.y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        });
      }

      // ── candles ──
      const cw = (w / candles.length) * 0.55;
      const cs = w / candles.length;
      const candlesShown = Math.floor(candles.length * Math.min(1, reveal * 1.05));

      for (let i = 0; i < candlesShown; i++) {
        const c = candles[i];
        const x = i * cs + cs / 2;
        const isUp = c.close >= c.open;
        const oy = priceY(c.open);
        const cy = priceY(c.close);
        const hy = priceY(c.high);
        const ly = priceY(c.low);

        // distance fade — far candles are misty
        const distFade = i < candles.length * 0.18 ? Math.pow(i / (candles.length * 0.18), 1.4) : 1;
        const localOp = reveal * distFade;

        // wick
        ctx.save();
        ctx.globalAlpha = 0.6 * localOp;
        ctx.strokeStyle = isUp ? "rgba(110, 231, 183, 0.85)" : "rgba(252, 165, 165, 0.85)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, hy);
        ctx.lineTo(x, ly);
        ctx.stroke();

        // body
        const edgeBoost = i > candles.length - 8 ? 1 + (i - (candles.length - 8)) * 0.12 : 1;
        ctx.shadowColor = isUp ? "rgba(16, 185, 129, 0.35)" : "rgba(244, 63, 94, 0.35)";
        ctx.shadowBlur = 10 * edgeBoost;
        ctx.fillStyle = isUp
          ? `rgba(16, 185, 129, ${0.85 * localOp})`
          : `rgba(239, 68, 68, ${0.85 * localOp})`;
        const bh = Math.max(1.5, Math.abs(cy - oy));
        ctx.fillRect(x - cw / 2, Math.min(oy, cy), cw, bh);
        ctx.restore();
      }

      // ── AI prediction path (gated) ──
      const pathGate = smoothstep(0.15, 0.4, heroP);
      if (pathGate > 0.01 && candlesShown > 0) {
        const last = candles[Math.min(candlesShown - 1, candles.length - 1)];
        const startX = (candlesShown - 1) * cs + cs / 2;
        const startY = priceY(last.close);

        ctx.save();
        ctx.globalAlpha = pathGate * reveal;
        ctx.strokeStyle = "rgba(125, 211, 252, 0.78)";
        ctx.lineWidth = 1.4;
        ctx.shadowColor = "rgba(56, 189, 248, 0.85)";
        ctx.shadowBlur = 16;
        ctx.setLineDash([3, 6]);
        ctx.lineDashOffset = -frame * 0.4;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        const steps = 36;
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const px = startX + (w - startX) * t * 0.95;
          const drift = Math.sin(t * Math.PI * 2 + frame * 0.008) * 22;
          const trend = -t * 60;
          ctx.lineTo(px, startY + drift + trend);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      raf = requestAnimationFrame(tick);
    };

    let raf = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  // ─── Phase HUD scroll listener ───
  useEffect(() => {
    const hud = document.querySelector<HTMLElement>("[data-cine-phase-hud]");
    if (!hud) return;
    const labelEl = hud.querySelector<HTMLElement>("[data-phase-label]");
    if (!labelEl) return;

    const v = setTimeout(() => hud.classList.add("is-in"), 1800);
    let raf = 0;

    const update = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const p = window.scrollY / max;
      let label = PHASE_LABELS[0];
      const breakpoints = [0, 0.08, 0.22, 0.42, 0.62, 0.85];
      for (let i = breakpoints.length - 1; i >= 0; i--) {
        if (p >= breakpoints[i]) { label = PHASE_LABELS[i]; break; }
      }
      if (labelEl.textContent !== label) labelEl.textContent = label;
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(v);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={stageRef}
      className="cinematic-hero-stage relative w-full overflow-hidden"
      style={{ minHeight: "180vh" }}
    >
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
        {/* layer 1 — single ambient glow */}
        <div className="cinematic-ambient" aria-hidden />

        {/* layer 2 — horizon line */}
        <div className="cinematic-horizon" aria-hidden />

        {/* layer 3 — chart canvas */}
        <canvas ref={canvasRef} className="cinematic-canvas" aria-hidden />

        {/* layer 4 — vignette on top of everything decorative */}
        <div className="cinematic-vignette" aria-hidden />

        {/* layer 5 — AI HUD readout (only after scroll begins) */}
        <div
          ref={readoutRef}
          className="pointer-events-none absolute left-[8%] top-[28%] hidden md:block"
          aria-hidden
        >
          <CinematicReadout />
        </div>

        {/* layer 6 — signal lock */}
        <div
          ref={lockRef}
          className="pointer-events-none absolute right-[6%] top-[26%] hidden md:block"
          style={{ opacity: 0, transform: "translate3d(0, 16px, 0)", transition: "opacity 0.7s var(--ease-cine), transform 0.7s var(--ease-cine)" }}
          aria-hidden
        >
          <CinematicSignalLock />
        </div>

        {/* layer 10 — foreground content */}
        <div className="relative z-10 mx-auto flex h-full max-w-[1400px] flex-col items-center justify-center px-6 text-center">
          <div ref={markRef} className="cine-fade-up">
            <span className="cinematic-mark">
              <span className="cinematic-mark__bar" />
              <span className="cinematic-mark__dot" />
              <span>Vypexrock · Institutional Intelligence</span>
              <span className="cinematic-mark__bar" />
            </span>
          </div>

          <h1 ref={titleRef} className="cinematic-title cine-fade-up mt-8" style={{ transitionDelay: "0.05s" }}>
            <span className="cinematic-title__line">The market</span>
            <span className="cinematic-title__line cinematic-title__line--accent">speaks first.</span>
            <span className="cinematic-title__line cinematic-title__line--quiet">We listen.</span>
          </h1>

          <div ref={subRef} className="cine-fade-up mt-8 max-w-xl" style={{ transitionDelay: "0.1s" }}>
            <p className="cinematic-sub">
              A cinematic terminal that interprets liquidity, structure, and momentum
              as a single, breathing organism.
            </p>
          </div>

          <div ref={ctaRef} className="cine-fade-up mt-12 flex items-center gap-8" style={{ transitionDelay: "0.2s" }}>
            <Link href="/terminal" className="cinematic-cta">
              <span>Enter terminal</span>
              <svg width="14" height="9" viewBox="0 0 16 10" fill="none" aria-hidden>
                <path d="M1 5h13m0 0L10 1m4 4l-4 4" stroke="currentColor" strokeWidth="1" />
              </svg>
            </Link>
            <Link href="/chart-analyzer" className="cinematic-cta-quiet">
              Analyse a chart
            </Link>
          </div>

          <div
            ref={hintRef}
            className="cine-fade-up absolute bottom-10 left-1/2 -translate-x-1/2"
            style={{ transitionDelay: "0.3s" }}
          >
            <div className="cinematic-scroll-hint" aria-hidden>
              <span className="cinematic-scroll-hint__line" />
              <span className="cinematic-scroll-hint__label">Scroll to begin</span>
            </div>
          </div>
        </div>
      </div>

      {/* spacer drives the scroll progress */}
      <div aria-hidden style={{ height: "80vh" }} />
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
// AI READOUT — staged via CSS-only delays
// ─────────────────────────────────────────────────────────────────
function CinematicReadout() {
  const phrases = [
    "scanning liquidity",
    "structure shift detected",
    "momentum aligning · 1H · 4H",
    "confidence rising",
  ];
  return (
    <div className="cinematic-readout">
      {phrases.map((txt, i) => (
        <span
          key={i}
          className="cinematic-readout__line"
          style={{ transitionDelay: `${0.1 + i * 0.18}s` }}
        >
          <span className="cinematic-readout__pulse" />
          {txt}
        </span>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SIGNAL LOCK
// ─────────────────────────────────────────────────────────────────
function CinematicSignalLock() {
  return (
    <div className="cinematic-signal-lock" aria-hidden>
      <div className="cinematic-signal-lock__label">SIGNAL LOCKED</div>
      <div className="cinematic-signal-lock__value" data-conf>72%</div>
      <div className="cinematic-signal-lock__bar">
        <span data-conf-bar style={{ width: "72%" }} />
      </div>
      <div className="cinematic-signal-lock__meta">
        <span>BTCUSDT</span>
        <span className="cinematic-signal-lock__sep" />
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

function generateCandles(count: number, startPrice: number) {
  // deterministic seed for stability — no SSR/CSR mismatch and no jumps on remount
  const out: { open: number; high: number; low: number; close: number }[] = [];
  let p = startPrice;
  let trend = 0;
  let seed = 0xC0FFEE;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
  for (let i = 0; i < count; i++) {
    trend += (rnd() - 0.46) * 30;
    const drift = Math.sin(i / 9) * 220 + Math.cos(i / 21) * 80 + trend;
    const vol = 70 + rnd() * 220;
    const open = p + drift * 0.04;
    const close = open + (rnd() - 0.45) * vol;
    const high = Math.max(open, close) + rnd() * vol * 0.6;
    const low = Math.min(open, close) - rnd() * vol * 0.6;
    out.push({ open, high, low, close });
    p = close;
  }
  return out;
}
