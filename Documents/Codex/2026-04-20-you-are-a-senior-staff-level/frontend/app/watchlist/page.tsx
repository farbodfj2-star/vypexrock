"use client";

import { useQuery } from "@tanstack/react-query";

import { WatchlistPanel } from "@/components/watchlist-panel";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import type { WatchlistItem } from "@/types";

export default function WatchlistPage() {
  const token = useAuthStore((state) => state.token);
  const query = useQuery({
    queryKey: ["watchlist", token],
    queryFn: () => apiFetch<WatchlistItem[]>("/watchlist", { token }),
    enabled: Boolean(token)
  });

  return (
    <div className="space-y-6">
      <section className="rounded-[2.1rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.35em] text-white/40">Personal workspace</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">Watchlist</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
          Keep your highest-priority pairs in a premium workspace and turn them into fast AI analysis flows.
        </p>
      </section>

      {!token ? <EmptyState message="Sign in to manage your watchlist." /> : null}
      {token && query.data ? <WatchlistPanel items={query.data} onRefresh={() => query.refetch()} /> : null}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-white/68">{message}</div>;
}
