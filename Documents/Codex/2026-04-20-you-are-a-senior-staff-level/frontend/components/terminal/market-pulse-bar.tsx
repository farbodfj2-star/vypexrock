"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchMarketPulse } from "@/lib/market-pulse";
import { cn } from "@/lib/utils";

export function MarketPulseBar() {
  const { data } = useQuery({
    queryKey: ["market-pulse"],
    queryFn: fetchMarketPulse,
    staleTime: 60_000,
    refetchInterval: 90_000
  });

  if (!data) return <div className="vx-skeleton h-20 w-full rounded-2xl" />;

  return (
    <section className="vx-glass-panel grid gap-3 p-4 md:grid-cols-4">
      <PulseTile label="Fear / Greed" value={`${data.fear_greed}`} sub={data.fear_greed_label} tone={data.fear_greed >= 55 ? "emerald" : data.fear_greed <= 45 ? "rose" : "slate"} />
      <PulseTile label="BTC dominance" value={`${data.btc_dominance.toFixed(1)}%`} sub="Volume-weighted proxy" tone="cyan" />
      <PulseTile label="Session vol" value={`${data.session_volatility.toFixed(2)}%`} sub="Cross-asset 24h" tone="violet" />
      <PulseTile label="Market bias" value={data.market_bias} sub="Live desk state" tone="amber" />
    </section>
  );
}

function PulseTile({
  label,
  value,
  sub,
  tone
}: {
  label: string;
  value: string;
  sub: string;
  tone: "emerald" | "rose" | "cyan" | "violet" | "amber" | "slate";
}) {
  const ring = {
    emerald: "border-emerald-400/20 text-emerald-200",
    rose: "border-rose-400/20 text-rose-200",
    cyan: "border-cyan-400/20 text-cyan-200",
    violet: "border-violet-400/20 text-violet-200",
    amber: "border-amber-400/20 text-amber-200",
    slate: "border-white/10 text-white/80"
  }[tone];

  return (
    <div className={cn("rounded-xl border bg-black/20 px-4 py-3", ring)}>
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">{label}</p>
      <p className="mt-1 text-xl font-semibold capitalize">{value}</p>
      <p className="mt-1 text-xs text-white/45">{sub}</p>
    </div>
  );
}
