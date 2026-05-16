"use client";

/**
 * Holographic 3D candlestick scene.
 *
 * Renders ~80 candles in a perspective-projected 3D space on a 2D canvas.
 * Includes:
 *  - Glowing candles with depth shading
 *  - Volume base bars
 *  - Animated TP/SL/Entry pathing lines
 *  - Order-block rectangles
 *  - Liquidity zone bands
 *  - AI projection cone for the next N candles
 *  - Scanner sweep
 *  - Subtle camera orbit + scroll-driven dolly
 *
 * Hand-rolled, zero deps. ~60fps on mid-tier laptops.
 */

import { useEffect, useRef } from "react";

type Candle = {
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

type Props = {
  className?: string;
  /** Number of candles to render (defaults to 84) */
  count?: number;
  /** Number of AI projection candles */
  projection?: number;
};

export function HolographicChart({ className, count = 84, projection = 18 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (typeof window === "undefined") return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let W = 0, H = 0;
    let candles: Candle[] = [];
    let proj: Candle[] = [];

    // ---- Generate realistic-looking candle series (deterministic seed) ----
    function hash(x: number) {
      x = (x ^ 61) ^ (x >>> 16);
      x = x + (x << 3);
      x = x ^ (x >>> 4);
      x = Math.imul(x, 0x27d4eb2d);
      x = x ^ (x >>> 15);
      return ((x >>> 0) % 10000) / 10000;
    }

    function buildSeries() {
      candles = [];
      let price = 41280;
      let momentum = 0.6;
      for (let i = 0; i < count; i++) {
        const seed = hash(i * 1379 + 7);
        const seed2 = hash(i * 91 + 13);
        // Bias upwards over time, with corrections
        momentum += (seed - 0.5) * 0.18;
        momentum = Math.max(-1.4, Math.min(1.6, momentum));
        const drift = momentum * 90 + Math.sin(i * 0.18) * 60;
        const o = price;
        const c = o + drift + (seed2 - 0.5) * 220;
        const range = 80 + seed * 360;
        const h = Math.max(o, c) + range * 0.45;
        const l = Math.min(o, c) - range * 0.4;
        const v = 30 + seed * 130 + Math.abs(c - o) * 0.6;
        candles.push({ o, h, l, c, v });
        price = c;
      }

      proj = [];
      let pp = candles[candles.length - 1].c;
      let pm = 0.9;
      for (let i = 0; i < projection; i++) {
        const seed = hash(i * 311 + 999);
        pm += (seed - 0.45) * 0.12;
        pm = Math.max(-0.4, Math.min(1.6, pm));
        const drift = pm * 110 + Math.sin(i * 0.32) * 40;
        const o = pp;
        const c = o + drift + (seed - 0.5) * 100;
        const h = Math.max(o, c) + (60 + seed * 220) * 0.4;
        const l = Math.min(o, c) - (60 + seed * 220) * 0.4;
        proj.push({ o, h, l, c, v: 0 });
        pp = c;
      }
    }

    buildSeries();

    // ---- Resize ----
    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      W = Math.max(2, Math.floor(rect.width * dpr));
      H = Math.max(2, Math.floor(rect.height * dpr));
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
      }
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // ---- Pointer / scroll state ----
    let mx = 0.5;
    let my = 0.5;
    let scroll = 0;

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      my = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    };
    const onScroll = () => {
      const docH = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scroll = Math.max(0, Math.min(1, window.scrollY / docH));
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // ---- Visibility-aware loop ----
    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver(
      (e) => { visible = e[0]?.isIntersecting ?? true; },
      { threshold: 0.01 }
    );
    io.observe(canvas);

    const start = performance.now();

    // ---- Drawing helpers ----
    const draw = (now: number) => {
      const t = (now - start) * 0.001;

      ctx.save();
      ctx.scale(1, 1); // working in device pixels
      ctx.clearRect(0, 0, W, H);

      // Background plane (very subtle gradient)
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, "rgba(2, 6, 14, 0.0)");
      bgGrad.addColorStop(1, "rgba(2, 6, 14, 0.5)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Grid floor (perspective)
      drawFloor(ctx, W, H, t);

      // Compute price range
      const all = [...candles, ...proj];
      const ph = Math.max(...all.map((c) => c.h));
      const pl = Math.min(...all.map((c) => c.l));
      const pad = (ph - pl) * 0.18;
      const yMin = pl - pad;
      const yMax = ph + pad;

      // Camera params
      const dolly = 1 - 0.08 * scroll; // pull in
      const tilt = 0.18 + my * 0.06 - scroll * 0.04;
      const shiftX = (mx - 0.5) * 0.04;

      // Layout
      const totalCandles = count + projection;
      const stride = (W * 0.92) / totalCandles;
      const left = W * 0.05;
      const top = H * 0.06;
      const bottom = H * 0.78;
      const chartH = (bottom - top) * dolly;
      const chartT = top + (1 - dolly) * (bottom - top) * 0.5;
      const volTop = bottom + 8 * dpr;
      const volH = H * 0.16;

      const priceToY = (p: number) => {
        const yLin = chartT + chartH * (1 - (p - yMin) / (yMax - yMin));
        // Tilt slightly towards bottom for 3D feel
        return yLin + (yLin - chartT) * tilt * 0.18;
      };

      const indexToX = (i: number) => left + i * stride + stride * 0.5 + shiftX * W;

      // Liquidity zones — soft horizontal bands
      const zones = [
        { y: pl + (ph - pl) * 0.18, c: "rgba(251, 113, 133, 0.06)", label: "Equal lows" },
        { y: pl + (ph - pl) * 0.78, c: "rgba(52, 211, 153, 0.07)", label: "Daily resistance" }
      ];
      zones.forEach((z) => {
        const y = priceToY(z.y);
        ctx.fillStyle = z.c;
        ctx.fillRect(0, y - 18 * dpr, W, 36 * dpr);
      });

      // Volume base bars
      const maxVol = Math.max(...candles.map((c) => c.v));
      ctx.save();
      candles.forEach((cd, i) => {
        const x = indexToX(i);
        const up = cd.c >= cd.o;
        const vh = (cd.v / maxVol) * volH;
        ctx.fillStyle = up ? "rgba(52, 211, 153, 0.18)" : "rgba(251, 113, 133, 0.18)";
        ctx.fillRect(x - stride * 0.32, volTop + (volH - vh), stride * 0.64, vh);
      });
      ctx.restore();

      // Order block (highlighted recent demand zone)
      const obStart = Math.floor(count * 0.55);
      const obEnd = Math.floor(count * 0.62);
      const obLow = Math.min(...candles.slice(obStart, obEnd).map((c) => c.l));
      const obHigh = Math.max(...candles.slice(obStart, obEnd).map((c) => c.h));
      ctx.save();
      ctx.fillStyle = "rgba(94, 234, 212, 0.06)";
      ctx.strokeStyle = "rgba(94, 234, 212, 0.35)";
      ctx.lineWidth = 1 * dpr;
      ctx.setLineDash([6 * dpr, 5 * dpr]);
      const obX1 = indexToX(obStart) - stride * 0.5;
      const obX2 = W - 8 * dpr;
      const obY1 = priceToY(obHigh);
      const obY2 = priceToY(obLow);
      ctx.fillRect(obX1, obY1, obX2 - obX1, obY2 - obY1);
      ctx.strokeRect(obX1, obY1, obX2 - obX1, obY2 - obY1);
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(94, 234, 212, 0.85)";
      ctx.font = `${10 * dpr}px ui-monospace, "SF Mono", Menlo, monospace`;
      ctx.fillText("ORDER BLOCK", obX1 + 8 * dpr, obY1 + 14 * dpr);
      ctx.restore();

      // Historical candles
      candles.forEach((cd, i) => {
        const x = indexToX(i);
        const up = cd.c >= cd.o;
        const oy = priceToY(cd.o);
        const cy = priceToY(cd.c);
        const hy = priceToY(cd.h);
        const ly = priceToY(cd.l);

        // Wick
        ctx.strokeStyle = up ? "rgba(110, 231, 183, 0.65)" : "rgba(252, 165, 165, 0.65)";
        ctx.lineWidth = 1.2 * dpr;
        ctx.beginPath();
        ctx.moveTo(x, hy);
        ctx.lineTo(x, ly);
        ctx.stroke();

        // Body — gradient + glow
        const top2 = Math.min(oy, cy);
        const h2 = Math.max(2 * dpr, Math.abs(cy - oy));
        const grad = ctx.createLinearGradient(0, top2, 0, top2 + h2);
        if (up) {
          grad.addColorStop(0, "rgba(110, 231, 183, 0.95)");
          grad.addColorStop(1, "rgba(16, 185, 129, 0.85)");
          ctx.shadowColor = "rgba(52, 211, 153, 0.55)";
        } else {
          grad.addColorStop(0, "rgba(252, 165, 165, 0.95)");
          grad.addColorStop(1, "rgba(239, 68, 68, 0.85)");
          ctx.shadowColor = "rgba(244, 63, 94, 0.5)";
        }
        ctx.shadowBlur = 12 * dpr;
        ctx.fillStyle = grad;
        ctx.fillRect(x - stride * 0.34, top2, stride * 0.68, h2);
        ctx.shadowBlur = 0;
      });

      // Projection cone (AI prediction)
      const lastY = priceToY(candles[candles.length - 1].c);
      const projOffset = count;
      ctx.save();
      const coneTopY = priceToY(proj.reduce((m, c) => Math.max(m, c.h), -Infinity));
      const coneBotY = priceToY(proj.reduce((m, c) => Math.min(m, c.l), Infinity));
      const coneX1 = indexToX(projOffset) - stride * 0.5;
      const coneX2 = indexToX(totalCandles - 1) + stride * 0.5;
      const conePath = new Path2D();
      conePath.moveTo(coneX1, lastY);
      conePath.lineTo(coneX2, coneTopY);
      conePath.lineTo(coneX2, coneBotY);
      conePath.closePath();
      const cgrad = ctx.createLinearGradient(coneX1, 0, coneX2, 0);
      cgrad.addColorStop(0, "rgba(167, 139, 250, 0.0)");
      cgrad.addColorStop(0.5, "rgba(167, 139, 250, 0.12)");
      cgrad.addColorStop(1, "rgba(232, 121, 249, 0.06)");
      ctx.fillStyle = cgrad;
      ctx.fill(conePath);
      ctx.strokeStyle = "rgba(167, 139, 250, 0.35)";
      ctx.lineWidth = 1 * dpr;
      ctx.setLineDash([5 * dpr, 4 * dpr]);
      ctx.stroke(conePath);
      ctx.setLineDash([]);
      ctx.restore();

      // Projected candles (faded outlines)
      proj.forEach((cd, i) => {
        const x = indexToX(projOffset + i);
        const up = cd.c >= cd.o;
        const oy = priceToY(cd.o);
        const cy = priceToY(cd.c);
        const hy = priceToY(cd.h);
        const ly = priceToY(cd.l);

        const fade = 0.55 - i / proj.length * 0.4;
        ctx.strokeStyle = up ? `rgba(167, 139, 250, ${fade})` : `rgba(232, 121, 249, ${fade})`;
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        ctx.moveTo(x, hy);
        ctx.lineTo(x, ly);
        ctx.stroke();

        const top2 = Math.min(oy, cy);
        const h2 = Math.max(2 * dpr, Math.abs(cy - oy));
        ctx.strokeRect(x - stride * 0.32, top2, stride * 0.64, h2);
      });

      // TP / SL / Entry levels
      const lastClose = candles[candles.length - 1].c;
      const sl = lastClose * 0.972;
      const entry = lastClose;
      const tp1 = lastClose * 1.018;
      const tp2 = lastClose * 1.038;
      const tp3 = lastClose * 1.062;

      drawLevel(ctx, dpr, W, priceToY(sl),    "rgba(251, 113, 133, 0.85)", "SL", lastClose, sl);
      drawLevel(ctx, dpr, W, priceToY(entry), "rgba(167, 139, 250, 0.85)", "ENTRY", lastClose, entry);
      drawLevel(ctx, dpr, W, priceToY(tp1),   "rgba(52, 211, 153, 0.85)", "TP1", lastClose, tp1);
      drawLevel(ctx, dpr, W, priceToY(tp2),   "rgba(52, 211, 153, 0.65)", "TP2", lastClose, tp2);
      drawLevel(ctx, dpr, W, priceToY(tp3),   "rgba(52, 211, 153, 0.45)", "TP3", lastClose, tp3);

      // Pulse marker on last close
      const pulseX = indexToX(count - 1);
      const pulseY = priceToY(lastClose);
      const pulseR = 6 * dpr + Math.sin(t * 3) * 1.5 * dpr;
      ctx.save();
      ctx.fillStyle = "rgba(94, 234, 212, 0.95)";
      ctx.shadowColor = "rgba(94, 234, 212, 0.95)";
      ctx.shadowBlur = 22 * dpr;
      ctx.beginPath();
      ctx.arc(pulseX, pulseY, pulseR, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Halo
      ctx.strokeStyle = `rgba(94, 234, 212, ${0.5 - Math.sin(t * 3) * 0.3})`;
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      ctx.arc(pulseX, pulseY, pulseR + 8 * dpr + Math.sin(t * 3) * 4 * dpr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Scanner sweep
      if (!reduce) {
        const sweepX = ((t * 0.18) % 1) * W;
        const sg = ctx.createLinearGradient(sweepX - 80 * dpr, 0, sweepX + 80 * dpr, 0);
        sg.addColorStop(0, "rgba(94, 234, 212, 0.0)");
        sg.addColorStop(0.5, "rgba(94, 234, 212, 0.08)");
        sg.addColorStop(1, "rgba(94, 234, 212, 0.0)");
        ctx.fillStyle = sg;
        ctx.fillRect(sweepX - 80 * dpr, 0, 160 * dpr, H);
      }

      // Header strip
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.font = `600 ${11 * dpr}px ui-monospace, "SF Mono", Menlo, monospace`;
      ctx.fillText(`BTCUSDT · 15m · ${formatPrice(lastClose)}`, 12 * dpr, 18 * dpr);

      const change = ((lastClose - candles[0].o) / candles[0].o) * 100;
      ctx.fillStyle = change >= 0 ? "rgba(52, 211, 153, 0.95)" : "rgba(251, 113, 133, 0.95)";
      ctx.fillText(`${change >= 0 ? "+" : ""}${change.toFixed(2)}%`, 200 * dpr, 18 * dpr);

      ctx.restore();
    };

    function drawFloor(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
      ctx.save();
      const top = H * 0.78;
      const bottom = H;
      const cx = W * 0.5;

      // Lines converging towards a vanishing point
      ctx.strokeStyle = "rgba(94, 234, 212, 0.12)";
      ctx.lineWidth = 1 * dpr;
      const lines = 10;
      for (let i = 0; i <= lines; i++) {
        const x = (i / lines) * W;
        ctx.beginPath();
        ctx.moveTo(x, bottom);
        ctx.lineTo(cx, top);
        ctx.stroke();
      }
      // Horizontal grid lines (animated)
      const off = ((t * 30) % 30) * dpr;
      for (let i = 0; i < 14; i++) {
        const k = i / 14;
        const y = top + Math.pow(k, 1.6) * (bottom - top) + off;
        if (y > bottom) continue;
        ctx.strokeStyle = `rgba(94, 234, 212, ${0.04 + k * 0.06})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawLevel(
      ctx: CanvasRenderingContext2D,
      dpr: number,
      W: number,
      y: number,
      color: string,
      label: string,
      currentPrice: number,
      levelPrice: number
    ) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2 * dpr;
      ctx.setLineDash([6 * dpr, 5 * dpr]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Tag
      const tagW = 70 * dpr;
      const tagH = 18 * dpr;
      const tagX = W - tagW - 8 * dpr;
      const tagY = y - tagH * 0.5;
      ctx.fillStyle = "rgba(2, 4, 10, 0.92)";
      ctx.strokeStyle = color;
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      const r = 4 * dpr;
      ctx.moveTo(tagX + r, tagY);
      ctx.lineTo(tagX + tagW - r, tagY);
      ctx.quadraticCurveTo(tagX + tagW, tagY, tagX + tagW, tagY + r);
      ctx.lineTo(tagX + tagW, tagY + tagH - r);
      ctx.quadraticCurveTo(tagX + tagW, tagY + tagH, tagX + tagW - r, tagY + tagH);
      ctx.lineTo(tagX + r, tagY + tagH);
      ctx.quadraticCurveTo(tagX, tagY + tagH, tagX, tagY + tagH - r);
      ctx.lineTo(tagX, tagY + r);
      ctx.quadraticCurveTo(tagX, tagY, tagX + r, tagY);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = `700 ${9 * dpr}px ui-monospace, "SF Mono", Menlo, monospace`;
      ctx.textBaseline = "middle";
      ctx.fillText(label, tagX + 6 * dpr, tagY + tagH * 0.5);
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.fillText(formatPrice(levelPrice), tagX + 30 * dpr, tagY + tagH * 0.5);
      ctx.restore();
      void currentPrice;
    }

    function formatPrice(n: number) {
      if (n >= 1000) return n.toFixed(0);
      if (n >= 1) return n.toFixed(2);
      return n.toFixed(4);
    }

    let last = performance.now();
    const loop = (now: number) => {
      if (visible && !document.hidden) {
        // Throttle to ~50fps when reduce-motion
        if (!reduce || now - last > 33) {
          draw(now);
          last = now;
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, [count, projection]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
