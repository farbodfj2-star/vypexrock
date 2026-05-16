"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import CoinTable from "@/components/coin-table";
import { ScrollCandlestickHero } from "@/components/vx/scroll-candlestick-hero";
import {
  AISeesStructure,
  LiveMarketScanner,
  ChartAnalysisSection,
  TelegramSignalLifecycle,
  MultiTimeframeConfirmation,
  InstitutionalRiskEngine
} from "@/components/vx/cinematic-sections";
import { ScrollReveal } from "@/components/vx/scroll-reveal";
import { useMarketStream } from "@/hooks/use-market-stream";
import { apiFetch } from "@/lib/api";
import { mergeMarketRows } from "@/lib/asset-catalog";
import { scoreTicker, type MarketSignalScore } from "@/lib/market-signals";
import { dashboardFallbackRows } from "@/lib/mock-data";
import { pricingPlans } from "@/lib/mock-pricing";
import { cn } from "@/lib/utils";
import type { MarketTicker } from "@/types";

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
  const { data } = useQuery({
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
    <div className="cinematic-landing space-y-0 pb-16">
      <ScrollCandlestickHero rows={rows} topSignal={topSignal} totalVolume={totalVolume} advancing={advancing} />

      <div className="cinema-strip">
        <div className="cinema-strip-track">
          {[...stripItems, ...stripItems].map((item, i) => (
            <span key={`${item}-${i}`}>{item}</span>
          ))}
        </div>
      </div>

      <AISeesStructure />
      <LiveMarketScanner />
      <ChartAnalysisSection />
      <TelegramSignalLifecycle />
      <MultiTimeframeConfirmation />
      <InstitutionalRiskEngine />

      <ScrollReveal className="px-4 sm:px-6">
        <SectionHeader kicker="Pricing" title="Transparent tiers. No fake urgency." />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {pricingPlans.map((plan, index) => (
            <article
              key={plan.name}
              className={cn(
                "cinema-price-card flex flex-col",
                index === 1 && "cinema-price-featured"
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
              <Link href="/pricing" className={cn("mt-8", index === 1 ? "cinema-primary-cta" : "cinema-secondary-cta")}>
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>
      </ScrollReveal>

      <ScrollReveal className="px-4 sm:px-6">
        <SectionHeader kicker="FAQ" title="Straight answers." />
        <div className="cinema-faq-grid mt-8">
          {faqs.map((faq) => (
            <details key={faq.q} className="cinema-faq-card group">
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
          <Link href="/terminal" className="cinema-secondary-cta text-sm">
            Enter terminal <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <CoinTable rows={rows} />
      </section>

      <footer className="cinema-footer mx-6 sm:mx-10 lg:mx-14">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/35">Vypexrock</p>
          <p className="mt-3 max-w-md text-sm text-white/45">
            Probability-based market intelligence. Not financial advice. Trade with discipline.
          </p>
        </div>
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
