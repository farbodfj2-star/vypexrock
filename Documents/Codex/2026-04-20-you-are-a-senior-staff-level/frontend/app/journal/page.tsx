"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Brain, Camera, CircleDollarSign, NotebookPen, Plus, ShieldAlert } from "lucide-react";

import { TradingJournalCard, JournalSummaryCard } from "@/components/trading-journal-card";
import { journalStats, journalTrades } from "@/lib/trading-os-data";

export default function JournalPage() {
  const [notes, setNotes] = useState("");

  return (
    <div className="terminal-shell space-y-6 pb-8">
      <section className="terminal-command-hero rounded-[2.4rem] p-5 sm:p-7 xl:p-9">
        <div className="max-w-4xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">
            <NotebookPen className="h-4 w-4" />
            AI Trading Journal
          </p>
          <h1 className="mt-6 text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl xl:text-6xl">Turn every trade into memory.</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-white/64 sm:text-lg">
            Save screenshots, record emotions, track risk/reward, and let Vypexrock AI identify mistakes like late entries, revenge trades, weak invalidation, and overtrading.
          </p>
        </div>
      </section>

      <JournalSummaryCard {...journalStats} />

      <section className="grid gap-5 2xl:grid-cols-[0.8fr_1.2fr]">
        <form className="terminal-glass-card p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300/18 to-violet-500/18 text-cyan-100">
              <Plus className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-white/38">New Trade</p>
              <h2 className="text-2xl font-semibold text-white">Log a trade review</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <JournalInput label="Symbol" placeholder="BTCUSDT" />
            <JournalInput label="Setup" placeholder="NY breakout retest" />
            <JournalInput label="Entry" placeholder="$78,450" />
            <JournalInput label="Stop loss" placeholder="$77,200" />
            <JournalInput label="TP target" placeholder="$80,100" />
            <JournalInput label="Emotion" placeholder="Patient, rushed, confident..." />
          </div>

          <label className="mt-4 block">
            <span className="text-xs uppercase tracking-[0.22em] text-white/38">Trader notes</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="What happened before entry? What did you see? What did you ignore?"
              className="mt-2 min-h-32 w-full rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/28 focus:border-cyan-300/28"
            />
          </label>

          <div className="mt-4 rounded-[1.35rem] border border-dashed border-white/14 bg-white/[0.03] p-5 text-center">
            <Camera className="mx-auto h-6 w-6 text-cyan-100" />
            <p className="mt-3 text-sm font-semibold text-white">Upload trade screenshot</p>
            <p className="mt-1 text-xs text-white/42">Frontend-ready placeholder. Backend storage can be connected later.</p>
          </div>

          <button type="button" className="terminal-primary-button mt-5 w-full justify-center">
            Save trade draft
          </button>
        </form>

        <div className="space-y-5">
          <section className="grid gap-4 lg:grid-cols-3">
            <JournalInsight icon={<Brain className="h-5 w-5" />} title="Mistake pattern" value="Late after impulse" />
            <JournalInsight icon={<ShieldAlert className="h-5 w-5" />} title="Risk warning" value="Avoid 2+ losses/session" />
            <JournalInsight icon={<CircleDollarSign className="h-5 w-5" />} title="Best behavior" value="Waited for retest" />
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            {journalTrades.map((trade) => (
              <TradingJournalCard key={trade.id} trade={trade} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function JournalInput({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.22em] text-white/38">{label}</span>
      <input
        placeholder={placeholder}
        className="mt-2 h-12 w-full rounded-[1.15rem] border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-white/28 focus:border-cyan-300/28"
      />
    </label>
  );
}

function JournalInsight({ icon, title, value }: { icon: ReactNode; title: string; value: string }) {
  return (
    <div className="terminal-glass-card p-5">
      <div className="text-cyan-100">{icon}</div>
      <p className="mt-4 text-xs uppercase tracking-[0.22em] text-white/38">{title}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
