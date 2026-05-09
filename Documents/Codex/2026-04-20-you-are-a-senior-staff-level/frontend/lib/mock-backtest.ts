import type { BacktestOverview } from "@/types";

export const backtestOverview: BacktestOverview = {
  totalSimulatedReturn: "+38.6%",
  averageDrawdown: "-8.4%",
  bestTimeframe: "4H",
  worstTimeframe: "15m",
  confidenceVsOutcome: [
    { bucket: "50-59", outcome: "+0.8%" },
    { bucket: "60-69", outcome: "+6.1%" },
    { bucket: "70-79", outcome: "+12.9%" },
    { bucket: "80-89", outcome: "+18.8%" }
  ],
  timeframeBreakdown: [
    { timeframe: "15m", winRate: 48.5, averageReturn: "+4.2%", drawdown: "-10.6%", signals: 124 },
    { timeframe: "1H", winRate: 61.8, averageReturn: "+12.4%", drawdown: "-7.9%", signals: 98 },
    { timeframe: "4H", winRate: 68.2, averageReturn: "+17.6%", drawdown: "-5.8%", signals: 64 },
    { timeframe: "1D", winRate: 57.1, averageReturn: "+4.4%", drawdown: "-4.3%", signals: 28 }
  ],
  coinBreakdown: [
    { symbol: "BTCUSDT", winRate: 66.2, totalSignals: 42 },
    { symbol: "ETHUSDT", winRate: 58.1, totalSignals: 31 },
    { symbol: "SOLUSDT", winRate: 69.4, totalSignals: 36 },
    { symbol: "BNBUSDT", winRate: 64.8, totalSignals: 25 },
    { symbol: "XRPUSDT", winRate: 51.7, totalSignals: 18 }
  ]
};
