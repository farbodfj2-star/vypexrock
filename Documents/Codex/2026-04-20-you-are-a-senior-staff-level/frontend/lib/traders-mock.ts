/**
 * Deterministic top-100 trader leaderboard, modeled after Binance Copy Trading.
 *
 * Each trader has:
 *   - rank, anonymized handle, country, badge tier
 *   - win-rate, ROI, total PnL, AUM, copiers, max drawdown, sharpe
 *   - active open positions (symbol, side, leverage, entry, mark, size, pnl)
 *   - 30-day PnL sparkline
 *   - bio
 *
 * Numbers are seeded so they are stable across reloads but feel natural.
 */

const SYMBOLS = [
  "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "DOGEUSDT", "ADAUSDT",
  "AVAXUSDT", "LINKUSDT", "TONUSDT", "SUIUSDT", "APTUSDT", "INJUSDT", "ARBUSDT",
  "OPUSDT", "PEPEUSDT", "WIFUSDT", "JUPUSDT", "RNDRUSDT", "FETUSDT", "TIAUSDT",
  "NEARUSDT", "ATOMUSDT", "FILUSDT", "MATICUSDT",
] as const;

const PRICE_HINT: Record<string, number> = {
  BTCUSDT: 67000, ETHUSDT: 3450, SOLUSDT: 165, BNBUSDT: 605, XRPUSDT: 0.62,
  DOGEUSDT: 0.18, ADAUSDT: 0.46, AVAXUSDT: 36, LINKUSDT: 18.4, TONUSDT: 5.8,
  SUIUSDT: 1.74, APTUSDT: 9.2, INJUSDT: 24.6, ARBUSDT: 1.12, OPUSDT: 2.85,
  PEPEUSDT: 0.0000098, WIFUSDT: 2.42, JUPUSDT: 1.12, RNDRUSDT: 7.42, FETUSDT: 1.56,
  TIAUSDT: 8.42, NEARUSDT: 6.48, ATOMUSDT: 9.36, FILUSDT: 8.11, MATICUSDT: 0.84,
};

const COUNTRIES = ["🇺🇸", "🇸🇬", "🇰🇷", "🇯🇵", "🇩🇪", "🇫🇷", "🇬🇧", "🇨🇦", "🇦🇪", "🇨🇭", "🇳🇱", "🇸🇪", "🇮🇹", "🇪🇸", "🇧🇷", "🇦🇺", "🇲🇾", "🇮🇳", "🇲🇽", "🇿🇦"];

const HANDLE_FRAGMENTS = {
  prefix: ["Whale", "Quant", "Apex", "Onyx", "Volt", "Hedge", "Hex", "Iron", "Dark", "Echo", "Zenith", "Nova", "Helix", "Prime", "Falcon", "Atlas", "Orion", "Vector", "Nexus", "Cobra", "Titan", "Bolt", "Storm", "Glacier", "Phantom", "Halo", "Kraken", "Saber", "Vortex", "Rune"],
  suffix: ["Trader", "Capital", "Strat", "Fund", "Edge", "Order", "Signal", "Alpha", "Bet", "Prop", "Move", "Setup", "Trade", "Wave", "Drift", "Flow", "Cross", "Cycle", "Engine", "Lab", "Pulse", "Books", "Desk", "Watch"],
};

export type TraderPosition = {
  symbol: string;
  side: "LONG" | "SHORT";
  leverage: number;
  entry: number;
  mark: number;
  size: number; // contract size in USD notional
  margin: number; // collateral in USD
  pnl: number; // unrealized PnL in USD
  pnlPct: number; // PnL % of margin
  openedAt: string; // human readable
};

export type Trader = {
  rank: number;
  id: string;
  handle: string;
  avatarSeed: string;
  country: string;
  tier: "Diamond" | "Platinum" | "Gold" | "Pro";
  badges: string[];

  // Performance
  roi30d: number; // %
  roi7d: number;
  pnl30d: number; // USD
  pnlAllTime: number;
  winRate: number;
  totalTrades: number;
  sharpe: number; // 0-5
  maxDrawdown: number; // negative %
  avgHoldHours: number;

  // AUM / followers
  copiers: number;
  aum: number; // USD
  copyMin: number;
  profitShare: number; // %

  // Open positions + spark
  positions: TraderPosition[];
  spark: number[]; // 30 cumulative PnL points

  bio: string;
  joinedDays: number;
  lastTradeAgo: string;
};

// LCG so the same seed always produces the same sequence
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function pick<T>(arr: readonly T[], r: () => number) {
  return arr[Math.floor(r() * arr.length)];
}

function buildHandle(r: () => number, rank: number) {
  const p = pick(HANDLE_FRAGMENTS.prefix, r);
  const s = pick(HANDLE_FRAGMENTS.suffix, r);
  const num = Math.floor(r() * 999) + 1;
  return `${p}${s}${num.toString().padStart(3, "0")}`;
}

function buildPositions(r: () => number, rank: number, isWinning: boolean): TraderPosition[] {
  // Higher-ranked traders open more positions (3-6) than lower ones (1-3)
  const count = rank <= 30 ? 3 + Math.floor(r() * 4) : 1 + Math.floor(r() * 3);
  const positions: TraderPosition[] = [];
  const usedSymbols = new Set<string>();

  for (let i = 0; i < count; i++) {
    let sym = pick(SYMBOLS, r);
    let attempts = 0;
    while (usedSymbols.has(sym) && attempts < 8) {
      sym = pick(SYMBOLS, r);
      attempts++;
    }
    usedSymbols.add(sym);

    const basePrice = PRICE_HINT[sym] ?? 100;
    // mark drifts within +/- 8% of base
    const mark = basePrice * (1 + (r() - 0.5) * 0.16);
    // entry differs from mark
    const sideRoll = r();
    const winningTilt = isWinning ? 0.62 : 0.4; // winning traders have 62% long-bias
    const isLong = sideRoll < winningTilt;
    const profitable = isWinning ? r() < 0.78 : r() < 0.4;
    const distanceFromMark = (0.005 + r() * 0.045); // 0.5% – 5%
    const entry = isLong
      ? mark / (1 + (profitable ? distanceFromMark : -distanceFromMark))
      : mark * (1 + (profitable ? distanceFromMark : -distanceFromMark));

    const leverage = [3, 5, 10, 15, 20, 25, 50][Math.floor(r() * 7)];
    const margin = 200 + Math.floor(r() * 90_000); // up to ~90k margin
    const size = margin * leverage;
    // PnL = size * priceMove% (sign depends on side)
    const priceMovePct = (mark - entry) / entry * (isLong ? 1 : -1);
    const pnl = size * priceMovePct;
    const pnlPct = (pnl / margin) * 100;

    const ago = ["12 min ago", "38 min ago", "1h 14m ago", "2h 4m ago", "4h 22m ago", "8h ago", "1d 2h ago", "2d ago"][Math.floor(r() * 8)];

    positions.push({
      symbol: sym,
      side: isLong ? "LONG" : "SHORT",
      leverage,
      entry: round(entry),
      mark: round(mark),
      size: Math.round(size),
      margin: Math.round(margin),
      pnl: Math.round(pnl),
      pnlPct: round(pnlPct, 2),
      openedAt: ago,
    });
  }

  // sort by absolute PnL descending
  positions.sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl));
  return positions;
}

function buildSpark(r: () => number, finalPnl: number): number[] {
  // 30-point cumulative PnL curve ending near `finalPnl`
  const points: number[] = [];
  let acc = 0;
  for (let i = 0; i < 30; i++) {
    const drift = (finalPnl / 30) + (r() - 0.5) * (Math.abs(finalPnl) * 0.04);
    acc += drift;
    points.push(acc);
  }
  // normalize so the last point is exactly the finalPnl
  const lastDelta = finalPnl - points[points.length - 1];
  return points.map((p, idx) => p + (lastDelta * (idx / (points.length - 1))));
}

function round(n: number, dp: number = 4) {
  if (Math.abs(n) >= 1000) return Math.round(n);
  if (Math.abs(n) >= 100) return Number(n.toFixed(2));
  if (Math.abs(n) >= 1) return Number(n.toFixed(3));
  return Number(n.toFixed(6));
}

let cached: Trader[] | null = null;

export function getTraders(): Trader[] {
  if (cached) return cached;

  const traders: Trader[] = [];
  for (let i = 0; i < 100; i++) {
    const seed = 0xC0FFEE + i * 7919;
    const r = rng(seed);

    const rank = i + 1;
    const isElite = rank <= 10;
    const isPro = rank <= 30;
    const tier: Trader["tier"] = isElite ? "Diamond" : rank <= 25 ? "Platinum" : rank <= 60 ? "Gold" : "Pro";
    const isWinning = rank <= 80; // top 80 are winning, last 20 are mixed

    // Performance distribution — top traders have higher ROI and win rate
    const baseRoi = isElite ? 380 + r() * 240 : isPro ? 140 + r() * 160 : 35 + r() * 90;
    const roi30d = round(baseRoi * (isWinning ? 1 : -1) * (0.85 + r() * 0.3), 1);
    const roi7d = round(roi30d * (0.18 + r() * 0.32), 1);

    const pnl30d = Math.round((isElite ? 1_200_000 + r() * 8_000_000 : isPro ? 250_000 + r() * 1_500_000 : 18_000 + r() * 320_000) * (isWinning ? 1 : -0.4));
    const pnlAllTime = Math.round(pnl30d * (4 + r() * 9));
    const winRate = round(isElite ? 78 + r() * 14 : isPro ? 64 + r() * 18 : 48 + r() * 22, 1);
    const totalTrades = Math.floor(isElite ? 1800 + r() * 8000 : isPro ? 800 + r() * 4000 : 200 + r() * 2000);
    const sharpe = round(isElite ? 2.8 + r() * 1.6 : isPro ? 1.6 + r() * 1.4 : 0.4 + r() * 1.4, 2);
    const maxDrawdown = round(-(2 + r() * (isElite ? 8 : isPro ? 22 : 38)), 1);
    const avgHoldHours = round(2 + r() * 70, 1);

    const copiers = Math.floor(isElite ? 8000 + r() * 24_000 : isPro ? 1500 + r() * 6500 : 80 + r() * 1400);
    const aum = Math.round(isElite ? 22_000_000 + r() * 95_000_000 : isPro ? 4_800_000 + r() * 18_000_000 : 380_000 + r() * 2_400_000);
    const copyMin = [50, 100, 200, 500, 1000][Math.floor(r() * 5)];
    const profitShare = [10, 12, 15, 18, 20, 25][Math.floor(r() * 6)];

    const handle = buildHandle(r, rank);
    const country = pick(COUNTRIES, r);
    const badges: string[] = [];
    if (isElite) badges.push("Top 10");
    if (winRate >= 75) badges.push("High win rate");
    if (sharpe >= 3.5) badges.push("Sharpe pro");
    if (maxDrawdown >= -8) badges.push("Risk steady");
    if (totalTrades >= 5000) badges.push("Veteran");
    if (copiers >= 10_000) badges.push("Most copied");

    const positions = buildPositions(r, rank, isWinning);
    const spark = buildSpark(r, pnl30d);

    const bioSets = [
      "Quant macro · structural breakouts only · risk-first sizing.",
      "Crypto-native momentum trader · 4H / 1D framework · disciplined exits.",
      "Order-flow + liquidity sweeps · short-term scalper · tight invalidation.",
      "Mean-reversion specialist · range trades on majors · fade extremes.",
      "Volatility seller · funding-rate aware · tight risk per trade.",
      "Trend-follower · multi-timeframe alignment · letting winners run.",
      "Onchain + technical mix · rotation between BTC, ETH, and L2s.",
      "Smart-money concepts · order-block + breaker entries · cinematic patience.",
    ];
    const bio = pick(bioSets, r) as string;
    const joinedDays = Math.floor(180 + r() * 1800);
    const lastTradeAgo = ["just now", "8 min ago", "32 min ago", "1h 18m ago", "3h ago", "6h ago", "today", "yesterday"][Math.floor(r() * 8)];

    traders.push({
      rank,
      id: `tr_${rank.toString().padStart(3, "0")}`,
      handle,
      avatarSeed: handle,
      country,
      tier,
      badges,
      roi30d,
      roi7d,
      pnl30d,
      pnlAllTime,
      winRate,
      totalTrades,
      sharpe,
      maxDrawdown,
      avgHoldHours,
      copiers,
      aum,
      copyMin,
      profitShare,
      positions,
      spark,
      bio,
      joinedDays,
      lastTradeAgo,
    });
  }

  // Sort top by ROI 30d desc so rank reflects performance
  traders.sort((a, b) => b.roi30d - a.roi30d);
  traders.forEach((t, i) => { t.rank = i + 1; });

  cached = traders;
  return traders;
}

export function getTraderById(id: string): Trader | null {
  return getTraders().find((t) => t.id === id) ?? null;
}
