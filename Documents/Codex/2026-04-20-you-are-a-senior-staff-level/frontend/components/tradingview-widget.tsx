"use client";

import { useEffect, useRef } from "react";
import { getTradingViewConfig } from "@/lib/asset-catalog";

type TradingViewWidgetProps = {
  symbol: string;
  interval: string;
};

function normalizeTradingViewSymbol(symbol: string) {
  const upper = symbol.toUpperCase();

  const symbolMap: Record<string, string> = {
    MATICUSDT: "POLUSDT",
    XAUUSD: "XAUUSD"
  };

  return symbolMap[upper] ?? upper;
}

function normalizeTradingViewInterval(interval: string) {
  const map: Record<string, string> = {
    "1m": "1",
    "5m": "5",
    "15m": "15",
    "30m": "30",
    "1h": "60",
    "4h": "240",
    "1d": "1D"
  };

  return map[interval] ?? interval;
}

export function TradingViewWidget({ symbol, interval }: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement | null>(null);
  const config = getTradingViewConfig(symbol);
  const tvSymbol = normalizeTradingViewSymbol(config.symbol);
  const tvInterval = normalizeTradingViewInterval(interval);
  const provider = config.provider;
  const iframeUrl = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_${tvSymbol}&symbol=${provider}%3A${tvSymbol}&interval=${tvInterval}&hidesidetoolbar=0&symboledit=0&saveimage=0&toolbarbg=0f1724&theme=dark&style=1&timezone=Etc%2FUTC&studies=[]&hideideas=1&withdateranges=1`;

  useEffect(() => {
    if (!container.current) return;
    container.current.scrollTop = 0;
  }, [symbol, interval]);

  return (
    <section className="overflow-hidden rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] shadow-[0_24px_90px_rgba(0,0,0,0.4)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-5">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Chart workspace</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Premium market view for {symbol}</h2>
        </div>
        <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/58">
          TradingView embed | {interval}
        </div>
      </div>
      <div className="h-[760px] bg-[#060b16]" ref={container}>
        <iframe
          key={`${provider}-${tvSymbol}-${tvInterval}`}
          title={`${symbol} chart`}
          src={iframeUrl}
          className="h-full w-full"
          allowTransparency
        />
      </div>
    </section>
  );
}
