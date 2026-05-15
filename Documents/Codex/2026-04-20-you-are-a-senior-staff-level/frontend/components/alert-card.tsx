"use client";

import { BellRing, CheckCircle2, TriangleAlert } from "lucide-react";

import type { SmartAlert } from "@/lib/trading-os-data";
import { cn } from "@/lib/utils";

export function AlertCard({ alert }: { alert: SmartAlert }) {
  const Icon = alert.severity === "Critical" ? TriangleAlert : alert.severity === "Watch" ? BellRing : CheckCircle2;

  return (
    <article className="rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-4 transition hover:-translate-y-0.5 hover:bg-white/[0.055]">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-2xl",
            alert.severity === "Critical"
              ? "bg-rose-400/12 text-rose-100"
              : alert.severity === "Watch"
                ? "bg-amber-300/12 text-amber-100"
                : "bg-cyan-300/12 text-cyan-100"
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-white">{alert.title}</h3>
            <span className="rounded-full bg-white/[0.055] px-2 py-0.5 text-[11px] font-semibold text-white/50">{alert.symbol}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-white/58">{alert.message}</p>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-white/34">{alert.time}</p>
        </div>
      </div>
    </article>
  );
}
