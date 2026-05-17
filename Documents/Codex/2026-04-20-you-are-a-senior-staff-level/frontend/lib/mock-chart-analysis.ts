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

export type Scenario = {
  name: string;
  probability: number; // 0-100
  trigger: string;
  outcome: string;
  invalidation: string;
};

export type ConfluencePoint = {
  factor: string;
  status: "supportive" | "neutral" | "against";
  detail: string;
};

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

  // ── v2 fields: deeper prediction context ──
  scenarios?: Scenario[];
  confluence?: ConfluencePoint[];
  positionSize?: { riskPercent: number; sizeUsd: number; estLeverage: string };
  expectedMove?: { window: string; range: string; bias: string };
  liquidityZones?: { type: "above" | "below"; price: number; description: string }[];
  keyMessage?: string;
  followUp?: string[];
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
  XAUUSD: 3368,
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
    bias === "long" ? entryLow - amplitude * 0.65 : bias === "short" ? entryHigh + amplitude * 0.65 : price - amplitude * 0.85,
  );
  const tp1 = roundPrice(bias === "short" ? price - amplitude * 0.9 : price + amplitude * 0.95);
  const tp2 = roundPrice(bias === "short" ? price - amplitude * 1.55 : price + amplitude * 1.6);
  const tp3 = roundPrice(bias === "short" ? price - amplitude * 2.15 : price + amplitude * 2.35);
  const support1 = roundPrice(price - amplitude * 0.95);
  const support2 = roundPrice(price - amplitude * 1.35);
  const resistance1 = roundPrice(price + amplitude * 0.95);
  const resistance2 = roundPrice(price + amplitude * 1.38);
  const confidence = neutralBias ? 48 : 58 + (biasSeed % 24);
  const entry = (entryLow + entryHigh) / 2;
  const rrNumerator = Math.abs(tp2 - entry);
  const rrDenominator = Math.max(Math.abs(entry - stopLoss), price * 0.001);
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

  const explanation = buildExplanation({ symbol, timeframe, strategy, bias, price, entry, stopLoss, tp2, support1, resistance1 });

  const scenarios: Scenario[] = buildScenarios({ bias, price, entry, tp1, tp2, tp3, stopLoss, support1, support2, resistance1, resistance2, confidence });
  const confluence: ConfluencePoint[] = buildConfluence({ bias, indicators, timeframe });
  const positionSize = buildPositionSize({ entry, stopLoss });
  const expectedMove = buildExpectedMove({ timeframe, bias, price, tp2 });
  const liquidityZones: ChartAnalysisResult["liquidityZones"] = [
    { type: "above", price: resistance1, description: "Sell-side liquidity / equal highs" },
    { type: "above", price: resistance2, description: "Higher-timeframe supply" },
    { type: "below", price: support1, description: "Buy-side liquidity / prior swing" },
    { type: "below", price: support2, description: "Deeper demand pocket" },
  ];

  const keyMessage = buildKeyMessage(bias, decision);
  const followUp = buildFollowUp(bias);

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
    trendDirection: bias === "neutral" ? "sideways" : bias === "long" ? "up" : "down",
    scenarios,
    confluence,
    positionSize,
    expectedMove,
    liquidityZones,
    keyMessage,
    followUp,
  };
}

// ── helpers ──────────────────────────────────────────────────────

function buildExplanation(args: {
  symbol: string;
  timeframe: string;
  strategy: string;
  bias: "long" | "short" | "neutral";
  price: number;
  entry: number;
  stopLoss: number;
  tp2: number;
  support1: number;
  resistance1: number;
}) {
  const { symbol, timeframe, strategy, bias, entry, stopLoss, tp2, support1, resistance1 } = args;
  if (bias === "long") {
    return [
      `${symbol} on ${timeframe} is showing a constructive reclaim profile under the ${strategy} framework.`,
      `The bid is forming above ${formatNum(support1)}, and the read favours continuation only if price holds the entry zone around ${formatNum(entry)}.`,
      `Invalidation sits beneath ${formatNum(stopLoss)}; a clean tag of that level cancels the long thesis.`,
      `If price reclaims ${formatNum(resistance1)}, expansion toward ${formatNum(tp2)} becomes the dominant scenario.`,
    ].join(" ");
  }
  if (bias === "short") {
    return [
      `${symbol} on ${timeframe} is showing fading strength under the ${strategy} framework.`,
      `Lower highs and weak volume on every push toward ${formatNum(resistance1)} suggest distribution rather than accumulation.`,
      `A risk-managed short fires only on rejection of the proposed entry zone around ${formatNum(entry)}, with invalidation above ${formatNum(stopLoss)}.`,
      `If sellers control ${formatNum(support1)}, expansion toward ${formatNum(tp2)} becomes the next leg.`,
    ].join(" ");
  }
  return [
    `${symbol} is balanced on ${timeframe}.`,
    `Structure is not clean enough for a high-conviction directional trade, so the preferred scenario is Neutral / Wait until either a reclaim through ${formatNum(resistance1)} or a decisive failure under ${formatNum(support1)}.`,
    `Forcing a trade inside this range is a low-edge decision; let the market commit first.`,
  ].join(" ");
}

function buildScenarios(args: {
  bias: "long" | "short" | "neutral";
  price: number;
  entry: number;
  tp1: number;
  tp2: number;
  tp3: number;
  stopLoss: number;
  support1: number;
  support2: number;
  resistance1: number;
  resistance2: number;
  confidence: number;
}): Scenario[] {
  const { bias, entry, tp1, tp2, tp3, stopLoss, support1, support2, resistance1, resistance2, confidence } = args;
  const baseProb = Math.min(78, Math.max(48, confidence));

  if (bias === "long") {
    return [
      {
        name: "Primary · Continuation",
        probability: baseProb,
        trigger: `Reclaim and hold above ${formatNum(entry)} on closing basis.`,
        outcome: `Expansion toward ${formatNum(tp1)} → ${formatNum(tp2)}, with ${formatNum(tp3)} as runner.`,
        invalidation: `Tag of ${formatNum(stopLoss)} or 4H close back inside the lower range.`,
      },
      {
        name: "Alternate · Sweep then reclaim",
        probability: Math.max(18, 100 - baseProb - 12),
        trigger: `Initial sweep of ${formatNum(support1)} liquidity followed by a fast reclaim.`,
        outcome: `Cleaner long entry at the deeper support pocket; same upside targets.`,
        invalidation: `4H close below ${formatNum(support2)} cancels this scenario.`,
      },
      {
        name: "Bear case · Failure",
        probability: Math.max(10, 100 - baseProb - 12 - Math.max(18, 100 - baseProb - 12)),
        trigger: `Rejection of ${formatNum(resistance1)} on rising volume with bearish wick.`,
        outcome: `Rotation back to ${formatNum(support1)} → ${formatNum(support2)}.`,
        invalidation: `Reclaim of ${formatNum(resistance1)} on closing basis.`,
      },
    ];
  }
  if (bias === "short") {
    return [
      {
        name: "Primary · Distribution leg",
        probability: baseProb,
        trigger: `Rejection of the entry zone around ${formatNum(entry)} with bearish closes.`,
        outcome: `Expansion toward ${formatNum(tp1)} → ${formatNum(tp2)}, with ${formatNum(tp3)} as runner.`,
        invalidation: `Reclaim of ${formatNum(stopLoss)} on closing basis.`,
      },
      {
        name: "Alternate · Sweep then drop",
        probability: Math.max(18, 100 - baseProb - 12),
        trigger: `Sweep of ${formatNum(resistance1)} highs then immediate rejection.`,
        outcome: `Cleaner short entry at the deeper supply; same downside targets.`,
        invalidation: `4H close above ${formatNum(resistance2)} cancels this scenario.`,
      },
      {
        name: "Bull case · Reclaim",
        probability: Math.max(10, 100 - baseProb - 12 - Math.max(18, 100 - baseProb - 12)),
        trigger: `Strong absorption at ${formatNum(support1)} with reclaim of mid-range.`,
        outcome: `Squeeze toward ${formatNum(resistance1)} → ${formatNum(resistance2)}.`,
        invalidation: `Failure to reclaim mid-range cancels this scenario.`,
      },
    ];
  }
  return [
    {
      name: "Range scenario",
      probability: 60,
      trigger: `Price stays trapped between ${formatNum(support1)} and ${formatNum(resistance1)}.`,
      outcome: `Mean-reversion plays both ways; no expansion until the range breaks.`,
      invalidation: `Breakout closes outside the range invalidate.`,
    },
    {
      name: "Breakout long",
      probability: 22,
      trigger: `Reclaim of ${formatNum(resistance1)} on closing basis with rising volume.`,
      outcome: `Expansion toward ${formatNum(resistance2)} as the next obvious target.`,
      invalidation: `Failed reclaim back into the range.`,
    },
    {
      name: "Breakdown short",
      probability: 18,
      trigger: `Loss of ${formatNum(support1)} on closing basis with rising volume.`,
      outcome: `Expansion toward ${formatNum(support2)} as the next obvious target.`,
      invalidation: `Failed breakdown that reclaims ${formatNum(support1)}.`,
    },
  ];
}

function buildConfluence(args: { bias: "long" | "short" | "neutral"; indicators: string[]; timeframe: string }): ConfluencePoint[] {
  const { bias, indicators } = args;
  const trendStatus: ConfluencePoint["status"] = bias === "long" ? "supportive" : bias === "short" ? "against" : "neutral";
  const has = (k: string) => indicators.includes(k);

  return [
    {
      factor: "Higher-timeframe trend",
      status: trendStatus,
      detail: bias === "long" ? "Higher-timeframe is constructive · pulls aligned with continuation." : bias === "short" ? "Higher-timeframe rolling · weakness leans the same way." : "Higher-timeframe is range-bound · low edge for direction.",
    },
    {
      factor: "Structure (HH/HL or LH/LL)",
      status: bias === "neutral" ? "neutral" : "supportive",
      detail: bias === "long" ? "Higher highs and higher lows printing on the timeframe in focus." : bias === "short" ? "Lower highs and lower lows printing; sellers in control." : "Indecisive structure · wait for break.",
    },
    {
      factor: has("RSI") ? "RSI 14" : "RSI · not selected",
      status: has("RSI") ? (bias === "neutral" ? "neutral" : "supportive") : "neutral",
      detail: has("RSI")
        ? bias === "long"
          ? "RSI is healthy and not yet overbought · room for continuation."
          : bias === "short"
          ? "RSI is rolling under the midline · momentum favours sellers."
          : "RSI is stuck around 50 · momentum is neutral."
        : "Add RSI to the indicator set for a momentum read.",
    },
    {
      factor: has("MACD") ? "MACD" : "MACD · not selected",
      status: has("MACD") ? (bias === "neutral" ? "neutral" : "supportive") : "neutral",
      detail: has("MACD")
        ? bias === "long"
          ? "Histogram is curling up · momentum is rotating bullish."
          : bias === "short"
          ? "Histogram is curling down · momentum is rotating bearish."
          : "MACD is flat near the signal · momentum is undecided."
        : "Add MACD to confirm momentum direction.",
    },
    {
      factor: "Volume profile",
      status: "neutral",
      detail: "Watch for absorption at the entry zone · low volume in chop, expansion volume on the move.",
    },
    {
      factor: "Liquidity",
      status: bias === "neutral" ? "neutral" : "supportive",
      detail: bias === "long" ? "Buy-side liquidity sits beneath · sweep + reclaim is the cleanest entry trigger." : bias === "short" ? "Sell-side liquidity sits above · sweep + rejection is the cleanest entry trigger." : "Liquidity sits both above and below · range first, direction second.",
    },
  ];
}

function buildPositionSize(args: { entry: number; stopLoss: number }) {
  const { entry, stopLoss } = args;
  const riskPercent = 1.0; // default 1% risk
  const accountSize = 10000; // example $10k account
  const distance = Math.abs(entry - stopLoss);
  const sizeUsd = (accountSize * (riskPercent / 100) * entry) / Math.max(distance, entry * 0.0005);
  const estLeverage = entry === 0 ? "—" : `${(sizeUsd / accountSize).toFixed(1)}x on a 10k account`;
  return { riskPercent, sizeUsd: Math.round(sizeUsd), estLeverage };
}

function buildExpectedMove(args: { timeframe: string; bias: "long" | "short" | "neutral"; price: number; tp2: number }) {
  const { timeframe, bias, price, tp2 } = args;
  const window = expectedWindow(timeframe);
  const moveAbs = Math.abs(tp2 - price);
  const movePct = price === 0 ? 0 : (moveAbs / price) * 100;
  const range = `${(movePct * 0.5).toFixed(2)}% – ${movePct.toFixed(2)}% over ${window}`;
  const biasText = bias === "long" ? "Upside expansion expected if entry holds." : bias === "short" ? "Downside expansion expected if entry rejects." : "Range-bound; expansion only after a clean break.";
  return { window, range, bias: biasText };
}

function expectedWindow(tf: string) {
  const map: Record<string, string> = {
    "1m": "next 30–60 minutes",
    "5m": "next 1–2 hours",
    "15m": "next 4–8 hours",
    "30m": "next 8–16 hours",
    "1H": "next 12–24 hours",
    "4H": "next 1–3 days",
    "1D": "next 5–10 days",
    "1W": "next 3–6 weeks",
  };
  return map[tf] ?? "next session";
}

function buildKeyMessage(bias: "long" | "short" | "neutral", decision: ChartAnalysisDecision) {
  if (bias === "neutral") return "Don't force the trade. Let the market commit first.";
  if (decision === "Strong Long") return "Edge favours longs. Look for the cleanest entry trigger and respect invalidation.";
  if (decision === "Strong Short") return "Edge favours shorts. Wait for rejection · don't chase.";
  if (bias === "long") return "Bias is long but only with confirmation · wait for the trigger.";
  return "Bias is short but only with confirmation · wait for the trigger.";
}

function buildFollowUp(bias: "long" | "short" | "neutral"): string[] {
  if (bias === "long") {
    return [
      "Watch the next 1H close above the entry zone for confirmation.",
      "If we sweep below entry first, treat the reclaim as a stronger trigger.",
      "Move stop to break-even at TP1; trail beneath the latest higher-low for TP2/TP3.",
    ];
  }
  if (bias === "short") {
    return [
      "Watch the next 1H close inside the entry zone for confirmation rejection.",
      "If we sweep above entry first, treat the rejection as a stronger trigger.",
      "Move stop to break-even at TP1; trail above the latest lower-high for TP2/TP3.",
    ];
  }
  return [
    "Mark the range high and range low — only the breakout matters.",
    "Wait for a closing-basis break with expansion volume before acting.",
    "Inside the range, treat trades as mean-reversion and size small.",
  ];
}

function getAmplitude(timeframe: string) {
  const map: Record<string, number> = {
    "1s": 0.0005,
    "1m": 0.0028,
    "5m": 0.0038,
    "15m": 0.0056,
    "30m": 0.0074,
    "1H": 0.0095,
    "4H": 0.014,
    "1D": 0.021,
    "1W": 0.031,
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

function formatNum(v: number) {
  if (v >= 1000) return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (v >= 100) return v.toFixed(2);
  if (v >= 1) return v.toFixed(3);
  return v.toFixed(5);
}
