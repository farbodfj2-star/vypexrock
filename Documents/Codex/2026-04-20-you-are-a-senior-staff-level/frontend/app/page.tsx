"use client";

import { useQuery } from "@tanstack/react-query";

import { CinematicHero } from "@/components/vx/cinematic-hero";
import { CinematicLambo } from "@/components/vx/cinematic-lambo";
import {
  ActSilenceBecomesSignal,
  ActLiquidityVision,
  ActOrbit,
  ActRisk,
  ActInvitation,
} from "@/components/vx/cinematic-acts";
import { CinematicBootstrap } from "@/components/vx/cinematic-bootstrap";
import { CinematicPreloader } from "@/components/vx/cinematic-preloader";
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

      {/* Hero (with built-in RISK→RICH overlay) */}
      <CinematicHero rows={rows} />

      {/* Lambo cinematic — coins float, supercar drives across, "for this....." typing */}
      <CinematicLambo />

      {/* Continuing acts — no scene breaks, fluid one-page flow */}
      <ActSilenceBecomesSignal />
      <ActLiquidityVision />
      <ActOrbit />
      <ActRisk />
      <ActInvitation />
    </div>
  );
}
