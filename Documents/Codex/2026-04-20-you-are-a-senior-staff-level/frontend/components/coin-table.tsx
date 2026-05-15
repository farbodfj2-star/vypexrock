"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ArrowUpDown, Search, Sparkles } from "lucide-react";

import { AssetIcon } from "@/components/asset-icon";
import { displayAssetLabel, getAsset } from "@/lib/asset-catalog";
import { formatDataSource, scoreTicker, type MarketDecision, type MarketSignalScore } from "@/lib/market-signals";
import { cn, formatCompactNumber, formatCurrency } from "@/lib/utils";
import type { MarketTicker } from "@/types";

type CoinTableProps = {
  rows: MarketTicker[];
};

type EnrichedRow = MarketTicker & { signal: MarketSignalScore };
type FilterValue = "all" | "long" | "short" | "watch" | "wait";
type SortValue = "confidence" | "volume" | "change";

export default function CoinTable({ rows }: CoinTableProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");
  const [sort, setSort] = useState<SortValue>("confidence");

  const enrichedRows = useMemo(
    () => rows.map((row, index) => ({ ...row, signal: scoreTicker(row, index, rows.length) })),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return enrichedRows
      .filter((row) => `${row.symbol} ${row.metadata_name ?? ""}`.toLowerCase().includes(term))
      .filter((row) => {
        if (filter === "all") return true;
        if (filter === "long") return row.signal.direction === "long";
        if (filter === "short") return row.signal.direction === "short";
        if (filter === "wait") return row.signal.decision === "Wait";
        return row.signal.decision.includes("Watch");
      })
      .sort((a, b) => {
        if (sort === "volume") return b.volume_24h - a.volume_24h;
        if (sort === "change") return Math.abs(b.change_24h) - Math.abs(a.change_24h);
        return b.signal.confidence - a.signal.confidence;
      });
  }, [enrichedRows, filter, search, sort]);

  const bestLong = enrichedRows.filter((row) => row.signal.direction === "long").sort((a, b) => b.signal.confidence - a.signal.confidence)[0];
  const bestShort = enrichedRows.filter((row) => row.signal.direction === "short").sort((a, b) => b.signal.confidence - a.signal.confidence)[0];
  const highestVolume = [...enrichedRows].sort((a, b) => b.volume_24h - a.volume_24h)[0];
  const strongestMomentum = [...enrichedRows].sort((a, b) => Math.abs(b.change_24h) - Math.abs(a.change_24h))[0];
  const riskMood = computeRiskMood(enrichedRows);

  return (
    <section className="overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#080a0f]/86 shadow-[0_28px_100px_rgba(0,0,0,0.46)] backdrop-blur-xl">
      <div className="border-b border-white/10 bg-white/[0.025] px-6 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-white/40">Live market signals</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Dynamic signals, confidence, and clean execution context</h2>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-cyan-400/18 bg-cyan-400/8 px-4 py-2 text-sm text-cyan-100">
            <Sparkles className="h-4 w-4 text-cyan-200" />
            Scored by momentum, trend, volume, volatility
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-5">
          <SummaryCard label="Best Long" value={bestLong ? displayAssetLabel(bestLong.symbol) : "None"} detail={bestLong?.signal.decision ?? "No active long"} tone="emerald" />
          <SummaryCard label="Best Short" value={bestShort ? displayAssetLabel(bestShort.symbol) : "None"} detail={bestShort?.signal.decision ?? "No active short"} tone="rose" />
          <SummaryCard label="Highest Volume" value={highestVolume ? displayAssetLabel(highestVolume.symbol) : "N/A"} detail={highestVolume ? formatVolume(highestVolume) : "N/A"} tone="cyan" />
          <SummaryCard label="Strongest Move" value={strongestMomentum ? displayAssetLabel(strongestMomentum.symbol) : "N/A"} detail={strongestMomentum ? `${signed(strongestMomentum.change_24h)}%` : "N/A"} tone="violet" />
          <SummaryCard label="Market Risk Mood" value={riskMood.label} detail={riskMood.detail} tone="amber" />
        </div>

        <div className="mt-5 grid gap-3 xl:grid-cols-[1fr_auto_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/36" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search BTC, ETH, Gold, EURUSD..."
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-cyan-300/30"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {(["all", "long", "short", "watch", "wait"] as FilterValue[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={cn(
                  "rounded-full border px-3 py-2 text-sm capitalize transition",
                  filter === item ? "border-white/18 bg-white text-slate-950" : "border-white/10 bg-white/[0.04] text-white/58 hover:bg-white/[0.08]"
                )}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {(["confidence", "volume", "change"] as SortValue[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSort(item)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm capitalize transition",
                  sort === item ? "border-cyan-300/24 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-white/[0.04] text-white/58 hover:bg-white/[0.08]"
                )}
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-3 md:hidden">
        {filteredRows.map((row) => {
          const positive = row.change_24h >= 0;
          return (
            <Link
              key={row.symbol}
              href={`/coin/${row.symbol}`}
              className="rounded-[1.45rem] border border-white/10 bg-white/[0.035] p-4 shadow-[0_14px_44px_rgba(0,0,0,0.24)] transition active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-700/70 to-slate-950">
                    <AssetIcon symbol={row.symbol} name={row.metadata_name} imageUrl={row.metadata_image} className="h-11 w-11" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{row.metadata_name ?? displayAssetLabel(row.symbol)}</p>
                    <p className="mt-1 text-xs text-white/42">{displayAssetLabel(row.symbol)} · {formatDataSource(row)}</p>
                  </div>
                </div>
                <span className={cn("shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold", positive ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-rose-400/20 bg-rose-400/10 text-rose-300")}>
                  {signed(row.change_24h)}%
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-black/18 p-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/35">Price</p>
                  <p className="mt-1 text-sm font-semibold text-white">{formatCurrency(row.price)}</p>
                </div>
                <div className="rounded-2xl bg-black/18 p-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/35">Volume</p>
                  <p className="mt-1 text-sm font-semibold text-white">{formatVolume(row)}</p>
                </div>
              </div>

              <div className="mt-4">
                <SignalBadge decision={row.signal.decision} confidence={row.signal.confidence} />
                <p className="mt-3 text-sm font-medium text-white">{row.signal.shortText}</p>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-white/55">{row.signal.reason}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="hidden max-h-[820px] overflow-auto md:block">
        <table className="min-w-full text-left">
          <thead className="sticky top-0 z-10 border-b border-white/10 bg-[#0a0d13]/95 text-xs uppercase tracking-[0.22em] text-white/38 backdrop-blur-xl">
            <tr>
              <th className="px-6 py-4 font-medium">Asset</th>
              <th className="px-6 py-4 font-medium">Price</th>
              <th className="px-6 py-4 font-medium">24H</th>
              <th className="px-6 py-4 font-medium">Volume</th>
              <th className="px-6 py-4 font-medium">Signal</th>
              <th className="px-6 py-4 font-medium">Should I take it?</th>
              <th className="px-6 py-4 font-medium text-right">Open</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, index) => {
              const positive = row.change_24h >= 0;
              return (
                <tr key={row.symbol} className={cn("border-b border-white/[0.055] transition hover:bg-white/[0.035]", index % 2 === 0 && "bg-white/[0.012]")}>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-700/70 to-slate-950">
                        <AssetIcon symbol={row.symbol} name={row.metadata_name} imageUrl={row.metadata_image} className="h-12 w-12" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{row.metadata_name ?? displayAssetLabel(row.symbol)}</p>
                        <p className="text-sm text-white/42">{displayAssetLabel(row.symbol)} · {formatDataSource(row)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-white">{formatCurrency(row.price)}</td>
                  <td className="px-6 py-5">
                    <span className={cn("inline-flex rounded-full border px-3 py-1 text-sm font-medium", positive ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-rose-400/20 bg-rose-400/10 text-rose-300")}>
                      {signed(row.change_24h)}%
                    </span>
                  </td>
                  <td className="px-6 py-5 text-white/72">{formatVolume(row)}</td>
                  <td className="px-6 py-5">
                    <SignalBadge decision={row.signal.decision} confidence={row.signal.confidence} />
                  </td>
                  <td className="px-6 py-5">
                    <div className="max-w-[300px]">
                      <p className="text-sm font-medium text-white">{row.signal.shortText}</p>
                      <p className="mt-1 text-sm leading-6 text-white/55">{row.signal.reason}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <Link href={`/coin/${row.symbol}`} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-white transition hover:border-cyan-300/30 hover:bg-cyan-400/10">
                      Open analysis
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SignalBadge({ decision, confidence }: { decision: MarketDecision; confidence: number }) {
  const tone = decision.includes("Long")
    ? "border-emerald-400/22 bg-emerald-400/10 text-emerald-300"
    : decision.includes("Short")
      ? "border-rose-400/22 bg-rose-400/10 text-rose-300"
      : decision.includes("Watch")
        ? "border-amber-400/22 bg-amber-400/10 text-amber-200"
        : "border-white/12 bg-white/[0.04] text-white/58";

  return (
    <div className="flex flex-col gap-2">
      <span className={cn("inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]", tone)}>{decision}</span>
      <span className="text-xs text-white/42">Confidence {confidence}%</span>
    </div>
  );
}

function SummaryCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: "emerald" | "rose" | "cyan" | "violet" | "amber" }) {
  const toneClass = {
    emerald: "from-emerald-400/12",
    rose: "from-rose-400/12",
    cyan: "from-cyan-400/12",
    violet: "from-violet-400/12",
    amber: "from-amber-400/12"
  }[tone];

  return (
    <div className={cn("rounded-[1.4rem] border border-white/10 bg-gradient-to-br to-white/[0.025] p-4", toneClass)}>
      <p className="text-xs uppercase tracking-[0.2em] text-white/38">{label}</p>
      <p className="mt-2 truncate text-lg font-semibold text-white">{value}</p>
      <p className="mt-1 truncate text-xs text-white/48">{detail}</p>
    </div>
  );
}

function computeRiskMood(rows: EnrichedRow[]) {
  const longCount = rows.filter((row) => row.signal.direction === "long").length;
  const shortCount = rows.filter((row) => row.signal.direction === "short").length;
  if (longCount > shortCount * 1.4) return { label: "Risk-on", detail: `${longCount} long setups active` };
  if (shortCount > longCount * 1.4) return { label: "Risk-off", detail: `${shortCount} short setups active` };
  return { label: "Selective", detail: "Mixed breadth, use triggers" };
}

function assetInitial(symbol: string) {
  if (symbol === "XAUUSD") return "AU";
  if (symbol.endsWith("USD") && !symbol.endsWith("USDT")) return symbol.slice(0, 2);
  return symbol.replace("USDT", "").slice(0, 3);
}

function formatVolume(row: MarketTicker) {
  if (!row.volume_24h || row.volume_24h <= 0) {
    return getAsset(row.symbol)?.liveSource === "fallback" ? "External feed needed" : "N/A";
  }
  return formatCompactNumber(row.volume_24h);
}

function signed(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}
