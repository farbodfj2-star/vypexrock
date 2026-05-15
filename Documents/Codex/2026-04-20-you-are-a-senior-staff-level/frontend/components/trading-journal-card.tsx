"use client";

import type { ReactNode } from "react";
import { Brain, Camera, CheckCircle2, NotebookPen, TrendingDown, TrendingUp } from "lucide-react";

import type { JournalTrade } from "@/lib/trading-os-data";
import { cn } from "@/lib/utils";

export function TradingJournalCard({ trade }: { trade: JournalTrade }) {
  const isWin = trade.result === "Win";
  const isOpen = trade.result === "Open";

  return (
    <article className="terminal-glass-card p-5 transition duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/38">{trade.setup}</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{trade.symbol}</h3>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold",
            isOpen ? "bg-cyan-300/12 text-cyan-100" : isWin ? "bg-emerald-400/12 text-emerald-100" : "bg-rose-400/12 text-rose-100"
          )}
        >
          {isOpen ? <NotebookPen className="h-3.5 w-3.5" /> : isWin ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {trade.result}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <JournalMetric label="R multiple" value={trade.rr} />
        <JournalMetric label="P/L" value={trade.pnl} tone={trade.pnl.startsWith("-") ? "danger" : "success"} />
        <JournalMetric label="Emotion" value={trade.emotion} />
        <JournalMetric label="Screenshot" value="Attached" icon={<Camera className="h-4 w-4" />} />
      </div>

      <div className="mt-5 rounded-[1.35rem] border border-cyan-300/12 bg-cyan-300/[0.045] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-cyan-100">
          <Brain className="h-4 w-4" />
          AI trade review
        </div>
        <p className="mt-3 text-sm leading-6 text-white/62">{trade.aiReview}</p>
      </div>
    </article>
  );
}

function JournalMetric({ label, value, tone = "default", icon }: { label: string; value: string; tone?: "default" | "success" | "danger"; icon?: ReactNode }) {
  const toneClass = tone === "success" ? "text-emerald-200" : tone === "danger" ? "text-rose-200" : "text-white";

  return (
    <div className="rounded-[1.15rem] border border-white/10 bg-black/18 p-3">
      <p className="text-[11px] uppercase tracking-[0.2em] text-white/34">{label}</p>
      <p className={cn("mt-2 flex items-center gap-2 text-sm font-semibold", toneClass)}>
        {icon}
        {value}
      </p>
    </div>
  );
}

export function JournalSummaryCard({
  winRate,
  averageRR,
  profitLoss,
  pnl,
  bestSetup,
  worstMistake
}: {
  winRate: string | number;
  averageRR: string;
  profitLoss?: string;
  pnl?: string;
  bestSetup: string;
  worstMistake: string;
}) {
  const displayWinRate = typeof winRate === "number" ? `${winRate}%` : winRate;
  const displayPnl = profitLoss ?? pnl ?? "N/A";

  return (
    <section className="terminal-glass-card p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300/20 to-violet-500/20 text-cyan-100">
          <CheckCircle2 className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-white/38">Trading Journal</p>
          <h2 className="text-2xl font-semibold text-white">Performance memory</h2>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <JournalMetric label="Win rate" value={displayWinRate} tone="success" />
        <JournalMetric label="Average R:R" value={averageRR} />
        <JournalMetric label="P/L" value={displayPnl} tone={displayPnl.startsWith("-") ? "danger" : "success"} />
        <JournalMetric label="Best setup" value={bestSetup} />
      </div>

      <div className="mt-4 rounded-[1.35rem] border border-amber-300/12 bg-amber-300/[0.045] p-4 text-sm leading-6 text-white/64">
        AI warning: {worstMistake}. Vypexrock will flag similar behavior before future entries.
      </div>
    </section>
  );
}
