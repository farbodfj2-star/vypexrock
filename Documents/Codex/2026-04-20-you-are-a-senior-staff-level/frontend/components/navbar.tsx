"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Bot, BrainCircuit, ChevronRight, Crown, Globe2, Home, LineChart, LogOut, NotebookPen, ScanSearch, ShieldCheck, Star, Users, WalletCards } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { resolveApiAssetUrl } from "@/lib/api";
import { resolveUserAvatar } from "@/lib/avatar";
import { useAuthStore } from "@/lib/store";
import { VypexrockLogo } from "@/components/vypexrock-logo";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/terminal", label: "Terminal", icon: BrainCircuit },
  { href: "/chart-analyzer", label: "Charts", icon: ScanSearch },
  { href: "/markets", label: "Markets", icon: Globe2 },
  { href: "/copy", label: "Copy", icon: Users },
  { href: "/ai", label: "AI", icon: Bot },
  { href: "/journal", label: "Journal", icon: NotebookPen },
  { href: "/alerts", label: "Alerts", icon: Bell }
];

export function Navbar() {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const { user, clearSession } = useAuthStore();
  const avatarUrl = resolveApiAssetUrl(user?.avatar_url) ?? resolveUserAvatar(user);
  const [utcClock, setUtcClock] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setUtcClock(
        now.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "UTC",
          hour12: false
        })
      );
    };
    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <header className={cn("vx-navbar sticky top-0 z-40 border-b backdrop-blur-xl", isLanding ? "border-transparent bg-transparent" : "border-white/[0.06] bg-[#030405]/85")}>
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-2 px-3 py-2.5 sm:px-5 sm:py-3 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="block min-w-0 shrink-0">
            <VypexrockLogo className="mobile-logo-scale" />
          </Link>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                  active ? "bg-white/[0.08] text-white" : "text-white/55 hover:bg-white/[0.04] hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                <span className="hidden lg:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <span className="vx-nav-clock hidden text-xs text-white/45 xl:inline">UTC {utcClock || "—"}</span>
          {user ? (
            <>
              <Link href="/profile" className="vx-btn-ghost hidden items-center gap-2 py-2 sm:inline-flex">
                <img src={avatarUrl} alt="" className="h-7 w-7 rounded-full border border-white/10 bg-white/5 object-cover" />
                <span className="max-w-[120px] truncate text-sm">{user.full_name ?? "Member"}</span>
              </Link>
              <button type="button" onClick={clearSession} className="vx-btn-ghost hidden p-2.5 sm:inline-flex" aria-label="Log out">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link href="/login" className="vx-btn-primary text-sm">
              <Crown className="h-4 w-4" />
              <span className="hidden sm:inline">Sign in</span>
            </Link>
          )}
          <Link href="/terminal" className="vx-btn-ghost hidden p-2.5 md:hidden" aria-label="Terminal">
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
