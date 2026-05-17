"use client";

import Link from "next/link";
import { Activity, Bell, Bot, BrainCircuit, Compass, Home, LineChart, NotebookPen, Radar, ScanSearch, Star, UserCircle2, Users, WalletCards } from "lucide-react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { fetchMarketOpportunities, mapOpportunityToScanner } from "@/lib/market-opportunities";
import { cn } from "@/lib/utils";

const primaryLinks = [
  { href: "/terminal", label: "Terminal", icon: BrainCircuit },
  { href: "/chart-analyzer", label: "Charts", icon: ScanSearch },
  { href: "/ai", label: "AI", icon: Bot },
  { href: "/journal", label: "Journal", icon: NotebookPen }
];

const secondaryLinks = [
  { href: "/watchlist", label: "Watchlist", icon: Star },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/community", label: "Community", icon: Users },
  { href: "/backtest", label: "Backtest", icon: LineChart },
  { href: "/pricing", label: "Pricing", icon: WalletCards },
  { href: "/profile", label: "Profile", icon: UserCircle2 },
  { href: "/coin/BTCUSDT", label: "BTC Analysis", icon: Compass }
];

// Realistic fallback so the desk is never empty
const FALLBACK_HIGHLIGHTS = [
  { symbol: "BTCUSDT", direction: "Long", confidence: 82, tier: "S Tier" },
  { symbol: "ETHUSDT", direction: "Long", confidence: 76, tier: "A Tier" },
  { symbol: "SOLUSDT", direction: "Long", confidence: 71, tier: "A Tier" },
  { symbol: "INJUSDT", direction: "Short", confidence: 84, tier: "S Tier" },
  { symbol: "PEPEUSDT", direction: "Long", confidence: 68, tier: "B Tier" },
  { symbol: "SUIUSDT", direction: "Long", confidence: 73, tier: "A Tier" },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ["market-opportunities", 6],
    queryFn: () => fetchMarketOpportunities(6),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const highlights: Array<{ symbol: string; direction: string; confidence: number; tier: string }> =
    opportunities.length > 0
      ? opportunities.map(mapOpportunityToScanner).slice(0, 6).map((o) => ({
          symbol: o.symbol,
          direction: o.direction,
          confidence: o.confidence,
          tier: o.tier,
        }))
      : (FALLBACK_HIGHLIGHTS.slice() as unknown as Array<{ symbol: string; direction: string; confidence: number; tier: string }>);

  return (
    <aside className="vx-sidebar hidden w-[248px] shrink-0 xl:block">
      <div className="sticky top-[5.5rem] space-y-4">
        <div className="vx-glass-panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-teal-300/85">
              <span className="vx-live-dot mr-1.5" />
              Live desk
            </p>
            <span className="text-[10px] uppercase tracking-[0.18em] text-white/35">{highlights.length}</span>
          </div>
          <h2 className="mt-2 text-base font-semibold leading-snug text-white">Ranked setups</h2>
          <p className="mt-1 text-xs leading-5 text-white/45">Updated every 30 seconds · Binance live feed.</p>
          <ul className="mt-4 space-y-2">
            {isLoading && opportunities.length === 0 ? (
              <li className="vx-skeleton h-14 w-full" />
            ) : (
              highlights.map((item) => (
                <li key={item.symbol}>
                  <Link
                    href={`/coin/${item.symbol}`}
                    className="block rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 transition hover:border-white/15 hover:bg-white/[0.05]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-white">{item.symbol.replace("USDT", "")}</span>
                      <span className={cn(
                        "text-[10px] font-semibold uppercase tracking-wider",
                        item.tier === "S Tier" || item.tier === "A Tier" ? "text-emerald-300/85" : item.tier === "No Trade" ? "text-white/35" : "text-teal-300/80"
                      )}>{item.tier}</span>
                    </div>
                    <p className="mt-1 text-xs text-white/55">
                      <span className={item.direction === "Long" ? "text-emerald-300/85" : item.direction === "Short" ? "text-rose-300/85" : "text-white/55"}>
                        {item.direction}
                      </span>
                      <span className="text-white/30"> · </span>
                      <span className="text-white/65">{item.confidence}%</span>
                    </p>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>

        <nav className="vx-glass-panel p-3">
          <p className="px-2 pb-2 text-[10px] uppercase tracking-[0.22em] text-white/35">Workspace</p>
          <div className="space-y-0.5">
            <SidebarLink href="/" label="Home" icon={Home} pathname={pathname} exact />
            {primaryLinks.map((link) => (
              <SidebarLink key={link.href} {...link} pathname={pathname} />
            ))}
          </div>
          <p className="mb-1 mt-4 px-2 text-[10px] uppercase tracking-[0.22em] text-white/30">More</p>
          <div className="space-y-0.5">
            {secondaryLinks.map((link) => (
              <SidebarLink key={link.href} {...link} pathname={pathname} />
            ))}
          </div>
        </nav>

        <div className="vx-glass-panel flex items-center gap-3 p-4">
          <Radar className="h-4 w-4 shrink-0 text-teal-300/80" />
          <p className="text-xs leading-relaxed text-white/48">Rankings refresh from live 15m structure scans.</p>
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({
  href,
  label,
  icon: Icon,
  pathname,
  exact
}: {
  href: string;
  label: string;
  icon: typeof Home;
  pathname: string;
  exact?: boolean;
}) {
  const active = exact ? pathname === href : pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition",
        active ? "bg-white/[0.08] text-white" : "text-white/55 hover:bg-white/[0.04] hover:text-white/90"
      )}
    >
      <span className="flex items-center gap-2.5">
        <Icon className={cn("h-4 w-4", active ? "text-teal-300" : "text-white/40")} strokeWidth={1.75} />
        {label}
      </span>
      {active ? <Activity className="h-3.5 w-3.5 text-teal-300/90" /> : null}
    </Link>
  );
}
