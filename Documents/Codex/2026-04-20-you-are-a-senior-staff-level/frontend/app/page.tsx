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
import { CinematicBootstrap } from "@/components/vx/cinematic-bootstrap";
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
      {/* preloader (1.4s) */}
      <CinematicPreloader />

      {/* engine layers — smooth scroll, ambience canvas, post-fx, phase HUD */}
      <CinematicBootstrap />

      {/* Act 0 — opening, mystery, hero */}
      <CinematicHero rows={rows} />

      {/* breath */}
      <CinematicSceneBreak label="Act I · the silence before" />

      <ActSilenceBecomesSignal />

      <CinematicSceneBreak label="Act II · liquidity is gravity" />

      <ActLiquidityVision />

      <CinematicSceneBreak label="Act III · timeframes lock" />

      <ActOrbit />

      <CinematicSceneBreak label="Act IV · discipline by design" />

      <ActRisk />

      <CinematicSceneBreak label="final frame" />

      <ActInvitation />
    </div>
  );
}
