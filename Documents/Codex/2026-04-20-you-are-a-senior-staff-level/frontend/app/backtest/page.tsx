import { BacktestOverviewCard } from "@/components/backtest-overview";
import { backtestOverview } from "@/lib/mock-backtest";

export default function BacktestPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[2.2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.42)] lg:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">Backtest Lab</p>
        <h1 className="mt-3 text-4xl font-semibold text-white lg:text-5xl">Historical signal evaluation and simulation context</h1>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-white/62 lg:text-base">
          This module shows historical simulation and tracked outcome context for the Vypexrock signal framework. It is designed to improve trust and process quality, not to imply future certainty.
        </p>
      </section>

      <BacktestOverviewCard overview={backtestOverview} />

      <section className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] px-6 py-5 text-sm leading-7 text-white/48">
        Historical simulation does not guarantee future results. Use backtests to understand behavior across timeframes and symbols, then pair that context with live market confirmation and position sizing discipline.
      </section>
    </div>
  );
}
