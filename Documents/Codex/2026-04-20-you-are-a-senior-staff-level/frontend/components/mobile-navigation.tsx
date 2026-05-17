"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  BookOpenText,
  Bot,
  BrainCircuit,
  ChartCandlestick,
  ChevronRight,
  Copy,
  Globe2,
  Home,
  LineChart,
  LogIn,
  LogOut,
  Menu,
  NotebookPen,
  ScanSearch,
  Star,
  UserCircle2,
  Users,
  WalletCards,
  X
} from "lucide-react";

import { useAuthStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const primaryItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/terminal", label: "Terminal", icon: BrainCircuit },
  { href: "/markets", label: "Markets", icon: Globe2 },
  { href: "/copy", label: "Copy", icon: Copy },
  { href: "/ai", label: "AI", icon: Bot }
];

const moreItems = [
  { href: "/copy", label: "Copy Trading", icon: Copy, description: "Top 100 traders · positions · win rate · ROI" },
  { href: "/community", label: "Community", icon: Users, description: "AI-ranked public market intelligence" },
  { href: "/journal", label: "Trading Journal", icon: NotebookPen, description: "Save trades, screenshots, notes, and AI reviews" },
  { href: "/watchlist", label: "Watchlist", icon: Star, description: "Saved assets and market focus" },
  { href: "/alerts", label: "Alerts", icon: Bell, description: "Telegram and price alert controls" },
  { href: "/profile", label: "Profile", icon: UserCircle2, description: "Account information and preferences" },
  { href: "/coin/BTCUSDT", label: "AI Analysis", icon: ChartCandlestick, description: "Coin signal workspace" },
  { href: "/backtest", label: "Backtest", icon: LineChart, description: "Signal performance lab" },
  { href: "/pricing", label: "Pricing", icon: WalletCards, description: "Free, Pro, and premium structure" },
  { href: "/about-crypto", label: "About Crypto", icon: BookOpenText, description: "Crypto learning center" }
];

export function MobileNavigation() {
  const pathname = usePathname();
  const { user, clearSession } = useAuthStore();
  const [open, setOpen] = useState(false);

  if (pathname === "/") {
    return null;
  }

  return (
    <>
      <nav className="vx-mobile-dock fixed inset-x-3 bottom-3 z-50 px-2 py-2 shadow-[0_20px_60px_rgba(0,0,0,0.45)] lg:hidden">
        <div className="grid grid-cols-5 items-center gap-1">
          {primaryItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-[1.15rem] px-1 text-[11px] font-semibold transition active:scale-95",
                  active
                    ? "bg-gradient-to-br from-cyan-400/18 via-violet-500/18 to-fuchsia-500/18 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
                    : "text-white/55 hover:bg-white/[0.05] hover:text-white"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-[1.15rem] px-1 text-[11px] font-semibold text-white/60 transition hover:bg-white/[0.05] hover:text-white active:scale-95"
            aria-label="Open mobile menu"
          >
            <Menu className="h-5 w-5" />
            <span>More</span>
          </button>
        </div>
      </nav>

      {open ? (
        <div className="fixed inset-0 z-[60] bg-slate-950/70 p-3 backdrop-blur-xl lg:hidden" role="dialog" aria-modal="true">
          <div className="mobile-menu-sheet ml-auto flex h-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/92 shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/60">Vypexrock</p>
                <h2 className="mt-1 text-xl font-semibold text-white">Mobile workspace</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white"
                aria-label="Close mobile menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {moreItems.map(({ href, label, icon: Icon, description }) => {
                const active = pathname === href || (href !== "/" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center justify-between rounded-[1.35rem] border p-4 transition active:scale-[0.99]",
                      active
                        ? "border-cyan-300/20 bg-cyan-400/10 text-white"
                        : "border-white/10 bg-white/[0.035] text-white/76 hover:border-white/20 hover:bg-white/[0.06]"
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-cyan-100">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{label}</span>
                        <span className="mt-1 block truncate text-xs text-white/44">{description}</span>
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-white/38" />
                  </Link>
                );
              })}
            </div>

            <div className="border-t border-white/10 p-4">
              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    clearSession();
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.07]"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-slate-950"
                >
                  <LogIn className="h-4 w-4" />
                  Access platform
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
