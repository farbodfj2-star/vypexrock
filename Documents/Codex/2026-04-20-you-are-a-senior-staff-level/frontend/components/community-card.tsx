import Link from "next/link";
import { CandlestickChart, ExternalLink, MessageCircle, ThumbsUp } from "lucide-react";

import { formatCurrency } from "@/lib/utils";
import type { CommunityIdea, MarketTicker } from "@/types";

export function CommunityCard({ idea, liveTicker }: { idea: CommunityIdea; liveTicker?: MarketTicker }) {
  const biasStyles =
    idea.bias === "long"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : idea.bias === "short"
        ? "border-rose-400/20 bg-rose-400/10 text-rose-300"
        : "border-cyan-400/20 bg-cyan-400/10 text-cyan-200";

  const chartSymbol = idea.symbol === "XAUUSD" ? "OANDA:XAUUSD" : `BINANCE:${idea.symbol}`;
  const tradingViewChartHref = `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(chartSymbol)}`;
  const credibility = getCredibility(idea.boosts, idea.comments);
  const authorWinRate = Math.min(81, 48 + Math.round(Math.log10(Math.max(10, idea.boosts + idea.comments)) * 12));

  return (
    <article className="overflow-hidden rounded-[1.9rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(245,200,74,0.08),_transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
      {idea.imageUrl ? (
        <div className="border-b border-white/10 bg-black/15 p-3">
          <img src={idea.imageUrl} alt={idea.title} className="h-[260px] w-full rounded-[1.3rem] object-cover" />
        </div>
      ) : null}

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/65">{idea.symbol}</span>
              <span className={`rounded-full border px-3 py-1.5 text-xs font-medium ${biasStyles}`}>{idea.bias.toUpperCase()}</span>
              {liveTicker ? (
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100">
                  Live {formatCurrency(liveTicker.price)} | {liveTicker.change_24h >= 0 ? "+" : ""}
                  {liveTicker.change_24h.toFixed(2)}%
                </span>
              ) : null}
            </div>

            <h3 className="mt-4 text-2xl font-semibold text-white">{idea.title}</h3>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/45">
              {idea.authorUrl ? (
                <Link href={idea.authorUrl} target="_blank" rel="noreferrer" className="transition hover:text-white">
                  {idea.author}
                </Link>
              ) : (
                <span>{idea.author}</span>
              )}
              <span>•</span>
              <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[11px] font-medium text-amber-100">
                {credibility}
              </span>
              <span>•</span>
              <span>{authorWinRate}% author win rate</span>
              <span>•</span>
              <span>{formatPostedAt(idea.postedAt)}</span>
              <span>•</span>
              <span>{idea.source}</span>
            </div>
          </div>

          <Link
            href={idea.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/72 transition hover:border-cyan-400/20 hover:bg-cyan-400/10 hover:text-white"
          >
            Open idea
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        <p className="mt-5 text-sm leading-7 text-white/66">{idea.reasoning}</p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm text-white/50">
            <span className="inline-flex items-center gap-2">
              <ThumbsUp className="h-4 w-4" />
              {idea.boosts}
            </span>
            <span className="inline-flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              {idea.comments}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={tradingViewChartHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/72 transition hover:border-cyan-400/20 hover:bg-cyan-400/10 hover:text-white"
            >
              <CandlestickChart className="h-4 w-4" />
              Open chart
            </Link>
            <Link
              href={idea.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm text-violet-100 transition hover:border-violet-300/30 hover:text-white"
            >
              Read post
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function getCredibility(boosts: number, comments: number) {
  const score = boosts + comments * 2;
  if (score >= 220) return "Elite analyst";
  if (score >= 120) return "Trusted author";
  if (score >= 50) return "Rising voice";
  return "New contributor";
}

function formatPostedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
