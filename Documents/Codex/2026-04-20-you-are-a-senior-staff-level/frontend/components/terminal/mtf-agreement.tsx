"use client";

import type { MarketOpportunityDto } from "@/lib/market-opportunities";
import { cn } from "@/lib/utils";

const frames = ["4H", "1H", "15m", "Entry"] as const;

export function MtfAgreement({ top }: { top?: MarketOpportunityDto }) {
  if (!top) {
    return (
      <section className="vx-glass-panel p-5">
        <p className="text-xs uppercase tracking-widest text-white/40">MTF agreement</p>
        <p className="mt-3 text-sm text-white/50">Waiting for a ranked setup.</p>
      </section>
    );
  }

  const long = top.direction === "Long";
  const agreement = [
    { label: "4H", state: long ? "bull" : "bear" },
    { label: "1H", state: top.confidence >= 70 ? (long ? "bull" : "bear") : "neutral" },
    { label: "15m", state: top.structure.toLowerCase().includes("break") ? (long ? "bull" : "bear") : "neutral" },
    { label: "Entry", state: top.confidence >= 78 ? (long ? "bull" : "bear") : "neutral" }
  ];

  const aligned = agreement.filter((row) => row.state !== "neutral").length;

  return (
    <section className="vx-glass-panel p-5">
      <p className="text-xs uppercase tracking-widest text-white/40">Multi-timeframe agreement</p>
      <h2 className="mt-2 text-lg font-semibold text-white">{top.symbol}</h2>
      <p className="mt-1 text-sm text-white/50">
        {aligned}/4 frames aligned · {top.confidence}% confidence
      </p>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {agreement.map((row) => (
          <div
            key={row.label}
            className={cn(
              "rounded-lg border px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider",
              row.state === "bull" && "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
              row.state === "bear" && "border-rose-400/25 bg-rose-400/10 text-rose-200",
              row.state === "neutral" && "border-white/10 bg-white/[0.03] text-white/45"
            )}
          >
            {row.label}
          </div>
        ))}
      </div>
    </section>
  );
}
