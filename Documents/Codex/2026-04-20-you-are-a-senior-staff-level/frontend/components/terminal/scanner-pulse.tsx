"use client";

export function ScannerPulse({ active, scanning }: { active: number; scanning: boolean }) {
  return (
    <section className="vx-glass-panel flex items-center justify-between gap-4 p-4">
      <div>
        <p className="text-xs uppercase tracking-widest text-white/40">Scanner pulse</p>
        <p className="mt-1 text-sm text-white/55">{scanning ? "Sweeping hot USDT markets…" : "Live structure scan idle between cycles"}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className={scanning ? "vx-live-dot" : "h-2 w-2 rounded-full bg-white/25"} />
        <span className="text-2xl font-semibold tabular-nums text-white">{active}</span>
        <span className="text-xs uppercase tracking-widest text-white/40">setups</span>
      </div>
    </section>
  );
}
