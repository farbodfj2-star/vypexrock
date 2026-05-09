"use client";

import { useMemo, useState } from "react";

import { formatCurrency } from "@/lib/utils";

type RiskCalculatorProps = {
  symbol: string;
  entryLow: number;
  entryHigh: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
};

export function RiskCalculator({
  symbol,
  entryLow,
  entryHigh,
  stopLoss,
  takeProfit1,
  takeProfit2,
  takeProfit3
}: RiskCalculatorProps) {
  const [accountSize, setAccountSize] = useState("10000");
  const [riskPercent, setRiskPercent] = useState("1");

  const entry = (entryLow + entryHigh) / 2;

  const values = useMemo(() => {
    const balance = Number(accountSize) || 0;
    const riskPct = Number(riskPercent) || 0;
    const riskAmount = balance * (riskPct / 100);
    const stopDistance = Math.max(Math.abs(entry - stopLoss), 0.0001);
    const positionSize = riskAmount / stopDistance;
    const gain1 = Math.abs(takeProfit1 - entry) * positionSize;
    const gain2 = Math.abs(takeProfit2 - entry) * positionSize;
    const gain3 = Math.abs(takeProfit3 - entry) * positionSize;
    const rr = Math.abs(takeProfit2 - entry) / stopDistance;

    return {
      riskAmount,
      positionSize,
      gain1,
      gain2,
      gain3,
      rr
    };
  }, [accountSize, riskPercent, entry, stopLoss, takeProfit1, takeProfit2, takeProfit3]);

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <p className="text-xs uppercase tracking-[0.24em] text-white/40">Risk Management</p>
      <h3 className="mt-2 text-2xl font-semibold text-white">{symbol} position size calculator</h3>
      <p className="mt-3 text-sm leading-7 text-white/58">
        Size the trade from risk first. This calculator is for planning only and assumes execution close to the mid-entry price.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Account size" value={accountSize} onChange={setAccountSize} />
        <Field label="Risk per trade %" value={riskPercent} onChange={setRiskPercent} />
        <ReadOnly label="Entry price" value={formatCurrency(entry)} />
        <ReadOnly label="Stop loss" value={formatCurrency(stopLoss)} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <ReadOnly label="Calculated position size" value={values.positionSize.toFixed(4)} />
        <ReadOnly label="Potential loss" value={formatCurrency(values.riskAmount)} />
        <ReadOnly label="Potential gain TP1" value={formatCurrency(values.gain1)} />
        <ReadOnly label="Potential gain TP2" value={formatCurrency(values.gain2)} />
        <ReadOnly label="Potential gain TP3" value={formatCurrency(values.gain3)} />
      </div>

      <div className="mt-5 rounded-[1.3rem] border border-white/10 bg-[#0d1224] p-4 text-sm text-white/62">
        Risk-reward estimate: <span className="font-semibold text-white">{values.rr.toFixed(2)}R</span>. Historical performance and AI ranking do not guarantee future results.
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm text-white/50">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0d1224] px-4 py-3 text-white outline-none"
      />
    </label>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white/10 bg-[#0d1224] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-white/38">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}
