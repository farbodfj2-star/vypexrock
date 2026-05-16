"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

/**
 * Cinematic Acts v2 — no per-scroll React re-renders.
 *
 * Each act:
 *   • observes its sticky container with IntersectionObserver
 *   • toggles `.is-in` once when crossing 25% threshold
 *   • CSS transitions handle the reveal — smooth, predictable
 *   • canvases run a single rAF loop with deterministic data
 */

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = el.querySelectorAll<HTMLElement>(".cine-fade-up, .cinematic-headline, .cinematic-vision-text, .cinematic-vision-label, .cinematic-orbit-stage, .cinematic-orbit-text, .cinematic-risk-text, .cinematic-number, .cinematic-invite, .cinematic-act__bg-line");
    if (!targets.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("is-in");
          }
        });
      },
      { threshold: 0.25, rootMargin: "0px 0px -10% 0px" },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);
  return ref;
}

// ─────────────────────────────────────────────────────────────────
// ACT I — Silence becomes signal
// ─────────────────────────────────────────────────────────────────
export function ActSilenceBecomesSignal() {
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} className="cinematic-act cinematic-act--breathe">
      <div className="cinematic-act__sticky">
        <div className="cinematic-act__bg-line" style={{ transitionDuration: "1.6s" }} />
        <p className="cinematic-headline cine-fade-up" style={{ transitionDelay: "0s" }}>Silence</p>
        <p className="cinematic-headline cinematic-headline--quiet cine-fade-up" style={{ transitionDelay: "0.25s" }}>becomes</p>
        <p className="cinematic-headline cinematic-headline--accent cine-fade-up" style={{ transitionDelay: "0.5s" }}>signal.</p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
// ACT II — Liquidity vision
// ─────────────────────────────────────────────────────────────────
export function ActLiquidityVision() {
  const ref = useReveal<HTMLElement>();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
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

    let frame = 0;
    let stopped = false;

    const tick = () => {
      if (stopped) return;
      frame++;
      ctx.clearRect(0, 0, w, h);

      // soft horizon
      const grad = ctx.createRadialGradient(w / 2, h * 0.55, 10, w / 2, h * 0.55, w * 0.5);
      grad.addColorStop(0, "rgba(125, 211, 252, 0.05)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // flowing liquidity ribbons
      for (let layer = 0; layer < 4; layer++) {
        const y0 = h * (0.38 + layer * 0.06);
        ctx.save();
        ctx.globalAlpha = 0.42 - layer * 0.08;
        ctx.strokeStyle = `rgba(125, 211, 252, ${0.45 - layer * 0.08})`;
        ctx.lineWidth = 1.1 - layer * 0.15;
        ctx.shadowColor = "rgba(56, 189, 248, 0.45)";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        const points = 80;
        for (let i = 0; i <= points; i++) {
          const t = i / points;
          const x = t * w;
          const wave = Math.sin(t * Math.PI * 4 + frame * 0.01 + layer) * 16
            + Math.sin(t * Math.PI * 7 + frame * 0.014 + layer * 1.7) * 8;
          const y = y0 + wave;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // institutional levels
      const levels = [
        { yp: 0.3, color: "110, 231, 183" },
        { yp: 0.7, color: "253, 164, 175" },
      ];
      levels.forEach((lv) => {
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.strokeStyle = `rgba(${lv.color}, 0.65)`;
        ctx.lineWidth = 0.6;
        ctx.setLineDash([2, 8]);
        ctx.beginPath();
        ctx.moveTo(0, h * lv.yp);
        ctx.lineTo(w, h * lv.yp);
        ctx.stroke();
        ctx.restore();
      });

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
    <section ref={ref} className="cinematic-act cinematic-act--vision">
      <div className="cinematic-act__sticky">
        <canvas ref={canvasRef} className="cinematic-vision-canvas" />

        <div className="cinematic-vision-label cinematic-vision-label--top cine-fade-up">
          <span className="cinematic-vision-label__dot" />
          sell-side liquidity
        </div>
        <div className="cinematic-vision-label cinematic-vision-label--bottom cine-fade-up" style={{ transitionDelay: "0.15s" }}>
          <span className="cinematic-vision-label__dot cinematic-vision-label__dot--rose" />
          buy-side liquidity
        </div>

        <div className="cinematic-vision-text cine-fade-up" style={{ transitionDelay: "0.3s" }}>
          <p className="cinematic-vision-kicker">CHAPTER 01</p>
          <h2 className="cinematic-vision-headline">
            Where others see candles,
            <br />
            <em>we see currents.</em>
          </h2>
          <p className="cinematic-vision-body">
            Liquidity flows beneath every move. The system surfaces it before the chart admits it.
          </p>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
// ACT III — Multi-timeframe orbit
// ─────────────────────────────────────────────────────────────────
export function ActOrbit() {
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} className="cinematic-act cinematic-act--orbit">
      <div className="cinematic-act__sticky">
        <div className="cinematic-orbit-stage cine-fade-up">
          <div className="cinematic-orbit-ring cinematic-orbit-ring--1" />
          <div className="cinematic-orbit-ring cinematic-orbit-ring--2" />
          <div className="cinematic-orbit-ring cinematic-orbit-ring--3" />
          <div className="cinematic-orbit-spinner">
            <span className="cinematic-orbit-node">15m</span>
            <span className="cinematic-orbit-node">1H</span>
            <span className="cinematic-orbit-node">4H</span>
          </div>
          <div className="cinematic-orbit-core" style={{ transform: "translate(-50%, -50%)" }}>
            <span className="cinematic-orbit-core__label">aligned</span>
            <span className="cinematic-orbit-core__value">88%</span>
          </div>
        </div>

        <div className="cinematic-orbit-text cine-fade-up" style={{ transitionDelay: "0.2s" }}>
          <p className="cinematic-vision-kicker">CHAPTER 02</p>
          <h2 className="cinematic-vision-headline">
            Three timeframes.
            <br />
            <em>One truth.</em>
          </h2>
          <p className="cinematic-vision-body">
            Entry, momentum, trend. Nothing fires until the geometry locks.
          </p>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
// ACT IV — Risk engine
// ─────────────────────────────────────────────────────────────────
export function ActRisk() {
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} className="cinematic-act cinematic-act--risk">
      <div className="cinematic-act__sticky">
        <div className="cinematic-risk-grid">
          <div className="cinematic-risk-text cine-fade-up">
            <p className="cinematic-vision-kicker">CHAPTER 03</p>
            <h2 className="cinematic-vision-headline">
              Discipline,
              <br />
              <em>engineered.</em>
            </h2>
            <p className="cinematic-vision-body">
              Position size, portfolio heat, correlation — calculated before you see the
              entry. The system protects what the human forgets.
            </p>
          </div>

          <div className="cinematic-risk-numbers">
            <div className="cinematic-number cine-fade-up" style={{ transitionDelay: "0.15s" }}>
              <span className="cinematic-number__label">position</span>
              <span className="cinematic-number__value">2.5%</span>
              <span className="cinematic-number__suffix">per trade</span>
            </div>
            <div className="cinematic-number cinematic-number--graphite cine-fade-up" style={{ transitionDelay: "0.3s" }}>
              <span className="cinematic-number__label">heat</span>
              <span className="cinematic-number__value">8.2%</span>
              <span className="cinematic-number__suffix">active</span>
            </div>
            <div className="cinematic-number cinematic-number--cyan cine-fade-up" style={{ transitionDelay: "0.45s" }}>
              <span className="cinematic-number__label">r:r</span>
              <span className="cinematic-number__value">1:3.2</span>
              <span className="cinematic-number__suffix">median</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
// ACT V — Invitation
// ─────────────────────────────────────────────────────────────────
export function ActInvitation() {
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} className="cinematic-act cinematic-act--invitation">
      <div className="cinematic-act__sticky">
        <div className="cinematic-invite cine-fade-up">
          <p className="cinematic-invite__eyebrow">FINAL FRAME</p>
          <h2 className="cinematic-invite__title">The terminal is open.</h2>
          <p className="cinematic-invite__sub">Step inside the machine.</p>
          <div className="cinematic-invite__actions">
            <Link href="/terminal" className="cinematic-cta cinematic-cta--strong">
              <span>Enter terminal</span>
              <svg width="16" height="10" viewBox="0 0 18 10" fill="none" aria-hidden>
                <path d="M1 5h15m0 0L12 1m4 4l-4 4" stroke="currentColor" strokeWidth="1" />
              </svg>
            </Link>
            <Link href="/pricing" className="cinematic-cta-quiet">
              See plans
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
