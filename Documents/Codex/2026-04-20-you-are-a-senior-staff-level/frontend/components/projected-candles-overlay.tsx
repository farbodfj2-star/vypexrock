"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { ProjectedCandle } from "@/lib/mock-projected-candles";
import { cn, formatCurrency } from "@/lib/utils";

type Props = {
  candles: ProjectedCandle[];
  priceMin: number;
  priceMax: number;
  bias: "long" | "short" | "neutral";
  isDark?: boolean;
};

const viewport = {
  topPadding: 48,
  rightPadding: 72,
  bottomPadding: 48,
  leftPadding: 24
};

export function ProjectedCandlesOverlay({ candles, priceMin, priceMax, bias, isDark = false }: Props) {
  const layerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!layerRef.current) return;
    const updateSize = () => {
      if (!layerRef.current) return;
      const rect = layerRef.current.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    };
    updateSize();
    const observer = new ResizeObserver(() => window.requestAnimationFrame(updateSize));
    observer.observe(layerRef.current);
    return () => observer.disconnect();
  }, []);

  const points = useMemo(() => {
    if (!size.width || !size.height || candles.length === 0) return [];
    const plot = getPlotBounds(size.width, size.height);
    if (plot.width <= 0 || plot.height <= 0) return [];
    const plotLeft = plot.left + plot.width * 0.72;
    const plotRight = plot.right - 10;
    const availableWidth = Math.max(plotRight - plotLeft, 80);
    const spacing = clamp(availableWidth / Math.max(candles.length + 1, 2), 10, 16);
    const candleWidth = clamp(spacing * 0.58, 8, 12);

    return candles.map((candle, index) => {
      const x = clamp(plotLeft + spacing * (index + 1), plotLeft + 8, plotRight - 8);
      const openY = priceToY(candle.open, priceMin, priceMax, plot);
      const closeY = priceToY(candle.close, priceMin, priceMax, plot);
      const highY = priceToY(candle.high, priceMin, priceMax, plot);
      const lowY = priceToY(candle.low, priceMin, priceMax, plot);
      return { candle, x, openY, closeY, highY, lowY, candleWidth };
    });
  }, [candles, priceMax, priceMin, size.height, size.width]);

  const path = points.length
    ? points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.closeY.toFixed(1)}`).join(" ")
    : "";
  const lastPoint = points[points.length - 1];
  const label = bias === "long" ? "AI projection: upside scenario" : bias === "short" ? "AI projection: downside scenario" : "AI projection: range scenario";
  const pathColor = bias === "long" ? "#8b5cf6" : bias === "short" ? "#ec4899" : "#60a5fa";

  return (
    <div ref={layerRef} className="pointer-events-none absolute inset-0 z-20">
      {points.length ? (
        <>
          <svg className="absolute inset-0 h-full w-full overflow-visible">
            <path
              d={path}
              fill="none"
              stroke={pathColor}
              strokeWidth="2.4"
              strokeDasharray="7 8"
              strokeLinecap="round"
              className="forecast-path-draw"
              opacity="0.72"
              filter="drop-shadow(0 0 8px rgba(139, 92, 246, 0.55))"
            />
            {lastPoint ? (
              <path
                d={`M ${lastPoint.x - 8} ${lastPoint.closeY - 5} L ${lastPoint.x + 2} ${lastPoint.closeY} L ${lastPoint.x - 8} ${lastPoint.closeY + 5}`}
                fill="none"
                stroke={pathColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.82"
              />
            ) : null}
          </svg>

          <div
            className={cn(
              "chart-level-label absolute px-3 py-1.5 text-[11px] font-semibold",
              isDark
                ? "text-slate-100"
                : "text-slate-700"
            )}
            style={{
              left: clampNumber((points[0]?.x ?? size.width * 0.66) - 28, 10, size.width - 150),
              top: clampNumber((points[0]?.closeY ?? size.height * 0.44) - 34, viewport.topPadding, size.height - viewport.bottomPadding - 44)
            }}
          >
            AI Projection
          </div>

          {points.map((point, index) => {
            const bullish = point.candle.close >= point.candle.open;
            const bodyTop = Math.min(point.openY, point.closeY);
            const bodyHeight = Math.max(Math.abs(point.closeY - point.openY), 7);

            return (
              <div
                key={point.candle.index}
                className="projected-candle absolute"
                style={{
                  left: point.x,
                  top: 0,
                  animationDelay: `${index * 95}ms`
                }}
              >
                <div
                  className="absolute w-px border-l border-dashed border-violet-200/85 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                  style={{ height: point.lowY - point.highY, top: point.highY }}
                />
                <div
                  className={cn(
                    "absolute -translate-x-1/2 rounded-[3px] border border-dashed backdrop-blur-sm",
                    bullish
                      ? "border-violet-200/85 bg-violet-400/38 shadow-[0_0_14px_rgba(168,85,247,0.42)]"
                      : "border-fuchsia-200/80 bg-fuchsia-400/30 shadow-[0_0_14px_rgba(217,70,239,0.34)]"
                  )}
                  style={{ width: point.candleWidth, height: bodyHeight, top: bodyTop, left: 0 }}
                  title={`${formatCurrency(point.candle.open)} to ${formatCurrency(point.candle.close)} | Confidence ${point.candle.confidence}%`}
                />
              </div>
            );
          })}

          <div
            className={cn(
              "chart-glass-card absolute max-w-[230px] px-3 py-2 text-xs leading-5",
              isDark
                ? "text-slate-200"
                : "text-slate-700"
            )}
            style={{ right: viewport.rightPadding + 12, bottom: viewport.bottomPadding + 8 }}
          >
            {label}. Scenario-based, not financial advice.
          </div>
        </>
      ) : null}
    </div>
  );
}

type PlotBounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
};

function getPlotBounds(width: number, height: number): PlotBounds {
  const left = viewport.leftPadding;
  const top = viewport.topPadding;
  const right = Math.max(left + 120, width - viewport.rightPadding);
  const bottom = Math.max(top + 160, height - viewport.bottomPadding);
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}

function priceToY(price: number, min: number, max: number, plot: PlotBounds) {
  const safeRange = Math.max(max - min, 0.000001);
  const y = plot.top + ((max - price) / safeRange) * plot.height;
  return clampNumber(y, plot.top, plot.bottom);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
