"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatCompactNumber, formatCurrency, cn } from "@/lib/utils";
import type { MarketSignalScore } from "@/lib/market-signals";
import type { MarketTicker } from "@/types";

type ScrollCandlestickHeroProps = {
  rows: MarketTicker[];
  topSignal?: MarketSignalScore & { symbol: string; price: number };
  totalVolume: number;
  advancing: number;
};

export function ScrollCandlestickHero({ rows, topSignal, totalVolume, advancing }: ScrollCandlestickHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const elementTop = rect.top;
      const elementHeight = rect.height;
      
      // Calculate scroll progress (0 to 1) as element moves through viewport
      const progress = Math.max(0, Math.min(1, (viewportHeight - elementTop) / (viewportHeight + elementHeight)));
      setScrollProgress(progress);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, w, h);

    // Generate realistic candle data
    const numCandles = 72;
    const candles = generateRealisticCandles(numCandles, scrollProgress);
    
    // Calculate price range
    const allPrices = candles.flatMap(c => [c.high, c.low]);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice;
    const padding = priceRange * 0.1;

    // Chart dimensions
    const chartTop = h * 0.05;
    const chartBottom = h * 0.75;
    const chartHeight = chartBottom - chartTop;
    const volumeHeight = h * 0.15;
    const volumeTop = chartBottom + 10;

    const candleWidth = (w / numCandles) * 0.6;
    const candleSpacing = w / numCandles;

    // Helper to convert price to Y coordinate
    const priceToY = (price: number) => {
      return chartTop + chartHeight * (1 - (price - minPrice + padding) / (priceRange + 2 * padding));
    };

    // Draw grid lines
    ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = chartTop + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Draw key levels (Entry, SL, TP)
    if (scrollProgress > 0.3) {
      const currentPrice = candles[candles.length - 1].close;
      const entry = currentPrice;
      const sl = currentPrice * 0.97;
      const tp1 = currentPrice * 1.05;
      const tp2 = currentPrice * 1.08;
      const tp3 = currentPrice * 1.12;

      // Stop Loss
      drawLevel(ctx, w, priceToY(sl), "rgba(244, 63, 94, 0.6)", "SL", Math.min(scrollProgress * 2, 1));
      
      // Entry
      drawLevel(ctx, w, priceToY(entry), "rgba(167, 139, 250, 0.7)", "ENTRY", Math.min(scrollProgress * 2, 1));
      
      // Take Profits
      if (scrollProgress > 0.4) {
        drawLevel(ctx, w, priceToY(tp1), "rgba(52, 211, 153, 0.5)", "TP1", Math.min((scrollProgress - 0.4) * 2.5, 1));
      }
      if (scrollProgress > 0.5) {
        drawLevel(ctx, w, priceToY(tp2), "rgba(52, 211, 153, 0.4)", "TP2", Math.min((scrollProgress - 0.5) * 2.5, 1));
      }
      if (scrollProgress > 0.6) {
        drawLevel(ctx, w, priceToY(tp3), "rgba(52, 211, 153, 0.3)", "TP3", Math.min((scrollProgress - 0.6) * 2.5, 1));
      }
    }

    // Draw volume bars
    const maxVolume = Math.max(...candles.map(c => c.volume));
    candles.forEach((candle, i) => {
      const x = i * candleSpacing + candleSpacing / 2;
      const volumeBarHeight = (candle.volume / maxVolume) * volumeHeight;
      const isUp = candle.close >= candle.open;
      
      ctx.fillStyle = isUp ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)";
      ctx.fillRect(x - candleWidth / 2, volumeTop + volumeHeight - volumeBarHeight, candleWidth, volumeBarHeight);
    });

    // Draw candlesticks
    candles.forEach((candle, i) => {
      const x = i * candleSpacing + candleSpacing / 2;
      const isUp = candle.close >= candle.open;
      
      const openY = priceToY(candle.open);
      const closeY = priceToY(candle.close);
      const highY = priceToY(candle.high);
      const lowY = priceToY(candle.low);

      // Wick
      ctx.strokeStyle = isUp ? "rgba(110, 231, 183, 0.8)" : "rgba(252, 165, 165, 0.8)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Body
      const bodyHeight = Math.max(2, Math.abs(closeY - openY));
      const bodyTop = Math.min(openY, closeY);
      
      ctx.fillStyle = isUp ? "rgba(16, 185, 129, 0.95)" : "rgba(239, 68, 68, 0.95)";
      ctx.shadowColor = isUp ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)";
      ctx.shadowBlur = 8;
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
      ctx.shadowBlur = 0;
    });

    // Draw AI annotations
    if (scrollProgress > 0.35) {
      drawAnnotation(ctx, w * 0.25, priceToY(candles[18].high) - 30, "Liquidity Sweep", Math.min((scrollProgress - 0.35) * 3, 1));
    }
    if (scrollProgress > 0.45) {
      drawAnnotation(ctx, w * 0.55, priceToY(candles[45].low) + 30, "Structure Break", Math.min((scrollProgress - 0.45) * 3, 1));
    }
    if (scrollProgress > 0.55) {
      drawAnnotation(ctx, w * 0.85, priceToY(candles[65].high) - 30, "Momentum Shift", Math.min((scrollProgress - 0.55) * 3, 1));
    }

  }, [scrollProgress]);

  const featured = rows[0];

  return (
    <section ref={containerRef} className="relative min-h-[90vh] px-6 py-16 sm:px-10 lg:px-14">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="cinema-orb cinema-orb-one" />
        <div className="cinema-orb cinema-orb-two" />
        <div className="cinema-grid-floor" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: Content */}
          <div>
            <div className="cinema-eyebrow">
              <span className="vx-live-dot" />
              Institutional-grade AI crypto intelligence
            </div>
            
            <h1 className="mt-8 text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl">
              Trade with
              <br />
              <span className="bg-gradient-to-r from-cyan-300 via-purple-400 to-pink-300 bg-clip-text text-transparent">
                precision.
              </span>
              <br />
              <span className="text-white/50">Not guesswork.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/65">
              Vypexrock fuses multi-timeframe structure, live market data, and AI-powered risk framing into one cinematic terminal built for serious operators.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/terminal" className="cinema-primary-cta">
                Open terminal
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/chart-analyzer" className="cinema-secondary-cta">
                Analyze a chart
              </Link>
            </div>

            <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-white/[0.08] pt-8">
              <Stat label="Assets" value={String(rows.length)} />
              <Stat label="24h Volume" value={formatCompactNumber(totalVolume)} />
              <Stat label="Advancing" value={`${advancing}/${rows.length}`} />
            </dl>
          </div>

          {/* Right: Scroll-reactive candlestick chart */}
          <div className="relative">
            <div className="cinema-hero-terminal overflow-hidden p-6">
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-white/70">
                  <span className="vx-live-dot" />
                  Live market structure
                </span>
                <span className="font-mono text-xs text-white/50">{featured?.symbol ?? "BTCUSDT"} · 15m</span>
              </div>

              <div className="relative h-[500px] overflow-hidden rounded-2xl bg-black/40">
                <canvas
                  ref={canvasRef}
                  className="h-full w-full"
                  style={{ width: "100%", height: "100%" }}
                />
                
                {/* Confidence meter overlay */}
                {scrollProgress > 0.7 && topSignal && (
                  <div 
                    className="absolute right-4 top-4 rounded-xl border border-white/10 bg-black/60 p-4 backdrop-blur-xl"
                    style={{ opacity: Math.min((scrollProgress - 0.7) * 3, 1) }}
                  >
                    <p className="text-xs uppercase tracking-wider text-white/50">AI Confidence</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-cyan-300">{topSignal.confidence}%</span>
                      <span className={cn(
                        "text-sm font-semibold uppercase",
                        topSignal.direction === "long" ? "text-emerald-400" : "text-rose-400"
                      )}>
                        {topSignal.decision}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Mini stats */}
              {topSignal && (
                <div className="mt-4 grid grid-cols-4 gap-3">
                  <MiniStat label="Bias" value={topSignal.decision} accent={topSignal.badgeTone} />
                  <MiniStat label="R:R" value={topSignal.riskReward} />
                  <MiniStat label="Entry" value={formatCurrency(topSignal.price)} />
                  <MiniStat label="Timeframe" value="15m/1H/4H" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function generateRealisticCandles(count: number, scrollProgress: number) {
  const candles = [];
  let basePrice = 45000 + scrollProgress * 2000; // Price moves up as you scroll
  
  for (let i = 0; i < count; i++) {
    const trend = Math.sin(i / 8) * 300 + scrollProgress * 50;
    const volatility = 100 + Math.random() * 200;
    
    const open = basePrice + trend;
    const close = open + (Math.random() - 0.45) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = 1000000 + Math.random() * 5000000;
    
    candles.push({ open, high, low, close, volume });
    basePrice = close;
  }
  
  return candles;
}

function drawLevel(ctx: CanvasRenderingContext2D, width: number, y: number, color: string, label: string, opacity: number) {
  ctx.save();
  ctx.globalAlpha = opacity;
  
  // Dashed line
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 4]);
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(width, y);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Label
  ctx.fillStyle = color;
  ctx.font = "bold 11px Inter, sans-serif";
  ctx.fillText(label, width - 50, y - 6);
  
  ctx.restore();
}

function drawAnnotation(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, opacity: number) {
  ctx.save();
  ctx.globalAlpha = opacity;
  
  // Background
  ctx.fillStyle = "rgba(8, 13, 28, 0.9)";
  ctx.strokeStyle = "rgba(125, 211, 252, 0.4)";
  ctx.lineWidth = 1;
  const padding = 8;
  const textWidth = ctx.measureText(text).width;
  ctx.fillRect(x - padding, y - 16, textWidth + padding * 2, 24);
  ctx.strokeRect(x - padding, y - 16, textWidth + padding * 2, 24);
  
  // Text
  ctx.fillStyle = "rgba(207, 250, 254, 0.95)";
  ctx.font = "bold 11px Inter, sans-serif";
  ctx.fillText(text, x, y);
  
  ctx.restore();
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.2em] text-white/40">{label}</dt>
      <dd className="mt-1.5 text-xl font-bold text-white">{value}</dd>
    </div>
  );
}

function MiniStat({
  label,
  value,
  accent
}: {
  label: string;
  value: string;
  accent?: "emerald" | "cyan" | "amber" | "rose" | "slate";
}) {
  const tone =
    accent === "emerald"
      ? "text-emerald-300"
      : accent === "rose"
        ? "text-rose-300"
        : accent === "amber"
          ? "text-amber-200"
          : "text-white";
  return (
    <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-2 backdrop-blur-sm">
      <p className="text-[9px] uppercase tracking-wider text-white/40">{label}</p>
      <strong className={cn("mt-1 block text-sm font-semibold", tone)}>{value}</strong>
    </div>
  );
}
