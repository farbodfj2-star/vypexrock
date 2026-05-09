import { cn } from "@/lib/utils";

export function VypexrockLogo({
  compact = false,
  className
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative flex h-12 w-12 items-center justify-center rounded-[1.2rem] border border-amber-200/10 bg-[linear-gradient(135deg,rgba(13,18,36,0.92),rgba(28,18,56,0.92))] shadow-[0_16px_50px_rgba(0,0,0,0.34)]">
        <span className="absolute h-3 w-3 rotate-45 rounded-[3px] bg-gradient-to-br from-amber-300 to-yellow-500 shadow-[0_0_22px_rgba(245,200,74,0.35)]" />
        <span className="absolute -translate-x-[9px] h-2.5 w-2.5 rotate-45 rounded-[3px] bg-gradient-to-br from-amber-300 to-yellow-500" />
        <span className="absolute translate-x-[9px] h-2.5 w-2.5 rotate-45 rounded-[3px] bg-gradient-to-br from-amber-300 to-yellow-500" />
        <span className="absolute translate-y-[9px] h-2.5 w-2.5 rotate-45 rounded-[3px] bg-gradient-to-br from-amber-300 to-yellow-500" />
      </div>
      {!compact ? (
        <div>
          <p className="text-lg font-semibold tracking-[0.08em] text-white">Vypexrock</p>
          <p className="text-xs uppercase tracking-[0.24em] text-white/40">Luxury Crypto Intelligence</p>
        </div>
      ) : null}
    </div>
  );
}
