"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, ChevronRight, Search, TrendingUp } from "lucide-react";

import { apiFetch } from "@/lib/api";
import {
  assetCatalog,
  mergeMarketRows,
} from "@/lib/asset-catalog";
import { dashboardFallbackRows } from "@/lib/mock-data";
import type { MarketTicker } from "@/types";
import { useMarketStream } from "@/hooks/use-market-stream";
import { cn } from "@/lib/utils";

import { CoinDetailPanel } from "@/components/markets/coin-detail-panel";

type GroupFilter = "All" | "Crypto" | "Forex" | "Commodities" | "Stocks";
type SortKey = "default" | "price" | "change" | "volume";

const FILTERS: GroupFilter[] = ["All", "Crypto", "Forex", "Commodities", "Stocks"];

export default function MarketsPage() {
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch<MarketTicker[]>("/market/dashboard"),
    refetchInterval: 4000,
  });
  useMarketStream();

  const rows = mergeMarketRows(data?.length ? data : dashboardFallbackRows);

  const [filter, setFilter] = useState<GroupFilter>("Crypto");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [selected, setSelected] = useState<string | null>(null);

  const visible = useMemo(() => {
    const bySymbol = new Map(rows.map((r) => [r.symbol, r]));
    let list = assetCatalog
      .filter((a) => filter === "All" || a.group === filter)
      .map((a) => {
        const r = bySymbol.get(a.symbol);
        return {
          ...a,
          price: r?.price ?? a.fallbackPrice,
          change: r?.change_24h ?? a.fallbackChange,
          volume: r?.volume_24h ?? a.fallbackVolume,
        };
      });

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.symbol.toLowerCase().includes(q) ||
          a.label.toLowerCase().includes(q),
      );
    }

    if (sortKey === "price") list.sort((a, b) => b.price - a.price);
    else if (sortKey === "change") list.sort((a, b) => b.change - a.change);
    else if (sortKey === "volume") list.sort((a, b) => b.volume - a.volume);

    return list;
  }, [rows, filter, search, sortKey]);

  const totals = useMemo(() => {
    const total24h = visible.reduce((s, a) => s + (a.volume || 0), 0);
    const advancing = visible.filter((a) => a.change > 0).length;
    const topGainer = [...visible].sort((a, b) => b.change - a.change)[0];
    const topLoser = [...visible].sort((a, b) => a.change - b.change)[0];
    return { total24h, advancing, total: visible.length, topGainer, topLoser };
  }, [visible]);

  const selectedAsset = selected
    ? visible.find((a) => a.symbol === selected) ?? null
    : null;

  return (
    <div className="markets-page mx-auto w-full max-w-none px-4 py-6 lg:px-6 lg:py-8 xl:px-8">
      {/* ── Header ── */}
      <div className="markets-page__head">
        <div>
          <p className="markets-page__eyebrow">VYPEXROCK · LIVE MARKET BOARD</p>
          <h1 className="markets-page__title">Markets</h1>
          <p className="markets-page__sub">
            Live prices for {totals.total} instruments · {totals.advancing} advancing · streaming from Binance and major venues.
          </p>
        </div>

        <div className="markets-page__stats">
          <div>
            <p className="markets-page__stat-label">SYMBOLS</p>
            <p className="markets-page__stat-value">{totals.total}</p>
          </div>
          <div>
            <p className="markets-page__stat-label">24H VOLUME</p>
            <p className="markets-page__stat-value">${formatCompact(totals.total24h)}</p>
          </div>
          <div>
            <p className="markets-page__stat-label">ADVANCING</p>
            <p className="markets-page__stat-value">{totals.advancing}/{totals.total}</p>
          </div>
        </div>
      </div>

      {/* ── Mood / leaders ── */}
      {totals.topGainer && totals.topLoser ? (
        <div className="markets-page__mood">
          <div className="markets-page__mood-card markets-page__mood-card--up">
            <div>
              <p className="markets-page__mood-label">TOP GAINER · 24H</p>
              <p className="markets-page__mood-name">{totals.topGainer.name}</p>
              <p className="markets-page__mood-symbol">{totals.topGainer.label}</p>
            </div>
            <div className="markets-page__mood-figure">
              <span className="is-up">+{totals.topGainer.change.toFixed(2)}%</span>
              <span>${formatPrice(totals.topGainer.price)}</span>
            </div>
          </div>
          <div className="markets-page__mood-card markets-page__mood-card--dn">
            <div>
              <p className="markets-page__mood-label">TOP LOSER · 24H</p>
              <p className="markets-page__mood-name">{totals.topLoser.name}</p>
              <p className="markets-page__mood-symbol">{totals.topLoser.label}</p>
            </div>
            <div className="markets-page__mood-figure">
              <span className="is-dn">{totals.topLoser.change.toFixed(2)}%</span>
              <span>${formatPrice(totals.topLoser.price)}</span>
            </div>
          </div>
          <div className="markets-page__mood-card markets-page__mood-card--mid">
            <div>
              <p className="markets-page__mood-label">SENTIMENT</p>
              <p className="markets-page__mood-name">{moodLabel(totals.advancing, totals.total)}</p>
              <p className="markets-page__mood-symbol">{totals.advancing} of {totals.total} advancing</p>
            </div>
            <div className="markets-page__mood-figure">
              <span className={cn(totals.advancing / totals.total > 0.5 ? "is-up" : "is-dn")}>
                {Math.round((totals.advancing / Math.max(1, totals.total)) * 100)}%
              </span>
              <span>breadth</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Filters / search ── */}
      <div className="markets-page__toolbar">
        <div className="markets-page__filters">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn("markets-page__filter", filter === f && "is-active")}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="markets-page__search">
          <Search className="h-4 w-4 text-white/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search symbol or name…"
            type="text"
            className="markets-page__search-input"
          />
        </div>

        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="markets-page__sort"
        >
          <option value="default">Sort: Default</option>
          <option value="price">Sort: Price</option>
          <option value="change">Sort: 24h Change</option>
          <option value="volume">Sort: Volume</option>
        </select>
      </div>

      {/* ── Body grid: list + detail ── */}
      <div className="markets-page__body">
        {/* coins list */}
        <div className="markets-page__list">
          <div className="markets-page__list-head">
            <span>Symbol</span>
            <span>Price</span>
            <span>24h</span>
            <span className="hidden md:inline">Volume</span>
            <span aria-hidden />
          </div>
          <div className="markets-page__list-body" role="listbox" aria-label="Markets">
            {visible.map((a) => {
              const up = a.change >= 0;
              const isSel = selected === a.symbol;
              return (
                <button
                  key={a.symbol}
                  onClick={() => setSelected(a.symbol)}
                  className={cn("markets-row", isSel && "is-selected")}
                  role="option"
                  aria-selected={isSel}
                >
                  <span className="markets-row__sym">
                    <span className="markets-row__icon" data-letter={a.symbol.charAt(0)}>{a.symbol.charAt(0)}</span>
                    <span className="markets-row__name-col">
                      <span className="markets-row__name">{a.name}</span>
                      <span className="markets-row__label">{a.label}</span>
                    </span>
                  </span>
                  <span className="markets-row__price">${formatPrice(a.price)}</span>
                  <span className={cn("markets-row__chg", up ? "is-up" : "is-dn")}>
                    {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {(up ? "+" : "") + a.change.toFixed(2)}%
                  </span>
                  <span className="markets-row__vol hidden md:inline">{a.volume ? "$" + formatCompact(a.volume) : "—"}</span>
                  <ChevronRight className="markets-row__chev h-4 w-4" />
                </button>
              );
            })}
            {visible.length === 0 ? (
              <div className="markets-page__empty">No matches found.</div>
            ) : null}
          </div>
        </div>

        {/* detail panel */}
        <aside className="markets-page__detail">
          {selectedAsset ? (
            <CoinDetailPanel
              symbol={selectedAsset.symbol}
              name={selectedAsset.name}
              label={selectedAsset.label}
              group={selectedAsset.group}
              price={selectedAsset.price}
              change={selectedAsset.change}
              volume={selectedAsset.volume}
            />
          ) : (
            <div className="markets-page__placeholder">
              <p className="markets-page__placeholder-eyebrow">SELECT AN INSTRUMENT</p>
              <h2 className="markets-page__placeholder-title">Tap any symbol to open the analysis panel.</h2>
              <p className="markets-page__placeholder-body">
                Get a live candlestick chart, 24h stats, key indicators, and a real
                description of what the asset is and how it trades.
              </p>
              <div className="markets-page__placeholder-grid">
                {visible.slice(0, 4).map((a) => (
                  <button
                    key={a.symbol}
                    onClick={() => setSelected(a.symbol)}
                    className="markets-page__placeholder-pill"
                  >
                    <span>{a.symbol.replace("USDT", "")}</span>
                    <span className={a.change >= 0 ? "is-up" : "is-dn"}>
                      {(a.change >= 0 ? "+" : "") + a.change.toFixed(2)}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ── footer ── */}
      <div className="markets-page__footer">
        <span className="markets-page__footer-mark">VYPEXROCK</span>
        <span className="markets-page__footer-sep" />
        <span>institutional crypto intelligence · live data streaming</span>
        <span className="markets-page__footer-sep" />
        <Link href="/terminal" className="markets-page__footer-link">
          <TrendingUp className="inline h-3 w-3" /> Open full terminal →
        </Link>
      </div>
    </div>
  );
}

function moodLabel(advancing: number, total: number) {
  if (total === 0) return "—";
  const ratio = advancing / total;
  if (ratio >= 0.7) return "Risk-on";
  if (ratio >= 0.55) return "Bullish lean";
  if (ratio >= 0.45) return "Mixed";
  if (ratio >= 0.3) return "Bearish lean";
  return "Risk-off";
}

function formatPrice(p: number) {
  if (p >= 1000) return p.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (p >= 1) return p.toLocaleString(undefined, { maximumFractionDigits: 4 });
  if (p >= 0.01) return p.toFixed(4);
  if (p >= 0.0001) return p.toFixed(6);
  return p.toExponential(3);
}

function formatCompact(n: number) {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return n.toFixed(2);
}
