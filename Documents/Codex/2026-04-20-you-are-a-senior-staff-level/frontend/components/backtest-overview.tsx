import { AreaChart, ShieldAlert, TimerReset, Trophy } from "lucide-react";

import type { BacktestOverview } from "@/types";

export function BacktestOverviewCard({ overview }: { overview: BacktestOverview }) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-4">
        <Metric icon={AreaChart} label="Simulated return" value={overview.totalSimulatedReturn} />
        <Metric icon={ShieldAlert} label="Average drawdown" value={overview.averageDrawdown} />
        <Metric icon={Trophy} label="Best timeframe" value={overview.bestTimeframe} />
        <Metric icon={TimerReset} label="Worst timeframe" value={overview.worstTimeframe} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <p className="text-xs uppercase tracking-[0.24em] text-white/40">Confidence vs outcome</p>
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            {overview.confidenceVsOutcome.map((item) => (
              <div key={item.bucket} className="rounded-[1.25rem] border border-white/10 bg-[#0d1224] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/38">{item.bucket}</p>
                <p className="mt-2 text-lg font-semibold text-white">{item.outcome}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 h-[220px] rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5">
            <div className="flex h-full items-end gap-4">
              {overview.timeframeBreakdown.map((item) => (
                <div key={item.timeframe} className="flex flex-1 flex-col items-center justify-end gap-3">
                  <div
                    className="w-full rounded-t-[1rem] bg-gradient-to-t from-cyan-400 to-violet-500"
                    style={{ height: `${Math.max(24, item.winRate * 1.6)}px` }}
                  />
                  <div className="text-center">
                    <p className="text-sm font-medium text-white">{item.timeframe}</p>
                    <p className="text-xs text-white/45">{item.winRate.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <p className="text-xs uppercase tracking-[0.24em] text-white/40">Win rate by timeframe</p>
            <div className="mt-4 space-y-3">
              {overview.timeframeBreakdown.map((item) => (
                <div key={item.timeframe} className="rounded-[1.25rem] border border-white/10 bg-[#0d1224] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{item.timeframe}</p>
                    <span className="text-sm text-cyan-200">{item.winRate.toFixed(1)}%</span>
                  </div>
                  <p className="mt-2 text-sm text-white/58">
                    Avg return {item.averageReturn} | Drawdown {item.drawdown} | Signals {item.signals}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <p className="text-xs uppercase tracking-[0.24em] text-white/40">Win rate by coin</p>
            <div className="mt-4 space-y-3">
              {overview.coinBreakdown.map((item) => (
                <div key={item.symbol} className="flex items-center justify-between rounded-[1.25rem] border border-white/10 bg-[#0d1224] px-4 py-3">
                  <div>
                    <p className="font-medium text-white">{item.symbol}</p>
                    <p className="text-xs text-white/42">{item.totalSignals} simulated signals</p>
                  </div>
                  <span className="text-sm text-white">{item.winRate.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value
}: {
  icon: typeof AreaChart;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-cyan-200">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-white/38">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
