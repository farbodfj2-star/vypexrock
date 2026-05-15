"use client";

import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BrainCircuit,
  ChevronDown,
  Layers3,
  LineChart,
  Radio,
  ScanLine,
  ShieldCheck,
  Target,
  Waves
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import CoinTable from "@/components/coin-table";
import { LandingHero } from "@/components/vx/landing-hero";
import { ScrollReveal } from "@/components/vx/scroll-reveal";
import { TradingChart } from "@/components/vx/trading-chart";
import { useMarketStream } from "@/hooks/use-market-stream";
import { apiFetch } from "@/lib/api";
import { mergeMarketRows } from "@/lib/asset-catalog";
import { scoreTicker, type MarketSignalScore } from "@/lib/market-signals";
import { dashboardFallbackRows } from "@/lib/mock-data";
import { pricingPlans } from "@/lib/mock-pricing";
import { cn, formatCurrency } from "@/lib/utils";
import type { MarketTicker } from "@/types";

const capabilities: { title: string; text: string; icon: LucideIcon; span?: string }[] = [
  {
    title: "Multi-timeframe scanner",
    text: "15m entry, 1H confirmation, 4H trend filter — the same hierarchy used by the Telegram signal engine.",
    icon: ScanLine,
    span: "lg:col-span-2"
  },
  {
    title: "Confidence, not hype",
    text: "Every setup exposes invalidation, R:R, and structure quality before you commit capital.",
    icon: Target
  },
  {
    title: "Chart intelligence",
    text: "Upload any chart. Ask about liquidity, fake breakouts, and entry timing in plain language.",
    icon: LineChart,
    span: "lg:row-span-2"
  },
  {
    title: "Live market desk",
    text: "Binance-backed prices with WebSocket refresh — no decorative tickers pretending to be live.",
    icon: Radio
  },
  {
    title: "Risk-first execution",
    text: "Entry zones, stop loss, and staged take-profits are first-class — not buried in footnotes.",
    icon: ShieldCheck
  },
  {
    title: "Signal lifecycle",
    text: "TP1, TP2, stop loss, and invalidation updates pushed to Telegram when structure breaks.",
    icon: BarChart3,
    span: "lg:col-span-2"
  }
];

const workflow = [
  { step: "01", title: "Scan", text: "Rank the universe by structure, volume, and momentum." },
  { step: "02", title: "Confirm", text: "Wait for multi-timeframe alignment before sizing." },
  { step: "03", title: "Frame risk", text: "Define entry, invalidation, and targets before click." },
  { step: "04", title: "Track", text: "Journal outcomes and let the engine learn your discipline." }
];

const faqs = [
  {
    q: "Is this financial advice?",
    a: "No. Vypexrock is research infrastructure. Signals are probability-based; you own execution and risk."
  },
  {
    q: "How are signals generated?",
    a: "Technical structure (EMA, RSI, MACD, ATR), volume context, and multi-timeframe gates — same pipeline as Telegram alerts."
  },
  {
    q: "Can I use it on mobile?",
    a: "Yes. The terminal and landing are responsive with touch-first navigation."
  }
];

export default function HomePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch<MarketTicker[]>("/market/dashboard"),
    refetchInterval: 8000
  });

  useMarketStream();

  const rows = mergeMarketRows(data?.length ? data : dashboardFallbackRows);
  const scored = useMemo(() => rankSignals(rows), [rows]);
  const topSignal = scored[0];
  const totalVolume = rows.reduce((sum, row) => sum + row.volume_24h, 0);
  const advancing = rows.filter((row) => row.change_24h >= 0).length;

  return (
    <div className="vx-landing mx-auto max-w-[1440px] space-y-20 pb-16 pt-2 sm:space-y-28">
      <LandingHero rows={rows} topSignal={topSignal} totalVolume={totalVolume} advancing={advancing} />

      <div className="vx-strip">
        <div className="vx-strip-track">
          {[...stripItems, ...stripItems].map((item, i) => (
            <span key={`${item}-${i}`}>{item}</span>
          ))}
        </div>
      </div>

      <ScrollReveal className="px-4 sm:px-6">
        <SectionHeader
          kicker="Platform"
          title="Built for operators who read charts — not templates."
          description="Asymmetric layouts, live data, and honest risk language. Nothing here pretends to be a guaranteed win."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className={cn("vx-bento-item", item.span)}>
                <Icon className="h-5 w-5 text-teal-300/90" strokeWidth={1.5} />
                <h3 className="mt-5 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/52">{item.text}</p>
              </article>
            );
          })}
        </div>
      </ScrollReveal>

      <ScrollReveal className="px-4 sm:px-6" delay={1}>
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <SectionHeader
              kicker="Signal desk"
              title="Ranked opportunities from live market structure."
              description="Scores derive from momentum, volume rank, and volatility — not random confidence percentages."
            />
            <div className="mt-8 space-y-2">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="vx-skeleton h-14 w-full" />)
                : scored.slice(0, 6).map((signal) => (
                    <SignalStrip key={signal.symbol} signal={signal} />
                  ))}
            </div>
            {isError ? (
              <p className="mt-4 text-sm text-amber-200/80">Live API unavailable — showing cached market structure.</p>
            ) : null}
          </div>
          <div className="vx-glass-panel p-5">
            <TradingChart rows={rows} symbol={topSignal?.symbol} height={280} />
            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/[0.06] pt-5">
              <Pillar icon={Layers3} label="Structure" value="4H trend" />
              <Pillar icon={Waves} label="Momentum" value="1H confirm" />
              <Pillar icon={BrainCircuit} label="AI layer" value="Explainable" />
            </div>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal className="px-4 sm:px-6" delay={2}>
        <SectionHeader kicker="Workflow" title="From scan to journal in four deliberate steps." />
        <ol className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {workflow.map((item) => (
            <li key={item.step} className="vx-bento-item border-l-2 border-l-teal-400/40">
              <span className="font-mono text-xs text-teal-300/80">{item.step}</span>
              <h3 className="mt-3 text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-white/50">{item.text}</p>
            </li>
          ))}
        </ol>
      </ScrollReveal>

      <ScrollReveal className="px-4 sm:px-6">
        <SectionHeader kicker="Pricing" title="Transparent tiers. No fake urgency." />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {pricingPlans.map((plan, index) => (
            <article
              key={plan.name}
              className={cn(
                "vx-bento-item flex flex-col",
                index === 1 && "ring-1 ring-teal-400/25"
              )}
            >
              <p className="text-xs uppercase tracking-widest text-white/40">{plan.name}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{plan.price}</p>
              <p className="mt-2 text-sm text-white/50">{plan.description}</p>
              <ul className="mt-6 flex-1 space-y-2 text-sm text-white/65">
                {plan.features.slice(0, 4).map((f) => (
                  <li key={f} className="flex gap-2">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/pricing" className={cn("mt-8", index === 1 ? "vx-btn-primary justify-center" : "vx-btn-ghost justify-center")}>
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>
      </ScrollReveal>

      <ScrollReveal className="px-4 sm:px-6">
        <SectionHeader kicker="FAQ" title="Straight answers." />
        <div className="mt-8 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.07]">
          {faqs.map((faq) => (
            <details key={faq.q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-white">
                {faq.q}
                <ChevronDown className="h-4 w-4 text-white/40 transition group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-white/55">{faq.a}</p>
            </details>
          ))}
        </div>
      </ScrollReveal>

      <section className="px-4 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-teal-300/70">Markets</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Live board</h2>
          </div>
          <Link href="/terminal" className="vx-btn-ghost text-sm">
            Enter terminal <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <CoinTable rows={rows} />
      </section>

      <footer className="border-t border-white/[0.06] px-6 py-12 text-center sm:text-left">
        <p className="text-xs uppercase tracking-[0.3em] text-white/35">Vypexrock</p>
        <p className="mt-3 max-w-md text-sm text-white/45">
          Probability-based market intelligence. Not financial advice. Trade with discipline.
        </p>
      </footer>
    </div>
  );
}

const stripItems = [
  "Multi-timeframe",
  "Risk-first",
  "Live Binance data",
  "Telegram lifecycle",
  "Chart AI",
  "Trading journal"
];

function rankSignals(rows: MarketTicker[]) {
  return rows
    .map((row, index) => {
      const score = scoreTicker(row, index, rows.length);
      return { ...score, symbol: row.symbol, price: row.price };
    })
    .filter((s) => s.direction !== "wait")
    .sort((a, b) => b.confidence - a.confidence);
}

function SectionHeader({
  kicker,
  title,
  description
}: {
  kicker: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="max-w-2xl">
      <p className="text-xs font-medium uppercase tracking-[0.24em] text-teal-300/75">{kicker}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h2>
      {description ? <p className="mt-4 text-base leading-relaxed text-white/52">{description}</p> : null}
    </header>
  );
}

function SignalStrip({ signal }: { signal: MarketSignalScore & { symbol: string; price: number } }) {
  const long = signal.direction === "long";
  return (
    <Link href={`/coin/${signal.symbol}`} className="vx-signal-row">
      <div className="min-w-0">
        <p className="font-medium text-white">{signal.symbol}</p>
        <p className="truncate text-xs text-white/45">{signal.shortText}</p>
      </div>
      <span className={cn("text-xs font-semibold uppercase tracking-wider", long ? "text-emerald-400" : "text-rose-400")}>
        {signal.decision}
      </span>
      <span className="tabular-nums text-sm text-white/70">{signal.confidence}%</span>
    </Link>
  );
}

function Pillar({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div>
      <Icon className="h-4 w-4 text-white/40" />
      <p className="mt-2 text-[10px] uppercase tracking-widest text-white/38">{label}</p>
      <p className="text-sm font-medium text-white">{value}</p>
    </div>
  );
}
