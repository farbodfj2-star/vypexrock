"use client";

import type { ReactNode } from "react";

import type { ChartAnalysisResult } from "@/lib/mock-chart-analysis";

export function InstitutionalChartStack({
  analysis,
  uploadedPreviewUrl
}: {
  analysis: ChartAnalysisResult | null;
  uploadedPreviewUrl: string | null;
}) {
  if (!analysis && !uploadedPreviewUrl) return null;

  return (
    <section className="vx-institutional-stack space-y-4">
      <header>
        <p className="vx-eyebrow">Institutional workstation</p>
        <h2 className="mt-2 text-xl font-semibold text-white">Original vs AI-analyzed chart</h2>
        <p className="mt-1 text-sm text-white/50">Uploaded reference, live market structure, then annotated scenario with probabilistic path.</p>
      </header>

      {uploadedPreviewUrl ? (
        <ChartPanel title="Original upload" subtitle="User-provided reference frame">
          <img src={uploadedPreviewUrl} alt="Uploaded chart" className="w-full rounded-2xl border border-white/10" />
        </ChartPanel>
      ) : null}

      {analysis?.chartImageUrl ? (
        <ChartPanel title="Live market structure" subtitle="Pre-analysis candlestick chart">
          <img src={analysis.chartImageUrl} alt="Base chart" className="w-full rounded-2xl border border-white/10" />
        </ChartPanel>
      ) : null}

      {analysis?.analyzedChartImageUrl ? (
        <ChartPanel title="AI institutional overlay" subtitle="TP · SL · entry · OB · FVG · projected path">
          <img src={analysis.analyzedChartImageUrl} alt="Analyzed chart" className="w-full rounded-2xl border border-cyan-400/20 shadow-[0_0_60px_rgba(34,211,238,0.08)]" />
        </ChartPanel>
      ) : null}
    </section>
  );
}

function ChartPanel({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <article className="vx-glass-panel overflow-hidden p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-white/40">{subtitle}</p>
      <h3 className="mt-1 text-base font-semibold text-white">{title}</h3>
      <div className="mt-3">{children}</div>
    </article>
  );
}
