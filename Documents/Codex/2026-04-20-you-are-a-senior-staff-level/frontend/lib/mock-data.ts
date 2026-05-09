import type { CoinDetail, MarketTicker, Signal } from "@/types";
import { assetCatalog } from "@/lib/asset-catalog";

const newsTemplates = [
  "Macro liquidity remains supportive while traders rotate back into high-beta majors.",
  "Derivatives open interest is stable, reducing the odds of an immediate liquidation cascade.",
  "Momentum is improving, but breakout continuation still depends on volume confirmation."
];

export const dashboardFallbackRows: MarketTicker[] = [
  ...assetCatalog.map((item) => ({
    symbol: item.symbol,
    price: item.fallbackPrice,
    change_24h: item.fallbackChange,
    volume_24h: item.fallbackVolume,
    metadata_name: item.name
  }))
];

export const productSteps = [
  {
    step: "01",
    title: "Sign in",
    description: "Enter the private workspace first so live prices, watchlists, and AI analysis stay attached to your own account."
  },
  {
    step: "02",
    title: "Select a market",
    description: "Choose a pair, timeframe, and strategy profile designed for short-term execution or swing planning."
  },
  {
    step: "03",
    title: "Frame the context",
    description: "Blend structure, indicators, and custom prompt guidance so the analysis matches your playbook."
  }
];

export const watchlistHighlights = [
  { title: "Momentum leaders", value: "SOL, BTC, SUI", note: "Relative strength vs majors" },
  { title: "Risk mood", value: "Constructive", note: "Funding stable, breadth improving" },
  { title: "Members edge", value: "Private access", note: "Login-first luxury workspace" }
];

export const symbolChips = assetCatalog.slice(0, 18).map((item) => item.symbol);
export const strategyOptions = ["Precision Scalper", "Trend Continuation", "Liquidity Sweep Reversal", "Session Breakout"];
export const indicatorOptions = ["EMA 20/50", "RSI", "MACD", "VWAP", "Bollinger Bands", "ATR", "Supertrend"];

export function buildMockSignal(symbol: string, timeframe: string, price: number): Signal {
  const bullish = !symbol.startsWith("XRP");
  const baseMove = Math.max(price * 0.012, 0.001);
  return {
    id: Math.abs(hashCode(`${symbol}-${timeframe}`)),
    symbol,
    timeframe,
    bias: bullish ? "long" : "neutral",
    confidence: bullish ? 78 : 62,
    entry_low: round(price - baseMove * 0.4),
    entry_high: round(price + baseMove * 0.15),
    stop_loss: round(price - baseMove * 1.2),
    take_profit_1: round(price + baseMove * 0.9),
    take_profit_2: round(price + baseMove * 1.8),
    take_profit_3: round(price + baseMove * 2.7),
    rsi: bullish ? 58.2 : 49.4,
    ema20: round(price * 0.997),
    ema50: round(price * 0.991),
    macd: bullish ? 12.4 : 1.8,
    macd_signal: bullish ? 8.9 : 1.9,
    structure_state: bullish ? "breakout" : "range",
    explanation:
      bullish
        ? `${symbol} is trading above its short-term moving averages with constructive momentum and orderly pullbacks into demand.`
        : `${symbol} is compressing inside a balanced range, so conviction remains moderate until price expands with confirmation.`,
    suggested_risk_note:
      "Suggested levels are planning references only. Wait for confirmation around the highlighted zone and size risk conservatively."
  };
}

export function buildMockCoinDetail(symbol: string, interval: string): CoinDetail {
  const base = dashboardFallbackRows.find((item) => item.symbol === symbol.toUpperCase()) ?? dashboardFallbackRows[0];
  const price = base.price;
  const signal = buildMockSignal(symbol.toUpperCase(), interval, price);

  return {
    symbol: symbol.toUpperCase(),
    ticker: {
      ...base,
      symbol: symbol.toUpperCase(),
      metadata_name: symbol.replace("USDT", "").toUpperCase()
    },
    candles: Array.from({ length: 32 }).map((_, index) => {
      const drift = Math.sin(index / 3) * price * 0.006;
      const close = price + drift;
      return {
        open_time: new Date(Date.now() - (32 - index) * 60 * 60 * 1000).toISOString(),
        open: round(close - price * 0.002),
        high: round(close + price * 0.004),
        low: round(close - price * 0.005),
        close: round(close),
        volume: 1000000 + index * 35000
      };
    }),
    signals: [signal, buildMockSignal(symbol.toUpperCase(), "4h", price * 0.998)]
  };
}

export function buildAnalysisNarrative(symbol: string, signal: Signal) {
  const riskReward = ((signal.take_profit_2 - signal.entry_high) / Math.max(signal.entry_high - signal.stop_loss, 0.0001)).toFixed(2);
  return {
    tradeDecision: signal.bias === "long" ? "Long continuation" : signal.bias === "short" ? "Short continuation" : "Wait for confirmation",
    confidenceLabel: signal.confidence >= 75 ? "High conviction" : signal.confidence >= 60 ? "Qualified setup" : "Developing setup",
    riskReward,
    headline:
      signal.bias === "long"
        ? `${symbol} is holding trend support with a clean continuation profile.`
        : `${symbol} needs a stronger catalyst before a directional trade is justified.`,
    explanation:
      `${signal.explanation} ${newsTemplates[Math.abs(hashCode(symbol)) % newsTemplates.length]} Execution is best when price defends the proposed entry zone rather than after extension.`,
    recentAnalyses: [
      {
        title: "London session review",
        verdict: "Bias held",
        note: "Buy-side continuation respected VWAP and reclaimed intraday liquidity."
      },
      {
        title: "4H structure",
        verdict: "Constructive",
        note: "Higher lows remain intact while momentum cools into a controlled reset."
      }
    ],
    tradeHistory: [
      { label: "Last AI call", value: "TP1 hit", detail: "14h ago" },
      { label: "Past 7 signals", value: "71% win", detail: "Mock performance layer" },
      { label: "Avg. hold time", value: "6.2h", detail: "Intraday blend" }
    ],
    relatedNews: newsTemplates
  };
}

function hashCode(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function round(value: number) {
  return Number(value.toFixed(value > 1 ? 2 : 4));
}
