"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowUpRight,
  BellRing,
  ChartCandlestick,
  ChevronRight,
  Crosshair,
  Radar,
  ShieldCheck,
  TrendingUp,
  Zap
} from "lucide-react";

import { AISignalCard } from "@/components/ai-signal-card";
import { AlertCard } from "@/components/alert-card";
import { DashboardWidget } from "@/components/dashboard-widget";
import { JournalSummaryCard, TradingJournalCard } from "@/components/trading-journal-card";
import { MarketScannerTable } from "@/components/market-scanner-table";
import { LiveTickerStrip } from "@/components/terminal/live-ticker-strip";
import { VolumeHeatmap } from "@/components/terminal/volume-heatmap";
import { CandlestickChart } from "@/components/vx/candlestick-chart";
import { AiReasoningPanel } from "@/components/terminal/ai-reasoning-panel";
import { MarketPulseBar } from "@/components/terminal/market-pulse-bar";
import { MtfAgreement } from "@/components/terminal/mtf-agreement";
import { ScannerPulse } from "@/components/terminal/scanner-pulse";
import { SignalFeed } from "@/components/terminal/signal-feed";
import { ScrollReveal } from "@/components/vx/scroll-reveal";
import { useMarketStream } from "@/hooks/use-market-stream";
import { apiFetch } from "@/lib/api";
import { mergeMarketRows } from "@/lib/asset-catalog";
import { fetchMarketOpportunities, mapOpportunityToAISignal, mapOpportunityToScanner } from "@/lib/market-opportunities";
import { scoreTicker } from "@/lib/market-signals";
import {
  journalStats,
  journalTrades,
  scannerOpportunities as fallbackScanner,
  smartAlerts,
  tradingStyles,
  type TradingStyle,
  type AISignal,
  type SignalStage
} from "@/lib/trading-os-data";
import type { MarketDecision } from "@/lib/market-signals";
import { formatCompactNumber, formatCurrency, cn } from "@/lib/utils";
import type { MarketTicker } from "@/types";

export default function TerminalPage() {
  const [style, setStyle] = useState<TradingStyle>("SMC Trader");
  const { data = [], isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch<MarketTicker[]>("/market/dashboard"),
    refetchInterval: 15000
  });

  const {
    data: opportunities = [],
    isLoading: opportunitiesLoading,
    isError: opportunitiesError
  } = useQuery({
    queryKey: ["market-opportunities", 12],
    queryFn: () => fetchMarketOpportunities(12),
    staleTime: 45_000,
    refetchInterval: 60_000
  });

  useMarketStream();

  const rows = useMemo(() => mergeMarketRows(data), [data]);
  const ranked = useMemo(
    () =>
      rows
        .map((row, index) => ({ row, score: scoreTicker(row, index, rows.length) }))
        .filter((item) => item.score.direction !== "wait")
        .sort((a, b) => b.score.confidence - a.score.confidence),
    [rows]
  );
  const topMovers = useMemo(() => [...rows].sort((a, b) => Math.abs(b.change_24h) - Math.abs(a.change_24h)).slice(0, 5), [rows]);
  const btc = rows.find((row) => row.symbol === "BTCUSDT");
  const scannerRows = useMemo(
    () => (opportunities.length ? opportunities.map(mapOpportunityToScanner) : fallbackScanner),
    [opportunities]
  );
  const heroSymbol = opportunities[0]?.symbol ?? ranked[0]?.row.symbol;
  const heroBias = opportunities[0] ? mapOpportunityToScanner(opportunities[0]).direction : ranked[0]?.score.decision ?? "—";
  const heroConfidence = opportunities[0]?.confidence ?? ranked[0]?.score.confidence;
  const heroRr = opportunities[0] ? `${opportunities[0].risk_reward}R` : ranked[0]?.score.riskReward ?? "—";
  const heroStructure = opportunities[0]?.structure ?? ranked[0]?.score.structure ?? "—";
  const displaySignals = useMemo(() => {
    if (opportunities.length) {
      return opportunities.slice(0, 3).map(mapOpportunityToAISignal);
    }
    return ranked.slice(0, 2).map(({ row, score }) => tickerToAISignal(row, score));
  }, [opportunities, ranked]);

  return (
    <div className="vx-terminal-shell vx-landing space-y-8 pb-10">
      <section className="vx-command-hero">
        <div className="relative grid gap-10 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
          <div>
            <p className="vx-eyebrow">Command center</p>
            <h1 className="vx-headline mt-5 text-white" style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}>
              Private trading OS.
            </h1>
            <p className="vx-subcopy mt-4 max-w-xl">
              Live structure scores, scanner tiers, and risk framing — wired to the same discipline as Telegram alerts.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/chart-analyzer" className="vx-btn-primary">
                Analyze chart <ChevronRight className="h-4 w-4" />
              </Link>
              <Link href="/ai" className="vx-btn-ghost">
                Vypexrock AI
              </Link>
            </div>
            <dl className="mt-8 grid grid-cols-3 gap-3">
              <StatTile label="Assets" value={`${rows.length}`} icon={<Activity className="h-4 w-4" />} />
              <StatTile label="BTC" value={btc ? formatPct(btc.change_24h) : "—"} icon={<TrendingUp className="h-4 w-4" />} />
              <StatTile label="Ranked" value={`${ranked.length}`} icon={<Radar className="h-4 w-4" />} />
            </dl>
          </div>

          <div className="vx-terminal-frame">
            <div className="vx-terminal-chrome">
              <span className="flex items-center gap-2">
                <span className="vx-live-dot" />
                Top setup
              </span>
              <span>{heroSymbol ?? "Scanning"}</span>
            </div>
            <div className="p-4">
              {heroSymbol ? (
                <CandlestickChart
                  symbol={heroSymbol}
                  interval="15m"
                  height={200}
                  showLevels
                  entry={opportunities[0]?.entry_high ?? ranked[0]?.score.entryHigh}
                  stop={opportunities[0]?.stop_loss ?? ranked[0]?.score.stopLoss}
                  tp={opportunities[0]?.take_profit_2 ?? ranked[0]?.score.takeProfit2 ?? undefined}
                />
              ) : (
                <div className="vx-skeleton h-[200px] w-full rounded-xl" />
              )}
              {heroSymbol ? (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatTile label="Bias" value={heroBias} />
                  <StatTile label="Confidence" value={heroConfidence ? `${heroConfidence}%` : "—"} />
                  <StatTile label="R:R" value={heroRr} />
                  <StatTile label="Structure" value={heroStructure} />
                </div>
              ) : (
                <div className="mt-4 vx-skeleton h-16 w-full" />
              )}
            </div>
          </div>
        </div>
      </section>

      {isError ? (
        <p className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          Live API unavailable — structure scores use fallback market data.
        </p>
      ) : null}

      <LiveTickerStrip rows={rows} />

      <MarketPulseBar />

      <ScannerPulse active={scannerRows.filter((o) => o.tier !== "No Trade").length} scanning={opportunitiesLoading} />

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <DashboardWidget
          title="Ranked setups"
          value={opportunitiesLoading ? "Scanning…" : `${scannerRows.filter((o) => o.tier !== "No Trade").length} live`}
          description={opportunitiesError ? "API fallback to cached scanner." : "Live 15m structure from /market/opportunities."}
          icon={ChartCandlestick}
          accent="cyan"
        />
        <DashboardWidget
          title="Scanner"
          value={`${scannerRows.filter((o) => o.tier !== "No Trade").length} tiers`}
          description="S/A/B opportunities ranked by confidence."
          icon={Radar}
          accent="violet"
        />
        <DashboardWidget title="Risk mode" value="Defined SL" description="Invalidation required before any signal surfaces." icon={ShieldCheck} accent="emerald" />
        <DashboardWidget title="Alerts" value={`${smartAlerts.length} active`} description="TP/SL and invalidation lifecycle." icon={BellRing} accent="rose" />
      </section>

      <ScrollReveal className="grid gap-6 2xl:grid-cols-[1.35fr_0.65fr]">
        <MarketScannerTable opportunities={scannerRows} loading={opportunitiesLoading} />
        <div className="space-y-5">
          <SignalFeed opportunities={opportunities} />
          <MtfAgreement top={opportunities[0]} />
          <AiReasoningPanel setup={opportunities[0]} />
          <VolumeHeatmap rows={rows} />
          <section className="vx-glass-panel p-5">
            <p className="text-xs uppercase tracking-widest text-white/40">Trading style</p>
            <h2 className="mt-2 text-xl font-semibold text-white">AI memory</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {tradingStyles.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setStyle(item.label)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-xs font-semibold transition",
                    style === item.label ? "bg-teal-300 text-zinc-950" : "bg-white/[0.05] text-white/55 hover:bg-white/[0.08]"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/55">
              {tradingStyles.find((item) => item.label === style)?.description}
            </p>
          </section>

          <section className="vx-glass-panel p-5">
            <h2 className="text-lg font-semibold text-white">Top movers</h2>
            <ul className="mt-4 space-y-2">
              {topMovers.map((row) => (
                <li key={row.symbol}>
                  <Link href={`/coin/${row.symbol}`} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-white/[0.04]">
                    <span className="font-medium">{row.symbol}</span>
                    <span className="text-white/50">{formatCurrency(row.price)}</span>
                    <span className={row.change_24h >= 0 ? "text-emerald-400" : "text-rose-400"}>{formatPct(row.change_24h)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </ScrollReveal>

      <section className="grid gap-6 2xl:grid-cols-[0.42fr_0.58fr]">
        <div className="space-y-5">
          <JournalSummaryCard {...journalStats} />
          {smartAlerts.slice(0, 2).map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
        <div className="space-y-5">
          {displaySignals.map((signal) => (
            <AISignalCard key={`${signal.asset}-${signal.direction}`} signal={signal} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <TrustCard icon={<Crosshair className="h-5 w-5" />} title="Confidence engine" text="Structure, volume, liquidity, and invalidation — scored separately." />
        <TrustCard icon={<ArrowUpRight className="h-5 w-5" />} title="No guaranteed calls" text="Probability language only. Wait beats forcing low-quality setups." />
        <TrustCard icon={<Zap className="h-5 w-5" />} title="Lifecycle alerts" text="TP1, TP2, stop loss, and pre-entry invalidation tracked in Telegram." />
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {journalTrades.map((trade) => (
          <TradingJournalCard key={trade.id} trade={trade} />
        ))}
      </section>
    </div>
  );
}

function StatTile({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="vx-stat-tile">
      <p className="flex items-center gap-2">
        {icon}
        {label}
      </p>
      <strong>{value}</strong>
    </div>
  );
}

function TrustCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <article className="vx-bento-item">
      <div className="text-teal-300/80">{icon}</div>
      <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/52">{text}</p>
    </article>
  );
}

function tickerToAISignal(row: MarketTicker, score: ReturnType<typeof scoreTicker>): AISignal {
  const long = score.direction === "long";
  return {
    asset: row.symbol,
    direction: long ? "Long" : "Short",
    type: decisionToStage(score.decision),
    timeframe: "15m / 1H / 4H",
    confidence: score.confidence,
    entryZone: `${formatCurrency(score.entryLow)} – ${formatCurrency(score.entryHigh)}`,
    confirmedEntry: formatCurrency(row.price),
    stopLoss: score.stopLoss ? formatCurrency(score.stopLoss) : "—",
    tp1: score.takeProfit1 ? formatCurrency(score.takeProfit1) : "—",
    tp2: score.takeProfit2 ? formatCurrency(score.takeProfit2) : "—",
    tp3: score.takeProfit3 ? formatCurrency(score.takeProfit3) : "—",
    riskReward: score.riskReward,
    riskLevel: score.confidence >= 78 ? "Low" : score.confidence >= 65 ? "Medium" : "High",
    reason: score.reason,
    invalidation: formatCurrency(score.invalidation),
    marketStructure: score.structure.replace("-", " "),
    volumeConfirmation: score.shortText,
    aiNotes: `Live score ${score.score.toFixed(0)} · ${score.decision}`
  };
}

function formatPct(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function decisionToStage(decision: MarketDecision): SignalStage {
  if (decision.includes("Strong")) return "Strong";
  if (decision.includes("Watch")) return "Watchlist";
  if (decision === "Wait") return "Early";
  return "Valid";
}


