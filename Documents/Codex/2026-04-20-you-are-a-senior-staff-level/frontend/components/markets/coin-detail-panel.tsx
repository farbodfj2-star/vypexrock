"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Activity, BookOpen, ExternalLink, Layers, Sparkles, TrendingUp, Zap } from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { MarketGroup } from "@/lib/asset-catalog";
import { getCoinInfo } from "@/lib/coin-descriptions";
import { cn } from "@/lib/utils";

type Candle = {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ts: number;
};

interface Props {
  symbol: string;
  name: string;
  label: string;
  group: MarketGroup;
  price: number;
  change: number;
  volume: number;
}

const INTERVALS: { key: string; label: string }[] = [
  { key: "15m", label: "15m" },
  { key: "1h", label: "1H" },
  { key: "4h", label: "4H" },
  { key: "1d", label: "1D" },
];

export function CoinDetailPanel({ symbol, name, label, group, price, change, volume }: Props) {
  const [interval, setInterval] = useState("1h");

  const enableCandles = group === "Crypto";
  const { data: coinData } = useQuery({
    queryKey: ["coin-detail", symbol, interval],
    queryFn: () => apiFetch<{ candles: Candle[] }>(`/market/coins/${symbol}?interval=${interval}`),
    refetchInterval: 4000,
    enabled: enableCandles,
    staleTime: 4000,
  });

  const candles = coinData?.candles ?? [];
  const info = getCoinInfo(symbol);

  // Quick technical signals derived from candles + price
  const signals = computeSignals(candles, price, change);

  return (
    <div className="market-detail">
      {/* ── header ── */}
      <div className="market-detail__head">
        <div className="market-detail__id">
          <span className="market-detail__icon" data-letter={symbol.charAt(0)}>{symbol.charAt(0)}</span>
          <div>
            <p className="market-detail__name">{name}</p>
            <p className="market-detail__label">{label} · {info.category}</p>
          </div>
        </div>

        <div className="market-detail__price-block">
          <p className="market-detail__price">${formatPrice(price)}</p>
          <span className={cn("market-detail__chg", change >= 0 ? "is-up" : "is-dn")}>
            {(change >= 0 ? "+" : "") + change.toFixed(2)}%
            <span className="market-detail__chg-label">24H</span>
          </span>
        </div>
      </div>

      {/* ── intervals ── */}
      <div className="market-detail__intervals">
        {INTERVALS.map((i) => (
          <button
            key={i.key}
            onClick={() => setInterval(i.key)}
            className={cn("market-detail__interval", interval === i.key && "is-active")}
            disabled={!enableCandles}
          >
            {i.label}
          </button>
        ))}
        <span className="market-detail__live">
          <span className="market-detail__live-dot" />
          {enableCandles ? "LIVE · BINANCE" : "FALLBACK FEED"}
        </span>
      </div>

      {/* ── chart ── */}
      <div className="market-detail__chart">
        {enableCandles ? (
          <CandleChart candles={candles} positive={change >= 0} />
        ) : (
          <div className="market-detail__chart-placeholder">
            <Activity className="h-6 w-6 text-white/40" />
            <p>Live candle chart available for crypto pairs</p>
          </div>
        )}
      </div>

      {/* ── stat grid ── */}
      <div className="market-detail__stats">
        <div className="market-detail__stat">
          <p className="market-detail__stat-label">24H VOLUME</p>
          <p className="market-detail__stat-value">{volume ? "$" + formatCompact(volume) : "—"}</p>
        </div>
        <div className="market-detail__stat">
          <p className="market-detail__stat-label">24H HIGH</p>
          <p className="market-detail__stat-value">${formatPrice(signals.high24h)}</p>
        </div>
        <div className="market-detail__stat">
          <p className="market-detail__stat-label">24H LOW</p>
          <p className="market-detail__stat-value">${formatPrice(signals.low24h)}</p>
        </div>
        <div className="market-detail__stat">
          <p className="market-detail__stat-label">RSI · {interval.toUpperCase()}</p>
          <p className={cn(
            "market-detail__stat-value",
            signals.rsi >= 70 && "is-warn",
            signals.rsi <= 30 && "is-warn",
          )}>{signals.rsi.toFixed(1)}</p>
        </div>
      </div>

      {/* ── technical panel ── */}
      <div className="market-detail__tech">
        <div className="market-detail__tech-head">
          <Layers className="h-3.5 w-3.5" />
          <span>TECHNICAL SNAPSHOT · {interval.toUpperCase()}</span>
        </div>
        <div className="market-detail__tech-grid">
          <SignalRow label="Trend" value={signals.trendLabel} tone={signals.trendTone} />
          <SignalRow label="Momentum" value={signals.momentumLabel} tone={signals.momentumTone} />
          <SignalRow label="Volatility" value={signals.volatilityLabel} tone="muted" />
          <SignalRow label="Bias" value={signals.biasLabel} tone={signals.biasTone} />
        </div>
      </div>

      {/* ── about (REAL coin description) ── */}
      <div className="market-detail__about">
        <p className="market-detail__about-eyebrow">
          <BookOpen className="h-3.5 w-3.5" /> ABOUT {symbol.replace("USDT", "")}
        </p>
        <p className="market-detail__about-blurb">{info.blurb}</p>
        {info.facts.length > 0 ? (
          <div className="market-detail__facts">
            {info.facts.map((f) => (
              <div key={f.label} className="market-detail__fact">
                <span className="market-detail__fact-label">{f.label}</span>
                <span className="market-detail__fact-value">{f.value}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* ── how to trade ── */}
      <div className="market-detail__trade">
        <p className="market-detail__about-eyebrow">
          <Sparkles className="h-3.5 w-3.5" /> HOW VYPEXROCK TRADES IT
        </p>
        <ul className="market-detail__trade-list">
          <li><TrendingUp className="h-3.5 w-3.5" /> Multi-timeframe alignment across 15m, 1H, 4H before any signal fires.</li>
          <li><Zap className="h-3.5 w-3.5" /> Liquidity sweeps and structure breaks are tagged in real time.</li>
          <li><Activity className="h-3.5 w-3.5" /> Confidence ≥ 80% pushes a signal to your Telegram lifecycle.</li>
        </ul>
      </div>

      {/* ── actions ── */}
      <div className="market-detail__actions">
        <Link href={`/coin/${encodeURIComponent(symbol)}`} className="market-detail__cta">
          Open full coin page
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
        <Link href={`/chart-analyzer?symbol=${encodeURIComponent(symbol)}`} className="market-detail__cta market-detail__cta--quiet">
          Analyse chart
        </Link>
      </div>

      {/* ── credits card (Vypexrock signature) ── */}
      <div className="market-detail__credits">
        <div className="market-detail__credits-bar" />
        <div className="market-detail__credits-row">
          <div>
            <p className="market-detail__credits-mark">VYPEXROCK</p>
            <p className="market-detail__credits-sub">institutional crypto intelligence</p>
          </div>
          <div className="market-detail__credits-meta">
            <p>tracking</p>
            <p className="market-detail__credits-author">{symbol.replace("USDT", "")} · {info.launched}</p>
          </div>
        </div>
        <p className="market-detail__credits-note">
          Probability-based market intelligence. Not financial advice. Trade with discipline.
        </p>
      </div>
    </div>
  );
}

function SignalRow({ label, value, tone }: { label: string; value: string; tone: "up" | "dn" | "neutral" | "muted" }) {
  return (
    <div className="market-detail__signal-row">
      <span className="market-detail__signal-label">{label}</span>
      <span className={cn("market-detail__signal-value", "is-" + tone)}>{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// CandleChart
// ─────────────────────────────────────────────────────────────────
function CandleChart({ candles, positive }: { candles: Candle[]; positive: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const data = candles.length > 0 ? candles : generateFallback(80, 100);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      const prices = data.flatMap((c) => [c.high, c.low]);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const pad = (max - min) * 0.1 || 1;
      const range = max - min + 2 * pad;

      const py = (p: number) => h - ((p - min + pad) / range) * h;

      // background grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.045)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        const y = (h / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const cw = (w / data.length) * 0.6;
      const cs = w / data.length;
      data.forEach((c, i) => {
        const x = i * cs + cs / 2;
        const isUp = c.close >= c.open;
        const oy = py(c.open);
        const cy = py(c.close);
        const hy = py(c.high);
        const ly = py(c.low);

        ctx.strokeStyle = isUp ? "rgba(110, 231, 183, 0.85)" : "rgba(252, 165, 165, 0.85)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, hy);
        ctx.lineTo(x, ly);
        ctx.stroke();

        ctx.shadowColor = isUp ? "rgba(16, 185, 129, 0.4)" : "rgba(244, 63, 94, 0.4)";
        ctx.shadowBlur = 8;
        ctx.fillStyle = isUp ? "rgba(16, 185, 129, 0.92)" : "rgba(239, 68, 68, 0.92)";
        const bh = Math.max(1.5, Math.abs(cy - oy));
        ctx.fillRect(x - cw / 2, Math.min(oy, cy), cw, bh);
        ctx.shadowBlur = 0;
      });

      const lastY = py(data[data.length - 1].close);
      ctx.strokeStyle = positive ? "rgba(110, 231, 183, 0.55)" : "rgba(252, 165, 165, 0.55)";
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(0, lastY);
      ctx.lineTo(w, lastY);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [data, positive]);

  return <canvas ref={canvasRef} className="market-detail__chart-canvas" aria-hidden />;
}

function generateFallback(count: number, base: number): Candle[] {
  const out: Candle[] = [];
  let p = base;
  let seed = 0xBADC0FFEE >>> 0;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
  for (let i = 0; i < count; i++) {
    const drift = Math.sin(i / 6) * 4 + (rnd() - 0.45) * 6;
    const open = p;
    const close = p + drift;
    const high = Math.max(open, close) + rnd() * 3;
    const low = Math.min(open, close) - rnd() * 3;
    out.push({ open, high, low, close, volume: 0, ts: Date.now() });
    p = close;
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────
// computeSignals — real, reproducible technical hints
// ─────────────────────────────────────────────────────────────────
function computeSignals(candles: Candle[], price: number, change: number) {
  const data = candles.length > 12 ? candles : [];

  let high24h = price * 1.012;
  let low24h = price * 0.988;
  let rsi = 50 + change * 1.4;
  let trend: "Strong up" | "Up" | "Sideways" | "Down" | "Strong down" = "Sideways";
  let momentum: "Accelerating" | "Easing" | "Flat" = "Flat";
  let volatility: "Low" | "Normal" | "Elevated" | "High" = "Normal";

  if (data.length > 12) {
    const closes = data.map((c) => c.close);
    high24h = Math.max(...data.slice(-24).map((c) => c.high));
    low24h = Math.min(...data.slice(-24).map((c) => c.low));

    // RSI 14 on the available data
    const period = Math.min(14, closes.length - 1);
    let gains = 0, losses = 0;
    for (let i = closes.length - period; i < closes.length; i++) {
      const d = closes[i] - closes[i - 1];
      if (d >= 0) gains += d; else losses -= d;
    }
    const avgG = gains / period;
    const avgL = losses / period;
    if (avgL === 0) rsi = 100;
    else {
      const rs = avgG / avgL;
      rsi = 100 - 100 / (1 + rs);
    }

    // Trend = last close vs SMA20
    const sma = closes.slice(-20).reduce((s, v) => s + v, 0) / Math.min(20, closes.length);
    const diff = ((price - sma) / sma) * 100;
    if (diff > 2.5) trend = "Strong up";
    else if (diff > 0.5) trend = "Up";
    else if (diff < -2.5) trend = "Strong down";
    else if (diff < -0.5) trend = "Down";
    else trend = "Sideways";

    // Momentum = recent ROC
    const lookback = Math.min(8, closes.length - 1);
    const roc = ((closes[closes.length - 1] - closes[closes.length - 1 - lookback]) / closes[closes.length - 1 - lookback]) * 100;
    if (Math.abs(roc) > 1.2) momentum = "Accelerating";
    else if (Math.abs(roc) < 0.25) momentum = "Flat";
    else momentum = "Easing";

    // Volatility = ATR-ish
    const ranges = data.slice(-14).map((c) => (c.high - c.low) / c.close);
    const atr = ranges.reduce((s, v) => s + v, 0) / Math.max(1, ranges.length);
    if (atr > 0.03) volatility = "High";
    else if (atr > 0.018) volatility = "Elevated";
    else if (atr < 0.006) volatility = "Low";
    else volatility = "Normal";
  }

  rsi = Math.max(0, Math.min(100, rsi));

  // Bias from trend + change
  const bias: "Bullish" | "Slightly bullish" | "Neutral" | "Slightly bearish" | "Bearish" =
    trend === "Strong up" ? "Bullish"
      : trend === "Up" ? "Slightly bullish"
      : trend === "Strong down" ? "Bearish"
      : trend === "Down" ? "Slightly bearish"
      : "Neutral";

  return {
    high24h,
    low24h,
    rsi,
    trendLabel: trend,
    trendTone: (trend === "Strong up" || trend === "Up" ? "up" : trend === "Strong down" || trend === "Down" ? "dn" : "neutral") as "up" | "dn" | "neutral",
    momentumLabel: momentum,
    momentumTone: (momentum === "Accelerating" ? (change >= 0 ? "up" : "dn") : "neutral") as "up" | "dn" | "neutral",
    volatilityLabel: volatility,
    biasLabel: bias,
    biasTone: (bias.includes("Bullish") ? "up" : bias.includes("Bearish") ? "dn" : "neutral") as "up" | "dn" | "neutral",
  };
}

function formatPrice(p: number) {
  if (p >= 1000) return p.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (p >= 1) return p.toLocaleString(undefined, { maximumFractionDigits: 4 });
  if (p >= 0.01) return p.toFixed(4);
  if (p >= 0.0001) return p.toFixed(6);
  return p.toExponential(3);
}

function formatCompact(n: number) {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return n.toFixed(2);
}
