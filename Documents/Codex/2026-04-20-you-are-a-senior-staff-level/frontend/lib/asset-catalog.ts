import type { MarketTicker } from "@/types";

export type MarketGroup = "Crypto" | "Forex" | "Stocks";

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
  asset("BTCUSDT", "BTC-USDT", "Bitcoin", "Crypto", 68452, 2.34, 52400000000),
  asset("ETHUSDT", "ETH-USDT", "Ethereum", "Crypto", 3284, 1.81, 22700000000),
  asset("SOLUSDT", "SOL-USDT", "Solana", "Crypto", 176.8, 4.22, 8430000000),
  asset("XRPUSDT", "XRP-USDT", "XRP", "Crypto", 0.628, -0.48, 1960000000),
  asset("DOGEUSDT", "DOGE-USDT", "Dogecoin", "Crypto", 0.1812, 3.15, 1740000000),
  asset("BNBUSDT", "BNB-USDT", "BNB", "Crypto", 612.5, 1.06, 2110000000),
  asset("AVAXUSDT", "AVAX-USDT", "Avalanche", "Crypto", 42.1, 2.74, 1430000000),
  asset("LINKUSDT", "LINK-USDT", "Chainlink", "Crypto", 18.34, 1.12, 1260000000),
  asset("SUIUSDT", "SUI-USDT", "Sui", "Crypto", 1.74, 5.42, 1180000000),
  asset("APTUSDT", "APT-USDT", "Aptos", "Crypto", 9.22, 2.48, 910000000),
  asset("UNIUSDT", "UNI-USDT", "Uniswap", "Crypto", 11.36, 1.64, 860000000),
  asset("BCHUSDT", "BCH-USDT", "Bitcoin Cash", "Crypto", 512.4, 3.48, 780000000),
  asset("TONUSDT", "TON-USDT", "Toncoin", "Crypto", 5.92, 0.84, 740000000),
  asset("FILUSDT", "FIL-USDT", "Filecoin", "Crypto", 8.11, -1.18, 620000000),
  asset("ADAUSDT", "ADA-USDT", "Cardano", "Crypto", 1.12, 1.62, 1240000000),
  asset("LTCUSDT", "LTC-USDT", "Litecoin", "Crypto", 88.42, 1.18, 850000000),
  asset("DOTUSDT", "DOT-USDT", "Polkadot", "Crypto", 7.31, -0.62, 740000000),
  asset("NEARUSDT", "NEAR-USDT", "NEAR Protocol", "Crypto", 6.48, 2.04, 680000000),
  asset("OPUSDT", "OP-USDT", "Optimism", "Crypto", 2.85, 2.46, 530000000),
  asset("ARBUSDT", "ARB-USDT", "Arbitrum", "Crypto", 1.12, 1.88, 560000000),
  asset("INJUSDT", "INJ-USDT", "Injective", "Crypto", 26.4, 4.08, 570000000),
  asset("PEPEUSDT", "PEPE-USDT", "Pepe", "Crypto", 0.00000987, 6.54, 1140000000),
  asset("SHIBUSDT", "SHIB-USDT", "Shiba Inu", "Crypto", 0.00002814, 1.92, 960000000),
  {
    symbol: "XAUUSD",
    label: "XAUUSD / Gold",
    name: "Gold Spot",
    group: "Forex",
    fallbackPrice: 3328.4,
    fallbackChange: 0.84,
    fallbackVolume: 0,
    tradingViewProvider: "OANDA",
    tradingViewSymbol: "XAUUSD",
    liveSource: "gold-api"
  },
  forex("EURUSD", "EURUSD", "Euro / U.S. Dollar", 1.0872, 0.12),
  forex("GBPUSD", "GBPUSD", "British Pound / U.S. Dollar", 1.2738, -0.08),
  indexAsset("NAS100", "NAS100", "Nasdaq 100", "CAPITALCOM", "US100", 18142.6, 0.46),
  indexAsset("SPX500", "SPX500", "S&P 500", "CAPITALCOM", "US500", 5128.2, 0.28)
];

export const cryptoSymbols = assetCatalog.filter((item) => item.group === "Crypto").map((item) => item.symbol);
export const forexSymbols = assetCatalog.filter((item) => item.group === "Forex").map((item) => item.symbol);
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
