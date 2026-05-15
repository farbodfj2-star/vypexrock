"use client";

import { useMemo } from "react";

import type { MarketTicker } from "@/types";
import { cn } from "@/lib/utils";

type TradingChartProps = {
  rows: MarketTicker[];
  symbol?: string;
  className?: string;
  height?: number;
};

export function TradingChart({ rows, symbol, className, height = 220 }: TradingChartProps) {
  const target = symbol ? rows.find((r) => r.symbol === symbol) ?? rows[0] : rows[0];
  const series = useMemo(() => buildPriceSeries(target), [target]);

  if (!series.length) {
    return <div className={cn("vx-skeleton w-full", className)} style={{ height }} />;
  }

  const min = Math.min(...series.map((p) => p.y));
  const max = Math.max(...series.map((p) => p.y));
  const pad = (max - min) * 0.08 || max * 0.01;
  const yMin = min - pad;
  const yMax = max + pad;
  const w = 100;
  const h = 100;

  const toX = (i: number) => (i / Math.max(series.length - 1, 1)) * w;
  const toY = (y: number) => h - ((y - yMin) / (yMax - yMin)) * h;

  const linePath = series.map((p, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(2)},${toY(p.y).toFixed(2)}`).join(" ");
  const areaPath = `${linePath} L${w},${h} L0,${h} Z`;

  const entry = series[Math.floor(series.length * 0.55)]?.y ?? series.at(-1)!.y;
  const stop = yMin + (yMax - yMin) * 0.18;
  const tp = yMax - (yMax - yMin) * 0.12;
  const bullish = (target?.change_24h ?? 0) >= 0;

  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)} style={{ height }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="vx-chart-svg absolute inset-0">
        <defs>
          <linearGradient id="vxArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={bullish ? "rgba(52,211,153,0.22)" : "rgba(244,63,94,0.18)"} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <linearGradient id="vxLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5eead4" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <rect x="0" y={toY(tp)} width={w} height={toY(entry) - toY(tp)} fill="rgba(52,211,153,0.06)" />
        <rect x="0" y={toY(entry)} width={w} height={toY(stop) - toY(entry)} fill="rgba(244,63,94,0.05)" />
        <line x1="0" y1={toY(tp)} x2={w} y2={toY(tp)} stroke="rgba(52,211,153,0.45)" strokeWidth="0.25" strokeDasharray="1 1" />
        <line x1="0" y1={toY(entry)} x2={w} y2={toY(entry)} stroke="rgba(167,139,250,0.55)" strokeWidth="0.3" />
        <line x1="0" y1={toY(stop)} x2={w} y2={toY(stop)} stroke="rgba(244,63,94,0.5)" strokeWidth="0.3" />
        <path d={areaPath} fill="url(#vxArea)" />
        <path d={linePath} fill="none" stroke="url(#vxLine)" strokeWidth="0.55" strokeLinecap="round" strokeLinejoin="round" />
        {series.slice(-24).map((p, i, arr) => {
          const idx = series.length - arr.length + i;
          const up = i === 0 ? true : p.y >= arr[i - 1].y;
          const bodyH = Math.max(1.2, Math.abs((p.y - (arr[i - 1]?.y ?? p.y)) / (yMax - yMin)) * 40);
          return (
            <rect
              key={idx}
              x={toX(idx) - 0.9}
              y={toY(Math.max(p.y, arr[i - 1]?.y ?? p.y)) - bodyH}
              width="1.8"
              height={bodyH}
              rx="0.2"
              fill={up ? "rgba(52,211,153,0.85)" : "rgba(244,63,94,0.85)"}
              opacity={0.35 + (i / arr.length) * 0.5}
            />
          );
        })}
      </svg>
      <div className="absolute left-3 top-3 text-[10px] font-medium uppercase tracking-widest text-white/40">
        {target?.symbol ?? "MARKET"}
      </div>
      <span className="absolute right-3 top-[18%] rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">TP</span>
      <span className="absolute right-3 top-[42%] rounded bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-200">Entry</span>
      <span className="absolute right-3 top-[68%] rounded bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-300">SL</span>
    </div>
  );
}

function buildPriceSeries(row?: MarketTicker) {
  if (!row) return [];
  const price = Math.max(row.price, 0.0000001);
  const drift = (row.change_24h ?? 0) / 100 / 48;
  const seed = hash(row.symbol);
  const points: { y: number }[] = [];
  let p = price * (1 - drift * 24);
  for (let i = 0; i < 64; i++) {
    const noise = (pseudo(seed + i) - 0.5) * price * 0.004;
    p = Math.max(p * (1 + drift + noise / price), price * 0.85);
    points.push({ y: p });
  }
  points[points.length - 1] = { y: price };
  return points;
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
}

function pseudo(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}
