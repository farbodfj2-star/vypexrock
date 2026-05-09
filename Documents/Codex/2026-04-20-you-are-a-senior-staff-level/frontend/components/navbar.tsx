"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, BookOpenText, Bot, ChevronRight, Crown, LayoutGrid, LineChart, LogOut, ScanSearch, ShieldCheck, Star, Users, WalletCards } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { useAuthStore } from "@/lib/store";
import { VypexrockLogo } from "@/components/vypexrock-logo";

const navLinks = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/ai", label: "Vypexrock AI", icon: Bot },
  { href: "/chart-analyzer", label: "Chart Analyzer", icon: ScanSearch },
  { href: "/about-crypto", label: "About Crypto", icon: BookOpenText },
  { href: "/community", label: "Community", icon: Users },
  { href: "/backtest", label: "Backtest", icon: LineChart },
  { href: "/pricing", label: "Pricing", icon: WalletCards },
  { href: "/watchlist", label: "Watchlist", icon: Star },
  { href: "/alerts", label: "Alerts", icon: Bell }
];

export function Navbar() {
  const { user, clearSession } = useAuthStore();
  const fallbackAvatarUrl = user?.email ? `https://api.dicebear.com/7.x/glass/svg?seed=${encodeURIComponent(user.email)}` : null;
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const avatarUrl = profileAvatar ?? fallbackAvatarUrl;
  const [utcClock, setUtcClock] = useState("");

  useEffect(() => {
    const readAvatar = () => setProfileAvatar(window.localStorage.getItem("vypexrock-profile-avatar"));
    readAvatar();
    window.addEventListener("storage", readAvatar);
    return () => window.removeEventListener("storage", readAvatar);
  }, []);

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
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#040711]/76 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-5 lg:px-8 lg:py-4">
        <div className="min-w-0 flex items-center gap-4">
          <Link href="/" className="block min-w-0">
            <VypexrockLogo className="mobile-logo-scale" />
          </Link>

          <div className="hidden items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-100 lg:flex">
            <ShieldCheck className="h-3.5 w-3.5" />
            Members workspace online
          </div>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition hover:border-amber-300/20 hover:bg-amber-400/10 hover:text-white"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <div className="hidden rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/55 xl:block">
            UTC now {utcClock || "--:--:--"}
          </div>
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white transition hover:border-white/20"
              >
                {avatarUrl ? <img src={avatarUrl} alt={user.email} className="h-9 w-9 rounded-full border border-white/10 bg-white/5" /> : null}
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-medium text-white">{user.full_name ?? "Member"}</p>
                  <p className="text-xs text-white/45">{user.email}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-white/45" />
              </Link>
              <button
                className="hidden h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white transition hover:border-white/20 sm:flex"
                onClick={clearSession}
                aria-label="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_14px_40px_rgba(108,92,255,0.32)]"
            >
              <Crown className="h-4 w-4" />
              Access platform
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
