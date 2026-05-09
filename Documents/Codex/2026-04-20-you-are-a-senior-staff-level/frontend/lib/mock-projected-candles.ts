import type { ChartAnalysisResult } from "@/lib/mock-chart-analysis";

export type ProjectedCandle = {
  index: number;
  open: number;
  high: number;
  low: number;
  close: number;
  confidence: number;
};

export function buildProjectedCandles(analysis: ChartAnalysisResult): ProjectedCandle[] {
  const entry = (analysis.entryZone.low + analysis.entryZone.high) / 2;
  const target = analysis.bias === "neutral" ? entry : analysis.takeProfits[1] ?? analysis.takeProfits[0];
  const count = candleCountForTimeframe(analysis.timeframe);
  const volatility = Math.max(Math.abs(analysis.stopLoss - entry) * 0.18, Math.abs(target - entry) * 0.055, entry * 0.0006);
  const path = buildScenarioPath(entry, target, count, analysis.bias);

  return path.map((close, index) => {
    const open = index === 0 ? entry : path[index - 1];
    const wickPulse = volatility * (0.85 + (index % 3) * 0.22);
    const bodyHigh = Math.max(open, close);
    const bodyLow = Math.min(open, close);

    return {
      index,
      open: roundProjection(open),
      high: roundProjection(bodyHigh + wickPulse),
      low: roundProjection(bodyLow - wickPulse),
      close: roundProjection(close),
      confidence: Math.max(42, analysis.confidence - index * 3)
    };
  });
}

function buildScenarioPath(entry: number, target: number, count: number, bias: ChartAnalysisResult["bias"]) {
  if (bias === "neutral") {
    return Array.from({ length: count }, (_, index) => {
      const wave = Math.sin(index * 1.35) * entry * 0.0011;
      const drift = (index - count / 2) * entry * 0.00008;
      return entry + wave + drift;
    });
  }

  return Array.from({ length: count }, (_, index) => {
    const progress = (index + 1) / count;
    const eased = 1 - Math.pow(1 - progress, 1.7);
    const pullback = Math.sin(index * 1.45) * Math.abs(target - entry) * 0.08;
    return entry + (target - entry) * eased + pullback;
  });
}

function candleCountForTimeframe(timeframe: string) {
  if (["1s", "1m", "5m"].includes(timeframe)) return 12;
  if (["15m", "30m"].includes(timeframe)) return 9;
  if (["1H", "4H"].includes(timeframe)) return 7;
  return 5;
}

function roundProjection(value: number) {
  if (value >= 1000) return Number(value.toFixed(0));
  if (value >= 100) return Number(value.toFixed(2));
  if (value >= 1) return Number(value.toFixed(3));
  return Number(value.toFixed(5));
}
