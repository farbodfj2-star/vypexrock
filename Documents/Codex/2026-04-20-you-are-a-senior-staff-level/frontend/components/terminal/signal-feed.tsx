"use client";

import { AssetIcon } from "@/components/asset-icon";
import { mapOpportunityToScanner } from "@/lib/market-opportunities";
import type { MarketOpportunityDto } from "@/lib/market-opportunities";
import { cn } from "@/lib/utils";

export function SignalFeed({ opportunities }: { opportunities: MarketOpportunityDto[] }) {
  if (!opportunities.length) {
    return (
      <section className="vx-glass-panel p-5">
        <p className="text-xs uppercase tracking-widest text-white/40">Live signal feed</p>
        <p className="mt-3 text-sm text-white/50">Scanner is warming up — structures will stream here.</p>
      </section>
    );
  }

  return (
    <section className="vx-glass-panel p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/40">Live signal feed</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Desk activity</h2>
        </div>
        <span className="vx-live-dot" />
      </div>
      <ul className="mt-4 max-h-[420px] space-y-2 overflow-auto">
        {opportunities.slice(0, 10).map((item) => {
          const row = mapOpportunityToScanner(item);
          const long = row.direction === "Long";
          return (
            <li
              key={item.symbol}
              className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-3 transition hover:border-white/12"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
                <AssetIcon symbol={item.symbol} imageUrl={null} className="h-10 w-10" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{item.symbol}</p>
                <p className="mt-0.5 truncate text-xs text-white/45">{item.trigger}</p>
              </div>
              <div className="text-right">
                <p className={cn("text-sm font-semibold", long ? "text-emerald-300" : "text-rose-300")}>{row.direction}</p>
                <p className="text-xs text-white/45">{item.confidence}% · {item.tier}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
