"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BrainCircuit, CircleDot, Sparkles } from "lucide-react";

import { AnalysisWorkbench } from "@/components/analysis-workbench";
import { TradingViewWidget } from "@/components/tradingview-widget";
import { useMarketStream } from "@/hooks/use-market-stream";
import { apiFetch } from "@/lib/api";
import { displayAssetLabel, getAsset } from "@/lib/asset-catalog";
import { scoreCoinDetail } from "@/lib/market-signals";
import { buildMockCoinDetail } from "@/lib/mock-data";
import { cn, formatCurrency } from "@/lib/utils";
import type { CoinDetail } from "@/types";

const timeframes = ["15m", "30m", "1h", "4h", "1d"];

export default function CoinDetailPage({ params }: { params: { symbol: string } }) {
  const [interval, setInterval] = useState("1h");
  const asset = getAsset(params.symbol);
  const backendSupported = asset?.liveSource === "binance" || asset?.liveSource === "gold-api";
  const { data, isLoading, error } = useQuery({
    queryKey: ["coin", params.symbol, interval],
    queryFn: () => apiFetch<CoinDetail>(`/market/coins/${params.symbol}?interval=${interval}`),
    refetchInterval: 1000,
    enabled: backendSupported
  });
  useMarketStream();
  const detail = data && data.signals.length > 0 ? data : buildMockCoinDetail(params.symbol.toUpperCase(), interval);
  const score = scoreCoinDetail(detail);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2.2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.1),_transparent_24%),linear-gradient(180deg,rgba(18,21,29,0.92),rgba(8,10,15,0.88))] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.42)] lg:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
              <BrainCircuit className="h-4 w-4" />
              Vypexrock premium market brief
            </div>
            <h1 className="mt-5 text-4xl font-semibold text-white lg:text-5xl">{displayAssetLabel(detail.symbol)}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-2xl font-semibold text-white">{formatCurrency(detail.ticker.price)}</span>
              <span className={cn("rounded-full border px-3 py-1 text-sm font-semibold", detail.ticker.change_24h >= 0 ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-rose-400/20 bg-rose-400/10 text-rose-300")}>
                {detail.ticker.change_24h >= 0 ? "+" : ""}{detail.ticker.change_24h.toFixed(2)}%
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-white/55">
                <CircleDot className="h-3.5 w-3.5 text-emerald-300" />
                {backendSupported ? "Live / refreshing" : "Structured fallback feed"}
              </span>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-white/38">Signal</p>
              <p className="mt-1 text-lg font-semibold text-white">{score.decision}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-white/38">Confidence</p>
              <p className="mt-1 text-lg font-semibold text-white">{score.confidence}%</p>
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-2">
          {timeframes.map((item) => (
            <button
              key={item}
              onClick={() => setInterval(item)}
              className={`rounded-full px-4 py-2 text-sm transition ${
                interval === item
                  ? "bg-gradient-to-r from-cyan-400 to-violet-500 font-semibold text-slate-950"
                  : "border border-white/10 bg-white/[0.04] text-white/65 hover:border-white/20 hover:bg-white/[0.08]"
              }`}
            >
              {item}
            </button>
          ))}
          <div className="ml-auto hidden items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm text-violet-100 lg:inline-flex">
            <Sparkles className="h-4 w-4" />
            {asset?.name ?? detail.ticker.metadata_name ?? detail.symbol}
          </div>
        </div>
      </section>

      {isLoading ? <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-white/65">Loading analysis...</div> : null}
      {error ? (
        <div className="rounded-[2rem] border border-amber-300/25 bg-amber-300/10 p-8 text-amber-100">
          {error instanceof Error ? `${error.message}. Showing structured fallback analysis.` : "Failed to load live detail. Showing structured fallback analysis."}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <div className="min-w-0">
          <TradingViewWidget symbol={params.symbol.toUpperCase()} interval={interval} />
        </div>
        <AnalysisWorkbench detail={detail} interval={interval} />
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <InfoCard title="Market structure" value={score.structure.replace("-", " ")} text={score.reason} />
        <InfoCard title="Recent signal history" value={score.decision} text={`The latest ${interval} read gives ${score.confidence}% confidence. Vypexrock updates this view as fresh market data arrives.`} />
        <InfoCard title="Data quality" value={backendSupported ? "Live feed" : "Fallback feed"} text={backendSupported ? "Crypto and gold-supported markets use live backend data where available." : "This market needs an external live provider; current levels use realistic fallback logic."} />
      </section>

      <section className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] px-6 py-5 text-sm leading-7 text-white/48">
        Vypexrock setups are scenario-based research only. Historical outcomes, AI confidence, and chart structure do not guarantee future performance. Wait for confirmation, define invalidation clearly, and size risk before entering any trade.
      </section>
    </div>
  );
}

function InfoCard({ title, value, text }: { title: string; value: string; text: string }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
      <p className="text-xs uppercase tracking-[0.24em] text-white/38">{title}</p>
      <h3 className="mt-2 text-xl font-semibold capitalize text-white">{value}</h3>
      <p className="mt-3 text-sm leading-7 text-white/56">{text}</p>
    </div>
  );
}
