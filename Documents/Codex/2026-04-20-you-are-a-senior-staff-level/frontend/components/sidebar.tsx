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

export function Sidebar() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  const { data: opportunities = [] } = useQuery({
    queryKey: ["market-opportunities", 3],
    queryFn: () => fetchMarketOpportunities(3),
    staleTime: 30_000,
    refetchInterval: 60_000
  });

  const highlights = opportunities.map(mapOpportunityToScanner);

  return (
    <aside className="vx-sidebar hidden w-[248px] shrink-0 xl:block">
      <div className="sticky top-[5.5rem] space-y-4">
        <div className="vx-glass-panel p-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-teal-300/70">Live desk</p>
          <h2 className="mt-2 text-base font-semibold leading-snug text-white">Ranked setups</h2>
          <ul className="mt-4 space-y-2">
            {highlights.length ? (
              highlights.map((item) => (
                <li key={item.symbol}>
                  <Link
                    href={`/coin/${item.symbol}`}
                    className="block rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 transition hover:border-white/12 hover:bg-white/[0.05]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-white">{item.symbol}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-300/80">{item.tier}</span>
                    </div>
                    <p className="mt-1 text-xs text-white/45">
                      {item.direction} · {item.confidence}%
                    </p>
                  </Link>
                </li>
              ))
            ) : (
              <li className="vx-skeleton h-14 w-full" />
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
