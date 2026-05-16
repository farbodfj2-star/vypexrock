"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { MarketTicker } from "@/types";

type CinematicHeroProps = {
  rows: MarketTicker[];
};

/**
 * Cinematic Hero v3 — directed opening:
 *
 *   t=0.00s   black, dust drifts in
 *   t=0.40s   "VYPEXROCK" word-reveal (mask-up, ONE word, ONE animation)
 *   t=1.20s   horizon line scans across
 *   t=1.60s   BTC chart materializes underneath
 *   t=2.40s   ticker tape, side rails, scan dot, hud lines
 *   t=2.80s   tagline
 *   t=3.40s   CTAs + scroll hint
 *
 * On scroll: candles pan horizontally (parallax), HUDs fade, vignette tightens.
 *
 * Engineering rules unchanged from v2:
 *   • All motion via CSS variables on a single rAF.
 *   • Zero React state for scroll/mouse motion.
 *   • Deterministic candles.
 */
const INTRO_MS = 4200;

export function CinematicHero({ rows: _rows }: CinematicHeroProps) {
  const stageRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const horizonRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const tickerRef = useRef<HTMLDivElement>(null);
  const railLeftRef = useRef<HTMLDivElement>(null);
  const railRightRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef<HTMLDivElement>(null);
  const [, setReady] = useState(false);

  // ─── INTRO TIMELINE ───
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const reveals: Array<[number, React.RefObject<HTMLElement>]> = [
      [0.4, wordmarkRef as any],
      [1.2, horizonRef as any],
      [2.4, tickerRef as any],
      [2.5, railLeftRef as any],
      [2.5, railRightRef as any],
      [2.6, readoutRef as any],
      [2.6, lockRef as any],
      [2.8, taglineRef as any],
      [3.4, ctaRef as any],
      [3.7, hintRef as any],
    ];

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const skip = sessionStorage.getItem("vx-intro-played") === "1" || reduceMotion;

    if (skip) {
      stage.style.setProperty("--intro", "1");
      reveals.forEach(([, ref]) => ref.current?.classList.add("is-in"));
      setReady(true);
      return;
    }

    const start = performance.now();
    let raf = 0;
    const fired = new Set<number>();

    const step = (now: number) => {
      const elapsed = (now - start) / 1000;
      const t = Math.min(1, (elapsed * 1000) / INTRO_MS);
      const eased = 1 - Math.pow(1 - t, 1.6);
      stage.style.setProperty("--intro", eased.toFixed(4));

      reveals.forEach(([at, ref], i) => {
        if (!fired.has(i) && elapsed >= at && ref.current) {
          ref.current.classList.add("is-in");
          fired.add(i);
        }
      });

      if (t < 1) raf = requestAnimationFrame(step);
      else {
        try { sessionStorage.setItem("vx-intro-played", "1"); } catch {}
        setReady(true);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ─── MOUSE PARALLAX ───
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let tx = 0, ty = 0, cx = 0, cy = 0;

    const onMove = (e: MouseEvent) => {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
    };

    const tick = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      stage.style.setProperty("--mx", cx.toFixed(4));
      stage.style.setProperty("--my", cy.toFixed(4));
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  // ─── SCROLL PROGRESS — drives chart scrub + HUD fade ───
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let raf = 0;

    const update = () => {
      const rect = stage.getBoundingClientRect();
      const total = rect.height + window.innerHeight;
      const scrolled = window.innerHeight - rect.top;
      const p = Math.max(0, Math.min(1, scrolled / total));
      stage.style.setProperty("--hero-progress", p.toFixed(4));
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // ─── CHART CANVAS — scroll-scrub candles like film reel ───
  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0;
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

    // Generate a longer candle array — extra candles offstage right
    // so scrolling pans the chart and reveals new candles continuously.
    const TOTAL = 220;
    const candles = generateCandles(TOTAL, 47000);
    const VISIBLE = 100;

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
      // chart appears at ~1.6s into intro
      const chartReveal = smoothstep(0.34, 1.0, intro) * (1 - smoothstep(0.85, 1.0, heroP) * 0.6);

      ctx.clearRect(0, 0, w, h);
      if (chartReveal <= 0.01) {
        raf = requestAnimationFrame(tick);
        return;
      }

      // Scroll-scrub: pan candles left as scroll progresses
      // 0.0 progress → showing candles 0..VISIBLE
      // 1.0 progress → showing candles (TOTAL - VISIBLE)..TOTAL
      const candleStart = (TOTAL - VISIBLE) * heroP;

      const cw = (w / VISIBLE) * 0.55;
      const cs = w / VISIBLE;

      const priceY = (price: number) => {
        const top = h * 0.28;
        const bottom = h * 0.78;
        return top + (bottom - top) * (1 - (price - minP + pad) / range);
      };

      // ── ambient floor glow ──
      const fog = ctx.createRadialGradient(w / 2, h * 0.55, 20, w / 2, h * 0.55, w * 0.55);
      fog.addColorStop(0, `rgba(125, 211, 252, ${0.05 * chartReveal})`);
      fog.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, w, h);

      // ── perspective floor grid (slow scroll-aware drift) ──
      ctx.save();
      ctx.strokeStyle = "rgba(125, 211, 252, 0.16)";
      ctx.lineWidth = 0.5;
      const horizonY = h * 0.86;
      for (let i = 0; i < 14; i++) {
        const y = horizonY + Math.pow(i, 1.4) * 4;
        if (y > h) break;
        ctx.globalAlpha = (0.12 - i * 0.008) * chartReveal;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      // verticals scrolling left
      const stepV = w / 22;
      const vOffset = -((heroP * w * 1.5) % stepV);
      for (let i = -1; i < 24; i++) {
        const x = i * stepV + vOffset;
        ctx.globalAlpha = 0.05 * chartReveal;
        ctx.beginPath();
        ctx.moveTo(x, horizonY);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      ctx.restore();

      // ── liquidity zones (gated by scroll) ──
      const liqGate = smoothstep(0.04, 0.22, heroP);
      if (liqGate > 0.01) {
        const zones = [
          { y: priceY(minP + range * 0.78), color: "110, 231, 183" },
          { y: priceY(minP + range * 0.32), color: "253, 164, 175" },
        ];
        zones.forEach((z) => {
          ctx.save();
          ctx.globalAlpha = 0.18 * chartReveal * liqGate;
          const zg = ctx.createLinearGradient(0, z.y - 18, 0, z.y + 18);
          zg.addColorStop(0, "rgba(0,0,0,0)");
          zg.addColorStop(0.5, `rgba(${z.color}, 0.5)`);
          zg.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = zg;
          ctx.fillRect(0, z.y - 18, w, 36);
          ctx.globalAlpha = 0.5 * chartReveal * liqGate;
          ctx.strokeStyle = `rgba(${z.color}, 0.6)`;
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

      // ── candles (with sub-pixel scroll-scrub) ──
      const startIdx = Math.floor(candleStart);
      const subPixel = (candleStart - startIdx) * cs;

      for (let i = -1; i < VISIBLE + 1; i++) {
        const idx = startIdx + i;
        if (idx < 0 || idx >= TOTAL) continue;
        const c = candles[idx];
        const x = i * cs + cs / 2 - subPixel;
        if (x < -cw || x > w + cw) continue;
        const isUp = c.close >= c.open;
        const oy = priceY(c.open);
        const cy = priceY(c.close);
        const hy = priceY(c.high);
        const ly = priceY(c.low);

        // edge fade — left & right edges blur out
        const t = i / VISIBLE;
        const edgeFade = Math.min(
          smoothstep(0, 0.08, t),
          smoothstep(1, 0.92, t),
        );
        const localOp = chartReveal * edgeFade;

        // wick
        ctx.save();
        ctx.globalAlpha = 0.6 * localOp;
        ctx.strokeStyle = isUp ? "rgba(110, 231, 183, 0.85)" : "rgba(252, 165, 165, 0.85)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, hy);
        ctx.lineTo(x, ly);
        ctx.stroke();

        // body — focus zone in middle 1/3 brighter
        const focus = i > VISIBLE * 0.55 && i < VISIBLE * 0.95 ? 1.15 : 1;
        ctx.shadowColor = isUp ? "rgba(16, 185, 129, 0.4)" : "rgba(244, 63, 94, 0.4)";
        ctx.shadowBlur = 10 * focus;
        ctx.fillStyle = isUp
          ? `rgba(16, 185, 129, ${0.85 * localOp})`
          : `rgba(239, 68, 68, ${0.85 * localOp})`;
        const bh = Math.max(1.5, Math.abs(cy - oy));
        ctx.fillRect(x - cw / 2, Math.min(oy, cy), cw, bh);
        ctx.restore();
      }

      // ── live price marker on rightmost visible candle ──
      const rightIdx = Math.min(TOTAL - 1, startIdx + VISIBLE - 1);
      const rightCandle = candles[rightIdx];
      const rightX = (VISIBLE - 1) * cs + cs / 2 - subPixel;
      const rightY = priceY(rightCandle.close);
      const isUpRight = rightCandle.close >= rightCandle.open;

      ctx.save();
      ctx.globalAlpha = chartReveal;
      // dotted line to right edge
      ctx.strokeStyle = isUpRight ? "rgba(110, 231, 183, 0.5)" : "rgba(252, 165, 165, 0.5)";
      ctx.lineWidth = 0.6;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(rightX, rightY);
      ctx.lineTo(w - 60, rightY);
      ctx.stroke();
      ctx.setLineDash([]);

      // pulsing dot
      const pulse = (Math.sin(frame * 0.06) + 1) / 2;
      ctx.fillStyle = isUpRight ? `rgba(110, 231, 183, ${0.5 + pulse * 0.4})` : `rgba(252, 165, 165, ${0.5 + pulse * 0.4})`;
      ctx.shadowColor = isUpRight ? "rgba(16, 185, 129, 0.9)" : "rgba(244, 63, 94, 0.9)";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(rightX, rightY, 2 + pulse * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // floating price chip
      const priceChip = "$" + Math.round(rightCandle.close).toLocaleString();
      ctx.shadowBlur = 0;
      ctx.font = "11px ui-monospace, SF Mono, monospace";
      const chipW = ctx.measureText(priceChip).width + 14;
      ctx.fillStyle = "rgba(6, 8, 13, 0.85)";
      ctx.strokeStyle = isUpRight ? "rgba(110, 231, 183, 0.5)" : "rgba(252, 165, 165, 0.5)";
      ctx.lineWidth = 1;
      const chipX = w - 12 - chipW;
      const chipY = rightY - 11;
      roundRect(ctx, chipX, chipY, chipW, 22, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = isUpRight ? "rgba(167, 243, 208, 1)" : "rgba(254, 205, 211, 1)";
      ctx.fillText(priceChip, chipX + 7, chipY + 15);
      ctx.restore();

      raf = requestAnimationFrame(tick);
    };

    let raf = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <section
      ref={stageRef}
      className="cinematic-hero-stage relative w-full overflow-hidden"
      style={{ minHeight: "260vh" }}
    >
      <div className="sticky top-0 flex h-screen w-full flex-col overflow-hidden">
        {/* layer 1 — soft ambient glow */}
        <div className="cinematic-ambient" aria-hidden />

        {/* layer 2 — horizon line that scans in */}
        <div ref={horizonRef} className="cinematic-horizon" aria-hidden />

        {/* layer 3 — chart canvas */}
        <canvas ref={canvasRef} className="cinematic-canvas" aria-hidden />

        {/* layer 4 — vignette */}
        <div className="cinematic-vignette" aria-hidden />

        {/* layer 5 — left side rail (vertical text) */}
        <div ref={railLeftRef} className="cinematic-rail cinematic-rail--left" aria-hidden>
          <span className="cinematic-rail__line" />
          <span className="cinematic-rail__label">MARKETS · LIVE FEED</span>
          <span className="cinematic-rail__line" />
        </div>

        {/* layer 6 — right side rail */}
        <div ref={railRightRef} className="cinematic-rail cinematic-rail--right" aria-hidden>
          <span className="cinematic-rail__line" />
          <span className="cinematic-rail__label">02 · OPENING SEQUENCE</span>
          <span className="cinematic-rail__line" />
        </div>

        {/* layer 7 — top ticker tape */}
        <div ref={tickerRef} className="cinematic-ticker" aria-hidden>
          <CinematicTicker />
        </div>

        {/* layer 8 — readout HUD bottom-left */}
        <div ref={readoutRef} className="cinematic-readout-fixed" aria-hidden>
          <div className="cinematic-readout">
            <span className="cinematic-readout__line"><span className="cinematic-readout__pulse" />scanning structure</span>
            <span className="cinematic-readout__line" style={{ transitionDelay: "0.18s" }}><span className="cinematic-readout__pulse" />liquidity mapped · 4 zones</span>
            <span className="cinematic-readout__line" style={{ transitionDelay: "0.36s" }}><span className="cinematic-readout__pulse" />confidence · 88%</span>
          </div>
        </div>

        {/* layer 9 — signal lock bottom-right */}
        <div ref={lockRef} className="cinematic-signal-fixed" aria-hidden>
          <CinematicSignalLock />
        </div>

        {/* layer 10 — foreground content */}
        <div className="relative z-10 mx-auto flex h-full w-full max-w-[1400px] flex-col items-center justify-center px-6 text-center">
          {/* the wordmark — appears FIRST as one mask reveal, no typing */}
          <div ref={wordmarkRef} className="cinematic-wordmark">
            <span className="cinematic-wordmark__mask">
              <span className="cinematic-wordmark__text">VYPEXROCK</span>
            </span>
            <span className="cinematic-wordmark__sub">INSTITUTIONAL CRYPTO INTELLIGENCE</span>
          </div>

          {/* tagline — comes after the chart materializes */}
          <div ref={taglineRef} className="cine-fade-up cinematic-tagline">
            <p>The market speaks first.</p>
            <p className="cinematic-tagline__quiet">We listen.</p>
          </div>

          {/* CTAs */}
          <div ref={ctaRef} className="cine-fade-up cinematic-cta-row" style={{ transitionDelay: "0.1s" }}>
            <Link href="/terminal" className="cinematic-cta cinematic-cta--strong">
              <span>Enter terminal</span>
              <svg width="14" height="9" viewBox="0 0 16 10" fill="none" aria-hidden>
                <path d="M1 5h13m0 0L10 1m4 4l-4 4" stroke="currentColor" strokeWidth="1" />
              </svg>
            </Link>
            <Link href="/chart-analyzer" className="cinematic-cta-quiet">
              Analyse a chart
            </Link>
          </div>

          {/* scroll hint */}
          <div ref={hintRef} className="cine-fade-up cinematic-scroll-hint-fixed" style={{ transitionDelay: "0.15s" }}>
            <div className="cinematic-scroll-hint" aria-hidden>
              <span className="cinematic-scroll-hint__line" />
              <span className="cinematic-scroll-hint__label">Scroll · 120fps</span>
            </div>
          </div>
        </div>
      </div>

      {/* spacer for scroll-scrub */}
      <div aria-hidden style={{ height: "160vh" }} />
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
// Live ticker tape — pure CSS marquee, no JS
// ─────────────────────────────────────────────────────────────────
function CinematicTicker() {
  const items = [
    { sym: "BTC", px: "67,234", chg: "+2.40%", up: true },
    { sym: "ETH", px: "3,845", chg: "+3.12%", up: true },
    { sym: "SOL", px: "164.45", chg: "−1.81%", up: false },
    { sym: "XAU", px: "2,540", chg: "+0.42%", up: true },
    { sym: "BNB", px: "612.50", chg: "+1.20%", up: true },
    { sym: "XRP", px: "1.40", chg: "−0.92%", up: false },
    { sym: "DOGE", px: "0.108", chg: "+1.75%", up: true },
    { sym: "AVAX", px: "39.26", chg: "−0.51%", up: false },
    { sym: "LINK", px: "16.60", chg: "+2.04%", up: true },
    { sym: "INJ", px: "24.62", chg: "+4.12%", up: true },
  ];
  // Duplicate for seamless marquee
  const stream = [...items, ...items];
  return (
    <div className="cinematic-ticker__rail">
      <div className="cinematic-ticker__track">
        {stream.map((it, i) => (
          <span key={i} className="cinematic-ticker__item">
            <span className="cinematic-ticker__sym">{it.sym}</span>
            <span className="cinematic-ticker__px">${it.px}</span>
            <span className={"cinematic-ticker__chg " + (it.up ? "is-up" : "is-dn")}>{it.chg}</span>
            <span className="cinematic-ticker__sep" />
          </span>
        ))}
      </div>
    </div>
  );
}

function CinematicSignalLock() {
  return (
    <div className="cinematic-signal-lock" aria-hidden>
      <div className="cinematic-signal-lock__label">SIGNAL · LOCKED</div>
      <div className="cinematic-signal-lock__value">88%</div>
      <div className="cinematic-signal-lock__bar"><span style={{ width: "88%" }} /></div>
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

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function generateCandles(count: number, startPrice: number) {
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
