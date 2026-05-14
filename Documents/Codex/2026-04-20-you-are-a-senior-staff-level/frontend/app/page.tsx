"use client";

import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  BrainCircuit,
  CandlestickChart,
  ChevronDown,
  Cpu,
  Eye,
  Gauge,
  Globe2,
  Layers3,
  LockKeyhole,
  Orbit,
  RadioTower,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Target,
  Waves,
} from "lucide-react";
import Link from "next/link";

import CoinTable from "@/components/coin-table";
import { useMarketStream } from "@/hooks/use-market-stream";
import { apiFetch } from "@/lib/api";
import { mergeMarketRows } from "@/lib/asset-catalog";
import { dashboardFallbackRows } from "@/lib/mock-data";
import { pricingPlans } from "@/lib/mock-pricing";
import { cn, formatCompactNumber, formatCurrency } from "@/lib/utils";
import type { MarketTicker } from "@/types";

const institutionalFeatures = [
  {
    title: "Adaptive market scanner",
    text: "Vypexrock watches trend, momentum, volatility, and live asset behavior so the interface feels like an intelligent research layer.",
    icon: ScanLine,
    tone: "cyan"
  },
  {
    title: "Signal confidence engine",
    text: "Every idea is framed through confidence, invalidation, risk-reward, and setup quality instead of hype or guaranteed outcomes.",
    icon: Gauge,
    tone: "violet"
  },
  {
    title: "Execution-first risk system",
    text: "Entry zones, stop loss, take-profit levels, and position context are built into the product experience before any decision.",
    icon: ShieldCheck,
    tone: "emerald"
  },
  {
    title: "AI chart intelligence",
    text: "Chart Analyzer turns strategy context, uploaded charts, and timeframe selection into structured AI trade briefings.",
    icon: CandlestickChart,
    tone: "fuchsia"
  },
  {
    title: "Community signal layer",
    text: "Community-style ideas, sentiment, and trader context help the platform feel alive beyond one private dashboard.",
    icon: Globe2,
    tone: "blue"
  },
  {
    title: "Automation infrastructure",
    text: "Telegram reporting and server-side scans are designed to run 24/7 from hosted backend services, not the browser.",
    icon: RadioTower,
    tone: "amber"
  }
];

const intelligencePillars = [
  { label: "Market structure", value: "4H trend map", icon: Layers3 },
  { label: "Momentum", value: "1H confirmation", icon: Waves },
  { label: "Risk model", value: "R:R first", icon: Target },
  { label: "AI reasoning", value: "Human-readable", icon: BrainCircuit }
];

const testimonials = [
  {
    quote: "It feels less like a signal bot and more like an AI research desk built for decision discipline.",
    name: "Private futures trader",
    role: "Multi-timeframe execution"
  },
  {
    quote: "The luxury is not just visual. The product keeps forcing the right question: where is the invalidation?",
    name: "Risk manager",
    role: "Crypto portfolio workflow"
  },
  {
    quote: "This is the first crypto UI I have seen that feels like AI infrastructure instead of another retail dashboard.",
    name: "AI product lead",
    role: "Market intelligence systems"
  }
];

const faqs = [
  {
    question: "Is Vypexrock a trading bot?",
    answer: "No. Vypexrock is an AI analysis, signal, alert, and research platform. It supports decisions, but it does not guarantee outcomes or auto-trade."
  },
  {
    question: "Does the AI give guaranteed trades?",
    answer: "Never. Signals are probability-based and include risk notes, invalidation, stop loss, and confidence context."
  },
  {
    question: "Can I use it on mobile?",
    answer: "Yes. The product is responsive, with mobile navigation and layouts designed for phone access."
  },
  {
    question: "What data does it use?",
    answer: "The app is structured around live market data, Binance-style prices, technical analysis, AI responses, and premium mocked intelligence where deeper integrations are still being connected."
  }
];

export default function HomePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch<MarketTicker[]>("/market/dashboard"),
    refetchInterval: 1000
  });

  useMarketStream();

  const rows = mergeMarketRows(data?.length ? data : dashboardFallbackRows);
  const totalVolume = rows.reduce((sum, row) => sum + row.volume_24h, 0);
  const advancing = rows.filter((row) => row.change_24h >= 0).length;
  const topRows = rows.slice(0, 8);
  const signalRows = rows.slice(0, 5).map((row, index) => buildLandingSignal(row, index));
  const strongest = signalRows[0];

  return (
    <div className="cinematic-landing min-h-screen overflow-hidden pb-10">
      <section className="cinema-hero relative min-h-[calc(100vh-7rem)] overflow-hidden rounded-[3rem] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
        <HeroAtmosphere />

        <div className="relative z-10 grid min-h-[calc(100vh-11rem)] items-center gap-10 xl:grid-cols-[minmax(0,0.92fr)_minmax(440px,0.78fr)] 2xl:grid-cols-[minmax(0,0.95fr)_minmax(580px,1.05fr)]">
          <div className="max-w-6xl">
            <div className="cinema-eyebrow">
              <Sparkles className="h-4 w-4" />
              Private AI crypto infrastructure
            </div>

            <h1 className="mt-8 max-w-6xl text-balance text-[clamp(3.4rem,6.8vw,8.9rem)] font-semibold leading-[0.86] tracking-[-0.085em] text-white">
              The AI terminal built for elite crypto execution.
            </h1>

            <p className="mt-8 max-w-3xl text-pretty text-lg leading-8 text-white/64 lg:text-xl">
              Vypexrock is a private market intelligence system where live crypto data, adaptive AI reasoning, signal quality, and risk-managed execution context converge in one cinematic workspace.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/register" className="cinema-primary-cta group">
                Start trading intelligence
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
              <Link href="/login" className="cinema-secondary-cta">
                Enter platform
              </Link>
              <Link href="/chart-analyzer" className="cinema-secondary-cta border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                View analyzer
              </Link>
            </div>

            <div className="mt-12 grid gap-3 sm:grid-cols-3">
              <HeroMetric label="Tracked assets" value={String(rows.length)} note="Live watch universe" />
              <HeroMetric label="24H volume" value={formatCompactNumber(totalVolume)} note="Market activity" />
              <HeroMetric label="Breadth" value={`${advancing}/${rows.length}`} note="Assets green today" />
            </div>
          </div>

          <CinematicTerminal rows={topRows} strongest={strongest} />
        </div>
      </section>

      <section className="cinema-strip">
        <div className="cinema-strip-track">
          {["Adaptive AI", "Live market pulse", "4H structure", "1H confirmation", "Risk-first execution", "Telegram automation", "Chart intelligence", "Signal tracking"].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="cinema-metrics-grid">
        <MetricCard label="Live source" value="Binance-ready" icon={RadioTower} />
        <MetricCard label="AI response" value="Live provider" icon={Bot} />
        <MetricCard label="Risk logic" value="Invalidation first" icon={ShieldCheck} />
        <MetricCard label="Workspace" value="Members-only" icon={LockKeyhole} />
      </section>

      <SectionIntro
        kicker="Institutional AI features"
        title="Built like market infrastructure, not a template."
        text="Every surface is designed to communicate intelligence, trust, speed, and discipline. The product feels cinematic because the system underneath is organized around real trading decisions."
      />

      <section className="cinema-feature-mosaic">
        {institutionalFeatures.map((feature, index) => (
          <InstitutionalFeature key={feature.title} feature={feature} index={index} />
        ))}
      </section>

      <section className="cinema-signal-terminal">
        <div className="grid gap-8 xl:grid-cols-[0.88fr_1.12fr]">
          <div className="cinema-copy-panel">
            <div className="cinema-eyebrow">
              <Cpu className="h-4 w-4" />
              Live AI signal terminal
            </div>
            <h2 className="mt-5 text-4xl font-semibold leading-[0.95] text-white lg:text-6xl">
              Signals that look powerful because the risk is visible.
            </h2>
            <p className="mt-5 text-base leading-8 text-white/58">
              Long, short, or wait. Confidence, live price, risk level, and reasoning. The interface avoids fake certainty and makes every setup feel structured.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {intelligencePillars.map(({ label, value, icon: Icon }) => (
                <div key={label} className="cinema-pillar-card">
                  <Icon className="h-4 w-4 text-cyan-200" />
                  <p className="mt-3 text-xs uppercase tracking-[0.22em] text-white/36">{label}</p>
                  <p className="mt-1 text-lg font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="cinema-terminal-board">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/35">Signal matrix</p>
                <h3 className="mt-1 text-xl font-semibold text-white">Live opportunity stream</h3>
              </div>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-100">
                Scanning
              </span>
            </div>
            <div className="grid gap-3 p-4">
              {signalRows.map((signal) => (
                <SignalRow key={signal.symbol} signal={signal} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="cinema-dashboard-preview">
        <div className="grid gap-8 2xl:grid-cols-[1.1fr_0.9fr]">
          <div className="cinema-dashboard-screen">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/35">Interactive dashboard preview</p>
                <h3 className="mt-1 text-xl font-semibold text-white">Vypexrock intelligence cockpit</h3>
              </div>
              <div className="flex gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-400/80" />
                <span className="h-3 w-3 rounded-full bg-amber-300/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-300/80" />
              </div>
            </div>
            <div className="grid gap-4 p-5 lg:grid-cols-[1fr_0.72fr]">
              <div className="cinema-chart-window">
                <CinematicChart />
              </div>
              <div className="grid gap-3">
                <PreviewCard label="AI decision" value={strongest?.direction ?? "WAIT"} note="Scenario-aware, not guaranteed" />
                <PreviewCard label="Confidence" value={`${strongest?.confidence ?? 68}%`} note="Weighted by structure and momentum" />
                <PreviewCard label="Risk model" value="1.9R" note="Stop-first trade framing" />
              </div>
            </div>
          </div>

          <div className="cinema-copy-panel">
            <div className="cinema-eyebrow">
              <Eye className="h-4 w-4" />
              Market intelligence
            </div>
            <h2 className="mt-5 text-4xl font-semibold leading-tight text-white lg:text-5xl">
              A private workspace that feels alive before you click anything.
            </h2>
            <p className="mt-5 text-base leading-8 text-white/58">
              Animated market panels, live price surfaces, holographic widgets, and AI status indicators create a feeling of constant intelligence without making the page noisy.
            </p>
            <Link href="/ai" className="cinema-secondary-cta mt-8">
              Ask Vypexrock AI
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="cinema-strategy-workspace">
        <SectionIntro
          kicker="Premium strategy workspace"
          title="From chart context to risk-managed briefing."
          text="Vypexrock is designed around a professional workflow: choose context, inspect the chart, generate AI reasoning, validate risk, and save the setup."
        />
        <div className="cinema-workflow-grid">
          <WorkflowOrb number="01" title="Choose context" text="Symbol, timeframe, strategy, and market regime." />
          <WorkflowOrb number="02" title="Read structure" text="Trend, liquidity, support, resistance, and momentum." />
          <WorkflowOrb number="03" title="Generate briefing" text="Bias, entry zone, stop loss, targets, and invalidation." />
          <WorkflowOrb number="04" title="Track outcome" text="Signal history and performance clarity over time." />
        </div>
      </section>

      <section className="cinema-confidence-engine">
        <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="cinema-eyebrow">
              <Orbit className="h-4 w-4" />
              AI confidence engine
            </div>
            <h2 className="mt-5 text-4xl font-semibold leading-tight text-white lg:text-6xl">
              Confidence is earned. Not sprayed everywhere.
            </h2>
            <p className="mt-5 text-base leading-8 text-white/58">
              Vypexrock should prefer waiting over bad trades. The product language is built around probability, confirmation, and invalidation.
            </p>
          </div>
          <div className="confidence-orbit-stage">
            <ConfidenceRing value={86} label="Structure" />
            <ConfidenceRing value={78} label="Momentum" />
            <ConfidenceRing value={91} label="Risk clarity" />
            <ConfidenceRing value={72} label="Volume" />
          </div>
        </div>
      </section>

      <section className="cinema-testimonial-grid">
        {testimonials.map((item) => (
          <figure key={item.name} className="cinema-testimonial-card">
            <blockquote>"{item.quote}"</blockquote>
            <figcaption>
              <span>{item.name}</span>
              <small>{item.role}</small>
            </figcaption>
          </figure>
        ))}
      </section>

      <section className="cinema-pricing-section">
        <SectionIntro
          kicker="Pricing"
          title="Structured for a premium research business."
          text="Payment integration can come later. The product already communicates Free, Pro, and premium signal value clearly."
        />
        <div className="cinema-pricing-grid">
          {pricingPlans.map((plan, index) => (
            <div key={plan.name} className={cn("cinema-price-card", index === 1 && "cinema-price-featured")}>
              <p className="text-xs uppercase tracking-[0.24em] text-white/38">{plan.name}</p>
              <h3 className="mt-4 text-4xl font-semibold text-white">{plan.price}</h3>
              <p className="mt-3 text-sm leading-7 text-white/58">{plan.description}</p>
              <div className="mt-6 grid gap-3">
                {plan.features.slice(0, 5).map((feature) => (
                  <div key={feature} className="flex items-center gap-3 text-sm text-white/70">
                    <BadgeCheck className="h-4 w-4 text-cyan-200" />
                    {feature}
                  </div>
                ))}
              </div>
              <Link href="/pricing" className={index === 1 ? "cinema-primary-cta mt-7 w-full" : "cinema-secondary-cta mt-7 w-full"}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="cinema-faq-section">
        <SectionIntro
          kicker="FAQ"
          title="Trust, clarity, and responsible intelligence."
          text="Premium design only matters if the product also tells the truth about risk."
        />
        <div className="cinema-faq-grid">
          {faqs.map((faq) => (
            <details key={faq.question} className="cinema-faq-card">
              <summary>
                {faq.question}
                <ChevronDown className="h-4 w-4" />
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {isLoading ? <div className="cinema-loading-card">Loading live intelligence...</div> : null}
      {error ? <div className="cinema-error-card">Live API is unavailable. Showing curated market data.</div> : null}

      <section className="cinema-market-table">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4 px-2">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/60">Live market layer</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Real-time crypto board</h2>
          </div>
          <Link href="/login" className="cinema-secondary-cta">
            Unlock workspace
          </Link>
        </div>
        <CoinTable rows={rows} />
      </section>

      <footer className="cinema-footer">
        <div>
          <p className="text-xs uppercase tracking-[0.34em] text-cyan-100/55">Vypexrock</p>
          <h2>The future of AI crypto intelligence.</h2>
          <p>Probability-based analysis. Not financial advice. Use disciplined risk management.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {["Dashboard", "Vypexrock AI", "Chart Analyzer", "Community", "Pricing"].map((item) => (
            <Link key={item} href={routeFor(item)}>{item}</Link>
          ))}
        </div>
      </footer>
    </div>
  );
}

function HeroAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="cinema-orb cinema-orb-one" />
      <div className="cinema-orb cinema-orb-two" />
      <div className="cinema-orb cinema-orb-three" />
      <div className="cinema-grid-floor" />
      <div className="cinema-scan-beam" />
      <div className="cinema-particles">
        {Array.from({ length: 22 }).map((_, index) => (
          <span key={index} style={{ "--i": index } as CSSProperties} />
        ))}
      </div>
    </div>
  );
}

function CinematicTerminal({ rows, strongest }: { rows: MarketTicker[]; strongest?: ReturnType<typeof buildLandingSignal> }) {
  return (
    <div className="cinema-hero-terminal">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/35">AI operating surface</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Vypexrock live terminal</h2>
        </div>
        <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-bold text-cyan-100">
          Neural scan
        </span>
      </div>
      <div className="grid gap-4 p-5 lg:grid-cols-[1fr_0.72fr]">
        <div className="cinema-chart-core">
          <CinematicChart />
          <div className="cinema-floating-badge left-[7%] top-[12%]">AI Projection</div>
          <div className="cinema-floating-badge right-[7%] top-[18%]">{strongest?.confidence ?? 78}% confidence</div>
          <div className="cinema-floating-badge bottom-[12%] left-[14%]">Risk-managed</div>
        </div>
        <div className="grid gap-3">
          {rows.slice(0, 5).map((row) => (
            <MarketPulse key={row.symbol} row={row} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CinematicChart() {
  const candles = [
    { x: 6, y: 45, h: 28, up: false },
    { x: 12, y: 32, h: 42, up: true },
    { x: 18, y: 38, h: 30, up: false },
    { x: 24, y: 58, h: 50, up: false },
    { x: 30, y: 52, h: 38, up: true },
    { x: 36, y: 68, h: 44, up: false },
    { x: 42, y: 72, h: 34, up: true },
    { x: 48, y: 58, h: 48, up: true },
    { x: 54, y: 42, h: 52, up: true },
    { x: 60, y: 36, h: 36, up: false },
    { x: 66, y: 30, h: 46, up: true },
    { x: 72, y: 24, h: 40, up: true },
    { x: 78, y: 21, h: 34, up: true }
  ];
  const projected = [
    { x: 84, y: 21, h: 31 },
    { x: 88, y: 18, h: 34 },
    { x: 92, y: 15, h: 38 },
    { x: 96, y: 12, h: 32 }
  ];

  return (
    <div className="cinema-chart-stage">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="cinemaPath" x1="0" x2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="55%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <linearGradient id="rewardZone" x1="0" x2="1">
            <stop offset="0%" stopColor="rgba(16,185,129,0.08)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0.16)" />
          </linearGradient>
        </defs>
        <rect x="68" y="15" width="25" height="22" rx="2" fill="url(#rewardZone)" />
        <rect x="68" y="39" width="25" height="16" rx="2" fill="rgba(244,63,94,0.1)" />
        <line x1="4" y1="38" x2="96" y2="38" stroke="rgba(96,165,250,0.8)" strokeDasharray="1 1" strokeWidth="0.35" />
        <line x1="4" y1="24" x2="96" y2="24" stroke="rgba(16,185,129,0.78)" strokeWidth="0.42" />
        <line x1="4" y1="55" x2="96" y2="55" stroke="rgba(244,63,94,0.78)" strokeWidth="0.42" />
        <path d="M7 48 C22 34 30 72 43 66 C58 58 52 32 68 36 C78 40 82 24 96 14" fill="none" stroke="url(#cinemaPath)" strokeWidth="0.9" strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0">
        {candles.map((candle, index) => (
          <span
            key={`${candle.x}-${index}`}
            className={cn("cinema-candle", candle.up ? "cinema-candle-up" : "cinema-candle-down")}
            style={{ left: `${candle.x}%`, top: `${candle.y}%`, height: `${candle.h}%`, "--d": `${index * 70}ms` } as CSSProperties}
          />
        ))}
        {projected.map((candle, index) => (
          <span
            key={`${candle.x}-${index}`}
            className="cinema-candle cinema-candle-projected"
            style={{ left: `${candle.x}%`, top: `${candle.y}%`, height: `${candle.h}%`, "--d": `${900 + index * 120}ms` } as CSSProperties}
          />
        ))}
      </div>
      <div className="cinema-chart-label right-[4%] top-[21%] text-emerald-100">TP zone</div>
      <div className="cinema-chart-label right-[4%] top-[35%] text-cyan-100">Entry</div>
      <div className="cinema-chart-label right-[4%] top-[52%] text-rose-100">Stop</div>
    </div>
  );
}

function HeroMetric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="cinema-hero-metric">
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{note}</span>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="cinema-metric-card">
      <Icon className="h-5 w-5 text-cyan-100" />
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function SectionIntro({ kicker, title, text }: { kicker: string; title: string; text: string }) {
  return (
    <div className="cinema-section-intro">
      <p>{kicker}</p>
      <h2>{title}</h2>
      <span>{text}</span>
    </div>
  );
}

function InstitutionalFeature({
  feature,
  index
}: {
  feature: { title: string; text: string; icon: LucideIcon; tone: string };
  index: number;
}) {
  const Icon = feature.icon;
  return (
    <article className={cn("cinema-feature-card", `cinema-tone-${feature.tone}`, index === 0 && "cinema-feature-wide", index === 3 && "cinema-feature-tall")}>
      <div className="cinema-feature-icon">
        <Icon className="h-5 w-5" />
      </div>
      <h3>{feature.title}</h3>
      <p>{feature.text}</p>
    </article>
  );
}

function MarketPulse({ row }: { row: MarketTicker }) {
  const positive = row.change_24h >= 0;
  return (
    <Link href={`/coin/${row.symbol}`} className="cinema-market-pulse">
      <div>
        <strong>{row.symbol}</strong>
        <span>{row.metadata_name ?? "Live asset"}</span>
      </div>
      <div className="text-right">
        <p>{formatCurrency(row.price)}</p>
        <em className={positive ? "text-emerald-300" : "text-rose-300"}>
          {positive ? "+" : ""}
          {row.change_24h.toFixed(2)}%
        </em>
      </div>
    </Link>
  );
}

function SignalRow({ signal }: { signal: ReturnType<typeof buildLandingSignal> }) {
  const long = signal.direction === "LONG";
  return (
    <Link href={`/coin/${signal.symbol}`} className="cinema-signal-row">
      <div className="flex min-w-0 items-center gap-3">
        <div className={cn("cinema-direction-dot", long ? "bg-emerald-300" : "bg-rose-300")} />
        <div className="min-w-0">
          <strong>{signal.symbol}</strong>
          <span>{signal.note}</span>
        </div>
      </div>
      <div className="text-right">
        <p>{signal.direction}</p>
        <em>{signal.confidence}%</em>
      </div>
    </Link>
  );
}

function PreviewCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="cinema-preview-card">
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{note}</span>
    </div>
  );
}

function WorkflowOrb({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <article className="cinema-workflow-orb">
      <span>{number}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function ConfidenceRing({ value, label }: { value: number; label: string }) {
  return (
    <div className="confidence-ring-card" style={{ "--value": value } as CSSProperties}>
      <div className="confidence-ring">
        <strong>{value}%</strong>
      </div>
      <span>{label}</span>
    </div>
  );
}

function buildLandingSignal(row: MarketTicker, index: number) {
  const direction = row.change_24h >= 0 ? "LONG" : "SHORT";
  const volatility = Math.max(Math.abs(row.change_24h), 0.4);
  const confidence = Math.min(91, Math.max(56, Math.round(62 + volatility * 3.8 + index)));
  return {
    symbol: row.symbol,
    direction,
    confidence,
    price: row.price,
    note: direction === "LONG" ? "Constructive structure" : "Defensive pressure"
  };
}

function routeFor(item: string) {
  const routes: Record<string, string> = {
    Dashboard: "/",
    "Vypexrock AI": "/ai",
    "Chart Analyzer": "/chart-analyzer",
    Community: "/community",
    Pricing: "/pricing"
  };
  return routes[item] ?? "/";
}
