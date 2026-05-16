"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, ChevronRight, Search } from "lucide-react";

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
    return { total24h, advancing, total: visible.length };
  }, [visible]);

  const selectedAsset = selected
    ? visible.find((a) => a.symbol === selected) ?? null
    : null;

  return (
    <div className="markets-page mx-auto w-full max-w-[1440px] px-4 py-6 lg:px-8 lg:py-8">
      {/* ── Header ── */}
      <div className="markets-page__head">
        <div>
          <p className="markets-page__eyebrow">FX 2000 · LIVE MARKET BOARD</p>
          <h1 className="markets-page__title">Markets</h1>
          <p className="markets-page__sub">
            Every tracked instrument, live · {totals.total} symbols · {totals.advancing} advancing
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
                Live price, 24h change, candlestick chart, and a custom intelligence card —
                in the spirit of the FX 2000 trading terminal.
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

      {/* ── FX 2000 footer ── */}
      <div className="markets-page__footer">
        <span className="markets-page__footer-mark">FX 2000</span>
        <span className="markets-page__footer-sep" />
        <span>made by Vypexrock · institutional intelligence terminal</span>
        <span className="markets-page__footer-sep" />
        <Link href="/terminal" className="markets-page__footer-link">Open full terminal →</Link>
      </div>
    </div>
  );
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
