import { cn } from "@/lib/utils";
import type { SignalHistoryItem } from "@/types";

export function SignalHistory({ rows }: { rows: SignalHistoryItem[] }) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="border-b border-white/10 px-6 py-5">
        <p className="text-xs uppercase tracking-[0.24em] text-white/40">Signal History</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Past setups, outcomes, and invalidation discipline</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="border-b border-white/10 text-xs uppercase tracking-[0.18em] text-white/40">
            <tr>
              <th className="px-6 py-4">Symbol</th>
              <th className="px-6 py-4">Bias</th>
              <th className="px-6 py-4">Timeframe</th>
              <th className="px-6 py-4">Entry / Stop</th>
              <th className="px-6 py-4">Targets</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Result</th>
              <th className="px-6 py-4">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} className={cn("border-b border-white/6", index % 2 === 0 && "bg-white/[0.015]")}>
                <td className="px-6 py-5">
                  <p className="font-medium text-white">{row.symbol}</p>
                  <p className="mt-1 text-xs text-white/45">{row.createdAt.slice(0, 10)}</p>
                </td>
                <td className="px-6 py-5">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
                      row.bias === "long" && "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
                      row.bias === "short" && "border-rose-400/20 bg-rose-400/10 text-rose-300",
                      row.bias === "neutral" && "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
                    )}
                  >
                    {row.bias}
                  </span>
                </td>
                <td className="px-6 py-5 text-white/72">{row.timeframe}</td>
                <td className="px-6 py-5 text-sm text-white/60">
                  <p>{row.entry}</p>
                  <p className="mt-1 text-white/42">Stop {row.stopLoss}</p>
                </td>
                <td className="px-6 py-5 text-sm text-white/60">
                  <p>{row.tp1}</p>
                  <p>{row.tp2}</p>
                  <p>{row.tp3}</p>
                </td>
                <td className="px-6 py-5">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.16em]",
                      row.status === "won" && "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
                      row.status === "lost" && "border-rose-400/20 bg-rose-400/10 text-rose-300",
                      row.status === "active" && "border-cyan-400/20 bg-cyan-400/10 text-cyan-100",
                      row.status === "expired" && "border-white/10 bg-white/[0.04] text-white/50"
                    )}
                  >
                    {row.status}
                  </span>
                  <p className="mt-2 max-w-[240px] text-xs leading-6 text-white/42">{row.invalidation}</p>
                </td>
                <td className="px-6 py-5">
                  <p className={cn("font-medium", row.resultPct > 0 ? "text-emerald-300" : row.resultPct < 0 ? "text-rose-300" : "text-white/55")}>
                    {row.resultPct > 0 ? "+" : ""}
                    {row.resultPct.toFixed(2)}%
                  </p>
                  <p className="mt-1 text-xs text-white/42">{row.riskReward}</p>
                </td>
                <td className="px-6 py-5">
                  <p className="text-white">{row.confidence}%</p>
                  <p className="mt-1 max-w-[220px] text-xs leading-6 text-white/42">{row.reasonSummary}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
