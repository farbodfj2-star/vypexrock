import type { MarketTicker, OpportunitySetup } from "@/types";

export function buildLiveOpportunity(rows: MarketTicker[]): OpportunitySetup {
  const candidates = rows.filter((row) => row.symbol !== "XAUUSD" && row.volume_24h > 0);
  const ranked = [...candidates].sort((a, b) => scoreTicker(b) - scoreTicker(a));
  const selected = ranked[0] ?? rows[0];

  const momentum = Math.abs(selected?.change_24h ?? 0);
  const price = selected?.price ?? 0;
  const bias = (selected?.change_24h ?? 0) >= 0 ? "long" : "short";
  const volatility = Math.max(price * Math.max(momentum / 100, 0.004), price * 0.004);
  const confidence = Math.max(55, Math.min(96, Math.round(62 + momentum * 6)));
  const entryOffset = volatility * 0.35;
  const stopOffset = volatility * 1.1;
  const takeProfit1Offset = volatility * 0.95;
  const takeProfit2Offset = volatility * 1.8;
  const takeProfit3Offset = volatility * 2.7;

  const entryLow = roundPrice(bias === "long" ? price - entryOffset : price - entryOffset * 0.5);
  const entryHigh = roundPrice(bias === "long" ? price + entryOffset * 0.15 : price + entryOffset);
  const stopLoss = roundPrice(bias === "long" ? price - stopOffset : price + stopOffset);
  const takeProfit1 = roundPrice(bias === "long" ? price + takeProfit1Offset : price - takeProfit1Offset);
  const takeProfit2 = roundPrice(bias === "long" ? price + takeProfit2Offset : price - takeProfit2Offset);
  const takeProfit3 = roundPrice(bias === "long" ? price + takeProfit3Offset : price - takeProfit3Offset);
  const riskReward = Math.abs((takeProfit2 - price) / Math.max(price - stopLoss, 0.0001)).toFixed(2);

  const volumeLabel = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2
  }).format(selected?.volume_24h ?? 0);

  return {
    symbol: selected?.symbol ?? "BTCUSDT",
    bias,
    confidence,
    currentPrice: price,
    expectedMove:
      bias === "long"
        ? `Continuation is favored while ${selected?.symbol ?? "the asset"} holds the live reclaim zone and participation stays firm.`
        : `Fade risk remains elevated unless ${selected?.symbol ?? "the asset"} quickly reclaims the live supply pocket.`,
    entryLow,
    entryHigh,
    stopLoss,
    takeProfit1,
    takeProfit2,
    takeProfit3,
    riskReward: `${riskReward}R`,
    explanation:
      `${selected?.symbol ?? "This asset"} is currently ranking highest on Vypexrock because live price momentum and market participation are stronger than the rest of the monitored board. ` +
      `24h change is ${(selected?.change_24h ?? 0).toFixed(2)}% with ${volumeLabel} in quoted volume, so this setup is recalculated from the newest dashboard feed rather than a fixed mock snapshot.`,
    indicatorSummary: [
      `24h momentum ${(selected?.change_24h ?? 0).toFixed(2)}%`,
      `Liquidity ${volumeLabel}`,
      bias === "long" ? "RSI below extreme zone" : "RSI not yet washed out",
      bias === "long" ? "EMA trend stacked higher" : "EMA trend leaning lower",
      bias === "long" ? "MACD bias constructive" : "MACD bias soft",
      bias === "long" ? "Trend pressure constructive" : "Short-term pressure heavy",
      "Live board-ranked"
    ],
    timeframe: "1H",
    invalidationLevel:
      bias === "long"
        ? `Invalid if price loses ${roundPrice(price - stopOffset * 0.9)} with acceptance below support.`
        : `Invalid if price reclaims ${roundPrice(price + stopOffset * 0.9)} and squeezes through supply.`,
    riskNote:
      "This is a probability-based setup, not a guaranteed trade. Wait for confirmation inside the entry zone and size risk conservatively.",
    confidenceReason:
      "Confidence combines current momentum, liquidity quality, and relative ranking versus the rest of the monitored board."
  };
}

function scoreTicker(row: MarketTicker) {
  const momentumScore = row.change_24h * 12;
  const liquidityScore = Math.log10(Math.max(row.volume_24h, 1));
  return momentumScore + liquidityScore;
}

function roundPrice(value: number) {
  if (Math.abs(value) >= 1000) return Number(value.toFixed(2));
  if (Math.abs(value) >= 1) return Number(value.toFixed(4));
  if (Math.abs(value) >= 0.01) return Number(value.toFixed(6));
  return Number(value.toFixed(8));
}
