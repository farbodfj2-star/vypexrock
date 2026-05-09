"use client";

import { AlertTriangle, CheckCircle2, Gauge, Shield, Target, TrendingDown, TrendingUp } from "lucide-react";

import { displayAssetLabel, getAsset } from "@/lib/asset-catalog";
import { scoreCoinDetail, type MarketSignalScore } from "@/lib/market-signals";
import { cn, formatCurrency } from "@/lib/utils";
import type { CoinDetail } from "@/types";

type AnalysisWorkbenchProps = {
  detail: CoinDetail;
  interval: string;
};

export function AnalysisWorkbench({ detail, interval }: AnalysisWorkbenchProps) {
  const score = scoreCoinDetail(detail);
  const signal = detail.signals[0];
  const wait = score.direction === "wait";
  const liveSource = getAsset(detail.symbol)?.liveSource;

  return (
    <aside className="space-y-4">
      <section className="rounded-[2rem] border border-white/10 bg-[#090b11]/88 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-white/38">Trade decision</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">{score.decision}</h2>
            <p className="mt-2 text-sm text-white/48">{displayAssetLabel(detail.symbol)} · {interval} · {liveSource === "fallback" ? "Structured fallback" : "Live market feed"}</p>
          </div>
          <ConfidencePill score={score} />
        </div>

        <div className="mt-5 rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-white/38">Should I take this?</p>
          <div className="mt-3 flex items-center gap-2">
            {score.direction === "long" ? <TrendingUp className="h-5 w-5 text-emerald-300" /> : score.direction === "short" ? <TrendingDown className="h-5 w-5 text-rose-300" /> : <AlertTriangle className="h-5 w-5 text-amber-200" />}
            <p className="font-semibold text-white">{score.shortText}</p>
          </div>
          <p className="mt-3 text-sm leading-7 text-white/62">{score.reason}</p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-white">
          <Target className="h-4 w-4 text-cyan-200" />
          <h3 className="text-lg font-semibold">{wait ? "Trigger Levels" : "Trade Setup"}</h3>
        </div>
        {wait ? (
          <div className="mt-4 grid gap-3">
            <SetupCard label="Long above" value={formatCurrency(score.longAbove)} tone="entry" />
            <SetupCard label="Short below" value={formatCurrency(score.shortBelow)} tone="stop" />
            <SetupCard label="No trade zone" value={`${formatCurrency(score.shortBelow)} - ${formatCurrency(score.longAbove)}`} tone="neutral" />
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <SetupCard label="Entry zone" value={`${formatCurrency(score.entryLow)} - ${formatCurrency(score.entryHigh)}`} tone="entry" />
            <SetupCard label="Stop loss" value={formatCurrency(score.stopLoss ?? score.invalidation)} tone="stop" />
            <SetupCard label="TP1" value={formatCurrency(score.takeProfit1 ?? score.longAbove)} tone="target" />
            <SetupCard label="TP2 / TP3" value={`${formatCurrency(score.takeProfit2 ?? score.longAbove)} / ${formatCurrency(score.takeProfit3 ?? score.longAbove)}`} tone="target" />
          </div>
        )}
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric icon={Gauge} label="Risk / Reward" value={score.riskReward} />
          <Metric icon={Shield} label="Invalidation" value={formatCurrency(score.invalidation)} />
          <Metric icon={CheckCircle2} label="Structure" value={score.structure.replace("-", " ")} />
          <Metric icon={Gauge} label="Volatility" value={formatCurrency(score.volatility)} />
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.24em] text-white/38">Key reason</p>
        <p className="mt-3 text-sm leading-7 text-white/62">
          {assetSpecificReason(detail, score)}
        </p>
      </section>

      <section className="rounded-[1.6rem] border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-7 text-amber-100">
        This is probability-based market research, not financial advice. Use confirmation, invalidation, and position sizing before entering any trade.
      </section>

      {signal ? (
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.24em] text-white/38">Technical indicators</p>
          <div className="mt-4 grid gap-3">
            <Indicator label="RSI" value={signal.rsi.toFixed(1)} />
            <Indicator label="EMA 20 / 50" value={`${formatCurrency(signal.ema20)} / ${formatCurrency(signal.ema50)}`} />
            <Indicator label="MACD" value={`${signal.macd.toFixed(4)} vs ${signal.macd_signal.toFixed(4)}`} />
          </div>
        </section>
      ) : null}
    </aside>
  );
}

function ConfidencePill({ score }: { score: MarketSignalScore }) {
  const tone =
    score.direction === "long"
      ? "from-emerald-400/20 text-emerald-100"
      : score.direction === "short"
        ? "from-rose-400/20 text-rose-100"
        : "from-amber-300/16 text-amber-100";

  return (
    <div className={cn("rounded-2xl border border-white/10 bg-gradient-to-br to-white/[0.04] px-4 py-3 text-right", tone)}>
      <p className="text-xs uppercase tracking-[0.2em] text-white/42">Confidence</p>
      <p className="mt-1 text-2xl font-semibold">{score.confidence}%</p>
    </div>
  );
}

function SetupCard({ label, value, tone }: { label: string; value: string; tone: "entry" | "stop" | "target" | "neutral" }) {
  const styles = {
    entry: "border-cyan-300/16 bg-cyan-300/8 text-cyan-100",
    stop: "border-rose-300/16 bg-rose-300/8 text-rose-100",
    target: "border-emerald-300/16 bg-emerald-300/8 text-emerald-100",
    neutral: "border-white/10 bg-white/[0.04] text-white"
  }[tone];

  return (
    <div className={cn("rounded-[1.25rem] border p-4", styles)}>
      <p className="text-xs uppercase tracking-[0.2em] opacity-60">{label}</p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Gauge; label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white/10 bg-[#0d1017] p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/38">
        <Icon className="h-4 w-4 text-cyan-200" />
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold capitalize text-white">{value}</p>
    </div>
  );
}

function Indicator({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1.2rem] border border-white/10 bg-[#0d1017] px-4 py-3">
      <span className="text-sm text-white/55">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

function assetSpecificReason(detail: CoinDetail, score: MarketSignalScore) {
  const name = detail.ticker.metadata_name ?? displayAssetLabel(detail.symbol);
  if (score.direction === "long") {
    return `${name} is showing improving momentum with a ${score.structure.replace("-", " ")} profile. The long scenario is only valid while price respects the entry zone and invalidation remains untouched.`;
  }
  if (score.direction === "short") {
    return `${name} is showing weaker pressure with sellers controlling the current structure. The short scenario is strongest below resistance and invalidates if price reclaims ${formatCurrency(score.invalidation)}.`;
  }
  return `${name} is balanced right now. Vypexrock is showing trigger levels instead of forcing a trade: long above ${formatCurrency(score.longAbove)}, short below ${formatCurrency(score.shortBelow)}, and no trade between them.`;
}
