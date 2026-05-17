"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Award,
  ChevronRight,
  Copy,
  Crown,
  Flame,
  ListChecks,
  Search,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";

import { getTraders } from "@/lib/traders-mock";
import { cn } from "@/lib/utils";

import { TraderDetailPanel } from "@/components/copy/trader-detail-panel";

type SortKey = "rank" | "roi30d" | "roi7d" | "winRate" | "pnl30d" | "copiers" | "aum" | "sharpe";
type Filter = "all" | "top10" | "diamond" | "platinum" | "highWin" | "mostCopied";

export default function CopyTradingPage() {
  const all = useMemo(() => getTraders(), []);
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>(all[0]?.id ?? "");

  const filtered = useMemo(() => {
    let list = all.slice();
    if (filter === "top10") list = list.filter((t) => t.rank <= 10);
    if (filter === "diamond") list = list.filter((t) => t.tier === "Diamond");
    if (filter === "platinum") list = list.filter((t) => t.tier === "Diamond" || t.tier === "Platinum");
    if (filter === "highWin") list = list.filter((t) => t.winRate >= 75);
    if (filter === "mostCopied") list = list.sort((a, b) => b.copiers - a.copiers).slice(0, 25);

    const q = search.trim().toLowerCase();
    if (q) list = list.filter((t) => t.handle.toLowerCase().includes(q) || t.id.toLowerCase().includes(q));

    if (sortKey === "rank") list.sort((a, b) => a.rank - b.rank);
    else if (sortKey === "roi30d") list.sort((a, b) => b.roi30d - a.roi30d);
    else if (sortKey === "roi7d") list.sort((a, b) => b.roi7d - a.roi7d);
    else if (sortKey === "winRate") list.sort((a, b) => b.winRate - a.winRate);
    else if (sortKey === "pnl30d") list.sort((a, b) => b.pnl30d - a.pnl30d);
    else if (sortKey === "copiers") list.sort((a, b) => b.copiers - a.copiers);
    else if (sortKey === "aum") list.sort((a, b) => b.aum - a.aum);
    else if (sortKey === "sharpe") list.sort((a, b) => b.sharpe - a.sharpe);

    return list;
  }, [all, filter, search, sortKey]);

  const selected = useMemo(() => all.find((t) => t.id === selectedId) ?? all[0] ?? null, [all, selectedId]);

  // Top stats
  const totals = useMemo(() => {
    const totalCopiers = all.reduce((s, t) => s + t.copiers, 0);
    const totalAum = all.reduce((s, t) => s + t.aum, 0);
    const top1 = all[0];
    return { totalCopiers, totalAum, top1 };
  }, [all]);

  return (
    <div className="copy-page mx-auto w-full max-w-none px-4 py-6 lg:px-6 lg:py-8 xl:px-8">
      {/* ── Hero ── */}
      <div className="copy-page__hero">
        <div>
          <p className="copy-page__eyebrow">VYPEXROCK · COPY TRADING</p>
          <h1 className="copy-page__title">Top 100 traders.</h1>
          <p className="copy-page__sub">
            Live leaderboard of the most profitable traders on the platform.
            See their open positions, copy their flow with one tap.
          </p>
        </div>

        <div className="copy-page__hero-stats">
          <div>
            <p className="copy-page__hero-stat-label">TOTAL COPIERS</p>
            <p className="copy-page__hero-stat-value">{formatCompact(totals.totalCopiers)}</p>
          </div>
          <div>
            <p className="copy-page__hero-stat-label">TOTAL AUM</p>
            <p className="copy-page__hero-stat-value">${formatCompact(totals.totalAum)}</p>
          </div>
          <div>
            <p className="copy-page__hero-stat-label">#1 ROI · 30D</p>
            <p className="copy-page__hero-stat-value is-up">+{totals.top1?.roi30d?.toFixed(1) ?? "—"}%</p>
          </div>
        </div>
      </div>

      {/* ── Top 3 podium ── */}
      <div className="copy-page__podium">
        {all.slice(0, 3).map((t, i) => (
          <button
            key={t.id}
            onClick={() => setSelectedId(t.id)}
            className={cn("copy-podium", i === 0 && "is-first", i === 1 && "is-second", i === 2 && "is-third")}
          >
            <div className="copy-podium__rank">
              {i === 0 ? <Crown className="h-4 w-4" /> : i === 1 ? <Award className="h-4 w-4" /> : <Flame className="h-4 w-4" />}
              <span>#{t.rank}</span>
            </div>
            <Avatar handle={t.handle} size={56} />
            <p className="copy-podium__handle">{t.handle}</p>
            <p className="copy-podium__country">{t.country} · {t.tier}</p>
            <div className="copy-podium__stats">
              <div>
                <p className="copy-podium__stat-label">ROI 30D</p>
                <p className="copy-podium__stat-value is-up">+{t.roi30d.toFixed(1)}%</p>
              </div>
              <div>
                <p className="copy-podium__stat-label">WIN RATE</p>
                <p className="copy-podium__stat-value">{t.winRate.toFixed(1)}%</p>
              </div>
              <div>
                <p className="copy-podium__stat-label">COPIERS</p>
                <p className="copy-podium__stat-value">{formatCompact(t.copiers)}</p>
              </div>
            </div>
            <span className="copy-podium__cta">
              View profile <ChevronRight className="h-3 w-3" />
            </span>
          </button>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="copy-page__toolbar">
        <div className="copy-page__filters">
          <FilterPill label="All" active={filter === "all"} onClick={() => setFilter("all")} />
          <FilterPill label="Top 10" icon={<Crown className="h-3 w-3" />} active={filter === "top10"} onClick={() => setFilter("top10")} />
          <FilterPill label="Diamond" icon={<Award className="h-3 w-3" />} active={filter === "diamond"} onClick={() => setFilter("diamond")} />
          <FilterPill label="Platinum+" active={filter === "platinum"} onClick={() => setFilter("platinum")} />
          <FilterPill label="High win-rate" icon={<TrendingUp className="h-3 w-3" />} active={filter === "highWin"} onClick={() => setFilter("highWin")} />
          <FilterPill label="Most copied" icon={<Users className="h-3 w-3" />} active={filter === "mostCopied"} onClick={() => setFilter("mostCopied")} />
        </div>

        <div className="copy-page__search">
          <Search className="h-4 w-4 text-white/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search trader handle…"
            className="copy-page__search-input"
            type="text"
          />
        </div>

        <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className="copy-page__sort">
          <option value="rank">Sort: Rank</option>
          <option value="roi30d">Sort: ROI 30d</option>
          <option value="roi7d">Sort: ROI 7d</option>
          <option value="winRate">Sort: Win rate</option>
          <option value="pnl30d">Sort: PnL 30d</option>
          <option value="copiers">Sort: Copiers</option>
          <option value="aum">Sort: AUM</option>
          <option value="sharpe">Sort: Sharpe</option>
        </select>
      </div>

      {/* ── Body grid ── */}
      <div className="copy-page__body">
        {/* Leaderboard list */}
        <div className="copy-page__list">
          <div className="copy-page__list-head">
            <span>RANK</span>
            <span>TRADER</span>
            <span className="hidden sm:inline">ROI · 30D</span>
            <span className="hidden md:inline">WIN RATE</span>
            <span className="hidden lg:inline">PNL · 30D</span>
            <span className="hidden lg:inline">COPIERS</span>
            <span aria-hidden />
          </div>

          <div className="copy-page__list-body">
            {filtered.map((t) => {
              const sel = t.id === selectedId;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={cn("copy-row", sel && "is-selected")}
                >
                  <span className="copy-row__rank">
                    <span className={cn("copy-row__rank-num", t.rank <= 3 && "is-top")}>#{t.rank}</span>
                    <span className="copy-row__tier" data-tier={t.tier}>{t.tier}</span>
                  </span>

                  <span className="copy-row__trader">
                    <Avatar handle={t.handle} size={36} />
                    <span className="copy-row__trader-text">
                      <span className="copy-row__handle">
                        {t.country} <span>{t.handle}</span>
                      </span>
                      <span className="copy-row__meta">
                        {formatCompact(t.totalTrades)} trades · sharpe {t.sharpe.toFixed(2)}
                      </span>
                    </span>
                  </span>

                  <span className={cn("copy-row__roi hidden sm:inline", t.roi30d >= 0 ? "is-up" : "is-dn")}>
                    {t.roi30d >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {(t.roi30d >= 0 ? "+" : "") + t.roi30d.toFixed(1)}%
                  </span>

                  <span className="copy-row__winrate hidden md:inline">
                    <span className="copy-row__winrate-bar">
                      <span style={{ width: `${Math.min(100, Math.max(0, t.winRate))}%` }} />
                    </span>
                    <span>{t.winRate.toFixed(1)}%</span>
                  </span>

                  <span className={cn("copy-row__pnl hidden lg:inline", t.pnl30d >= 0 ? "is-up" : "is-dn")}>
                    {(t.pnl30d >= 0 ? "+" : "−") + "$" + formatCompact(Math.abs(t.pnl30d))}
                  </span>

                  <span className="copy-row__copiers hidden lg:inline">
                    <Users className="h-3 w-3" />
                    {formatCompact(t.copiers)}
                  </span>

                  <ChevronRight className="copy-row__chev h-4 w-4" />
                </button>
              );
            })}
            {filtered.length === 0 ? <div className="copy-page__empty">No traders match.</div> : null}
          </div>
        </div>

        {/* Detail panel */}
        <aside className="copy-page__detail">
          {selected ? <TraderDetailPanel trader={selected} /> : null}
        </aside>
      </div>

      {/* ── Footer ── */}
      <div className="copy-page__footer">
        <span className="copy-page__footer-mark">VYPEXROCK</span>
        <span className="copy-page__footer-sep" />
        <span>copy trading · live leaderboard · model strategies powered by elite Vypexrock traders</span>
        <span className="copy-page__footer-sep" />
        <span className="copy-page__footer-note">
          <Shield className="inline h-3 w-3" /> Past performance does not guarantee future results.
        </span>
      </div>
    </div>
  );
}

function FilterPill({ label, icon, active, onClick }: { label: string; icon?: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("copy-page__filter", active && "is-active")}>
      {icon}
      {label}
    </button>
  );
}

function Avatar({ handle, size = 40 }: { handle: string; size?: number }) {
  // Deterministic gradient from handle
  let h = 0;
  for (let i = 0; i < handle.length; i++) h = (h * 31 + handle.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  const hue2 = (hue + 60) % 360;
  return (
    <span
      className="copy-avatar"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(140deg, hsl(${hue} 60% 45%), hsl(${hue2} 70% 30%))`,
        fontSize: Math.floor(size * 0.4),
      }}
    >
      {handle.slice(0, 2).toUpperCase()}
    </span>
  );
}

function formatCompact(n: number) {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return n.toFixed(0);
}
