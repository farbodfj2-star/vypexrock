"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowRight, Bot, CandlestickChart, Radar, ShieldCheck, ShieldPlus, Sparkles } from "lucide-react";

import CoinTable from "@/components/coin-table";
import { DataStatus } from "@/components/data-status";
import { PerformanceSummaryCard } from "@/components/performance-summary";
import { SignalHistory } from "@/components/signal-history";
import { TopOpportunityCard } from "@/components/top-opportunity-card";
import { pricingPlans } from "@/lib/mock-pricing";
import { dashboardFallbackRows, productSteps } from "@/lib/mock-data";
import { mergeMarketRows } from "@/lib/asset-catalog";
import { buildLiveOpportunity } from "@/lib/mock-opportunities";
import { performanceSummary, signalHistoryRows } from "@/lib/mock-signals";
import { useMarketStream } from "@/hooks/use-market-stream";
import { apiFetch } from "@/lib/api";
import { formatCompactNumber } from "@/lib/utils";
import type { MarketTicker } from "@/types";

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch<MarketTicker[]>("/market/dashboard"),
    refetchInterval: 1000
  });

  useMarketStream();

  const rows = mergeMarketRows(data?.length ? data : dashboardFallbackRows);
  const topOpportunity = buildLiveOpportunity(rows);
  const totalVolume = rows.reduce((sum, row) => sum + row.volume_24h, 0);
  const advancers = rows.filter((row) => row.change_24h >= 0).length;

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2.25rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(245,200,74,0.12),_transparent_22%),radial-gradient(circle_at_top_left,_rgba(79,70,229,0.28),_transparent_28%),radial-gradient(circle_at_85%_10%,_rgba(34,211,238,0.22),_transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-7 shadow-[0_28px_100px_rgba(0,0,0,0.42)] lg:p-10">
        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
              <Sparkles className="h-4 w-4" />
              Private luxury crypto AI workspace
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight text-white lg:text-6xl">
              Vypexrock gives your charts the feel of a premium members-only research terminal.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/68 lg:text-lg">
              Luxury dark UX, broader market coverage, live market scanning, strategy-aware AI briefings, and execution-focused signal cards built to feel like a popular paid platform.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/coin/BTCUSDT"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_45px_rgba(108,92,255,0.35)]"
              >
                Open AI Analysis
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/watchlist"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/78 transition hover:border-white/20 hover:bg-white/[0.08]"
              >
                Build your workspace
              </Link>
              <Link
                href="/about-crypto"
                className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-5 py-3 text-sm font-medium text-amber-100 transition hover:border-amber-300/35 hover:bg-amber-300/15"
              >
                About Crypto academy
              </Link>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <Stat label="Tracked pairs" value={String(rows.length)} icon={CandlestickChart} />
              <Stat label="24h total volume" value={formatCompactNumber(totalVolume)} icon={Radar} />
              <Stat label="Coins green today" value={String(advancers)} icon={ShieldCheck} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
            {productSteps.map((item) => (
              <div key={item.step} className="rounded-[1.7rem] border border-white/10 bg-black/20 p-5 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-white/35">{item.step}</p>
                <h2 className="mt-3 text-xl font-semibold text-white">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-white/58">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="flex items-center gap-2 text-white">
            <Bot className="h-4 w-4 text-violet-300" />
            <h2 className="text-xl font-semibold">How Vypexrock works</h2>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {productSteps.map((item) => (
              <div key={item.title} className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/35">{item.step}</p>
                <h3 className="mt-3 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/56">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/40">Workspace value</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Premium product cues across the flow</h2>
            </div>
            <div className="rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-100">
              SaaS polish
            </div>
          </div>
          <div className="mt-5 space-y-3 text-sm leading-7 text-white/60">
            <p>Large chart-first layouts, AI strategy controls, and decision panels are framed to feel like a real paid product rather than a generic starter dashboard.</p>
            <p>Where data is incomplete, Vypexrock uses realistic premium placeholders so the product still feels fully working and presentation-ready.</p>
          </div>
        </div>
      </section>

      <TopOpportunityCard setup={topOpportunity} />

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <PerformanceSummaryCard summary={performanceSummary} />

        <div className="space-y-6">
          <DataStatus />

          <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(245,200,74,0.12),_transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/40">Trust framework</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Probability-based, risk-managed research</h2>
              </div>
              <div className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-medium text-amber-100">
                Transparent analysis
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm leading-7 text-white/62">
              <p>Every Vypexrock setup is framed around confidence estimates, invalidation levels, stop loss discipline, and historical context rather than guaranteed outcomes.</p>
              <p>Signals, backtests, AI answers, and community sentiment are presented as decision support. They are designed to help you structure risk, not replace judgment.</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {["AI-ranked setup", "Historical performance", "Invalidation-aware", "Stop-loss first"].map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/65">
                  {item}
                </span>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section>
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <p className="text-xs uppercase tracking-[0.24em] text-white/40">Community Insights</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">See how public-style analysts are framing the market</h2>
          <p className="mt-3 text-sm leading-7 text-white/60">
            Browse premium community idea cards with symbol, bias, timeframe, targets, confidence, and reasoning so the platform feels broader than a private dashboard.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <PreviewMetric label="Ideas live" value="6+" />
            <PreviewMetric label="Filters" value="Symbol / bias / timeframe" />
            <PreviewMetric label="Sort modes" value="Recent / confidence / popularity" />
          </div>
          <Link
            href="/community"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/78 transition hover:border-white/20 hover:bg-white/[0.08]"
          >
            Open Community
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
      <section>
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <p className="text-xs uppercase tracking-[0.24em] text-white/40">Vypexrock AI</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Chat-first crypto intelligence inside the product</h2>
          <p className="mt-3 text-sm leading-7 text-white/60">
            Ask Vypexrock AI about crypto basics, indicators, long vs short, risk management, best opportunity framing, or chart workflow. The assistant is now tuned for quick answers, detailed reasoning, risk-first guidance, and beginner-friendly explanations.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {["What is the best setup right now?", "Explain BTC on 4H", "Why is this trade risky?", "How do I size my position?"].map((chip) => (
              <span key={chip} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/65">
                {chip}
              </span>
            ))}
          </div>
          <Link
            href="/ai"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-slate-950"
          >
            Open Vypexrock AI
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <SignalHistory rows={signalHistoryRows} />

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/40">Monetization ready</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Build toward a paid research business</h2>
            </div>
            <div className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-100">
              {pricingPlans[1]?.name} plan lead
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div key={plan.name} className="rounded-[1.35rem] border border-white/10 bg-[#0d1224] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/38">{plan.name}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{plan.price}</p>
                <p className="mt-3 text-sm leading-6 text-white/58">{plan.description}</p>
              </div>
            ))}
          </div>
          <Link
            href="/pricing"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/78 transition hover:border-white/20 hover:bg-white/[0.08]"
          >
            View pricing and premium features
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="flex items-center gap-2 text-white">
            <ShieldPlus className="h-4 w-4 text-cyan-300" />
            <h2 className="text-2xl font-semibold">Professional risk disclosure</h2>
          </div>
          <div className="mt-5 space-y-4 text-sm leading-7 text-white/60">
            <p>Not financial advice. Vypexrock provides AI-assisted market research, scenario analysis, and signal framing for educational and planning purposes.</p>
            <p>Historical performance, win rate, and backtesting metrics describe prior simulated or tracked outcomes. They do not guarantee future results.</p>
            <p>Crypto markets can move quickly. Use stop loss discipline, position sizing, and invalidation logic before taking any trade.</p>
          </div>
          <Link
            href="/backtest"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-slate-950"
          >
            Open Backtest Lab
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </section>

      {isLoading ? <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-white/65">Loading live market intelligence...</div> : null}
      {error ? (
        <div className="rounded-[2rem] border border-rose-500/30 bg-rose-500/10 p-8 text-rose-200">
          {error instanceof Error ? `${error.message}. Showing curated fallback data.` : "Failed to load market data. Showing curated fallback data."}
        </div>
      ) : null}
      <CoinTable rows={rows} />
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: string;
  icon: typeof CandlestickChart;
}) {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-cyan-200">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.2em] text-white/40">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white/10 bg-black/15 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-white/38">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}
