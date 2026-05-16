"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { CinematicHero } from "@/components/vx/cinematic-hero";
import {
  ClosingCTA,
  ConfirmationSection,
  LifecycleSection,
  RiskEngineSection,
  RiskPathSection,
  ScannerSection,
  StructureSection,
} from "@/components/vx/cinematic-story";
import { LiveTape } from "@/components/vx/live-tape";
import { SmoothScrollProvider } from "@/components/vx/smooth-scroll-provider";
import { useMarketStream } from "@/hooks/use-market-stream";
import { apiFetch } from "@/lib/api";
import { mergeMarketRows } from "@/lib/asset-catalog";
import { scoreTicker } from "@/lib/market-signals";
import { dashboardFallbackRows } from "@/lib/mock-data";
import type { MarketTicker } from "@/types";

export default function HomePage() {
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch<MarketTicker[]>("/market/dashboard"),
    refetchInterval: 8000,
  });

  useMarketStream();

  const rows = mergeMarketRows(data?.length ? data : dashboardFallbackRows);
  const scored = useMemo(() => rankSignals(rows), [rows]);
  const topSignal = scored[0];
  const totalVolume = rows.reduce((sum, row) => sum + row.volume_24h, 0);
  const advancing = rows.filter((row) => row.change_24h >= 0).length;

  return (
    <div className="vx-cine-shell">
      <SmoothScrollProvider />

      <CinematicHero
        rows={rows}
        topSignal={topSignal}
        totalVolume={totalVolume}
        advancing={advancing}
      />

      <LiveTape rows={rows} />

      <StructureSection />
      <ScannerSection />
      <RiskPathSection />
      <LifecycleSection />
      <ConfirmationSection />
      <RiskEngineSection />
      <ClosingCTA />
    </div>
  );
}

function rankSignals(rows: MarketTicker[]) {
  return rows
    .map((row, index) => {
      const score = scoreTicker(row, index, rows.length);
      return { ...score, symbol: row.symbol, price: row.price };
    })
    .filter((s) => s.direction !== "wait")
    .sort((a, b) => b.confidence - a.confidence);
}
