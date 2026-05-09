"use client";

import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type { DataHealth, MarketTicker } from "@/types";

export function DataStatus() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch<MarketTicker[]>("/market/dashboard"),
    refetchInterval: 1000
  });

  const health = useMemo(() => {
    const stream = queryClient.getQueryData<{ status: DataHealth["websocketStatus"]; lastUpdate?: string }>(["market-stream-status"]);
    const lastUpdate = stream?.lastUpdate ? new Date(stream.lastUpdate) : new Date();
    const secondsAgo = Math.max(0, Math.floor((Date.now() - lastUpdate.getTime()) / 1000));

    return {
      livePriceStatus: data?.length ? "live" : "delayed",
      lastUpdateLabel: secondsAgo < 2 ? "just now" : `${secondsAgo}s ago`,
      dataSource: "Binance",
      aiStatus: "live",
      communityStatus: "live",
      websocketStatus: stream?.status ?? "reconnecting"
    } satisfies DataHealth;
  }, [data, queryClient]);

  const items = [
    ["Live price status", health.livePriceStatus],
    ["Last update", health.lastUpdateLabel],
    ["Data source", health.dataSource],
    ["AI status", health.aiStatus],
    ["Community", health.communityStatus],
    ["WebSocket", health.websocketStatus]
  ];

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <p className="text-xs uppercase tracking-[0.24em] text-white/40">System status</p>
      <h2 className="mt-2 text-2xl font-semibold text-white">Live data and platform health</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-[1.25rem] border border-white/10 bg-[#0d1224] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/38">{label}</p>
            <p className="mt-2 text-sm font-medium text-white">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
