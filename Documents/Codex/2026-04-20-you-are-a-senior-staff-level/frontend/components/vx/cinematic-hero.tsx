"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { MarketTicker } from "@/types";

type CinematicHeroProps = {
  rows: MarketTicker[];
};

/**
 * Cinematic Hero v4 — directed opening + scroll-driven RISK→RICH transformation.
 *
 *   t=0.00s   black, dust drifts in
 *   t=0.40s   "VYPEXROCK" word-reveal (mask-up, ONE word)
 *   t=1.20s   horizon line scans
 *   t=1.60s   BIGGER BTC chart materializes
 *   t=2.40s   ticker tape, side rails, HUD lines
 *   t=2.80s   tagline
 *   t=3.40s   CTAs + scroll hint
 *
 * On scroll:
 *   0–40%     chart pans horizontally, hero copy stays
 *   40–100%   chart slides DOWN with scroll (literally follows mouse-wheel),
 *             RISK typing emerges, transforms into RICH,
 *             chart fades to dim background as RICH dominates
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
  const richRef = useRef<HTMLDivElement>(null);
  const richTextRef = useRef<HTMLSpanElement>(null);
  const richCaptionRef = useRef<HTMLDivElement>(null);
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

  // ─── SCROLL PROGRESS + RICH typing trigger ───
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let raf = 0;
    let typingFired = false;

    const update = () => {
      const rect = stage.getBoundingClientRect();
      const total = rect.height + window.innerHeight;
      const scrolled = window.innerHeight - rect.top;
      const p = Math.max(0, Math.min(1, scrolled / total));
      stage.style.setProperty("--hero-progress", p.toFixed(4));

      // Reveal RICH overlay when scroll passes ~35%
      if (richRef.current) {
        if (p > 0.32) richRef.current.classList.add("is-in");
        else richRef.current.classList.remove("is-in");
      }

      // Trigger the RISK→RICH typing once when overlay first reveals
      if (!typingFired && p > 0.35 && richTextRef.current && richCaptionRef.current) {
        typingFired = true;
        runRichTyping(richTextRef.current, richCaptionRef.current);
      }
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

  // ─── CHART CANVAS — bigger candles, scroll-scrub ───
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

    const TOTAL = 200;
    const candles = generateCandles(TOTAL, 47000);
    const VISIBLE = 64; // ⬅ was 100. Fewer visible → bigger candles.

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
      // chart visible from intro 0.34 onwards. Fade out as RICH dominates (>0.55 progress).
      const fadeOut = smoothstep(0.55, 0.95, heroP);
      const chartReveal = smoothstep(0.34, 1.0, intro) * (1 - fadeOut * 0.85);

      ctx.clearRect(0, 0, w, h);
      if (chartReveal <= 0.005) {
        raf = requestAnimationFrame(tick);
        return;
      }

      // pan progress only uses the first ~55% of scroll, then freezes
      const panT = Math.min(1, heroP / 0.55);
      const candleStart = (TOTAL - VISIBLE) * panT;

      const cw = (w / VISIBLE) * 0.7; // ⬅ was 0.55. Bigger candle bodies.
      const cs = w / VISIBLE;

      const priceY = (price: number) => {
        const top = h * 0.22;
        const bottom = h * 0.78;
        return top + (bottom - top) * (1 - (price - minP + pad) / range);
      };

      // ── ambient floor glow ──
      const fog = ctx.createRadialGradient(w / 2, h * 0.55, 20, w / 2, h * 0.55, w * 0.55);
      fog.addColorStop(0, `rgba(125, 211, 252, ${0.05 * chartReveal})`);
      fog.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, w, h);

      // ── perspective floor grid ──
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

      // ── liquidity zones ──
      const liqGate = smoothstep(0.04, 0.22, heroP);
      if (liqGate > 0.01) {
        const zones = [
          { y: priceY(minP + range * 0.78), color: "110, 231, 183" },
          { y: priceY(minP + range * 0.32), color: "253, 164, 175" },
        ];
        zones.forEach((z) => {
          ctx.save();
          ctx.globalAlpha = 0.18 * chartReveal * liqGate;
          const zg = ctx.createLinearGradient(0, z.y - 22, 0, z.y + 22);
          zg.addColorStop(0, "rgba(0,0,0,0)");
          zg.addColorStop(0.5, `rgba(${z.color}, 0.55)`);
          zg.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = zg;
          ctx.fillRect(0, z.y - 22, w, 44);
          ctx.globalAlpha = 0.5 * chartReveal * liqGate;
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

      // ── candles (BIGGER, brighter) ──
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

        const t = i / VISIBLE;
        const edgeFade = Math.min(smoothstep(0, 0.08, t), smoothstep(1, 0.92, t));
        const localOp = chartReveal * edgeFade;

        ctx.save();
        // wick (thicker for bigger candles)
        ctx.globalAlpha = 0.7 * localOp;
        ctx.strokeStyle = isUp ? "rgba(110, 231, 183, 0.9)" : "rgba(252, 165, 165, 0.9)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x, hy);
        ctx.lineTo(x, ly);
        ctx.stroke();

        const focus = i > VISIBLE * 0.55 && i < VISIBLE * 0.95 ? 1.25 : 1;
        ctx.shadowColor = isUp ? "rgba(16, 185, 129, 0.55)" : "rgba(244, 63, 94, 0.55)";
        ctx.shadowBlur = 14 * focus;
        ctx.fillStyle = isUp
          ? `rgba(16, 185, 129, ${0.92 * localOp})`
          : `rgba(239, 68, 68, ${0.92 * localOp})`;
        const bh = Math.max(2.5, Math.abs(cy - oy));
        ctx.fillRect(x - cw / 2, Math.min(oy, cy), cw, bh);
        ctx.restore();
      }

      // ── live price chip ──
      const rightIdx = Math.min(TOTAL - 1, startIdx + VISIBLE - 1);
      const rightCandle = candles[rightIdx];
      const rightX = (VISIBLE - 1) * cs + cs / 2 - subPixel;
      const rightY = priceY(rightCandle.close);
      const isUpRight = rightCandle.close >= rightCandle.open;

      ctx.save();
      ctx.globalAlpha = chartReveal;
      ctx.strokeStyle = isUpRight ? "rgba(110, 231, 183, 0.5)" : "rgba(252, 165, 165, 0.5)";
      ctx.lineWidth = 0.6;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(rightX, rightY);
      ctx.lineTo(w - 70, rightY);
      ctx.stroke();
      ctx.setLineDash([]);

      const pulse = (Math.sin(frame * 0.06) + 1) / 2;
      ctx.fillStyle = isUpRight ? `rgba(110, 231, 183, ${0.6 + pulse * 0.4})` : `rgba(252, 165, 165, ${0.6 + pulse * 0.4})`;
      ctx.shadowColor = isUpRight ? "rgba(16, 185, 129, 0.95)" : "rgba(244, 63, 94, 0.95)";
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(rightX, rightY, 3 + pulse * 1.6, 0, Math.PI * 2);
      ctx.fill();

      const priceChip = "$" + Math.round(rightCandle.close).toLocaleString();
      ctx.shadowBlur = 0;
      ctx.font = "12px ui-monospace, SF Mono, monospace";
      const chipW = ctx.measureText(priceChip).width + 16;
      ctx.fillStyle = "rgba(6, 8, 13, 0.88)";
      ctx.strokeStyle = isUpRight ? "rgba(110, 231, 183, 0.55)" : "rgba(252, 165, 165, 0.55)";
      ctx.lineWidth = 1;
      const chipX = w - 14 - chipW;
      const chipY = rightY - 12;
      roundRect(ctx, chipX, chipY, chipW, 24, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = isUpRight ? "rgba(167, 243, 208, 1)" : "rgba(254, 205, 211, 1)";
      ctx.fillText(priceChip, chipX + 8, chipY + 16);
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
      style={{ minHeight: "320vh" }}
    >
      <div className="sticky top-0 flex h-screen w-full flex-col overflow-hidden">
        {/* layer 1 — soft ambient */}
        <div className="cinematic-ambient" aria-hidden />

        {/* layer 2 — horizon */}
        <div ref={horizonRef} className="cinematic-horizon" aria-hidden />

        {/* layer 3 — chart canvas (slides DOWN with scroll past 40%) */}
        <canvas ref={canvasRef} className="cinematic-canvas cinematic-canvas--scroll" aria-hidden />

        {/* layer 4 — vignette */}
        <div className="cinematic-vignette" aria-hidden />

        {/* layer 5/6 — side rails */}
        <div ref={railLeftRef} className="cinematic-rail cinematic-rail--left" aria-hidden>
          <span className="cinematic-rail__line" />
          <span className="cinematic-rail__label">MARKETS · LIVE FEED</span>
          <span className="cinematic-rail__line" />
        </div>
        <div ref={railRightRef} className="cinematic-rail cinematic-rail--right" aria-hidden>
          <span className="cinematic-rail__line" />
          <span className="cinematic-rail__label">02 · OPENING SEQUENCE</span>
          <span className="cinematic-rail__line" />
        </div>

        {/* layer 7 — ticker */}
        <div ref={tickerRef} className="cinematic-ticker" aria-hidden>
          <CinematicTicker />
        </div>

        {/* layer 8/9 — fixed HUDs */}
        <div ref={readoutRef} className="cinematic-readout-fixed" aria-hidden>
          <div className="cinematic-readout">
            <span className="cinematic-readout__line"><span className="cinematic-readout__pulse" />scanning structure</span>
            <span className="cinematic-readout__line" style={{ transitionDelay: "0.18s" }}><span className="cinematic-readout__pulse" />liquidity mapped · 4 zones</span>
            <span className="cinematic-readout__line" style={{ transitionDelay: "0.36s" }}><span className="cinematic-readout__pulse" />confidence · 88%</span>
          </div>
        </div>
        <div ref={lockRef} className="cinematic-signal-fixed" aria-hidden>
          <CinematicSignalLock />
        </div>

        {/* RICH OVERLAY — appears at scroll > 35%, types RISK then morphs to RICH */}
        <div ref={richRef} className="cinematic-rich" aria-hidden>
          <div className="cinematic-rich__inner">
            <div ref={richCaptionRef} className="cinematic-rich__caption">
              <span className="cinematic-rich__caption-bar" />
              <span>FROM</span>
            </div>
            <div className="cinematic-rich__word">
              <span ref={richTextRef} className="cinematic-rich__text">R</span>
              <span className="cinematic-rich__cursor" />
            </div>
            <p className="cinematic-rich__sub">discipline turns the market into your engine.</p>
          </div>
        </div>

        {/* foreground content */}
        <div className="cinematic-fg-stack relative z-10 mx-auto flex h-full w-full max-w-[1400px] flex-col items-center justify-center px-6 text-center">
          <div ref={wordmarkRef} className="cinematic-wordmark">
            <span className="cinematic-wordmark__mask">
              <span className="cinematic-wordmark__text">VYPEXROCK</span>
            </span>
            <span className="cinematic-wordmark__sub">INSTITUTIONAL CRYPTO INTELLIGENCE</span>
          </div>

          <div ref={taglineRef} className="cine-fade-up cinematic-tagline">
            <p>The market speaks first.</p>
            <p className="cinematic-tagline__quiet">We listen.</p>
          </div>

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

          <div ref={hintRef} className="cine-fade-up cinematic-scroll-hint-fixed" style={{ transitionDelay: "0.15s" }}>
            <div className="cinematic-scroll-hint" aria-hidden>
              <span className="cinematic-scroll-hint__line" />
              <span className="cinematic-scroll-hint__label">Scroll · 120fps</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
// RISK → RICH typing logic
// ─────────────────────────────────────────────────────────────────
function runRichTyping(textEl: HTMLElement, captionEl: HTMLElement) {
  // sequence:
  //   type R, I, S, K  →  "RISK"
  //   pause
  //   delete K, S      →  "RI"
  //   pause briefly, change caption "FROM" → "TO"
  //   type C, H        →  "RICH"
  type Step =
    | { kind: "type"; char: string; delay: number }
    | { kind: "del"; delay: number }
    | { kind: "wait"; delay: number }
    | { kind: "caption"; text: string; delay: number };

  const seq: Step[] = [
    { kind: "type", char: "R", delay: 220 },
    { kind: "type", char: "I", delay: 220 },
    { kind: "type", char: "S", delay: 220 },
    { kind: "type", char: "K", delay: 220 },
    { kind: "wait", delay: 1200 },
    { kind: "del", delay: 220 }, // remove K
    { kind: "del", delay: 220 }, // remove S
    { kind: "caption", text: "TO", delay: 280 },
    { kind: "type", char: "C", delay: 240 },
    { kind: "type", char: "H", delay: 280 },
  ];

  textEl.textContent = "";
  captionEl.querySelector("span:last-child")!.textContent = "FROM";

  let cursor = "";
  let i = 0;

  const next = () => {
    if (i >= seq.length) {
      textEl.classList.add("is-final");
      return;
    }
    const step = seq[i++];
    if (step.kind === "type") {
      cursor += step.char;
      textEl.textContent = cursor;
    } else if (step.kind === "del") {
      cursor = cursor.slice(0, -1);
      textEl.textContent = cursor;
    } else if (step.kind === "caption") {
      const span = captionEl.querySelector("span:last-child")!;
      span.textContent = step.text;
    }
    setTimeout(next, step.delay);
  };
  next();
}

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
    { sym: "PEPE", px: "0.00000843", chg: "+5.68%", up: true },
  ];
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
