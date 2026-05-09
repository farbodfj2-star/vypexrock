export type MarketTicker = {
  symbol: string;
  price: number;
  change_24h: number;
  volume_24h: number;
  metadata_name?: string | null;
  metadata_image?: string | null;
};

export type Signal = {
  id: number;
  symbol: string;
  timeframe: string;
  bias: "long" | "short" | "neutral";
  confidence: number;
  entry_low: number;
  entry_high: number;
  stop_loss: number;
  take_profit_1: number;
  take_profit_2: number;
  take_profit_3: number;
  rsi: number;
  ema20: number;
  ema50: number;
  macd: number;
  macd_signal: number;
  structure_state: string;
  explanation: string;
  suggested_risk_note: string;
};

export type Candle = {
  open_time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type CoinDetail = {
  symbol: string;
  ticker: MarketTicker;
  candles: Candle[];
  signals: Signal[];
};

export type WatchlistItem = {
  id: number;
  symbol: string;
  base_asset?: string | null;
  quote_asset?: string | null;
  created_at: string;
  updated_at: string;
};

export type Alert = {
  id: number;
  symbol: string;
  condition_type: string;
  direction: string;
  threshold_value?: number | null;
  is_active: boolean;
  cool_down_minutes: number;
  last_triggered_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type AlertLog = {
  id: number;
  alert_id: number;
  user_id: number;
  symbol: string;
  message: string;
  delivery_status: string;
  created_at: string;
  updated_at: string;
};

export type User = {
  id: number;
  email: string;
  full_name?: string | null;
  is_active: boolean;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
};

export type OpportunitySetup = {
  symbol: string;
  bias: "long" | "short" | "neutral";
  confidence: number;
  currentPrice: number;
  expectedMove: string;
  entryLow: number;
  entryHigh: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  riskReward: string;
  explanation: string;
  indicatorSummary: string[];
  timeframe: string;
  invalidationLevel?: string;
  riskNote?: string;
  confidenceReason?: string;
};

export type SignalHistoryItem = {
  id: string;
  symbol: string;
  bias: "long" | "short" | "neutral";
  timeframe: string;
  entry: string;
  stopLoss: string;
  tp1: string;
  tp2: string;
  tp3: string;
  status: "active" | "won" | "lost" | "expired";
  resultPct: number;
  createdAt: string;
  closedAt?: string | null;
  confidence: number;
  reasonSummary: string;
  riskReward: string;
  invalidation: string;
};

export type PerformanceSummary = {
  totalSignals: number;
  winRate: number;
  averageRR: string;
  averageGain: string;
  averageLoss: string;
  bestPerformer: string;
  worstPerformer: string;
  activeSignals: number;
  closedSignals: number;
};

export type BacktestMetric = {
  timeframe: string;
  winRate: number;
  averageReturn: string;
  drawdown: string;
  signals: number;
};

export type BacktestOverview = {
  totalSimulatedReturn: string;
  averageDrawdown: string;
  bestTimeframe: string;
  worstTimeframe: string;
  confidenceVsOutcome: Array<{ bucket: string; outcome: string }>;
  timeframeBreakdown: BacktestMetric[];
  coinBreakdown: Array<{ symbol: string; winRate: number; totalSignals: number }>;
};

export type PricingPlan = {
  name: string;
  price: string;
  badge?: string;
  description: string;
  cta: string;
  features: string[];
  lockedNote?: string;
};

export type DataHealth = {
  livePriceStatus: "live" | "delayed";
  lastUpdateLabel: string;
  dataSource: string;
  aiStatus: "live" | "fallback";
  communityStatus: "live" | "syncing";
  websocketStatus: "connected" | "reconnecting" | "disconnected";
};

export type CommunityIdea = {
  id: string;
  source: string;
  author: string;
  authorUrl?: string | null;
  symbol: string;
  bias: "long" | "short" | "neutral";
  title: string;
  reasoning: string;
  imageUrl?: string | null;
  sourceUrl: string;
  postedAt: string;
  boosts: number;
  comments: number;
};

export type CommunityPulse = {
  consensus_bias: "long" | "short" | "neutral";
  total_posts: number;
  top_symbols: string[];
  top_authors: string[];
  summary: string;
};

export type CommunityFeedResponse = {
  ideas: CommunityIdea[];
  pulse: CommunityPulse;
};

export type AiMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  mode?: "short" | "long";
  sources?: AiSource[];
  status?: "live" | "fallback";
  attachments?: AiAttachment[];
};

export type AiSource = {
  title: string;
  url: string;
};

export type AiAttachment = {
  id: string;
  name: string;
  kind: "image" | "file";
  previewUrl?: string;
};

export type AiChatResponse = {
  answer: string;
  assistant_name: string;
  used_live_ai: boolean;
  used_web_search: boolean;
  sources: AiSource[];
};
