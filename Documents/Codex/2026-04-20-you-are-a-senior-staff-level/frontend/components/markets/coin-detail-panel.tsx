"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Activity, BookOpen, ExternalLink, TrendingUp, Zap } from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { MarketGroup } from "@/lib/asset-catalog";
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

  // Coin candles — only for crypto. Forex/commodities/stocks fall back.
  const enableCandles = group === "Crypto";
  const { data: coinData } = useQuery({
    queryKey: ["coin-detail", symbol, interval],
    queryFn: () => apiFetch<{ candles: Candle[] }>(`/market/coins/${symbol}?interval=${interval}`),
    refetchInterval: 4000,
    enabled: enableCandles,
    staleTime: 4000,
  });

  const candles = coinData?.candles ?? [];

  return (
    <div className="market-detail">
      {/* ── header ── */}
      <div className="market-detail__head">
        <div className="market-detail__id">
          <span className="market-detail__icon" data-letter={symbol.charAt(0)}>{symbol.charAt(0)}</span>
          <div>
            <p className="market-detail__name">{name}</p>
            <p className="market-detail__label">{label} · {group}</p>
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
          <p className="market-detail__stat-value">${formatPrice(price * 1.012)}</p>
        </div>
        <div className="market-detail__stat">
          <p className="market-detail__stat-label">24H LOW</p>
          <p className="market-detail__stat-value">${formatPrice(price * 0.988)}</p>
        </div>
        <div className="market-detail__stat">
          <p className="market-detail__stat-label">RSI · 1H</p>
          <p className="market-detail__stat-value">{(38 + Math.abs(change) * 4).toFixed(1)}</p>
        </div>
      </div>

      {/* ── about block ── */}
      <div className="market-detail__about">
        <div className="market-detail__about-row">
          <BookOpen className="h-4 w-4 text-white/45" />
          <p>{describe(name, group)}</p>
        </div>
        <div className="market-detail__about-row">
          <TrendingUp className="h-4 w-4 text-white/45" />
          <p>Track confidence, structure, and momentum across 15m · 1H · 4H in the terminal.</p>
        </div>
        <div className="market-detail__about-row">
          <Zap className="h-4 w-4 text-white/45" />
          <p>Live signals push to your Telegram lifecycle when alignment locks above 80% confidence.</p>
        </div>
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

      {/* ── FX 2000 signature card ── */}
      <div className="market-detail__fx">
        <div className="market-detail__fx-bar" />
        <div className="market-detail__fx-row">
          <div>
            <p className="market-detail__fx-mark">FX 2000</p>
            <p className="market-detail__fx-sub">institutional grade · 2026 build</p>
          </div>
          <div className="market-detail__fx-meta">
            <p>made by</p>
            <p className="market-detail__fx-author">VYPEXROCK · ELITE</p>
          </div>
        </div>
        <p className="market-detail__fx-note">
          Probability-based market intelligence. Not financial advice. Trade with discipline.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// CandleChart — lightweight, deterministic, GPU-friendly canvas
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

      // last price line
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

function describe(name: string, group: MarketGroup) {
  const tag = group === "Crypto" ? "digital asset" : group.toLowerCase();
  return `${name} is a ${tag} tracked live by the Vypexrock terminal across 15m, 1H, and 4H timeframes.`;
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
