import { getAsset } from "@/lib/asset-catalog";
import type { CoinDetail, MarketTicker, Signal } from "@/types";

export type MarketDecision = "Strong Long" | "Long" | "Watch Long" | "Wait" | "Watch Short" | "Short" | "Strong Short";

export type MarketSignalScore = {
  decision: MarketDecision;
  direction: "long" | "short" | "wait";
  confidence: number;
  score: number;
  badgeTone: "emerald" | "cyan" | "amber" | "rose" | "slate";
  shortText: string;
  reason: string;
  invalidation: number;
  entryLow: number;
  entryHigh: number;
  stopLoss: number | null;
  takeProfit1: number | null;
  takeProfit2: number | null;
  takeProfit3: number | null;
  longAbove: number;
  shortBelow: number;
  riskReward: string;
  volatility: number;
  structure: "breakout" | "breakdown" | "trend-up" | "trend-down" | "range";
};

export function scoreTicker(row: MarketTicker, rank = 0, total = 1): MarketSignalScore {
  const price = Math.max(Number(row.price) || getAsset(row.symbol)?.fallbackPrice || 1, 0.00000001);
  const change = Number(row.change_24h) || 0;
  const volume = Number(row.volume_24h) || 0;
  const volumeRank = total > 1 ? 1 - rank / Math.max(total - 1, 1) : 0.5;
  const volumeScore = volume <= 0 ? 0 : (volumeRank - 0.5) * 18;
  const momentumScore = clamp(change * 8, -36, 36);
  const trendScore = change > 3.5 ? 18 : change > 1.2 ? 10 : change < -3.5 ? -18 : change < -1.2 ? -10 : 0;
  const breakoutScore = Math.abs(change) > 5.5 ? Math.sign(change) * 12 : Math.abs(change) > 2.2 ? Math.sign(change) * 6 : 0;
  const syntheticNoise = seeded(row.symbol) * 10 - 5;
  const score = clamp(momentumScore + trendScore + breakoutScore + volumeScore + syntheticNoise, -85, 85);
  const volatility = estimateVolatility(price, change, row.symbol);

  return buildScore({
    symbol: row.symbol,
    price,
    score,
    change,
    volume,
    volatility,
    rsi: syntheticRsi(score),
    emaSpread: score / 420
  });
}

export function scoreCoinDetail(detail: CoinDetail): MarketSignalScore {
  const signal = detail.signals[0];
  const price = Math.max(detail.ticker.price || detail.candles.at(-1)?.close || getAsset(detail.symbol)?.fallbackPrice || 1, 0.00000001);
  const candleScore = scoreFromCandles(detail.candles, price);
  const signalScore = signal ? scoreFromSignal(signal) : 0;
  const tickerScore = clamp((detail.ticker.change_24h || 0) * 7, -30, 30);
  const score = clamp(candleScore * 0.52 + signalScore * 0.3 + tickerScore * 0.18, -90, 90);
  const volatility = estimateVolatilityFromCandles(detail.candles, price) || estimateVolatility(price, detail.ticker.change_24h, detail.symbol);

  return buildScore({
    symbol: detail.symbol,
    price,
    score,
    change: detail.ticker.change_24h,
    volume: detail.ticker.volume_24h,
    volatility,
    rsi: signal?.rsi,
    emaSpread: signal ? (signal.ema20 - signal.ema50) / price : undefined
  });
}

export function decisionLabelToBias(decision: MarketDecision) {
  if (decision.includes("Long")) return "long";
  if (decision.includes("Short")) return "short";
  return "neutral";
}

export function isWaitDecision(decision: MarketDecision) {
  return decision === "Wait";
}

export function formatDataSource(row: MarketTicker) {
  const source = getAsset(row.symbol)?.liveSource;
  if (source === "binance") return "Binance live";
  if (source === "gold-api") return "External gold feed";
  return "Fallback feed";
}

function buildScore({
  symbol,
  price,
  score,
  change,
  volume,
  volatility,
  rsi,
  emaSpread
}: {
  symbol: string;
  price: number;
  score: number;
  change: number;
  volume: number;
  volatility: number;
  rsi?: number;
  emaSpread?: number;
}): MarketSignalScore {
  const abs = Math.abs(score);
  const direction = score >= 16 ? "long" : score <= -16 ? "short" : "wait";
  const decision = decisionFromScore(score);
  const confidence = confidenceFromScore(score, rsi, emaSpread);
  const structure = structureFromScore(score, change);
  const entryPadding = volatility * 0.22;
  const stopDistance = volatility * (abs > 60 ? 1.25 : 1.55);
  const targetDistance = volatility * (abs > 60 ? 1.55 : 1.25);
  const longAbove = roundPrice(price + volatility * 0.42);
  const shortBelow = roundPrice(price - volatility * 0.42);

  if (direction === "long") {
    const entryLow = roundPrice(price - entryPadding * 1.05);
    const entryHigh = roundPrice(price + entryPadding * 0.45);
    const stopLoss = roundPrice(entryLow - stopDistance);
    const takeProfit1 = roundPrice(entryHigh + targetDistance);
    const takeProfit2 = roundPrice(entryHigh + targetDistance * 1.75);
    const takeProfit3 = roundPrice(entryHigh + targetDistance * 2.65);
    return {
      decision,
      direction,
      confidence,
      score,
      badgeTone: confidence >= 75 ? "emerald" : "cyan",
      shortText: confidence >= 75 ? "High-conviction long structure." : "Long bias with confirmation needed.",
      reason: buildReason(symbol, "long", confidence, change, volume, rsi, emaSpread),
      invalidation: stopLoss,
      entryLow,
      entryHigh,
      stopLoss,
      takeProfit1,
      takeProfit2,
      takeProfit3,
      longAbove,
      shortBelow,
      riskReward: riskReward(entryHigh, stopLoss, takeProfit2),
      volatility,
      structure
    };
  }

  if (direction === "short") {
    const entryLow = roundPrice(price - entryPadding * 0.45);
    const entryHigh = roundPrice(price + entryPadding * 1.05);
    const stopLoss = roundPrice(entryHigh + stopDistance);
    const takeProfit1 = roundPrice(entryLow - targetDistance);
    const takeProfit2 = roundPrice(entryLow - targetDistance * 1.75);
    const takeProfit3 = roundPrice(entryLow - targetDistance * 2.65);
    return {
      decision,
      direction,
      confidence,
      score,
      badgeTone: confidence >= 75 ? "rose" : "amber",
      shortText: confidence >= 75 ? "High-conviction short structure." : "Short bias below resistance.",
      reason: buildReason(symbol, "short", confidence, change, volume, rsi, emaSpread),
      invalidation: stopLoss,
      entryLow,
      entryHigh,
      stopLoss,
      takeProfit1,
      takeProfit2,
      takeProfit3,
      longAbove,
      shortBelow,
      riskReward: riskReward(entryLow, stopLoss, takeProfit2),
      volatility,
      structure
    };
  }

  return {
    decision,
    direction,
    confidence,
    score,
    badgeTone: "slate",
    shortText: "No clean edge yet.",
    reason: buildReason(symbol, "wait", confidence, change, volume, rsi, emaSpread),
    invalidation: roundPrice(price),
    entryLow: roundPrice(price),
    entryHigh: roundPrice(price),
    stopLoss: null,
    takeProfit1: null,
    takeProfit2: null,
    takeProfit3: null,
    longAbove,
    shortBelow,
    riskReward: "Trigger-only",
    volatility,
    structure
  };
}

function decisionFromScore(score: number): MarketDecision {
  if (score >= 64) return "Strong Long";
  if (score >= 38) return "Long";
  if (score >= 16) return "Watch Long";
  if (score <= -64) return "Strong Short";
  if (score <= -38) return "Short";
  if (score <= -16) return "Watch Short";
  return "Wait";
}

function confidenceFromScore(score: number, rsi?: number, emaSpread?: number) {
  let confidence = 42 + Math.abs(score) * 0.56;
  if (typeof rsi === "number") {
    if (score > 0 && rsi > 52 && rsi < 72) confidence += 5;
    if (score < 0 && rsi < 48 && rsi > 24) confidence += 5;
    if (rsi > 78 || rsi < 22) confidence -= 4;
  }
  if (typeof emaSpread === "number") {
    if (score > 0 && emaSpread > 0) confidence += 4;
    if (score < 0 && emaSpread < 0) confidence += 4;
  }
  return Math.round(clamp(confidence, 40, 88));
}

function buildReason(symbol: string, direction: "long" | "short" | "wait", confidence: number, change: number, volume: number, rsi?: number, emaSpread?: number) {
  const source = getAsset(symbol)?.liveSource === "fallback" ? " This asset is using a structured fallback feed until a live external provider is connected." : "";
  const rsiText = typeof rsi === "number" ? ` RSI is near ${rsi.toFixed(1)}.` : "";
  const emaText =
    typeof emaSpread === "number"
      ? emaSpread > 0
        ? " EMA trend is constructive."
        : emaSpread < 0
          ? " EMA trend is weak."
          : " EMA trend is flat."
      : "";
  const volumeText = volume > 0 ? " Volume participation is available." : " Volume is marked as N/A for this market.";

  if (direction === "long") {
    if (confidence >= 75) return `Momentum is strong and buyers are controlling structure. Long setup remains valid while price holds invalidation.${rsiText}${emaText}${source}`;
    if (change > 2.5) return `Momentum is improving. Watch for breakout confirmation instead of chasing extension.${rsiText}${emaText}${source}`;
    return `Long bias is forming, but entry quality matters. Prefer pullbacks into the entry zone.${rsiText}${source}`;
  }

  if (direction === "short") {
    if (confidence >= 75) return `Downside pressure is strong and sellers control the short-term structure. Short bias active below resistance.${rsiText}${emaText}${source}`;
    if (change < -2.5) return `Price is weak but may be extended. Watch for a failed retest before entering short.${rsiText}${emaText}${source}`;
    return `Short bias is developing below resistance. Avoid entering late into a support bounce.${rsiText}${source}`;
  }

  if (Math.abs(change) < 0.35) return `No clean edge yet. Price is balanced and ${volumeText.toLowerCase()} Stay patient until a trigger breaks.${source}`;
  return `Signals are mixed. Long above confirmation, short below breakdown. Avoid forcing trades inside the range.${rsiText}${source}`;
}

function scoreFromCandles(candles: CoinDetail["candles"], fallbackPrice: number) {
  if (candles.length < 8) return 0;
  const closes = candles.map((item) => item.close);
  const last = closes.at(-1) ?? fallbackPrice;
  const previous = closes.at(-8) ?? last;
  const momentum = ((last - previous) / Math.max(previous, 0.00000001)) * 100;
  const recentHigh = Math.max(...candles.slice(-16, -1).map((item) => item.high));
  const recentLow = Math.min(...candles.slice(-16, -1).map((item) => item.low));
  const breakout = last > recentHigh ? 18 : last < recentLow ? -18 : 0;
  return clamp(momentum * 12 + breakout, -80, 80);
}

function scoreFromSignal(signal: Signal) {
  const biasScore = signal.bias === "long" ? 34 : signal.bias === "short" ? -34 : 0;
  const confidenceAdjustment = (signal.confidence - 55) * 0.75;
  const emaScore = signal.ema20 > signal.ema50 ? 14 : signal.ema20 < signal.ema50 ? -14 : 0;
  const macdScore = signal.macd > signal.macd_signal ? 8 : signal.macd < signal.macd_signal ? -8 : 0;
  return clamp(biasScore + confidenceAdjustment + emaScore + macdScore, -80, 80);
}

function structureFromScore(score: number, change: number): MarketSignalScore["structure"] {
  if (score > 48 && change > 2.5) return "breakout";
  if (score < -48 && change < -2.5) return "breakdown";
  if (score > 16) return "trend-up";
  if (score < -16) return "trend-down";
  return "range";
}

function syntheticRsi(score: number) {
  return clamp(50 + score * 0.32, 18, 82);
}

function estimateVolatility(price: number, change: number, symbol: string) {
  const asset = getAsset(symbol);
  const baseline = asset?.group === "Forex" ? 0.0038 : asset?.group === "Stocks" ? 0.007 : asset?.symbol === "XAUUSD" ? 0.006 : 0.014;
  return Math.max(price * (baseline + Math.min(Math.abs(change), 8) / 1000), price * 0.001);
}

function estimateVolatilityFromCandles(candles: CoinDetail["candles"], price: number) {
  if (candles.length < 5) return 0;
  const recent = candles.slice(-14);
  const avgRange = recent.reduce((sum, candle) => sum + Math.abs(candle.high - candle.low), 0) / recent.length;
  return Math.max(avgRange, price * 0.001);
}

function riskReward(entry: number, stop: number, target: number | null) {
  if (target === null) return "Trigger-only";
  const risk = Math.abs(entry - stop);
  const reward = Math.abs(target - entry);
  return `${(reward / Math.max(risk, 0.00000001)).toFixed(2)}R`;
}

function seeded(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return (Math.abs(hash) % 1000) / 1000;
}

function roundPrice(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1000) return Number(value.toFixed(2));
  if (abs >= 1) return Number(value.toFixed(4));
  if (abs >= 0.01) return Number(value.toFixed(6));
  return Number(value.toFixed(8));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
