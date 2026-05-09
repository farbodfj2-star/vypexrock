"use client";

import type { ReactNode } from "react";
import { BrainCircuit } from "lucide-react";

import { ChartUpload } from "@/components/chart-upload";
import { cn } from "@/lib/utils";

const strategyOptions = [
  "Smart Money Concepts",
  "Momentum Scalper",
  "Swing Reversal",
  "Trend Continuation",
  "Breakout Retest",
  "Custom Strategy"
];

const timeframeOptions = ["1s", "1m", "5m", "15m", "30m", "1H", "4H", "1D", "1W"];
const indicatorOptions = ["RSI", "MACD", "EMA 20/50", "VWAP", "Bollinger Bands", "ATR", "Supertrend", "Volume"];

type ChartAnalyzerFormProps = {
  strategy: string;
  setStrategy: (value: string) => void;
  selectedTimeframes: string[];
  onToggleTimeframe: (value: string) => void;
  selectedIndicators: string[];
  onToggleIndicator: (value: string) => void;
  expertMode: boolean;
  setExpertMode: (value: boolean) => void;
  prompt: string;
  setPrompt: (value: string) => void;
  onUpload: (file: File | null, previewUrl: string | null) => void;
  isDark?: boolean;
};

export function ChartAnalyzerForm({
  strategy,
  setStrategy,
  selectedTimeframes,
  onToggleTimeframe,
  selectedIndicators,
  onToggleIndicator,
  expertMode,
  setExpertMode,
  prompt,
  setPrompt,
  onUpload,
  isDark = false
}: ChartAnalyzerFormProps) {
  return (
    <section className={cn("chart-glass-card p-4", isDark ? "text-slate-100" : "text-slate-900")}>
      <div className="flex items-center justify-between gap-3">
        <h2 className={cn("text-sm font-semibold", isDark ? "text-slate-50" : "text-slate-950")}>AI Trade Analysis</h2>
        <button
          type="button"
          onClick={() => setExpertMode(!expertMode)}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 text-xs font-medium transition hover:-translate-y-0.5",
            expertMode
              ? isDark
                ? "bg-blue-400/16 text-blue-100 shadow-[0_0_18px_rgba(96,165,250,0.18)]"
                : "bg-blue-50/90 text-blue-700 shadow-[0_8px_20px_rgba(59,130,246,0.12)]"
              : isDark
                ? "bg-white/[0.05] text-slate-300"
                : "bg-white/55 text-slate-600"
          )}
        >
          <BrainCircuit className="h-3.5 w-3.5" />
          Expert
        </button>
      </div>

      <div className="mt-4 space-y-4">
        <Field label="Strategy Set">
          <select
            value={strategy}
            onChange={(event) => setStrategy(event.target.value)}
            className={cn(
              "w-full rounded-2xl px-3 py-2 text-sm outline-none backdrop-blur-xl focus:ring-2 focus:ring-blue-400/30",
              isDark ? "bg-white/[0.06] text-slate-100" : "bg-white/70 text-slate-900"
            )}
          >
            {strategyOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Multiple Timeframes">
          <div className="flex flex-wrap gap-2">
            {timeframeOptions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onToggleTimeframe(item)}
                className={cn(
                  "rounded-full px-2.5 py-1.5 text-xs font-medium transition",
                  selectedTimeframes.includes(item)
                    ? isDark
                      ? "bg-blue-400/16 text-blue-100 shadow-[0_0_18px_rgba(96,165,250,0.16)]"
                      : "bg-blue-50/90 text-blue-700"
                    : isDark
                      ? "bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
                      : "bg-white/55 text-slate-600 hover:bg-white/90"
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Indicators">
          <div className="flex flex-wrap gap-2">
            {indicatorOptions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onToggleIndicator(item)}
                className={cn(
                  "rounded-full px-2.5 py-1.5 text-xs font-medium transition",
                  selectedIndicators.includes(item)
                    ? isDark
                      ? "bg-white text-slate-950 shadow-[0_0_20px_rgba(255,255,255,0.14)]"
                      : "bg-slate-950 text-white"
                    : isDark
                      ? "bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
                      : "bg-white/55 text-slate-600 hover:bg-white/90"
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Custom Prompt & Knowledge">
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Add your custom rules, bias, risk model, or chart context here..."
            className={cn(
              "h-24 w-full rounded-2xl px-3 py-2 text-sm leading-6 outline-none backdrop-blur-xl placeholder:text-slate-400 focus:ring-2 focus:ring-blue-400/30",
              isDark ? "bg-white/[0.06] text-slate-100" : "bg-white/70 text-slate-900"
            )}
          />
        </Field>

        <Field label="Upload Chart Image">
          <ChartUpload onFileChange={onUpload} isDark={isDark} />
        </Field>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase text-slate-500">{label}</p>
      {children}
    </div>
  );
}
