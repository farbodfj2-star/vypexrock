import { apiFetch } from "@/lib/api";

export type MarketPulse = {
  fear_greed: number;
  fear_greed_label: string;
  btc_dominance: number;
  session_volatility: number;
  market_bias: string;
  top_movers: Array<{
    symbol: string;
    price: number;
    change_24h: number;
    volume_24h: number;
    metadata_name?: string | null;
    metadata_image?: string | null;
  }>;
  gainers: Array<{ symbol: string; change_24h: number; metadata_image?: string | null }>;
  losers: Array<{ symbol: string; change_24h: number; metadata_image?: string | null }>;
  heatmap: Array<{ symbol: string; change_24h: number; intensity: number; metadata_image?: string | null }>;
};

export async function fetchMarketPulse(): Promise<MarketPulse> {
  return apiFetch<MarketPulse>("/market/pulse");
}
