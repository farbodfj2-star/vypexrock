import { cn } from "@/lib/utils";

export function VypexrockLogo({
  compact = false,
  className
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("vypexrock-logo flex min-w-0 items-center gap-3", className)}>
      <div className="vypexrock-logo-mark relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[1.35rem] border border-white/10 bg-[radial-gradient(circle_at_32%_18%,rgba(255,255,255,0.28),transparent_22%),linear-gradient(135deg,rgba(10,16,34,0.96),rgba(27,18,64,0.95)_48%,rgba(5,12,24,0.98))] shadow-[0_16px_50px_rgba(0,0,0,0.36),0_0_34px_rgba(99,102,241,0.22)]">
        <span className="absolute inset-0 bg-[conic-gradient(from_210deg,rgba(34,211,238,0.18),rgba(139,92,246,0.3),rgba(236,72,153,0.22),rgba(245,200,74,0.18),rgba(34,211,238,0.18))]" />
        <span className="absolute inset-[5px] rounded-[1.05rem] bg-slate-950/80 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" />
        <svg className="relative h-8 w-8 drop-shadow-[0_0_18px_rgba(34,211,238,0.32)]" viewBox="0 0 48 48" role="img" aria-label="Vypexrock logo mark">
          <path
            d="M8 10h8.2l7.9 19.1L32.1 10H40L27.5 38h-7L8 10Z"
            fill="url(#vypexrock-v)"
          />
          <path
            d="M16.2 10 24 28.8 31.8 10h3.8L25.7 33h-3.4L12.4 10h3.8Z"
            fill="rgba(255,255,255,0.2)"
          />
          <path d="M13 38h22" stroke="url(#vypexrock-line)" strokeWidth="3.2" strokeLinecap="round" />
          <defs>
            <linearGradient id="vypexrock-v" x1="8" y1="10" x2="40" y2="38" gradientUnits="userSpaceOnUse">
              <stop stopColor="#22d3ee" />
              <stop offset="0.48" stopColor="#8b5cf6" />
              <stop offset="1" stopColor="#facc15" />
            </linearGradient>
            <linearGradient id="vypexrock-line" x1="13" y1="38" x2="35" y2="38" gradientUnits="userSpaceOnUse">
              <stop stopColor="#facc15" />
              <stop offset="1" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      {!compact ? (
        <div className="vypexrock-logo-copy min-w-0">
          <p className="truncate text-lg font-semibold tracking-[0.06em] text-white">Vypexrock</p>
          <p className="truncate text-xs uppercase tracking-[0.22em] text-white/40">Luxury Crypto Intelligence</p>
        </div>
      ) : null}
    </div>
  );
}
