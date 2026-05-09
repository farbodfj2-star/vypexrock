"use client";

import { BrainCircuit } from "lucide-react";

import { cn } from "@/lib/utils";

const loadingSteps = [
  "Reading price action...",
  "Mapping liquidity zones...",
  "Detecting structure...",
  "Calculating invalidation level...",
  "Building projected candle path...",
  "Preparing trade briefing..."
];

export function ChartAnalysisLoadingOverlay({ isDark = false }: { isDark?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      <div
        className={cn(
          "absolute inset-0 backdrop-blur-[20px]",
          isDark ? "bg-slate-950/66" : "bg-white/66"
        )}
      />
      <div className="absolute inset-0 chart-ai-noise" />
      <div className="absolute inset-0 chart-premium-glow" />
      <div className="absolute inset-y-0 left-[-18%] w-[18%] chart-analysis-scanline bg-gradient-to-r from-transparent via-sky-300/55 to-transparent" />
      <div className="absolute inset-x-0 top-1/2 mx-auto flex max-w-md -translate-y-1/2 flex-col items-center px-6 text-center">
        <div
          className={cn(
            "mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border shadow-2xl chart-floating-panel",
            isDark
              ? "border-white/15 bg-white/10 text-sky-100 shadow-sky-950/40"
              : "border-white/80 bg-white/70 text-blue-700 shadow-slate-300/60"
          )}
        >
          <BrainCircuit className="h-7 w-7 chart-analysis-pulse" />
        </div>
        <h3 className={cn("text-xl font-semibold tracking-tight chart-glow-text", isDark ? "text-white" : "text-slate-950")}>
          Vypexrock AI is analyzing the chart...
        </h3>
        <p className={cn("mt-2 text-sm", isDark ? "text-slate-300" : "text-slate-600")}>
          Building a risk-managed scenario from live structure and selected context.
        </p>
        <div className="mt-6 grid w-full gap-2">
          {loadingSteps.map((step, index) => (
            <div
              key={step}
              className={cn(
                "chart-loading-step rounded-full border px-4 py-2 text-sm shadow-sm",
                isDark
                  ? "border-white/10 bg-white/[0.08] text-slate-200"
                  : "border-white/80 bg-white/70 text-slate-700"
              )}
              style={{ animationDelay: `${index * 240}ms` }}
            >
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
