import { formatCurrency } from "@/lib/utils";
import { Signal } from "@/types";

export function SignalCard({ signal }: { signal: Signal }) {
  const color =
    signal.bias === "long" ? "text-emerald-400" : signal.bias === "short" ? "text-rose-400" : "text-slate-300";

  return (
    <section className="rounded-3xl border border-border bg-surface p-6 shadow-glow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{signal.timeframe}</p>
          <h3 className={`mt-2 text-2xl font-semibold ${color}`}>{signal.bias.toUpperCase()}</h3>
        </div>
        <div className="rounded-2xl border border-border px-4 py-3 text-right">
          <p className="text-xs text-slate-400">Confidence</p>
          <p className="text-xl font-semibold">{signal.confidence}%</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Entry zone" value={`${formatCurrency(signal.entry_low)} - ${formatCurrency(signal.entry_high)}`} />
        <Metric label="Stop loss" value={formatCurrency(signal.stop_loss)} />
        <Metric
          label="TP1 / TP2 / TP3"
          value={`${formatCurrency(signal.take_profit_1)} / ${formatCurrency(signal.take_profit_2)} / ${formatCurrency(signal.take_profit_3)}`}
        />
        <Metric label="Indicators" value={`RSI ${signal.rsi} | EMA20 ${signal.ema20} | EMA50 ${signal.ema50}`} />
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surfaceAlt p-4 text-sm text-slate-300">
        <p>{signal.explanation}</p>
        <p className="mt-3 text-xs text-slate-400">{signal.suggested_risk_note}</p>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surfaceAlt p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-3 text-sm font-medium text-slate-100">{value}</p>
    </div>
  );
}
