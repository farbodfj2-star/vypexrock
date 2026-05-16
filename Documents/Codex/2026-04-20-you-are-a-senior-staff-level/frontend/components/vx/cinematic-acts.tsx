"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────
function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
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

  return [ref, progress] as const;
}

function smoothstep(a: number, b: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

// ─────────────────────────────────────────────────────────────────
// ACT I — "Silence becomes signal" (typography breathes)
// ─────────────────────────────────────────────────────────────────
export function ActSilenceBecomesSignal() {
  const [ref, p] = useScrollProgress<HTMLElement>();

  const op1 = smoothstep(0.05, 0.25, p);
  const op2 = smoothstep(0.2, 0.45, p);
  const op3 = smoothstep(0.4, 0.65, p);
  const opLine = smoothstep(0.55, 0.75, p);

  return (
    <section ref={ref} className="cinematic-act cinematic-act--breathe">
      <div className="cinematic-act__sticky">
        <div className="cinematic-act__bg-line" style={{ transform: `scaleX(${opLine})` }} />
        <p
          className="cinematic-headline cinematic-headline--xl"
          style={{ opacity: op1, transform: `translateY(${(1 - op1) * 20}px)` }}
        >
          Silence
        </p>
        <p
          className="cinematic-headline cinematic-headline--xl cinematic-headline--quiet"
          style={{ opacity: op2, transform: `translateY(${(1 - op2) * 20}px)` }}
        >
          becomes
        </p>
        <p
          className="cinematic-headline cinematic-headline--xl cinematic-headline--accent"
          style={{ opacity: op3, transform: `translateY(${(1 - op3) * 20}px)` }}
        >
          signal.
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
// ACT II — Holographic chart in deep space (no card, full bleed)
// ─────────────────────────────────────────────────────────────────
export function ActLiquidityVision() {
  const [ref, p] = useScrollProgress<HTMLElement>();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const reveal = smoothstep(0.1, 0.55, p);
  const labelOp = smoothstep(0.35, 0.6, p);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    let frame = 0;
    let raf = 0;
    let stop = false;

    // generate flowing liquidity surface
    const points = 80;

    const tick = () => {
      if (stop) return;
      frame++;
      ctx.clearRect(0, 0, w, h);

      // soft horizon
      const grad = ctx.createRadialGradient(w / 2, h * 0.55, 10, w / 2, h * 0.55, w * 0.6);
      grad.addColorStop(0, `rgba(56, 189, 248, ${0.08 * reveal})`);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // flowing liquidity ribbons (like ocean swells)
      for (let layer = 0; layer < 5; layer++) {
        const y0 = h * (0.35 + layer * 0.07);
        ctx.save();
        ctx.globalAlpha = (0.6 - layer * 0.1) * reveal;
        ctx.strokeStyle = `rgba(125, 211, 252, ${0.5 - layer * 0.08})`;
        ctx.lineWidth = 1.2 - layer * 0.15;
        ctx.shadowColor = "rgba(56, 189, 248, 0.6)";
        ctx.shadowBlur = 12;

        ctx.beginPath();
        for (let i = 0; i <= points; i++) {
          const t = i / points;
          const x = t * w;
          const wave =
            Math.sin(t * Math.PI * 4 + frame * 0.012 + layer) * 18 +
            Math.sin(t * Math.PI * 7 + frame * 0.018 + layer * 1.7) * 9;
          const y = y0 + wave;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // institutional level pulses
      const levels = [
        { yp: 0.28, color: "52, 211, 153", tag: "sell-side" },
        { yp: 0.7, color: "244, 63, 94", tag: "buy-side" },
      ];
      levels.forEach((lv) => {
        const y = h * lv.yp;
        const pulse = (Math.sin(frame * 0.04) + 1) / 2;
        ctx.save();
        ctx.globalAlpha = (0.45 + pulse * 0.3) * reveal;
        ctx.strokeStyle = `rgba(${lv.color}, 0.7)`;
        ctx.lineWidth = 0.6;
        ctx.setLineDash([2, 8]);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
        ctx.restore();
      });

      // floating particles — implies machine humming
      ctx.save();
      for (let i = 0; i < 28; i++) {
        const seed = i * 53.7;
        const x = (seed * 17 + frame * 0.4) % w;
        const y = h * 0.5 + Math.sin(frame * 0.005 + i * 0.7) * h * 0.25;
        const size = 0.6 + Math.sin(frame * 0.02 + i) * 0.5;
        const op = ((Math.sin(frame * 0.012 + i * 1.4) + 1) / 2) * 0.5 * reveal;
        ctx.fillStyle = `rgba(186, 230, 253, ${op})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      stop = true;
      cancelAnimationFrame(raf);
    };
  }, [reveal]);

  return (
    <section ref={ref} className="cinematic-act cinematic-act--vision">
      <div className="cinematic-act__sticky">
        <canvas ref={canvasRef} className="cinematic-vision-canvas" />

        <div
          className="cinematic-vision-label cinematic-vision-label--top"
          style={{ opacity: labelOp, transform: `translateY(${(1 - labelOp) * -8}px)` }}
        >
          <span className="cinematic-vision-label__dot" />
          sell-side liquidity
        </div>

        <div
          className="cinematic-vision-label cinematic-vision-label--bottom"
          style={{ opacity: labelOp, transform: `translateY(${(1 - labelOp) * 8}px)` }}
        >
          <span className="cinematic-vision-label__dot cinematic-vision-label__dot--rose" />
          buy-side liquidity
        </div>

        <div
          className="cinematic-vision-text"
          style={{ opacity: smoothstep(0.45, 0.7, p) }}
        >
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
// ACT III — Multi-timeframe orbit (clean geometry, breathing)
// ─────────────────────────────────────────────────────────────────
export function ActOrbit() {
  const [ref, p] = useScrollProgress<HTMLElement>();
  const reveal = smoothstep(0.1, 0.6, p);
  const lock = smoothstep(0.55, 0.85, p);

  return (
    <section ref={ref} className="cinematic-act cinematic-act--orbit">
      <div className="cinematic-act__sticky">
        <div className="cinematic-orbit-stage">
          {/* concentric rings */}
          <div
            className="cinematic-orbit-ring cinematic-orbit-ring--1"
            style={{ opacity: reveal, transform: `scale(${0.85 + reveal * 0.15})` }}
          />
          <div
            className="cinematic-orbit-ring cinematic-orbit-ring--2"
            style={{ opacity: reveal * 0.85, transform: `scale(${0.85 + reveal * 0.15})` }}
          />
          <div
            className="cinematic-orbit-ring cinematic-orbit-ring--3"
            style={{ opacity: reveal * 0.7, transform: `scale(${0.85 + reveal * 0.15})` }}
          />

          {/* orbiting nodes */}
          <div className="cinematic-orbit-spinner" style={{ opacity: reveal }}>
            <span className="cinematic-orbit-node">15m</span>
            <span className="cinematic-orbit-node">1H</span>
            <span className="cinematic-orbit-node">4H</span>
          </div>

          {/* center lock */}
          <div
            className="cinematic-orbit-core"
            style={{
              opacity: lock,
              transform: `translate(-50%, -50%) scale(${0.7 + lock * 0.3})`,
            }}
          >
            <span className="cinematic-orbit-core__label">aligned</span>
            <span className="cinematic-orbit-core__value">88%</span>
          </div>
        </div>

        <div
          className="cinematic-orbit-text"
          style={{ opacity: smoothstep(0.2, 0.55, p) }}
        >
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
// ACT IV — Risk engine (text + cinematic numbers, no cards)
// ─────────────────────────────────────────────────────────────────
export function ActRisk() {
  const [ref, p] = useScrollProgress<HTMLElement>();
  const reveal = smoothstep(0.15, 0.55, p);

  return (
    <section ref={ref} className="cinematic-act cinematic-act--risk">
      <div className="cinematic-act__sticky">
        <div className="cinematic-risk-grid">
          <div
            className="cinematic-risk-text"
            style={{ opacity: smoothstep(0.05, 0.4, p) }}
          >
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
            <CinematicNumber label="position" value="2.5%" suffix="per trade" reveal={reveal} delay={0} />
            <CinematicNumber label="heat" value="8.2%" suffix="active" reveal={reveal} delay={0.15} accent="amber" />
            <CinematicNumber label="r:r" value="1:3.2" suffix="median" reveal={reveal} delay={0.3} accent="cyan" />
          </div>
        </div>
      </div>
    </section>
  );
}

function CinematicNumber({
  label,
  value,
  suffix,
  reveal,
  delay,
  accent,
}: {
  label: string;
  value: string;
  suffix: string;
  reveal: number;
  delay: number;
  accent?: "amber" | "cyan";
}) {
  const local = Math.min(1, Math.max(0, (reveal - delay) / 0.4));
  return (
    <div
      className={cn("cinematic-number", accent && `cinematic-number--${accent}`)}
      style={{
        opacity: local,
        transform: `translateY(${(1 - local) * 18}px)`,
      }}
    >
      <span className="cinematic-number__label">{label}</span>
      <span className="cinematic-number__value">{value}</span>
      <span className="cinematic-number__suffix">{suffix}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ACT V — Closing (invitation, not "pricing cards")
// ─────────────────────────────────────────────────────────────────
export function ActInvitation() {
  const [ref, p] = useScrollProgress<HTMLElement>();
  const op1 = smoothstep(0.1, 0.4, p);
  const op2 = smoothstep(0.3, 0.6, p);
  const op3 = smoothstep(0.5, 0.8, p);

  return (
    <section ref={ref} className="cinematic-act cinematic-act--invitation">
      <div className="cinematic-act__sticky">
        <div className="cinematic-invite">
          <p
            className="cinematic-invite-eyebrow"
            style={{ opacity: op1 }}
          >
            FINAL FRAME
          </p>
          <h2
            className="cinematic-invite-title"
            style={{ opacity: op2, transform: `translateY(${(1 - op2) * 22}px)` }}
          >
            The terminal is open.
          </h2>
          <p
            className="cinematic-invite-sub"
            style={{ opacity: op3 }}
          >
            Step inside the machine.
          </p>
          <div
            className="cinematic-invite-actions"
            style={{ opacity: op3 }}
          >
            <Link href="/terminal" className="cinematic-cta cinematic-cta--strong">
              <span>Enter terminal</span>
              <svg width="18" height="10" viewBox="0 0 18 10" fill="none">
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
