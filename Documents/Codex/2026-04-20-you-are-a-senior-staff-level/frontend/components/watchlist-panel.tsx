"use client";

import { FormEvent, useState } from "react";

import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import type { WatchlistItem } from "@/types";

export function WatchlistPanel({
  items,
  onRefresh
}: {
  items: WatchlistItem[];
  onRefresh: () => void;
}) {
  const token = useAuthStore((state) => state.token);
  const [symbol, setSymbol] = useState("BTCUSDT");

  async function addItem(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    await apiFetch("/watchlist", {
      method: "POST",
      token,
      body: JSON.stringify({ symbol })
    });
    onRefresh();
  }

  async function removeItem(targetSymbol: string) {
    if (!token) return;
    await apiFetch(`/watchlist/${targetSymbol}`, {
      method: "DELETE",
      token
    });
    onRefresh();
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/40">Priority pairs</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Curate your active market list</h2>
        </div>
        <form onSubmit={addItem} className="flex flex-wrap items-end gap-3">
          <label className="text-sm text-white/50">
            Symbol
            <input
              className="mt-2 block rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white"
              value={symbol}
              onChange={(event) => setSymbol(event.target.value.toUpperCase())}
            />
          </label>
          <button className="rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-slate-950">
            Add coin
          </button>
        </form>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
            <div>
              <p className="font-medium text-white">{item.symbol}</p>
              <p className="text-xs text-white/45">
                {item.base_asset} / {item.quote_asset}
              </p>
            </div>
            <button className="text-sm text-rose-300 transition hover:text-rose-200" onClick={() => removeItem(item.symbol)}>
              Remove
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
