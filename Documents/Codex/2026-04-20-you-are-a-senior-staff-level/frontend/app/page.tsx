"use client";

import { useQuery } from "@tanstack/react-query";

import { CinematicHero } from "@/components/vx/cinematic-hero";
import {
  ActSilenceBecomesSignal,
  ActLiquidityVision,
  ActOrbit,
  ActRisk,
  ActInvitation,
} from "@/components/vx/cinematic-acts";
import { CinematicPreloader } from "@/components/vx/cinematic-preloader";
import { CinematicSceneBreak } from "@/components/vx/cinematic-scene-break";
import { useMarketStream } from "@/hooks/use-market-stream";
import { apiFetch } from "@/lib/api";
import { mergeMarketRows } from "@/lib/asset-catalog";
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

  return (
    <div className="cinematic-film">
      <CinematicPreloader />

      {/* Act 0 — opening, mystery, hero */}
      <CinematicHero rows={rows} />

      {/* breath */}
      <CinematicSceneBreak label="Act I · the silence before" />

      {/* Act I — silence becomes signal (typography breathes) */}
      <ActSilenceBecomesSignal />

      {/* breath */}
      <CinematicSceneBreak label="Act II · liquidity is gravity" />

      {/* Act II — liquidity vision (full-bleed canvas, no card) */}
      <ActLiquidityVision />

      {/* breath */}
      <CinematicSceneBreak label="Act III · timeframes lock" />

      {/* Act III — multi-timeframe orbit (clean geometry) */}
      <ActOrbit />

      {/* breath */}
      <CinematicSceneBreak label="Act IV · discipline by design" />

      {/* Act IV — risk engine (cinematic numbers) */}
      <ActRisk />

      {/* breath */}
      <CinematicSceneBreak label="final frame" />

      {/* Act V — invitation (not pricing cards) */}
      <ActInvitation />
    </div>
  );
}
