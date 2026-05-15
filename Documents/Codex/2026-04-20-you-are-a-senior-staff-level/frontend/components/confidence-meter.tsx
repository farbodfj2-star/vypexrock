import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

export function ConfidenceMeter({
  value,
  label = "AI confidence",
  compact = false
}: {
  value: number;
  label?: string;
  compact?: boolean;
}) {
  const normalized = Math.max(0, Math.min(100, value));
  const tone = normalized >= 88 ? "Elite" : normalized >= 80 ? "Valid" : normalized >= 66 ? "Early" : normalized >= 50 ? "Watchlist" : "No Trade";

  return (
    <div className={cn("rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4", compact && "p-3")}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-white/38">{label}</p>
          <p className="mt-1 text-sm font-semibold text-white">{tone}</p>
        </div>
        <div className="grid h-14 w-14 place-items-center rounded-full bg-[conic-gradient(from_180deg,#22d3ee_0%,#8b5cf6_var(--confidence),rgba(255,255,255,0.08)_0)] text-sm font-bold text-white shadow-[0_0_28px_rgba(34,211,238,0.16)]" style={{ "--confidence": `${normalized}%` } as CSSProperties}>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-950/90">{normalized}%</span>
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-violet-500 to-fuchsia-400 shadow-[0_0_18px_rgba(139,92,246,0.42)]" style={{ width: `${normalized}%` }} />
      </div>
    </div>
  );
}
