export type ChartAnalysisDecision =
  | "Strong Long"
  | "Long only on confirmation"
  | "Neutral / Wait"
  | "Short only on confirmation"
  | "Strong Short"
  | "Long"
  | "Short"
  | "Neutral Sell"
  | "Wait for confirmation"
  | "No trade";

export type ChartAnalysisResult = {
  symbol: string;
  timeframe: string;
  strategy: string;
  decision: ChartAnalysisDecision;
  bias: "long" | "short" | "neutral";
  confidence: number;
  entryZone: { low: number; high: number };
  stopLoss: number;
  takeProfits: [number, number, number];
  supportLevels: [number, number];
  resistanceLevels: [number, number];
  invalidationLevel: number;
  riskReward: string;
  indicators: string[];
  explanation: string;
  riskWarning: string;
  trendDirection: "up" | "down" | "sideways";
  source?: string;
  currentPrice?: number;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  ema20?: number;
  ema50?: number;
  chartImageUrl?: string | null;
  analyzedChartImageUrl?: string | null;
  structureNotes?: string[];
  timeframeAlignment?: string;
  marketStructure?: string;
};

type Input = {
  symbol: string;
  timeframe: string;
  strategy: string;
  indicators: string[];
  currentPrice?: number;
};

const basePrices: Record<string, number> = {
  BTCUSDT: 118250,
  ETHUSDT: 6120,
  SOLUSDT: 286.4,
  XRPUSDT: 1.76,
  DOGEUSDT: 0.34,
  ADAUSDT: 1.12,
  BNBUSDT: 928,
  XAUUSD: 3368
};

export function buildMockChartAnalysis({ symbol, timeframe, strategy, indicators, currentPrice }: Input): ChartAnalysisResult {
  const price = currentPrice ?? basePrices[symbol] ?? 100;
  const biasSeed = hashValue(`${symbol}-${timeframe}-${strategy}`);
  const longBias = biasSeed % 4 !== 0;
  const neutralBias = biasSeed % 7 === 0;
  const bias = neutralBias ? "neutral" : longBias ? "long" : "short";
  const amplitude = Math.max(price * getAmplitude(timeframe), price < 5 ? 0.012 : 0.5);

  const entryLow = roundPrice(price - amplitude * (bias === "short" ? -0.15 : 0.22));
  const entryHigh = roundPrice(price + amplitude * (bias === "short" ? 0.08 : 0.08));
  const stopLoss = roundPrice(
    bias === "long" ? entryLow - amplitude * 0.65 : bias === "short" ? entryHigh + amplitude * 0.65 : price - amplitude * 0.85
  );
  const tp1 = roundPrice(bias === "short" ? price - amplitude * 0.9 : price + amplitude * 0.95);
  const tp2 = roundPrice(bias === "short" ? price - amplitude * 1.55 : price + amplitude * 1.6);
  const tp3 = roundPrice(bias === "short" ? price - amplitude * 2.15 : price + amplitude * 2.35);
  const support1 = roundPrice(price - amplitude * 0.95);
  const support2 = roundPrice(price - amplitude * 1.35);
  const resistance1 = roundPrice(price + amplitude * 0.95);
  const resistance2 = roundPrice(price + amplitude * 1.38);
  const confidence = neutralBias ? 48 : 58 + (biasSeed % 24);
  const rrNumerator = Math.abs(tp2 - ((entryLow + entryHigh) / 2));
  const rrDenominator = Math.max(Math.abs(((entryLow + entryHigh) / 2) - stopLoss), price * 0.001);
  const riskReward = `${(rrNumerator / rrDenominator).toFixed(2)}R`;

  const decision: ChartAnalysisDecision =
    bias === "neutral"
      ? "Neutral / Wait"
      : bias === "long"
        ? confidence >= 85
          ? "Strong Long"
          : "Long only on confirmation"
        : confidence >= 85
          ? "Strong Short"
          : "Short only on confirmation";

  const explanation =
    bias === "long"
      ? `${symbol} is showing a constructive reclaim profile on ${timeframe}, with the ${strategy} framework favoring continuation only if price holds the proposed entry zone. This is an entry zone, not a market chase; wait for confirmation before risk is deployed.`
      : bias === "short"
        ? `${symbol} is showing fading strength on ${timeframe}, and the ${strategy} profile favors a risk-managed short only if price rejects the proposed entry zone. The scenario improves if lower highs continue to print and liquidity above resistance is rejected.`
        : `${symbol} is currently balanced on ${timeframe}. Structure is not clean enough for a high-conviction directional trade, so the preferred scenario is Neutral / Wait until either a reclaim through resistance or a decisive failure under support.`;

  return {
    symbol,
    timeframe,
    strategy,
    decision,
    bias,
    confidence,
    entryZone: { low: entryLow, high: entryHigh },
    stopLoss,
    takeProfits: [tp1, tp2, tp3],
    supportLevels: [support1, support2],
    resistanceLevels: [resistance1, resistance2],
    invalidationLevel: bias === "short" ? resistance2 : support2,
    riskReward,
    indicators: indicators.length ? indicators : ["RSI", "MACD", "EMA 20/50"],
    explanation,
    riskWarning:
      "This is a probability-based trade scenario, not financial advice. Wait for confirmation, define invalidation clearly, and keep risk sized appropriately.",
    trendDirection: bias === "neutral" ? "sideways" : bias === "long" ? "up" : "down"
  };
}

function getAmplitude(timeframe: string) {
  const map: Record<string, number> = {
    "1m": 0.0028,
    "5m": 0.0038,
    "15m": 0.0056,
    "30m": 0.0074,
    "1H": 0.0095,
    "4H": 0.014,
    "1D": 0.021,
    "1W": 0.031
  };
  return map[timeframe] ?? 0.008;
}

function hashValue(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function roundPrice(value: number) {
  if (value >= 1000) return Number(value.toFixed(0));
  if (value >= 100) return Number(value.toFixed(2));
  if (value >= 1) return Number(value.toFixed(3));
  return Number(value.toFixed(5));
}
