"use client";

import Link from "next/link";
import { Activity, Bell, BookOpenText, Bot, Compass, LayoutDashboard, LineChart, ScanSearch, ShieldAlert, Sparkles, Star, TrendingUp, UserCircle2, Users, WalletCards } from "lucide-react";
import { usePathname } from "next/navigation";

import { watchlistHighlights } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ai", label: "Vypexrock AI", icon: Bot },
  { href: "/chart-analyzer", label: "Chart Analyzer", icon: ScanSearch },
  { href: "/about-crypto", label: "About Crypto", icon: BookOpenText },
  { href: "/community", label: "Community", icon: Users },
  { href: "/backtest", label: "Backtest Lab", icon: LineChart },
  { href: "/pricing", label: "Pricing", icon: WalletCards },
  { href: "/watchlist", label: "Watchlist", icon: Star },
  { href: "/alerts", label: "Alerts", icon: ShieldAlert },
  { href: "/profile", label: "Profile", icon: UserCircle2 },
  { href: "/coin/BTCUSDT", label: "AI Analysis", icon: Compass },
  { href: "/login", label: "Workspace Access", icon: Bell }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[260px] shrink-0 xl:block">
      <div className="sticky top-24 space-y-5">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(90,110,255,0.26),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.12),_transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex items-center gap-2 text-sm text-amber-100">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            Elite members terminal
          </div>
          <h2 className="mt-4 text-xl font-semibold text-white">Vypexrock turns charts into decision-ready trade briefs.</h2>
          <p className="mt-3 text-sm leading-6 text-white/62">
            Built like a private luxury crypto platform with richer market coverage, live AI assistance, and polished execution context.
          </p>

          <div className="mt-6 grid gap-3">
            {watchlistHighlights.map((item) => (
              <div key={item.title} className="rounded-[1.25rem] border border-white/10 bg-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/40">{item.title}</p>
                <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                <p className="mt-1 text-xs text-white/45">{item.note}</p>
              </div>
            ))}
          </div>
        </div>

        <nav className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
          <p className="px-3 pb-3 text-xs uppercase tracking-[0.28em] text-white/38">Platform</p>
          <div className="space-y-2">
            {links.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center justify-between rounded-[1.2rem] border px-4 py-3 transition",
                    active
                      ? "border-amber-300/25 bg-amber-300/10 text-white"
                      : "border-transparent bg-white/[0.02] text-white/62 hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{label}</span>
                  </span>
                  {active ? <Activity className="h-4 w-4 text-cyan-300" /> : null}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center gap-2 text-white">
            <TrendingUp className="h-4 w-4 text-violet-300" />
            <h3 className="text-lg font-semibold">What feels premium here</h3>
          </div>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-white/58">
            <li>Institutional dark theme with stronger luxury glow and blue-violet hierarchy.</li>
            <li>Large chart workspace and Vypexrock AI flows inspired by premium terminals.</li>
            <li>Live-friendly architecture with polished fallback states instead of broken sections.</li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
