import { Activity, BadgePercent, ShieldCheck, Target, TrendingDown, TrendingUp } from "lucide-react";

import type { PerformanceSummary } from "@/types";

export function PerformanceSummaryCard({ summary }: { summary: PerformanceSummary }) {
  const cards = [
    { label: "Total signals", value: String(summary.totalSignals), icon: Activity },
    { label: "Win rate", value: `${summary.winRate.toFixed(1)}%`, icon: BadgePercent },
    { label: "Average R:R", value: summary.averageRR, icon: Target },
    { label: "Average gain", value: summary.averageGain, icon: TrendingUp },
    { label: "Average loss", value: summary.averageLoss, icon: TrendingDown },
    { label: "Active / Closed", value: `${summary.activeSignals} / ${summary.closedSignals}`, icon: ShieldCheck }
  ];

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/40">Performance Tracker</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Signal history and outcome quality</h2>
        </div>
        <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100">
          Historical performance
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-[1.3rem] border border-white/10 bg-[#0d1224] p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/40">
              <Icon className="h-4 w-4 text-cyan-300" />
              {label}
            </div>
            <p className="mt-3 text-xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-white/38">Best performer</p>
          <p className="mt-2 text-lg font-semibold text-white">{summary.bestPerformer}</p>
        </div>
        <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-white/38">Worst performer</p>
          <p className="mt-2 text-lg font-semibold text-white">{summary.worstPerformer}</p>
        </div>
      </div>
    </section>
  );
}
