"use client";

import { useEffect, useRef, useState } from "react";

import { ChartAnalysisLoadingOverlay } from "@/components/chart-analysis-loading-overlay";
import { ProjectedCandlesOverlay } from "@/components/projected-candles-overlay";
import { formatCurrency } from "@/lib/utils";
import type { ChartAnalysisResult } from "@/lib/mock-chart-analysis";
import type { ProjectedCandle } from "@/lib/mock-projected-candles";

export function ChartAnalysisOverlay({
  analysis,
  loading,
  isDark = false,
  projectedCandles = []
}: {
  analysis: ChartAnalysisResult | null;
  loading?: boolean;
  isDark?: boolean;
  projectedCandles?: ProjectedCandle[];
}) {
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

  if (!analysis && !loading) return null;

  const plot = getPlotBounds(size.width, size.height);
  const levels = analysis && plot ? buildLevelMap(analysis, projectedCandles, plot) : null;

  return (
    <div ref={layerRef} className="pointer-events-none absolute inset-0 overflow-hidden">
      {loading ? <ChartAnalysisLoadingOverlay isDark={isDark} /> : null}

      {analysis && levels && plot ? (
        <div className="chart-overlay-reveal">
          <DecisionBadge plot={plot} decision={analysis.decision} confidence={analysis.confidence} bias={analysis.bias} />
          {analysis.bias === "neutral" ? (
            <WaitLabel plot={plot} y={levels.entry.y} />
          ) : (
            <TradeBox
              plot={plot}
              entryY={levels.entry.y}
              stopY={levels.stop.y}
              targetY={levels.target.y}
              direction={analysis.bias === "short" ? "short" : "long"}
            />
          )}
          <StructureLine plot={plot} y={levels.resistance.y} label={`Resistance ${formatCurrency(levels.resistance.price)}`} tone="resistance" />
          <StructureLine plot={plot} y={levels.support.y} label={`Support ${formatCurrency(levels.support.price)}`} tone="support" />
          <BollingerLine plot={plot} y={levels.bbUpper.y} label={`BB Upper ${formatCurrency(levels.bbUpper.price)}`} />
          <BollingerLine plot={plot} y={levels.bbLower.y} label={`BB Lower ${formatCurrency(levels.bbLower.price)}`} />
          {analysis.bias === "neutral" ? (
            <LevelLine plot={plot} y={levels.entry.y} label={`Watch zone ${formatCurrency(levels.entry.price)}`} tone="entry" />
          ) : (
            <>
              <LevelLine plot={plot} y={levels.stop.y} label={`Stop Loss ${formatCurrency(analysis.stopLoss)}`} tone="stop" />
              <LevelLine plot={plot} y={levels.entry.y} label={`Entry ${formatCurrency(levels.entry.price)}`} tone="entry" />
              <LevelLine plot={plot} y={levels.tp1.y} label={`TP1 ${formatCurrency(analysis.takeProfits[0])}`} tone="target" />
              <LevelLine plot={plot} y={levels.tp2.y} label={`TP2 ${formatCurrency(analysis.takeProfits[1])}`} tone="target" compact />
              <LevelLine plot={plot} y={levels.tp3.y} label={`TP3 ${formatCurrency(analysis.takeProfits[2])}`} tone="target" compact />
            </>
          )}
          <ProjectedCandlesOverlay
            candles={projectedCandles}
            priceMin={levels.priceMin}
            priceMax={levels.priceMax}
            bias={analysis.bias}
            isDark={isDark}
          />
        </div>
      ) : null}
    </div>
  );
}

function DecisionBadge({
  plot,
  decision,
  confidence,
  bias
}: {
  plot: PlotBounds;
  decision: string;
  confidence: number;
  bias: ChartAnalysisResult["bias"];
}) {
  const tone =
    bias === "long"
      ? "bg-emerald-400/18 text-emerald-100 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.28),0_0_22px_rgba(16,185,129,0.18)]"
      : bias === "short"
        ? "bg-rose-400/18 text-rose-100 shadow-[inset_0_0_0_1px_rgba(251,113,133,0.28),0_0_22px_rgba(244,63,94,0.18)]"
        : "bg-amber-300/18 text-amber-100 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.28),0_0_22px_rgba(251,191,36,0.14)]";

  return (
    <div
      className={`absolute rounded-2xl px-3 py-2 text-xs font-semibold backdrop-blur-xl ${tone}`}
      style={{ left: plot.left + 12, top: plot.top + 12 }}
    >
      {decision} · {confidence}% confidence
    </div>
  );
}

function WaitLabel({ plot, y }: { plot: PlotBounds; y: number }) {
  return (
    <div
      className="absolute rounded-2xl bg-amber-300/16 px-3 py-2 text-xs font-semibold text-amber-100 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.25),0_0_22px_rgba(251,191,36,0.12)] backdrop-blur-xl"
      style={{ left: plot.left + plot.width * 0.58, top: Math.max(plot.top + 54, y - 42) }}
    >
      Wait / No clean trade yet
    </div>
  );
}

function TradeBox({
  plot,
  entryY,
  stopY,
  targetY,
  direction
}: {
  plot: PlotBounds;
  entryY: number;
  stopY: number;
  targetY: number;
  direction: "long" | "short";
}) {
  const x = plot.left + plot.width * 0.62;
  const width = plot.width * 0.25;
  const riskTop = Math.min(entryY, stopY);
  const riskHeight = Math.abs(stopY - entryY);
  const rewardTop = Math.min(entryY, targetY);
  const rewardHeight = Math.abs(targetY - entryY);

  return (
    <>
      <div
        className="absolute chart-risk-zone"
        style={{ left: x, width, top: riskTop, height: Math.max(riskHeight, 10) }}
      />
      <div
        className="absolute chart-reward-zone"
        style={{ left: x, width, top: rewardTop, height: Math.max(rewardHeight, 10) }}
      />
      <div
        className="absolute left-[61%] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400 shadow-[0_0_16px_rgba(96,165,250,0.85)]"
        style={{
          left: x - 6,
          top: entryY
        }}
      />
    </>
  );
}

function StructureLine({
  plot,
  y,
  label,
  tone
}: {
  plot: PlotBounds;
  y: number;
  label: string;
  tone: "support" | "resistance";
}) {
  const color = tone === "support" ? "border-emerald-300/45 text-emerald-100" : "border-amber-300/45 text-amber-100";
  return (
    <div className="absolute" style={{ left: plot.left + 18, width: plot.width - 18, top: y }}>
      <div className={`border-t border-dashed ${color}`} />
      <div className={`absolute left-2 top-[-12px] rounded-full bg-slate-950/55 px-2 py-1 text-[10px] font-medium backdrop-blur-md ${color}`}>{label}</div>
    </div>
  );
}

function LevelLine({
  plot,
  y,
  label,
  tone,
  compact = false
}: {
  plot: PlotBounds;
  y: number;
  label: string;
  tone: "entry" | "stop" | "target";
  compact?: boolean;
}) {
  const styles = {
    entry: "chart-label-entry text-white",
    stop: "chart-label-stop text-white",
    target: "chart-label-target text-white"
  }[tone];

  const line = {
    entry: "chart-line-entry",
    stop: "chart-line-stop",
    target: "chart-line-target"
  }[tone];

  return (
    <div className="absolute" style={{ left: plot.left, width: plot.width, top: y }}>
      <div className={`h-px ${line}`} />
      <div className={`chart-level-label absolute right-0 top-[-15px] px-2.5 py-1.5 ${compact ? "text-[10px]" : "text-xs"} font-semibold ${styles}`}>{label}</div>
    </div>
  );
}

function BollingerLine({ plot, y, label }: { plot: PlotBounds; y: number; label: string }) {
  return (
    <div className="absolute" style={{ left: plot.left + 36, width: plot.width - 36, top: y }}>
      <div className="h-px bg-sky-300/55 shadow-[0_0_12px_rgba(125,211,252,0.45)]" />
      <div className="chart-level-label absolute right-0 top-[-15px] px-2.5 py-1.5 text-xs font-medium text-white chart-label-bb">{label}</div>
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

function getPlotBounds(width: number, height: number): PlotBounds | null {
  if (width <= 0 || height <= 0) return null;
  const left = 24;
  const top = 48;
  const right = Math.max(left + 180, width - 72);
  const bottom = Math.max(top + 220, height - 48);
  return { left, right, top, bottom, width: right - left, height: bottom - top };
}

function buildLevelMap(analysis: ChartAnalysisResult, projectedCandles: ProjectedCandle[], plot: PlotBounds) {
  const entry = (analysis.entryZone.low + analysis.entryZone.high) / 2;
  const projectedPrices = projectedCandles.flatMap((candle) => [candle.open, candle.high, candle.low, candle.close]);
  const prices = [analysis.stopLoss, ...analysis.takeProfits, analysis.invalidationLevel, ...analysis.supportLevels, ...analysis.resistanceLevels, ...projectedPrices];
  const maxDistance = Math.max(...prices.map((price) => Math.abs(price - entry)), entry * 0.004, 0.0001);
  const max = entry + maxDistance * 1.8;
  const min = entry - maxDistance * 1.8;
  const yForPrice = (price: number) => clamp(plot.top + ((max - price) / (max - min)) * plot.height, plot.top, plot.bottom);
  const bbOffset = maxDistance * 0.72;

  return {
    priceMin: min,
    priceMax: max,
    entry: { price: entry, y: yForPrice(entry) },
    stop: { price: analysis.stopLoss, y: yForPrice(analysis.stopLoss) },
    target: { price: analysis.takeProfits[0], y: yForPrice(analysis.takeProfits[0]) },
    tp1: { price: analysis.takeProfits[0], y: yForPrice(analysis.takeProfits[0]) },
    tp2: { price: analysis.takeProfits[1], y: yForPrice(analysis.takeProfits[1]) },
    tp3: { price: analysis.takeProfits[2], y: yForPrice(analysis.takeProfits[2]) },
    support: { price: analysis.supportLevels[0], y: yForPrice(analysis.supportLevels[0]) },
    resistance: { price: analysis.resistanceLevels[0], y: yForPrice(analysis.resistanceLevels[0]) },
    bbUpper: { price: entry + bbOffset, y: yForPrice(entry + bbOffset) },
    bbLower: { price: entry - bbOffset, y: yForPrice(entry - bbOffset) }
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
