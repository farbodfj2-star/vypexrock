"use client";

import type { MarketOpportunityDto } from "@/lib/market-opportunities";

export function AiReasoningPanel({ setup }: { setup?: MarketOpportunityDto }) {
  if (!setup) {
    return (
      <section className="vx-glass-panel p-5">
        <p className="text-xs uppercase tracking-widest text-white/40">AI reasoning</p>
        <p className="mt-3 text-sm leading-relaxed text-white/50">No active setup selected.</p>
      </section>
    );
  }

  return (
    <section className="vx-glass-panel p-5">
      <p className="text-xs uppercase tracking-widest text-white/40">AI reasoning</p>
      <h2 className="mt-2 text-lg font-semibold text-white">{setup.symbol} · {setup.tier}</h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-white/60">
        <p>
          <span className="font-medium text-white/85">Structure:</span> {setup.structure}. Trigger: {setup.trigger}.
        </p>
        <p>
          <span className="font-medium text-white/85">Liquidity:</span> {setup.liquidity}. Volume context: {setup.volume}.
        </p>
        <p>
          <span className="font-medium text-white/85">Risk frame:</span> {setup.risk} risk · {setup.risk_reward.toFixed(2)}R mapped · confidence {setup.confidence}%.
        </p>
        <p className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-white/70">{setup.note}</p>
      </div>
    </section>
  );
}
