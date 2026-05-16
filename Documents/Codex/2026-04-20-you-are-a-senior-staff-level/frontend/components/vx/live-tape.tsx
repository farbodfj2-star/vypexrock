"use client";

import { useMemo } from "react";

import { formatCompactNumber, formatCurrency } from "@/lib/utils";
import type { MarketTicker } from "@/types";

type Props = {
  rows: MarketTicker[];
};

export function LiveTape({ rows }: Props) {
  // Duplicate rows for the marquee loop
  const doubled = useMemo(() => {
    if (!rows.length) return [];
    const list = rows.slice(0, 24);
    return [...list, ...list, ...list];
  }, [rows]);

  if (!doubled.length) {
    return (
      <div className="vx-cine-tape" aria-hidden>
        <div className="vx-cine-tape-track">
          <span className="vx-cine-tape-item">Vypexrock · Live market intelligence · Multi-timeframe alignment · Telegram lifecycle · Risk-first execution</span>
        </div>
      </div>
    );
  }

  return (
    <div className="vx-cine-tape" aria-hidden>
      <div className="vx-cine-tape-track">
        {doubled.map((row, i) => {
          const up = row.change_24h >= 0;
          return (
            <span key={`${row.symbol}-${i}`} className="vx-cine-tape-item">
              <strong>{row.symbol.replace(/USDT$/i, "")}</strong>
              <span>{formatCurrency(row.price)}</span>
              <span className={up ? "vx-cine-tape-up" : "vx-cine-tape-dn"}>
                {up ? "▲" : "▼"} {Math.abs(row.change_24h).toFixed(2)}%
              </span>
              <span style={{ opacity: 0.5 }}>vol {formatCompactNumber(row.volume_24h)}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
