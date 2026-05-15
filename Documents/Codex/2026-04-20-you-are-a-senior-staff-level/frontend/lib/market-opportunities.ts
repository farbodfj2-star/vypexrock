import { apiFetch } from "@/lib/api";
import type { AISignal, OpportunityTier, ScannerOpportunity, SignalStage } from "@/lib/trading-os-data";
import { formatCurrency } from "@/lib/utils";

export type MarketOpportunityDto = {
  symbol: string;
  tier: string;
  direction: string;
  confidence: number;
  risk: string;
  timeframe: string;
  trigger: string;
  structure: string;
  volume: string;
  liquidity: string;
  note: string;
  price: number;
  risk_reward: number;
  entry_low: number;
  entry_high: number;
  stop_loss: number;
  take_profit_1: number;
  take_profit_2: number;
  take_profit_3: number;
};

export async function fetchMarketOpportunities(limit = 12) {
  return apiFetch<MarketOpportunityDto[]>(`/market/opportunities?limit=${limit}`);
}

export function mapOpportunityToScanner(row: MarketOpportunityDto): ScannerOpportunity {
  const tier = (["S Tier", "A Tier", "B Tier", "Watchlist", "No Trade"].includes(row.tier)
    ? row.tier
    : "Watchlist") as OpportunityTier;
  const direction = row.direction === "Long" || row.direction === "Short" || row.direction === "Wait" ? row.direction : "Wait";
  const risk = row.risk === "Low" || row.risk === "Medium" || row.risk === "High" ? row.risk : "Medium";

  return {
    symbol: row.symbol,
    tier,
    direction,
    confidence: row.confidence,
    risk,
    timeframe: row.timeframe,
    trigger: row.trigger,
    structure: row.structure,
    volume: row.volume,
    liquidity: row.liquidity,
    note: row.note
  };
}

function stageFromTier(tier: OpportunityTier): SignalStage {
  if (tier === "S Tier") return "Elite";
  if (tier === "A Tier") return "Strong";
  if (tier === "B Tier") return "Valid";
  return "Watchlist";
}

export function mapOpportunityToAISignal(row: MarketOpportunityDto): AISignal {
  const scanner = mapOpportunityToScanner(row);
  const long = scanner.direction === "Long";
  return {
    asset: row.symbol,
    direction: long ? "Long" : "Short",
    type: stageFromTier(scanner.tier),
    timeframe: row.timeframe,
    confidence: row.confidence,
    entryZone: `${formatCurrency(row.entry_low)} – ${formatCurrency(row.entry_high)}`,
    confirmedEntry: formatCurrency(row.price),
    stopLoss: formatCurrency(row.stop_loss),
    tp1: formatCurrency(row.take_profit_1),
    tp2: formatCurrency(row.take_profit_2),
    tp3: formatCurrency(row.take_profit_3),
    riskReward: `${row.risk_reward.toFixed(2)}R`,
    riskLevel: row.risk === "Low" || row.risk === "Medium" || row.risk === "High" ? row.risk : "Medium",
    reason: row.note,
    invalidation: formatCurrency(row.stop_loss),
    marketStructure: row.structure,
    volumeConfirmation: row.volume,
    aiNotes: `${row.liquidity} · ${row.trigger}`
  };
}
