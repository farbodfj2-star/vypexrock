"use client";

import { AssetIcon } from "@/components/asset-icon";
import { formatCurrency, cn } from "@/lib/utils";
import type { MarketTicker } from "@/types";

export function LiveTickerStrip({ rows }: { rows: MarketTicker[] }) {
  const tape = [...rows].sort((a, b) => b.volume_24h - a.volume_24h).slice(0, 14);
  if (!tape.length) return null;

  const loop = [...tape, ...tape];

  return (
    <section className="vx-glass-panel overflow-hidden border-white/10 py-2">
      <div className="vx-ticker-track flex w-max gap-6 px-4 text-xs font-medium uppercase tracking-[0.18em] text-white/70">
        {loop.map((row, index) => {
          const positive = row.change_24h >= 0;
          return (
            <span key={`${row.symbol}-${index}`} className="inline-flex items-center gap-2 whitespace-nowrap">
              <span className="grid h-5 w-5 overflow-hidden rounded-full border border-white/10">
                <AssetIcon symbol={row.symbol} name={row.metadata_name} imageUrl={row.metadata_image} className="h-5 w-5" />
              </span>
              <span className="text-white/90">{row.symbol.replace("USDT", "")}</span>
              <span>{formatCurrency(row.price)}</span>
              <span className={cn(positive ? "text-emerald-300" : "text-rose-300")}>
                {positive ? "+" : ""}
                {row.change_24h.toFixed(2)}%
              </span>
            </span>
          );
        })}
      </div>
    </section>
  );
}
