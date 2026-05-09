"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, CandlestickChart, Users } from "lucide-react";

import { CommunityCard } from "@/components/community-card";
import { apiFetch } from "@/lib/api";
import { useMarketStream } from "@/hooks/use-market-stream";
import type { CommunityFeedResponse, MarketTicker } from "@/types";

const sortOptions = ["Recent", "Boosts", "Comments"] as const;

export function CommunityFeed() {
  const [symbol, setSymbol] = useState("All");
  const [bias, setBias] = useState("All");
  const [sortBy, setSortBy] = useState<(typeof sortOptions)[number]>("Recent");

  const communityQuery = useQuery({
    queryKey: ["community-ideas"],
    queryFn: async () => {
      const payload = await apiFetch<{
        ideas: Array<{
          id: string;
          source: string;
          symbol: string;
          bias: "long" | "short" | "neutral";
          title: string;
          reasoning: string;
          image_url?: string | null;
          source_url: string;
          author: string;
          author_url?: string | null;
          posted_at: string;
          boosts: number;
          comments: number;
        }>;
        pulse: CommunityFeedResponse["pulse"];
      }>("/community/ideas");

      return {
        ideas: payload.ideas.map((idea) => ({
          id: idea.id,
          source: idea.source,
          symbol: idea.symbol,
          bias: idea.bias,
          title: idea.title,
          reasoning: idea.reasoning,
          imageUrl: idea.image_url ?? null,
          sourceUrl: idea.source_url,
          author: idea.author,
          authorUrl: idea.author_url ?? null,
          postedAt: idea.posted_at,
          boosts: idea.boosts,
          comments: idea.comments
        })),
        pulse: payload.pulse
      } satisfies CommunityFeedResponse;
    },
    refetchInterval: 60000
  });

  const marketQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch<MarketTicker[]>("/market/dashboard"),
    refetchInterval: 1000
  });

  useMarketStream();

  const liveMap = useMemo(() => {
    const rows = marketQuery.data ?? [];
    return new Map(rows.map((row) => [row.symbol, row]));
  }, [marketQuery.data]);

  const ideas = communityQuery.data?.ideas ?? [];
  const pulse = communityQuery.data?.pulse;

  const symbols = useMemo(() => ["All", ...new Set(ideas.map((item) => item.symbol))], [ideas]);

  const filtered = useMemo(() => {
    const base = ideas.filter((idea) => {
      if (symbol !== "All" && idea.symbol !== symbol) return false;
      if (bias !== "All" && idea.bias !== bias.toLowerCase()) return false;
      return true;
    });

    return [...base].sort((a, b) => {
      if (sortBy === "Boosts") return b.boosts - a.boosts;
      if (sortBy === "Comments") return b.comments - a.comments;
      return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
    });
  }, [ideas, symbol, bias, sortBy]);

  return (
    <div className="space-y-6">
      {pulse ? (
        <section className="grid gap-4 lg:grid-cols-3">
          <PulseCard
            icon={CandlestickChart}
            title="Community bias"
            value={pulse.consensus_bias.toUpperCase()}
            text={pulse.summary}
          />
          <PulseCard
            icon={BarChart3}
            title="Most discussed"
            value={pulse.top_symbols.join(" • ") || "Live scan"}
            text={`Based on ${pulse.total_posts} real recent public ideas from TradingView.`}
          />
          <PulseCard
            icon={Users}
            title="Top voices"
            value={pulse.top_authors.join(" • ") || "Live scan"}
            text="These are the most visible authors in the current real public feed."
          />
        </section>
      ) : null}

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <Select label="Symbol" value={symbol} onChange={setSymbol} options={symbols} />
          <Select label="Bias" value={bias} onChange={setBias} options={["All", "Long", "Short", "Neutral"]} />
          <Select label="Sort by" value={sortBy} onChange={(value) => setSortBy(value as (typeof sortOptions)[number])} options={[...sortOptions]} />
        </div>
      </section>

      {communityQuery.isLoading ? (
        <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-6 text-white/60">Loading real TradingView community ideas...</div>
      ) : null}

      {communityQuery.error ? (
        <div className="rounded-[1.8rem] border border-rose-500/30 bg-rose-500/10 p-6 text-rose-200">
          {communityQuery.error instanceof Error ? communityQuery.error.message : "Unable to load live TradingView ideas right now."}
        </div>
      ) : null}

      <div className="grid gap-5">
        {filtered.map((idea) => (
          <CommunityCard key={idea.id} idea={idea} liveTicker={liveMap.get(idea.symbol)} />
        ))}
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="text-sm text-white/50">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function PulseCard({
  icon: Icon,
  title,
  value,
  text
}: {
  icon: typeof CandlestickChart;
  title: string;
  value: string;
  text: string;
}) {
  return (
    <div className="rounded-[1.8rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.18),_transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-cyan-200">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.2em] text-white/40">{title}</p>
      <h3 className="mt-3 text-xl font-semibold text-white">{value}</h3>
      <p className="mt-3 text-sm leading-7 text-white/58">{text}</p>
    </div>
  );
}
