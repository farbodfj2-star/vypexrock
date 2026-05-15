"use client";

import { ArrowDownRight, ArrowUpRight, ShieldCheck } from "lucide-react";

import { ConfidenceMeter } from "@/components/confidence-meter";
import { RiskBadge } from "@/components/risk-badge";
import type { AISignal } from "@/lib/trading-os-data";
import { cn } from "@/lib/utils";

export function AISignalCard({ signal, compact = false }: { signal: AISignal; compact?: boolean }) {
  const long = signal.direction === "Long";

  return (
    <article className="terminal-glass-card group relative overflow-hidden p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_90px_rgba(37,99,235,0.18)]">
      <div className={cn("absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/55 to-transparent opacity-0 transition group-hover:opacity-100")} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-white/38">{signal.timeframe} AI Signal</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h3 className="text-2xl font-semibold text-white">{signal.asset}</h3>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]",
                long ? "bg-emerald-400/12 text-emerald-200" : "bg-rose-400/12 text-rose-200"
              )}
            >
              {long ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {signal.direction}
            </span>
            <span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-xs font-semibold text-violet-100">{signal.type}</span>
          </div>
        </div>
        <RiskBadge value={signal.riskLevel} />
      </div>

      <div className={cn("mt-5 grid gap-3", compact ? "grid-cols-2" : "grid-cols-2 xl:grid-cols-4")}>
        <SignalMetric label="Entry zone" value={signal.entryZone} />
        <SignalMetric label="Confirmed entry" value={signal.confirmedEntry} />
        <SignalMetric label="Stop loss" value={signal.stopLoss} tone="danger" />
        <SignalMetric label="Risk / reward" value={signal.riskReward} tone="accent" />
      </div>

      {!compact ? (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <SignalMetric label="TP1" value={signal.tp1} tone="success" />
            <SignalMetric label="TP2" value={signal.tp2} tone="success" />
            <SignalMetric label="TP3" value={signal.tp3} tone="success" />
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
            <ConfidenceMeter value={signal.confidence} compact />
            <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <ShieldCheck className="h-4 w-4 text-cyan-200" />
                Signal logic
              </div>
              <p className="mt-3 text-sm leading-6 text-white/62">{signal.reason}</p>
              <p className="mt-3 text-xs text-white/42">Invalidation: {signal.invalidation}</p>
            </div>
          </div>
        </>
      ) : null}
    </article>
  );
}

function SignalMetric({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" | "danger" | "accent" }) {
  const toneClass = {
    default: "text-white",
    success: "text-emerald-200",
    danger: "text-rose-200",
    accent: "text-cyan-200"
  }[tone];

  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.035] p-3">
      <p className="text-[11px] uppercase tracking-[0.22em] text-white/34">{label}</p>
      <p className={cn("mt-2 text-sm font-semibold", toneClass)}>{value}</p>
    </div>
  );
}
