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
      <CinematicPreloader />
      <CinematicBootstrap />

      <CinematicHero rows={rows} />

      <CinematicSceneBreak />
      <ActSilenceBecomesSignal />

      <CinematicSceneBreak />
      <ActLiquidityVision />

      <CinematicSceneBreak />
      <ActOrbit />

      <CinematicSceneBreak />
      <ActRisk />

      <CinematicSceneBreak />
      <ActInvitation />
    </div>
  );
}
