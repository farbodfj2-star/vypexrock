"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { TradingChart } from "@/components/vx/trading-chart";
import { useMouseGlow } from "@/hooks/use-mouse-glow";
import { formatCompactNumber, formatCurrency } from "@/lib/utils";
import type { MarketSignalScore } from "@/lib/market-signals";
import type { MarketTicker } from "@/types";
import { cn } from "@/lib/utils";

type LandingHeroProps = {
  rows: MarketTicker[];
  topSignal?: MarketSignalScore & { symbol: string; price: number };
  totalVolume: number;
  advancing: number;
};

export function LandingHero({ rows, topSignal, totalVolume, advancing }: LandingHeroProps) {
  const glowRef = useMouseGlow<HTMLDivElement>();
  const featured = rows[0];

  return (
    <section ref={glowRef} className="vx-hero relative px-6 py-10 sm:px-10 sm:py-14 lg:px-14">
      <div className="vx-mouse-glow" aria-hidden />
      <div className="vx-hero-grid" aria-hidden />

      <div className="relative z-10 grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
        <div>
          <p className="vx-eyebrow">Institutional-grade crypto intelligence</p>
          <h1 className="vx-headline mt-6 text-white">
            Trade with clarity.
            <br />
            <span className="text-white/55">Not noise.</span>
          </h1>
          <p className="vx-subcopy mt-6">
            Vypexrock fuses multi-timeframe structure, live market data, and disciplined risk framing into one terminal built for serious operators.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/terminal" className="vx-btn-primary">
              Open terminal
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/chart-analyzer" className="vx-btn-ghost">
              Analyze a chart
            </Link>
          </div>

          <dl className="mt-12 grid grid-cols-3 gap-4 border-t border-white/[0.06] pt-8">
            <Stat label="Universe" value={String(rows.length)} />
            <Stat label="24h volume" value={formatCompactNumber(totalVolume)} />
            <Stat label="Breadth" value={`${advancing}/${rows.length || 1}`} />
          </dl>
        </div>

        <div className="vx-terminal-frame">
          <div className="vx-terminal-chrome">
            <span className="flex items-center gap-2">
              <span className="vx-live-dot" />
              Live market desk
            </span>
            <span>{featured?.symbol ?? "BTCUSDT"} · 15m structure</span>
          </div>
          <div className="p-4 sm:p-5">
            <TradingChart rows={rows} symbol={featured?.symbol} height={240} className="bg-black/30" />
            {topSignal ? (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniStat label="Bias" value={topSignal.decision} accent={topSignal.badgeTone} />
                <MiniStat label="Confidence" value={`${topSignal.confidence}%`} />
                <MiniStat label="R:R" value={topSignal.riskReward} />
                <MiniStat label="Price" value={formatCurrency(topSignal.price)} />
              </div>
            ) : null}
            <div className="mt-4 max-h-[180px] space-y-1 overflow-y-auto">
              {rows.slice(0, 5).map((row) => (
                <Link
                  key={row.symbol}
                  href={`/coin/${row.symbol}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition hover:bg-white/[0.04]"
                >
                  <span className="font-medium text-white/90">{row.symbol}</span>
                  <span className="text-white/50">{formatCurrency(row.price)}</span>
                  <span className={cn("tabular-nums", row.change_24h >= 0 ? "text-emerald-400" : "text-rose-400")}>
                    {row.change_24h >= 0 ? "+" : ""}
                    {row.change_24h.toFixed(2)}%
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.2em] text-white/40">{label}</dt>
      <dd className="mt-1 text-xl font-semibold tracking-tight text-white">{value}</dd>
    </div>
  );
}

function MiniStat({
  label,
  value,
  accent
}: {
  label: string;
  value: string;
  accent?: "emerald" | "cyan" | "amber" | "rose" | "slate";
}) {
  const tone =
    accent === "emerald"
      ? "text-emerald-300"
      : accent === "rose"
        ? "text-rose-300"
        : accent === "amber"
          ? "text-amber-200"
          : "text-white";
  return (
    <div className="vx-stat-tile">
      <p>{label}</p>
      <strong className={tone}>{value}</strong>
    </div>
  );
}
