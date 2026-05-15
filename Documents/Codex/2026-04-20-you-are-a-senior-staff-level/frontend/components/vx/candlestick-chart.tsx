"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Candle } from "@/types";

type CandlestickChartProps = {
  symbol: string;
  interval?: string;
  className?: string;
  height?: number;
  showLevels?: boolean;
  entry?: number;
  stop?: number;
  tp?: number;
};

export function CandlestickChart({
  symbol,
  interval = "15m",
  className,
  height = 220,
  showLevels = false,
  entry,
  stop,
  tp
}: CandlestickChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["candles", symbol, interval],
    queryFn: () =>
      apiFetch<{ candles: Candle[] }>(`/market/coins/${symbol}?interval=${encodeURIComponent(interval)}`),
    enabled: Boolean(symbol),
    staleTime: 30_000,
    refetchInterval: 45_000
  });

  const candles = useMemo(() => {
    const rows = data?.candles ?? [];
    return rows.slice(-72).map((c) => ({
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume
    }));
  }, [data]);

  if (isLoading || !candles.length) {
    return <div className={cn("vx-skeleton w-full rounded-xl", className)} style={{ height }} />;
  }

  const prices = candles.flatMap((c) => [c.high, c.low]);
  if (showLevels) {
    if (entry) prices.push(entry);
    if (stop) prices.push(stop);
    if (tp) prices.push(tp);
  }
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const pad = (max - min) * 0.06 || max * 0.002;
  const yMin = min - pad;
  const yMax = max + pad;
  const w = 100;
  const h = 72;
  const volH = 12;
  const chartH = h - volH;
  const gap = w / candles.length;
  const bodyW = Math.max(0.55, Math.min(1.4, gap * 0.62));
  const maxVol = Math.max(...candles.map((c) => c.volume), 1);

  const toY = (price: number) => chartH - ((price - yMin) / (yMax - yMin)) * chartH;
  const level = (price?: number) => (price ? toY(price) : null);

  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-[#05070c]/90", className)} style={{ height }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {[0, 1, 2, 3, 4].map((i) => {
          const y = (chartH / 4) * i;
          return <line key={i} x1="0" y1={y} x2={w} y2={y} stroke="rgba(148,163,184,0.08)" strokeWidth="0.15" />;
        })}
        {showLevels && level(tp) !== null ? (
          <line x1="0" y1={level(tp)!} x2={w} y2={level(tp)!} stroke="rgba(52,211,153,0.45)" strokeWidth="0.2" strokeDasharray="0.8 0.8" />
        ) : null}
        {showLevels && level(entry) !== null ? (
          <line x1="0" y1={level(entry)!} x2={w} y2={level(entry)!} stroke="rgba(167,139,250,0.55)" strokeWidth="0.22" />
        ) : null}
        {showLevels && level(stop) !== null ? (
          <line x1="0" y1={level(stop)!} x2={w} y2={level(stop)!} stroke="rgba(244,63,94,0.5)" strokeWidth="0.22" />
        ) : null}
        {candles.map((candle, index) => {
          const x = index * gap + gap / 2;
          const up = candle.close >= candle.open;
          const color = up ? "#10b981" : "#ef4444";
          const wick = up ? "#6ee7b7" : "#fca5a5";
          const oy = toY(candle.open);
          const cy = toY(candle.close);
          const hy = toY(candle.high);
          const ly = toY(candle.low);
          const vh = (candle.volume / maxVol) * volH;
          return (
            <g key={index}>
              <line x1={x} y1={hy} x2={x} y2={ly} stroke={wick} strokeWidth="0.18" />
              <rect x={x - bodyW / 2} y={Math.min(oy, cy)} width={bodyW} height={Math.max(0.35, Math.abs(cy - oy))} fill={color} rx="0.12" />
              <rect x={x - bodyW / 2} y={h - vh} width={bodyW} height={vh} fill={color} opacity="0.35" />
            </g>
          );
        })}
      </svg>
      <div className="absolute left-3 top-3 text-[10px] font-medium uppercase tracking-widest text-white/45">{symbol}</div>
      <div className="absolute right-3 top-3 text-[10px] text-white/35">{interval.toUpperCase()}</div>
    </div>
  );
}
