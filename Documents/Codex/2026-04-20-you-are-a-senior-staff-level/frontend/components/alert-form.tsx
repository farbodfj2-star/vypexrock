"use client";

import { FormEvent, useState } from "react";
import { BellRing, Sparkles, TrendingDown, TrendingUp } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";

const alertPresets = [
  {
    title: "Breakout watch",
    description: "Track a clean push through nearby resistance.",
    symbol: "BTCUSDT",
    conditionType: "price",
    direction: "above",
    thresholdValue: "95000",
    coolDownMinutes: "15",
    icon: TrendingUp
  },
  {
    title: "Breakdown watch",
    description: "Catch weakness if price loses key support.",
    symbol: "ETHUSDT",
    conditionType: "price",
    direction: "below",
    thresholdValue: "4400",
    coolDownMinutes: "15",
    icon: TrendingDown
  },
  {
    title: "Momentum flip",
    description: "Alert when the AI bias changes into a tradeable move.",
    symbol: "SOLUSDT",
    conditionType: "signal_change",
    direction: "long",
    thresholdValue: "",
    coolDownMinutes: "30",
    icon: Sparkles
  }
] as const;

export function AlertForm({ onCreated }: { onCreated: () => void }) {
  const token = useAuthStore((state) => state.token);
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [conditionType, setConditionType] = useState("price");
  const [direction, setDirection] = useState("above");
  const [thresholdValue, setThresholdValue] = useState("70000");
  const [coolDownMinutes, setCoolDownMinutes] = useState("30");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function applyPreset(preset: (typeof alertPresets)[number]) {
    setSymbol(preset.symbol);
    setConditionType(preset.conditionType);
    setDirection(preset.direction);
    setThresholdValue(preset.thresholdValue);
    setCoolDownMinutes(preset.coolDownMinutes);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) {
      setError("Sign in to create alerts.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/alerts", {
        method: "POST",
        token,
        body: JSON.stringify({
          symbol,
          condition_type: conditionType,
          direction,
          threshold_value: thresholdValue ? Number(thresholdValue) : null,
          cool_down_minutes: Number(coolDownMinutes)
        })
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create alert");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.26em] text-white/40">Trigger builder</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Create a premium alert rule</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/58">
          Build a price, RSI, or signal alert that feels useful immediately. Start from a ready-made preset, then fine-tune the threshold and cooldown.
        </p>
      </div>
      <div className="mb-6 grid gap-3 xl:grid-cols-3">
        {alertPresets.map((preset) => {
          const Icon = preset.icon;
          const active =
            preset.symbol === symbol &&
            preset.conditionType === conditionType &&
            preset.direction === direction &&
            preset.thresholdValue === thresholdValue &&
            preset.coolDownMinutes === coolDownMinutes;

          return (
            <button
              key={preset.title}
              type="button"
              onClick={() => applyPreset(preset)}
              className={cn(
                "rounded-[1.35rem] border p-4 text-left transition",
                active
                  ? "border-cyan-400/30 bg-cyan-400/10 shadow-[0_16px_40px_rgba(34,211,238,0.12)]"
                  : "border-white/10 bg-[#0d1224] hover:border-white/20 hover:bg-white/[0.05]"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-cyan-200">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{preset.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/35">{preset.symbol}</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/56">{preset.description}</p>
            </button>
          );
        })}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Input label="Symbol" value={symbol} onChange={setSymbol} />
        <Select label="Type" value={conditionType} onChange={setConditionType} options={["price", "rsi", "signal_change"]} />
        <Select label="Direction" value={direction} onChange={setDirection} options={["above", "below", "long", "short", "neutral"]} />
        <Input label="Threshold" value={thresholdValue} onChange={setThresholdValue} />
        <Input label="Cooldown min" value={coolDownMinutes} onChange={setCoolDownMinutes} />
      </div>
      <div className="mt-5 rounded-[1.35rem] border border-white/10 bg-[#0d1224] px-4 py-4 text-sm text-white/60">
        <div className="flex items-center gap-2 text-white/80">
          <BellRing className="h-4 w-4 text-violet-300" />
          Current rule
        </div>
        <p className="mt-3 leading-7">
          Alert me when <span className="font-semibold text-white">{symbol}</span> triggers{" "}
          <span className="font-semibold text-white">{conditionType}</span> <span className="font-semibold text-white">{direction}</span>
          {thresholdValue ? (
            <>
              {" "}
              at <span className="font-semibold text-white">{thresholdValue}</span>
            </>
          ) : null}
          , then cool down for <span className="font-semibold text-white">{coolDownMinutes} minutes</span>.
        </p>
      </div>
      {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="mt-5 rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
      >
        {loading ? "Creating..." : "Create alert"}
      </button>
    </form>
  );
}

function Input({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-2 block text-white/50">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none ring-0"
      />
    </label>
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
    <label className="block text-sm">
      <span className="mb-2 block text-white/50">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none ring-0"
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
