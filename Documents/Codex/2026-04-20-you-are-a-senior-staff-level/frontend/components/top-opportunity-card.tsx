import Link from "next/link";
import { ArrowRight, Shield, Sparkles, Target, TrendingUp } from "lucide-react";

import { formatCurrency } from "@/lib/utils";
import type { OpportunitySetup } from "@/types";

export function TopOpportunityCard({ setup }: { setup: OpportunitySetup }) {
  const biasColor =
    setup.bias === "long" ? "text-emerald-300" : setup.bias === "short" ? "text-rose-300" : "text-cyan-200";

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.36)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-white/40">Best Opportunity Right Now</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Top AI-ranked setup: {setup.symbol}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">{setup.explanation}</p>
        </div>
        <div className="rounded-[1.3rem] border border-violet-400/25 bg-violet-500/10 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-white/45">Confidence</p>
          <p className={`mt-1 text-2xl font-semibold ${biasColor}`}>{setup.confidence}%</p>
          <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-white/45">Live ranked</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Metric label="Bias" value={setup.bias.toUpperCase()} icon={TrendingUp} />
          <Metric label="Current price" value={formatCurrency(setup.currentPrice)} icon={Sparkles} />
          <Metric label="Timeframe" value={setup.timeframe} icon={Target} />
          <Metric label="Entry zone" value={`${formatCurrency(setup.entryLow)} - ${formatCurrency(setup.entryHigh)}`} icon={Target} />
          <Metric label="Stop loss" value={formatCurrency(setup.stopLoss)} icon={Shield} />
          <Metric label="Risk / reward" value={setup.riskReward} icon={Sparkles} />
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">Execution scenario</p>
          <p className="mt-3 text-sm leading-7 text-white/68">{setup.expectedMove}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <MiniMetric label="TP1" value={formatCurrency(setup.takeProfit1)} />
            <MiniMetric label="TP2" value={formatCurrency(setup.takeProfit2)} />
            <MiniMetric label="TP3" value={formatCurrency(setup.takeProfit3)} />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <MiniMetric label="Invalidation" value={setup.invalidationLevel ?? formatCurrency(setup.stopLoss)} />
            <MiniMetric label="Confidence logic" value={setup.confidenceReason ?? "Trend, momentum, and structure are aligned."} />
          </div>
          <div className="mt-4 rounded-[1.1rem] border border-amber-300/20 bg-amber-300/10 p-3 text-sm leading-6 text-amber-50/90">
            {setup.riskNote ?? "Risk-managed idea only. Wait for confirmation and size the position around the stop distance."}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {setup.indicatorSummary.map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/62">
                {item}
              </span>
            ))}
          </div>
          <Link
            href={`/coin/${setup.symbol}`}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-slate-950"
          >
            Open full analysis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: string;
  icon: typeof Sparkles;
}) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/40">
        <Icon className="h-4 w-4 text-cyan-300" />
        {label}
      </div>
      <p className="mt-3 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] p-3">
      <p className="text-xs uppercase tracking-[0.18em] text-white/40">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}
