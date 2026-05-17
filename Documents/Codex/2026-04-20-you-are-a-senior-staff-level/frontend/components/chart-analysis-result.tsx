"use client";

import type { ReactNode } from "react";
import { Download, FilePlus2, Save, ShieldPlus } from "lucide-react";

import type { ChartAnalysisResult } from "@/lib/mock-chart-analysis";
import { formatCurrency } from "@/lib/utils";

export function ChartAnalysisResult({
  analysis,
  isDark = false,
  compact = false
}: {
  analysis: ChartAnalysisResult | null;
  isDark?: boolean;
  compact?: boolean;
}) {
  if (!analysis) {
    return (
      <div className={cardClass(isDark, compact)}>
        <p className={titleClass(isDark)}>Trade Decision</p>
        <p className={mutedClass(isDark)}>Run an analysis to populate the decision, setup levels, explanation, and indicator context.</p>
      </div>
    );
  }

  const entry = (analysis.entryZone.low + analysis.entryZone.high) / 2;
  const recommendation = buildPositionRecommendation(analysis);

  return (
    <div className="space-y-3">
      {analysis.chartImageUrl || analysis.analyzedChartImageUrl ? (
        <Card title="Chart workstation" isDark={isDark} compact={compact}>
          <div className="space-y-4">
            {analysis.chartImageUrl ? (
              <figure>
                <figcaption className={isDark ? "mb-2 text-xs uppercase tracking-widest text-slate-400" : "mb-2 text-xs uppercase tracking-widest text-slate-500"}>
                  Live market chart
                </figcaption>
                <img src={analysis.chartImageUrl} alt={`${analysis.symbol} base chart`} className="w-full rounded-2xl border border-white/10" />
              </figure>
            ) : null}
            {analysis.analyzedChartImageUrl ? (
              <figure>
                <figcaption className={isDark ? "mb-2 text-xs uppercase tracking-widest text-slate-400" : "mb-2 text-xs uppercase tracking-widest text-slate-500"}>
                  AI structure overlay · projected path
                </figcaption>
                <img src={analysis.analyzedChartImageUrl} alt={`${analysis.symbol} analyzed chart`} className="w-full rounded-2xl border border-cyan-400/20" />
              </figure>
            ) : null}
            {analysis.marketStructure ? (
              <p className={isDark ? "text-sm text-slate-300" : "text-sm text-slate-600"}>
                Structure: <span className="font-medium">{analysis.marketStructure}</span>
                {analysis.timeframeAlignment ? ` · ${analysis.timeframeAlignment}` : ""}
              </p>
            ) : null}
            {analysis.structureNotes?.length ? (
              <ul className={isDark ? "list-disc space-y-1 pl-5 text-sm text-slate-300" : "list-disc space-y-1 pl-5 text-sm text-slate-600"}>
                {analysis.structureNotes.slice(0, 4).map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </Card>
      ) : null}

      <Card title="Trade Decision" isDark={isDark} compact={compact}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={isDark ? "text-xl font-semibold text-slate-50" : "text-xl font-semibold text-slate-950"}>{analysis.decision}</p>
            <p className={isDark ? "mt-2 text-sm leading-6 text-slate-300" : "mt-2 text-sm leading-6 text-slate-600"}>{shortDecisionText(analysis)}</p>
          </div>
          <ConfidenceRing value={analysis.confidence} isDark={isDark} />
        </div>
      </Card>

      <Card title="Should I Open a Position?" isDark={isDark} compact={compact}>
        <div className={`rounded-2xl px-3 py-3 shadow-sm backdrop-blur-xl ${recommendation.className}`}>
          <p className="text-base font-semibold">{recommendation.title}</p>
          <p className="mt-1 text-sm leading-6">{recommendation.reason}</p>
        </div>
      </Card>

      <Card title="Trade Setup" isDark={isDark} compact={compact}>
        <div className="grid grid-cols-2 gap-3">
          {analysis.bias === "neutral" ? (
            <>
              <SetupMetric label="Watch Zone" value={formatCurrency(entry)} tone="entry" />
              <SetupMetric label="Support" value={formatCurrency(analysis.supportLevels[0])} tone="target" />
              <SetupMetric label="Resistance" value={formatCurrency(analysis.resistanceLevels[0])} tone="stop" />
              <SetupMetric label="Risk/Reward" value="No trade" tone="neutral" />
            </>
          ) : (
            <>
              <SetupMetric label="Entry" value={formatCurrency(entry)} tone="entry" />
              <SetupMetric label="Stop Loss" value={formatCurrency(analysis.stopLoss)} tone="stop" />
              <SetupMetric label="Take Profit" value={formatCurrency(analysis.takeProfits[0])} tone="target" />
              <SetupMetric label="Risk/Reward" value={analysis.riskReward} tone="neutral" />
            </>
          )}
        </div>
      </Card>

      <Card title="Explanation" isDark={isDark} compact={compact}>
        <p className={isDark ? "text-sm leading-6 text-slate-300" : "text-sm leading-6 text-slate-600"}>{analysis.explanation}</p>
        {analysis.keyMessage ? (
          <p className={isDark ? "mt-3 rounded border border-cyan-400/20 bg-cyan-400/[0.06] px-3 py-2 text-sm leading-6 text-cyan-200" : "mt-3 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm leading-6 text-blue-900"}>
            <strong>Key message: </strong>{analysis.keyMessage}
          </p>
        ) : null}
        <p className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900">{analysis.riskWarning}</p>
      </Card>

      {analysis.scenarios?.length ? (
        <Card title="Scenarios · what could happen next" isDark={isDark} compact={compact}>
          <div className="space-y-3">
            {analysis.scenarios.map((s) => (
              <div key={s.name} className={isDark ? "rounded-xl border border-white/[0.08] bg-white/[0.02] p-3" : "rounded-xl border border-slate-200 bg-white/70 p-3"}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className={isDark ? "text-sm font-semibold text-slate-100" : "text-sm font-semibold text-slate-900"}>{s.name}</p>
                  <span className={isDark ? "text-xs font-mono text-cyan-300" : "text-xs font-mono text-blue-700"}>{s.probability}% probability</span>
                </div>
                <p className={isDark ? "mt-2 text-xs leading-5 text-slate-400" : "mt-2 text-xs leading-5 text-slate-500"}><strong className={isDark ? "text-slate-200" : "text-slate-700"}>Trigger: </strong>{s.trigger}</p>
                <p className={isDark ? "mt-1 text-xs leading-5 text-slate-400" : "mt-1 text-xs leading-5 text-slate-500"}><strong className={isDark ? "text-slate-200" : "text-slate-700"}>Outcome: </strong>{s.outcome}</p>
                <p className={isDark ? "mt-1 text-xs leading-5 text-slate-400" : "mt-1 text-xs leading-5 text-slate-500"}><strong className={isDark ? "text-slate-200" : "text-slate-700"}>Invalidation: </strong>{s.invalidation}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {analysis.confluence?.length ? (
        <Card title="Confluence checklist" isDark={isDark} compact={compact}>
          <div className="space-y-2">
            {analysis.confluence.map((c) => (
              <div key={c.factor} className={isDark ? "flex items-start gap-3 border-t border-slate-800 pt-2 first:border-t-0 first:pt-0" : "flex items-start gap-3 border-t border-slate-100 pt-2 first:border-t-0 first:pt-0"}>
                <span
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                    c.status === "supportive"
                      ? "bg-emerald-400"
                      : c.status === "against"
                      ? "bg-rose-400"
                      : isDark
                      ? "bg-slate-500"
                      : "bg-slate-400"
                  }`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className={isDark ? "text-sm font-medium text-slate-100" : "text-sm font-medium text-slate-900"}>{c.factor}</p>
                  <p className={isDark ? "text-xs leading-5 text-slate-400" : "text-xs leading-5 text-slate-500"}>{c.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {analysis.expectedMove ? (
        <Card title="Expected move · time-window forecast" isDark={isDark} compact={compact}>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className={isDark ? "text-[11px] uppercase tracking-widest text-slate-500" : "text-[11px] uppercase tracking-widest text-slate-400"}>Window</p>
              <p className={isDark ? "mt-1 text-sm text-slate-100" : "mt-1 text-sm text-slate-900"}>{analysis.expectedMove.window}</p>
            </div>
            <div>
              <p className={isDark ? "text-[11px] uppercase tracking-widest text-slate-500" : "text-[11px] uppercase tracking-widest text-slate-400"}>Range</p>
              <p className={isDark ? "mt-1 text-sm font-mono text-cyan-200" : "mt-1 text-sm font-mono text-blue-700"}>{analysis.expectedMove.range}</p>
            </div>
            <div>
              <p className={isDark ? "text-[11px] uppercase tracking-widest text-slate-500" : "text-[11px] uppercase tracking-widest text-slate-400"}>Bias</p>
              <p className={isDark ? "mt-1 text-sm text-slate-100" : "mt-1 text-sm text-slate-900"}>{analysis.expectedMove.bias}</p>
            </div>
          </div>
        </Card>
      ) : null}

      {analysis.liquidityZones?.length ? (
        <Card title="Liquidity map" isDark={isDark} compact={compact}>
          <div className="space-y-2">
            {analysis.liquidityZones.map((z, i) => (
              <div key={i} className={isDark ? "flex items-center justify-between gap-3 border-t border-slate-800 pt-2 first:border-t-0 first:pt-0" : "flex items-center justify-between gap-3 border-t border-slate-100 pt-2 first:border-t-0 first:pt-0"}>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-mono uppercase tracking-widest ${z.type === "above" ? "text-emerald-400" : "text-rose-400"}`}>
                    {z.type === "above" ? "ABOVE" : "BELOW"}
                  </span>
                  <span className={isDark ? "text-sm text-slate-300" : "text-sm text-slate-600"}>{z.description}</span>
                </div>
                <span className={isDark ? "font-mono text-sm text-slate-100" : "font-mono text-sm text-slate-900"}>{formatNumDisplay(z.price)}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {analysis.positionSize ? (
        <Card title="Position sizing · 1% risk on $10k example" isDark={isDark} compact={compact}>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className={isDark ? "text-[11px] uppercase tracking-widest text-slate-500" : "text-[11px] uppercase tracking-widest text-slate-400"}>Risk</p>
              <p className={isDark ? "mt-1 text-sm font-mono text-slate-100" : "mt-1 text-sm font-mono text-slate-900"}>{analysis.positionSize.riskPercent}%</p>
            </div>
            <div>
              <p className={isDark ? "text-[11px] uppercase tracking-widest text-slate-500" : "text-[11px] uppercase tracking-widest text-slate-400"}>Position size</p>
              <p className={isDark ? "mt-1 text-sm font-mono text-slate-100" : "mt-1 text-sm font-mono text-slate-900"}>${analysis.positionSize.sizeUsd.toLocaleString()}</p>
            </div>
            <div>
              <p className={isDark ? "text-[11px] uppercase tracking-widest text-slate-500" : "text-[11px] uppercase tracking-widest text-slate-400"}>Leverage</p>
              <p className={isDark ? "mt-1 text-sm font-mono text-slate-100" : "mt-1 text-sm font-mono text-slate-900"}>{analysis.positionSize.estLeverage}</p>
            </div>
          </div>
        </Card>
      ) : null}

      {analysis.followUp?.length ? (
        <Card title="Follow-up actions" isDark={isDark} compact={compact}>
          <ul className={isDark ? "list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300" : "list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600"}>
            {analysis.followUp.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </Card>
      ) : null}

      <Card title="Indicators" isDark={isDark} compact={compact}>
        <div className={isDark ? "space-y-3 text-sm text-slate-300" : "space-y-3 text-sm text-slate-600"}>
          <IndicatorRow label="RSI" value={analysis.indicators.includes("RSI") ? `${typeof analysis.rsi === "number" ? `RSI ${analysis.rsi.toFixed(1)}: ` : ""}neutral momentum, no overbought extreme.` : "Not selected"} isDark={isDark} />
          <IndicatorRow label="MACD" value={analysis.indicators.includes("MACD") ? "Momentum is near the signal line; confirmation matters." : "Not selected"} isDark={isDark} />
          <IndicatorRow label="Bollinger" value="Price is rotating around the mid-band; wait for confirmation before acting." isDark={isDark} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <ActionButton icon={Save} label="Save Analysis" />
        <ActionButton icon={FilePlus2} label="Add Watchlist" />
        <ActionButton icon={ShieldPlus} label="Create Alert" />
        <ActionButton icon={Download} label="Export Summary" />
      </div>
    </div>
  );
}

function Card({ title, children, isDark, compact }: { title: string; children: ReactNode; isDark: boolean; compact: boolean }) {
  return (
    <section className={cardClass(isDark, compact)}>
      <h3 className={titleClass(isDark)}>{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function ConfidenceRing({ value, isDark }: { value: number; isDark: boolean }) {
  const angle = Math.max(0, Math.min(100, value)) * 3.6;
  return (
    <div
      className="grid h-14 w-14 shrink-0 place-items-center rounded-full chart-confidence-ring"
      style={{ background: `conic-gradient(from 180deg, #8b5cf6 0deg, #38bdf8 ${angle}deg, ${isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.10)"} ${angle}deg)` }}
    >
      <div className={isDark ? "grid h-10 w-10 place-items-center rounded-full bg-slate-950/88 text-[11px] font-semibold text-white" : "grid h-10 w-10 place-items-center rounded-full bg-white/90 text-[11px] font-semibold text-slate-900"}>
        {value}%
      </div>
    </div>
  );
}

function SetupMetric({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "entry" | "stop" | "target" | "neutral";
}) {
  const styles = {
    entry: "bg-blue-400/12 text-blue-700 shadow-[inset_0_0_0_1px_rgba(96,165,250,0.22)]",
    stop: "bg-rose-400/12 text-rose-700 shadow-[inset_0_0_0_1px_rgba(251,113,133,0.22)]",
    target: "bg-emerald-400/12 text-emerald-700 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.22)]",
    neutral: "bg-white/12 text-slate-800 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.2)]"
  }[tone];

  return (
    <div className={`rounded-2xl p-3 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 ${styles}`}>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}

function IndicatorRow({ label, value, isDark }: { label: string; value: string; isDark: boolean }) {
  return (
    <div className={`grid grid-cols-[84px_1fr] gap-3 border-t pt-3 first:border-t-0 first:pt-0 ${isDark ? "border-slate-800" : "border-slate-100"}`}>
      <p className={isDark ? "font-medium text-slate-100" : "font-medium text-slate-900"}>{label}</p>
      <p className="leading-6">{value}</p>
    </div>
  );
}

function ActionButton({ icon: Icon, label }: { icon: typeof Save; label: string }) {
  return (
    <button type="button" className="chart-glass-button inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700">
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function shortDecisionText(analysis: ChartAnalysisResult) {
  if (analysis.decision === "Strong Long") return "The 4H trend, 1H confirmation, and setup quality are aligned. Enter only if price confirms the entry zone.";
  if (analysis.decision === "Long only on confirmation") return "Upside is possible, but this is not a buy-now signal. Wait for price to confirm the entry zone first.";
  if (analysis.decision === "Strong Short") return "The 4H trend, 1H confirmation, and setup quality are aligned to the downside. The stop is invalidation.";
  if (analysis.decision === "Short only on confirmation") return "Downside is possible, but this is not a sell-now signal. Wait for rejection or breakdown confirmation first.";
  if (analysis.decision === "Neutral / Wait") return "No clean directional edge is present. Preserve capital until structure improves.";
  if (analysis.decision === "Long") return "Structure favors upside continuation only if entry support holds. The stop defines invalidation.";
  if (analysis.decision === "Short" || analysis.decision === "Neutral Sell") return "Structure favors a controlled sell scenario while price remains below the entry area.";
  if (analysis.decision === "Wait for confirmation") return "The setup is balanced. Wait for a cleaner reclaim or breakdown before taking risk.";
  return "No clean edge is present. Preserve capital until the chart gives a cleaner signal.";
}

function buildPositionRecommendation(analysis: ChartAnalysisResult) {
  if (analysis.decision === "Strong Long") {
    return {
      title: "Strong Long setup, still wait for trigger",
      reason: "The multi-timeframe read is aligned, but execution should still happen only inside the planned entry zone.",
      className: "bg-emerald-400/14 text-emerald-800 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.2)]"
    };
  }

  if (analysis.bias === "long" && analysis.confidence >= 55) {
    return {
      title: "Open Long only on confirmation",
      reason: "The live signal favors upside, but entry should wait for price to reclaim or hold the blue entry zone.",
      className: "bg-emerald-400/14 text-emerald-800 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.2)]"
    };
  }

  if (analysis.decision === "Strong Short") {
    return {
      title: "Strong Short setup, still wait for trigger",
      reason: "The multi-timeframe read is aligned to the downside. The red stop is the invalidation point.",
      className: "bg-rose-400/14 text-rose-800 shadow-[inset_0_0_0_1px_rgba(251,113,133,0.2)]"
    };
  }

  if (analysis.bias === "short" && analysis.confidence >= 55) {
    return {
      title: "Open Short only on confirmation",
      reason: "The live signal favors downside only if price rejects the entry zone or breaks lower. The red stop is invalidation.",
      className: "bg-rose-400/14 text-rose-800 shadow-[inset_0_0_0_1px_rgba(251,113,133,0.2)]"
    };
  }

  return {
    title: "Wait. No clean position yet",
    reason: "The current read is not strong enough for a confident long or short. Let price confirm first.",
    className: "bg-amber-300/16 text-amber-900 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.22)]"
  };
}

function cardClass(isDark: boolean, compact = false) {
  return `chart-glass-card ${compact ? "p-3" : "p-4"} ${isDark ? "text-slate-100" : "text-slate-900"}`;
}

function titleClass(isDark: boolean) {
  return isDark ? "text-sm font-semibold text-slate-50" : "text-sm font-semibold text-slate-950";
}

function mutedClass(isDark: boolean) {
  return isDark ? "mt-2 text-sm leading-6 text-slate-300" : "mt-2 text-sm leading-6 text-slate-500";
}

function formatNumDisplay(v: number) {
  if (v >= 1000) return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (v >= 100) return v.toFixed(2);
  if (v >= 1) return v.toFixed(3);
  return v.toFixed(5);
}
