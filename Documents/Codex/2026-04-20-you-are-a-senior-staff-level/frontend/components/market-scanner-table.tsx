import { ArrowRight, Flame, ShieldAlert } from "lucide-react";
import Link from "next/link";

import { ConfidenceMeter } from "@/components/confidence-meter";
import { RiskBadge } from "@/components/risk-badge";
import type { ScannerOpportunity } from "@/lib/trading-os-data";
import { cn } from "@/lib/utils";

export function MarketScannerTable({ opportunities, loading = false }: { opportunities: ScannerOpportunity[]; loading?: boolean }) {
  return (
    <div className="vx-glass-panel overflow-hidden">
      <div className="hidden grid-cols-[0.8fr_0.5fr_0.7fr_0.8fr_1.2fr_1fr_auto] gap-3 border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.18em] text-white/35 xl:grid">
        <span>Asset</span>
        <span>Tier</span>
        <span>Direction</span>
        <span>Confidence</span>
        <span>Trigger</span>
        <span>Risk</span>
        <span />
      </div>

      <div className="divide-y divide-white/10">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => <div key={index} className="vx-skeleton m-4 h-16" />)
          : null}
        {!loading &&
          opportunities.map((item) => (
          <Link
            key={`${item.symbol}-${item.tier}`}
            href={`/coin/${item.symbol}`}
            className="grid gap-4 px-4 py-4 transition hover:bg-white/[0.035] xl:grid-cols-[0.8fr_0.5fr_0.7fr_0.8fr_1.2fr_1fr_auto] xl:items-center"
          >
            <div>
              <p className="font-semibold text-white">{item.symbol}</p>
              <p className="mt-1 text-xs text-white/42">{item.timeframe} scanner</p>
            </div>
            <TierBadge tier={item.tier} />
            <div className={cn("inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold", item.direction === "Long" ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100" : item.direction === "Short" ? "border-rose-300/20 bg-rose-400/10 text-rose-100" : "border-white/10 bg-white/[0.04] text-white/62")}>
              {item.direction === "Wait" ? <ShieldAlert className="h-3.5 w-3.5" /> : <Flame className="h-3.5 w-3.5" />}
              {item.direction}
            </div>
            <ConfidenceMeter value={item.confidence} compact />
            <div>
              <p className="text-sm font-medium text-white/84">{item.trigger}</p>
              <p className="mt-1 text-xs leading-5 text-white/44">{item.structure}</p>
            </div>
            <div className="space-y-2">
              <RiskBadge value={item.risk} />
              <p className="text-xs leading-5 text-white/45">{item.note}</p>
            </div>
            <ArrowRight className="hidden h-4 w-4 text-white/35 xl:block" />
          </Link>
          ))}
      </div>
    </div>
  );
}

function TierBadge({ tier }: { tier: ScannerOpportunity["tier"] }) {
  const styles =
    tier === "S Tier"
      ? "border-cyan-300/30 bg-cyan-300/12 text-cyan-100"
      : tier === "A Tier"
        ? "border-violet-300/30 bg-violet-400/12 text-violet-100"
        : tier === "B Tier"
          ? "border-amber-300/30 bg-amber-300/12 text-amber-100"
          : tier === "Watchlist"
            ? "border-white/10 bg-white/[0.04] text-white/62"
            : "border-rose-300/20 bg-rose-400/10 text-rose-100";
  return <span className={cn("w-fit rounded-full border px-3 py-1 text-xs font-bold", styles)}>{tier}</span>;
}
