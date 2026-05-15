"use client";

import { useMemo } from "react";

import { cn, formatCompactNumber } from "@/lib/utils";
import type { MarketTicker } from "@/types";

export function VolumeHeatmap({ rows }: { rows: MarketTicker[] }) {
  const cells = useMemo(() => {
    const sorted = [...rows].sort((a, b) => b.volume_24h - a.volume_24h).slice(0, 16);
    const maxVolume = Math.max(...sorted.map((row) => row.volume_24h), 1);
    return sorted.map((row) => ({
      ...row,
      intensity: row.volume_24h / maxVolume
    }));
  }, [rows]);

  if (!cells.length) return null;

  return (
    <section className="vx-glass-panel p-5">
      <p className="text-xs uppercase tracking-widest text-white/40">Volume heatmap</p>
      <h2 className="mt-2 text-lg font-semibold text-white">Liquidity concentration</h2>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {cells.map((cell) => {
          const positive = cell.change_24h >= 0;
          return (
            <div
              key={cell.symbol}
              className={cn(
                "rounded-xl border px-3 py-3 transition",
                positive ? "border-emerald-400/15" : "border-rose-400/15"
              )}
              style={{
                background: `linear-gradient(145deg, rgba(34,211,238,${0.08 + cell.intensity * 0.35}) 0%, rgba(8,10,15,0.92) 70%)`
              }}
            >
              <p className="text-xs font-semibold text-white">{cell.symbol.replace("USDT", "")}</p>
              <p className="mt-1 text-[11px] text-white/45">{formatCompactNumber(cell.volume_24h)} vol</p>
              <p className={cn("mt-2 text-sm font-semibold", positive ? "text-emerald-300" : "text-rose-300")}>
                {positive ? "+" : ""}
                {cell.change_24h.toFixed(2)}%
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
