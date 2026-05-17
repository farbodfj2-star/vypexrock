"use client";

import { Activity, ArrowDownRight, ArrowUpRight, Award, BarChart3, Calendar, Copy, Eye, Layers, Shield, Sparkles, Star, TrendingDown, TrendingUp, Users } from "lucide-react";
import type { Trader, TraderPosition } from "@/lib/traders-mock";
import { cn } from "@/lib/utils";

export function TraderDetailPanel({ trader }: { trader: Trader }) {
  const sparkPath = buildSparkPath(trader.spark);
  const sparkUp = trader.pnl30d >= 0;

  return (
    <div className="trader-detail">
      {/* ── header ── */}
      <div className="trader-detail__head">
        <Avatar handle={trader.handle} size={64} />
        <div className="trader-detail__head-text">
          <p className="trader-detail__rank">
            <span className="trader-detail__rank-num">#{trader.rank}</span>
            <span className="trader-detail__tier" data-tier={trader.tier}>{trader.tier}</span>
            <span className="trader-detail__country">{trader.country}</span>
          </p>
          <h2 className="trader-detail__handle">{trader.handle}</h2>
          <p className="trader-detail__bio">{trader.bio}</p>
          <div className="trader-detail__badges">
            {trader.badges.map((b) => (
              <span key={b} className="trader-detail__badge">
                <Award className="h-3 w-3" /> {b}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── headline ROI + spark ── */}
      <div className="trader-detail__headline">
        <div className="trader-detail__headline-stats">
          <div>
            <p className="trader-detail__headline-label">ROI · 30D</p>
            <p className={cn("trader-detail__headline-value", trader.roi30d >= 0 ? "is-up" : "is-dn")}>
              {(trader.roi30d >= 0 ? "+" : "") + trader.roi30d.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="trader-detail__headline-label">PNL · 30D</p>
            <p className={cn("trader-detail__headline-value", trader.pnl30d >= 0 ? "is-up" : "is-dn")}>
              {(trader.pnl30d >= 0 ? "+" : "−") + "$" + formatCompact(Math.abs(trader.pnl30d))}
            </p>
          </div>
          <div>
            <p className="trader-detail__headline-label">PNL · ALL TIME</p>
            <p className={cn("trader-detail__headline-value", trader.pnlAllTime >= 0 ? "is-up" : "is-dn")}>
              {(trader.pnlAllTime >= 0 ? "+" : "−") + "$" + formatCompact(Math.abs(trader.pnlAllTime))}
            </p>
          </div>
        </div>

        <div className="trader-detail__spark">
          <p className="trader-detail__spark-label">30-DAY PNL</p>
          <svg viewBox="0 0 300 80" preserveAspectRatio="none" className="trader-detail__spark-svg">
            <defs>
              <linearGradient id={`spk-${trader.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={sparkUp ? "rgba(110,231,183,0.35)" : "rgba(252,165,165,0.35)"} />
                <stop offset="1" stopColor="rgba(0,0,0,0)" />
              </linearGradient>
            </defs>
            <path d={sparkPath.area} fill={`url(#spk-${trader.id})`} />
            <path d={sparkPath.line} fill="none" stroke={sparkUp ? "rgba(110,231,183,0.95)" : "rgba(252,165,165,0.95)"} strokeWidth="1.5" />
          </svg>
        </div>
      </div>

      {/* ── stats grid ── */}
      <div className="trader-detail__stats">
        <Stat label="WIN RATE" value={`${trader.winRate.toFixed(1)}%`} barPct={trader.winRate} barColor={sparkUp ? "up" : "dn"} />
        <Stat label="ROI · 7D" value={`${trader.roi7d >= 0 ? "+" : ""}${trader.roi7d.toFixed(1)}%`} valueClass={trader.roi7d >= 0 ? "is-up" : "is-dn"} />
        <Stat label="SHARPE" value={trader.sharpe.toFixed(2)} />
        <Stat label="MAX DD" value={`${trader.maxDrawdown.toFixed(1)}%`} valueClass="is-dn" />
        <Stat label="TRADES" value={formatCompact(trader.totalTrades)} />
        <Stat label="AVG HOLD" value={`${trader.avgHoldHours.toFixed(1)}h`} />
        <Stat label="COPIERS" value={formatCompact(trader.copiers)} />
        <Stat label="AUM" value={`$${formatCompact(trader.aum)}`} />
      </div>

      {/* ── open positions table (Binance-style) ── */}
      <div className="trader-detail__positions">
        <div className="trader-detail__positions-head">
          <Layers className="h-3.5 w-3.5" />
          <span>OPEN POSITIONS · {trader.positions.length}</span>
          <span className="trader-detail__positions-live">
            <span className="trader-detail__positions-live-dot" />
            LIVE
          </span>
        </div>

        <div className="trader-detail__positions-table">
          <div className="trader-detail__positions-row trader-detail__positions-row--head">
            <span>SYMBOL</span>
            <span>SIDE / LEV</span>
            <span>SIZE</span>
            <span>ENTRY · MARK</span>
            <span>MARGIN</span>
            <span>UNREALIZED PNL</span>
          </div>
          {trader.positions.map((p, i) => <PositionRow key={i} p={p} />)}
        </div>
      </div>

      {/* ── How copy works ── */}
      <div className="trader-detail__copy-info">
        <div className="trader-detail__copy-info-head">
          <Sparkles className="h-3.5 w-3.5" />
          <span>COPY TERMS</span>
        </div>
        <div className="trader-detail__copy-info-grid">
          <div>
            <p className="trader-detail__copy-info-label">Min copy amount</p>
            <p className="trader-detail__copy-info-value">${trader.copyMin}</p>
          </div>
          <div>
            <p className="trader-detail__copy-info-label">Profit share</p>
            <p className="trader-detail__copy-info-value">{trader.profitShare}%</p>
          </div>
          <div>
            <p className="trader-detail__copy-info-label">Last trade</p>
            <p className="trader-detail__copy-info-value">{trader.lastTradeAgo}</p>
          </div>
          <div>
            <p className="trader-detail__copy-info-label">On platform</p>
            <p className="trader-detail__copy-info-value">{Math.floor(trader.joinedDays / 30)}m {trader.joinedDays % 30}d</p>
          </div>
        </div>
      </div>

      {/* ── CTAs ── */}
      <div className="trader-detail__actions">
        <button type="button" className="trader-detail__cta">
          <Copy className="h-4 w-4" />
          Copy this trader
        </button>
        <button type="button" className="trader-detail__cta trader-detail__cta--quiet">
          <Eye className="h-4 w-4" />
          Watchlist
        </button>
      </div>

      {/* ── disclaimer ── */}
      <div className="trader-detail__disclaimer">
        <Shield className="h-3.5 w-3.5" />
        <p>
          Copy trading carries risk. PnL is unrealized; positions can move against you. Past results do not guarantee future performance.
          Set a hard cap on copy capital and review the trader's max drawdown before allocating.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────
function PositionRow({ p }: { p: TraderPosition }) {
  const isUp = p.pnl >= 0;
  return (
    <div className="trader-detail__positions-row">
      <span className="trader-detail__pos-symbol">
        <span className="trader-detail__pos-icon" data-letter={p.symbol.charAt(0)}>{p.symbol.charAt(0)}</span>
        <span>
          <span className="trader-detail__pos-symbol-name">{p.symbol.replace("USDT", "/USDT")}</span>
          <span className="trader-detail__pos-symbol-time">{p.openedAt}</span>
        </span>
      </span>

      <span className="trader-detail__pos-side">
        <span className={cn("trader-detail__pos-side-tag", p.side === "LONG" ? "is-long" : "is-short")}>
          {p.side === "LONG" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {p.side}
        </span>
        <span className="trader-detail__pos-leverage">{p.leverage}x</span>
      </span>

      <span className="trader-detail__pos-size">${formatCompact(p.size)}</span>

      <span className="trader-detail__pos-entry">
        <span>${formatPrice(p.entry)}</span>
        <span className="trader-detail__pos-mark">→ ${formatPrice(p.mark)}</span>
      </span>

      <span className="trader-detail__pos-margin">${formatCompact(p.margin)}</span>

      <span className={cn("trader-detail__pos-pnl", isUp ? "is-up" : "is-dn")}>
        {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        <span>
          <span className="trader-detail__pos-pnl-usd">{(isUp ? "+" : "−") + "$" + formatCompact(Math.abs(p.pnl))}</span>
          <span className="trader-detail__pos-pnl-pct">{(isUp ? "+" : "") + p.pnlPct.toFixed(2)}%</span>
        </span>
      </span>
    </div>
  );
}

function Stat({ label, value, valueClass, barPct, barColor }: { label: string; value: string; valueClass?: string; barPct?: number; barColor?: "up" | "dn" }) {
  return (
    <div className="trader-detail__stat">
      <p className="trader-detail__stat-label">{label}</p>
      <p className={cn("trader-detail__stat-value", valueClass)}>{value}</p>
      {typeof barPct === "number" ? (
        <div className="trader-detail__stat-bar">
          <span className={cn("trader-detail__stat-bar-fill", "is-" + (barColor ?? "up"))} style={{ width: `${Math.min(100, Math.max(0, barPct))}%` }} />
        </div>
      ) : null}
    </div>
  );
}

function Avatar({ handle, size = 40 }: { handle: string; size?: number }) {
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
        fontSize: Math.floor(size * 0.36),
      }}
    >
      {handle.slice(0, 2).toUpperCase()}
    </span>
  );
}

// ─── helpers ───────────────────────────────────────────────────────
function buildSparkPath(points: number[]) {
  if (points.length === 0) return { line: "", area: "" };
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const w = 300;
  const h = 80;
  const step = w / (points.length - 1);
  let line = "";
  let area = "";
  points.forEach((p, i) => {
    const x = i * step;
    const y = h - ((p - min) / range) * h;
    line += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  });
  area = `${line} L ${w} ${h} L 0 ${h} Z`;
  return { line, area };
}

function formatCompact(n: number) {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return n.toFixed(0);
}

function formatPrice(p: number) {
  if (p >= 1000) return p.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (p >= 1) return p.toLocaleString(undefined, { maximumFractionDigits: 4 });
  if (p >= 0.01) return p.toFixed(4);
  return p.toFixed(6);
}
