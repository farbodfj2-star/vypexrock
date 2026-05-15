export type OpportunityTier = "S Tier" | "A Tier" | "B Tier" | "Watchlist" | "No Trade";
export type SignalStage = "Watchlist" | "Early" | "Valid" | "Strong" | "Elite";
export type TradingStyle = "Scalper" | "Day Trader" | "Swing Trader" | "NY Breakout" | "London Session" | "SMC Trader" | "Low Risk";

export type ScannerOpportunity = {
  symbol: string;
  tier: OpportunityTier;
  direction: "Long" | "Short" | "Wait";
  confidence: number;
  risk: "Low" | "Medium" | "High";
  timeframe: string;
  trigger: string;
  structure: string;
  volume: string;
  liquidity: string;
  note: string;
};

export type AISignal = {
  asset: string;
  direction: "Long" | "Short";
  timeframe: string;
  type: SignalStage;
  confidence: number;
  riskLevel: "Low" | "Medium" | "High";
  entryZone: string;
  confirmedEntry: string;
  stopLoss: string;
  tp1: string;
  tp2: string;
  tp3: string;
  riskReward: string;
  invalidation: string;
  reason: string;
  marketStructure: string;
  volumeConfirmation: string;
  aiNotes: string;
};

export type JournalTrade = {
  id: string;
  symbol: string;
  setup: string;
  result: "Win" | "Loss" | "Open";
  rr: string;
  pnl: string;
  emotion: string;
  aiReview: string;
};

export type SmartAlert = {
  id: string;
  title: string;
  symbol: string;
  severity: "Info" | "Watch" | "Critical";
  message: string;
  time: string;
};

export const tradingStyles: Array<{ label: TradingStyle; description: string }> = [
  { label: "Scalper", description: "Prioritize precision, liquidity grabs, and fast invalidation." },
  { label: "Day Trader", description: "Focus on intraday structure, session volatility, and cleaner triggers." },
  { label: "Swing Trader", description: "Weight 4H and 1D structure more heavily than lower-timeframe noise." },
  { label: "NY Breakout", description: "Favor New York session expansion, liquidity sweeps, and breakout retests." },
  { label: "London Session", description: "Favor London volatility, pre-NY positioning, and session highs/lows." },
  { label: "SMC Trader", description: "Prioritize BOS, CHoCH, FVG, liquidity sweeps, and supply/demand." },
  { label: "Low Risk", description: "Reject late entries and require clearer invalidation before signal quality improves." }
];

export const scannerOpportunities: ScannerOpportunity[] = [
  {
    symbol: "SOLUSDT",
    tier: "S Tier",
    direction: "Long",
    confidence: 88,
    risk: "Medium",
    timeframe: "4H",
    trigger: "Break and hold above prior high",
    structure: "HH/HL continuation with clean reclaim",
    volume: "Volume expansion above 20-period average",
    liquidity: "Buy-side liquidity sits above local range high",
    note: "High-quality continuation candidate if price confirms above resistance instead of chasing the impulse."
  },
  {
    symbol: "INJUSDT",
    tier: "A Tier",
    direction: "Long",
    confidence: 81,
    risk: "Medium",
    timeframe: "1H/4H",
    trigger: "Pullback into demand and reclaim",
    structure: "Bullish trend, minor compression",
    volume: "Healthy but not euphoric",
    liquidity: "Liquidity sweep already cleared downside stops",
    note: "Needs a cleaner retest; strong watchlist candidate."
  },
  {
    symbol: "PEPEUSDT",
    tier: "B Tier",
    direction: "Long",
    confidence: 67,
    risk: "High",
    timeframe: "1H",
    trigger: "Only if volume spike confirms breakout",
    structure: "Volatile range with meme flow",
    volume: "Unusual volume detected",
    liquidity: "Thin liquidity risk remains high",
    note: "Possible mover, but not clean enough for low-risk execution."
  },
  {
    symbol: "ETHUSDT",
    tier: "A Tier",
    direction: "Short",
    confidence: 79,
    risk: "Medium",
    timeframe: "4H",
    trigger: "Rejection from supply zone",
    structure: "Lower high forming under resistance",
    volume: "Sell pressure rising on rejection candles",
    liquidity: "Liquidity above supply not fully cleared",
    note: "Short only after failed reclaim. No blind entry."
  },
  {
    symbol: "BTCUSDT",
    tier: "Watchlist",
    direction: "Wait",
    confidence: 54,
    risk: "Low",
    timeframe: "4H",
    trigger: "Wait for range break",
    structure: "Compression inside broader range",
    volume: "Neutral",
    liquidity: "Both sides have unresolved liquidity",
    note: "No clean edge until BTC chooses direction."
  }
];

export const aiSignals: AISignal[] = [
  {
    asset: "SOLUSDT",
    direction: "Long",
    timeframe: "4H",
    type: "Strong",
    confidence: 88,
    riskLevel: "Medium",
    entryZone: "$174.20 - $176.80",
    confirmedEntry: "4H close above $177.40",
    stopLoss: "$168.90",
    tp1: "$183.20",
    tp2: "$190.50",
    tp3: "$202.00",
    riskReward: "2.4R",
    invalidation: "Invalid below $168.90",
    reason: "4H structure is constructive with higher lows and rising momentum.",
    marketStructure: "HH/HL with breakout retest forming",
    volumeConfirmation: "Volume expansion supports continuation",
    aiNotes: "Avoid chasing a vertical candle. Best execution is confirmation plus retest."
  },
  {
    asset: "ETHUSDT",
    direction: "Short",
    timeframe: "4H",
    type: "Valid",
    confidence: 80,
    riskLevel: "Medium",
    entryZone: "$3,300 - $3,335",
    confirmedEntry: "1H rejection under $3,285",
    stopLoss: "$3,392",
    tp1: "$3,210",
    tp2: "$3,128",
    tp3: "$3,040",
    riskReward: "1.9R",
    invalidation: "Invalid above $3,392",
    reason: "ETH is forming a lower high below supply with fading bid strength.",
    marketStructure: "LH under resistance",
    volumeConfirmation: "Bearish rejection volume increasing",
    aiNotes: "Good only if the lower-timeframe bounce fails. Do not short into support."
  }
];

export const journalTrades: JournalTrade[] = [
  {
    id: "J-104",
    symbol: "SOLUSDT",
    setup: "Breakout retest",
    result: "Win",
    rr: "2.1R",
    pnl: "+$420",
    emotion: "Patient",
    aiReview: "Good execution. You waited for the retest instead of chasing the first candle."
  },
  {
    id: "J-103",
    symbol: "PEPEUSDT",
    setup: "Meme breakout",
    result: "Loss",
    rr: "-1R",
    pnl: "-$190",
    emotion: "FOMO",
    aiReview: "Entry was late after a large candle. Your plan should require pullback confirmation on high-volatility memes."
  },
  {
    id: "J-102",
    symbol: "BTCUSDT",
    setup: "Range reclaim",
    result: "Open",
    rr: "0.8R",
    pnl: "+$86",
    emotion: "Calm",
    aiReview: "Trade is still valid while price holds above entry. Move nothing until TP1 or invalidation."
  }
];

export const smartAlerts: SmartAlert[] = [
  {
    id: "A-1",
    title: "Liquidity zone approaching",
    symbol: "BTCUSDT",
    severity: "Watch",
    message: "BTC is moving toward buy-side liquidity. Watch for sweep or failed breakout before entering.",
    time: "Live"
  },
  {
    id: "A-2",
    title: "Volume spike detected",
    symbol: "SOLUSDT",
    severity: "Info",
    message: "SOL volume is expanding above baseline. Confirmation is needed before signal upgrade.",
    time: "2m ago"
  },
  {
    id: "A-3",
    title: "Signal invalidation warning",
    symbol: "ETHUSDT",
    severity: "Critical",
    message: "ETH is close to invalidating the short thesis. A reclaim above supply cancels the setup.",
    time: "5m ago"
  }
];

export const journalStats = {
  winRate: 62,
  averageRR: "1.74R",
  pnl: "+$1,840",
  bestSetup: "Breakout retest",
  worstMistake: "Late meme entries",
  overtradingRisk: "Medium",
  revengeTradingRisk: "Low"
};
