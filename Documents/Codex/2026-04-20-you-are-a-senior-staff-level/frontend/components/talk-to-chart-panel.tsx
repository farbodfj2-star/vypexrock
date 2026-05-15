"use client";

import { FormEvent, KeyboardEvent, useMemo, useState } from "react";
import { Bot, LoaderCircle, MessageSquareText, SendHorizonal, Sparkles, User2 } from "lucide-react";

import { apiFetch } from "@/lib/api";
import type { ChartAnalysisResult } from "@/lib/mock-chart-analysis";
import { cn } from "@/lib/utils";
import type { AiChatResponse, AiMessage } from "@/types";

const promptChips = [
  "Where is the safest entry?",
  "Is this a fake breakout?",
  "Where is liquidity?",
  "Should I long or short?",
  "What invalidates this idea?",
  "What would a professional trader do?"
];

export function TalkToChartPanel({
  symbol,
  timeframe,
  analysis,
  promptContext,
  hasUploadedChart,
  isDark
}: {
  symbol: string;
  timeframe: string;
  analysis: ChartAnalysisResult | null;
  promptContext: string;
  hasUploadedChart: boolean;
  isDark: boolean;
}) {
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Upload or select a chart, then ask me about entries, liquidity, invalidation, or whether the setup is worth trading. I will stay probability-based and risk-aware."
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const contextSummary = useMemo(() => {
    if (!analysis) return `Chart context: ${symbol} on ${timeframe}. No structured analysis has been generated yet.`;
    return [
      `Chart context: ${symbol} on ${timeframe}.`,
      `Decision: ${analysis.decision}. Bias: ${analysis.bias}. Confidence: ${analysis.confidence}%.`,
      `Entry zone: ${analysis.entryZone.low} to ${analysis.entryZone.high}. Stop loss: ${analysis.stopLoss}. TP levels: ${analysis.takeProfits.join(", ")}.`,
      `Invalidation: ${analysis.invalidationLevel}.`,
      `Current custom context: ${promptContext || "none"}.`,
      hasUploadedChart ? "The user also uploaded a chart screenshot reference." : "No uploaded chart screenshot is attached."
    ].join("\n");
  }, [analysis, hasUploadedChart, promptContext, symbol, timeframe]);

  async function sendQuestion(question: string) {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    const userMessage: AiMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await apiFetch<AiChatResponse>("/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          mode: "long",
          message: [
            "You are Vypexrock AI, a professional trading chart assistant.",
            "Answer the user's chart question with specific market-structure reasoning.",
            "Never guarantee profit. Prefer wait/no-trade when confirmation is weak.",
            contextSummary,
            `User question: ${trimmed}`
          ].join("\n\n"),
          history: messages.slice(-6).map((message) => ({
            role: message.role,
            content: message.content
          }))
        })
      });

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now() + 1}`,
          role: "assistant",
          content: response.answer,
          status: response.used_live_ai ? "live" : "fallback",
          sources: response.sources
        }
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now() + 1}`,
          role: "assistant",
          content: buildFallbackChartAnswer(trimmed, analysis, symbol, timeframe),
          status: "fallback"
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void sendQuestion(input);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      void sendQuestion(input);
    }
  }

  return (
    <section className={cn("chart-glass-card overflow-hidden p-4", isDark ? "text-slate-100" : "text-slate-900")}>
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300/18 to-violet-500/18 text-cyan-100">
          <MessageSquareText className="h-4 w-4" />
        </span>
        <div>
          <p className={cn("text-xs uppercase tracking-[0.24em]", isDark ? "text-slate-400" : "text-slate-500")}>Talk to the Chart</p>
          <h3 className={cn("text-lg font-semibold", isDark ? "text-white" : "text-slate-950")}>Ask Vypexrock AI</h3>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {promptChips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => void sendQuestion(chip)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition hover:-translate-y-0.5",
              isDark ? "bg-white/[0.06] text-white/70 hover:bg-cyan-300/12 hover:text-cyan-100" : "bg-white/70 text-slate-600 hover:bg-cyan-50 hover:text-cyan-700"
            )}
          >
            {chip}
          </button>
        ))}
      </div>

      <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
        {messages.map((message) => (
          <div key={message.id} className={cn("flex gap-2", message.role === "user" ? "justify-end" : "justify-start")}>
            {message.role === "assistant" ? (
              <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-cyan-300/12 text-cyan-100">
                <Bot className="h-3.5 w-3.5" />
              </span>
            ) : null}
            <div
              className={cn(
                "max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-6",
                message.role === "user"
                  ? "bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950"
                  : isDark
                    ? "bg-white/[0.055] text-white/70"
                    : "bg-white/80 text-slate-700"
              )}
            >
              {message.content}
            </div>
            {message.role === "user" ? (
              <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/[0.08] text-white/70">
                <User2 className="h-3.5 w-3.5" />
              </span>
            ) : null}
          </div>
        ))}
        {loading ? (
          <div className="flex items-center gap-2 rounded-2xl bg-white/[0.055] px-3 py-2 text-sm text-white/58">
            <Sparkles className="h-4 w-4 animate-pulse text-cyan-200" />
            Reading chart context...
          </div>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about liquidity, entry, invalidation..."
          className={cn(
            "min-w-0 flex-1 rounded-2xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-cyan-300/25",
            isDark ? "bg-white/[0.06] text-white placeholder:text-white/32" : "bg-white/75 text-slate-900 placeholder:text-slate-400"
          )}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-violet-500 text-slate-950 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Ask chart question"
        >
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
        </button>
      </form>
    </section>
  );
}

function buildFallbackChartAnswer(question: string, analysis: ChartAnalysisResult | null, symbol: string, timeframe: string) {
  const lower = question.toLowerCase();
  const decision = analysis?.decision ?? "Neutral / Wait";
  const entry = analysis ? `${analysis.entryZone.low}-${analysis.entryZone.high}` : "wait for a clean retest zone";
  const invalidation = analysis?.invalidationLevel ?? "the nearest structure break";

  if (lower.includes("name")) return "I'm Vypexrock AI.";
  if (lower.includes("long") || lower.includes("short")) {
    return `${symbol} on ${timeframe} is currently a ${decision} read. I would not force execution without confirmation. The safer plan is to wait for price to accept around ${entry}, then invalidate the idea if price breaks ${invalidation}.`;
  }
  if (lower.includes("liquidity") || lower.includes("fake")) {
    return `The main liquidity question is whether the latest move is acceptance or a sweep. If price quickly returns inside the prior range, treat it as fake-breakout risk. A cleaner setup needs follow-through plus volume, not just one impulse candle.`;
  }
  if (lower.includes("entry")) {
    return `The safer entry is not a blind market order. Use the entry zone around ${entry} and require confirmation from a reclaim, rejection wick, or retest. If price is already extended, wait for pullback.`;
  }
  return `My read is ${decision}. The professional approach is to define confirmation first, then risk. Use ${invalidation} as the line where the idea is wrong, and avoid entering if the chart is still choppy or late after a large candle.`;
}
