"use client";

import { CandlestickChart } from "@/components/vx/candlestick-chart";
import type { MarketTicker } from "@/types";
import { cn } from "@/lib/utils";

type TradingChartProps = {
  rows: MarketTicker[];
  symbol?: string;
  className?: string;
  height?: number;
};

/** Live OHLC terminal chart — replaces synthetic line series. */
export function TradingChart({ rows, symbol, className, height = 220 }: TradingChartProps) {
  const target = symbol ?? rows[0]?.symbol;
  if (!target) {
    return <div className={cn("vx-skeleton w-full rounded-xl", className)} style={{ height }} />;
  }

  return <CandlestickChart symbol={target} interval="15m" className={className} height={height} showLevels />;
}
