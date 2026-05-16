import type { MarketTicker } from "@/types";

export type MarketGroup = "Crypto" | "Forex" | "Commodities" | "Stocks";

export type AssetCatalogItem = {
  symbol: string;
  label: string;
  name: string;
  group: MarketGroup;
  fallbackPrice: number;
  fallbackChange: number;
  fallbackVolume: number;
  tradingViewProvider: string;
  tradingViewSymbol: string;
  liveSource: "binance" | "gold-api" | "fallback";
};

export const assetCatalog: AssetCatalogItem[] = [
  // ── Layer 1 / Majors ───────────────────────────────────────────────
  asset("BTCUSDT", "BTC-USDT", "Bitcoin", "Crypto", 68452, 2.34, 52400000000),
  asset("ETHUSDT", "ETH-USDT", "Ethereum", "Crypto", 3284, 1.81, 22700000000),
  asset("BNBUSDT", "BNB-USDT", "BNB", "Crypto", 612.5, 1.06, 2110000000),
  asset("SOLUSDT", "SOL-USDT", "Solana", "Crypto", 176.8, 4.22, 8430000000),
  asset("XRPUSDT", "XRP-USDT", "XRP", "Crypto", 0.628, -0.48, 1960000000),
  asset("ADAUSDT", "ADA-USDT", "Cardano", "Crypto", 1.12, 1.62, 1240000000),
  asset("AVAXUSDT", "AVAX-USDT", "Avalanche", "Crypto", 42.1, 2.74, 1430000000),
  asset("DOTUSDT", "DOT-USDT", "Polkadot", "Crypto", 7.31, -0.62, 740000000),
  asset("TONUSDT", "TON-USDT", "Toncoin", "Crypto", 5.92, 0.84, 740000000),
  asset("LTCUSDT", "LTC-USDT", "Litecoin", "Crypto", 88.42, 1.18, 850000000),
  asset("BCHUSDT", "BCH-USDT", "Bitcoin Cash", "Crypto", 512.4, 3.48, 780000000),
  asset("TRXUSDT", "TRX-USDT", "TRON", "Crypto", 0.245, 0.92, 610000000),
  asset("XLMUSDT", "XLM-USDT", "Stellar", "Crypto", 0.318, 1.22, 320000000),
  asset("ATOMUSDT", "ATOM-USDT", "Cosmos", "Crypto", 9.36, 0.42, 410000000),
  asset("ETCUSDT", "ETC-USDT", "Ethereum Classic", "Crypto", 26.8, -0.81, 280000000),
  asset("XMRUSDT", "XMR-USDT", "Monero", "Crypto", 168.5, 0.62, 110000000),

  // ── Smart contract / DeFi ──────────────────────────────────────────
  asset("LINKUSDT", "LINK-USDT", "Chainlink", "Crypto", 18.34, 1.12, 1260000000),
  asset("UNIUSDT", "UNI-USDT", "Uniswap", "Crypto", 11.36, 1.64, 860000000),
  asset("AAVEUSDT", "AAVE-USDT", "Aave", "Crypto", 132.4, 2.92, 240000000),
  asset("MKRUSDT", "MKR-USDT", "Maker", "Crypto", 1842.5, 1.32, 95000000),
  asset("COMPUSDT", "COMP-USDT", "Compound", "Crypto", 64.2, 0.42, 58000000),
  asset("SNXUSDT", "SNX-USDT", "Synthetix", "Crypto", 2.18, 1.18, 70000000),
  asset("CRVUSDT", "CRV-USDT", "Curve DAO", "Crypto", 0.452, -0.42, 110000000),
  asset("LDOUSDT", "LDO-USDT", "Lido DAO", "Crypto", 1.42, 0.82, 140000000),
  asset("INJUSDT", "INJ-USDT", "Injective", "Crypto", 26.4, 4.08, 570000000),
  asset("RUNEUSDT", "RUNE-USDT", "THORChain", "Crypto", 4.18, 2.42, 92000000),
  asset("JUPUSDT", "JUP-USDT", "Jupiter", "Crypto", 1.12, 3.24, 180000000),
  asset("DYDXUSDT", "DYDX-USDT", "dYdX", "Crypto", 1.56, -1.21, 120000000),
  asset("ENAUSDT", "ENA-USDT", "Ethena", "Crypto", 0.612, 4.24, 240000000),

  // ── Layer 2 / Scaling ──────────────────────────────────────────────
  asset("ARBUSDT", "ARB-USDT", "Arbitrum", "Crypto", 1.12, 1.88, 560000000),
  asset("OPUSDT", "OP-USDT", "Optimism", "Crypto", 2.85, 2.46, 530000000),
  asset("MATICUSDT", "MATIC-USDT", "Polygon", "Crypto", 0.84, 1.22, 380000000),
  asset("STRKUSDT", "STRK-USDT", "Starknet", "Crypto", 0.612, 2.18, 110000000),
  asset("MANTAUSDT", "MANTA-USDT", "Manta Network", "Crypto", 0.892, 1.06, 76000000),

  // ── Newer L1s ──────────────────────────────────────────────────────
  asset("APTUSDT", "APT-USDT", "Aptos", "Crypto", 9.22, 2.48, 910000000),
  asset("SUIUSDT", "SUI-USDT", "Sui", "Crypto", 1.74, 5.42, 1180000000),
  asset("SEIUSDT", "SEI-USDT", "Sei", "Crypto", 0.612, 3.18, 145000000),
  asset("NEARUSDT", "NEAR-USDT", "NEAR Protocol", "Crypto", 6.48, 2.04, 680000000),
  asset("TIAUSDT", "TIA-USDT", "Celestia", "Crypto", 8.42, 4.81, 320000000),
  asset("ALGOUSDT", "ALGO-USDT", "Algorand", "Crypto", 0.198, 0.62, 95000000),
  asset("HBARUSDT", "HBAR-USDT", "Hedera", "Crypto", 0.0921, 1.84, 130000000),
  asset("EGLDUSDT", "EGLD-USDT", "MultiversX", "Crypto", 38.4, -0.42, 65000000),

  // ── AI / Infra ─────────────────────────────────────────────────────
  asset("FETUSDT", "FET-USDT", "Fetch.ai", "Crypto", 1.56, 4.81, 230000000),
  asset("AGIXUSDT", "AGIX-USDT", "SingularityNET", "Crypto", 0.612, 3.21, 110000000),
  asset("RNDRUSDT", "RNDR-USDT", "Render", "Crypto", 7.42, 2.18, 180000000),
  asset("GRTUSDT", "GRT-USDT", "The Graph", "Crypto", 0.218, 1.42, 80000000),
  asset("ARUSDT", "AR-USDT", "Arweave", "Crypto", 21.4, 3.92, 95000000),
  asset("FILUSDT", "FIL-USDT", "Filecoin", "Crypto", 8.11, -1.18, 620000000),

  // ── Memes ──────────────────────────────────────────────────────────
  asset("DOGEUSDT", "DOGE-USDT", "Dogecoin", "Crypto", 0.1812, 3.15, 1740000000),
  asset("PEPEUSDT", "PEPE-USDT", "Pepe", "Crypto", 0.00000987, 6.54, 1140000000),
  asset("SHIBUSDT", "SHIB-USDT", "Shiba Inu", "Crypto", 0.00002814, 1.92, 960000000),
  asset("WIFUSDT", "WIF-USDT", "dogwifhat", "Crypto", 2.42, 8.42, 540000000),
  asset("BONKUSDT", "BONK-USDT", "Bonk", "Crypto", 0.0000231, 5.42, 320000000),
  asset("FLOKIUSDT", "FLOKI-USDT", "Floki", "Crypto", 0.000178, 4.18, 180000000),

  // ── Gaming / NFT ───────────────────────────────────────────────────
  asset("AXSUSDT", "AXS-USDT", "Axie Infinity", "Crypto", 6.42, -0.92, 92000000),
  asset("SANDUSDT", "SAND-USDT", "The Sandbox", "Crypto", 0.412, 1.18, 110000000),
  asset("MANAUSDT", "MANA-USDT", "Decentraland", "Crypto", 0.382, 0.42, 76000000),
  asset("APEUSDT", "APE-USDT", "ApeCoin", "Crypto", 1.42, -0.81, 65000000),
  asset("IMXUSDT", "IMX-USDT", "Immutable", "Crypto", 1.84, 2.42, 140000000),
  asset("GALAUSDT", "GALA-USDT", "Gala", "Crypto", 0.0312, 1.62, 95000000),
  asset("ENJUSDT", "ENJ-USDT", "Enjin Coin", "Crypto", 0.218, 0.82, 42000000),

  // ── Privacy / Misc ─────────────────────────────────────────────────
  asset("ZECUSDT", "ZEC-USDT", "Zcash", "Crypto", 28.4, -0.42, 35000000),
  asset("DASHUSDT", "DASH-USDT", "Dash", "Crypto", 31.8, 0.42, 28000000),
  asset("ICPUSDT", "ICP-USDT", "Internet Computer", "Crypto", 12.4, 1.42, 130000000),
  asset("VETUSDT", "VET-USDT", "VeChain", "Crypto", 0.0421, 0.82, 95000000),
  asset("CHZUSDT", "CHZ-USDT", "Chiliz", "Crypto", 0.0982, 1.18, 65000000),
  asset("STXUSDT", "STX-USDT", "Stacks", "Crypto", 1.62, 2.42, 110000000),
  asset("KAVAUSDT", "KAVA-USDT", "Kava", "Crypto", 0.482, 0.62, 40000000),
  asset("FTMUSDT", "FTM-USDT", "Fantom", "Crypto", 0.812, 3.42, 240000000),
  asset("ROSEUSDT", "ROSE-USDT", "Oasis Network", "Crypto", 0.0921, 1.18, 38000000),
  asset("CFXUSDT", "CFX-USDT", "Conflux", "Crypto", 0.182, 1.42, 62000000),
  commodity("XAUUSD", "XAUUSD / Gold", "Gold Spot", "OANDA", "XAUUSD", 3328.4, 0.84, "gold-api"),
  commodity("XAGUSD", "XAGUSD / Silver", "Silver Spot", "OANDA", "XAGUSD", 31.42, 0.52),
  commodity("USOIL", "USOIL / WTI", "Crude Oil WTI", "TVC", "USOIL", 79.24, -0.36),
  commodity("UKOIL", "UKOIL / Brent", "Brent Crude Oil", "TVC", "UKOIL", 83.18, -0.22),
  forex("EURUSD", "EURUSD", "Euro / U.S. Dollar", 1.0872, 0.12),
  forex("GBPUSD", "GBPUSD", "British Pound / U.S. Dollar", 1.2738, -0.08),
  indexAsset("NAS100", "NAS100", "Nasdaq 100", "CAPITALCOM", "US100", 18142.6, 0.46),
  indexAsset("SPX500", "SPX500", "S&P 500", "CAPITALCOM", "US500", 5128.2, 0.28)
];

export const cryptoSymbols = assetCatalog.filter((item) => item.group === "Crypto").map((item) => item.symbol);
export const forexSymbols = assetCatalog.filter((item) => item.group === "Forex").map((item) => item.symbol);
export const commoditySymbols = assetCatalog.filter((item) => item.group === "Commodities").map((item) => item.symbol);
export const stockSymbols = assetCatalog.filter((item) => item.group === "Stocks").map((item) => item.symbol);

export function mergeMarketRows(rows: MarketTicker[]): MarketTicker[] {
  const bySymbol = new Map(rows.map((row) => [row.symbol.toUpperCase(), row]));
  return assetCatalog.map((assetItem) => {
    const row = bySymbol.get(assetItem.symbol);
    return {
      symbol: assetItem.symbol,
      price: row?.price ?? assetItem.fallbackPrice,
      change_24h: row?.change_24h ?? assetItem.fallbackChange,
      volume_24h: row?.volume_24h ?? assetItem.fallbackVolume,
      metadata_name: row?.metadata_name ?? assetItem.name,
      metadata_image: row?.metadata_image ?? null
    };
  });
}

export function getAsset(symbol: string) {
  return assetCatalog.find((item) => item.symbol === symbol.toUpperCase());
}

export function displayAssetLabel(symbol: string) {
  return getAsset(symbol)?.label ?? symbol.replace("USDT", "-USDT");
}

export function getTradingViewConfig(symbol: string) {
  const item = getAsset(symbol);
  return {
    provider: item?.tradingViewProvider ?? "BINANCE",
    symbol: item?.tradingViewSymbol ?? symbol
  };
}

function asset(
  symbol: string,
  label: string,
  name: string,
  group: MarketGroup,
  fallbackPrice: number,
  fallbackChange: number,
  fallbackVolume: number
): AssetCatalogItem {
  return {
    symbol,
    label,
    name,
    group,
    fallbackPrice,
    fallbackChange,
    fallbackVolume,
    tradingViewProvider: "BINANCE",
    tradingViewSymbol: symbol,
    liveSource: "binance"
  };
}

function forex(symbol: string, label: string, name: string, fallbackPrice: number, fallbackChange: number): AssetCatalogItem {
  return {
    symbol,
    label,
    name,
    group: "Forex",
    fallbackPrice,
    fallbackChange,
    fallbackVolume: 0,
    tradingViewProvider: "FX",
    tradingViewSymbol: symbol,
    liveSource: "fallback"
  };
}

function commodity(
  symbol: string,
  label: string,
  name: string,
  provider: string,
  tradingViewSymbol: string,
  fallbackPrice: number,
  fallbackChange: number,
  liveSource: "gold-api" | "fallback" = "fallback"
): AssetCatalogItem {
  return {
    symbol,
    label,
    name,
    group: "Commodities",
    fallbackPrice,
    fallbackChange,
    fallbackVolume: 0,
    tradingViewProvider: provider,
    tradingViewSymbol,
    liveSource
  };
}

function indexAsset(
  symbol: string,
  label: string,
  name: string,
  provider: string,
  tradingViewSymbol: string,
  fallbackPrice: number,
  fallbackChange: number
): AssetCatalogItem {
  return {
    symbol,
    label,
    name,
    group: "Stocks",
    fallbackPrice,
    fallbackChange,
    fallbackVolume: 0,
    tradingViewProvider: provider,
    tradingViewSymbol,
    liveSource: "fallback"
  };
}
